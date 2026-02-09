from pymongo import MongoClient
import os
MONGO_URI = os.getenv("MONGO_URI")
client = MongoClient(MONGO_URI)

db = client["ai_assistant"]

users_collection = db["users"]
chats_collection = db["chats"]
print("DATBASE CREATED SUCCESSFULLY")
