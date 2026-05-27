from pathlib import Path

# Root folder
root = Path("backend")

# File structure
structure = {
    "app": {
        "api": [
            "chat.py",
            "upload.py",
            "session.py",
        ],
        "rag": [
            "chunking.py",
            "embeddings.py",
            "retriever.py",
            "reranker.py",
            "vector_store.py",
            "hybrid_search.py",
            "pipeline.py",
        ],
        "services": [
            "ollama_service.py",
            "pdf_service.py",
            "session_service.py",
        ],
        "storage": {
            "uploads": [],
            "vectors": [],
            "cache": [],
            "sessions": [],
        },
        "core": [
            "config.py",
            "constants.py",
        ],
        "files": [
            "main.py",
        ],
    },
    "root_files": [
        "requirements.txt",
        ".env",
    ]
}


def create_structure(base_path, tree):
    for name, content in tree.items():

        # Handle root files
        if name == "root_files":
            for file in content:
                file_path = base_path / file
                file_path.touch(exist_ok=True)
            continue

        # Handle direct files inside app
        if name == "files":
            for file in content:
                file_path = base_path / file
                file_path.touch(exist_ok=True)
            continue

        current_path = base_path / name
        current_path.mkdir(parents=True, exist_ok=True)

        if isinstance(content, dict):
            create_structure(current_path, content)

        elif isinstance(content, list):
            for item in content:
                item_path = current_path / item
                item_path.touch(exist_ok=True)


# Create root directory
root.mkdir(exist_ok=True)

# Generate structure
create_structure(root, structure)

print("✅ Backend project structure created successfully!")