<div align="center">

# 📹 Minizoom

**Self-Hosted, Lightweight & Modern Video Conferencing Platform**

*Enterprise-grade real-time meetings with zero bloat, centralized user management, and seamless WebRTC collaboration.*

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![LiveKit](https://img.shields.io/badge/LiveKit-WebRTC%20SFU-blue?style=for-the-badge&logo=webrtc&logoColor=white)](https://livekit.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Python](https://img.shields.io/badge/Python-3.11+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![PWA](https://img.shields.io/badge/PWA-Installable-purple?style=for-the-badge&logo=pwa&logoColor=white)](#-progressive-web-app-pwa)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

[Live Demo](https://zoom.minirack.my.id/) • [Architecture](docs/ARCHITECTURE.md) • [Deployment Guide](docs/DEPLOYMENT.md) • [Security](docs/SECURITY.md) • [Troubleshooting](docs/TROUBLESHOOTING.md)

</div>

---

## 📸 Product Screenshots & Showcase

<div align="center">

### 🖥️ Modern Dashboard & Personal Meeting Rooms
> Manage upcoming schedules, launch instant rooms, and copy permanent PMR links.
```
┌─────────────────────────────────────────────────────────────────────────────┐
│  📹 Minizoom   v1.5.0                                    [ habib frambudi ] │
│  ─────────────────────────────────────────────────────────────────────────  │
│  [ Personal Room ✦ ]  [ + Instant Meeting ]                                │
│                                                                             │
│  📅 Your Scheduled Meetings                                👥 User Approval │
│  ┌───────────────────────────────────────────────┐        ┌───────────────┐ │
│  │ 🟢 Weekly Sync Meeting (3 Online)  [Join]     │        │ 2 Pending     │ │
│  │ • Product Demo Q3                  [Join]     │        │ [Approve All] │ │
│  └───────────────────────────────────────────────┘        └───────────────┘ │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 🎭 Pre-Join Lobby & In-Meeting Collaboration
> Test camera feeds, monitor live microphone decibel levels, sketch on collaborative whiteboards, and launch live polls.

</div>

---

## ✨ Key Features

- **⚡ LiveKit Cloud / Self-Hosted SFU**: Ultra low-latency WebRTC audio and video streaming powered by Opus Codec and dynamic simulcasting.
- **🎭 Pre-Join Lobby & Device Tester**: Inspect camera preview, toggle audio/video, and observe real-time microphone volume meters before entering the room.
- **🎨 Collaborative Interactive Whiteboard**: In-room shared drawing canvas featuring pens, highlighters, erasers, color pickers, and one-click PNG export.
- **📊 Real-Time Live Polls & Voting**: Launch custom polls with live bar-chart percentage updates across all participants.
- **📝 In-Meeting Shared Notes**: Synchronized meeting minutes with plain text (.txt) export capability.
- **🛡️ Full Host Moderation Controls**: Meeting creators and superadmins can **Mute All**, mute individual participants, disable cameras, and kick users.
- **🔒 Room Lock Mechanism**: Host can lock meetings on-the-fly, restricting unwanted guest entries at the API level.
- **✋ Raise Hand & Floating Emoji Reactions**: Real-time animated emoji reactions (👍, ❤️, 👏, 🔥) and interactive hand-raise queue.
- **🎬 Client-Side Meeting Recorder**: Record screen and mixed meeting audio directly to high-definition `.webm` files on host device.
- **🔗 Personal Meeting Room (PMR)**: Static, permanent meeting links assigned per user for recurring ad-hoc meetings.
- **📶 Adaptive Low-Data Mode**: Bandwidth optimizer tailoring video streams for low-bandwidth cellular environments.
- **🔔 Web Audio Synthesizer**: Built-in sound chimes for join, leave, and new chat notifications without external audio assets.
- **📲 Progressive Web App (PWA)**: Installable directly on Android, iOS Safari, and Desktop PC with dedicated home-screen launching.
- **👥 Role-Based Access Control (RBAC)**: Centralized user approval pipeline with SMTP email alerts and Discord webhook integrations.

---

## 🏛️ System Architecture

```
                    Internet (HTTPS / WSS Port 443)
                               │
                               ▼
                        ┌─────────────┐
                        │    Nginx    │ (SSL Termination & Reverse Proxy)
                        └──────┬──────┘
                               │
                ┌──────────────┴──────────────┐
                ▼                             ▼
        ┌───────────────┐             ┌───────────────┐
        │    Next.js    │             │    FastAPI    │
        │ Frontend :3000│             │ Backend :8000 │
        └───────┬───────┘             └───────┬───────┘
                │                             │
                │ (WebRTC Media & Data)       ▼
                │                      ┌───────────────┐
                ▼                      │  SQLite DB    │
        ┌───────────────┐              │ (WAL Mode)    │
        │  LiveKit SFU  │              └───────────────┘
        │ (Cloud/Hosted)│
        └───────────────┘
```

> For deep architectural explanations, signaling flowcharts, and token lifecycle diagrams, refer to [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

---

## 💾 Database & Scalability Notes

Minizoom ships with **SQLite in WAL Mode** (*Write-Ahead Logging*) by default:
- **Zero Configuration**: Ideal for lightweight, single-host deployments, intranet clusters, and self-hosted environments.
- **Data Persistence**: Mapped to named volume `/app/data/minizoom.db` with safe automated column migrations across updates.
- **Production Concurrency**: Designed for small to medium-sized organizations, targeting **up to 50 concurrent participants** depending on server CPU, network NIC bandwidth, and SFU allocation.
- **Multi-Node Scaling**: For high-availability multi-instance setups, PostgreSQL can be configured seamlessly via `DATABASE_URL`.

---

## 🚀 Quick Start (Docker)

### 1. Clone Repository
```bash
git clone https://github.com/frambudi75/minizoom.git
cd minizoom
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your credentials in `.env`:
```env
SECRET_KEY=your_random_secret_key_here
LIVEKIT_URL=wss://your-livekit-server.livekit.cloud
LIVEKIT_API_KEY=your_api_key
LIVEKIT_API_SECRET=your_api_secret
```

### 3. Build & Run
```bash
sudo docker compose up -d --build
```

Access the application in your browser at `http://localhost:3000` (or your domain).

---

## 📚 Documentation Index

- [🏛️ System Architecture](docs/ARCHITECTURE.md) - Communication flow, token handshakes, and data models.
- [🚀 Production Deployment](docs/DEPLOYMENT.md) - Nginx reverse proxy, SSL certbot, and port forwarding.
- [🛡️ Security Architecture](docs/SECURITY.md) - Role-based authorization, JWT signing, and room privacy.
- [🔧 Troubleshooting Guide](docs/TROUBLESHOOTING.md) - Diagnostics for media permissions, network ICE, and Docker caches.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
