import { fileURLToPath } from "node:url";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client";
import { StdioClientTransport } from "@modelcontextprotocol/client/stdio";
import { handleMcpRequest } from "../src/http.js";
import { createTransitServer } from "../src/tools.js";
import { WIDGET_HTML, WIDGET_RESOURCE_URI } from "../src/generated/widget.js";

const modernVersion = "2026-07-28";
const legacyVersions = ["2025-11-25", "2025-06-18", "2025-03-26", "2024-11-05"];
const clientInfo = { name: "offline-compatibility-client", version: "1.0.0" };
const endpoint = "http://localhost/sf-transit/mcp";
const createServer = () => createTransitServer();

interface WireReply {
  result?: Record<string, unknown>;
  error?: { code: number; data?: unknown };
}

async function reply(response: Response): Promise<WireReply> {
  const body = await response.text();
  const payload = response.headers
    .get("Content-Type")
    ?.includes("text/event-stream")
    ? body
        .split("\n")
        .find((line) => line.startsWith("data: "))
        ?.slice(6)
    : body;
  expect(payload).toBeDefined();
  return JSON.parse(payload!) as WireReply;
}

function modernRequest(
  headers: Record<string, string> = {},
  meta: Record<string, unknown> = {},
): Request {
  return new Request(endpoint, {
    method: "POST",
    headers: {
      Host: "localhost",
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      "MCP-Protocol-Version": modernVersion,
      "Mcp-Method": "tools/list",
      ...headers,
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "tools/list",
      params: {
        _meta: {
          "io.modelcontextprotocol/protocolVersion": modernVersion,
          "io.modelcontextprotocol/clientInfo": clientInfo,
          "io.modelcontextprotocol/clientCapabilities": {},
          ...meta,
        },
      },
    }),
  });
}

async function exercise(client: Client, modern: boolean): Promise<void> {
  expect(client.getNegotiatedProtocolVersion()).toBe(
    modern ? modernVersion : "2025-11-25",
  );
  expect(client.getServerVersion()?.name).toBe("sf-transit-mcp");
  if (modern)
    expect(client.getDiscoverResult()?.supportedVersions).toContain(
      modernVersion,
    );

  const listing = await client.listTools();
  expect(listing.tools.map((tool) => tool.name)).toEqual([
    "search_places",
    "plan_trip",
    "get_stop_departures",
    "get_service_info",
  ]);
  for (const tool of listing.tools) {
    expect(tool.title).toBeTruthy();
    expect(tool.annotations).toMatchObject({
      title: tool.title,
      readOnlyHint: true,
      destructiveHint: false,
    });
  }
  const info = await client.callTool({
    name: "get_service_info",
    arguments: {},
  });
  expect(info.isError).not.toBe(true);
  expect(info.content).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        type: "text",
        text: expect.stringContaining("Bay Area"),
      }),
    ]),
  );
  expect(info.structuredContent).toMatchObject({
    timeZone: "America/Los_Angeles",
    authenticationRequired: false,
  });

  const resources = await client.listResources();
  expect(resources.resources).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        uri: WIDGET_RESOURCE_URI,
        mimeType: "text/html;profile=mcp-app",
      }),
    ]),
  );
  const widget = await client.readResource({ uri: WIDGET_RESOURCE_URI });
  expect(widget.contents[0]).toMatchObject({
    uri: WIDGET_RESOURCE_URI,
    text: WIDGET_HTML,
  });
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("External network is forbidden in compatibility tests");
    }),
  );
});

