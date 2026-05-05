"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";
import { ModelViewer } from "@/components/viewer/ModelViewer";

type MaterialOption = {
  id: string;
  name: string;
  type: string;
  colorHex: string;
  pricePerGramTRY: number;
};

type ProfileOption = {
  id: string;
  name: string;
  layerHeightMm: number;
  infillPercent: number;
  isDefault: boolean;
};

type SliceStatus = "QUEUED" | "RUNNING" | "DONE" | "FAILED";

type SliceResult = {
  id: string;
  status: SliceStatus;
  filamentGrams: number | null;
  filamentMeters: number | null;
  printSeconds: number | null;
  unitPriceTRY: number | null;
  errorText: string | null;
  sourceFileKey: string;
  fileHash: string;
  material: { id: string; name: string; colorHex: string };
  profile: { id: string; name: string; layerHeightMm: number; infillPercent: number };
};

const MAX_SIZE = 100 * 1024 * 1024;
const ALLOWED = new Set(["stl", "3mf"]);

type MeshySeed = {
  jobId: string;
  title: string;
  modelUrl: string;
} | null;

export function UploadFlow({
  materials,
  profiles,
  meshySeed = null,
}: {
  materials: MaterialOption[];
  profiles: ProfileOption[];
  meshySeed?: MeshySeed;
}) {
  const router = useRouter();
  const addItem = useCart((s) => s.addItem);

  const [file, setFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const [materialId, setMaterialId] = useState(materials[0]?.id ?? "");
  const defaultProfile =
    profiles.find((p) => p.isDefault) ??
    profiles.find((p) => p.name === "Standart") ??
    profiles[0];
  const [profileId, setProfileId] = useState(defaultProfile?.id ?? "");
  const [quantity, setQuantity] = useState(1);

  const [jobId, setJobId] = useState<string | null>(null);
  const [result, setResult] = useState<SliceResult | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const material = useMemo(
    () => materials.find((m) => m.id === materialId),
    [materials, materialId],
  );
  const profile = useMemo(
    () => profiles.find((p) => p.id === profileId),
    [profiles, profileId],
  );

  // Dosya seçildiğinde / meshy seed geldiğinde / material/profile değiştiğinde slice tetikle.
  useEffect(() => {
    if (!materialId || !profileId) return;
    if (!file && !meshySeed) return;

    let cancelled = false;
    setUploadError(null);
    setResult(null);
    setJobId(null);
    setSubmitting(true);

    (async () => {
      try {
        let endpoint: string;
        let body: BodyInit;
        const headers: HeadersInit = {};

        const cached = sourceRef.current;
        if (cached) {
          // Tekrar fiyatlandırma — zaten bir SliceJob var, aynı kaynağı farklı material/profile ile.
          endpoint = "/api/slice/reprice";
          body = JSON.stringify({
            fileHash: cached.fileHash,
            sourceFileKey: cached.sourceFileKey,
            materialId,
            profileId,
          });
          headers["content-type"] = "application/json";
        } else if (meshySeed) {
          // İlk slice: Meshy köprüsü
          endpoint = "/api/slice/from-meshy";
          body = JSON.stringify({
            meshyJobId: meshySeed.jobId,
            materialId,
            profileId,
          });
          headers["content-type"] = "application/json";
        } else if (file) {
          // İlk slice: user file upload
          endpoint = "/api/slice";
          const form = new FormData();
          form.append("file", file);
          form.append("materialId", materialId);
          form.append("profileId", profileId);
          body = form;
        } else {
          return;
        }

        const res = await fetch(endpoint, { method: "POST", body, headers });
        if (!res.ok) {
          const msg = (await res.json().catch(() => null))?.error ?? `HTTP ${res.status}`;
          throw new Error(msg);
        }
        const data = (await res.json()) as {
          jobId: string;
          cached: boolean;
          fileHash?: string;
          sourceFileKey?: string;
        };
        if (cancelled) return;
        // from-meshy response cevabında fileHash/sourceFileKey geliyor — önceden set et ki
        // sonraki material/profile değişikliği doğrudan reprice'a düşsün.
        if (!sourceRef.current && data.fileHash && data.sourceFileKey) {
          sourceRef.current = {
            fileHash: data.fileHash,
            sourceFileKey: data.sourceFileKey,
          };
        }
        setJobId(data.jobId);
      } catch (e) {
        if (!cancelled) {
          setUploadError(e instanceof Error ? e.message : "yükleme başarısız");
          setSubmitting(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [file, materialId, profileId]);

  // Source cache: ilk slice sonrası doldurulur, sonraki material/profile değişikliği reprice'a düşer.
  const sourceRef = useRef<{ fileHash: string; sourceFileKey: string } | null>(null);

  // Poll /api/slice/[jobId] until DONE/FAILED.
  useEffect(() => {
    if (!jobId) return;
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      try {
        const res = await fetch(`/api/slice/${jobId}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = (await res.json()) as SliceResult;
        if (cancelled) return;
        setResult(data);
        if (data.status === "DONE" || data.status === "FAILED") {
          setSubmitting(false);
          // İlk başarılı slice sonrası source cache'i doldur (user-upload yolu).
          if (data.status === "DONE" && !sourceRef.current) {
            sourceRef.current = {
              fileHash: data.fileHash,
              sourceFileKey: data.sourceFileKey,
            };
          }
          return;
        }
        timer = setTimeout(poll, 800);
      } catch (e) {
        if (!cancelled) {
          setUploadError(e instanceof Error ? e.message : "polling hatası");
          setSubmitting(false);
        }
      }
    }
    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [jobId, file]);

  function handleFile(f: File) {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    if (!ALLOWED.has(ext)) {
      setUploadError("Sadece .stl veya .3mf yüklenebilir");
      return;
    }
    if (f.size > MAX_SIZE) {
      setUploadError("Dosya 100MB'dan büyük olamaz");
      return;
    }
    sourceRef.current = null; // yeni dosya — reprice cache'i sıfırla
    setFile(f);
  }

  function handleAddToCart(goToCart: boolean) {
    if (!result || result.status !== "DONE" || !material || !profile) return;
    if (!file && !meshySeed) return;
    if (!result.filamentGrams || !result.printSeconds || !result.unitPriceTRY) return;
    const title = file
      ? file.name.replace(/\.[^.]+$/, "")
      : (meshySeed?.title ?? "AI modeli");
    addItem({
      kind: "slice",
      sliceJobId: result.id,
      title,
      thumbnailUrl: null,
      materialId: material.id,
      materialName: material.name,
      materialColorHex: material.colorHex,
      profileId: profile.id,
      profileName: profile.name,
      filamentGrams: result.filamentGrams,
      printSeconds: result.printSeconds,
      quantity,
      unitPriceTRY: result.unitPriceTRY,
    });
    if (goToCart) router.push("/cart");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1.1fr_1fr]">
      <div>
        {meshySeed ? (
          <MeshyPreview seed={meshySeed} />
        ) : !file ? (
          <DropZone
            dragOver={dragOver}
            setDragOver={setDragOver}
            onFile={handleFile}
          />
        ) : (
          <FilePreview file={file} onReset={() => setFile(null)} />
        )}
        {uploadError && (
          <div className="mt-4 rounded-xl border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            {uploadError}
          </div>
        )}
      </div>

      <div className="space-y-5">
        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Materyal
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
            {materials.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMaterialId(m.id)}
                className={
                  "flex items-center gap-2 rounded-[10px] border px-3 py-2 text-left text-xs transition-colors " +
                  (m.id === materialId
                    ? "border-primary bg-primary/10 text-foreground"
                    : "border-border bg-secondary text-muted-foreground hover:text-foreground")
                }
              >
                <span
                  className="size-4 shrink-0 rounded-full border border-white/10"
                  style={{ backgroundColor: m.colorHex }}
                />
                <span className="flex-1 truncate">{m.name}</span>
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="text-xs uppercase tracking-wider text-muted-foreground">
            Baskı Kalitesi
          </p>
          <div className="mt-2 grid grid-cols-3 gap-2">
            {profiles.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setProfileId(p.id)}
                className={
                  "rounded-[10px] border px-3 py-2.5 text-left text-xs transition-colors " +
                  (p.id === profileId
                    ? "border-primary bg-primary/10"
                    : "border-border bg-secondary")
                }
              >
                <p className="font-medium text-foreground">{p.name}</p>
                <p className="mt-0.5 text-[10px] text-muted-foreground">
                  {p.layerHeightMm}mm · %{p.infillPercent}
                </p>
              </button>
            ))}
          </div>
        </div>

        <PriceCard
          submitting={submitting}
          result={result}
          material={material}
        />

        {result?.status === "DONE" && (
          <div className="flex items-end gap-4">
            <div>
              <p className="text-xs uppercase tracking-wider text-muted-foreground">
                Adet
              </p>
              <div className="mt-2 inline-flex items-center overflow-hidden rounded-lg border border-border">
                <button
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="px-3 py-2 text-muted-foreground hover:bg-secondary"
                >
                  −
                </button>
                <span className="w-10 text-center font-medium">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity(Math.min(20, quantity + 1))}
                  className="px-3 py-2 text-muted-foreground hover:bg-secondary"
                >
                  +
                </button>
              </div>
            </div>
            <div className="flex flex-1 flex-col gap-2 sm:flex-row">
              <Button size="lg" className="flex-1" onClick={() => handleAddToCart(false)}>
                Sepete Ekle
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="flex-1"
                onClick={() => handleAddToCart(true)}
              >
                Hemen Satın Al
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function DropZone({
  dragOver,
  setDragOver,
  onFile,
}: {
  dragOver: boolean;
  setDragOver: (v: boolean) => void;
  onFile: (f: File) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDragOver(false);
        const f = e.dataTransfer.files?.[0];
        if (f) onFile(f);
      }}
      onClick={() => inputRef.current?.click()}
      className={
        "flex aspect-square cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-8 text-center transition-colors " +
        (dragOver
          ? "border-primary bg-primary/10"
          : "border-border bg-card hover:border-primary/60")
      }
    >
      <input
        ref={inputRef}
        type="file"
        accept=".stl,.3mf"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
      <div className="size-16 rounded-full border border-border bg-secondary p-4">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M12 16V4m0 0l-4 4m4-4l4 4M4 20h16" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <p className="font-display text-xl uppercase tracking-tight">
        STL/3MF Bırak
      </p>
      <p className="text-xs text-muted-foreground">
        veya tıkla — max 100MB
      </p>
    </div>
  );
}

function MeshyPreview({ seed }: { seed: NonNullable<MeshySeed> }) {
  return (
    <div className="space-y-3">
      <ModelViewer url={seed.modelUrl} format="stl" />
      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-xs">
        <span className="uppercase tracking-wider text-muted-foreground">
          AI modeli
        </span>
        <span className="truncate text-muted-foreground" title={seed.title}>
          {seed.title}
        </span>
      </div>
    </div>
  );
}

function FilePreview({ file, onReset }: { file: File; onReset: () => void }) {
  const [objectUrl, setObjectUrl] = useState<string | null>(null);
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  const format = ext === ".3mf" ? "3mf" : "stl";
  const canPreview = ext === ".stl" || ext === ".3mf";

  useEffect(() => {
    if (!canPreview) return;
    const url = URL.createObjectURL(file);
    setObjectUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [file, canPreview]);

  return (
    <div className="space-y-3">
      {canPreview && objectUrl ? (
        <ModelViewer url={objectUrl} format={format} />
      ) : (
        <div className="flex aspect-square flex-col items-center justify-center gap-3 rounded-xl border border-border bg-card p-8 text-center">
          <div className="size-16 rounded-full border border-border bg-secondary p-4 text-primary">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
              <path d="M9 12l2 2 4-4m5 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="font-medium">{file.name}</p>
          <p className="text-xs text-muted-foreground">
            {(file.size / 1024).toFixed(1)} KB
          </p>
        </div>
      )}
      {/* Info bar below the viewer — same pattern as design detail page */}
      <div className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-2.5 text-xs">
        <span className="truncate text-muted-foreground" title={file.name}>
          {file.name}
        </span>
        <button
          type="button"
          onClick={onReset}
          className="ml-3 shrink-0 uppercase tracking-wider text-muted-foreground/70 hover:text-destructive"
        >
          Değiştir
        </button>
      </div>
    </div>
  );
}

function PriceCard({
  submitting,
  result,
  material,
}: {
  submitting: boolean;
  result: SliceResult | null;
  material: MaterialOption | undefined;
}) {
  if (submitting || (result && (result.status === "QUEUED" || result.status === "RUNNING"))) {
    return (
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center gap-3">
          <div className="size-4 animate-spin rounded-full border-2 border-primary border-t-transparent" />
          <p className="text-sm text-muted-foreground">
            {result?.status === "RUNNING" ? "Dilimleme sürüyor…" : "Kuyruğa alınıyor…"}
          </p>
        </div>
      </div>
    );
  }

  if (result?.status === "FAILED") {
    return (
      <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-5 text-sm text-destructive">
        Slicer hatası: {result.errorText ?? "bilinmeyen hata"}
      </div>
    );
  }

  if (!result || result.status !== "DONE") {
    return (
      <div className="rounded-xl border border-dashed border-border bg-card p-5 text-sm text-muted-foreground">
        Dosya bırak, fiyat burada görünecek.
      </div>
    );
  }

  const grams = result.filamentGrams ?? 0;
  const seconds = result.printSeconds ?? 0;
  const unit = result.unitPriceTRY ?? 0;
  const hours = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="flex items-baseline justify-between">
        <p className="text-xs uppercase tracking-wider text-muted-foreground">
          Birim fiyat
        </p>
        <p className="font-display text-3xl uppercase tracking-tight">
          ₺{unit.toFixed(2)}
        </p>
      </div>
      <dl className="mt-4 grid grid-cols-3 gap-3 border-t border-border pt-4 text-xs">
        <div>
          <dt className="text-muted-foreground">Filament</dt>
          <dd className="mt-1 font-medium">{grams.toFixed(1)} g</dd>
        </div>
        <div>
          <dt className="text-muted-foreground">Süre</dt>
          <dd className="mt-1 font-medium">
            {hours > 0 ? `${hours}sa ` : ""}
            {mins}dk
          </dd>
        </div>
        <div>
          <dt className="text-muted-foreground">₺/g</dt>
          <dd className="mt-1 font-medium">
            {material ? material.pricePerGramTRY.toFixed(2) : "—"}
          </dd>
        </div>
      </dl>
    </div>
  );
}
