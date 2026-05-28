from fastapi import APIRouter

import psutil
import GPUtil

router = APIRouter(
    prefix="/system",
    tags=["System"]
)


@router.get("/status")
async def system_status():

    # CPU
    cpu_percent = psutil.cpu_percent()

    # RAM
    ram = psutil.virtual_memory()

    ram_used_gb = round(
        ram.used / (1024 ** 3),
        1
    )

    # Default GPU values
    gpu_percent = 0

    gpu_temperature = 0

    try:

        gpus = GPUtil.getGPUs()

        if gpus:

            gpu = gpus[0]

            gpu_percent = round(
                gpu.load * 100,
                1
            )

            gpu_temperature = gpu.temperature

    except Exception:

        pass

    return {
        "cpu": cpu_percent,
        "gpu": gpu_percent,
        "ram": ram_used_gb,
        "temp": gpu_temperature
    }