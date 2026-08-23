# SBG ARMY — API server production image (backend only).
# The frontend (artifacts/sbg-army) is a static Vite build meant for Vercel —
# see artifacts/sbg-army/vercel.json — but this image is also usable to
# self-host the whole stack via deploy/docker-compose.yml.

# ── Stage 1: Build ──────────────────────────────────────────────────────────
FROM node:20-alpine AS builder
WORKDIR /app

COPY package.json package-lock.json* bun.lock* .npmrc* ./
COPY tsconfig.base.json tsconfig.json ./
COPY lib/ lib/
COPY artifacts/api-server/ artifacts/api-server/

RUN npm install
RUN npm run build --workspace=@workspace/api-server

# ── Stage 2: Production ──────────────────────────────────────────────────────
FROM node:20-alpine AS production
WORKDIR /app

COPY package.json package-lock.json* bun.lock* ./
COPY tsconfig.base.json ./
COPY --from=builder /app/lib/ lib/
COPY --from=builder /app/artifacts/api-server/package.json artifacts/api-server/package.json
COPY --from=builder /app/artifacts/api-server/dist/ artifacts/api-server/dist/

RUN npm install --omit=dev

# JSON-file CMS data + uploaded images live here — mount a volume at this
# path in production or they will be lost when the container is recreated.
VOLUME ["/app/artifacts/api-server/database"]

EXPOSE 3000
ENV NODE_ENV=production
ENV PORT=3000

CMD ["node", "--enable-source-maps", "artifacts/api-server/dist/index.mjs"]
