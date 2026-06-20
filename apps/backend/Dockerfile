# ─── Build stage ──────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

# Copy workspace root and package manifests
COPY package.json yarn.lock ./
COPY packages/shared-types/package.json ./packages/shared-types/
COPY packages/shared-logic/package.json ./packages/shared-logic/
COPY packages/ui-tokens/package.json ./packages/ui-tokens/
COPY apps/backend/package.json ./apps/backend/

RUN yarn install --frozen-lockfile

# Copy source
COPY tsconfig.base.json ./
COPY packages/shared-types ./packages/shared-types
COPY packages/shared-logic ./packages/shared-logic
COPY packages/ui-tokens     ./packages/ui-tokens
COPY apps/backend           ./apps/backend

# Generate Prisma client
RUN yarn workspace @streambrws/backend db:generate

# Build shared packages first, then backend
RUN yarn workspace @streambrws/shared-types build && \
    yarn workspace @streambrws/shared-logic  build && \
    yarn workspace @streambrws/backend       build

# ─── Production stage ─────────────────────────────────────────────────────────
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/apps/backend/dist          ./dist
COPY --from=builder /app/apps/backend/package.json  ./package.json
COPY --from=builder /app/apps/backend/prisma        ./prisma
COPY --from=builder /app/node_modules               ./node_modules

EXPOSE 4000
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s CMD wget -qO- http://localhost:4000/health || exit 1

CMD ["sh", "-c", "node_modules/.bin/prisma migrate deploy && node dist/index.js"]
