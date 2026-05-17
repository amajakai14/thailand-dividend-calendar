#!/bin/bash
set -euo pipefail

mkdir -p /app/data

# Scraper scheduler (background)
node_modules/.bin/ts-node src/schedule.ts &

# Express server (foreground)
exec node_modules/.bin/ts-node -P server/tsconfig.json server/src/app.ts
