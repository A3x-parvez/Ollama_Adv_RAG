
# Advanced Offline RAG — RagFlow

![Build Status](https://img.shields.io/badge/build-local-yellow)
![License](https://img.shields.io/badge/license-MIT-blue)

A lightweight, offline-focused Retrieval-Augmented Generation (RAG) starter kit combining a FastAPI backend for document ingestion, vectorization, and model orchestration with a modern Vite + React frontend called RagFlow UI.

**Why this repo**: experiment with local LLM workflows, offline embeddings, hybrid search, and a developer-friendly UI for iterating on RAG pipelines.

**Quick Links**
- **Backend entry**: [backend/app/main.py](backend/app/main.py#L1)
- **Backend README**: [backend/README.md](backend/README.md)
- **Frontend app**: [RagFlow_UI/src/start.ts](RagFlow_UI/src/start.ts#L1)
- **Frontend README**: [RagFlow_UI/README.md](RagFlow_UI/README.md)

## **Features**
- **End-to-end RAG**: ingestion, chunking, embeddings, vector store, retriever, reranker, and chat API.
- **Offline-first**: designed to run locally with FAISS, sentence-transformers and Ollama integrations.
- **Modern UI**: opinionated React + Vite interface for quick testing and document browsing.
- **Extensible**: modular services under `backend/app/` to plug new models or vector stores.

## **Quick Start**
Prerequisites: Python 3.10+, Node 18+, and Git.

1) Backend: create a virtualenv and install dependencies

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

Or using standard Python venv:

```bash
python -m venv .venv
source .venv/bin/activate   # or .venv\\Scripts\\activate on Windows
pip install -r backend/requirements.txt
```

Start the FastAPI backend (serve with Uvicorn):

```bash
uvicorn backend.app.main:app --reload --host 0.0.0.0 --port 8000
```

Visit http://localhost:8000/ for a root health message and http://localhost:8000/docs for the OpenAPI UI.

2) Frontend: install and run the UI

```bash
cd RagFlow_UI
npm install
npm run dev
```

Open the local dev server shown by Vite (usually http://localhost:5173).

### One-step: Run both backend and frontend together
After you've installed backend and frontend dependencies you can start both services from the repository root using the bundled script.

```bash
python server.py
```

This runs the backend (Uvicorn) on port `8000` and the frontend dev server on port `3000` concurrently. Visit http://127.0.0.1:8000 for the API and http://127.0.0.1:3000 for the UI.

## **Project Layout**
- **backend/** — FastAPI app, services, RAG pipeline components and storage.
	- Core entry: [backend/app/main.py](backend/app/main.py#L1)
	- RAG code: [backend/app/rag/](backend/app/rag/)
- **RagFlow_UI/** — Vite + React frontend. See [RagFlow_UI/src/start.ts](RagFlow_UI/src/start.ts#L1)

## **Architecture Overview**
- Ingestion: upload PDFs via the upload API and chunk them for embeddings.
- Embeddings: created via `backend/app/rag/embeddings.py` (pluggable providers).
- Vector store: local FAISS-backed store in `backend/app/rag/vector_store.py`.
- Retrieval: hybrid retrieval + BM25 + reranking for better relevance.
- Serving: FastAPI exposes chat, document, model and session APIs consumed by the UI.

## **Configuration & Environment**
- Use `.env` files or environment variables for model endpoints, API keys, and storage paths.
- Common knobs: model provider (Ollama vs local HF), embedding model name, FAISS index path.

## **Development Tips**
- Rebuild embeddings or vectors if you change chunking or the embedding model.
- Use the OpenAPI docs at `/docs` to explore and test endpoints quickly.
- Frontend and backend can run concurrently during development.

## **Contributing**
- Fork, make changes on a feature branch and open a PR. Keep changes focused and testable.
- Add docs to `backend/README.md` or `RagFlow_UI/README.md` for large features.

## **Troubleshooting**
- Missing Python packages: ensure virtualenv is activated and `pip install -r backend/requirements.txt` succeeded.
- GPU issues: several optional packages (PyTorch, FAISS-gpu) are pinned to CPU builds by default — consult `backend/requirements.txt`.

## **License**
This project is provided under the MIT License. Modify as needed for your use.

---
If you'd like, I can also: add CI badges, generate a short contributor guide, or update `backend/README.md` with step-by-step env var examples.
