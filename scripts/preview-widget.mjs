import { createServer } from "node:http";
import { readFile } from "node:fs/promises";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";

const root = fileURLToPath(new URL("../", import.meta.url));
const bundle = await build({
  absWorkingDir: root,
  entryPoints: ["tests/preview/host.ts"],
  bundle: true,
  platform: "browser",
  format: "esm",
  target: "es2022",
  write: false,
});
const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>SF Transit · Widget preview</title><style>
*{box-sizing:border-box}body{margin:0;padding:28px;background:#f5f5f2;color:#282b27;font:15px system-ui,sans-serif}main{max-width:780px;margin:auto}h1{font-size:20px;margin:0 0 6px}.note{color:#61665e;margin:0 0 20px}.controls{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:16px}button{font:inherit;min-height:40px;padding:8px 12px;border:1px solid #cccfc8;border-radius:9px;background:white;color:#282b27;cursor:pointer}button[aria-pressed=true]{background:#e1e9df;border-color:#6d8e65}#frame-wrap{max-width:740px;margin:auto;transition:max-width .15s}iframe{display:block;width:100%;height:500px;border:1px solid #d8ddd4;border-radius:16px;background:white}#status{margin:18px 0;color:#61665e;font-size:13px}body[data-theme=dark]{background:#20231f;color:#eceee9}body[data-theme=dark] .note,body[data-theme=dark] #status{color:#b7bdb2}@media(max-width:420px){body{padding:10px}h1{font-size:18px}}
</style></head><body><main><h1>Bay Area journeys</h1><p class="note">Local widget preview · synthetic data · no transit API requests</p><div class="controls"><button id="theme">Dark theme</button><button id="mobile" aria-pressed="false">Mobile width</button><button id="normal">Show routes</button><button id="empty">No routes</button><button id="error">Tool error</button><button id="fail-refresh" aria-pressed="false">Fail next refresh</button></div><div id="frame-wrap"><iframe id="view" title="Bay Area itinerary widget" sandbox="allow-scripts"></iframe></div><p id="status" role="status">Connecting the local MCP Apps host…</p></main><script type="module" src="/host.js"></script></body></html>`;
const server = createServer(async (request, response) => {
  try {
    if (request.method !== "GET") {
      response.writeHead(405).end();
      return;
    }
    const pathname = new URL(request.url, "http://127.0.0.1").pathname;
    const routes = {
      "/": { type: "text/html", body: html },
      "/host.js": { type: "text/javascript", body: bundle.outputFiles[0].text },
      "/fixture.json": {
        type: "application/json",
        path: "tests/fixtures/widget-trip.json",
      },
      "/widget.html": { type: "text/html", path: "dist/widget.html" },
    };
    const route = routes[pathname];
    if (!route) {
      response.writeHead(404).end("Not found");
      return;
    }
    const headers = {
      "Content-Type": `${route.type}; charset=utf-8`,
      "Cache-Control": "no-store",
      "X-Content-Type-Options": "nosniff",
    };
    // Exercise the actual widget under strict iframe CSP, including no unsafe-eval.
    if (pathname === "/widget.html")
      headers["Content-Security-Policy"] =
        "default-src 'none'; script-src 'unsafe-inline'; style-src 'unsafe-inline'; img-src data:; connect-src 'none'; frame-src 'none'; base-uri 'none'; form-action 'none'";
    response.writeHead(200, headers);
    response.end(
      route.body ??
        (await readFile(new URL(`../${route.path}`, import.meta.url))),
    );
  } catch {
    response.writeHead(500).end("Preview failed");
  }
});
server.listen(8798, "127.0.0.1", () =>
  console.log("Offline widget preview: http://127.0.0.1:8798"),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.once(signal, () => server.close());
