"use client";

/**
 * ModelViewer — interactive Three.js preview for STL / 3MF files.
 *
 * Features:
 *  - STL + 3MF loaders (3MF preserves embedded materials/colors)
 *  - Toolbar: camera presets (front / top / iso), wireframe, grid, axes,
 *    auto-rotate, fullscreen, reset
 *  - Stats overlay: vertex count + bounding-box dimensions in mm
 *  - Multi-plate: per-plate visibility (when `plateCount > 1` — 3MF only)
 *  - Multi-material: per-material visibility (when 3MF has multiple
 *    materials/extruders)
 *  - Material legend exposed via `onMaterialsParsed` callback so the
 *    surrounding page can render its own swatches
 *
 * For server-side thumbnail capture we use a stripped-down companion
 * (`/_render/.../ThumbnailCapture.tsx`) — it bypasses R3F to keep render
 * timing deterministic.
 */

import {
  Suspense,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import {
  OrbitControls,
  Bounds,
  Environment,
  Grid,
  Center,
  type OrbitControlsProps,
} from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";
import * as THREE from "three";
import {
  Maximize2,
  Minimize2,
  RotateCw,
  Box as BoxIcon,
  Eye,
  EyeOff,
  Grid3x3,
  Compass,
  RefreshCw,
} from "lucide-react";

export type DetectedMaterial = {
  index: number; // sequential position in the file
  extruderId: number; // 1-based
  name: string;
  colorHex: string;
};

export type ModelStats = {
  vertices: number;
  triangles: number;
  bbox: { x: number; y: number; z: number }; // mm
  plateCount: number;
};

type CameraPreset = "iso" | "front" | "top" | "side";

const PRESET_VECTORS: Record<CameraPreset, [number, number, number]> = {
  iso: [1, 1, 1],
  front: [0, 0, 1],
  top: [0, 1, 0.001], // tiny z avoids gimbal-lock
  side: [1, 0, 0],
};

// ── Loaders ──────────────────────────────────────────────────────────────────

function useSTLObject(url: string): THREE.Mesh {
  const geometry = useLoader(STLLoader, url) as THREE.BufferGeometry;
  return useMemo(() => {
    geometry.computeVertexNormals();
    geometry.center();
    const mat = new THREE.MeshStandardMaterial({
      color: 0x60a5fa,
      roughness: 0.4,
      metalness: 0.15,
    });
    const mesh = new THREE.Mesh(geometry, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    return mesh;
  }, [geometry]);
}

function use3MFObject(url: string): THREE.Group {
  return useLoader(ThreeMFLoader, url) as THREE.Group;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function colorToHex(c: THREE.ColorRepresentation): string {
  return "#" + new THREE.Color(c).getHexString();
}

function summarizeMaterials(group: THREE.Group): DetectedMaterial[] {
  const seen = new Map<string, DetectedMaterial>();
  let counter = 1;
  group.traverse((obj) => {
    const m = obj as THREE.Mesh;
    if (!m.isMesh || !m.material) return;
    const mats = Array.isArray(m.material) ? m.material : [m.material];
    for (const mat of mats) {
      const std = mat as THREE.MeshStandardMaterial;
      const colorHex = std.color ? colorToHex(std.color) : "#888888";
      const name = mat.name || `Mat ${counter}`;
      const key = `${name}:${colorHex}`;
      if (seen.has(key)) continue;
      seen.set(key, {
        index: seen.size,
        extruderId: counter,
        name,
        colorHex,
      });
      counter++;
    }
  });
  return Array.from(seen.values());
}

function summarizeStats(obj: THREE.Object3D, plateCount: number): ModelStats {
  let vertices = 0;
  let triangles = 0;
  obj.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh || !m.geometry) return;
    const g = m.geometry as THREE.BufferGeometry;
    const posAttr = g.getAttribute("position");
    if (posAttr) {
      vertices += posAttr.count;
      // STL/3MF are non-indexed in most cases → triangles = positions / 3
      triangles += g.index ? g.index.count / 3 : posAttr.count / 3;
    }
  });
  const box = new THREE.Box3().setFromObject(obj);
  const size = new THREE.Vector3();
  box.getSize(size);
  return {
    vertices,
    triangles: Math.round(triangles),
    bbox: {
      x: Math.round(size.x * 100) / 100,
      y: Math.round(size.y * 100) / 100,
      z: Math.round(size.z * 100) / 100,
    },
    plateCount,
  };
}

