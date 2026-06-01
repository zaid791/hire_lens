from fastapi import FastAPI, HTTPException, Header
from pydantic import BaseModel
import requests
from jose import jwt
from dotenv import load_dotenv
import os 

from fastapi.middleware.cors import CORSMiddleware

load_dotenv()


app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

GITHUB_CLIENT_ID = os.environ.get("GH_CLIENT_ID")
GITHUB_CLIENT_SECRET =  os.environ.get("GH_SECRET_ID")

JWT_SECRET = "SUPER_SECRET"
JWT_ALGORITHM = "HS256"

class CodePayload(BaseModel):
    code: str

@app.post("/auth/github")
def github_auth(data: dict):
    code = data["code"]

    # 1. exchange code -> access token
    token_res = requests.post(
        "https://github.com/login/oauth/access_token",
        data={
            "client_id": GITHUB_CLIENT_ID,
            "client_secret": GITHUB_CLIENT_SECRET,
            "code": code,
        },
        headers={"Accept": "application/json"}
    )

    access_token = token_res.json().get("access_token")

    # 2. return token
    return {"token": access_token}


@app.post("/auth/logout")
def logout(authorization: str = Header(None)):
    print("AUTH HEADER:", authorization)

    if not authorization:
        raise HTTPException(status_code=400, detail="Missing Authorization header")

    token = authorization.replace("Bearer ", "")

    if not token:
        raise HTTPException(status_code=400, detail="Empty token")

    return {"message": "logout ok"}