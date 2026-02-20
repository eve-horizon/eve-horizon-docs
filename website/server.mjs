import { createServer } from "node:http";
import { readFileSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";

const PORT = parseInt(process.env.PORT || "3000", 10);
const __dirname = fileURLToPath(new URL(".", import.meta.url));
const BUILD_DIR = join(__dirname, "build");

const MIME = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css",
  ".js": "application/javascript",
  ".json": "application/json",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml",
};

function isFile(p) {
  try { return statSync(p).isFile(); } catch { return false; }
}

function serveFile(res, filePath) {
  if (!isFile(filePath)) return false;
  const ext = extname(filePath);
  res.writeHead(200, { "Content-Type": MIME[ext] || "application/octet-stream" });
  res.end(readFileSync(filePath));
  return true;
}

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);
  const pathname = url.pathname;

  // Health endpoint
  if (pathname === "/api/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ status: "ok" }));
    return;
  }

  // Static file (exact match)
  const filePath = join(BUILD_DIR, pathname);
  if (serveFile(res, filePath)) return;

  // Directory → try index.html
  if (serveFile(res, join(filePath, "index.html"))) return;

  // SPA fallback
  if (serveFile(res, join(BUILD_DIR, "404.html"))) return;
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not Found");
});

server.listen(PORT, () => {
  console.log(`Docs server listening on :${PORT}`);
});
