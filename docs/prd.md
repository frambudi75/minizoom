# Product Requirements Document (PRD): Minizoom

## 1. Overview / Product Vision
**Minizoom** adalah aplikasi video conferencing berbasis web *self-hosted* yang ringan, cepat, dan elegan. Dirancang untuk meniru fungsionalitas esensial Zoom Meeting namun dalam ekosistem yang terpusat dan sepenuhnya berada dalam kendali *host* atau *server* pribadi. 
Tujuan utama aplikasi ini adalah memberikan solusi komunikasi *real-time* (video, audio, chat, dan *screen sharing*) yang mumpuni untuk tim, komunitas, atau instansi berskala menengah (hingga 50 peserta) tanpa perlu berlangganan layanan *cloud* pihak ketiga yang mahal, dengan kontrol kepatuhan (approval) ketat pada pendaftaran pengguna.

## 2. User & Target Audience
- **Superadmin (System Administrator)**: Pengguna yang memiliki kekuasaan penuh untuk mengelola pengguna lain (Approve/Reject pendaftaran), melihat daftar seluruh *user* yang terdaftar, dan melakukan promosi jabatan akun menjadi sesama admin.
- **Admin / Host**: Pengguna terdaftar yang telah disetujui (Approved). Mereka dapat membuat *room* instan, menjadwalkan *meeting*, mengontrol jalannya *meeting* (Mute, mematikan kamera, Kick partisipan), dan melihat riwayat *meeting* mereka.
- **Guest (Tamu / Klien / Peserta Umum)**: Pengguna eksternal yang tidak memiliki akun di sistem Minizoom. Mereka cukup mengklik tautan *meeting*, memasukkan Nama dan Instansi, lalu langsung tergabung ke dalam sesi tanpa repot mendaftar.

## 3. Functional Requirements
### A. Manajemen Pengguna & Otorisasi
- **Registration with Approval**: Pendaftar baru tidak bisa langsung login; status mereka adalah *Pending* hingga di-*Approve* oleh Superadmin.
- **Role Management**: Superadmin dapat mendelegasikan perannya dengan mempromosikan pengguna biasa menjadi admin (Make Admin) atau menurunkannya kembali (Demote to User).
- **Dashboard Superadmin**: Tampilan daftar seluruh pengguna yang terdaftar beserta status (Pending/Active) dan peran mereka.

### B. Notifikasi Sistem
- **SMTP Email Notifications**: Sistem mengirim email otomatis ke seluruh Superadmin setiap kali ada pengguna baru yang mendaftar dan menunggu persetujuan.
- **Discord Webhook**: Mengirim notifikasi dalam bentuk *embed* ke saluran (channel) Discord saat ada pengguna baru yang mendaftar.

### C. Manajemen Meeting
- **Instant Meeting**: Membuat *room* saat ini juga dan langsung bergabung.
- **Scheduled Meeting**: Menjadwalkan rapat di waktu mendatang dengan tautan yang dapat dibagikan.
- **Meeting Management**: Host dapat menyalin tautan dan menghapus riwayat rapat yang sudah selesai di Dashboard.

### D. Fitur Konferensi Inti (WebRTC)
- **Audio & Video**: Transmisi media *real-time* dengan kualitas tinggi.
- **Screen Sharing**: Berbagi layar ke semua peserta.
- **Text Chat**: Obrolan berbasis teks secara *real-time* di dalam *room*.
- **Guest Join**: Tamu dapat masuk hanya menggunakan URL dan mengisi formulir (Nama, Instansi).
- **Absolute Host Controls**: Host/Superadmin memiliki kontrol untuk "Mute" *microphone*, mematikan Video secara paksa (*Stop Vid*), dan menendang (Kick) partisipan secara sepihak.

