import asyncio
import json
from google.genai.types import GenerateContentConfig
from models.presentation_layout import SlideLayoutModel
from models.presentation_outline_model import SlideOutlineModel
from utils.llm_provider import (
    get_google_llm_client,
    get_large_model,
    get_llm_client,
    is_google_selected,
)
from utils.schema_utils import remove_fields_from_schema

system_prompt = """
    Generate structured slide based on provided title and outline, follow mentioned steps and notes and provide structured output.

    # Steps
    1. Analyze the outline and title.
    2. Generate structured slide based on the outline and title.

    # Notes
    - Slide body should not use words like "This slide", "This presentation".
    - Rephrase the slide body to make it flow naturally.
    - Provide prompt to generate image on "__image_prompt__" property.
    - Provide query to search icon on "__icon_query__" property.
    - Do not use markdown formatting in slide body.
    - **Strictly follow the max and min character limit for every property in the slide.**
"""


def get_user_prompt(title: str, outline: str):
    return f"""
        ## Slide Title
        {title}

        ## Slide Outline
        {outline}
    """


def get_prompt_to_generate_slide_content(title: str, outline: str):

    return [
        {
            "role": "system",
            "content": system_prompt,
        },
        {
            "role": "user",
            "content": get_user_prompt(title, outline),
        },
    ]


async def get_slide_content_from_type_and_outline(
    slide_layout: SlideLayoutModel, outline: SlideOutlineModel
):
    model = get_large_model()

    response_schema = remove_fields_from_schema(
        slide_layout.json_schema, ["__image_url__", "__icon_url__"]
    )

    if not is_google_selected():
        client = get_llm_client()
        response = await client.beta.chat.completions.parse(
            model=model,
            messages=get_prompt_to_generate_slide_content(
                outline.title,
                outline.body,
            ),
            response_format={
                "type": "json_schema",
                "json_schema": {
                    "name": "SlideContent",
                    "schema": response_schema,
                },
            },
        )
        return json.loads(response.choices[0].message.content)
    else:
        client = get_google_llm_client()
        response = await asyncio.to_thread(
            client.models.generate_content,
            model=model,
            contents=[get_user_prompt(outline.title, outline.body)],
            config=GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                response_json_schema=response_schema,
            ),
        )
        return json.loads(response.text)
