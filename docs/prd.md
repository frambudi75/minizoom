# Product Requirements Document (PRD): Minizoom

## 1. Overview
Minizoom adalah aplikasi video conferencing berbasis web yang dirancang untuk menampung hingga 50 pengguna secara bersamaan. Aplikasi ini meniru fungsionalitas inti dari Zoom Meeting, lengkap dengan sistem manajemen pengguna dan penjadwalan.

## 2. Tujuan
Menyediakan platform meeting virtual yang stabil dengan kontrol akses terpusat, fitur esensial lengkap, dan manajemen pengguna berbasis persetujuan (approval).

## 3. Fitur Utama (MVP)

### A. Manajemen Pengguna & Akses (Baru)
1.  **Pendaftaran Akun (Registration)**:
    -   Pengguna baru bisa mendaftar akun, tetapi status awalnya adalah *Pending*.
    -   Akun *Pending* belum bisa digunakan untuk login atau membuat *room*.
2.  **Sistem Superadmin**:
    -   Terdapat *role* Superadmin.
    -   Superadmin bertugas menyetujui (Approve) atau menolak (Reject) pendaftaran akun baru.
3.  **Autentikasi (Login)**:
    -   Pengguna yang sudah di-*approve* dapat melakukan Login ke dalam sistem.

### B. Manajemen Meeting & Room (Baru)
1.  **Buat Room Instan**:
    -   Pengguna yang sudah login dapat langsung membuat *room* meeting baru saat itu juga.
2.  **Jadwalkan Meeting (Schedule)**:
    -   Pengguna dapat menjadwalkan meeting di masa depan (mengatur tanggal & waktu).
    -   Sistem akan menghasilkan Tautan/ID Meeting untuk dibagikan.

### C. Fitur Video Conference Inti
1.  **Video & Audio Conferencing**: Mendukung hingga 50 partisipan per *room*.
2.  **Screen Sharing**: Berbagi layar secara *real-time*.
3.  **Live Chat**: Pesan teks *real-time* di dalam *room*.
4.  **Recording (Perekaman)**: Host dapat merekam sesi meeting.

## 4. Batasan & Lingkup
- Kapasitas maksimal: 50 partisipan per *room*.
- Database: RDBMS (misal: PostgreSQL atau SQLite) untuk menyimpan data *user* dan *meeting*.
- Teknologi Utama: Python (Backend/FastAPI), WebRTC SFU (LiveKit), React (Frontend/Next.js).
