# Troubleshooting & Diagnostics Guide

Common diagnostic procedures, error resolutions, and operational solutions for **Minizoom**.

---

## 1. Browser Camera & Microphone Permissions

### Symptom:
- "Permission denied" or blank video feed during Pre-Join Lobby.

### Solution:
- Ensure the site is served over **HTTPS** (or `localhost`). Web browsers automatically block camera and mic access on non-secure HTTP origins.
- In Chrome/Edge, click the tune/padlock icon beside the URL bar and ensure **Camera** and **Microphone** permissions are set to **Allow**.

---

## 2. WebRTC Disconnects / Network Issues

### Symptom:
- Room drops connection or fails to subscribe to audio/video tracks.

### Solution:
- **LiveKit Cloud URL**: Verify your `.env` contains the correct `LIVEKIT_URL` starting with `wss://` (e.g. `wss://minizoom-xxxx.livekit.cloud`).
- **Corporate Firewalls / VPN**: If users are behind strict corporate firewalls, ensure outbound UDP traffic on WebRTC media ports (50000-60000) or TCP 443 fallback is permitted.

---

## 3. Database Locks & Auto-Migrations

### Symptom:
- Backend logs show `sqlite3.OperationalError: database is locked`.

### Solution:
- Minizoom uses `PRAGMA journal_mode=WAL` and `StaticPool` in `backend/database.py` to prevent locking. If running multiple backend replicas, ensure a single writer container or migrate to PostgreSQL.
- Database columns are auto-migrated on startup (`run_migrations()`). Never delete the `/app/data` volume if you want to preserve user accounts.

---

## 4. Rebuilding Docker Containers Without Cache

### Symptom:
- Code changes do not reflect after updating from git.

### Solution:
Clean Docker build caches safely:
```bash
sudo docker builder prune -f
sudo docker compose build --no-cache
sudo docker compose up -d
```
