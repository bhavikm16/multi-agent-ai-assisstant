from fastapi import APIRouter
from db import chats_collection, users_collection

admin_router = APIRouter()

@admin_router.get("/admin/blocked")
def get_blocked_queries():
    blocked = []

    cursor = chats_collection.find(
        {"verdict": "BLOCKED"},
        {"_id": 0}
    ).sort("createdAt", -1)

    for chat in cursor:
        user = users_collection.find_one(
            {"userId": chat["userId"]},
            {"_id": 0, "email": 1}
        )

        blocked.append({
            "email": user["email"] if user else "Unknown",
            "query": chat["query"],
            "createdAt": chat.get("createdAt")
        })

    return blocked
