FROM node:20-alpine AS deps
WORKDIR /app
# Copy package files dulu (layer ini di-cache Docker jika package.json tidak berubah)
COPY package.json package-lock.json* ./
RUN npm ci --frozen-lockfile

# ---- Build stage ----
FROM node:20-alpine AS builder
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
# Ambil node_modules dari layer deps (sudah ter-cache)
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

# ---- Production stage (image final yang ringan) ----
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

# Hanya copy file yang dibutuhkan untuk production
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000
# Jalankan server Next.js standalone (lebih kecil dan cepat dari npm start)
CMD ["node", "server.js"]
