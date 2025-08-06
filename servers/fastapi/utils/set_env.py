import os


def set_temp_directory_env(value):
    os.environ["TEMP_DIRECTORY"] = value


def set_user_config_path_env(value):
    os.environ["USER_CONFIG_PATH"] = value


def set_llm_provider_env(value):
    os.environ["LLM"] = value


def set_ollama_url_env(value):
    os.environ["OLLAMA_URL"] = value


def set_custom_llm_url_env(value):
    os.environ["CUSTOM_URL"] = value


def set_openai_api_key_env(value):
    os.environ["OPENAI_API_KEY"] = value


def set_google_api_key_env(value):
    os.environ["GOOGLE_API_KEY"] = value


def set_custom_llm_api_key_env(value):
    os.environ["CUSTOM_LLM_API_KEY"] = value


def set_ollama_model_env(value):
    os.environ["OLLAMA_MODEL"] = value


def set_custom_model_env(value):
    os.environ["CUSTOM_MODEL"] = value


def set_pexels_api_key_env(value):
    os.environ["PEXELS_API_KEY"] = value

def set_image_provider_env(value):
    os.environ["IMAGE_PROVIDER"] = value


def set_pixabay_api_key_env(value):
    os.environ["PIXABAY_API_KEY"] = value