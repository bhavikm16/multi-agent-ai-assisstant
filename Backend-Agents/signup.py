from fastapi import HTTPException
import uuid
from datetime import datetime
from db import users_collection, chats_collection
import bcrypt
from fastapi import APIRouter
from models import SignupRequest
signup_router  = APIRouter()

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


@signup_router.post("/register")
def register(req : SignupRequest):
    if users_collection.find_one({"email": req.email}):
        raise HTTPException(status_code=400, detail="Email already exists")

    user = {
        "userId": str(uuid.uuid4()),
        "email": req.email,
        "password": hash_password(req.password),
        "createdAt": datetime.utcnow()
    }

    users_collection.insert_one(user)
    return {"message": "User registered successfully"}
