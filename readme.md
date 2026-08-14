# Minizoom

Minizoom is a self-hosted, lightweight video conferencing application designed for up to 50 concurrent participants. It mimics the core functionality of Zoom, equipped with a centralized user management system, role-based access control, scheduling, and notifications.

## Features

- **Guest Access**: External users can join instantly via link by entering their Name and Institution.
- **Host Controls**: Meeting creators (or Superadmins) have absolute power to Mute Microphones, Turn Off Cameras, and Kick participants.
- **User Management**: Built-in approval system where Superadmins can approve pending registrations and promote other users to admin status.
- **Instant & Scheduled Meetings**: Create ad-hoc rooms or schedule meetings for later.
- **Real-Time Notifications**: Automatically sends SMTP Emails and Discord Webhook alerts to Superadmins whenever a new user registers.
- **LiveKit Powered**: Uses LiveKit SFU (WebRTC) for high-performance audio, video, and screen sharing.

## Tech Stack

- **Frontend**: Next.js (React), Tailwind CSS, LiveKit Components
- **Backend**: FastAPI (Python), SQLAlchemy, SQLite (default)
- **Media Server**: LiveKit Cloud / LiveKit Open Source
- **Containerization**: Docker Compose

## Quick Start (Docker)

1. Clone the repository:
   ```bash
   git clone https://github.com/frambudi75/minizoom.git
   cd minizoom
   ```

2. Configure environment variables in a `.env` file (or directly in `docker-compose.yml`):
   ```env
   # LiveKit Credentials
   LIVEKIT_API_KEY=your_api_key
   LIVEKIT_API_SECRET=your_api_secret
   LIVEKIT_URL=wss://your-livekit-server
   ```
   *(Note: SMTP and Discord Webhook configurations can be set directly from the Superadmin Dashboard UI in the Settings tab!)*

3. Build and start the containers:
   ```bash
   docker compose up -d --build
   ```

4. Open your browser and navigate to `http://localhost:3000` (or your domain).

## Initial Setup

The very first user who registers an account will automatically be approved and assigned the `superadmin` role. All subsequent registrations will be set to `pending` until approved by a superadmin.
