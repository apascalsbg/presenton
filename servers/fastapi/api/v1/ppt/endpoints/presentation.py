import asyncio
import json
import os
import random
from typing import Annotated, List, Literal, Optional
from fastapi import APIRouter, Body, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy import String, cast, delete, text
from sqlalchemy.ext.asyncio import AsyncSession
from sqlmodel import select
from constants.documents import UPLOAD_ACCEPTED_FILE_TYPES
from models.presentation_and_path import PresentationPathAndEditPath
from models.presentation_from_template import GetPresentationUsingTemplateRequest
from models.presentation_outline_model import (
    PresentationOutlineModel,
    SlideOutlineModel,
)
from models.pptx_models import PptxPresentationModel
from models.presentation_layout import PresentationLayoutModel
from models.presentation_structure_model import PresentationStructureModel
from models.presentation_with_slides import PresentationWithSlides
from services.get_layout_by_name import get_layout_by_name
from services.icon_finder_service import IconFinderService
from services.image_generation_service import ImageGenerationService
from utils.dict_utils import deep_update
from utils.export_utils import export_presentation
from utils.llm_calls.generate_presentation_outlines import generate_ppt_outline
from models.sql.slide import SlideModel
from models.sse_response import SSECompleteResponse, SSEResponse
from services import TEMP_FILE_SERVICE
from services.database import get_async_session
from services.documents_loader import DocumentsLoader
from models.sql.presentation import PresentationModel
from services.pptx_presentation_creator import PptxPresentationCreator
from utils.asset_directory_utils import get_exports_directory, get_images_directory
from utils.llm_calls.generate_document_summary import generate_document_summary
from utils.llm_calls.generate_presentation_structure import (
    generate_presentation_structure,
)
from utils.llm_calls.generate_slide_content import (
    get_slide_content_from_type_and_outline,
)
from utils.process_slides import process_slide_and_fetch_assets
from utils.randomizers import get_random_uuid
from utils.validators import validate_files

PRESENTATION_ROUTER = APIRouter(prefix="/presentation", tags=["Presentation"])


@PRESENTATION_ROUTER.get("", response_model=PresentationWithSlides)
async def get_presentation(
    id: str, sql_session: AsyncSession = Depends(get_async_session)
):
    presentation = await sql_session.get(PresentationModel, id)
    if not presentation:
        raise HTTPException(404, "Presentation not found")
    slides = await sql_session.scalars(
        select(SlideModel)
        .where(SlideModel.presentation == id)
        .order_by(SlideModel.index)
    )
    return PresentationWithSlides(
        **presentation.model_dump(),
        slides=slides,
    )


@PRESENTATION_ROUTER.delete("", status_code=204)
async def delete_presentation(
    id: str, sql_session: AsyncSession = Depends(get_async_session)
):
    presentation = await sql_session.get(PresentationModel, id)
    if not presentation:
        raise HTTPException(404, "Presentation not found")

    await sql_session.execute(delete(SlideModel).where(SlideModel.presentation == id))
    await sql_session.delete(presentation)
    await sql_session.commit()


@PRESENTATION_ROUTER.get("/all", response_model=List[PresentationWithSlides])
async def get_all_presentations(sql_session: AsyncSession = Depends(get_async_session)):
    presentations_with_slides = []
    presentations = await sql_session.scalars(
        select(PresentationModel).where(
            cast(PresentationModel.layout, String) != "null"
        )
    )

    async def inner(presentation: PresentationModel, sql_session: AsyncSession):
        slides = await sql_session.scalars(
            select(SlideModel)
            .where(SlideModel.presentation == presentation.id)
            .where(SlideModel.index == 0)
        )
        if not slides:
            return None
        return PresentationWithSlides(
            **presentation.model_dump(),
            slides=slides,
        )

    tasks = [inner(p, sql_session) for p in presentations]
    results = await asyncio.gather(*tasks)
    presentations_with_slides = [r for r in results if r is not None]
    return presentations_with_slides


