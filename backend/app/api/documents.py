from fastapi import APIRouter
import os

from app.rag.vector_store import (
    rebuild_vectorstore
)

from app.core.config import UPLOAD_DIR

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)


@router.get("/")
async def list_documents():

    from app.rag.vector_store import metadata_store as _metadata

    documents = set()

    for item in _metadata:

        source = item["metadata"]["source"]

        documents.add(source)

    return {
        "documents": list(documents)
    }


@router.delete("/{filename}")
async def delete_document(filename: str):
    # Remove related chunks
    from app.rag.vector_store import metadata_store as _metadata

    filtered_metadata = [
        item
        for item in _metadata
        if item["metadata"]["source"] != filename
    ]

    # Rebuild FAISS index
    rebuild_vectorstore(filtered_metadata)

    # Delete uploaded PDF
    file_path = os.path.join(UPLOAD_DIR, filename)

    if os.path.exists(file_path):

        os.remove(file_path)

    # Return updated docs and stats for immediate frontend refresh
    documents = set()

    for item in _metadata:

        documents.add(item["metadata"]["source"]) 

    stats = {}

    for item in _metadata:

        source = item["metadata"]["source"]

        stats[source] = stats.get(source, 0) + 1

    return {
        "message": f"{filename} deleted successfully",
        "documents": list(documents),
        "stats": stats
    }


@router.get("/stats")
async def document_stats():
    from app.rag.vector_store import metadata_store as _metadata

    stats = {}

    for item in _metadata:

        source = item["metadata"]["source"]

        if source not in stats:

            stats[source] = 0

        stats[source] += 1

    return stats


@router.delete("/")
async def clear_documents():

    from app.rag.vector_store import metadata_store as _metadata

    _metadata.clear()

    rebuild_vectorstore([])

    # Delete uploaded PDFs
    for file_name in os.listdir(UPLOAD_DIR):

        file_path = os.path.join(UPLOAD_DIR, file_name)

        if os.path.isfile(file_path):

            os.remove(file_path)

    return {
        "message": "Knowledge base cleared",
        "documents": [],
        "stats": {}
    }