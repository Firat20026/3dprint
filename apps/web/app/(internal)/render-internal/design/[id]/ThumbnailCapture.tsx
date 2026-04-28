"use client";

/**
 * Renders a clean isometric view of the model and POSTs the canvas as PNG
 * to /api/internal/thumbnail/[designId]. Notifies the headless worker by
 * setting window.__RENDER_STATUS__ to "ok" or "error:<message>".
 *
 * Three.js is used directly (no R3F) so the capture timing is deterministic:
 * load → frame → toDataURL → POST. R3F's render-on-demand semantics make
 * "wait until first paint" trickier than it needs to be.
 */
import { useEffect, useRef } from "react";
import * as THREE from "three";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import { ThreeMFLoader } from "three/examples/jsm/loaders/3MFLoader.js";

declare global {
  interface Window {
    __RENDER_STATUS__?: string;
  }
}

const SIZE = 1024;

export function ThumbnailCapture({
  designId,
  url,
  format,
  token,
}: {
  designId: string;
  url: string;
  format: string;
  token: string;
}) {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    let disposed = false;
    const renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      preserveDrawingBuffer: true, // required for toDataURL after render
    });
    renderer.setPixelRatio(1);
    renderer.setSize(SIZE, SIZE, false);
    renderer.setClearColor(0x0d0d10, 1);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0d10);

    const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 5000);
    scene.add(new THREE.AmbientLight(0xffffff, 0.55));
    const key = new THREE.DirectionalLight(0xffffff, 1.05);
    key.position.set(5, 8, 6);
    scene.add(key);
    const fill = new THREE.DirectionalLight(0xffffff, 0.35);
    fill.position.set(-4, 3, -4);
    scene.add(fill);

    function fail(msg: string) {
      window.__RENDER_STATUS__ = `error:${msg}`;
    }

    async function load(): Promise<THREE.Object3D> {
      if (format === "3mf") {
        const loader = new ThreeMFLoader();
        return new Promise((resolve, reject) =>
          loader.load(url, (g) => resolve(g as unknown as THREE.Group), undefined, reject),
        );
      }
      const loader = new STLLoader();
      const geom = await new Promise<THREE.BufferGeometry>((resolve, reject) =>
        loader.load(url, resolve, undefined, reject),
      );
      geom.computeVertexNormals();
      const material = new THREE.MeshStandardMaterial({
        color: 0x60a5fa,
        roughness: 0.4,
        metalness: 0.15,
      });
      return new THREE.Mesh(geom, material);
    }

    async function uploadPng(dataUrl: string) {
      const res = await fetch(`/api/internal/thumbnail/${designId}`, {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ dataUrl }),
      });
      if (!res.ok) {
        throw new Error(`save failed: ${res.status}`);
      }
    }

    (async () => {
      try {
        const obj = await load();
        if (disposed) return;
        scene.add(obj);

        // Frame the object: compute bounding sphere, place camera on a 1:1:1
        // diagonal at a distance that fits with margin.
        const box = new THREE.Box3().setFromObject(obj);
        const size = new THREE.Vector3();
        box.getSize(size);
        const center = new THREE.Vector3();
        box.getCenter(center);
        obj.position.sub(center); // recenter at origin

        const radius = Math.max(size.x, size.y, size.z) * 0.5 || 50;
        const fov = camera.fov * (Math.PI / 180);
        const camDist = (radius / Math.tan(fov / 2)) * 1.6;
        const dir = new THREE.Vector3(1, 0.85, 1).normalize();
        camera.position.copy(dir.multiplyScalar(camDist));
        camera.lookAt(0, 0, 0);

        renderer.render(scene, camera);
        // Wait one tick — some drivers swap frames asynchronously.
        await new Promise((r) => setTimeout(r, 50));
        renderer.render(scene, camera);

        const dataUrl = canvas.toDataURL("image/png");
        await uploadPng(dataUrl);
        window.__RENDER_STATUS__ = "ok";
      } catch (e) {
        fail(e instanceof Error ? e.message : "render-failed");
      }
    })();

    return () => {
      disposed = true;
      renderer.dispose();
    };
  }, [designId, url, format, token]);

  return (
    <canvas
      ref={ref}
      width={SIZE}
      height={SIZE}
      style={{ display: "block", width: "100%", height: "100%" }}
    />
  );
}
