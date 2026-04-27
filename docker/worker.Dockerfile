# Slicer worker container — Faz 0d stub.
# Faz 2'de OrcaSlicer AppImage extract + /usr/local/bin/orca-slicer symlink eklenecek.
FROM node:20-bookworm-slim

# OrcaSlicer runtime bağımlılıkları (AppImage extract sonrası libgtk vs. gerekecek).
# Şimdilik sadece base + pnpm. Faz 2'de:
#   RUN apt-get install -y libgtk-3-0 libwebkit2gtk-4.0-37 libgl1 libglib2.0-0 ...
#   ADD https://github.com/SoftFever/OrcaSlicer/releases/download/v2.x.x/OrcaSlicer_Linux.AppImage /opt/
RUN apt-get update && apt-get install -y --no-install-recommends \
    openssl ca-certificates \
    chromium fonts-liberation \
    libnss3 libxss1 libasound2 libatk-bridge2.0-0 libgbm1 libgtk-3-0 \
    libxcomposite1 libxdamage1 libxrandr2 libdrm2 libpangocairo-1.0-0 \
  && rm -rf /var/lib/apt/lists/*

# Puppeteer-core uses the system chromium (no bundled download).
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true

RUN corepack enable && corepack prepare pnpm@10.7.1 --activate
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @frint3d/web exec prisma generate

WORKDIR /app/apps/worker
CMD ["pnpm", "exec", "tsx", "watch", "src/index.ts"]
