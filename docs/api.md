# API Documentation (Minizoom Backend)

The backend is built with **FastAPI**. All endpoints returning JSON responses. Authenticated endpoints require a JWT Bearer token in the `Authorization` header.

## Authentication & User Management

### `POST /api/register`
- **Description**: Register a new user. The first user becomes superadmin.
- **Body**: `name`, `email`, `password`
- **Response**: User object. Triggers background notification emails/webhooks if the user is not the first superadmin.

### `POST /api/token`
- **Description**: Login to receive JWT token.
- **Body**: OAuth2 Password Request Form (`username`, `password`)
- **Response**: `{"access_token": "...", "token_type": "bearer", "user": {...}}`
- **Errors**: Returns 400 for incorrect credentials or if the account is still "pending".

### `GET /api/me`
- **Description**: Fetch current logged-in user details.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: User object.

## Meeting Management

### `GET /api/meetings`
- **Description**: Get all meetings hosted by the current user.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: List of Meeting objects.

### `POST /api/meetings`
- **Description**: Create an instant or scheduled meeting.
- **Headers**: `Authorization: Bearer <token>`
- **Body**: `title`, `scheduled_at` (optional)
- **Response**: Meeting object (contains `room_id`).

### `DELETE /api/meetings/{meeting_id}`
- **Description**: Delete a meeting from history.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{"ok": true}`

## LiveKit SFU Integration

### `POST /api/meetings/{room_id}/join`
- **Description**: Generate a LiveKit access token to join the WebRTC room.
- **Body**: `participant_name`
- **Response**: `{"token": "livekit_jwt_token"}`
- *Note*: If the user is logged in and is the host, the token will include `roomAdmin: true` grants.

### `POST /api/meetings/{room_id}/mute/{identity}`
### `POST /api/meetings/{room_id}/kick/{identity}`
### `POST /api/meetings/{room_id}/video-off/{identity}`
- **Description**: Host controls executed via LiveKit Server API.
- **Headers**: `Authorization: Bearer <token>`
- **Response**: `{"success": true}`

## Superadmin Dashboard

### `GET /api/admin/users/pending`
- **Description**: Get all users with "pending" status.

### `GET /api/admin/users/all`
- **Description**: Get all registered users.

### `POST /api/admin/users/{action}/{user_id}`
- **Description**: Approve or Reject a user account. Action: `approve` or `reject`.

### `POST /api/admin/users/role/{user_id}?role={new_role}`
- **Description**: Promote to admin or demote to user.

### `GET /api/admin/settings`
- **Description**: Fetch dynamic system settings (SMTP & Discord).

### `POST /api/admin/settings`
- **Description**: Update dynamic system settings.
