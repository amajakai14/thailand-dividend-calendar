#!/bin/bash
set -euo pipefail

APP_DIR="/opt/th-div-calendar"

echo "==> Pulling latest code..."
cd "$APP_DIR"
git pull origin master

echo "==> Installing dependencies..."
npm install

echo "==> Building client..."
cd client && npm install && npm run build && cd ..

echo "==> Restarting server..."
systemctl restart th-div-server

echo "✅ Deploy done."
systemctl status th-div-server --no-pager -l
