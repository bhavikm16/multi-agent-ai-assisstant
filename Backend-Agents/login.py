from fastapi import HTTPException
import uuid
from datetime import datetime
from db import users_collection, chats_collection
import bcrypt
from fastapi import APIRouter
from models import LoginRequest
login_router = APIRouter()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

@login_router.post("/login")

def login(req : LoginRequest):
    user = users_collection.find_one({"email": req.email})
    if not user or not verify_password(req.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")

    return {
        "userId": user["userId"],
        "email": user["email"]
    }
