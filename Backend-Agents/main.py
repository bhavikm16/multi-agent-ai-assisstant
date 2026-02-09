from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from agents import ask_router
from login import login_router
from signup import signup_router
from chathistory import history_router
from admin import admin_router
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(ask_router)
app.include_router(login_router)
app.include_router(signup_router)
app.include_router(history_router)
app.include_router(admin_router)
