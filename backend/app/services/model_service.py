import subprocess

from app.core.config import OLLAMA_MODEL


# Current active model
current_model = OLLAMA_MODEL


def get_available_models():

    """
    Fetch installed Ollama models
    """

    try:

        result = subprocess.check_output(
            ["ollama", "list"],
            text=True
        )

        lines = result.strip().split("\n")

        models = []

        for line in lines[1:]:

            parts = line.split()

            if parts:

                models.append(parts[0])

        return models

    except Exception as e:

        return {
            "error": str(e)
        }


def get_current_model():

    global current_model

    return current_model


def set_current_model(model_name):

    global current_model

    current_model = model_name

    return current_model