# Production Deployment & Setup Guide

This guide covers production deployment configurations, domain setup, reverse proxy, SSL certification, and firewall rules for **Minizoom**.

---

## 1. System Requirements

| Specification | Minimum | Recommended |
| :--- | :--- | :--- |
| **CPU** | 1 vCPU | 2+ vCPU |
| **RAM** | 1 GB | 2+ GB |
| **Disk** | 10 GB SSD | 20+ GB SSD |
| **OS** | Ubuntu 22.04 LTS / Debian 12 | Ubuntu 24.04 LTS / Docker Host |
| **Network** | 10 Mbps Uplink | 100+ Mbps Uplink |

---

## 2. Environment Configuration (`.env`)

Clone the repository and copy `.env.example`:
```bash
git clone https://github.com/frambudi75/minizoom.git
cd minizoom
cp .env.example .env
```

Configure your environment variables in `.env`:
```env
# Security Secrets
SECRET_KEY=generate_a_secure_random_64_character_string

# LiveKit Media Server Credentials (LiveKit Cloud or Self-Hosted)
LIVEKIT_URL=wss://your-project.livekit.cloud
LIVEKIT_API_KEY=your_livekit_api_key
LIVEKIT_API_SECRET=your_livekit_api_secret

# Database URL
DATABASE_URL=sqlite:////app/data/minizoom.db
```

---

## 3. Nginx Reverse Proxy & SSL Setup

For production, route incoming HTTPS traffic to the Next.js container (Port 3000) and ensure WebSocket headers are upgraded:

```nginx
server {
    server_name zoom.yourdomain.com;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    listen 443 ssl http2;
    ssl_certificate /etc/letsencrypt/live/zoom.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/zoom.yourdomain.com/privkey.pem;
}
```

Obtain a free SSL certificate with Let's Encrypt / Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d zoom.yourdomain.com
```

---

## 4. Firewall & Port Configuration

| Port | Protocol | Purpose | Access |
| :--- | :--- | :--- | :--- |
| **80** | TCP | HTTP (Redirect to HTTPS) | Public |
| **443** | TCP | HTTPS & WSS (Web Traffic) | Public |
| **7880** | TCP | LiveKit Signaling (If Self-Hosted) | Public |
| **7881** | TCP | LiveKit WebRTC TCP (Fallback) | Public |
| **50000-60000** | UDP | LiveKit WebRTC Media Traffic | Public |

*(Note: If using **LiveKit Cloud**, media routing ports are managed automatically by LiveKit's global Anycast infrastructure, requiring only outbound HTTPS/WSS on your server).*

---

## 5. Docker Deployment Execution

Build and run in detached mode:
```bash
sudo docker compose up -d --build
```

Verify running containers:
```bash
sudo docker compose ps
```

View backend logs:
```bash
sudo docker compose logs -f backend
```
