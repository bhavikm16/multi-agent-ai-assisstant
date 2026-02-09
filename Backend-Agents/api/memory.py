import json
import os

MEMORY_FILE = "user_memory.json"

DEFAULT_MEMORY = {
    "preferences": {
        "audience": "software engineer",
        "explanation_style": "simple and practical"
    },
    "recent_topics": []
}

def load_memory():
    if not os.path.exists(MEMORY_FILE):
        save_memory(DEFAULT_MEMORY)
        return DEFAULT_MEMORY
    with open(MEMORY_FILE, "r") as f:
        return json.load(f)

def save_memory(memory):
    with open(MEMORY_FILE, "w") as f:
        json.dump(memory, f, indent=2)

def update_topic(topic):
    memory = load_memory()
    memory["recent_topics"].insert(0, topic)
    memory["recent_topics"] = memory["recent_topics"][:5]
    save_memory(memory)