@PRESENTATION_ROUTER.post("/create", response_model=PresentationModel)
async def create_presentation(
    prompt: Annotated[str, Body()],
    n_slides: Annotated[int, Body()],
    language: Annotated[str, Body()],
    file_paths: Annotated[Optional[List[str]], Body()] = None,
    sql_session: AsyncSession = Depends(get_async_session),
):
    presentation_id = get_random_uuid()

    summary = None
    if file_paths:
        temp_dir = TEMP_FILE_SERVICE.create_temp_dir(presentation_id)
        documents_loader = DocumentsLoader(file_paths=file_paths)
        await documents_loader.load_documents(temp_dir)

        summary = await generate_document_summary(documents_loader.documents)

    presentation = PresentationModel(
        id=presentation_id,
        prompt=prompt,
        n_slides=n_slides,
        language=language,
        summary=summary,
    )

    sql_session.add(presentation)
    await sql_session.commit()

    return presentation


@PRESENTATION_ROUTER.post("/prepare", response_model=PresentationModel)
async def prepare_presentation(
    presentation_id: Annotated[str, Body()],
    outlines: Annotated[List[SlideOutlineModel], Body()],
    layout: Annotated[PresentationLayoutModel, Body()],
    title: Annotated[Optional[str], Body()] = None,
    sql_session: AsyncSession = Depends(get_async_session),
):
    if not outlines:
        raise HTTPException(status_code=400, detail="Outlines are required")

    presentation = await sql_session.get(PresentationModel, presentation_id)
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")

    total_slide_layouts = len(layout.slides)
    total_outlines = len(outlines)

    if layout.ordered:
        presentation_structure = layout.to_presentation_structure()
    else:
        presentation_structure: PresentationStructureModel = (
            await generate_presentation_structure(
                presentation_outline=presentation.get_presentation_outline(),
                presentation_layout=layout,
            )
        )

    presentation_structure.slides = presentation_structure.slides[: len(outlines)]
    for index in range(total_outlines):
        random_slide_index = random.randint(0, total_slide_layouts - 1)
        if index >= total_outlines:
            presentation_structure.slides.append(random_slide_index)
            continue
        if presentation_structure.slides[index] >= total_slide_layouts:
            presentation_structure.slides[index] = random_slide_index

    sql_session.add(presentation)
    presentation.outlines = [each.model_dump() for each in outlines]
    presentation.title = title or presentation.title
    presentation.set_layout(layout)
    presentation.set_structure(presentation_structure)
    await sql_session.commit()

    return presentation


@PRESENTATION_ROUTER.get("/stream", response_model=PresentationWithSlides)
async def stream_presentation(
    presentation_id: str, sql_session: AsyncSession = Depends(get_async_session)
):
    presentation = await sql_session.get(PresentationModel, presentation_id)
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")
    if not presentation.structure:
        raise HTTPException(
            status_code=400,
            detail="Presentation not prepared for stream",
        )
    if not presentation.outlines:
        raise HTTPException(
            status_code=400,
            detail="Outlines can not be empty",
        )

    image_generation_service = ImageGenerationService(get_images_directory())
    icon_finder_service = IconFinderService()

    async def inner():
        structure = presentation.get_structure()
        layout = presentation.get_layout()
        outline = presentation.get_presentation_outline()

        # These tasks will be gathered and awaited after all slides are generated
        async_assets_generation_tasks = []

        slides: List[SlideModel] = []
        yield SSEResponse(
            event="response",
            data=json.dumps({"type": "chunk", "chunk": '{ "slides": [ '}),
        ).to_string()
        for i, slide_layout_index in enumerate(structure.slides):
            slide_layout = layout.slides[slide_layout_index]
            slide_content = await get_slide_content_from_type_and_outline(
                slide_layout, outline.slides[i]
            )
            slide = SlideModel(
                presentation=presentation_id,
                layout_group=layout.name,
                layout=slide_layout.id,
                index=i,
                content=slide_content,
            )
            slides.append(slide)

            # This will mutate slide
            async_assets_generation_tasks.append(
                process_slide_and_fetch_assets(
                    image_generation_service, icon_finder_service, slide
                )
            )

            # Give control to the event loop
            await asyncio.sleep(0)

            yield SSEResponse(
                event="response",
                data=json.dumps({"type": "chunk", "chunk": slide.model_dump_json()}),
            ).to_string()

        yield SSEResponse(
            event="response",
            data=json.dumps({"type": "chunk", "chunk": " ] }"}),
        ).to_string()

        generated_assets_lists = await asyncio.gather(*async_assets_generation_tasks)
        generated_assets = []
        for assets_list in generated_assets_lists:
            generated_assets.extend(assets_list)

        sql_session.add(presentation)
        sql_session.add_all(slides)
        sql_session.add_all(generated_assets)
        await sql_session.commit()

        response = PresentationWithSlides(
            **presentation.model_dump(),
            slides=slides,
        )

        yield SSECompleteResponse(
            key="presentation",
            value=response.model_dump(mode="json"),
        ).to_string()

    return StreamingResponse(inner(), media_type="text/event-stream")


