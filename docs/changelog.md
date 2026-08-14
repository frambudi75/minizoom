# Changelog

All notable changes to the Minizoom project will be documented in this file.

## [1.0.0] - 2026-08-14

### Added
- **LiveKit Integration**: Replaced local WebRTC with LiveKit Cloud/OSS for scalable SFU video conferencing up to 50 users.
- **User Management**: Added Superadmin role and Approval workflow for new account registrations.
- **Role Delegation**: Superadmins can now promote regular users to admin status, or demote them.
- **Guest Access**: External users can join a room via URL by simply providing their Name and Institution.
- **Host Controls**: Absolute moderation controls added for Hosts/Superadmins to remotely Mute, Stop Video, and Kick participants.
- **SMTP Email Notifications**: Automated background emails sent to Superadmins upon new user registration.
- **Discord Webhook**: Automated background Discord embed notifications sent to a configured channel.
- **In-App Settings UI**: Superadmins can dynamically configure SMTP and Discord Webhook credentials directly from the Dashboard without touching `.env`.
- **Modern UI Redesign**: Overhauled the frontend with a dark-themed, glassmorphic design using Tailwind CSS and Lucide React.
- **Documentation**: Comprehensive PRD, Architecture, Database, API, UI/UX, and Deployment docs added to the `docs/` folder.
