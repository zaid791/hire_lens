from fastapi import FastAPI
from dotenv import load_dotenv
import os

from fastapi.middleware.cors import CORSMiddleware

load_dotenv()

app = FastAPI()

frontend_url = os.environ.get("APP_URL", "http://localhost:5173")
allowed_origins = list({frontend_url, "http://localhost:3000", "http://localhost:5173"})

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PROVIDER = os.environ.get("MODEL_PROVIDER", "gemini")
INFERENCE_SERVICE_URL = os.environ.get("INFERENCE_SERVICE_URL", "")


@app.get("/health")
def health():
    return {
        "status": "ok",
        "model_provider": MODEL_PROVIDER,
        "inference_configured": bool(INFERENCE_SERVICE_URL),
    }
