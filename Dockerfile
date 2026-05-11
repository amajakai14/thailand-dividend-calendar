# Stage 1: Build React client
FROM node:22-slim AS client-build
WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci
COPY client/ ./
RUN npm run build

# Stage 2: Build production node_modules (native compilation happens here, not in final image)
FROM node:22-slim AS prod-deps
WORKDIR /app
COPY package*.json ./
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && npm ci --omit=dev \
    && rm -rf /var/lib/apt/lists/*

# Stage 3: Compile TypeScript
FROM node:22-slim AS ts-build
WORKDIR /app
COPY package*.json ./
RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ \
    && npm ci \
    && rm -rf /var/lib/apt/lists/*
COPY tsconfig.json ./
COPY src/ ./src/
COPY server/ ./server/
RUN npx tsc -p tsconfig.json && npx tsc -p server/tsconfig.json

# Stage 4: Production runtime (no build tools)
FROM node:22-slim AS production
WORKDIR /app

COPY --from=prod-deps /app/node_modules ./node_modules
RUN ./node_modules/.bin/playwright install chromium --with-deps

COPY --from=ts-build /app/dist ./dist
COPY --from=client-build /app/client/dist ./client/dist

RUN mkdir -p data logs

COPY entrypoint.sh ./
RUN chmod +x entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
