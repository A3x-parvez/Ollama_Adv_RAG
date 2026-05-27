import faiss
import pickle
import numpy as np
import os

from app.core.config import (
    VECTOR_PATH,
    METADATA_PATH
)

from app.rag.embeddings import generate_embedding

dimension = 768

metadata_store = []

if os.path.exists(VECTOR_PATH):
    index = faiss.read_index(VECTOR_PATH)
else:
    index = faiss.IndexFlatL2(dimension)

if os.path.exists(METADATA_PATH):
    with open(METADATA_PATH, "rb") as f:
        metadata_store = pickle.load(f)


def save_vectorstore():

    faiss.write_index(index, VECTOR_PATH)

    with open(METADATA_PATH, "wb") as f:
        pickle.dump(metadata_store, f)


def add_to_vectorstore(embedding, metadata):

    vector = np.array([embedding]).astype("float32")

    index.add(vector)

    metadata_store.append(metadata)

    save_vectorstore()


def search_vectorstore(query_embedding, top_k=10):

    vector = np.array([query_embedding]).astype("float32")

    distances, indices = index.search(vector, top_k)

    results = []

    for idx in indices[0]:

        if idx < len(metadata_store):

            results.append(metadata_store[idx])

    return results



# def rebuild_vectorstore(new_metadata_store):

#     global index
#     global metadata_store

#     metadata_store = new_metadata_store

#     if not metadata_store:

#         index = None

#         if os.path.exists(VECTOR_PATH):
#             os.remove(VECTOR_PATH)

#         save_vectorstore()

#         return

#     first_embedding = generate_embedding(
#         metadata_store[0]["text"]
#     )

#     vector_dim = len(first_embedding)

#     index = faiss.IndexFlatL2(vector_dim)

#     for item in metadata_store:

#         embedding = generate_embedding(
#             item["text"]
#         )

#         vector = np.array(
#             [embedding]
#         ).astype("float32")

#         index.add(vector)

#     save_vectorstore()