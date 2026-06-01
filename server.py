import subprocess
import os
import time

ROOT_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

BACKEND_DIR = os.path.join(
    ROOT_DIR,
    "backend"
)

FRONTEND_DIR = os.path.join(
    ROOT_DIR,
    "RagFlow_UI"
)

print("🚀 Starting Backend...")

backend_process = subprocess.Popen(
    [
        "uvicorn",
        "app.main:app",
        "--reload",
        "--port",
        "8000"
    ],
    cwd=BACKEND_DIR,
    shell=True
)

time.sleep(3)

print("🚀 Starting Frontend...")

frontend_process = subprocess.Popen(
    [
        "npm",
        "run",
        "dev"
    ],
    cwd=FRONTEND_DIR,
    shell=True
)

print("\n✅ Backend running on:")
print("http://127.0.0.1:8000")

print("\n✅ Frontend running on:")
print("http://127.0.0.1:3000")

try:
    backend_process.wait()
    frontend_process.wait()

except KeyboardInterrupt:

    print("\n🛑 Stopping services...")

    backend_process.terminate()
    frontend_process.terminate()
