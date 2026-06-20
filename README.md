# 🎬 StreamBrws — Full-Stack Streaming Browser

> **Your feed. Your rules.** Aggregate, filter, and browse streaming libraries across Netflix, Hulu, HBO Max, Disney+, Prime Video, Apple TV+, Paramount+, Peacock, Showtime, and Starz — with global exclusion tags, per-title hiding, Safe-Feed PIN lock, and real-time cloud sync.

---

## 📁 Monorepo Structure

```
streaming-browser/
├── packages/
│   ├── shared-types/       # TypeScript interfaces shared across all apps
│   ├── shared-logic/       # API client, Zustand reducers, filter utils, sync
│   └── ui-tokens/          # Burgundy theme: colors, typography, spacing, Tizen focus ring
│
├── apps/
│   ├── mobile/             # React Native (Expo) — Android + iOS
│   ├── tizen/              # Tizen Web App — Samsung projectors/TVs
│   └── backend/            # Node.js/Express API + Prisma + PostgreSQL
│
├── .env.example
├── DEPLOYMENT.md
└── package.json            # Yarn workspaces monorepo root
```

---

## 🎨 Theme

All UIs use the **Burgundy Theme** (`#1A0008` → `#990038` scale) with gold accents (`#D4AF37`). The Tizen app uses a 1.6× typography scale for projector-scale readability.

---

## ✨ Features

| Feature | Mobile | Tizen |
|---|---|---|
| Aggregated browse across 10 services | ✅ | ✅ |
| Service on/off toggles | ✅ | ✅ |
| Global exclusion tags (horror, violence, etc.) | ✅ | ✅ |
| Per-title hiding (long-press → Hide) | ✅ | ✅ |
| Hidden title search behavior toggle | ✅ | ✅ |
| Safe-Feed Mode with PIN lock | ✅ | ✅ |
| Safe-Feed unlock (numeric keypad) | ✅ | ✅ |
| Cloud sync of all settings | ✅ | ✅ |
| Offline-first local state (MMKV / localStorage) | ✅ | ✅ |
| D-pad spatial navigation | N/A | ✅ |
| JWT auth with refresh token rotation | ✅ | ✅ |

---

## 🚀 Quick Start

See **DEPLOYMENT.md** for full setup, Docker, Tizen packaging, and EAS build instructions.

```bash
cp .env.example .env          # add your secrets
yarn install
cd apps/backend && docker compose up postgres redis -d && cd ../..
yarn workspace @streambrws/backend db:generate
yarn workspace @streambrws/backend db:migrate:dev
yarn workspace @streambrws/backend db:seed
yarn dev:backend               # API → localhost:4000
yarn dev:mobile                # Expo → scan QR
yarn dev:tizen                 # Vite dev → localhost:3000
```
