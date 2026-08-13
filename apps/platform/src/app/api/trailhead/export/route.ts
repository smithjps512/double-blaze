import { NextResponse, type NextRequest } from "next/server";
import { getSiteByPreviewToken } from "@/lib/trailhead-db";
import { renderAllPages } from "@double-blaze/site-render";
import type { BuiltSite } from "@double-blaze/site-schema";

/**
 * GET /api/trailhead/export?token=xxx
 * Export the site as a static zip bundle. Free, never gated on a tip.
 *
 * Uses a simple zip implementation with no external dependency: each file is
 * stored uncompressed in the zip (STORE method). For the small HTML/CSS files
 * Trailhead produces, this is perfectly adequate and avoids adding a zip
 * library to the bundle.
 */
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token");
  if (!token) {
    return NextResponse.json({ error: "Token required." }, { status: 400 });
  }

  const site = await getSiteByPreviewToken(token);
  if (!site || !site.built_content) {
    return NextResponse.json({ error: "Site not found or not yet built." }, { status: 404 });
  }

  const builtSite = site.built_content as BuiltSite;
  const pages = renderAllPages(builtSite, site.subdomain);

  if (pages.length === 0) {
    return NextResponse.json({ error: "No pages to export." }, { status: 404 });
  }

  // Build a simple zip file
  const files: Array<{ name: string; data: Uint8Array }> = [];

  // Each rendered page is fully self-contained: base reset, site chrome, and all
  // page styling are inlined in its <head>, so the zip needs no shared stylesheet.
  for (const page of pages) {
    files.push({
      name: page.filename,
      data: new TextEncoder().encode(page.html),
    });
  }

  const zipBuffer = createSimpleZip(files);

  return new NextResponse(zipBuffer.buffer as ArrayBuffer, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${site.subdomain}-site.zip"`,
    },
  });
}

/**
 * Minimal zip creator (STORE method, no compression). Adequate for small
 * HTML/CSS bundles without adding a dependency.
 */
function createSimpleZip(files: Array<{ name: string; data: Uint8Array }>): Uint8Array {
  const entries: Array<{
    name: Uint8Array;
    data: Uint8Array;
    offset: number;
    crc: number;
  }> = [];

  const chunks: Uint8Array[] = [];
  let offset = 0;

  for (const file of files) {
    const nameBytes = new TextEncoder().encode(file.name);
    const crc = crc32(file.data);

    entries.push({ name: nameBytes, data: file.data, offset, crc });

    // Local file header (30 bytes + name + data)
    const header = new ArrayBuffer(30);
    const hv = new DataView(header);
    hv.setUint32(0, 0x04034b50, true); // signature
    hv.setUint16(4, 20, true); // version needed
    hv.setUint16(6, 0, true); // flags
    hv.setUint16(8, 0, true); // compression (STORE)
    hv.setUint16(10, 0, true); // mod time
    hv.setUint16(12, 0, true); // mod date
    hv.setUint32(14, crc, true);
    hv.setUint32(18, file.data.length, true); // compressed size
    hv.setUint32(22, file.data.length, true); // uncompressed size
    hv.setUint16(26, nameBytes.length, true);
    hv.setUint16(28, 0, true); // extra field length

    const headerBytes = new Uint8Array(header);
    chunks.push(headerBytes, nameBytes, file.data);
    offset += 30 + nameBytes.length + file.data.length;
  }

  // Central directory
  const cdStart = offset;
  for (const entry of entries) {
    const cd = new ArrayBuffer(46);
    const cv = new DataView(cd);
    cv.setUint32(0, 0x02014b50, true);
    cv.setUint16(4, 20, true); // version made by
    cv.setUint16(6, 20, true); // version needed
    cv.setUint16(8, 0, true); // flags
    cv.setUint16(10, 0, true); // compression
    cv.setUint16(12, 0, true); // mod time
    cv.setUint16(14, 0, true); // mod date
    cv.setUint32(16, entry.crc, true);
    cv.setUint32(20, entry.data.length, true);
    cv.setUint32(24, entry.data.length, true);
    cv.setUint16(28, entry.name.length, true);
    cv.setUint16(30, 0, true); // extra length
    cv.setUint16(32, 0, true); // comment length
    cv.setUint16(34, 0, true); // disk start
    cv.setUint16(36, 0, true); // internal attrs
    cv.setUint32(38, 0, true); // external attrs
    cv.setUint32(42, entry.offset, true);

    chunks.push(new Uint8Array(cd), entry.name);
    offset += 46 + entry.name.length;
  }

  const cdSize = offset - cdStart;

  // End of central directory
  const eocd = new ArrayBuffer(22);
  const ev = new DataView(eocd);
  ev.setUint32(0, 0x06054b50, true);
  ev.setUint16(4, 0, true);
  ev.setUint16(6, 0, true);
  ev.setUint16(8, entries.length, true);
  ev.setUint16(10, entries.length, true);
  ev.setUint32(12, cdSize, true);
  ev.setUint32(16, cdStart, true);
  ev.setUint16(20, 0, true);
  chunks.push(new Uint8Array(eocd));

  // Concatenate
  const totalLength = chunks.reduce((s, c) => s + c.length, 0);
  const result = new Uint8Array(totalLength);
  let pos = 0;
  for (const chunk of chunks) {
    result.set(chunk, pos);
    pos += chunk.length;
  }
  return result;
}

/** CRC-32 (IEEE) for zip file integrity. */
function crc32(data: Uint8Array): number {
  let crc = 0xffffffff;
  for (let i = 0; i < data.length; i++) {
    crc ^= data[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}
