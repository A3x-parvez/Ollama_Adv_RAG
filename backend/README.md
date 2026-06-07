# RagFLOW : Ollama Advanced RAG — Backend 

**Overview**
- **Purpose:** Backend API for a Retrieval-Augmented Generation (RAG) demo using Ollama, FAISS, and local vector store. Provides endpoints for uploading documents, searching, chat streaming, model info, system/health checks, and session management.

**Prerequisites**
- Python 3.10+ (recommended)
- Git
- Ollama installed and running locally (if using `ollama` model integrations)
- Optional GPU drivers if using GPU-enabled packages

**Quick Setup**

**Create Environment & install requirements:**

- ⚡ Create Virtual Environment Using [MeW](https://github.com/A3x-parvez/mew.git)

```bash
mew craft
 > conda / python venv
 > python version
 > environment name [ ollama-rag ]

mew open
  > ollama-rag

pip install --upgrade pip
pip install -r requirements.txt
```



- OR , Create Virtual Environment Manually

```bash
python -m venv .venv
.venv\Scripts\activate    # Windows
pip install --upgrade pip
pip install -r requirements.txt
```

**Environment variables setup**

sample environment variables (can be set in `.env` or system environment):
```bash
OLLAMA_MODEL=qwen2.5:3b
EMBED_MODEL=nomic-embed-text

VECTOR_PATH=app/storage/vectors/faiss.index
METADATA_PATH=app/storage/vectors/metadata.pkl

UPLOAD_DIR=app/storage/uploads
```

- Copy `.env`  or set environment variables used in [app/core/config.py](app/core/config.py):
  - `OLLAMA_MODEL` — Ollama model name to use for generation (e.g. `qwen2.5:3b` or `llama3:7b`).
  - `EMBED_MODEL` — Ollama model name for embeddings (e.g. `nomic-embed-text`).
  - `VECTOR_PATH` — file path for FAISS vector index.
  - `METADATA_PATH` — file path for metadata store.
  - `UPLOAD_DIR` — directory for uploaded files.
  - Any other env vars expected by your setup (see [app/core/config.py](app/core/config.py)).

- Rag and model setting in `constants.py` for default model values.

    ```bash
    TOP_K = 15
    RERANK_TOP_K = 5

    CHUNK_SIZE = 800
    CHUNK_OVERLAP = 150
    ```

**Run server (development)**

```bash
cd backend
uvicorn app.main:app --reload --port 8000
```

Open http://127.0.0.1:8000/docs for automatic Swagger UI (FastAPI).

**Project Structure**
```bash
backend/
│
├── app/
│   │
│   ├── api/
│   │   ├── chat.py
│   │   ├── upload.py
│   │   ├── session.py
│   |   ├── documents.py
│   ├   ├── health.py
│   ├   ├── models.py
│   ├   ├── settings.py
│   ├   └── system.py
│   ├
│   │
│   ├── rag/
│   │   ├── chunking.py
│   │   ├── embeddings.py
│   │   ├── retriever.py
│   │   ├── reranker.py
│   │   ├── vector_store.py
│   │   ├── hybrid_search.py
│   │   └── pipeline.py
│   │
│   ├── services/
│   │   ├── ollama_service.py
│   │   ├── model_service.py   
│   │   ├── pdf_service.py
│   │   └── session_service.py
│   │
│   ├── storage/
│   │   ├── uploads/
│   │   ├── vectors/
│   │   ├── cache/
│   │   └── sessions/
│   │
│   ├── core/
│   │   ├── config.py
│   │   |── constants.py
│   │   └── runtime_settings.py
│   │
│   └── main.py
│
├── requirements.txt
└── .env
```
- **Files and directories:**


- **app/**: FastAPI application and routers
  - **main.py**: application bootstrap and router registration ([app/main.py](app/main.py))
  - **api/**: HTTP route handlers
    - `upload.py` — document upload + chunking + embedding pipeline ([app/api/upload.py](app/api/upload.py))
    - `chat.py` — chat streaming endpoint ([app/api/chat.py](app/api/chat.py))
    - `documents.py` — list/delete/clear documents and `GET /documents/stats` ([app/api/documents.py](app/api/documents.py))
    - `models.py`, `settings.py`, `health.py`, `system.py`, `session.py` — auxiliary endpoints
  - **rag/**: RAG related modules
    - `chunking.py` — text splitting
    - `embeddings.py` — calls Ollama embeddings
    - `vector_store.py` — FAISS index and metadata store
    - `retriever.py`, `reranker.py`, `hybrid_search.py`, `pipeline.py` — retrieval/reranking logic
  - **services/**: external integrations
    - `ollama_service.py`, `pdf_service.py`, `model_service.py`, `session_service.py`
  - **core/**: configuration and runtime settings
- **requirements.txt** — Python dependencies
- **storage/** — persistent runtime data (vectors, uploads, sessions, cache)

**API Reference (common routes)**
- Base docs: `GET /docs` (Swagger)

- Documents
  - `GET /documents/` — list available documents (sources)
    - Example: `curl http://127.0.0.1:8000/documents/`
  - `DELETE /documents/{filename}` — delete a document and rebuild vector store
    - Example: `curl -X DELETE http://127.0.0.1:8000/documents/myfile.pdf`
  - `GET /documents/stats` — returns count of chunks per source
    - Example: `curl http://127.0.0.1:8000/documents/stats`
  - `DELETE /documents/` — clear knowledge base (vectors + uploads)

- Upload
  - `POST /upload/` — multipart file upload (PDF expected). This endpoint processes PDF, chunks text, generates embeddings and adds to vector store.
    

- Chat
  - `POST /chat/stream` — stream chat responses using the RAG pipeline. See [app/api/chat.py](app/api/chat.py) for payload schema.

- Models & System
  - `GET /models/` and `GET /models/current` — model listing and current model
  - `GET /health/` — health check
  - `GET /system/` — CPU/RAM/GPU status (requires `psutil` and `gputil`)

**Notes on Packages**
- Key packages used (already in `requirements.txt`):
  - `fastapi`, `uvicorn`, `pydantic`
  - `PyMuPDF` (`fitz`) for PDF parsing
  - `faiss-cpu`, `numpy` for vector store
  - `ollama` for model/embedding calls
  - `sentence-transformers` and `rank-bm25` used by retrieval/reranking
  - `langchain-text-splitters` (text splitting)
  - `aiofiles` for async file writes
  - `torch`, `transformers` may be used by some components
  - `psutil`, `gputil` for system metrics
  - `sympy` was added because a file imported `re` from `sympy` (ensure correct usage)
  - `FlagEmbedding` appears referenced as external; ensure that package or module is available in PYTHONPATH or installed.

**Troubleshooting**
- NameError referencing `metadata_store`: resolved by importing the in-handler variable (see [app/api/documents.py](app/api/documents.py)). If you see similar errors, check for local imports inside route functions.
- Missing packages on pip install: review `requirements.txt` and install missing ones manually. GPU-specific builds of `faiss` or `torch` may be required.

**Developer Tips**
- Tests: there are no automated tests in the repo; add pytest if desired.
- Linting: run `ruff`/`flake8` if installed.
- Rebuilding vectors: `DELETE /documents/{filename}` triggers `rebuild_vectorstore`.


**NOTE:** 
- This is the backend component of the RAD backend which provide a full fledge self hosted Ollama model based rag experience with advance retrival and rankling capabilities.this backend design to use it with the frontend design with it to provide a complete experience for users who want to have a local RAG system using Ollama models.

**Contributing**
- Make feature branches, run the server locally, and verify endpoints in Swagger UI.

**Credit** 
- @A3x-parvez (Rijwanool Karim) for original code and design.
this project is build under the MIT License, see LICENSE file for details.


---
_Last updated: May 28, 2026_
