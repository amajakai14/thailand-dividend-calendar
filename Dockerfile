FROM node:22-bookworm-slim

# Playwright system deps
RUN apt-get update && apt-get install -y \
    libnss3 libnspr4 libatk1.0-0 libatk-bridge2.0-0 libcups2 \
    libdrm2 libxkbcommon0 libxcomposite1 libxdamage1 libxfixes3 \
    libxrandr2 libgbm1 libasound2 libxshmfence1 libgles2 libx11-6 \
    libxcb1 libxext6 fonts-liberation wget ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Root deps + install Playwright Chromium
COPY package*.json ./
RUN npm ci
RUN npx playwright install chromium

# Build React client
COPY client/package*.json ./client/
RUN npm ci --prefix client
COPY client/ ./client/
RUN npm run build --prefix client

# Source
COPY src/ ./src/
COPY server/ ./server/
COPY tsconfig.json ./

RUN mkdir -p data

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
