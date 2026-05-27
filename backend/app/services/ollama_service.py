import ollama

from app.services.model_service import (
    get_current_model
)


def generate_response(prompt: str):

    model_name = get_current_model()

    response = ollama.chat(
        model=model_name,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ]
    )

    return response["message"]["content"]


def stream_response(prompt: str):

    model_name = get_current_model()

    stream = ollama.chat(
        model=model_name,
        messages=[
            {
                "role": "user",
                "content": prompt
            }
        ],
        stream=True
    )

    for chunk in stream:

        content = chunk["message"]["content"]

        yield content