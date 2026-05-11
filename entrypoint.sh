#!/bin/sh

# Start scraper scheduler in background (fires daily at 07:00 Asia/Bangkok)
node dist/schedule.js 2>&1 &

# Start Express server in foreground
exec node dist/server/app.js
