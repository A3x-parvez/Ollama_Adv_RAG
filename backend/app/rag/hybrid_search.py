from rank_bm25 import BM25Okapi

from app.rag.retriever import retrieve_documents
from app.rag.reranker import rerank_documents

from app.rag.vector_store import metadata_store

from app.core.constants import TOP_K


def bm25_search(query: str, top_k=TOP_K):

    """
    Keyword-based retrieval using BM25
    """

    if not metadata_store:
        return []

    documents = [
        item["text"]
        for item in metadata_store
    ]

    tokenized_docs = [
        doc.lower().split()
        for doc in documents
    ]

    bm25 = BM25Okapi(tokenized_docs)

    tokenized_query = query.lower().split()

    scores = bm25.get_scores(tokenized_query)

    scored_docs = list(
        zip(metadata_store, scores)
    )

    scored_docs.sort(
        key=lambda x: x[1],
        reverse=True
    )

    results = [
        item[0]
        for item in scored_docs[:top_k]
    ]

    return results


def merge_results(dense_results, keyword_results):

    """
    Merge and deduplicate results
    """

    merged = []

    seen = set()

    for result in dense_results + keyword_results:

        text = result["text"]

        if text not in seen:

            seen.add(text)

            merged.append(result)

    return merged


def hybrid_search(query: str):

    """
    Hybrid retrieval:
    - Dense vector search
    - BM25 keyword search
    """

    # Dense semantic retrieval
    dense_results = retrieve_documents(query)

    # BM25 keyword retrieval
    keyword_results = bm25_search(query)

    # Merge results
    merged_results = merge_results(
        dense_results,
        keyword_results
    )

    # Rerank results
    reranked_results = rerank_documents(
        query,
        merged_results
    )

    return reranked_results