# StreamBrws — Deployment Guide

## Quick Start (Local Dev)

```bash
# 1. Clone and install
git clone https://github.com/your-org/streaming-browser && cd streaming-browser
cp .env.example .env  # fill in secrets
yarn install

# 2. Start Postgres + Redis
cd apps/backend && docker compose up postgres redis -d && cd ../..

# 3. Run DB migrations & seed
yarn workspace @streambrws/backend db:generate
yarn workspace @streambrws/backend db:migrate:dev
yarn workspace @streambrws/backend db:seed

# 4. Start backend
yarn dev:backend   # http://localhost:4000

# 5. Start mobile (Expo)
yarn dev:mobile    # scan QR with Expo Go

# 6. Start Tizen dev server
yarn dev:tizen     # http://localhost:3000
```

## Production Docker Deployment

```bash
cd apps/backend
# Set env vars in .env or pass via --env-file
docker compose --env-file ../../.env up -d --build
```

## Building the Tizen Widget Package (.wgt)

```bash
# 1. Build the web app
yarn build:tizen   # outputs to apps/tizen/dist/

# 2. Copy config.xml into dist/
cp apps/tizen/public/config.xml apps/tizen/dist/

# 3. Package with Tizen CLI (requires Samsung Tizen Studio)
tizen package -t wgt -s "your-profile" -- apps/tizen/dist/
# Produces: StreamBrws.wgt

# 4. Install on device/emulator
tizen install -n StreamBrws.wgt -t <device-id>
```

## Building the React Native App

```bash
# Android (Expo EAS)
yarn workspace @streambrws/mobile build:android

# iOS (Expo EAS — requires Apple Dev account)
yarn workspace @streambrws/mobile build:ios
```

## Environment Variables Reference

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Access token signing secret (64+ chars) |
| `JWT_REFRESH_SECRET` | ✅ | Refresh token signing secret (64+ chars) |
| `PORT` | ❌ | API port (default 4000) |
| `CORS_ORIGIN` | ❌ | Comma-separated allowed origins |
| `REDIS_URL` | ❌ | Redis URL for rate limiting |
| `BCRYPT_ROUNDS` | ❌ | bcrypt cost factor (default 12) |
| `EXPO_PUBLIC_API_BASE_URL` | Mobile | Backend API URL for Expo builds |
| `VITE_API_BASE_URL` | Tizen | Backend API URL for Tizen build |

## API Endpoints

### Auth
| Method | Path | Description |
|---|---|---|
| POST | `/api/auth/register` | Create account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/refresh` | Rotate tokens |
| POST | `/api/auth/logout` | Revoke refresh token |

### Profile (requires Bearer token)
| Method | Path | Description |
|---|---|---|
| GET | `/api/profile` | Full user profile + settings |
| PATCH | `/api/profile` | Update display name / avatar |
| PUT | `/api/profile/service-toggles` | Update service on/off |
| POST | `/api/profile/sync` | Full bidirectional sync |
| GET | `/api/profile/safe-feed` | Safe-Feed config |
| PATCH | `/api/profile/safe-feed` | Update Safe-Feed config |
| POST | `/api/profile/safe-feed/pin` | Set PIN |
| POST | `/api/profile/safe-feed/verify-pin` | Verify PIN |
| POST | `/api/profile/exclusions/tags` | Add exclusion tag |
| DELETE | `/api/profile/exclusions/tags/:id` | Remove exclusion tag |
| GET | `/api/profile/exclusions/hidden-titles` | List hidden titles |
| POST | `/api/profile/exclusions/hidden-titles` | Hide a title |
| DELETE | `/api/profile/exclusions/hidden-titles/:id` | Unhide a title |

## Health Check

`GET /health` → `{ "ok": true, "status": "healthy", "timestamp": "..." }`
