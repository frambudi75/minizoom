# Architecture Document: Minizoom

## 1. High-Level Architecture

Minizoom dibangun menggunakan pola arsitektur Client-Server yang sekarang dilengkapi dengan layer Database untuk manajemen sistem, serta integrasi layanan WebRTC SFU.

1.  **Frontend (Client)**: Menangani antarmuka pengguna (UI), *state* aplikasi, sistem *login/register*, *dashboard* untuk penjadwalan meeting, dan koneksi WebRTC ke SFU.
2.  **Backend (API & Database Layer)**: 
    - Menangani logika bisnis inti (Otentikasi JWT, CRUD Akun, CRUD Meeting, Approval Superadmin).
    - Berinteraksi dengan **Database** relasional untuk menyimpan status akun dan jadwal meeting.
    - Menghasilkan token partisipan untuk masuk ke Media Server.
3.  **Media Server (SFU)**: Menangani *routing* WebRTC (video, audio, screen sharing, chat) antar peserta.
4.  **Recording Service**: Layanan yang merender *room* dan menyimpan hasilnya (MP4).

## 2. Technology Stack Terpilih

*   **Backend**: **Python + FastAPI**
    *   *Database ORM*: **SQLAlchemy** (memudahkan query dan manajemen skema database).
    *   *Database Engine*: **SQLite** (untuk versi awal/pengembangan lokal), bisa di-*upgrade* ke **PostgreSQL** untuk *production*.
    *   *Autentikasi*: **PyJWT** & **Passlib** untuk *hashing password* dan sesi *login*.
*   **Media Server**: **LiveKit (Open Source SFU)**
    *   Mengatur seluruh *traffic* media secara mandiri agar Backend tidak kelebihan beban.
*   **Frontend**: **Next.js (React) + LiveKit React Components**

## 3. Alur Kerja (Workflow) Baru

1.  **Pendaftaran & Approval**:
    *   User -> Register (Status: Pending) -> Disimpan ke Database.
    *   Superadmin -> Login -> Melihat daftar akun Pending -> Klik Approve.
    *   User (Approved) -> Bisa Login menggunakan JWT Token.
2.  **Dashboard & Penjadwalan**:
    *   User (Login) masuk ke Dashboard.
    *   Bisa klik "Buat Room Sekarang" atau "Jadwalkan Meeting".
    *   Data jadwal (Jam, Tanggal, Room ID) disimpan di Database.
3.  **Memulai Meeting**:
    *   Saat jam meeting tiba (atau room instan), Backend membuat *room* di LiveKit via API.
    *   Backend memberikan *Access Token* LiveKit kepada peserta agar bisa *connect* ke LiveKit Server.
