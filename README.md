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

---

## Üretim Sertleştirme (production hardening)

### NEXTAUTH_SECRET rotasyonu

`replace-with-...` placeholder bırakmak büyük güvenlik açığı. Yeni değer:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
# veya
openssl rand -base64 32
```

`.env`'deki `NEXTAUTH_SECRET=` satırını bu değerle güncelle, ardından
`docker compose up -d --force-recreate web worker`. Tüm aktif oturumlar
geçersiz olur, kullanıcılar yeniden giriş yapar.

### Admin şifresi sıfırlama

Bootstrap sırasında oluşan admin'i değiştir:

```bash
docker compose exec web pnpm exec tsx scripts/reset-admin-password.ts admin@frint3d.local
# (parola argümanı verilmezse rastgele üretilir ve ekrana yazdırılır)
```

Kullanıcı tarafı `/account/settings` üzerinden de profil + şifre değiştirir.

### iyzico sandbox bağlantısı

1. iyzico merchant panel → Sandbox → API Anahtarları → kopyala
2. `.env`'e yaz:
   ```
   IYZICO_API_KEY=sandbox-XXXX
   IYZICO_SECRET_KEY=sandbox-YYYY
   IYZICO_BASE_URL=https://sandbox-api.iyzipay.com
   ```
3. `docker compose up -d --force-recreate web` (env'i yeniden okur)
4. Test kart numaraları: iyzico panelden test kartlarına bakılır
5. Production'a geçerken `IYZICO_BASE_URL=https://api.iyzipay.com` ve gerçek
   key/secret yazılır. iyzico TR çek (TCKN) ister — kullanıcılara
   `/account/settings`'de TCKN+telefon doldurmaları söyleniyor (yoksa sandbox
   dummy gönderilir, gerçek modda iyzico ödemeyi reddedebilir).

### Observability (event + error tracking)

Yerleşik altyapı `lib/observability/`:

- `track(EVENTS.NAME, properties, ctx?)` → AnalyticsEvent tablosu
- `logError(error, ctx)` → ErrorLog tablosu
- `withTracking(source, handler)` API route wrapper
- `wrapAction(source, action)` server action wrapper

Provider'lar pluggable — varsayılan **console + database**. PostHog veya Sentry
eklemek için:

```bash
# .env'e
POSTHOG_KEY=phc_...
POSTHOG_HOST=https://eu.i.posthog.com   # (opsiyonel)
SENTRY_DSN=https://...@sentry.io/...
```

Karşılık gelen npm paketlerini ekle (`posthog-node`, `@sentry/nextjs`) ve
`lib/observability/providers/posthog.ts` / `sentry.ts` içindeki TODO bloklarını
aç. Index dosyası provider'ı env varsa otomatik yükler.

Admin paneli → **Olaylar & Hatalar** sekmesi — son 7 günün özeti, açık hata
sayısı, "çözüldü" işaretle butonu.

### Migration

Yeni alanlar eklendi (User profile, Design review, AnalyticsEvent, ErrorLog).
Production'a deploy ederken:

```bash
docker compose run --rm web pnpm exec prisma migrate deploy
```

Sıfır data kaybı: tüm yeni kolonlar nullable veya default'lu.
