from fastapi import APIRouter
import os

from app.rag.vector_store import (
    metadata_store,
    rebuild_vectorstore
)

from app.core.config import UPLOAD_DIR

router = APIRouter(
    prefix="/documents",
    tags=["Documents"]
)


@router.get("/")
async def list_documents():

    documents = set()

    for item in metadata_store:

        source = item["metadata"]["source"]

        documents.add(source)

    return {
        "documents": list(documents)
    }


@router.delete("/{filename}")
async def delete_document(filename: str):

    global metadata_store

    # Remove related chunks
    filtered_metadata = [
        item
        for item in metadata_store
        if item["metadata"]["source"] != filename
    ]

    # Rebuild FAISS index
    rebuild_vectorstore(filtered_metadata)

    # Delete uploaded PDF
    file_path = os.path.join(
        UPLOAD_DIR,
        filename
    )

    if os.path.exists(file_path):

        os.remove(file_path)

    return {
        "message": f"{filename} deleted successfully"
    }


@router.get("/stats")
async def document_stats():

    stats = {}

    for item in metadata_store:

        source = item["metadata"]["source"]

        if source not in stats:

            stats[source] = 0

        stats[source] += 1

    return stats


@router.delete("/")
async def clear_documents():

    global metadata_store

    metadata_store.clear()

    rebuild_vectorstore([])

    # Delete uploaded PDFs
    for file_name in os.listdir(UPLOAD_DIR):

        file_path = os.path.join(
            UPLOAD_DIR,
            file_name
        )

        if os.path.isfile(file_path):

            os.remove(file_path)

    return {
        "message": "Knowledge base cleared"
    }