@PRESENTATION_ROUTER.put("/update", response_model=PresentationWithSlides)
async def update_presentation(
    presentation_with_slides: Annotated[PresentationWithSlides, Body()],
    sql_session: AsyncSession = Depends(get_async_session),
):
    updated_presentation = presentation_with_slides.to_presentation_model()
    updated_slides = presentation_with_slides.slides
    presentation = await sql_session.get(PresentationModel, updated_presentation.id)
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")
    presentation.sqlmodel_update(updated_presentation)

    await sql_session.execute(
        delete(SlideModel).where(SlideModel.presentation == updated_presentation.id)
    )
    sql_session.add_all(updated_slides)
    await sql_session.commit()

    return PresentationWithSlides(
        **presentation.model_dump(),
        slides=updated_slides,
    )


@PRESENTATION_ROUTER.post("/export/pptx", response_model=str)
async def create_pptx(
    pptx_model: Annotated[PptxPresentationModel, Body()],
):
    temp_dir = TEMP_FILE_SERVICE.create_temp_dir()

    pptx_creator = PptxPresentationCreator(pptx_model, temp_dir)
    await pptx_creator.create_ppt()

    export_directory = get_exports_directory()
    pptx_path = os.path.join(
        export_directory, f"{pptx_model.name or get_random_uuid()}.pptx"
    )
    pptx_creator.save(pptx_path)

    return pptx_path


