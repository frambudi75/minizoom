# Security Architecture & Policies

This document outlines the security architecture, authorization models, credential isolation, and best practices implemented in **Minizoom**.

---

## 1. Authentication & Role-Based Access Control (RBAC)

### User Hierarchy:
- **Superadmin**: Full administrative authority. Approves new user registrations, modifies SMTP/Discord configurations, views system metrics, and moderates all conference rooms.
- **User (Approved)**: Authenticated room host. Can schedule meetings, start instant rooms, invite guests, launch polls, and moderate their own rooms.
- **Pending User**: Registered accounts awaiting superadmin authorization. Restricted from initiating meetings or generating tokens.
- **Guest**: Link-based participants entering with Name and Institution. Permissions are confined to the specific room ID they joined.

---

## 2. Token Security & Cryptographic Signing

1. **JWT Auth Tokens**:
   - Cryptographically signed with SHA-256 HMAC (`HS256`) using the server's private `SECRET_KEY`.
   - Payload contains user identity and expiration timestamps (`exp`).

2. **LiveKit Access Tokens**:
   - Signed using `LIVEKIT_API_KEY` and `LIVEKIT_API_SECRET`.
   - Explicit `VideoGrants` enforce granular permissions (`room_admin`, `can_publish`, `can_subscribe`, `can_publish_data`).
   - Host tokens grant room moderation privileges while guest tokens are strictly scoped to participant-level actions.

---

## 3. Room Privacy & Room Lock Mechanism

- **Room Locking**: When a Host triggers `Lock Room`, the backend flags `is_locked = True`.
- **Enforcement**: Any subsequent token generation request for guests or non-host users is rejected with `HTTP 403 Forbidden` directly at the API gateway layer before any WebRTC signaling occurs.

---

## 4. Credential Management & Database Isolation

- **Zero Hardcoded Secrets**: All API keys, tokens, and database credentials are fully decoupled into `.env` files which are excluded from version control via `.gitignore`.
- **Database Sanitization**: SQLite database files and runtime caches are explicitly excluded from Docker build layers (`.dockerignore`) to prevent accidental image exposure.
