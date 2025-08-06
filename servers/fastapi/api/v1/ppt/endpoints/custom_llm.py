from typing import Annotated, List, Optional
from fastapi import APIRouter, Body

from utils.custom_llm_provider import list_available_custom_models

CUSTOM_LLM_ROUTER = APIRouter(prefix="/custom_llm", tags=["Custom LLM"])


@CUSTOM_LLM_ROUTER.post("/models/available", response_model=List[str])
async def get_available_models(
    url: Annotated[Optional[str], Body()] = None,
    api_key: Annotated[Optional[str], Body()] = None,
):
    return await list_available_custom_models(url, api_key)
