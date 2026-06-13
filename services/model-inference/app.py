import json
import os
from fastapi import FastAPI
from pydantic import BaseModel

app = FastAPI()

MODEL_PROVIDER = os.environ.get("MODEL_PROVIDER", "opensource")


class AnalyzeRequest(BaseModel):
    profile: dict
    repos: list = []
    languageStats: list = []
    commitPattern: dict = {}


@app.get("/health")
def health():
    return {"status": "ok", "model_provider": MODEL_PROVIDER}


@app.post("/analyze")
def analyze(payload: AnalyzeRequest):
    login = payload.profile.get("login", "developer")
    top_languages = ", ".join(
        stat.get("language", "Unknown") for stat in payload.languageStats[:3]
    ) or "multiple stacks"

    return {
        "personality_summary": (
            f"{login} shows steady open-source activity with emphasis on {top_languages}."
        ),
        "archetype": "The Pragmatic Builder",
        "top_strengths": [
            "Consistent delivery",
            "Readable code habits",
            "Cross-stack adaptability",
        ],
        "blind_spot": "May prioritize shipping speed over deep refactors.",
        "recruiter_pitch": (
            f"A dependable engineer ({login}) who translates public GitHub signals into reliable delivery."
        ),
    }
