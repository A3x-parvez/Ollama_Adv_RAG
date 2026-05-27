from fastapi import APIRouter

from pydantic import BaseModel

from app.services.model_service import (
    get_available_models,
    get_current_model,
    set_current_model
)

router = APIRouter(
    prefix="/models",
    tags=["Models"]
)


class ModelRequest(BaseModel):
    model_name: str


@router.get("/")
async def available_models():

    return {
        "models": get_available_models()
    }


@router.get("/current")
async def current_model():

    return {
        "current_model": get_current_model()
    }


@router.post("/select")
async def select_model(request: ModelRequest):

    selected = set_current_model(
        request.model_name
    )

    return {
        "selected_model": selected
    }