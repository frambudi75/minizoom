# Implementation & Deployment Plan (IPD) — Minizoom v1.6.0

Dokumen ini merangkum tahapan implementasi, struktur komponen modular, dan prosedur deployment produksi untuk **Minizoom v1.6.0**.

---

## 1. Struktur Proyek Terkini

```text
minizoom/
├── backend/
│   ├── auth.py               # JWT & Bcrypt authentication utilities
│   ├── database.py           # Dual SQLite WAL / PostgreSQL engine & auto-migrations
│   ├── discord_service.py    # Discord Webhook notification service
│   ├── email_service.py      # Sanitized HTML SMTP service (SSL 465 & STARTTLS 587)
│   ├── main.py               # FastAPI endpoints, rate limiter & LiveKit moderation
│   ├── models.py             # SQLAlchemy ORM models
│   ├── schemas.py            # Pydantic validation schemas
│   └── Dockerfile            # Python 3.11-slim Uvicorn + uvloop image
├── frontend/
│   ├── public/               # PWA manifest.json, sw.js & app icons
│   ├── src/
│   │   ├── app/              # Next.js App Router pages (/, /login, /register, /dashboard, /room/[id])
│   │   ├── components/room/  # Modular conference components:
│   │   │   ├── ParticipantSidebar.tsx
│   │   │   ├── PreJoinLobby.tsx
│   │   │   ├── ReactionOverlay.tsx
│   │   │   ├── RoomHeader.tsx
│   │   │   ├── SoundSynthesizer.ts
│   │   │   └── WhiteboardModal.tsx
│   │   └── lib/version.ts    # Centralized version constants (v1.6.0)
│   ├── next.config.mjs       # Standalone build & API proxy rewrites
│   └── Dockerfile            # Multi-stage Node 20 Alpine standalone runner
├── docs/                     # Complete engineering & operational documentation
├── .env.example              # Environment configuration template
└── docker-compose.yml        # Orchestration for backend, frontend & local LiveKit
```

---

## 2. Langkah Verifikasi & Build

1. **Verifikasi TypeScript (Frontend)**:
   ```bash
   cd frontend
   npx tsc --noEmit
   ```
2. **Build & Jalankan Container Docker**:
   ```bash
   cp .env.example .env
   docker compose up -d --build
   ```
3. **Pemeriksaan Endpoint Status Sistem**:
   ```bash
   curl http://localhost:8000/api/system/status
   ```
