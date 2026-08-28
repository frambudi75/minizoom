from pydantic import BaseModel, EmailStr
from typing import Optional, List
from datetime import datetime

class UserBase(BaseModel):
    name: str
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int
    role: str
    status: str

    class Config:
        from_attributes = True


class MeetingBase(BaseModel):
    title: str
    scheduled_at: Optional[datetime] = None

class MeetingCreate(MeetingBase):
    pass

class MeetingResponse(MeetingBase):
    id: int
    room_id: str
    host_id: int
    status: str
    is_locked: Optional[bool] = False
    is_pmr: Optional[bool] = False
    active_participants: Optional[int] = 0

    class Config:
        from_attributes = True

class Meeting(MeetingBase):
    id: int
    host_id: int
    room_id: str

    class Config:
        from_attributes = True

class GuestJoin(BaseModel):
    name: str
    institution: str


class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None


class SystemSettingsBase(BaseModel):
    smtp_server: Optional[str] = ""
    smtp_port: Optional[int] = 587
    smtp_username: Optional[str] = ""
    smtp_password: Optional[str] = ""
    smtp_from: Optional[str] = "noreply@minizoom.local"
    discord_webhook_url: Optional[str] = ""

class SystemSettingsCreate(SystemSettingsBase):
    pass

class SystemSettingsResponse(SystemSettingsBase):
    id: int

    class Config:
        from_attributes = True
