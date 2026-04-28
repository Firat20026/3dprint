/**
 * In-process cron scheduler.
 *
 * Runs the existing maintenance scripts on a schedule, inside the worker
 * process — saves the operator from setting up a system crontab on the
 * Docker host. Scripts are spawned via child_process so we don't have to
 * refactor them to expose plain functions; the modest spawn overhead is
 * fine for jobs that fire every 15 minutes or longer.
 *
 * Logs go to worker stdout (already aggregated in `docker compose logs`).
 *
 * Disable by setting WORKER_CRON_DISABLED=1 — useful in CI / one-off shells.
 */
import { exec } from "node:child_process";

const WEB_DIR = process.env.WEB_APP_DIR ?? "/app/apps/web";

const JOBS: Array<{ name: string; script: string; intervalMs: number }> = [
  {
    name: "stuck-jobs",
    script: "scripts/fail-stuck-jobs.ts",
    intervalMs: 15 * 60 * 1000, // every 15 min
  },
  {
    name: "thumbnail-backfill",
    script: "scripts/backfill-thumbnails.ts",
    intervalMs: 6 * 60 * 60 * 1000, // every 6h
  },
  {
    name: "observability-cleanup",
    script: "scripts/cleanup-observability.ts",
    intervalMs: 24 * 60 * 60 * 1000, // daily
  },
];

function runScript(jobName: string, scriptPath: string): void {
  exec(
    `pnpm exec tsx ${scriptPath}`,
    { cwd: WEB_DIR, timeout: 5 * 60 * 1000 },
    (err, stdout, stderr) => {
      if (err) {
        console.error(
          `[cron:${jobName}] failed: ${err.message}\nstderr: ${stderr.slice(-500)}`,
        );
      } else {
        const tail = stdout.trim().split("\n").slice(-3).join(" | ");
        console.log(`[cron:${jobName}] ok ${tail ? `— ${tail}` : ""}`);
      }
    },
  );
}

export function startCron(): void {
  if (process.env.WORKER_CRON_DISABLED === "1") {
    console.log("[cron] WORKER_CRON_DISABLED=1 — skipping schedule setup");
    return;
  }

  for (const job of JOBS) {
    // Stagger the first run by a small random delay so all jobs don't fire
    // at process start (heavy DB churn). Subsequent runs honour intervalMs.
    const initialDelay = 30_000 + Math.floor(Math.random() * 60_000);
    setTimeout(() => {
      runScript(job.name, job.script);
      setInterval(() => runScript(job.name, job.script), job.intervalMs);
    }, initialDelay);
    console.log(
      `[cron] scheduled ${job.name} every ${Math.round(job.intervalMs / 60_000)}min (first run in ~${Math.round(initialDelay / 1000)}s)`,
    );
  }
}
