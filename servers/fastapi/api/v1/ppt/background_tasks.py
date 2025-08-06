import json

from fastapi import HTTPException

from models.ollama_model_status import OllamaModelStatus
from services import REDIS_SERVICE
from utils.ollama import pull_ollama_model


async def pull_ollama_model_background_task(model: str):
    saved_model_status = OllamaModelStatus(
        name=model,
        status="pulling",
        done=False,
    )
    log_event_count = 0

    try:
        async for event in pull_ollama_model(model):
            log_event_count += 1
            if log_event_count != 1 and log_event_count % 20 != 0:
                continue

            if "completed" in event:
                saved_model_status.downloaded = event["completed"]

            if not saved_model_status.size and "total" in event:
                saved_model_status.size = event["total"]

            if "status" in event:
                saved_model_status.status = event["status"]

            REDIS_SERVICE.set(
                f"ollama_models/{model}",
                json.dumps(saved_model_status.model_dump(mode="json")),
            )

    except Exception as e:
        saved_model_status.status = "error"
        saved_model_status.done = True
        REDIS_SERVICE.set(
            f"ollama_models/{model}",
            json.dumps(saved_model_status.model_dump(mode="json")),
        )
        raise HTTPException(
            status_code=500,
            detail=f"Failed to pull model: {e}",
        )

    saved_model_status.done = True
    saved_model_status.status = "pulled"
    saved_model_status.downloaded = saved_model_status.size

    REDIS_SERVICE.set(
        f"ollama_models/{model}",
        json.dumps(saved_model_status.model_dump(mode="json")),
    )

    return saved_model_status
