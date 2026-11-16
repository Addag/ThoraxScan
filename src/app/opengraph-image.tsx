/* eslint-disable @next/next/no-img-element -- ImageResponse draws plain <img>; next/image cannot run here. */
import { readFile } from "node:fs/promises";
import { join } from "node:path";

import { ImageResponse } from "next/og";

// The link preview for every page (Twitter/X inherits it). Built once at build time from files in public/.
export const alt = "ThoraxScan: AI-assisted chest X-ray learning platform for Radiologic Technology students";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const asDataUrl = async (file: string, type: string) =>
  `data:${type};base64,${await readFile(join(process.cwd(), "public/images", file), "base64")}`;

const logo = await asDataUrl("thoraxscan-logo.png", "image/png");
// Despite its .png name, this file holds JPEG data.
const xray = await asDataUrl("xray-sample.png", "image/jpeg");

export default function Image() {
  return new ImageResponse(
    (
      <div style={{ display: "flex", width: "100%", height: "100%", alignItems: "center", gap: 56, padding: "0 72px", color: "#f2f6ff", background: "radial-gradient(circle at 20% 15%, #1c3a6e 0%, #0c0e1c 60%)" }}>
        <div style={{ display: "flex", flexDirection: "column", flex: 1, gap: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <img src={logo} width={84} height={84} alt="" />
            {/* ponytail: one colour, since the bundled font (Geist Regular) puts a gap between two-colour runs; add Inter ExtraBold as a .ttf to restore the blue "Scan" and the site's weight. */}
            <div style={{ display: "flex", fontSize: 48, letterSpacing: -1 }}>ThoraxScan</div>
          </div>
          <div style={{ display: "flex", flexDirection: "column", fontSize: 60, fontWeight: 800, lineHeight: 1.1, letterSpacing: -2 }}>
            <span>AI-Assisted</span>
            <span style={{ color: "#2c9bff" }}>Chest X-Ray</span>
            <span>Learning Platform</span>
          </div>
          <div style={{ display: "flex", fontSize: 26, color: "#c3d0e2" }}>
            Guided interpretation practice for Radiologic Technology students
          </div>
        </div>
        <img src={xray} width={420} height={280} alt="" style={{ borderRadius: 20, border: "2px solid rgba(175, 207, 255, 0.32)", objectFit: "cover" }} />
      </div>
    ),
    size,
  );
}
