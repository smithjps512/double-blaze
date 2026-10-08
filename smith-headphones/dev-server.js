// Run Smith on your laptop for testing: ANTHROPIC_API_KEY=sk-... npm run dev
// Then open http://localhost:3000 in Chrome. (Phones need the HTTPS Vercel link.)

import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import handler from "./api/smith.js";

const PORT = Number(process.env.PORT) || 3000;
const ROOT = path.join(process.cwd(), "public");
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".mp3": "audio/mpeg", ".svg": "image/svg+xml" };

http
  .createServer((req, res) => {
    const url = new URL(req.url, "http://localhost");
    if (url.pathname === "/api/smith") {
      let raw = "";
      req.on("data", (chunk) => (raw += chunk));
      req.on("end", () => {
        try {
          req.body = JSON.parse(raw || "{}");
        } catch {
          req.body = {};
        }
        handler(req, res);
      });
      return;
    }
    const file = path.join(ROOT, path.normalize(url.pathname === "/" ? "/index.html" : url.pathname));
    if (!file.startsWith(ROOT) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
      res.statusCode = 404;
      return res.end("Not found");
    }
    res.setHeader("Content-Type", TYPES[path.extname(file)] || "application/octet-stream");
    fs.createReadStream(file).pipe(res);
  })
  .listen(PORT, () => console.log(`Smith is running at http://localhost:${PORT}`));
