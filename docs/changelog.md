# Changelog

All notable changes to the Minizoom project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.6.0] - 2026-10-28

### Added
- **Pre-Join Lobby Camera & Microphone Picker**: Added live hardware device enumeration (`navigator.mediaDevices.enumerateDevices()`) with real-time camera & microphone selection dropdowns before entering a meeting.
- **Interactive Whiteboard Touch & Late-Joiner Sync**:
  - Full mobile/tablet touch drawing support (`onTouchStart`, `onTouchMove`, `onTouchEnd` with `touch-none`).
  - Persistent stroke history across modal open/close and window resizing.
  - Automatic `wb_sync` broadcast when new participants join an active room.
  - Confirmation prompt for non-host participants before clearing the shared canvas.
- **Late-Joiner State Synchronization (`state_sync`)**: Hosts automatically broadcast active **Live Polls** and **Shared Meeting Notes** to newly connected participants via WebRTC DataChannel.
- **API Rate Limiting**: Added IP-based in-memory rate limiting on `/api/login` (10 req/min), `/api/register` (5 req/5 min), and `/api/meetings/{room_id}/guest` (20 req/min) to prevent brute-force attacks and notification spam.
- **Dual Database Engine Support**: Enhanced `backend/database.py` to automatically switch between SQLite WAL (`StaticPool`) and PostgreSQL/MySQL connection pooling (`pool_pre_ping`) based on `DATABASE_URL`.
- **Comprehensive Engineering Documentation Suite**: Added `docs/AFD.md`, `docs/BDS.md`, `docs/DBD.md`, `docs/IPD.md`, `docs/TRD.md`, and `docs/rules.md`.

### Changed
- **Modularized Room Frontend Architecture**: Extracted monolithic `frontend/src/app/room/[id]/page.tsx` into modular components under `frontend/src/components/room/` (`PreJoinLobby`, `WhiteboardModal`, `ParticipantSidebar`, `ReactionOverlay`, `RoomHeader`, `SoundSynthesizer`).
- **Dynamic Public URL in Emails**: Replaced hardcoded login links in approval emails with `APP_PUBLIC_URL` environment variable.

### Security
- **Email HTML Escaping**: Added `html.escape()` sanitization across all SMTP email templates in `backend/email_service.py` to prevent HTML injection.
- **SMTP Password Masking**: Masked `smtp_password` as `"********"` in `GET /api/admin/settings` responses while preserving saved credentials when updating or testing SMTP settings.

---

## [1.5.0] - 2026-08-30

### Added
- **User Deletion**: Superadmins can permanently delete user accounts and automatically cascade-delete their associated rooms.
- **Admin Password Reset**: Superadmins can set new passwords for any user directly from the User Management table via a secure modal.
- **Account Profile Management ("My Profile")**:
  - Dedicated profile tab in the dashboard for all accounts (Users & Superadmins).
  - Ability to update full name and change personal passwords with current password verification.
  - Displays account statistics: total meetings hosted and direct Personal Meeting Room (PMR) link copying.
- **User Approval Email Notifications**: Automatically sends an email notification to newly approved users with a direct login link upon admin approval.
- **Centralized Versioning**: Created centralized version constants (`frontend/src/lib/version.ts` and `backend/main.py`) ensuring uniform build date and version tags across Landing Page, Navbar, Login, Register, Dashboard, and System Status API.
- **Progressive Web App (PWA)**: Added web app manifest (`manifest.json`), service worker (`sw.js`), and installable app icons (`192px`, `512px`, `maskable`).
- **Security & Troubleshooting Documentation**: Added `docs/SECURITY.md` and `docs/TROUBLESHOOTING.md`.

---

## [1.4.0] - 2026-08-29

### Added
- **Pre-Join Lobby & Device Tester**: Real-time camera preview, microphone input device selector, and live Web Audio volume visualizer before entering the room.
- **Adaptive Low-Data Mode**: Dynamic bandwidth toggle for constrained mobile networks and low latency.
- **Floating Emoji Reactions**: Real-time reactions (👍, ❤️, 👏, 😂, 🎉, 🔥, 🚀) broadcasted via LiveKit WebRTC Data Channel with smooth CSS float animations.
- **Personal Meeting Rooms (PMR)**: Permanent dedicated meeting rooms per user.
- **Database Persistence & Concurrency**: SQLite configured with `PRAGMA journal_mode=WAL` and persistent Docker volume storage mapped to `/app/data`.

### Changed
- **Clean Enterprise Dark Theme**: Replaced neon purple/pink gradients with a professional Deep Charcoal Obsidian (`#0b0f19`) and Electric Blue (`#2563eb`) palette across all interfaces.
- **Responsive Mobile Layout**: Fixed participant drawer overlapping video tiles on mobile viewport.

---

## [1.0.0] - 2026-08-14

### Added
- **LiveKit Integration**: Replaced local mesh WebRTC with LiveKit SFU for scalable video conferencing up to 50+ users.
- **User Management**: Superadmin role and approval workflow for new account registrations.
- **Role Delegation**: Superadmins can promote regular users to admin status or demote them.
- **Guest Access**: External participants can join a room via URL by providing their Name and Institution.
- **Host Controls**: Moderation controls for Hosts/Superadmins to remotely mute, stop video, lock room, and kick participants.
- **SMTP Email Notifications**: Automated background emails sent to Superadmins upon new user registration.
- **Discord Webhook Integration**: Automated background Discord embed notifications.
- **In-App Settings UI**: Dynamic configuration for SMTP and Discord Webhooks from the Dashboard.
- **Documentation**: Comprehensive PRD, Architecture, Database, API, UI/UX, and Deployment guides in `docs/`.
