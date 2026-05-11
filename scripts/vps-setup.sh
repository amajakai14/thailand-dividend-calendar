#!/bin/bash
set -euo pipefail

IMAGE="ghcr.io/amajakai14/thailand-dividend-calendar:latest"
DOMAIN="div.kritsquest.website"
EMAIL="amajakai14@gmail.com"
DATA_DIR="/opt/th-div-data"
ENV_FILE="/opt/th-div.env"

echo "==> Installing packages..."
apt update && apt upgrade -y
apt install -y docker.io nginx certbot python3-certbot-nginx

echo "==> Enabling Docker..."
systemctl enable --now docker

echo "==> Creating data directory..."
mkdir -p "$DATA_DIR"

echo "==> Creating env file..."
cat > "$ENV_FILE" << 'ENVEOF'
PORT=3000
JWT_SECRET=CHANGE_ME
VAPID_PUBLIC_KEY=CHANGE_ME
VAPID_PRIVATE_KEY=CHANGE_ME
VAPID_EMAIL=mailto:amajakai14@gmail.com
ENVEOF

echo ""
echo "⚠️  Fill in $ENV_FILE with real secrets now."
echo "   nano $ENV_FILE"
echo "   Press Enter when done..."
read -r

echo "==> Pulling Docker image (package must be public on ghcr.io)..."
docker pull "$IMAGE"

echo "==> Starting container..."
docker rm -f th-div 2>/dev/null || true
docker run -d \
  --name th-div \
  --restart always \
  -p 127.0.0.1:3000:3000 \
  -v "$DATA_DIR":/app/data \
  --env-file "$ENV_FILE" \
  "$IMAGE"

echo "==> Configuring nginx..."
cat > /etc/nginx/sites-available/th-div-calendar << 'NGINXEOF'
server {
    listen 80;
    server_name div.kritsquest.website;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
NGINXEOF

ln -sf /etc/nginx/sites-available/th-div-calendar /etc/nginx/sites-enabled/th-div-calendar
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx

echo "==> Getting SSL certificate..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL"

echo ""
echo "✅ Done: https://$DOMAIN"
echo "   Logs: docker logs -f th-div"
