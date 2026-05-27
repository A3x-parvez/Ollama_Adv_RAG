from dotenv import load_dotenv
import os

load_dotenv()

OLLAMA_MODEL = os.getenv("OLLAMA_MODEL")
EMBED_MODEL = os.getenv("EMBED_MODEL")

VECTOR_PATH = os.getenv("VECTOR_PATH")
METADATA_PATH = os.getenv("METADATA_PATH")

UPLOAD_DIR = os.getenv("UPLOAD_DIR")