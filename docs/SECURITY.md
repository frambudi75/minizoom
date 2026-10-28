# Security Architecture & Policies

This document outlines the security architecture, authorization models, credential isolation, and best practices implemented in **Minizoom v1.6.0**.

---

## 1. Authentication & Role-Based Access Control (RBAC)

### User Hierarchy:
- **Superadmin**: Full administrative authority. Approves new user registrations, modifies SMTP/Discord configurations, views system metrics, resets passwords, and moderates all conference rooms.
- **User (Approved)**: Authenticated room host. Can schedule meetings, start instant rooms, manage their Personal Meeting Room (PMR), invite guests, launch polls, and moderate their own rooms.
- **Pending User**: Registered accounts awaiting superadmin authorization. Restricted from logging in, initiating meetings, or generating tokens.
- **Guest**: Link-based participants entering with Name and Institution. Permissions are confined to participant-level actions within the specific room ID they joined.

---

## 2. Token Security & Cryptographic Signing

1. **JWT Auth Tokens**:
   - Cryptographically signed with SHA-256 HMAC (`HS256`) using the server's private `SECRET_KEY`.
   - Passwords hashed using `bcrypt` with automatic salt generation.
   - Payload contains normalized lowercase user email (`sub`) and expiration timestamps (`exp`).

2. **LiveKit Access Tokens**:
   - Signed using `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`.
   - Explicit `VideoGrants` enforce granular permissions (`room_admin`, `can_publish`, `can_subscribe`, `can_publish_data`, `can_update_own_metadata`).
   - Host tokens grant room moderation privileges while guest tokens are strictly scoped to participant-level actions.

---

## 3. API Rate Limiting & Abuse Prevention

- **In-Memory IP Rate Limiter (`check_rate_limit`)**:
  - `POST /api/login`: Limited to **10 requests per 60 seconds** per IP to mitigate credential stuffing and brute-force attacks.
  - `POST /api/register`: Limited to **5 requests per 5 minutes** per IP to prevent automated account creation and SMTP/Discord notification flooding.
  - `POST /api/meetings/{room_id}/guest`: Limited to **20 requests per 60 seconds** per IP to prevent token exhaustion.
  - Respects `X-Forwarded-For` headers when deployed behind Nginx/Caddy reverse proxies.

---

## 4. Input Sanitization & Credential Masking

- **HTML Escaping in Emails**: All user-supplied strings (`name`, `email`, `smtp_server`, `smtp_username`) are sanitized with Python's `html.escape()` before being interpolated into HTML email templates (`backend/email_service.py`), preventing HTML/XSS injection in administrator email clients.
- **SMTP Password Masking**: The `GET /api/admin/settings` and `POST /api/admin/settings` endpoints mask `smtp_password` as `"********"`. When administrators update non-password fields or trigger a test email, the backend transparently uses the stored password without exposing it over the network.

---

## 5. Room Privacy & Room Lock Mechanism

- **Room Locking**: When a Host triggers `Lock Room`, the backend flags `is_locked = True`.
- **Enforcement**: Any subsequent token generation request for guests or non-host users is rejected with `HTTP 403 Forbidden` directly at the API gateway layer before any WebRTC signaling occurs.
- **Whiteboard Protection**: Non-host participants must confirm before clearing the shared whiteboard canvas, while Hosts automatically synchronize whiteboard strokes, polls, and shared notes to newly connected participants.

---

## 6. Credential Management & Database Isolation

- **Zero Hardcoded Secrets**: All API keys, tokens, public URLs (`APP_PUBLIC_URL`), and database credentials are decoupled into `.env` files excluded from version control via `.gitignore`.
- **Database Sanitization**: SQLite database files (`*.db`, `*.db-wal`, `*.db-shm`), archives (`*.zip`), and virtual environments (`venv/`) are explicitly excluded from Git and Docker build contexts (`.dockerignore`).
