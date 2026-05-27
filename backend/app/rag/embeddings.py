import ollama

from app.core.config import EMBED_MODEL


def generate_embedding(text: str):

    response = ollama.embeddings(
        model=EMBED_MODEL,
        prompt=text
    )

    return response["embedding"]