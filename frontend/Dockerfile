FROM node:20-alpine

WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm install

COPY . .

RUN npm run build

# Menjalankan Next.js di port 3000 (menghindari port 5000 dan 2025-2028)
EXPOSE 3000
CMD ["npm", "start"]