describe("MCP client compatibility", () => {
  it.each(["auto", "legacy"] as const)(
    "serves discovery, tools, and widget resources through HTTP in %s mode",
    async (mode) => {
      const wire: { method: string; response: WireReply }[] = [];
      const transport = new StreamableHTTPClientTransport(new URL(endpoint), {
        fetch: async (input, init) => {
          const request = new Request(input, init);
          // A real HTTP connection supplies Host; the in-process adapter must too.
          request.headers.set("Host", new URL(request.url).host);
          const method =
            request.method === "POST"
              ? ((await request.clone().json()) as { method: string }).method
              : request.method;
          const response = await handleMcpRequest(request, { createServer });
          if (response.status === 200)
            wire.push({
              method,
              response: await reply(response.clone()),
            });
          expect(response.headers.get("mcp-session-id")).toBeNull();
          return response;
        },
      });
      const client = new Client(clientInfo, { versionNegotiation: { mode } });
      const errors: Error[] = [];
      client.onerror = (error) => errors.push(error);
      try {
        await client.connect(transport);
        await exercise(client, mode === "auto");
        expect(wire[0]?.method).toBe(
          mode === "auto" ? "server/discover" : "initialize",
        );
        if (mode === "auto") {
          expect(wire.some(({ method }) => method === "initialize")).toBe(
            false,
          );
          for (const entry of wire) {
            expect(entry.response.result?.resultType).toBe("complete");
            expect(entry.response.result?._meta).toHaveProperty(
              "io.modelcontextprotocol/serverInfo",
            );
            if (
              ["tools/list", "resources/list", "resources/read"].includes(
                entry.method,
              )
            ) {
              expect(entry.response.result).toMatchObject({
                ttlMs: 0,
                cacheScope: "private",
              });
            }
          }
        }
        expect(errors).toEqual([]);
        expect(fetch).not.toHaveBeenCalled();
      } finally {
        await client.close();
      }
    },
  );

  it.each(["auto", "legacy"] as const)(
    "serves the real stdio entrypoint in %s mode",
    async (mode) => {
      const client = new Client(clientInfo, { versionNegotiation: { mode } });
      const transport = new StdioClientTransport({
        command: process.execPath,
        args: [
          "--import",
          "tsx",
          fileURLToPath(
            new URL("./fixtures/stdio-compat-server.ts", import.meta.url),
          ),
        ],
        cwd: fileURLToPath(new URL("../", import.meta.url)),
        stderr: "pipe",
      });
      try {
        await client.connect(transport);
        await exercise(client, mode === "auto");
        expect(fetch).not.toHaveBeenCalled();
      } finally {
        await client.close();
      }
    },
  );

  it.each(legacyVersions)(
    "keeps the legacy %s handshake and tool calls working",
    async (version) => {
      let id = 0;
      const rpc = async (method: string, params: unknown) => {
        const response = await handleMcpRequest(
          new Request(endpoint, {
            method: "POST",
            headers: {
              Host: "localhost",
              "Content-Type": "application/json",
              Accept: "application/json, text/event-stream",
              "MCP-Protocol-Version": version,
            },
            body: JSON.stringify({ jsonrpc: "2.0", id: ++id, method, params }),
          }),
          { createServer },
        );
        expect(response.status).toBe(200);
        return reply(response);
      };
      expect(
        await rpc("initialize", {
          protocolVersion: version,
          capabilities: {},
          clientInfo,
        }),
      ).toMatchObject({
        result: {
          protocolVersion: version,
          serverInfo: { name: "sf-transit-mcp" },
        },
      });
      expect(
        await rpc("tools/call", { name: "get_service_info", arguments: {} }),
      ).toMatchObject({
        result: { structuredContent: { authenticationRequired: false } },
      });
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it("rejects a mismatch between the HTTP method header and JSON-RPC method", async () => {
    const response = await handleMcpRequest(
      modernRequest({ "Mcp-Method": "tools/call" }),
      { createServer },
    );
    expect(response.status).toBe(400);
    expect(await reply(response)).toMatchObject({ error: { code: -32020 } });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects a mismatch between header and body protocol versions", async () => {
    const response = await handleMcpRequest(
      modernRequest({ "MCP-Protocol-Version": "2025-11-25" }),
      { createServer },
    );
    expect(response.status).toBe(400);
    expect(await reply(response)).toMatchObject({ error: { code: -32020 } });
    expect(fetch).not.toHaveBeenCalled();
  });

  it("rejects modern requests missing their required method header", async () => {
    const request = modernRequest();
    request.headers.delete("Mcp-Method");
    const response = await handleMcpRequest(request, { createServer });
    expect(response.status).toBe(400);
    expect(await reply(response)).toHaveProperty("error");
    expect(fetch).not.toHaveBeenCalled();
  });

  it("reports supported modern revisions for an unsupported requested version", async () => {
    const response = await handleMcpRequest(
      modernRequest(
        { "MCP-Protocol-Version": "2099-01-01" },
        { "io.modelcontextprotocol/protocolVersion": "2099-01-01" },
      ),
      { createServer },
    );
    expect(response.status).toBe(400);
    expect(await reply(response)).toMatchObject({
      error: {
        code: -32022,
        data: { requested: "2099-01-01", supported: [modernVersion] },
      },
    });
    expect(fetch).not.toHaveBeenCalled();
  });
});
