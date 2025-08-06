import json
from typing import List
from fastapi import APIRouter, BackgroundTasks, HTTPException

from api.v1.ppt.background_tasks import pull_ollama_model_background_task
from constants.supported_ollama_models import SUPPORTED_OLLAMA_MODELS
from models.ollama_model_metadata import OllamaModelMetadata
from models.ollama_model_status import OllamaModelStatus
from services import REDIS_SERVICE
from utils.ollama import list_pulled_ollama_models

OLLAMA_ROUTER = APIRouter(prefix="/ollama", tags=["Ollama"])


@OLLAMA_ROUTER.get("/models/supported", response_model=List[OllamaModelMetadata])
def get_supported_models():
    return SUPPORTED_OLLAMA_MODELS.values()


@OLLAMA_ROUTER.get("/models/available", response_model=List[OllamaModelStatus])
async def get_available_models():
    return await list_pulled_ollama_models()


@OLLAMA_ROUTER.get("/model/pull", response_model=OllamaModelStatus)
async def pull_model(model: str, background_tasks: BackgroundTasks):

    if model not in SUPPORTED_OLLAMA_MODELS:
        raise HTTPException(
            status_code=400,
            detail=f"Model {model} is not supported",
        )

    try:
        pulled_models = await list_pulled_ollama_models()
        filtered_models = [
            pulled_model for pulled_model in pulled_models if pulled_model.name == model
        ]
        if filtered_models:
            return filtered_models[0]
    except HTTPException as e:
        raise e
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to check pulled models: {e}",
        )

    saved_model_status = REDIS_SERVICE.get(f"ollama_models/{model}")

    # If the model is being pulled, return the model
    if saved_model_status:
        saved_model_status_json = json.loads(saved_model_status)
        # If the model is being pulled, return the model
        # ? If the model status is pulled in redis but was not found while listing pulled models,
        # ? it means the model was deleted and we need to pull it again
        if (
            saved_model_status_json["status"] == "error"
            or saved_model_status_json["status"] == "pulled"
        ):
            REDIS_SERVICE.delete(f"ollama_models/{model}")
        else:
            return saved_model_status_json

    # If the model is not being pulled, pull the model
    background_tasks.add_task(pull_ollama_model_background_task, model)

    return OllamaModelStatus(
        name=model,
        status="pulling",
        done=False,
    )
