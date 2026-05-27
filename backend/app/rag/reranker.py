from FlagEmbedding import FlagReranker

from app.core.constants import RERANK_TOP_K
from app.core.runtime_settings import settings


# Load reranker model once
reranker_model = FlagReranker(
    "BAAI/bge-reranker-v2-m3",
    use_fp16=False
)


def rerank_documents(query, documents):

    """
    Rerank retrieved documents
    using cross-encoder scoring
    """

    if not documents:
        return []

    pairs = []

    for doc in documents:

        pairs.append(
            [query, doc["text"]]
        )

    # Compute relevance scores
    scores = reranker_model.compute_score(
        pairs
    )

    scored_docs = list(
        zip(documents, scores)
    )

    # Sort by score descending
    scored_docs.sort(
        key=lambda x: x[1],
        reverse=True
    )

    # Keep top reranked docs
    reranked_docs = [
        item[0]
        # for item in scored_docs[:RERANK_TOP_K]
        for item in scored_docs[:settings["rerank_top_k"]]
    ]

    return reranked_docs