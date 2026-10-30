import type { McpServer } from "@modelcontextprotocol/server";
import { createMcpHandler } from "agents/mcp/server";

const MAX_BODY_BYTES = 64 * 1024;
export const MCP_ENDPOINT = "/sf-transit/mcp";

export interface McpRequestOptions {
  createServer: () => McpServer;
}

function secure(response: Response): Response {
  const headers = new Headers(response.headers);
  headers.set("Cache-Control", "no-store");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Referrer-Policy", "no-referrer");
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function error(
  status: number,
  message: string,
  headers?: HeadersInit,
): Response {
  return secure(
    Response.json({ error: message }, { status, ...(headers && { headers }) }),
  );
}

async function boundedBody(request: Request): Promise<Uint8Array | undefined> {
  const declaredLength = request.headers.get("Content-Length");
  if (
    declaredLength !== null &&
    (!/^\d+$/.test(declaredLength) || Number(declaredLength) > MAX_BODY_BYTES)
  ) {
    return undefined;
  }
  if (!request.body) return new Uint8Array();
  const reader = request.body.getReader();
  const chunks: Uint8Array[] = [];
  let length = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      length += value.byteLength;
      if (length > MAX_BODY_BYTES) {
        await reader.cancel();
        return undefined;
      }
      chunks.push(value);
    }
  } finally {
    reader.releaseLock();
  }
  const result = new Uint8Array(length);
  let offset = 0;
  for (const chunk of chunks) {
    result.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return result;
}

/** Serves public, read-only MCP tools without retaining trip inputs. */
export async function handleMcpRequest(
  request: Request,
  { createServer }: McpRequestOptions,
): Promise<Response> {
  try {
    const url = new URL(request.url);
    if (url.pathname !== MCP_ENDPOINT && url.pathname !== "/mcp")
      return error(404, "Not found");
    // This endpoint is used by native clients and Claude's backend, not browsers.
    if (request.headers.has("Origin"))
      return error(403, "Browser origins are not allowed");
    if (url.search) return error(400, "Query parameters are not supported");
    if (!["POST", "GET", "DELETE"].includes(request.method)) {
      return error(405, "Method not allowed", { Allow: "POST, GET, DELETE" });
    }

    let boundedRequest = request;
    if (request.method === "POST") {
      const body = await boundedBody(request);
      if (!body) return error(413, "Request body is too large");
      const headers = new Headers(request.headers);
      headers.delete("Content-Length");
      boundedRequest = new Request(request.url, {
        method: request.method,
        headers,
        body,
        signal: request.signal,
      });
    }
    const handler = createMcpHandler(createServer, {
      route: url.pathname,
      legacy: "stateless",
      corsOptions: false,
      allowedOriginHostnames: [],
      maxRequestBodySize: MAX_BODY_BYTES,
    });
    return secure(await handler.fetch(boundedRequest));
  } catch {
    return error(500, "Unable to process MCP request");
  }
}
