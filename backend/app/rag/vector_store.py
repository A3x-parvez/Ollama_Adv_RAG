import faiss
import pickle
import numpy as np
import os
import threading

from app.core.config import (
    VECTOR_PATH,
    METADATA_PATH
)

metadata_store = []

index = None

# Concurrency lock to protect index and metadata_store
_store_lock = threading.RLock()


# -----------------------------
# Load Existing Vector DB
# -----------------------------
if os.path.exists(METADATA_PATH):

    with open(METADATA_PATH, "rb") as f:

        loaded = pickle.load(f)

        # mutate the existing list object to preserve references
        metadata_store.clear()
        metadata_store.extend(loaded)


if os.path.exists(VECTOR_PATH):

    index = faiss.read_index(VECTOR_PATH)


# Attempt to warm BM25 cache on startup (best-effort)
try:
    import importlib

    hs = importlib.import_module("app.rag.hybrid_search")

    if hasattr(hs, "build_bm25_index"):

        hs.build_bm25_index()

except Exception:

    pass


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
# def save_vectorstore():

#     global index

#     if index is not None:

#         faiss.write_index(index, VECTOR_PATH)

#     with open(METADATA_PATH, "wb") as f:

#         pickle.dump(metadata_store, f)

def save_vectorstore():

    global index
    with _store_lock:

        # Save or remove FAISS index
        if index is not None:

            faiss.write_index(
                index,
                VECTOR_PATH
            )

        elif os.path.exists(VECTOR_PATH):

            os.remove(VECTOR_PATH)

        # Save or remove metadata
        if metadata_store:

            with open(METADATA_PATH, "wb") as f:

                pickle.dump(
                    metadata_store,
                    f
                )

        elif os.path.exists(METADATA_PATH):

            os.remove(METADATA_PATH)

# -----------------------------
# Add Embedding
# -----------------------------
def add_to_vectorstore(embedding, metadata):

    global index
    vector = np.array(
        [embedding]
    ).astype("float32")

    vector_dim = vector.shape[1]

    with _store_lock:

        initialize_index(vector_dim)

        index.add(vector)

        metadata_store.append(metadata)

        save_vectorstore()


# -----------------------------
# Search Embeddings
# -----------------------------
def search_vectorstore(query_embedding, top_k=10):

    global index
    with _store_lock:

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

    # mutate the existing list object instead of rebinding the name
    with _store_lock:

        metadata_store.clear()

        metadata_store.extend(new_metadata_store)

    # Empty database case
    if not metadata_store:

        index = None

        if os.path.exists(VECTOR_PATH):

            os.remove(VECTOR_PATH)

        save_vectorstore()

        # notify BM25/hybrid search to refresh its cache
        try:
            import importlib

            hs = importlib.import_module("app.rag.hybrid_search")

            if hasattr(hs, "build_bm25_index"):

                hs.build_bm25_index()

        except Exception:

            # best-effort: don't break vector store behavior on import errors
            pass

        return

    # Get embedding dimension
    vector_dim = len(
        metadata_store[0]["embedding"]
    )

    # Create fresh FAISS index
    with _store_lock:

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

    # ensure BM25 cache is refreshed after rebuilding the vectorstore
    try:
        import importlib

        hs = importlib.import_module("app.rag.hybrid_search")

        if hasattr(hs, "build_bm25_index"):

            hs.build_bm25_index()

    except Exception:

        pass