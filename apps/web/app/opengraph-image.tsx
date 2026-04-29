import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "frint3d — Türkiye'nin 3D Baskı Platformu";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OgImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "#0b0b0d",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "flex-start",
          justifyContent: "flex-end",
          padding: "64px",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        {/* accent bar */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: "6px",
            background: "linear-gradient(90deg,#ea580c,#f97316)",
          }}
        />
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ fontSize: "28px", color: "#ea580c", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase" }}>
            frint3d
          </div>
          <div style={{ fontSize: "52px", color: "#fafafa", fontWeight: 800, lineHeight: 1.1, maxWidth: "800px" }}>
            Türkiye'nin 3D Baskı Platformu
          </div>
          <div style={{ fontSize: "24px", color: "#a1a1aa", fontWeight: 400, maxWidth: "700px" }}>
            Hazır tasarım, AI üretim veya kendi dosyan ile sipariş ver.
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
