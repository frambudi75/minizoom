# API Documentation (Minizoom Backend v1.6.0)

The backend is built with **FastAPI**. All endpoints return JSON responses. Authenticated endpoints require a JWT Bearer token in the `Authorization: Bearer <token>` header.

---

## 1. System & Health

### `GET /api/system/status`
- **Description**: Returns server health, application version (`1.6.0`), build date, LiveKit SFU mode, and enabled feature list.

---

## 2. Authentication & Profile Management

### `POST /api/register`
- **Rate Limit**: 5 requests per 5 minutes per IP.
- **Description**: Register a new user. The very first registered user in an empty database is automatically approved as `superadmin`. Subsequent users are set to `pending` status and trigger background SMTP & Discord notifications.
- **Body**: `{"name": "Budi", "email": "budi@example.com", "password": "..."}`
- **Response**: `UserResponse` (`id`, `name`, `email`, `role`, `status`).

### `POST /api/login`
- **Rate Limit**: 10 requests per 60 seconds per IP.
- **Description**: Authenticate via OAuth2 form data (`username`, `password`) and receive a JWT access token.
- **Response**: `{"access_token": "...", "token_type": "bearer"}`
- **Errors**: `400` for invalid credentials or `pending` account approval; `429` if rate limit exceeded.

### `GET /api/me`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Fetch current authenticated and approved user details.

### `GET /api/user/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Returns profile details along with `pmr_room_id` and `total_meetings` hosted.

### `POST /api/user/profile`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{"name": "...", "current_password": "...", "new_password": "..."}`
- **Description**: Update user display name and/or change password (requires verifying `current_password`).

---

## 3. Meeting & Room Management

### `GET /api/meetings`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: List meetings hosted by the current user (or all meetings if `superadmin`), enriched with real-time `active_participants` counts queried from LiveKit SFU.

### `POST /api/meetings/instant`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Create an active instant meeting with a unique UUID `room_id`.

### `POST /api/meetings/schedule`
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `{"title": "Weekly Sync", "scheduled_at": "2026-10-30T09:00:00Z"}`
- **Description**: Schedule a future meeting room.

### `GET /api/meetings/pmr`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Retrieve or auto-provision the user's permanent Personal Meeting Room (`pmr-{user_id}`).

### `DELETE /api/meetings/{room_id}`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Delete a meeting room (Host or Superadmin only).

### `POST /api/meetings/{room_id}/lock`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Toggle room lock status (`is_locked`). When locked, guests and non-host users cannot request join tokens.

---

## 4. LiveKit SFU & In-Meeting Host Controls

### `GET /api/meetings/{room_id}/token`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Generate a signed LiveKit JWT token for a logged-in user. Grants `room_admin=True` if the user is the room host or a superadmin.
- **Response**: `{"token": "...", "server_url": "wss://...", "is_locked": false, "is_host": true}`

### `POST /api/meetings/{room_id}/guest`
- **Rate Limit**: 20 requests per 60 seconds per IP.
- **Body**: `{"name": "Budi Santoso", "institution": "PT Maju Jaya"}`
- **Description**: Generate a participant-scoped LiveKit JWT token for an unauthenticated guest (`guest_<hex>`). Rejects with `403` if the room is locked.

### `POST /api/meetings/{room_id}/mute-all`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Remotely mutes all non-host audio tracks in the room via LiveKit Server API.

### `POST /api/meetings/{room_id}/mute/{identity}`
### `POST /api/meetings/{room_id}/video-off/{identity}`
### `POST /api/meetings/{room_id}/kick/{identity}`
- **Headers**: `Authorization: Bearer <token>`
- **Description**: Host moderation endpoints to mute a specific participant's microphone, turn off their camera track, or remove them from the room.

---

## 5. Superadmin Governance & System Settings

### `GET /api/admin/users/pending`
### `GET /api/admin/users/all`
- **Headers**: `Authorization: Bearer <token>` (Superadmin only)
- **Description**: List pending or all registered user accounts.

### `POST /api/admin/users/approve/{user_id}`
- **Headers**: `Authorization: Bearer <token>` (Superadmin only)
- **Description**: Approve a pending user account and dispatch a welcome email with a login link (`APP_PUBLIC_URL/login`).

### `POST /api/admin/users/role/{user_id}?role={user|superadmin}`
- **Headers**: `Authorization: Bearer <token>` (Superadmin only)
- **Description**: Promote a user to `superadmin` or demote to `user`.

### `POST /api/admin/users/{user_id}/reset-password`
- **Headers**: `Authorization: Bearer <token>` (Superadmin only)
- **Body**: `{"new_password": "..."}`
- **Description**: Force-reset a user's password.

### `DELETE /api/admin/users/{user_id}`
- **Headers**: `Authorization: Bearer <token>` (Superadmin only)
- **Description**: Permanently delete a user and cascade-delete all their hosted meetings.

### `GET /api/admin/settings`
### `POST /api/admin/settings`
- **Headers**: `Authorization: Bearer <token>` (Superadmin only)
- **Description**: Read or update SMTP and Discord Webhook settings. Note: `smtp_password` is masked as `"********"` in GET/POST responses to prevent plaintext credential exposure.

### `POST /api/admin/settings/test-email`
### `POST /api/admin/settings/test-discord`
- **Headers**: `Authorization: Bearer <token>` (Superadmin only)
- **Description**: Dispatch diagnostic test notifications to verify SMTP and Discord Webhook configurations.
