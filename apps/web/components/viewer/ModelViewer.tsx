"use client";

import { Suspense, useEffect, useState } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Bounds, Environment } from "@react-three/drei";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";
import type { BufferGeometry, Group } from "three";

// ── STL ──────────────────────────────────────────────────────────────────────
function STLMesh({ url }: { url: string }) {
  const geometry = useLoader(STLLoader, url) as BufferGeometry;
  useEffect(() => {
    geometry.computeVertexNormals();
    geometry.center();
  }, [geometry]);
  return (
    <mesh geometry={geometry} castShadow receiveShadow>
      <meshStandardMaterial color="#60a5fa" roughness={0.4} metalness={0.15} />
    </mesh>
  );
}

// ── 3MF ──────────────────────────────────────────────────────────────────────
function ThreeMFMesh({ url }: { url: string }) {
  const group = useLoader(ThreeMFLoader, url) as Group;
  useEffect(() => {
    // center the group
    let minY = Infinity;
    let maxY = -Infinity;
    group.traverse((obj) => {
      const m = obj as THREE.Mesh;
      if (m.isMesh && m.geometry) {
        m.geometry.computeBoundingBox();
        const bb = m.geometry.boundingBox;
        if (bb) {
          minY = Math.min(minY, bb.min.y);
          maxY = Math.max(maxY, bb.max.y);
        }
        m.castShadow = true;
        m.receiveShadow = true;
        // keep existing materials from 3MF (color info), just tweak roughness
        if (Array.isArray(m.material)) {
          m.material.forEach((mat) => {
            const std = mat as THREE.MeshStandardMaterial;
            if (std.isMeshStandardMaterial) { std.roughness = 0.45; std.metalness = 0.1; }
          });
        } else {
          const std = m.material as THREE.MeshStandardMaterial;
          if (std?.isMeshStandardMaterial) { std.roughness = 0.45; std.metalness = 0.1; }
        }
      }
    });
    if (isFinite(minY) && isFinite(maxY)) {
      group.position.y = -(minY + maxY) / 2;
    }
  }, [group]);
  return <primitive object={group} />;
}

// ── THREE import for type-only usage ─────────────────────────────────────────
import * as THREE from "three";

// ── Scene ─────────────────────────────────────────────────────────────────────
function Scene({ url, format }: { url: string; format: string }) {
  const is3mf = format === "3mf";
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 6]} intensity={1.1} castShadow />
      <directionalLight position={[-4, 4, -4]} intensity={0.4} />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.3}>
          {is3mf ? <ThreeMFMesh url={url} /> : <STLMesh url={url} />}
        </Bounds>
        <Environment preset="city" />
      </Suspense>
      <OrbitControls makeDefault enablePan={false} minDistance={1} maxDistance={500} />
    </>
  );
}

// ── Public component ──────────────────────────────────────────────────────────
export function ModelViewer({
  url,
  format,
  className,
}: {
  url: string;
  format?: string;
  className?: string;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const fmt = (format ?? "stl").toLowerCase();
  const canRender = fmt === "stl" || fmt === "3mf";

  return (
    <div
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
        <Canvas shadows camera={{ position: [0, 0, 100], fov: 45 }} dpr={[1, 2]}>
          <Scene url={url} format={fmt} />
        </Canvas>
      )}
      <p className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-black/40 px-2.5 py-1 text-[10px] uppercase tracking-wider text-white/70 backdrop-blur">
        Sürükle · Yakınlaştır
      </p>
    </div>
  );
}
