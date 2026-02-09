from pydantic import BaseModel, EmailStr
from typing import List, Optional, Literal

class SignupRequest(BaseModel):
    email: EmailStr
    password: str

class LoginRequest(BaseModel):
    email: EmailStr
    password: str
    
class ChatTurn(BaseModel):
    role: Literal["user", "ai"]
    content: str


class AskRequest(BaseModel):
    topic: str
    userId: str
    history: Optional[List[ChatTurn]] = []