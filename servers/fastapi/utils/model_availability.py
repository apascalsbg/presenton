import os
from constants.supported_ollama_models import SUPPORTED_OLLAMA_MODELS
from enums.image_provider import ImageProvider
from enums.llm_provider import LLMProvider
from utils.custom_llm_provider import list_available_custom_models
from utils.get_env import (
    get_can_change_keys_env,
    get_openai_api_key_env,
    get_pixabay_api_key_env,
    get_pexels_api_key_env,
)
from utils.get_env import get_google_api_key_env
from utils.get_env import get_ollama_model_env
from utils.get_env import get_custom_llm_api_key_env
from utils.get_env import get_custom_llm_url_env
from utils.get_env import get_custom_model_env
from utils.llm_provider import (
    get_llm_provider,
    is_custom_llm_selected,
    is_ollama_selected,
)
from utils.ollama import pull_ollama_model
from utils.image_provider import (
    get_selected_image_provider,
    is_pixels_selected,
    is_pixabay_selected,
    is_gemini_flash_selected,
    is_dalle3_selected,
)


async def check_llm_and_image_provider_api_or_model_availability():
    can_change_keys = get_can_change_keys_env() != "false"
    if not can_change_keys:
        if get_llm_provider() == LLMProvider.OPENAI:
            openai_api_key = get_openai_api_key_env()
            if not openai_api_key:
                raise Exception("OPENAI_API_KEY must be provided")

        elif get_llm_provider() == LLMProvider.GOOGLE:
            google_api_key = get_google_api_key_env()
            if not google_api_key:
                raise Exception("GOOGLE_API_KEY must be provided")

        elif is_ollama_selected():
            ollama_model = get_ollama_model_env()
            if not ollama_model:
                raise Exception("OLLAMA_MODEL must be provided")

            if ollama_model not in SUPPORTED_OLLAMA_MODELS:
                raise Exception(f"Model {ollama_model} is not supported")

            print("-" * 50)
            print("Pulling model: ", ollama_model)
            async for event in pull_ollama_model(ollama_model):
                print(event)
            print("Pulled model: ", ollama_model)
            print("-" * 50)

        elif is_custom_llm_selected():
            custom_model = get_custom_model_env()
            custom_llm_url = get_custom_llm_url_env()
            custom_llm_api_key = get_custom_llm_api_key_env()
            if not custom_model:
                raise Exception("CUSTOM_MODEL must be provided")
            if not custom_llm_url:
                raise Exception("CUSTOM_LLM_URL must be provided")
            if not custom_llm_api_key:
                raise Exception("CUSTOM_LLM_API_KEY must be provided")
            print("-" * 50)
            print("Selecting model: ", custom_model)
            models = await list_available_custom_models(
                custom_llm_url, custom_llm_api_key
            )
            print("Available models: ", models)
            print("-" * 50)
            if custom_model not in models:
                raise Exception(f"Model {custom_model} is not available")

        # Check for Image Provider and API keys
        selected_image_provider = get_selected_image_provider()
        if not selected_image_provider:
            raise Exception("IMAGE_PROVIDER must be provided")

        if selected_image_provider == ImageProvider.PEXELS:
            pexels_api_key = get_pexels_api_key_env()
            if not pexels_api_key:
                raise Exception("PEXELS_API_KEY must be provided")

        elif selected_image_provider == ImageProvider.PIXABAY:
            pixabay_api_key = get_pixabay_api_key_env()
            if not pixabay_api_key:
                raise Exception("PIXABAY_API_KEY must be provided")

        elif selected_image_provider == ImageProvider.GEMINI_FLASH:
            google_api_key = get_google_api_key_env()
            if not google_api_key:
                raise Exception("GOOGLE_API_KEY must be provided")

        elif selected_image_provider == ImageProvider.DALLE3:
            openai_api_key = get_openai_api_key_env()
            if not openai_api_key:
                raise Exception("OPENAI_API_KEY must be provided")
