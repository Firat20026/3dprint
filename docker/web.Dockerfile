# Next.js web container — dev mode (prod build Faz 5'te optimize edilecek)
FROM node:20-bookworm-slim AS base

RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

RUN corepack enable && corepack prepare pnpm@10.7.1 --activate
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

WORKDIR /app

# Monorepo manifestlerini önce kopyala → dependency cache stabil
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json

RUN pnpm install --frozen-lockfile

# Kaynağı kopyala ve prisma client üret
COPY . .
RUN pnpm --filter @frint3d/web exec prisma generate

EXPOSE 3000
ENV NEXT_TELEMETRY_DISABLED=1
CMD ["pnpm", "--filter", "@frint3d/web", "dev"]