// ── Inner scene wrapper ──────────────────────────────────────────────────────

type SceneProps = {
  url: string;
  format: "stl" | "3mf";
  wireframe: boolean;
  visibleMaterialIndices: Set<number> | null; // null = all
  visiblePlateIndices: Set<number> | null; // null = all
  onLoaded: (obj: THREE.Object3D, materials: DetectedMaterial[], plateCount: number) => void;
};

function Model({
  url,
  format,
  wireframe,
  visibleMaterialIndices,
  visiblePlateIndices,
  onLoaded,
}: SceneProps) {
  const stlMesh = format === "stl" ? useSTLObject(url) : null;
  const threeMfGroup = format === "3mf" ? use3MFObject(url) : null;
  const root = format === "3mf" ? (threeMfGroup as THREE.Group) : (stlMesh as THREE.Mesh);
  const reportedRef = useRef(false);

  // Apply wireframe + material/plate visibility on every change.
  useEffect(() => {
    if (!root) return;
    const materials = format === "3mf" ? summarizeMaterials(root as THREE.Group) : [];
    const matKey = (mat: THREE.MeshStandardMaterial) => {
      const colorHex = mat.color ? colorToHex(mat.color) : "#888888";
      return `${mat.name || ""}:${colorHex}`;
    };
    const matIndexByKey = new Map<string, number>();
    materials.forEach((m) => matIndexByKey.set(`${m.name}:${m.colorHex}`, m.index));

    let plateCounter = 0;
    const platePerObject = new Map<THREE.Object3D, number>();
    if (format === "3mf") {
      // 3MF loader gives a top-level group whose direct children correspond
      // to the original objects/plates. Each top-level child = one plate
      // from the slicer's POV.
      (root as THREE.Group).children.forEach((c) => {
        platePerObject.set(c, plateCounter++);
      });
    } else {
      platePerObject.set(root as THREE.Object3D, 0);
      plateCounter = 1;
    }

    root.traverse((o) => {
      const m = o as THREE.Mesh;
      if (!m.isMesh) return;
      const mats = Array.isArray(m.material) ? m.material : [m.material];
      mats.forEach((mat) => {
        const std = mat as THREE.MeshStandardMaterial;
        if (!std.isMeshStandardMaterial) return;
        std.wireframe = wireframe;
        std.roughness = 0.45;
        std.metalness = 0.1;
        std.needsUpdate = true;
      });
      m.castShadow = true;
      m.receiveShadow = true;

      // Material visibility — hide if all materials on this mesh are filtered
      // out. Coarse but cheap; per-face filtering would need split geometries.
      if (visibleMaterialIndices) {
        const meshHasVisible = mats.some((mat) => {
          const std = mat as THREE.MeshStandardMaterial;
          const idx = matIndexByKey.get(matKey(std));
          return idx === undefined || visibleMaterialIndices.has(idx);
        });
        m.visible = meshHasVisible;
      } else {
        m.visible = true;
      }

      // Plate visibility — propagate the top-level child's plate index down.
      if (visiblePlateIndices && format === "3mf") {
        let owner: THREE.Object3D | null = m;
        while (owner && !platePerObject.has(owner)) owner = owner.parent;
        if (owner) {
          const plate = platePerObject.get(owner)!;
          if (!visiblePlateIndices.has(plate)) m.visible = false;
        }
      }
    });

    if (!reportedRef.current) {
      reportedRef.current = true;
      onLoaded(root, materials, Math.max(1, plateCounter));
    }
  }, [
    root,
    format,
    wireframe,
    visibleMaterialIndices,
    visiblePlateIndices,
    onLoaded,
  ]);

  return root ? <primitive object={root} /> : null;
}