## 4. Non-Functional Requirements
- **Scalability**: Menggunakan *LiveKit SFU (Selective Forwarding Unit)* yang mampu menampung ratusan pengguna, namun *room* dibatasi secara teknis untuk 50 peserta demi menjaga efisiensi bandwidth pada *self-hosting*.
- **Performance**: Transmisi media *low-latency* karena WebRTC yang dimediasi oleh SFU Server (bukan P2P). Tampilan Dashboard harus *fast-loading* (kurang dari 2 detik) menggunakan Next.js App Router dan *React Server Components*.
- **Security**: Endpoint API diproteksi oleh JWT (*JSON Web Tokens*). Fitur konferensi diamankan menggunakan sistem *Access Token* khas LiveKit di mana hanya peserta yang memiliki *token* otentik (baik *guest* maupun *host*) yang bisa terkoneksi ke *WebSocket*.
- **Availability**: Aplikasi disebarkan melalui Docker Container agar portabel, terisolasi, dan dijamin *always-online* (`restart: unless-stopped`).

## 5. User Flow / UX Requirements
- **Alur Tamu (Guest Flow)**: Tamu membuka URL -> Tampil halaman persiapan (Cek Kamera/Mic) dan *input* Nama + Instansi -> Masuk *room* -> Muncul di Sidebar peserta lain dengan format `Nama (Instansi)`.
- **Alur Pendaftar (Sign-Up Flow)**: Pengguna mengisi Form Pendaftaran -> Dialihkan ke Halaman Login dengan *toast* "Menunggu Approval" -> Superadmin mendapat Notif Email & Discord -> Superadmin Login dan tekan "Approve" di Dashboard -> Pengguna bisa Login.
- **Alur Host (Host Flow)**: Login -> Dashboard -> Klik "Instant Meeting" -> Masuk *room* -> Tampil kontrol khusus *Host* di *sidebar* untuk me-Mute/Kick tamu.
- **UX UI Behavior**: Antarmuka bergaya modern, ringan (*Light/Dark theme opsional*), menggunakan aset *lucide-react* ikon, dengan animasi transisi mikro saat menekan tombol, dan notifikasi (toast) untuk setiap *action*.

## 6. Technical Requirements / Architecture
- **Frontend Stack**: Next.js 14+ (App Router), React, Tailwind CSS, *lucide-react*, LiveKit Components (`@livekit/components-react`).
- **Backend Stack**: Python 3.11+, FastAPI, SQLAlchemy, PyJWT, Passlib, Python built-in `smtplib` & `urllib`.
- **Media Server Engine**: LiveKit Cloud / LiveKit OSS Server via koneksi WebSocket SFU.
- **Database**: SQLite (Default / MVP) dengan arsitektur ORM sehingga mudah dipindah (*scalable*) ke PostgreSQL.
- **Deployment**: Docker dan Docker Compose. API berjalan di belakang Uvicorn. Konfigurasi kredensial ditangani menggunakan *Environment Variables* (`.env`).

## 7. Acceptance Criteria / Definition of Done
1. **User Registration & Email**: Seorang pengguna mengisi form -> *Background task* terpicu tanpa *delay* di UI -> Email dan Discord Webhook terkirim sempurna -> Data masuk DB status 'Pending'.
2. **Superadmin Dashboard**: Superadmin membuka *tab* Users -> Tampil tabel daftar seluruh akun -> Tombol 'Make Admin' ditekan -> Tabel langsung (*optimistic UI*) terbarui dan database terganti.
3. **Guest Join**: Tamu mengakses `/room/{id}` tanpa token JWT *Local Storage* -> Mengisi Nama -> Berhasil merender video tanpa terputus.
4. **Host Command Execution**: Host menekan tombol 'Stop Vid' di *sidebar* -> API `/api/meetings/{room_id}/video-off/{identity}` menerima request -> Video target langsung tertutup di layar semua orang.
5. **Code & Quality**: Seluruh repositori bersih dari *error build TypeScript* `Next.js` dan bisa berjalan mulus dengan eksekusi `docker compose up -d --build`.
