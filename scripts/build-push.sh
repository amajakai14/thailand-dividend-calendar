#!/bin/bash
set -euo pipefail

IMAGE="ghcr.io/amajakai14/thailand-dividend-calendar:latest"

echo "==> Logging into GHCR..."
echo "$(gh auth token)" | docker login ghcr.io -u amajakai14 --password-stdin

echo "==> Building Docker image (linux/amd64)..."
docker buildx build --platform linux/amd64 -t "$IMAGE" --push .

echo ""
echo "✅ Image pushed: $IMAGE"
echo "   Now run on VPS: ssh root@74.208.18.52 'bash /opt/vps-deploy.sh'"
