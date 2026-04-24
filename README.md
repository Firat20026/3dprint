# frint3d

Türkiye odaklı 3D baskı satış platformu prototipi. Snapmaker U1 + OrcaSlicer
backend ile gerçek slicing, iyzico sandbox ile ödeme, Meshy AI mock entegrasyonu.

## Hızlı başlangıç

### A) Docker Compose (önerilen)

```bash
cp .env.example .env
# NEXTAUTH_SECRET üret: openssl rand -base64 32

docker compose up -d postgres redis
docker compose run --rm web pnpm db:migrate
docker compose run --rm web pnpm db:seed
docker compose up                  # web + worker + db + redis
```

### B) Local (Postgres + Redis elle kurulu)

```bash
pnpm install
cp .env.example .env
pnpm db:migrate
pnpm db:seed
pnpm dev              # apps/web
pnpm worker:dev       # apps/worker (ayrı terminal)
```

Açılış: http://localhost:3000

Tam plan: `~/.claude/plans/bubbly-singing-bonbon.md`

## Mimari

- `apps/web` — Next.js 15 App Router (UI + API)
- `apps/worker` — BullMQ consumer, OrcaSlicer CLI sarmalayıcısı (sonraki faz)
- `packages/shared` — paylaşımlı tip ve şemalar (sonraki faz)
- Postgres + Redis + OrcaSlicer binary tek VPS, Docker Compose ile

## Fazlar

Detay için plan dosyasına bak. Şu an: **Faz 0d — Docker Compose** tamamlandı.
Sıradaki: Faz 1 — pre-made designs storefront + cart.
