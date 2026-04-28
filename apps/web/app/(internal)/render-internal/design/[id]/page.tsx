/**
 * /render-internal/design/[id] — internal-only thumbnail render page.
 *
 * Loaded by the worker's headless browser. Renders the model on a clean
 * isometric stage, captures the canvas as PNG, and POSTs it to the save
 * endpoint. The page exposes `window.__RENDER_STATUS__` so the worker can
 * await completion or detect a failure.
 *
 * Auth: shared secret in `?token=` matches INTERNAL_RENDERER_TOKEN.
 * Layout: see ../../layout.tsx — strips Nav/Footer for a clean capture.
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
    <ThumbnailCapture
      designId={design.id}
      url={modelUrl}
      format={(design.fileFormat ?? "stl").toLowerCase()}
      token={TOKEN}
    />
  );
}
