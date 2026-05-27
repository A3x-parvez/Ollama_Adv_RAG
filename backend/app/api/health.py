from fastapi import APIRouter

from app.services.model_service import (
    get_current_model
)

from app.rag.vector_store import (
    metadata_store
)

router = APIRouter(
    prefix="/health",
    tags=["Health"]
)


@router.get("/")
async def health():

    return {
        "status": "healthy",
        "current_model": get_current_model(),
        "total_chunks": len(metadata_store)
    }