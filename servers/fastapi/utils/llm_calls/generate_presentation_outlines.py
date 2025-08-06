from typing import Optional
from google.genai.types import GenerateContentConfig
from openai.types.chat.chat_completion_chunk import ChoiceDelta

from utils.async_iterator import iterator_to_async
from utils.get_dynamic_models import get_presentation_outline_model_with_n_slides
from utils.llm_provider import (
    get_google_llm_client,
    get_large_model,
    get_llm_client,
    is_google_selected,
)
from pydantic import BaseModel

system_prompt = """
You are an expert presentation creator. Generate structured presentations based on user requirements and format them according to the specified JSON schema with markdown content.

## Core Requirements

### Input Processing
1. **Extract key information** from the user's prompt:
   - Main topic/subject matter
   - Required number of slides
   - Target language for output
   - Specific content requirements or focus areas
   - Target audience (if specified)
   - Presentation style or tone preferences


## Content Generation Guidelines

### Presentation Title
- Create a **concise, descriptive title** that captures the essence of the topic
- Use **plain text format** (no markdown formatting)
- Make it **engaging and professional**
- Ensure it reflects the main theme and target audience

### Slide Titles
- Generate **clear, specific titles** for each slide
- Use **plain text format** (no markdown, no "Slide 1", "Slide 2" prefixes)
- Make each title **descriptive and informative**
- Ensure titles create a **logical flow** through the presentation
- Keep titles **concise but meaningful**


## Special Considerations

### Slide Count Compliance
- Generate **exactly** the number of slides requested
- Distribute content **evenly** across slides
- Create **balanced information flow**
"""


def get_user_prompt(prompt: str, n_slides: int, language: str, content: str):
    return f"""
        **Input:**
        - Prompt: {prompt}
        - Output Language: {language}
        - Number of Slides: {n_slides}
        - Additional Information: {content}
    """


def get_prompt_template(prompt: str, n_slides: int, language: str, content: str):
    return [
        {
            "role": "system",
            "content": system_prompt,
        },
        {
            "role": "user",
            "content": get_user_prompt(prompt, n_slides, language, content),
        },
    ]


def get_response_format(response_model: BaseModel):
    return {
        "type": "json_schema",
        "json_schema": {
            "name": "PresentationOutlineModel",
            "schema": response_model.model_json_schema(),
        },
    }


async def generate_ppt_outline(
    prompt: Optional[str],
    n_slides: int,
    language: Optional[str] = None,
    content: Optional[str] = None,
):
    model = get_large_model()
    response_model = get_presentation_outline_model_with_n_slides(n_slides)

    if not is_google_selected():
        client = get_llm_client()
        async for response in await client.chat.completions.create(
            model=model,
            messages=get_prompt_template(prompt, n_slides, language, content),
            stream=True,
            response_format=get_response_format(response_model),
        ):
            delta: ChoiceDelta = response.choices[0].delta
            if delta.content:
                yield delta.content

    else:
        client = get_google_llm_client()
        generate_stream = iterator_to_async(client.models.generate_content_stream)
        async for event in generate_stream(
            model=model,
            contents=[get_user_prompt(prompt, n_slides, language, content)],
            config=GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                response_json_schema=response_model.model_json_schema(),
            ),
        ):
            if event.text:
                yield event.text
