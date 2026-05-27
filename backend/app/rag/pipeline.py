import time
import json

from app.rag.hybrid_search import hybrid_search

# from app.services.ollama_service import generate_response
from app.services.ollama_service import (
    generate_response,
    stream_response
)

from app.services.model_service import (
    get_current_model
)


def build_context(results):

    context_parts = []

    citations = []

    seen_citations = set()

    for result in results:

        text = result.get("text", "").strip()

        metadata = result.get("metadata", {})

        if text:

            formatted_chunk = f"""
SOURCE: {metadata.get("source")}
PAGE: {metadata.get("page")}

CONTENT:
{text}
"""

            context_parts.append(formatted_chunk)

            citation_key = (
                metadata.get("source"),
                metadata.get("page")
            )

            if citation_key not in seen_citations:

                seen_citations.add(citation_key)

                citations.append({
                    "source": metadata.get("source"),
                    "page": metadata.get("page")
                })

    context = "\n\n".join(context_parts)

    return context, citations


def query_rag(query: str):
    start_time = time.time()

    summary_keywords = [
        "summary",
        "summarize",
        "overview",
        "describe document"
    ]

    is_summary_query = any(
        word in query.lower()
        for word in summary_keywords
    )

    if is_summary_query:

        from app.rag.vector_store import metadata_store

        retrieved_docs = metadata_store

    else:

        retrieved_docs = hybrid_search(query)

    context, citations = build_context(
        retrieved_docs
    )

    prompt = f"""
You are a highly accurate offline RAG assistant.

You MUST answer ONLY from the provided context.

RULES:
- Never hallucinate
- Never invent information
- If the answer is not present, say:
  "I could not find relevant information."
- Be concise but informative
- Use the context carefully

================ CONTEXT ================

{context}

=========================================

USER QUESTION:
{query}

ANSWER:
"""

    answer = generate_response(prompt)

    end_time = time.time()

    response_time = round(
        end_time - start_time,
        2
    )

    return {
        "model": get_current_model(),
        "answer": answer,
        "citations": citations,
        "response_time": f"{response_time} sec"
    }


def stream_rag(query: str):

    start_time = time.time()

    summary_keywords = [
        "summary",
        "summarize",
        "overview",
        "describe document"
    ]

    is_summary_query = any(
        word in query.lower()
        for word in summary_keywords
    )

    if is_summary_query:

        from app.rag.vector_store import metadata_store

        retrieved_docs = metadata_store

    else:

        retrieved_docs = hybrid_search(query)

    context, citations = build_context(
        retrieved_docs
    )

    prompt = f"""
You are a highly accurate offline RAG assistant.

You MUST answer ONLY from the provided context.

RULES:
- Never hallucinate
- Never invent information
- If the answer is not present, say:
  "I could not find relevant information."
- Be concise but informative
- Use the context carefully

================ CONTEXT ================

{context}

=========================================

USER QUESTION:
{query}

ANSWER:
"""

    full_answer = ""

    for token in stream_response(prompt):

        full_answer += token

        yield json.dumps({
            "type": "token",
            "content": token
        }) + "\n"

    end_time = time.time()

    response_time = round(
        end_time - start_time,
        2
    )

    yield json.dumps({
        "type": "done",
        "model": get_current_model(),
        "response_time": f"{response_time} sec",
        "citations": citations
    }) + "\n"