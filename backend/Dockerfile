FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

# Menjalankan uvicorn di port 8000 (menghindari port 5000 dan 2025-2028)
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
