from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.upload import router as upload_router
from app.api.chat import router as chat_router
from app.api.session import router as session_router
from app.api.models import router as model_router
from app.api.documents import router as documents_router
from app.api.settings import router as settings_router
from app.api.health import router as health_router
from app.api.system import router as system_router

app = FastAPI(
    title="Advanced Offline RAG",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(upload_router)
app.include_router(chat_router)
app.include_router(session_router)
app.include_router(model_router)
app.include_router(documents_router)
app.include_router(settings_router)
app.include_router(health_router)
app.include_router(system_router)

@app.get("/")
async def root():

    return {
        "message": "Advanced Offline RAG Backend Running"
    }