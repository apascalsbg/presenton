from typing import Optional
from pydantic import BaseModel


class UserConfig(BaseModel):
    LLM: Optional[str] = None
    OPENAI_API_KEY: Optional[str] = None
    GOOGLE_API_KEY: Optional[str] = None
    OLLAMA_URL: Optional[str] = None
    OLLAMA_MODEL: Optional[str] = None
    CUSTOM_LLM_URL: Optional[str] = None
    CUSTOM_LLM_API_KEY: Optional[str] = None
    CUSTOM_MODEL: Optional[str] = None
    PEXELS_API_KEY: Optional[str] = None
    IMAGE_PROVIDER: Optional[str] = None
    PIXABAY_API_KEY: Optional[str] = None
