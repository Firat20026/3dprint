/**
 * Headless renderer for design thumbnails.
 *
 * Browser pool: a single Puppeteer Browser is launched on first use and
 * kept alive across jobs. Idle for >5 minutes → close to free memory.
 *
 * Render flow per job:
 *   1. Open a fresh page
 *   2. Navigate to ${WEB_INTERNAL_URL}/_render/design/[id]?token=${TOKEN}
 *   3. The page renders the model and POSTs the PNG to the save endpoint
 *      itself, then sets window.__RENDER_STATUS__
 *   4. We poll for the status flag (max RENDER_TIMEOUT_MS)
 *   5. Close the page (browser stays warm)
 *
 * Diagnostics: page console + page errors + failed sub-requests are logged
 * to the worker's stdout so 60s timeouts don't leave us guessing.
 */
import puppeteer, { type Browser, type ConsoleMessage } from "puppeteer-core";
import { logError, track } from "./observability.js";

const WEB_URL = (process.env.WEB_INTERNAL_URL ?? "http://web:3000").replace(
  /\/$/,
  "",
);
const TOKEN = process.env.INTERNAL_RENDERER_TOKEN ?? "";
const EXEC_PATH = process.env.PUPPETEER_EXECUTABLE_PATH ?? "/usr/bin/chromium";

const RENDER_TIMEOUT_MS = 90_000; // bumped — model load + WebGL init + upload
const NAV_TIMEOUT_MS = 30_000;
const IDLE_CLOSE_MS = 5 * 60 * 1000;

let browser: Browser | null = null;
let idleTimer: NodeJS.Timeout | null = null;

async function getBrowser(): Promise<Browser> {
  if (browser && browser.connected) return browser;
  browser = await puppeteer.launch({
    executablePath: EXEC_PATH,
    // SwiftShader gives software WebGL inside headless Chromium without a
    // physical GPU. `--disable-gpu` was conflicting on some hosts; dropped.
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--enable-unsafe-swiftshader",
      "--use-gl=angle",
      "--use-angle=swiftshader",
      "--ignore-gpu-blocklist",
      "--enable-webgl",
      "--hide-scrollbars",
      "--mute-audio",
    ],
    headless: true,
  });
  console.log(
    `[worker:thumbnail] browser launched (chromium=${EXEC_PATH}, web=${WEB_URL})`,
  );
  return browser;
}

function scheduleIdleClose() {
  if (idleTimer) clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => {
    if (browser) {
      const b = browser;
      browser = null;
      await b.close().catch(() => void 0);
    }
  }, IDLE_CLOSE_MS);
}

export async function renderDesignThumbnail(designId: string): Promise<void> {
  if (!TOKEN) {
    throw new Error("INTERNAL_RENDERER_TOKEN missing");
  }

  // Path uses /render-internal/... rather than /_render/... — Next.js
  // treats folders prefixed with `_` as private (excluded from routing),
  // so the underscore version returned 404.
  const url = `${WEB_URL}/render-internal/design/${designId}?token=${encodeURIComponent(TOKEN)}`;
  const b = await getBrowser();
  const page = await b.newPage();

  // Forward useful diagnostics to worker stdout so we can debug 60s timeouts.
  const tag = `[worker:thumbnail:${designId}]`;
  page.on("console", (msg: ConsoleMessage) => {
    const t = msg.type();
    if (t === "error" || t === "warn") {
      console.warn(`${tag} page.${t}: ${msg.text()}`);
    }
  });
  page.on("pageerror", (err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    console.error(`${tag} page error: ${msg}`);
  });
  page.on("requestfailed", (req) => {
    const f = req.failure();
    console.warn(
      `${tag} request failed: ${req.method()} ${req.url()} — ${f?.errorText ?? "?"}`,
    );
  });
  page.on("response", (res) => {
    if (res.status() >= 400) {
      console.warn(`${tag} response ${res.status()} ${res.url()}`);
    }
  });

  try {
    await page.setViewport({ width: 1024, height: 1024, deviceScaleFactor: 1 });

    // Pre-set a sentinel before navigation so we can tell "page didn't load
    // at all" from "page loaded but render hasn't finished" if it ever times
    // out — page replaces this with "pending" / "ok" / "error:..." itself.
    await page.evaluateOnNewDocument(`
      (function () {
        try { window.__RENDER_STATUS__ = "loading"; } catch (_) {}
      })();
    `);

    const navStart = Date.now();
    const resp = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: NAV_TIMEOUT_MS,
    });
    const navMs = Date.now() - navStart;
    console.log(
      `${tag} nav ${resp?.status() ?? "?"} in ${navMs}ms → ${resp?.url() ?? url}`,
    );
    if (!resp || !resp.ok()) {
      throw new Error(`render page returned ${resp?.status() ?? "no-response"}`);
    }

    // Wait for the page-side render + upload to finish, returning the
    // status STRING when ready (the previous expression returned `true`
    // from the &&-chain, so jsonValue() came back as the boolean).
    const handle = await page.waitForFunction(
      `(function () {
        var s = window.__RENDER_STATUS__;
        if (typeof s !== 'string') return null;
        if (s === 'loading' || s === 'pending') return null;
        return s;
      })()`,
      { timeout: RENDER_TIMEOUT_MS, polling: 500 },
    );
    const value = (await handle.jsonValue()) as string | null;

    if (typeof value !== "string") {
      throw new Error(`renderer did not finish (status=${String(value)})`);
    }
    if (value.startsWith("error:")) {
      throw new Error(value.slice("error:".length));
    }

    void track(
      "DESIGN_THUMBNAIL_RENDERED",
      { designId, status: value },
    );
  } finally {
    await page.close().catch(() => void 0);
    scheduleIdleClose();
  }
}

/**
 * Best-effort failure handler — logs but rethrows so BullMQ records the
 * failure and retries per queue config.
 */
export async function handleThumbnailJob(designId: string): Promise<void> {
  try {
    await renderDesignThumbnail(designId);
  } catch (e) {
    await logError(e, {
      source: "worker:thumbnail",
      severity: "MEDIUM",
      metadata: { designId },
    });
    throw e;
  }
}
