# frint3d worker container.
# Runs both the slice queue (BullMQ) and the design-thumbnail queue
# (Puppeteer headless Chromium). Real slicing requires OrcaSlicer.

FROM node:20-bookworm-slim

# Build-time pin for the OrcaSlicer release. Override with --build-arg
# ORCA_VERSION=2.2.0 etc when bumping. Keep the URL pattern in sync —
# OrcaSlicer historically has shipped both `OrcaSlicer_Linux_V<ver>.AppImage`
# and `OrcaSlicer_Linux_<ver>.AppImage`; the URL template tries the V-prefix
# form first since that's what 2.0+ uses.
ARG ORCA_VERSION=2.1.1
ENV ORCA_VERSION=${ORCA_VERSION}

RUN apt-get update && apt-get install -y --no-install-recommends \
    # Core
    openssl ca-certificates curl \
    # Chromium (for Puppeteer thumbnail rendering)
    chromium fonts-liberation \
    libnss3 libxss1 libasound2 libatk-bridge2.0-0 libgbm1 libgtk-3-0 \
    libxcomposite1 libxdamage1 libxrandr2 libdrm2 libpangocairo-1.0-0 \
    # OrcaSlicer Qt/WebKit runtime (AppImage extracts but still needs host libs)
    libegl1 libgl1 libglu1-mesa libxkbcommon0 libwebkit2gtk-4.1-0 libdbus-1-3 \
    libfontconfig1 libssh2-1 libgstreamer-plugins-base1.0-0 \
    libgstreamer1.0-0 libsoup-3.0-0 libwayland-egl1 \
    # AppImage extraction without FUSE
    file fuse \
  && rm -rf /var/lib/apt/lists/*

# Puppeteer-core uses the system chromium (no bundled download).
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
ENV PUPPETEER_SKIP_DOWNLOAD=true

# ── OrcaSlicer install ──────────────────────────────────────────────────────
# AppImages need FUSE to mount; containers usually don't have it. So we
# extract with --appimage-extract and run the AppRun script directly.
# If the download URL pattern changes between releases, update this block.
RUN set -eux \
  && cd /tmp \
  && URL="https://github.com/SoftFever/OrcaSlicer/releases/download/v${ORCA_VERSION}/OrcaSlicer_Linux_V${ORCA_VERSION}.AppImage" \
  && (curl -fsSL -o orca.AppImage "$URL" \
      || curl -fsSL -o orca.AppImage "https://github.com/SoftFever/OrcaSlicer/releases/download/v${ORCA_VERSION}/OrcaSlicer_Linux_${ORCA_VERSION}.AppImage") \
  && chmod +x orca.AppImage \
  && ./orca.AppImage --appimage-extract >/dev/null \
  && mv squashfs-root /opt/orca-slicer \
  && rm orca.AppImage \
  && ln -s /opt/orca-slicer/AppRun /usr/local/bin/orca-slicer \
  && /usr/local/bin/orca-slicer --info | head -3 || true

ENV ORCA_SLICER_BIN=/usr/local/bin/orca-slicer
ENV SLICER_MODE=real

RUN corepack enable && corepack prepare pnpm@10.7.1 --activate
ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH

# Skip @sentry/cli binary download — same reason as web.Dockerfile.
ENV SENTRYCLI_SKIP_DOWNLOADER=1

WORKDIR /app

COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY apps/worker/package.json apps/worker/package.json

RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm --filter @frint3d/web exec prisma generate

# Default printer profile location (env can override). The bundled profile
# is a sensible starting point; replace with a real OrcaSlicer export for
# production accuracy.
RUN mkdir -p /profiles \
  && cp /app/apps/worker/profiles/snapmaker_u1.json /profiles/snapmaker_u1.json
ENV SLICER_PRINTER_PROFILE=/profiles/snapmaker_u1.json

WORKDIR /app/apps/worker
CMD ["pnpm", "exec", "tsx", "watch", "src/index.ts"]
