import os
from fastapi import HTTPException
from openai import AsyncOpenAI
from google import genai

from enums.llm_provider import LLMProvider
from utils.get_env import (
    get_custom_llm_api_key_env,
    get_custom_llm_url_env,
    get_custom_model_env,
    get_google_api_key_env,
    get_llm_provider_env,
    get_ollama_model_env,
    get_ollama_url_env,
    get_openai_api_key_env,
)



def get_llm_provider():
    try:
        return LLMProvider(get_llm_provider_env())
    except:
        raise HTTPException(
            status_code=500,
            detail=f"Invalid LLM provider. Please select one of: openai, google, ollama, custom",
        )


def get_ollama_url():
    return get_ollama_url_env() or "http://localhost:11434"


def is_openai_selected():
    return get_llm_provider() == LLMProvider.OPENAI


def is_google_selected():
    return get_llm_provider() == LLMProvider.GOOGLE


def is_ollama_selected():
    return get_llm_provider() == LLMProvider.OLLAMA


def is_custom_llm_selected():
    return get_llm_provider() == LLMProvider.CUSTOM


def get_model_base_url():
    selected_llm = get_llm_provider()

    if selected_llm == LLMProvider.OPENAI:
        return "https://api.openai.com/v1"
    elif selected_llm == LLMProvider.GOOGLE:
        return "https://generativelanguage.googleapis.com/v1beta/openai"
    elif selected_llm == LLMProvider.OLLAMA:
        return os.path.join(get_ollama_url(), "v1")
    elif selected_llm == LLMProvider.CUSTOM:
        return get_custom_llm_url_env()
    else:
        raise HTTPException(f"LLM provider {selected_llm} is not supported")


def get_llm_api_key():
    selected_llm = get_llm_provider()
    if selected_llm == LLMProvider.OPENAI:
        return get_openai_api_key_env()
    elif selected_llm == LLMProvider.GOOGLE:
        return get_google_api_key_env()
    elif selected_llm == LLMProvider.OLLAMA:
        return "ollama"
    elif selected_llm == LLMProvider.CUSTOM:
        return get_custom_llm_api_key_env() or "none"
    else:
        raise HTTPException(f"LLM provider {selected_llm} is not supported")


def get_llm_client():
    client = AsyncOpenAI(
            base_url=get_model_base_url(),
            api_key=get_llm_api_key(),
        )
    return client


def get_google_llm_client():
    client = genai.Client(api_key=get_llm_api_key())
    return client


def get_large_model():
    selected_llm = get_llm_provider()
    if selected_llm == LLMProvider.OPENAI:
        return "gpt-4.1"
    elif selected_llm == LLMProvider.GOOGLE:
        return "gemini-2.0-flash"
    elif selected_llm == LLMProvider.OLLAMA:
        return get_ollama_model_env()
    elif selected_llm == LLMProvider.CUSTOM:
        return get_custom_model_env()
    else:
        raise ValueError(f"Invalid LLM model")


def get_small_model():
    selected_llm = get_llm_provider()
    if selected_llm == LLMProvider.OPENAI:
        return "gpt-4.1-mini"
    elif selected_llm == LLMProvider.GOOGLE:
        return "gemini-2.0-flash"
    elif selected_llm == LLMProvider.OLLAMA:
        return get_ollama_model_env()
    elif selected_llm == LLMProvider.CUSTOM:
        return get_custom_model_env()
    else:
        raise ValueError(f"Invalid LLM model")


def get_nano_model():
    selected_llm = get_llm_provider()
    if selected_llm == LLMProvider.OPENAI:
        return "gpt-4.1-nano"
    elif selected_llm == LLMProvider.GOOGLE:
        return "gemini-2.0-flash"
    elif selected_llm == LLMProvider.OLLAMA:
        return get_ollama_model_env()
    elif selected_llm == LLMProvider.CUSTOM:
        return get_custom_model_env()
    else:
        raise ValueError(f"Invalid LLM model")
