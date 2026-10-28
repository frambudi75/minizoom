# Coding & Operational Rules — Minizoom

Dokumen ini mendefinisikan standar pengembangan, keamanan, dan arsitektur untuk proyek **Minizoom**.

## 1. Standar Arsitektur
- **Frontend (`frontend/`)**: Menggunakan Next.js App Router (TypeScript + Tailwind CSS). Komponen ruang rapat disimpan secara modular di `frontend/src/components/room/`.
- **Backend (`backend/`)**: Menggunakan FastAPI + SQLAlchemy. Koneksi database mendukung mode ganda:
  - **SQLite (Default)**: Menggunakan `StaticPool` dan `PRAGMA journal_mode=WAL` pada direktori persisten `/app/data/minizoom.db`.
  - **PostgreSQL (Multi-Node)**: Otomatis aktif apabila `DATABASE_URL` diawali dengan `postgresql://`.
- **Media Server**: Seluruh aliran audio/video WebRTC ditangani oleh **LiveKit SFU**, bukan melalui database atau FastAPI.

## 2. Aturan Keamanan (Security Rules)
- **Sanitasi Input**: Semua input pengguna yang dimasukkan ke dalam template email HTML wajib disanitasi menggunakan `html.escape()`.
- **Proteksi Kredensial**:
  - `smtp_password` tidak boleh dikembalikan dalam bentuk *plaintext* pada endpoint `GET /api/admin/settings` (gunakan masking `********`).
  - Jangan pernah melakukan commit file `.env`, `*.db`, atau `venv/` ke dalam repositori Git.
- **Rate Limiting**: Endpoint publik (`/api/login`, `/api/register`, `/api/meetings/{room_id}/guest`) dilindungi oleh *rate limiter* berbasis IP untuk mencegah *brute-force* dan spam notifikasi.
- **Otorisasi Host**: Kontrol moderasi ruangan (`mute`, `mute-all`, `video-off`, `kick`, `lock`) wajib memverifikasi bahwa pemanggil adalah `host_id` pemilik ruangan atau `superadmin`.

## 3. Kualitas Kode & Build
- Pastikan `npx tsc --noEmit` berjalan bersih dengan **0 error** sebelum melakukan perubahan produksi.
- Gunakan satu file konfigurasi Next.js (`frontend/next.config.mjs`) dengan `output: 'standalone'` untuk efisiensi ukuran image Docker.

