from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    username: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    created_at: datetime

    class Config:
        from_attributes = True

class Token(BaseModel):
    token: str
    token_type: str
    user: UserResponse

class LoginRequest(BaseModel):
    email: str
    password: str

class JobBase(BaseModel):
    original_filename: str
    target_format: str

class JobResponse(JobBase):
    id: int
    user_id: Optional[int]
    status: str
    result_filename: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
