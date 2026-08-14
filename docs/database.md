# Database Documentation (Minizoom)

Minizoom uses **SQLite** as its default database engine, managed through the **SQLAlchemy ORM** in the FastAPI backend. This allows for seamless migration to PostgreSQL or MySQL in production if needed.

## Schema Architecture

### 1. `users` Table
Stores all registered users and superadmins.
- `id` (Integer, Primary Key)
- `name` (String, Indexed)
- `email` (String, Unique, Indexed)
- `hashed_password` (String)
- `role` (String, Default: "user") - Can be "user" or "superadmin".
- `status` (String, Default: "pending") - Can be "pending" or "approved".

*Relationships:*
- A user can host multiple meetings (`meetings = relationship("Meeting", back_populates="host")`).

### 2. `meetings` Table
Stores scheduled and instant meetings created by users.
- `id` (Integer, Primary Key)
- `title` (String, Indexed)
- `room_id` (String, Unique, Indexed) - The LiveKit Room ID.
- `host_id` (Integer, ForeignKey to `users.id`)
- `scheduled_at` (DateTime, Default: UTC Now)
- `status` (String, Default: "scheduled")

*Relationships:*
- Belongs to a host (`host = relationship("User", back_populates="meetings")`).

### 3. `system_settings` Table
Stores global application settings configured dynamically via the Superadmin Dashboard.
- `id` (Integer, Primary Key)
- `smtp_server` (String)
- `smtp_port` (Integer, Default: 587)
- `smtp_username` (String)
- `smtp_password` (String)
- `smtp_from` (String, Default: "noreply@minizoom.local")
- `discord_webhook_url` (String)

## Initialization Strategy
When the backend starts (`main.py`), SQLAlchemy's `create_all()` method automatically generates the `.db` file and all tables if they do not exist.
The first user to register is automatically assigned the `superadmin` role and `approved` status. All subsequent users default to `user` role and `pending` status.
