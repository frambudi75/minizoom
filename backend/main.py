from fastapi import FastAPI, Depends, HTTPException, status, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import timedelta
import models, schemas, auth
from database import engine, get_db, run_migrations
import os
import uuid
from livekit import api
import email_service
import discord_service

models.Base.metadata.create_all(bind=engine)
run_migrations()

app = FastAPI(title="Minizoom API", version="1.5.0")

APP_VERSION = "1.5.0"
BUILD_DATE = "2026-08-30"

@app.get("/api/system/status")
def get_system_status():
    livekit_url = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
    is_cloud = "livekit.cloud" in livekit_url
    return {
        "status": "online",
        "app_version": APP_VERSION,
        "build_date": BUILD_DATE,
        "livekit_mode": "LiveKit Cloud (SFU)" if is_cloud else "Self-Hosted / Local SFU",
        "livekit_url": livekit_url.split("?")[0],
        "database": "SQLite WAL (Persistent Volume)",
        "features": [
            "Collaborative Interactive Whiteboard",
            "Live Polls & Real-Time Voting",
            "In-Meeting Shared Notes & Exporter",
            "Audio Chimes & Sound Synthesizer",
            "Progressive Web App (PWA) Support",
            "Glassmorphism 2.0 & Cyber Grid UI",
            "Pre-Join Lobby (Camera Preview & Audio Meter)",
            "Adaptive Low-Data Mode Optimizer",
            "Real-Time Floating Emoji Reactions",
            "Persistent Data Volume (/app/data)",
            "Host Controls (Mute All / Kick / Lock Room)",
            "In-Meeting Live Chat",
            "Raise Hand Interaction",
            "Personal Meeting Rooms (PMR)",
            "Browser Screen & Audio Recorder (.webm)",
            "Dynamic LiveKit Cloud WebRTC SFU"
        ]
    }

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/login")

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = auth.jwt.decode(token, auth.SECRET_KEY, algorithms=[auth.ALGORITHM])
        email: str = payload.get("sub")
        if email is None:
            raise credentials_exception
        token_data = schemas.TokenData(email=email)
    except auth.InvalidTokenError:
        raise credentials_exception
    user = db.query(models.User).filter(models.User.email == token_data.email).first()
    if user is None:
        raise credentials_exception
    return user

def get_current_active_user(current_user: models.User = Depends(get_current_user)):
    if current_user.status != "approved":
        raise HTTPException(status_code=400, detail="User account is pending approval")
    return current_user

def get_current_superadmin(current_user: models.User = Depends(get_current_active_user)):
    if current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Not enough privileges")
    return current_user

@app.post("/api/register", response_model=schemas.UserResponse)
def register(user: schemas.UserCreate, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_user = db.query(models.User).filter(models.User.email == user.email).first()
    if db_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = auth.get_password_hash(user.password)
    # Auto-approve and make superadmin ONLY if it's the very first user in the system
    if db.query(models.User).count() == 0:
        db_user = models.User(name=user.name, email=user.email, hashed_password=hashed_password, role="superadmin", status="approved")
    else:
        db_user = models.User(name=user.name, email=user.email, hashed_password=hashed_password, role="user", status="pending")
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)

    # Send notifications in background
    if db_user.role != "superadmin":
        settings = db.query(models.SystemSettings).first()
        settings_dict = {}
        if settings:
            settings_dict = {
                "smtp_server": settings.smtp_server,
                "smtp_port": settings.smtp_port,
                "smtp_username": settings.smtp_username,
                "smtp_password": settings.smtp_password,
                "smtp_from": settings.smtp_from,
                "discord_webhook_url": settings.discord_webhook_url
            }

        # Email Notification
        admins = db.query(models.User).filter(models.User.role == "superadmin").all()
        admin_emails = [admin.email for admin in admins]
        if admin_emails:
            background_tasks.add_task(email_service.send_new_user_notification, admin_emails, user.name, user.email, settings_dict)
            
        # Discord Notification
        background_tasks.add_task(discord_service.send_discord_notification, user.name, user.email, settings_dict)

    return db_user