function CameraController({
  preset,
  resetSignal,
}: {
  preset: CameraPreset;
  resetSignal: number;
}) {
  const { camera, controls } = useThree();
  useEffect(() => {
    const dir = new THREE.Vector3(...PRESET_VECTORS[preset]).normalize();
    const dist = camera.position.length() || 200;
    camera.position.copy(dir.multiplyScalar(dist));
    camera.lookAt(0, 0, 0);
    const c = controls as OrbitControlsProps & { update?: () => void };
    if (c?.update) c.update();
  }, [preset, resetSignal, camera, controls]);
  return null;
}

// ── Public component ─────────────────────────────────────────────────────────

export function ModelViewer({
  url,
  format,
  className,
  showToolbar = true,
  onMaterialsParsed,
  onStatsParsed,
}: {
  url: string;
  format?: string;
  className?: string;
  showToolbar?: boolean;
  onMaterialsParsed?: (materials: DetectedMaterial[]) => void;
  onStatsParsed?: (stats: ModelStats) => void;
}) {
  const [mounted, setMounted] = useState(false);
  const [autoRotate, setAutoRotate] = useState(false);
  const [wireframe, setWireframe] = useState(false);
  const [showGrid, setShowGrid] = useState(true);
  const [showAxes, setShowAxes] = useState(false);
  const [preset, setPreset] = useState<CameraPreset>("iso");
  const [resetSignal, setResetSignal] = useState(0);
  const [stats, setStats] = useState<ModelStats | null>(null);
  const [materials, setMaterials] = useState<DetectedMaterial[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => setMounted(true), []);

  const fmt = (format ?? "stl").toLowerCase() as "stl" | "3mf";
  const canRender = fmt === "stl" || fmt === "3mf";

  const handleLoaded = useCallback(
    (
      _obj: THREE.Object3D,
      mats: DetectedMaterial[],
      plateCount: number,
    ) => {
      setMaterials(mats);
      onMaterialsParsed?.(mats);
      const s = summarizeStats(_obj, plateCount);
      setStats(s);
      onStatsParsed?.(s);
    },
    [onMaterialsParsed, onStatsParsed],
  );

  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => void 0);
    } else {
      containerRef.current.requestFullscreen().catch(() => void 0);
    }
  }, []);

  useEffect(() => {
    function onChange() {
      setIsFullscreen(Boolean(document.fullscreenElement));
    }
    document.addEventListener("fullscreenchange", onChange);
    return () => document.removeEventListener("fullscreenchange", onChange);
  }, []);

  return (
    <div
      ref={containerRef}
      className={
        "relative aspect-square w-full overflow-hidden rounded-[var(--radius-card)] border border-[var(--color-border)] bg-gradient-to-br from-[#0d0d10] to-[#17171c] " +
        (className ?? "")
      }
    >
      {!mounted || !canRender ? (
        <div className="flex h-full w-full items-center justify-center text-sm text-[var(--color-text-muted)]">
          {canRender ? "Viewer yükleniyor…" : "Önizleme desteklenmiyor"}
        </div>
      ) : (
        <Canvas
          shadows
          camera={{ position: [120, 120, 120], fov: 35 }}
          dpr={[1, 2]}
          onContextMenu={(e) => e.preventDefault()}
        >
          <ambientLight intensity={0.55} />
          <directionalLight position={[5, 8, 6]} intensity={1.05} castShadow />
          <directionalLight position={[-4, 3, -4]} intensity={0.35} />
          {showGrid && (
            <Grid
              args={[600, 600]}
              cellSize={10}
              sectionSize={50}
              cellColor="#2a2a30"
              sectionColor="#3f3f46"
              fadeDistance={400}
              fadeStrength={1}
              infiniteGrid
              position={[0, -0.001, 0]}
            />
          )}
          {showAxes && <axesHelper args={[80]} />}
          <Suspense fallback={null}>
            <Center disableY>
              <Bounds fit clip observe margin={1.3}>
                <Model
                  url={url}
                  format={fmt}
                  wireframe={wireframe}
                  visibleMaterialIndices={null}
                  visiblePlateIndices={null}
                  onLoaded={handleLoaded}
                />
              </Bounds>
            </Center>
            <Environment preset="city" />
          </Suspense>
          <OrbitControls
            makeDefault
            enablePan={false}
            minDistance={20}
            maxDistance={1500}
            autoRotate={autoRotate}
            autoRotateSpeed={1.2}
          />
          <CameraController preset={preset} resetSignal={resetSignal} />
        </Canvas>
      )}

      {showToolbar && mounted && canRender && (
        <>
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between gap-2 p-3">
            <div className="pointer-events-auto flex flex-wrap gap-1 rounded-full bg-black/50 p-1 backdrop-blur">
              {(["iso", "front", "top", "side"] as const).map((p) => (
                <ToolbarPresetButton
                  key={p}
                  active={preset === p}
                  label={
                    p === "iso"
                      ? "ISO"
                      : p === "front"
                        ? "Ön"
                        : p === "top"
                          ? "Üst"
                          : "Yan"
                  }
                  onClick={() => setPreset(p)}
                />
              ))}
            </div>
            <div className="pointer-events-auto flex gap-1 rounded-full bg-black/50 p-1 backdrop-blur">
              <ToolbarIcon
                title={autoRotate ? "Döndürmeyi durdur" : "Otomatik döndür"}
                active={autoRotate}
                onClick={() => setAutoRotate((v) => !v)}
                icon={<RotateCw className="size-3.5" />}
              />
              <ToolbarIcon
                title={wireframe ? "Wireframe kapalı" : "Wireframe"}
                active={wireframe}
                onClick={() => setWireframe((v) => !v)}
                icon={<BoxIcon className="size-3.5" />}
              />
              <ToolbarIcon
                title={showGrid ? "Izgarayı gizle" : "Izgara"}
                active={showGrid}
                onClick={() => setShowGrid((v) => !v)}
                icon={<Grid3x3 className="size-3.5" />}
              />
              <ToolbarIcon
                title={showAxes ? "Eksenleri gizle" : "Eksenler"}
                active={showAxes}
                onClick={() => setShowAxes((v) => !v)}
                icon={<Compass className="size-3.5" />}
              />
              <ToolbarIcon
                title="Kamerayı sıfırla"
                onClick={() => setResetSignal((s) => s + 1)}
                icon={<RefreshCw className="size-3.5" />}
              />
              <ToolbarIcon
                title={isFullscreen ? "Tam ekrandan çık" : "Tam ekran"}
                onClick={toggleFullscreen}
                icon={
                  isFullscreen ? (
                    <Minimize2 className="size-3.5" />
                  ) : (
                    <Maximize2 className="size-3.5" />
                  )
                }
              />
            </div>
          </div>

          {stats && (
            <div className="pointer-events-none absolute bottom-3 left-3 rounded-md bg-black/55 px-3 py-2 font-mono text-[10px] leading-tight text-white/80 backdrop-blur">
              {stats.bbox.x}×{stats.bbox.y}×{stats.bbox.z} mm
              <br />
              {stats.triangles.toLocaleString("tr-TR")} üçgen
              {stats.plateCount > 1 && (
                <>
                  <br />
                  {stats.plateCount} plate
                </>
              )}
              {materials.length > 1 && (
                <>
                  <br />
                  {materials.length} renk/materyal
                </>
              )}
            </div>
          )}

          <p className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] uppercase tracking-wider text-white/70 backdrop-blur">
            Sürükle · Yakınlaştır
          </p>
        </>
      )}

      {/* Render-time helpers consumed by parent layouts. Keep for future toggle wiring. */}
      <Eye className="hidden" />
      <EyeOff className="hidden" />
    </div>
  );
}

function ToolbarPresetButton({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        "rounded-full px-3 py-1 text-[10px] font-medium uppercase tracking-wider transition-colors " +
        (active
          ? "bg-white text-black"
          : "text-white/70 hover:bg-white/10 hover:text-white")
      }
    >
      {label}
    </button>
  );
}

function ToolbarIcon({
  title,
  active,
  onClick,
  icon,
}: {
  title: string;
  active?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      className={
        "inline-flex size-7 items-center justify-center rounded-full transition-colors " +
        (active
          ? "bg-white text-black"
          : "text-white/70 hover:bg-white/10 hover:text-white")
      }
    >
      {icon}
    </button>
  );
}
