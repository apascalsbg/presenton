from models.presentation_layout import PresentationLayoutModel, SlideLayoutModel
from models.slide_layout_index import SlideLayoutIndex
from models.sql.slide import SlideModel
from utils.llm_provider import get_large_model, get_llm_client


def get_prompt_to_select_slide_layout(
    prompt: str,
    slide_data: dict,
    layout: PresentationLayoutModel,
    current_slide_layout: int,
):
    return [
        {
            "role": "system",
            "content": f"""
                Select a Slide Layout index based on provided user prompt and current slide data.
                {layout.to_string()}

                # Notes
                - Do not select different slide layout than current unless absolutely necessary as per user prompt. 
                - If user prompt is not clear, select the layout that is most relevant to the slide data.
                - If user prompt is not clear, select the layout that is most relevant to the slide data.
                **Go through all notes and steps and make sure they are followed, including mentioned constraints**
            """,
        },
        {
            "role": "user",
            "content": f"""
                - User Prompt: {prompt}
                - Current Slide Data: {slide_data}
                - Current Slide Layout: {current_slide_layout}
            """,
        },
    ]


async def get_slide_layout_from_prompt(
    prompt: str,
    layout: PresentationLayoutModel,
    slide: SlideModel,
) -> SlideLayoutModel:

    client = get_llm_client()
    model = get_large_model()

    slide_layout_ids = list(map(lambda x: x.id, layout.slides))

    response = await client.beta.chat.completions.parse(
        model=model,
        temperature=0.2,
        messages=get_prompt_to_select_slide_layout(
            prompt,
            slide.content,
            layout,
            slide_layout_ids.index(slide.layout),
        ),
        response_format=SlideLayoutIndex,
    )
    index = response.choices[0].message.parsed.index
    return layout.slides[index]
