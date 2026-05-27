from fastapi import APIRouter, UploadFile, File
import os
import aiofiles

from app.core.config import UPLOAD_DIR

from app.services.pdf_service import extract_pdf_text

from app.rag.chunking import create_chunks
from app.rag.embeddings import generate_embedding
from app.rag.vector_store import add_to_vectorstore

from app.rag.hybrid_search import (
    build_bm25_index
)

router = APIRouter(
    prefix="/upload",
    tags=["Upload"]
)


@router.post("/")
async def upload_pdf(file: UploadFile = File(...)):

    file_path = os.path.join(
        UPLOAD_DIR,
        file.filename
    )

    async with aiofiles.open(file_path, "wb") as f:

        content = await file.read()

        await f.write(content)

    pages = extract_pdf_text(file_path)

    chunks = create_chunks(
        pages,
        file.filename
    )

    for chunk in chunks:

        embedding = generate_embedding(
            chunk["text"]
        )

        add_to_vectorstore(
            embedding,
            {
                "text": chunk["text"],
                "embedding": embedding,
                "metadata": chunk["metadata"]
            }
        )

    # Rebuild BM25 cache AFTER upload completes
    build_bm25_index()

    return {
        "message": "PDF processed successfully",
        "chunks": len(chunks)
    }