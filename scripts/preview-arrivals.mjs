import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const files = new Map([
  ["/", ["../design/arrivals/index.html", "text/html"]],
  ["/styles.css", ["../design/arrivals/styles.css", "text/css"]],
  ["/app.js", ["../design/arrivals/app.js", "text/javascript"]],
  ["/assets/icon-256.png", ["../assets/icon-256.png", "image/png"]],
]);

const server = createServer(async (request, response) => {
  if (!["GET", "HEAD"].includes(request.method)) {
    response.writeHead(405, { Allow: "GET, HEAD" }).end();
    return;
  }
  const path = new URL(request.url, "http://127.0.0.1").pathname;
  const file = files.get(path);
  if (!file) {
    response.writeHead(404).end("Not found");
    return;
  }
  try {
    const body = await readFile(new URL(file[0], import.meta.url));
    response.writeHead(200, {
      "Content-Type": `${file[1]}${file[1] === "image/png" ? "" : "; charset=utf-8"}`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
      "Content-Security-Policy":
        "default-src 'none'; style-src 'self' 'unsafe-inline'; script-src 'self'; img-src 'self'; connect-src 'none'; base-uri 'none'; form-action 'none'",
    });
    response.end(request.method === "HEAD" ? undefined : body);
  } catch {
    response.writeHead(500).end("Preview files are not ready");
  }
});

server.listen(8801, "127.0.0.1", () => {
  console.log("Offline arrivals design preview: http://127.0.0.1:8801");
});
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => server.close());
