#!/bin/bash
set -euo pipefail

REPO="https://github.com/amajakai14/thailand-dividend-calendar.git"
APP_DIR="/opt/th-div-calendar"
DOMAIN="div.kritsquest.website"
EMAIL="amajakai14@gmail.com"

echo "==> Updating system..."
apt update && apt upgrade -y

echo "==> Installing base packages..."
apt install -y curl git nginx certbot python3-certbot-nginx

echo "==> Installing Node.js 22.x..."
curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
apt install -y nodejs

echo "==> Cloning repository..."
if [ -d "$APP_DIR/.git" ]; then
  echo "   Repo already exists at $APP_DIR — skipping clone."
else
  git clone "$REPO" "$APP_DIR"
fi
cd "$APP_DIR"

echo "==> Installing npm dependencies..."
npm install

echo "==> Installing Playwright Chromium + system deps..."
npx playwright install chromium --with-deps

echo "==> Building React client..."
cd client && npm install && npm run build && cd ..

echo ""
echo "==> Creating .env — fill in real values before continuing..."
cat > "$APP_DIR/.env" << 'ENVEOF'
PORT=3000
JWT_SECRET=CHANGE_ME_replace_with_long_random_string
VAPID_PUBLIC_KEY=CHANGE_ME
VAPID_PRIVATE_KEY=CHANGE_ME
VAPID_EMAIL=mailto:amajakai14@gmail.com
ENVEOF

echo "   Edit now: nano $APP_DIR/.env"
echo "   Press Enter when done..."
read -r

echo "==> Installing systemd services..."
cp "$APP_DIR/systemd/th-div-server.service" /etc/systemd/system/
cp "$APP_DIR/systemd/th-div-scraper.service" /etc/systemd/system/
cp "$APP_DIR/systemd/th-div-scraper.timer" /etc/systemd/system/
systemctl daemon-reload

echo "==> Configuring nginx..."
mkdir -p /etc/nginx/sites-available /etc/nginx/sites-enabled
cp "$APP_DIR/nginx/th-div-calendar.conf" /etc/nginx/sites-available/th-div-calendar
ln -sf /etc/nginx/sites-available/th-div-calendar /etc/nginx/sites-enabled/th-div-calendar
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl enable --now nginx

echo "==> Obtaining SSL certificate via certbot..."
certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos -m "$EMAIL"

echo "==> Starting services..."
systemctl enable --now th-div-server
systemctl enable --now th-div-scraper.timer

echo ""
echo "✅ Setup complete: https://$DOMAIN"
echo "   Server logs : journalctl -u th-div-server -f"
echo "   Scraper logs: journalctl -u th-div-scraper -f"
echo "   Timer status: systemctl list-timers th-div-scraper.timer"
