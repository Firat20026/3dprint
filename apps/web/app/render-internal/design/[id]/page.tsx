/**
 * /_render/design/[id] — internal-only thumbnail render page.
 *
 * Loaded by the worker's headless browser. Renders the model on a clean
 * isometric stage, captures the canvas as PNG, and POSTs it to the save
 * endpoint. The page exposes `window.__RENDER_STATUS__` so the worker can
 * await completion or detect a failure.
 *
 * Authorization: a shared secret in `?token=` matches INTERNAL_RENDERER_TOKEN.
 * No user session is involved. Layout strips header/footer for a clean shot.
 */
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { publicUrlFor } from "@/lib/urls";
import { ThumbnailCapture } from "./ThumbnailCapture";

export const dynamic = "force-dynamic";

const TOKEN = process.env.INTERNAL_RENDERER_TOKEN ?? "";

export default async function RenderDesignThumbnailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string; plate?: string }>;
}) {
  const { id } = await params;
  const sp = await searchParams;

  // Hard guard — without a valid token the page won't even fetch the model.
  // Keeps casual scrapers out and keeps us honest about it being internal.
  if (!TOKEN || sp.token !== TOKEN) {
    notFound();
  }

  const design = await prisma.design.findUnique({
    where: { id },
    select: { id: true, modelFileKey: true, fileFormat: true },
  });
  if (!design) notFound();

  const modelUrl = publicUrlFor(design.modelFileKey);
  if (!modelUrl) notFound();

  return (
    <html lang="tr">
      <body
        style={{
          margin: 0,
          padding: 0,
          background: "#0d0d10",
          width: "100vw",
          height: "100vh",
          overflow: "hidden",
        }}
      >
        <ThumbnailCapture
          designId={design.id}
          url={modelUrl}
          format={(design.fileFormat ?? "stl").toLowerCase()}
          token={TOKEN}
        />
      </body>
    </html>
  );
}
