# Backend Design Specification (BDS) — Minizoom v1.6.0

Dokumen ini merinci spesifikasi desain layanan backend **Minizoom** yang dibangun menggunakan **FastAPI**, **SQLAlchemy**, dan **LiveKit Server SDK**.

---

## 1. Struktur Modul Backend (`backend/`)

| File | Tanggung Jawab Utama |
| :--- | :--- |
| `main.py` | Entrypoint FastAPI, routing API, middleware CORS, *in-memory rate limiter*, manajemen user/meeting, masking pengaturan SMTP, dan integrasi LiveKit Server API. |
| `database.py` | Inisialisasi engine SQLAlchemy dengan dukungan ganda: **SQLite WAL (`StaticPool`)** dan **PostgreSQL (`pool_pre_ping`)**, serta migrasi skema otomatis (`run_migrations()`). |
| `models.py` | Definisi model ORM SQLAlchemy: `User`, `Meeting`, dan `SystemSettings`. |
| `schemas.py` | Validasi request/response Pydantic v2 (`UserCreate`, `MeetingResponse`, `SystemSettingsCreate`, dll.). |
| `auth.py` | Hashing password dengan `bcrypt` dan pembuatan/verifikasi token JWT (`HS256`). |
| `email_service.py` | Layanan pengiriman email SMTP (`Port 465 SSL` & `Port 587 STARTTLS`) dengan sanitasi `html.escape()` dan dukungan `APP_PUBLIC_URL`. |
| `discord_service.py` | Layanan pengiriman notifikasi rich embed ke Discord melalui HTTP Webhook. |

---

## 2. Mekanisme Keamanan Backend

1. **In-Memory Sliding Window Rate Limiter**:
   - Menggunakan struktur data `defaultdict(list)` dengan `time.monotonic()` untuk membatasi percobaan per IP (`X-Forwarded-For` aware):
     - `register`: Maksimal 5 request / 300 detik.
     - `login`: Maksimal 10 request / 60 detik.
     - `guest_join`: Maksimal 20 request / 60 detik.
2. **Masking Kredensial (`SMTP_PASSWORD_MASK`)**:
   - Endpoint `GET /api/admin/settings` selalu mengembalikan `"********"` apabila `smtp_password` terisi di database.
   - Saat admin menyimpan pengaturan baru atau menekan tombol **Test SMTP Email** tanpa mengubah nilai `"********"`, backend secara otomatis mengambil password asli dari database.
3. **Otorisasi Bertingkat (Dependency Injection)**:
   - `get_current_user`: Memvalidasi JWT Bearer token.
   - `get_current_active_user`: Memastikan `user.status == "approved"`.
   - `get_current_superadmin`: Memastikan `user.role == "superadmin"`.
