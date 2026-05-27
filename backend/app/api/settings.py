from fastapi import APIRouter
from pydantic import BaseModel

from app.core.runtime_settings import settings

router = APIRouter(
    prefix="/settings",
    tags=["Settings"]
)


class SettingsRequest(BaseModel):

    temperature: float
    top_k: int
    rerank_top_k: int
    max_tokens: int


@router.get("/")
async def get_settings():

    return settings


@router.post("/")
async def update_settings(
    request: SettingsRequest
):

    settings["temperature"] = request.temperature
    settings["top_k"] = request.top_k
    settings["rerank_top_k"] = request.rerank_top_k
    settings["max_tokens"] = request.max_tokens

    return {
        "message": "Settings updated",
        "settings": settings
    }