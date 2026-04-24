import { NextRequest, NextResponse } from "next/server";
import { readStoredFile, storedFileStat } from "@/lib/storage";

const MIME: Record<string, string> = {
  ".stl": "model/stl",
  ".3mf": "model/3mf",
  ".glb": "model/gltf-binary",
  ".gltf": "model/gltf+json",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
};

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path: segments } = await params;
  const key = segments.join("/");

  try {
    await storedFileStat(key);
    const buf = await readStoredFile(key);
    const ext = "." + (key.split(".").pop() ?? "").toLowerCase();
    const contentType = MIME[ext] ?? "application/octet-stream";
    return new NextResponse(new Uint8Array(buf), {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Content-Length": String(buf.byteLength),
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new NextResponse("Not found", { status: 404 });
  }
}
