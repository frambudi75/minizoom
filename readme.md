<div align="center">

# 📹 Minizoom

### **Self-Hosted, Ultra-Lightweight & Enterprise Video Conferencing Platform**

*Production-ready video meetings with low-latency WebRTC SFU, Discord & SMTP smart notifications, governance approval workflows, and centralized user management.*

<br/>

[![Live Demo](https://img.shields.io/badge/LIVE%20DEMO-zoom.minirack.my.id-2563EB?style=for-the-badge&logo=google-chrome&logoColor=white)](https://zoom.minirack.my.id/)
[![Next.js](https://img.shields.io/badge/Next.js-16.3-black?style=for-the-badge&logo=next.js&logoColor=white)](https://nextjs.org/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.111-009688?style=for-the-badge&logo=fastapi&logoColor=white)](https://fastapi.tiangolo.com/)
[![LiveKit](https://img.shields.io/badge/LiveKit-WebRTC%20SFU-blue?style=for-the-badge&logo=webrtc&logoColor=white)](https://livekit.io/)
[![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![PWA](https://img.shields.io/badge/PWA-Installable-purple?style=for-the-badge&logo=pwa&logoColor=white)](#-progressive-web-app-pwa)
[![License: MIT](https://img.shields.io/badge/License-MIT-emerald?style=for-the-badge)](LICENSE)

<br/>

[✨ Features](#-key-features) • [🔔 Smart Notifications](#-smart-real-time-notifications) • [🛡️ Governance](#-enterprise-governance--user-lifecycle) • [🏛️ Architecture](#-system-architecture) • [🚀 Quick Start](#-quick-start-docker) • [📚 Docs](#-documentation-suite)

</div>

---

## 💡 Beyond Just Video: An Operational Platform

At first glance, Minizoom delivers a crisp, responsive video meeting interface. But under the hood, it is designed as a **complete self-hosted operational collaboration platform**:

```
[ New Registration ] ──► [ Discord Webhook Alert ] ──► [ Admin Approval ] ──► [ User Welcome Email ]
                                                                                   │
[ In-Meeting Controls ] ◄── [ Role Delegation & PMR ] ◄── [ JWT Auth Pipeline ] ◄──┘
```

- **Enterprise Governance**: Superadmin approval workflows, role delegation, and user lifecycle controls.
- **Smart Push Alerts**: Discord Webhooks and SMTP emails keep administrators updated without constantly monitoring the dashboard.
- **Modern WebRTC SFU**: LiveKit SFU engine with Pre-Join Lobby device testing, adaptive low-data optimizer, and client-side screen recording.

---

## 🔔 Smart Real-Time Notifications

Minizoom provides background notification services that bridge your video platform directly to your team's operational tools:

### 1. 👾 Discord Webhooks
Receive instant rich embeds in your Discord channels whenever important platform events occur:
- **New User Registrations**: Displays the user's name and email with an alert that approval is required.
- **Diagnostic Test Events**: 1-click test button from the dashboard to verify webhook endpoints instantly.

### 2. 📧 Automated SMTP Email Pipeline
Built-in email dispatch supporting **Port 465 (Implicit SSL)** and **Port 587 / 25 (STARTTLS)**:
- **Superadmin Registration Alerts**: Notifies administrators when a new user registers.
- **User Approval Confirmation**: Automatically sends newly approved users a welcome email with a direct 1-click login button.
- **In-App SMTP Testing**: Integrated test email feature with detailed error diagnostics right in the Settings UI.

---

## 🛡️ Enterprise Governance & User Lifecycle

- **Bootstrap Superadmin**: The very first registered account automatically claims Superadmin privileges.
- **Registration Approval Flow**: Subsequent accounts remain in `pending` status until reviewed by a Superadmin.
- **Role Delegation**: Promote regular users to administrators or demote them on-the-fly.
- **Admin Password Reset**: Superadmins can securely reset passwords for any user directly from the User Management table.
- **Safe Cascading Deletion**: Deleting a user account automatically purges their associated meeting history and persistent PMR rooms.
- **Dedicated "My Profile" Tab**: Self-service profile updates, secure personal password changes, and 1-click Personal Meeting Room (PMR) link sharing.

---

## 🏛️ System Architecture

```
                                 [ Users / Browsers ]
                                          │
                        (HTTPS / WSS Port 443 - Public Internet)
                                          │
                                          ▼
                                ┌───────────────────┐
                                │   Reverse Proxy   │
                                │   (Nginx / Caddy) │
                                └─────────┬─────────┘
                                          │
                     ┌────────────────────┴────────────────────┐
                     │                                         │
        (HTTP / Internal Port 3000)               (HTTP / Internal Port 8000)
                     ▼                                         ▼
           ┌──────────────────┐                      ┌──────────────────┐
           │ Next.js Frontend │                      │ FastAPI Backend  │
           │  (App Router)    │                      │  (ASGI / uvloop) │
           └─────────┬────────┘                      └────┬────────┬────┘
                     │                                    │        │
                     │ (MediaStream WebRTC)    (SMTP/SSL) │        │ (Webhooks)
                     ▼                                    ▼        ▼
           ┌──────────────────┐                      ┌────────┐ ┌─────────┐
           │   LiveKit SFU    │                      │  SMTP  │ │ Discord │
           │  (Cloud / Host)  │                      │ Server │ │ Webhook │
           └──────────────────┘                      └────────┘ └─────────┘
```

---

## ✨ Key Features

| Feature | Description |
| :--- | :--- |
| **⚡ LiveKit WebRTC SFU** | Ultra low-latency (<200ms) video & Opus audio streaming with adaptive simulcast. |
| **🎭 Pre-Join Lobby** | Live camera preview, microphone input device picker, and real-time audio volume visualizer. |
| **🔔 Smart Notifications** | Automated Discord Webhooks and multi-port SMTP email notifications (Port 465 SSL & 587 TLS). |
| **🛡️ Admin Moderation** | Complete host controls: **Mute All**, disable participant video, lock room, and kick participants. |
| **🔗 Personal Meeting Room (PMR)** | Static permanent meeting link assigned per user for recurring ad-hoc meetings. |
| **📶 Adaptive Low-Data Mode** | Dynamic bitrate throttle for constrained cellular networks and poor connections. |
| **🎬 Meeting Recorder** | Client-side mixed audio & video screen capture downloaded directly as `.webm`. |
| **🎨 Floating Emoji Reactions** | Real-time emoji reaction animations (👍, ❤️, 👏, 😂, 🎉, 🔥, 🚀) via WebRTC Data Channels. |
| **📲 Progressive Web App (PWA)** | Installable native app experience on Android, iOS Safari, and Desktop PC. |
| **👥 Centralized RBAC** | User approval workflow, password reset modal, cascading deletion, and profile manager. |

---

## 💾 Database & Concurrency Architecture

- **SQLite WAL Mode (Default)**: Preconfigured with `PRAGMA journal_mode=WAL` and `/app/data` Docker volume persistence.
  - *Zero Video Load*: Database queries only execute during initial authentication and token signing. Active meeting media flows entirely in-memory through the WebRTC SFU.
  - *Capacity*: Handles **up to 50 concurrent participants** per room with minimal CPU and memory footprints (<1GB RAM).
- **Multi-Node PostgreSQL Support**: Switch seamlessly to **PostgreSQL** by updating the `DATABASE_URL` in `.env` without altering application code.

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
docker compose up -d --build
```

Access Minizoom at `http://localhost:3000` (or your reverse proxy domain).

---

## 📚 Documentation Suite

- 🏛️ [System Architecture](docs/ARCHITECTURE.md) - Architectural breakdown, data flow, and token lifecycle.
- 🚀 [Production Deployment](docs/DEPLOYMENT.md) - Nginx reverse proxy configuration, SSL Certbot, and port forwarding.
- 🛡️ [Security Architecture](docs/SECURITY.md) - RBAC policies, JWT signing, and room privacy models.
- 🔧 [Troubleshooting Guide](docs/TROUBLESHOOTING.md) - Diagnostics for media permissions, network ICE, and Docker caches.
- 📝 [Release Changelog](docs/CHANGELOG.md) - Full version release history from v1.0.0 to v1.5.0.

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
