from fastapi import APIRouter

from app.services.model_service import (
    get_current_model
)

# import metadata_store at request time to avoid stale bindings

router = APIRouter(
    prefix="/health",
    tags=["Health"]
)


@router.get("/")
async def health():

    from app.rag.vector_store import metadata_store as _metadata

    return {
        "status": "healthy",
        "current_model": get_current_model(),
        "total_chunks": len(_metadata)
    }