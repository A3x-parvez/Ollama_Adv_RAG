from fastapi import APIRouter

from fastapi.responses import StreamingResponse

from pydantic import BaseModel

from app.rag.pipeline import (
    query_rag,
    stream_rag
)

router = APIRouter(
    prefix="/chat",
    tags=["Chat"]
)


class ChatRequest(BaseModel):
    query: str


@router.post("/")
async def chat(request: ChatRequest):

    response = query_rag(
        request.query
    )

    return response


@router.post("/stream")
async def stream_chat(request: ChatRequest):

    generator = stream_rag(
        request.query
    )

    return StreamingResponse(
        generator,
        media_type="text/plain"
    )