@app.post("/api/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == form_data.username).first()
    if not user or not auth.verify_password(form_data.password, user.hashed_password):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    if user.status != "approved":
        raise HTTPException(status_code=400, detail="Account pending approval")
    
    access_token_expires = timedelta(minutes=auth.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = auth.create_access_token(
        data={"sub": user.email}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

@app.get("/api/admin/users/pending", response_model=list[schemas.UserResponse])
def get_pending_users(current_user: models.User = Depends(get_current_superadmin), db: Session = Depends(get_db)):
    users = db.query(models.User).filter(models.User.status == "pending").all()
    return users

@app.post("/api/admin/users/approve/{user_id}", response_model=schemas.UserResponse)
def approve_user(
    user_id: int, 
    background_tasks: BackgroundTasks,
    current_user: models.User = Depends(get_current_superadmin), 
    db: Session = Depends(get_db)
):
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.status = "approved"
    db.commit()
    db.refresh(user)

    # Dispatch approval notification email to user
    settings = db.query(models.SystemSettings).first()
    settings_dict = {}
    if settings:
        settings_dict = {
            "smtp_server": settings.smtp_server,
            "smtp_port": settings.smtp_port,
            "smtp_username": settings.smtp_username,
            "smtp_password": settings.smtp_password,
            "smtp_from": settings.smtp_from,
        }
    background_tasks.add_task(email_service.send_user_approved_notification, user.email, user.name, settings_dict)

    return user

@app.get("/api/admin/users/all", response_model=list[schemas.UserResponse])
def get_all_users(current_user: models.User = Depends(get_current_superadmin), db: Session = Depends(get_db)):
    users = db.query(models.User).order_by(models.User.id.desc()).all()
    return users

@app.post("/api/admin/users/role/{user_id}", response_model=schemas.UserResponse)
def change_user_role(user_id: int, role: str, current_user: models.User = Depends(get_current_superadmin), db: Session = Depends(get_db)):
    if role not in ["user", "superadmin"]:
        raise HTTPException(status_code=400, detail="Invalid role")
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot change your own role")
    
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    user.role = role
    db.commit()
    db.refresh(user)
    return user

@app.delete("/api/admin/users/{user_id}")
def delete_user(user_id: int, current_user: models.User = Depends(get_current_superadmin), db: Session = Depends(get_db)):
    if current_user.id == user_id:
        raise HTTPException(status_code=400, detail="Cannot delete your own superadmin account")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Delete associated meetings
    db.query(models.Meeting).filter(models.Meeting.host_id == user_id).delete()
    db.delete(user)
    db.commit()
    return {"message": "User deleted successfully", "id": user_id}

@app.post("/api/admin/users/{user_id}/reset-password")
def admin_reset_password(user_id: int, payload: schemas.AdminResetPassword, current_user: models.User = Depends(get_current_superadmin), db: Session = Depends(get_db)):
    if len(payload.new_password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    user.hashed_password = auth.get_password_hash(payload.new_password)
    db.commit()
    return {"message": "Password reset successfully", "user_id": user_id}

@app.get("/api/user/profile", response_model=schemas.UserProfileResponse)
def get_user_profile(current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    pmr = db.query(models.Meeting).filter(models.Meeting.host_id == current_user.id, models.Meeting.is_pmr == True).first()
    total_meetings = db.query(models.Meeting).filter(models.Meeting.host_id == current_user.id).count()
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "status": current_user.status,
        "pmr_room_id": pmr.room_id if pmr else None,
        "total_meetings": total_meetings
    }

@app.post("/api/user/profile", response_model=schemas.UserProfileResponse)
def update_user_profile(payload: schemas.UserProfileUpdate, current_user: models.User = Depends(get_current_user), db: Session = Depends(get_db)):
    if payload.name and payload.name.strip():
        current_user.name = payload.name.strip()
    
    if payload.new_password:
        if not payload.current_password:
            raise HTTPException(status_code=400, detail="Current password is required to set a new password")
        if not auth.verify_password(payload.current_password, current_user.hashed_password):
            raise HTTPException(status_code=400, detail="Current password is incorrect")
        if len(payload.new_password) < 6:
            raise HTTPException(status_code=400, detail="New password must be at least 6 characters")
        current_user.hashed_password = auth.get_password_hash(payload.new_password)
    
    db.commit()
    db.refresh(current_user)
    
    pmr = db.query(models.Meeting).filter(models.Meeting.host_id == current_user.id, models.Meeting.is_pmr == True).first()
    total_meetings = db.query(models.Meeting).filter(models.Meeting.host_id == current_user.id).count()
    return {
        "id": current_user.id,
        "name": current_user.name,
        "email": current_user.email,
        "role": current_user.role,
        "status": current_user.status,
        "pmr_room_id": pmr.room_id if pmr else None,
        "total_meetings": total_meetings
    }

@app.get("/api/admin/settings", response_model=schemas.SystemSettingsResponse)
def get_settings(current_user: models.User = Depends(get_current_superadmin), db: Session = Depends(get_db)):
    settings = db.query(models.SystemSettings).first()
    if not settings:
        settings = models.SystemSettings()
        db.add(settings)
        db.commit()
        db.refresh(settings)
    return settings

@app.post("/api/admin/settings", response_model=schemas.SystemSettingsResponse)
def update_settings(settings_in: schemas.SystemSettingsCreate, current_user: models.User = Depends(get_current_superadmin), db: Session = Depends(get_db)):
    settings = db.query(models.SystemSettings).first()
    if not settings:
        settings = models.SystemSettings()
        db.add(settings)

    settings.smtp_server = settings_in.smtp_server
    settings.smtp_port = settings_in.smtp_port
    settings.smtp_username = settings_in.smtp_username
    settings.smtp_password = settings_in.smtp_password
    settings.smtp_from = settings_in.smtp_from
    settings.discord_webhook_url = settings_in.discord_webhook_url

    db.commit()
    db.refresh(settings)
    return settings

@app.get("/api/me", response_model=schemas.UserResponse)
def read_users_me(current_user: models.User = Depends(get_current_active_user)):
    return current_user

LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "devkey")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "secret")

def get_livekit_http_url():
    raw_url = os.getenv("LIVEKIT_URL", "http://localhost:7880")
    if raw_url.startswith("wss://"):
        raw_url = "https://" + raw_url[6:]
    elif raw_url.startswith("ws://"):
        raw_url = "http://" + raw_url[5:]
    return raw_url.rstrip("/")

def get_livekit_ws_url():
    raw_url = os.getenv("LIVEKIT_URL", "ws://localhost:7880")
    if raw_url.startswith("https://"):
        raw_url = "wss://" + raw_url[8:]
    elif raw_url.startswith("http://"):
        raw_url = "ws://" + raw_url[7:]
    return raw_url.rstrip("/")

@app.post("/api/meetings/instant", response_model=schemas.MeetingResponse)
def create_instant_meeting(current_user: models.User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    room_id = str(uuid.uuid4())
    meeting = models.Meeting(
        title=f"Meeting of {current_user.name}",
        room_id=room_id,
        host_id=current_user.id,
        status="active"
    )
    db.add(meeting)
    db.commit()
    db.refresh(meeting)
    return meeting

@app.get("/api/meetings", response_model=list[schemas.MeetingResponse])
async def get_meetings(current_user: models.User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    if current_user.role == "superadmin":
        meetings = db.query(models.Meeting).order_by(models.Meeting.scheduled_at.desc()).all()
    else:
        meetings = db.query(models.Meeting).filter(models.Meeting.host_id == current_user.id).order_by(models.Meeting.scheduled_at.desc()).all()
    
    # Ambil jumlah peserta yang sedang aktif di tiap room dari LiveKit
    room_counts = {}
    try:
        async with api.LiveKitAPI(url=get_livekit_http_url(), api_key=LIVEKIT_API_KEY, api_secret=LIVEKIT_API_SECRET) as lk:
            res = await lk.room.list_rooms(api.ListRoomsRequest())
            for r in res.rooms:
                room_counts[r.name] = r.num_participants
    except Exception as e:
        print(f"Notice: could not query active rooms from LiveKit: {e}")

    results = []
    for m in meetings:
        results.append({
            "id": m.id,
            "title": m.title,
            "room_id": m.room_id,
            "host_id": m.host_id,
            "scheduled_at": m.scheduled_at,
            "status": m.status,
            "is_locked": bool(m.is_locked),
            "is_pmr": bool(m.is_pmr),
            "active_participants": room_counts.get(m.room_id, 0)
        })
    return results

@app.post("/api/meetings/schedule", response_model=schemas.MeetingResponse)
def schedule_meeting(meeting: schemas.MeetingCreate, current_user: models.User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    room_id = str(uuid.uuid4())
    db_meeting = models.Meeting(
        title=meeting.title,
        room_id=room_id,
        host_id=current_user.id,
        scheduled_at=meeting.scheduled_at,
        status="scheduled"
    )
    db.add(db_meeting)
    db.commit()
    db.refresh(db_meeting)
    return db_meeting

@app.delete("/api/meetings/{room_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_meeting(room_id: str, current_user: models.User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    if current_user.role == "superadmin":
        meeting = db.query(models.Meeting).filter(models.Meeting.room_id == room_id).first()
    else:
        meeting = db.query(models.Meeting).filter(models.Meeting.room_id == room_id, models.Meeting.host_id == current_user.id).first()
        
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found or you don't have permission")
    db.delete(meeting)
    db.commit()
    return None

@app.get("/api/meetings/pmr", response_model=schemas.MeetingResponse)
def get_personal_meeting_room(current_user: models.User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    pmr = db.query(models.Meeting).filter(models.Meeting.host_id == current_user.id, models.Meeting.is_pmr == True).first()
    if not pmr:
        room_id = f"pmr-{current_user.id}"
        # Cek jika room_id sudah ada
        existing = db.query(models.Meeting).filter(models.Meeting.room_id == room_id).first()
        if existing:
            room_id = f"pmr-{current_user.id}-{uuid.uuid4().hex[:4]}"
        pmr = models.Meeting(
            title=f"{current_user.name}'s Personal Room",
            room_id=room_id,
            host_id=current_user.id,
            status="active",
            is_pmr=True,
            is_locked=False
        )
        db.add(pmr)
        db.commit()
        db.refresh(pmr)
    return pmr

@app.post("/api/meetings/{room_id}/lock")
def toggle_lock_meeting(room_id: str, current_user: models.User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(models.Meeting.room_id == room_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if current_user.id != meeting.host_id and current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    meeting.is_locked = not bool(meeting.is_locked)
    db.commit()
    db.refresh(meeting)
    return {"is_locked": meeting.is_locked}

@app.get("/api/meetings/{room_id}/token")
def get_livekit_token(room_id: str, current_user: models.User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(models.Meeting.room_id == room_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    is_host = (current_user.id == meeting.host_id) or (current_user.role == "superadmin")
    
    if meeting.is_locked and not is_host:
        raise HTTPException(status_code=403, detail="Ruangan meeting sedang dikunci oleh Host.")
    
    token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET) \
        .with_identity(str(current_user.id)) \
        .with_name(current_user.name) \
        .with_grants(api.VideoGrants(
            room_join=True,
            room=room_id,
            room_admin=is_host,
            can_publish=True,
            can_subscribe=True,
            can_publish_data=True,
            can_update_own_metadata=True
        ))
    return {
        "token": token.to_jwt(),
        "server_url": get_livekit_ws_url(),
        "is_locked": bool(meeting.is_locked),
        "is_host": is_host
    }

@app.post("/api/meetings/{room_id}/mute-all")
async def mute_all_participants(room_id: str, current_user: models.User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(models.Meeting.room_id == room_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if current_user.id != meeting.host_id and current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        async with api.LiveKitAPI(url=get_livekit_http_url(), api_key=LIVEKIT_API_KEY, api_secret=LIVEKIT_API_SECRET) as lk:
            res = await lk.room.list_participants(api.ListParticipantsRequest(room=room_id))
            for p in res.participants:
                # Jangan mute host itu sendiri
                if p.identity != str(current_user.id):
                    for track in p.tracks:
                        is_audio = getattr(track, 'type', None) == 0 or "AUDIO" in str(getattr(track, 'type', '')).upper()
                        if is_audio and not track.muted:
                            await lk.room.mute_published_track(
                                api.MuteRoomTrackRequest(
                                    room=room_id,
                                    identity=p.identity,
                                    track_sid=track.sid,
                                    muted=True
                                )
                            )
        return {"status": "success", "message": "All participants muted"}
    except Exception as e:
        print(f"Error muting all in {room_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/meetings/{room_id}/kick/{identity}")
async def kick_participant(room_id: str, identity: str, current_user: models.User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(models.Meeting.room_id == room_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if current_user.id != meeting.host_id and current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        async with api.LiveKitAPI(url=get_livekit_http_url(), api_key=LIVEKIT_API_KEY, api_secret=LIVEKIT_API_SECRET) as lk:
            await lk.room.remove_participant(
                api.RoomParticipantIdentity(room=room_id, identity=identity)
            )
        return {"status": "success"}
    except Exception as e:
        print(f"Error kicking participant {identity}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/meetings/{room_id}/mute/{identity}")
async def mute_participant(room_id: str, identity: str, current_user: models.User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(models.Meeting.room_id == room_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if current_user.id != meeting.host_id and current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        async with api.LiveKitAPI(url=get_livekit_http_url(), api_key=LIVEKIT_API_KEY, api_secret=LIVEKIT_API_SECRET) as lk:
            participant = await lk.room.get_participant(
                api.RoomParticipantIdentity(room=room_id, identity=identity)
            )
            for track in participant.tracks:
                # Periksa apakah track audio (int 0, atau string 'AUDIO')
                is_audio = getattr(track, 'type', None) == 0 or "AUDIO" in str(getattr(track, 'type', '')).upper()
                if is_audio:
                    await lk.room.mute_published_track(
                        api.MuteRoomTrackRequest(
                            room=room_id,
                            identity=identity,
                            track_sid=track.sid,
                            muted=True
                        )
                    )
        return {"status": "success"}
    except Exception as e:
        print(f"Error muting participant {identity}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/meetings/{room_id}/video-off/{identity}")
async def disable_video_participant(room_id: str, identity: str, current_user: models.User = Depends(get_current_active_user), db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(models.Meeting.room_id == room_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    if current_user.id != meeting.host_id and current_user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Not authorized")
    
    try:
        async with api.LiveKitAPI(url=get_livekit_http_url(), api_key=LIVEKIT_API_KEY, api_secret=LIVEKIT_API_SECRET) as lk:
            participant = await lk.room.get_participant(
                api.RoomParticipantIdentity(room=room_id, identity=identity)
            )
            for track in participant.tracks:
                # Periksa apakah track video (int 1, atau string 'VIDEO')
                is_video = getattr(track, 'type', None) == 1 or "VIDEO" in str(getattr(track, 'type', '')).upper()
                if is_video:
                    await lk.room.mute_published_track(
                        api.MuteRoomTrackRequest(
                            room=room_id,
                            identity=identity,
                            track_sid=track.sid,
                            muted=True
                        )
                    )
        return {"status": "success"}
    except Exception as e:
        print(f"Error turning off video for participant {identity}: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/meetings/{room_id}/guest")
def get_guest_token(room_id: str, guest: schemas.GuestJoin, db: Session = Depends(get_db)):
    meeting = db.query(models.Meeting).filter(models.Meeting.room_id == room_id).first()
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    if meeting.is_locked:
        raise HTTPException(status_code=403, detail="Ruangan meeting ini sedang dikunci oleh Host.")
    
    guest_identity = f"guest_{uuid.uuid4().hex[:8]}"
    guest_name = f"{guest.name} ({guest.institution})"

    token = api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET) \
        .with_identity(guest_identity) \
        .with_name(guest_name) \
        .with_grants(api.VideoGrants(
            room_join=True,
            room=room_id,
            can_publish=True,
            can_subscribe=True,
            can_publish_data=True,
            can_update_own_metadata=True
        ))
    return {
        "token": token.to_jwt(),
        "server_url": get_livekit_ws_url(),
        "is_locked": bool(meeting.is_locked)
    }

