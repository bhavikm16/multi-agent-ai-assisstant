from fastapi import HTTPException
import uuid
from datetime import datetime
from db import users_collection, chats_collection
from fastapi import APIRouter

history_router = APIRouter()

@history_router.get("/chats/{user_id}")
def get_chats(user_id: str):
    chats = chats_collection.find(
        {"userId": user_id},
        {"_id": 0}
    ).sort("createdAt", -1)

    return list(chats)
