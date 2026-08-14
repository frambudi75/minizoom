# Deployment & Infrastructure (Minizoom)

Minizoom is designed to be easily deployed on any Linux VPS or cloud instance using **Docker** and **Docker Compose**.

## Container Architecture
The `docker-compose.yml` orchestrates two main services:
1. **Backend (`minizoom-backend`)**: Python FastAPI running on port 8000 via Uvicorn.
2. **Frontend (`minizoom-frontend`)**: Next.js Node server running on port 3000.

Both services are connected via a default Docker bridge network. 

## Environment Variables
The application requires several environment variables to function correctly. These should be placed in a `.env` file at the root directory alongside `docker-compose.yml`.

```env
# Required LiveKit Configuration
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
LIVEKIT_URL=wss://your-livekit-server.cloud
```

*Note: SMTP and Discord Webhook configurations are handled via the Superadmin Dashboard UI and saved into the SQLite database, removing the need for manual `.env` updates for notifications.*

## Deployment Steps

1. **Transfer Files**: Use WinSCP or `rsync` to move the source code to your remote VPS.
2. **Configure `.env`**: Create the `.env` file with your LiveKit credentials.
3. **Build & Run**:
   ```bash
   docker compose up -d --build
   ```
4. **Reverse Proxy (Nginx)**: 
   It is highly recommended to put Nginx in front of the Next.js frontend (port 3000) and FastAPI backend (port 8000) to handle SSL/HTTPS via Let's Encrypt. WebRTC (LiveKit) requires a secure context (HTTPS) to access the camera and microphone in modern browsers.

## Data Persistence
The SQLite database (`minizoom.db`) is generated inside the `backend` directory. In the `docker-compose.yml`, the `./backend` directory is mounted as a volume (`- ./backend:/app`). This ensures that user data, meeting history, and system settings persist even if the container is destroyed or rebuilt.
