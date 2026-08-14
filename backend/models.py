from sqlalchemy import Column, Integer, String, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from database import Base
import datetime

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    role = Column(String, default="user") # 'user' or 'superadmin'
    status = Column(String, default="pending") # 'pending' or 'approved'
    
    meetings = relationship("Meeting", back_populates="host")


class Meeting(Base):
    __tablename__ = "meetings"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, index=True)
    room_id = Column(String, unique=True, index=True)
    host_id = Column(Integer, ForeignKey("users.id"))
    scheduled_at = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String, default="scheduled") # 'scheduled', 'active', 'finished'

    host = relationship("User", back_populates="meetings")

class SystemSettings(Base):
    __tablename__ = "system_settings"

    id = Column(Integer, primary_key=True, index=True)
    smtp_server = Column(String, default="")
    smtp_port = Column(Integer, default=587)
    smtp_username = Column(String, default="")
    smtp_password = Column(String, default="")
    smtp_from = Column(String, default="noreply@minizoom.local")
    discord_webhook_url = Column(String, default="")
