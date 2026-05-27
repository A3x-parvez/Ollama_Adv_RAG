import faiss
import pickle
import numpy as np
import os

from app.core.config import (
    VECTOR_PATH,
    METADATA_PATH
)

metadata_store = []

index = None


# -----------------------------
# Load Existing Vector DB
# -----------------------------
if os.path.exists(METADATA_PATH):

    with open(METADATA_PATH, "rb") as f:

        metadata_store = pickle.load(f)


if os.path.exists(VECTOR_PATH):

    index = faiss.read_index(VECTOR_PATH)


# -----------------------------
# Initialize FAISS Index
# -----------------------------
def initialize_index(vector_dim):

    global index

    if index is None:

        index = faiss.IndexFlatL2(vector_dim)


# -----------------------------
# Save Vector DB
# -----------------------------
def save_vectorstore():

    global index

    if index is not None:

        faiss.write_index(index, VECTOR_PATH)

    with open(METADATA_PATH, "wb") as f:

        pickle.dump(metadata_store, f)


# -----------------------------
# Add Embedding
# -----------------------------
def add_to_vectorstore(embedding, metadata):

    global index

    vector = np.array(
        [embedding]
    ).astype("float32")

    vector_dim = vector.shape[1]

    initialize_index(vector_dim)

    index.add(vector)

    metadata_store.append(metadata)

    save_vectorstore()


# -----------------------------
# Search Embeddings
# -----------------------------
def search_vectorstore(query_embedding, top_k=10):

    global index

    if index is None:

        return []

    vector = np.array(
        [query_embedding]
    ).astype("float32")

    distances, indices = index.search(
        vector,
        top_k
    )

    results = []

    for idx in indices[0]:

        if idx < len(metadata_store):

            results.append(
                metadata_store[idx]
            )

    return results


# -----------------------------
# Rebuild Vector DB
# -----------------------------
def rebuild_vectorstore(new_metadata_store):

    global index
    global metadata_store

    metadata_store = new_metadata_store

    # Empty database case
    if not metadata_store:

        index = None

        if os.path.exists(VECTOR_PATH):

            os.remove(VECTOR_PATH)

        save_vectorstore()

        return

    # Get embedding dimension
    vector_dim = len(
        metadata_store[0]["embedding"]
    )

    # Create fresh FAISS index
    index = faiss.IndexFlatL2(
        vector_dim
    )

    # Re-add stored embeddings
    for item in metadata_store:

        vector = np.array(
            [item["embedding"]]
        ).astype("float32")

        index.add(vector)

    save_vectorstore()