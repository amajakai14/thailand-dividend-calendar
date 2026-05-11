#!/bin/bash
set -euo pipefail

IMAGE="ghcr.io/amajakai14/thailand-dividend-calendar:latest"
DATA_DIR="/opt/th-div-data"
ENV_FILE="/opt/th-div-calendar/.env"

echo "==> Pulling latest image..."
docker pull "$IMAGE"

echo "==> Restarting container..."
docker stop th-div 2>/dev/null || true
docker rm th-div 2>/dev/null || true
docker run -d \
  --name th-div \
  --restart always \
  -p 127.0.0.1:3000:3000 \
  -v "$DATA_DIR":/app/data \
  --env-file "$ENV_FILE" \
  "$IMAGE"

echo "==> Pruning old images..."
docker image prune -f

echo "✅ Deploy done."
docker ps --filter name=th-div