@PRESENTATION_ROUTER.post("/generate", response_model=PresentationPathAndEditPath)
async def generate_presentation_api(
    prompt: Annotated[str, Body()],
    n_slides: Annotated[int, Body()] = 8,
    language: Annotated[str, Body()] = "English",
    layout: Annotated[str, Body()] = "general",
    files: Annotated[Optional[List[UploadFile]], File()] = None,
    export_as: Annotated[Literal["pptx", "pdf"], Body()] = "pptx",
    sql_session: AsyncSession = Depends(get_async_session),
):
    validate_files(files, True, True, 50, UPLOAD_ACCEPTED_FILE_TYPES)

    presentation_id = get_random_uuid()

    # 1. Save uploaded files
    file_paths = []
    if files:
        temp_dir = TEMP_FILE_SERVICE.create_temp_dir()
        for upload in files:
            file_path = os.path.join(temp_dir, upload.filename)
            with open(file_path, "wb") as f:
                f.write(await upload.read())
            file_paths.append(file_path)

    # 2. Create Presentation Summary (if documents are provided)
    summary = None
    if file_paths:
        temp_dir = TEMP_FILE_SERVICE.create_temp_dir(presentation_id)
        documents_loader = DocumentsLoader(file_paths=file_paths)
        await documents_loader.load_documents(temp_dir)
        summary = await generate_document_summary(documents_loader.documents)

    # 3. Generate Outlines
    presentation_content_text = ""
    async for chunk in generate_ppt_outline(
        prompt,
        n_slides,
        language,
        summary,
    ):
        presentation_content_text += chunk

    presentation_content_json = json.loads(presentation_content_text)
    presentation_content = PresentationOutlineModel(**presentation_content_json)
    outlines = presentation_content.slides[:n_slides]
    total_outlines = len(outlines)

    print("-" * 40)
    print(f"Generated {total_outlines} outlines for the presentation")

    # 4. Parse Layouts
    layout_model = await get_layout_by_name(layout)
    total_slide_layouts = len(layout_model.slides)

    # 5. Generate Structure
    if layout_model.ordered:
        presentation_structure = layout_model.to_presentation_structure()
    else:
        presentation_structure: PresentationStructureModel = (
            await generate_presentation_structure(
                presentation_outline=PresentationOutlineModel(
                    title=presentation_content.title,
                    slides=outlines,
                    notes=presentation_content.notes,
                ),
                presentation_layout=layout_model,
            )
        )

    presentation_structure.slides = presentation_structure.slides[:total_outlines]
    for index in range(total_outlines):
        random_slide_index = random.randint(0, total_slide_layouts - 1)
        if index >= total_outlines:
            presentation_structure.slides.append(random_slide_index)
            continue
        if presentation_structure.slides[index] >= total_slide_layouts:
            presentation_structure.slides[index] = random_slide_index

    # 6. Create PresentationModel
    presentation = PresentationModel(
        id=presentation_id,
        prompt=prompt,
        n_slides=n_slides,
        language=language,
        title=presentation_content.title,
        summary=summary,
        outlines=[each.model_dump() for each in outlines],
        notes=presentation_content.notes,
        layout=layout_model.model_dump(),
        structure=presentation_structure.model_dump(),
    )

    image_generation_service = ImageGenerationService(get_images_directory())
    icon_finder_service = IconFinderService()
    async_asset_generation_tasks = []

    # 7. Generate slide content and save slides
    slides: List[SlideModel] = []
    slide_contents: List[dict] = []
    for i, slide_layout_index in enumerate(presentation_structure.slides):
        slide_layout = layout_model.slides[slide_layout_index]
        print(f"Generating content for slide {i} with layout {slide_layout.id}")
        slide_content = await get_slide_content_from_type_and_outline(
            slide_layout, outlines[i]
        )
        slide = SlideModel(
            presentation=presentation_id,
            layout_group=layout_model.name,
            layout=slide_layout.id,
            index=i,
            content=slide_content,
        )
        async_asset_generation_tasks.append(
            process_slide_and_fetch_assets(
                image_generation_service, icon_finder_service, slide
            )
        )
        slides.append(slide)
        slide_contents.append(slide_content)

    generated_assets_lists = await asyncio.gather(*async_asset_generation_tasks)
    generated_assets = []
    for assets_list in generated_assets_lists:
        generated_assets.extend(assets_list)

    # 8. Save PresentationModel and Slides
    sql_session.add(presentation)
    sql_session.add_all(slides)
    sql_session.add_all(generated_assets)
    await sql_session.commit()

    # 9. Export
    presentation_and_path = await export_presentation(
        presentation_id, presentation_content.title, export_as
    )

    return PresentationPathAndEditPath(
        **presentation_and_path.model_dump(),
        edit_path=f"/presentation?id={presentation_id}",
    )


@PRESENTATION_ROUTER.post("/from-template", response_model=PresentationPathAndEditPath)
async def from_template(
    data: Annotated[GetPresentationUsingTemplateRequest, Body()],
    sql_session: AsyncSession = Depends(get_async_session),
):
    presentation = await sql_session.get(PresentationModel, data.presentation_id)
    if not presentation:
        raise HTTPException(status_code=404, detail="Presentation not found")
    slides = await sql_session.scalars(
        select(SlideModel).where(SlideModel.presentation == data.presentation_id)
    )

    new_presentation = presentation.get_new_presentation()
    new_slides = []
    for each_slide in slides:
        updated_content = None
        new_slide_data = list(filter(lambda x: x.index == each_slide.index, data.data))
        if new_slide_data:
            updated_content = deep_update(each_slide.content, new_slide_data[0].content)
            print(f"Updated content for slide {each_slide.index}: {updated_content}")
        new_slides.append(
            each_slide.get_new_slide(new_presentation.id, updated_content)
        )

    sql_session.add(new_presentation)
    sql_session.add_all(new_slides)
    await sql_session.commit()

    presentation_and_path = await export_presentation(
        new_presentation.id, new_presentation.title, data.export_as
    )

    return PresentationPathAndEditPath(
        **presentation_and_path.model_dump(),
        edit_path=f"/presentation?id={new_presentation.id}",
    )
