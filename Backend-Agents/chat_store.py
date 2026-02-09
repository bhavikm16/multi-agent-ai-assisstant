from datetime import datetime
from db import chats_collection

def store_chat(
    user_id,
    query,
    verdict,
    response=None,
    confidence=None,
    embedding=None
):
    doc = {
        "userId": str(user_id),
        "query": query,
        "verdict": verdict,
        "response": response,
        "confidence": confidence,
        "createdAt": datetime.utcnow()
    }

    if embedding is not None and len(embedding) > 0:
        doc["embedding"] = embedding

    chats_collection.insert_one(doc)
