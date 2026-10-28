# Technical Requirements Document (TRD) — Minizoom v1.6.0

Dokumen ini mendefinisikan spesifikasi teknis perangkat lunak, protokol komunikasi, dan standar performa **Minizoom v1.6.0**.

---

## 1. Spesifikasi Stack Teknologi

| Lapisan | Teknologi | Versi / Konfigurasi |
| :--- | :--- | :--- |
| **Frontend Framework** | Next.js (App Router) + React | Next.js 16 / React 19 (`output: 'standalone'`) |
| **WebRTC Client SDK** | `@livekit/components-react` + `livekit-client` | Adaptive Stream & Dynacast Enabled |
| **Styling & Icons** | Tailwind CSS + `lucide-react` | Enterprise Dark Obsidian Palette |
| **Backend Framework** | FastAPI + Uvicorn | Python 3.11+, ASGI `uvloop` + `httptools` |
| **Database & ORM** | SQLAlchemy 2.0 | SQLite WAL (Default) / PostgreSQL Compatible |
| **Authentication** | PyJWT + Bcrypt | `HS256` Bearer Token (24h expiry) |
| **Media Server (SFU)** | LiveKit Server / LiveKit Cloud | WebSocket Signaling + WebRTC UDP/TCP |

---

## 2. Spesifikasi Teknis Fitur Ruang Rapat

1. **Pre-Join Lobby (`PreJoinLobby.tsx`)**:
   - Meminta izin `getUserMedia` untuk kamera & mikrofon.
   - Mendeteksi daftar perangkat (`enumerateDevices()`) dan menyediakan pemilihan perangkat `videoinput` dan `audioinput` secara langsung.
   - Menganalisis frekuensi suara mikrofon secara *real-time* menggunakan `AudioContext` + `AnalyserNode` (`fftSize = 64`).
2. **Adaptive Low-Data Mode (`RoomHeader.tsx` & `room/[id]/page.tsx`)**:
   - Mode Normal: Resolusi capture default `1280x720` (HD) dengan simulcast.
   - Mode Low-Data: Menurunkan resolusi capture ke `480x360` untuk menghemat bandwidth seluler.
3. **Interactive Whiteboard (`WhiteboardModal.tsx`)**:
   - Menyimpan koordinat garis dalam rasio ternormalisasi `(0.0 - 1.0)` terhadap dimensi kanvas agar akurat di berbagai ukuran layar.
   - Mendukung event Mouse (`onMouseDown/Move/Up`) dan Touch (`onTouchStart/Move/End` dengan `touch-action: none`).
   - Menyinkronkan hingga 500 segmen terakhir (`wb_sync`) secara otomatis saat peserta baru bergabung.
4. **Client-Side Meeting Recorder (`ParticipantSidebar.tsx`)**:
   - Menggabungkan audio layar (`getDisplayMedia`) dan audio mikrofon (`getUserMedia`) melalui `AudioContext.createMediaStreamDestination()`.
   - Merekam menggunakan `MediaRecorder` (`video/webm;codecs=vp9,opus` atau `vp8,opus`) dan mengunduh file `.webm` secara lokal di browser Host tanpa membebani CPU server.
