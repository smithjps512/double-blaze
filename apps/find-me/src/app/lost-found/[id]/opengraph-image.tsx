import { ImageResponse } from "next/og";
import { getReport, reportTitle } from "@/lib/reports-data";

export const alt = "Lost or found pet on Find Me";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The card Facebook, Nextdoor, and texts show when a post is shared. Big,
 * readable, and pointing back to Find Me, where replies stay private.
 */
export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const r = await getReport((await params).id);
  const lost = r?.kind !== "found";
  const accent = r?.status === "reunited" ? "#F6C445" : lost ? "#D9481F" : "#1F4E4A";
  const title = r ? reportTitle(r) : "Lost and found pets";
  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", display: "flex", background: "#FFF8F0", fontFamily: "sans-serif" }}>
        <div style={{ width: 40, height: "100%", background: accent }} />
        <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", padding: "60px 70px" }}>
          <div
            style={{
              display: "flex",
              alignSelf: "flex-start",
              background: accent,
              color: r?.status === "reunited" ? "#1E1B18" : "#fff",
              fontSize: 40,
              fontWeight: 800,
              padding: "10px 28px",
              borderRadius: 999,
              letterSpacing: 4,
            }}
          >
            {r?.status === "reunited" ? "REUNITED" : lost ? "LOST" : "FOUND"}
          </div>
          <div style={{ fontSize: 84, fontWeight: 800, color: "#1E1B18", marginTop: 28, lineHeight: 1.05 }}>{title}</div>
          {r && <div style={{ fontSize: 40, color: "#1E1B18", marginTop: 24 }}>{r.colors}</div>}
          {r && <div style={{ fontSize: 36, color: "#5F584F", marginTop: 12 }}>{`${r.areaText} · ${r.seenOn}`}</div>}
          <div style={{ fontSize: 30, color: accent === "#F6C445" ? "#1F4E4A" : accent, marginTop: 40, fontWeight: 700 }}>
            Seen this pet? Message safely on Find Me
          </div>
        </div>
      </div>
    ),
    size,
  );
}
