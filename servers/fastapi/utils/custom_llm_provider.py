from typing import Optional
from openai import AsyncOpenAI

from utils.llm_provider import get_llm_client


async def list_available_custom_models(
    url: Optional[str] = None, api_key: Optional[str] = None
) -> list[str]:
    if not url:
        client = get_llm_client()
    else:
        client = AsyncOpenAI(api_key=api_key or "null", base_url=url)
    models = []
    async for model in client.models.list():
        print(model)
        models.append(model.id)
    return models
