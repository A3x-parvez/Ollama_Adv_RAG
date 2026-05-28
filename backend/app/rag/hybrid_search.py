from rank_bm25 import BM25Okapi
from sympy import re

from app.rag.retriever import retrieve_documents
from app.rag.reranker import rerank_documents

from app.rag.vector_store import metadata_store

from app.core.runtime_settings import settings
import re

# Global BM25 cache
bm25_index = None
_bm25_lock = __import__("threading").RLock()


# -----------------------------------
# Build BM25 Index
# -----------------------------------
def build_bm25_index():

    global bm25_index

    with _bm25_lock:

        if not metadata_store:

            bm25_index = None

            return

        documents = [
            item["text"]
            for item in metadata_store
        ]

        tokenized_docs = [
            # doc.lower().split()
            re.findall(r"\w+", doc.lower())
            for doc in documents
        ]

        bm25_index = BM25Okapi(
            tokenized_docs
        )


# -----------------------------------
# BM25 Keyword Search
# -----------------------------------
def bm25_search(query: str, top_k=None):

    """
    Keyword-based retrieval using BM25
    """

    global bm25_index

    if top_k is None:

        top_k = settings["top_k"]

    if not metadata_store:

        return []

    # Lazy build cache with lock
    with _bm25_lock:

        if bm25_index is None:

            build_bm25_index()

        # If still None after build, return empty
        if bm25_index is None:

            return []

        # tokenized_query = query.lower().split()
        tokenized_query = re.findall(
            r"\w+",
            query.lower()
        )

        scores = bm25_index.get_scores(
            tokenized_query
        )

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


# -----------------------------------
# Merge Dense + BM25 Results
# -----------------------------------
def merge_results(
    dense_results,
    keyword_results
):

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


# -----------------------------------
# Hybrid Retrieval Pipeline
# -----------------------------------
def hybrid_search(query: str):

    """
    Hybrid retrieval:
    - Dense semantic retrieval
    - BM25 keyword retrieval
    - AI reranking
    """

    # Dense semantic retrieval
    dense_results = retrieve_documents(
        query
    )

    # BM25 keyword retrieval
    keyword_results = bm25_search(
        query
    )

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