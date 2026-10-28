# Architecture & Flow Diagram (AFD) — Minizoom v1.6.0

Dokumen ini memvisualisasikan alur arsitektur, autentikasi, moderasi rapat, dan sinkronisasi data *real-time* pada **Minizoom**.

---

## 1. Alur Pendaftaran & Persetujuan Pengguna (User Lifecycle Flow)

```mermaid
flowchart TD
    A["Pengguna Baru Registrasi (/register)"] --> B["Rate Limiter Check (Max 5/5m)"]
    B --> C{"Apakah User Pertama di DB?"}
    C -- "Ya" --> D["Auto-Approve sebagai Superadmin"]
    C -- "Tidak" --> E["Simpan Status: Pending (Role: User)"]
    E --> F["Trigger BackgroundTasks"]
    F --> G["Kirim Email HTML Tersanitasi ke Superadmin"]
    F --> H["Kirim Discord Webhook Embed"]
    G & H --> I["Superadmin Klik Approve di Dashboard"]
    I --> J["Update Status: Approved"]
    J --> K["Kirim Email Welcome + Link Login (APP_PUBLIC_URL)"]
```

---

## 2. Alur Masuk Ruangan & Pre-Join Lobby (Room Join Flow)

```mermaid
flowchart TD
    U["Peserta Membuka /room/[id]"] --> T{"Ada JWT Token di LocalStorage?"}
    T -- "Ya (Host/User)" --> API1["GET /api/meetings/[id]/token"]
    T -- "Tidak (Tamu)" --> FORM["Form Nama & Instansi Tamu"]
    FORM --> API2["POST /api/meetings/[id]/guest (Rate Limited)"]
    API1 & API2 --> LOCK{"Apakah Ruangan Dikunci (is_locked)?"}
    LOCK -- "Ya & Bukan Host" --> ERR["HTTP 403: Ruangan Dikunci Host"]
    LOCK -- "Tidak / Adalah Host" --> LOBBY["Tampilkan PreJoinLobby"]
    LOBBY --> ENUM["Enumerate Camera & Microphone Devices"]
    ENUM --> JOIN["Klik Masuk ke Meeting"]
    JOIN --> LK["Koneksi WebRTC ke LiveKitRoom dengan Device ID Terpilih"]
```

---

## 3. Alur Sinkronisasi Kolaborasi Real-Time (DataChannel Flow)

| Paket DataChannel (`type`) | Pengirim | Penerima | Deskripsi |
| :--- | :--- | :--- | :--- |
| `reaction` | Semua Peserta | Semua Peserta | Menampilkan animasi floating emoji (`ReactionOverlay.tsx`). |
| `wb_draw` | Semua Peserta | Semua Peserta | Menggambar segmen garis ternormalisasi `(0..1)` di `WhiteboardModal.tsx`. |
| `wb_clear` | Host / Peserta (Konfirmasi) | Semua Peserta | Membersihkan kanvas dan riwayat goresan Whiteboard. |
| `wb_sync` | Host | Peserta Baru | Mengirim hingga 500 segmen goresan terakhir saat event `ParticipantConnected`. |
| `poll_new` | Host | Semua Peserta | Mempublikasikan pertanyaan polling baru ke tab Polls. |
| `poll_vote` | Semua Peserta | Semua Peserta | Memperbarui suara peserta pada opsi polling secara langsung. |
| `notes_sync` | Semua Peserta | Semua Peserta | Sinkronisasi *debounced* (500ms) catatan rapat bersama. |
| `state_sync` | Host | Peserta Baru | Mengirim daftar Polls aktif dan isi Shared Notes kepada peserta yang baru masuk. |
