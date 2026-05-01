from pydantic import BaseModel, ConfigDict
from typing import Optional
from datetime import datetime


class UserCreate(BaseModel):
    login: str
    password: str


class UserResponse(BaseModel):
    id: int
    login: str
    model_config = ConfigDict(from_attributes=True)


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    login: str


class ImageResponse(BaseModel):
    id: int
    orig_image: str
    restore_image: Optional[str] = None
    user_id: int
    date: datetime
    model_config = ConfigDict(from_attributes=True)
