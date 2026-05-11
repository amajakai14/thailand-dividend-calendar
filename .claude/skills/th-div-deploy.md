# th-div-deploy

Deploy the th-div-calendar web application to VPS.

## Full deploy (code changed)

Run these three steps in order:

```bash
# 1. Build Docker image and push to GHCR
bash scripts/build-push.sh

# 2. Sync deploy script to VPS (do this whenever scripts/vps-deploy.sh changes)
scp scripts/vps-deploy.sh root@74.208.18.52:/opt/vps-deploy.sh

# 3. Pull new image and restart container on VPS
ssh root@74.208.18.52 'bash /opt/vps-deploy.sh'
```

## Quick redeploy (no code change, just restart)

```bash
ssh root@74.208.18.52 'bash /opt/vps-deploy.sh'
```

## Key paths on VPS

| Path | Purpose |
|------|---------|
| `/opt/vps-deploy.sh` | Deploy script (pulled from `scripts/vps-deploy.sh`) |
| `/opt/th-div-calendar/.env` | Environment variables (VAPID keys, JWT secret, etc.) |
| `/opt/th-div-data/` | Persistent SQLite DB volume (`dividends.db`) |

## Container config

```
Name:    th-div
Port:    127.0.0.1:3000 → 3000
Restart: always
Env:     /opt/th-div-calendar/.env
Volume:  /opt/th-div-data → /app/data
Image:   ghcr.io/amajakai14/thailand-dividend-calendar:latest
```

## Check container health

```bash
ssh root@74.208.18.52 'docker ps --filter name=th-div && docker logs th-div --tail 30'
```

## Notes

- `build-push.sh` handles GHCR login automatically via `gh auth token`
- `vps-deploy.sh` prunes old dangling images after deploy (saves ~1GB+)
- Always sync `vps-deploy.sh` to VPS after editing `scripts/vps-deploy.sh` locally
