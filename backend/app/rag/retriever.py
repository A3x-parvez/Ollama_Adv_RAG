from app.rag.embeddings import generate_embedding
from app.rag.vector_store import search_vectorstore

from app.core.constants import TOP_K


def retrieve_documents(query: str):

    query_embedding = generate_embedding(query)

    results = search_vectorstore(
        query_embedding,
        top_k=TOP_K
    )

    return results