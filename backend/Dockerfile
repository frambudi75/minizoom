FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Salin semua file kecuali database (sudah di-handle oleh .dockerignore)
COPY . .

# Buat folder /app/data untuk menyimpan database secara persisten
# Folder ini akan di-mount sebagai Docker volume sehingga data tidak hilang saat rebuild
RUN mkdir -p /app/data

# Jalankan uvicorn dengan multiple workers untuk performa lebih baik
# --workers 4 = 4 proses paralel (gunakan rumus: (2 x CPU) + 1)
# --loop uvloop = event loop paling cepat untuk Python async
# SQLite tidak aman dengan multiple workers (setiap worker = proses terpisah = lock konflik)
# Gunakan 1 worker untuk SQLite. WAL mode sudah cukup untuk concurrent reads.
# Jika ingin multi-worker, ganti database ke PostgreSQL.
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "1", "--loop", "uvloop"]
