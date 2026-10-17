const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3080;
const ROOT = __dirname;

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const server = http.createServer((req, res) => {
  const parsedUrl = new URL(req.url, `http://localhost:${PORT}`);
  let pathname = decodeURIComponent(parsedUrl.pathname);

  if (["/", "/app", "/login", "/signup", "/admin"].includes(pathname)) {
    pathname = "/index.html";
  }

  const filePath = path.join(ROOT, pathname);
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403);
    return res.end("Forbidden");
  }

  fs.readFile(filePath, (err, data) => {
    if (err) {
      fs.readFile(path.join(ROOT, "index.html"), (err2, fallback) => {
        if (err2) {
          res.writeHead(404);
          return res.end("Not Found");
        }
        res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
        res.end(fallback);
      });
      return;
    }
    const ext = path.extname(filePath).toLowerCase();
    res.writeHead(200, { "Content-Type": MIME_TYPES[ext] || "application/octet-stream" });
    res.end(data);
  });
});

server.listen(PORT, () => {
  console.log(`========================================================`);
  console.log(`🚀 ROAD Next-Gen Server running at: http://localhost:${PORT}`);
  console.log(`   - Studio: http://localhost:${PORT}/app?welcome=1`);
  console.log(`   - Admin : http://localhost:${PORT}/admin`);
  console.log(`   - Login : http://localhost:${PORT}/login`);
  console.log(`========================================================`);
});
