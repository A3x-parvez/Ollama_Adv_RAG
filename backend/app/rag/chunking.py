from langchain_text_splitters import RecursiveCharacterTextSplitter

from app.core.constants import (
    CHUNK_SIZE,
    CHUNK_OVERLAP
)

text_splitter = RecursiveCharacterTextSplitter(
    chunk_size=CHUNK_SIZE,
    chunk_overlap=CHUNK_OVERLAP,
    separators=[
        "\n\n",
        "\n",
        ". ",
        " ",
        ""
    ]
)


def create_chunks(pages, filename):

    chunks = []

    for page_data in pages:

        page_num = page_data["page"]
        text = page_data["text"]

        split_texts = text_splitter.split_text(text)

        for idx, chunk in enumerate(split_texts):

            chunks.append({
                "text": chunk,
                "metadata": {
                    "source": filename,
                    "page": page_num,
                    "chunk_id": idx
                }
            })

    return chunks