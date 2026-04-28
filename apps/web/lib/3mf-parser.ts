/**
 * 3MF metadata extractor (build-time, not runtime).
 *
 * On design upload we want to know:
 *   - how many plates (build items) the file contains, so the UI can show
 *     a plate selector and the cart can split into per-plate items
 *   - which materials/extruders are referenced, so we can show a legend
 *     and validate against the active Snapmaker U1 4-extruder config
 *
 * 3MF is a ZIP container with `3D/3dmodel.model` (XML). The schema is
 * documented at https://3mf.io/specification/. We only read the parts we
 * need — light-touch regex parsing is enough; full XML schema validation
 * isn't worth the dependency cost.
 *
 * Not marked "server-only" — yauzl is Node-only so accidental client
 * imports already fail at bundle time, and the inner countPlates /
 * extractMaterialGroups string helpers want to stay testable.
 */
import yauzl from "yauzl";

export type MaterialGroup = {
  extruderId: number;
  name: string | null;
  colorHex: string | null;
};

export type ThreeMfMetadata = {
  plateCount: number;
  materialGroups: MaterialGroup[];
};

const ENTRY_3DMODEL = "3D/3dmodel.model";

/**
 * Extract a small set of useful metadata from a 3MF buffer. Falls back to
 * single-plate / no-materials on any parse error so the upload flow still
 * succeeds — the user can always re-upload if the file is broken.
 */
export async function parse3mfMetadata(
  buffer: Buffer,
): Promise<ThreeMfMetadata> {
  try {
    const xml = await readFirstEntry(buffer, ENTRY_3DMODEL);
    if (!xml) return { plateCount: 1, materialGroups: [] };

    const text = xml.toString("utf8");
    return {
      plateCount: countPlates(text),
      materialGroups: extractMaterialGroups(text),
    };
  } catch {
    return { plateCount: 1, materialGroups: [] };
  }
}

/** Count distinct build plates. The 3MF "build" element holds <item> children
 *  whose `transform` and `objectid` attributes describe placement. Tools that
 *  support multi-plate (PrusaSlicer, OrcaSlicer, Bambu Studio) tag each item
 *  with a `p:plateindex` or `b:p:plateindex` attribute — count those. If
 *  none are present, treat as a single plate.
 */
export function countPlates(modelXml: string): number {
  const buildBlock = modelXml.match(/<build[\s\S]*?<\/build>/i);
  if (!buildBlock) return 1;
  const items = buildBlock[0].match(/<item\b[^>]*>/gi) ?? [];
  if (items.length === 0) return 1;

  const plates = new Set<number>();
  for (const item of items) {
    const m =
      item.match(/(?:b:)?p:plateindex\s*=\s*"(\d+)"/i) ??
      item.match(/plateindex\s*=\s*"(\d+)"/i);
    if (m && m[1]) plates.add(parseInt(m[1], 10));
  }

  // Slicer-tagged plates → count distinct values; otherwise treat each <item>
  // as its own plate (PrusaSlicer behaviour for multi-part 3MFs).
  return plates.size > 0 ? plates.size : items.length;
}

/** Pull material/color resources. 3MF's <basematerials> defines colored
 *  materials; tools like OrcaSlicer/Bambu also embed `extruder` ids.
 */
export function extractMaterialGroups(modelXml: string): MaterialGroup[] {
  const groups: MaterialGroup[] = [];
  const seen = new Set<string>();

  const baseBlocks = modelXml.match(/<basematerials\b[\s\S]*?<\/basematerials>/gi) ?? [];
  for (const block of baseBlocks) {
    const entries = block.match(/<base\b[^>]*\/>/gi) ?? [];
    entries.forEach((entry, idx) => {
      const name = entry.match(/\bname\s*=\s*"([^"]*)"/i)?.[1] ?? null;
      const color =
        entry.match(/\bdisplaycolor\s*=\s*"#?([A-Fa-f0-9]{6,8})"/i)?.[1] ?? null;
      const extruder =
        Number(
          entry.match(/\b(?:slic3r:filament_id|extruder|filament_id)\s*=\s*"(\d+)"/i)?.[1] ?? idx + 1,
        ) || idx + 1;
      const colorHex = color ? `#${color.slice(0, 6)}` : null;
      const key = `${extruder}:${name ?? ""}:${colorHex ?? ""}`;
      if (seen.has(key)) return;
      seen.add(key);
      groups.push({ extruderId: extruder, name, colorHex });
    });
  }

  // Some Bambu/Orca files use `<filament>` blocks under metadata instead.
  if (groups.length === 0) {
    const filamentBlocks =
      modelXml.match(/<metadata\s+name="filament_settings"[\s\S]*?<\/metadata>/gi) ?? [];
    filamentBlocks.forEach((_block, idx) => {
      groups.push({
        extruderId: idx + 1,
        name: `Filament ${idx + 1}`,
        colorHex: null,
      });
    });
  }

  return groups;
}

function readFirstEntry(buffer: Buffer, name: string): Promise<Buffer | null> {
  return new Promise((resolve, reject) => {
    yauzl.fromBuffer(buffer, { lazyEntries: true }, (err, zip) => {
      if (err || !zip) return reject(err ?? new Error("zip open failed"));
      let resolved = false;
      zip.readEntry();
      zip.on("entry", (entry) => {
        if (entry.fileName !== name) {
          zip.readEntry();
          return;
        }
        zip.openReadStream(entry, (err2, stream) => {
          if (err2 || !stream) {
            resolved = true;
            return reject(err2 ?? new Error("stream open failed"));
          }
          const chunks: Buffer[] = [];
          stream.on("data", (c: Buffer) => chunks.push(c));
          stream.on("end", () => {
            resolved = true;
            zip.close();
            resolve(Buffer.concat(chunks));
          });
          stream.on("error", reject);
        });
      });
      zip.on("end", () => {
        if (!resolved) resolve(null);
      });
      zip.on("error", reject);
    });
  });
}
