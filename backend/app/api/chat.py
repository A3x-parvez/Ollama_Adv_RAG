from fastapi import APIRouter

from pydantic import BaseModel

from app.rag.pipeline import query_rag

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