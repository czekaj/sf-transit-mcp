import { beforeEach, describe, expect, it, vi } from "vitest";
import { once } from "node:events";
import { PassThrough } from "node:stream";
import { McpServer } from "@modelcontextprotocol/server";
import {
  serveStdio,
  StdioServerTransport,
} from "@modelcontextprotocol/server/stdio";
import { z } from "zod";
import { handleMcpRequest } from "../src/http.js";

const modernProtocolVersion = "2026-07-28";
const createServer = vi.fn(() => {
  const server = new McpServer({ name: "fixture-transit", version: "0.1.0" });
  server.registerTool(
    "echo_stop",
    {
      description: "Echo a fixture stop name",
      inputSchema: z.object({ name: z.string() }),
    },
    async ({ name }) => ({ content: [{ type: "text", text: name }] }),
  );
  return server;
});

function request(
  body: unknown,
  options: {
    method?: string;
    headers?: Record<string, string>;
    raw?: boolean;
    path?: string;
  } = {},
): Request {
  const method = options.method ?? "POST";
  return new Request(`http://localhost/mcp${options.path ?? ""}`, {
    method,
    headers: {
      Host: "localhost",
      "Content-Type": "application/json",
      Accept: "application/json, text/event-stream",
      ...options.headers,
    },
    ...(method === "POST"
      ? { body: options.raw ? String(body) : JSON.stringify(body) }
      : {}),
  });
}

const initialize = {
  jsonrpc: "2.0",
  id: 1,
  method: "initialize",
  params: {
    protocolVersion: "2025-11-25",
    capabilities: {},
    clientInfo: { name: "local-fixture-client", version: "1.0.0" },
  },
};

async function message(response: Response): Promise<Record<string, unknown>> {
  const text = await response.text();
  if (response.headers.get("Content-Type")?.includes("text/event-stream")) {
    const data = text.split("\n").find((line) => line.startsWith("data: "));
    expect(data).toBeDefined();
    return JSON.parse(data!.slice(6)) as Record<string, unknown>;
  }
  return JSON.parse(text) as Record<string, unknown>;
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("External network access is forbidden in tests");
    }),
  );
});

describe("MCP HTTP boundary", () => {
  it("initializes a real MCP server and lists and calls a tool across stateless requests", async () => {
    const first = await handleMcpRequest(request(initialize), { createServer });
    expect(first.status).toBe(200);
    expect(await message(first)).toMatchObject({
      id: 1,
      result: { serverInfo: { name: "fixture-transit" } },
    });

    const list = await handleMcpRequest(
      request(
        { jsonrpc: "2.0", id: 2, method: "tools/list" },
        {
          headers: { "MCP-Protocol-Version": "2025-11-25" },
        },
      ),
      { createServer },
    );
    expect(list.status).toBe(200);
    expect(await message(list)).toMatchObject({
      id: 2,
      result: { tools: [{ name: "echo_stop" }] },
    });

    const call = await handleMcpRequest(
      request(
        {
          jsonrpc: "2.0",
          id: 3,
          method: "tools/call",
          params: {
            name: "echo_stop",
            arguments: { name: "Embarcadero" },
          },
        },
        { headers: { "MCP-Protocol-Version": "2025-11-25" } },
      ),
      { createServer },
    );
    expect(call.status).toBe(200);
    expect(await message(call)).toMatchObject({
      id: 3,
      result: { content: [{ text: "Embarcadero", type: "text" }] },
    });
    expect(createServer).toHaveBeenCalledTimes(3);
    expect(call.headers.get("mcp-session-id")).toBeNull();
    expect(call.headers.get("Cache-Control")).toBe("no-store");
    expect(call.headers.get("X-Content-Type-Options")).toBe("nosniff");
    expect(call.headers.get("Access-Control-Allow-Origin")).toBeNull();
  });

  it("accepts the current stateless protocol without an initialization handshake", async () => {
    const response = await handleMcpRequest(
      request(
        {
          jsonrpc: "2.0",
          id: 1,
          method: "tools/list",
          params: {
            _meta: {
              "io.modelcontextprotocol/protocolVersion": modernProtocolVersion,
              "io.modelcontextprotocol/clientInfo": {
                name: "fixture",
                version: "1",
              },
              "io.modelcontextprotocol/clientCapabilities": {},
            },
          },
        },
        {
          headers: {
            "MCP-Protocol-Version": modernProtocolVersion,
            "Mcp-Method": "tools/list",
          },
        },
      ),
      { createServer },
    );
    expect(response.status, await response.clone().text()).toBe(200);
    expect(await message(response)).toMatchObject({
      result: { tools: [{ name: "echo_stop" }] },
    });
    expect(createServer).toHaveBeenCalledTimes(1);
  });

  it.each(["", "null", "https://claude.ai", "https://evil.example"])(
    "rejects every present browser Origin (%s)",
    async (origin) => {
      const response = await handleMcpRequest(
        request(initialize, { headers: { Origin: origin } }),
        { createServer },
      );
      expect(response.status).toBe(403);
      expect(createServer).not.toHaveBeenCalled();
    },
  );

  it.each(["GET", "DELETE"])(
    "delegates %s protocol handling without authentication",
    async (method) => {
      const response = await handleMcpRequest(request(undefined, { method }), {
        createServer,
      });
      expect(response.status).toBe(405);
    },
  );

  it("rejects unsupported methods and credentials in query strings", async () => {
    expect(
      (
        await handleMcpRequest(request(undefined, { method: "OPTIONS" }), {
          createServer,
        })
      ).status,
    ).toBe(405);
    expect(
      (
        await handleMcpRequest(request(initialize, { path: "?token=secret" }), {
          createServer,
        })
      ).status,
    ).toBe(400);
    expect(createServer).not.toHaveBeenCalled();
  });

  it("lets the real protocol parser reject malformed JSON", async () => {
    const response = await handleMcpRequest(
      request("{bad-json", { raw: true }),
      { createServer },
    );
    expect(response.status).toBe(400);
    expect(await message(response)).toHaveProperty("error");
  });

  it("rejects oversized bodies with and without a declared length", async () => {
    const oversized = "x".repeat(64 * 1024 + 1);
    const streamed = await handleMcpRequest(request(oversized, { raw: true }), {
      createServer,
    });
    expect(streamed.status).toBe(413);
    const declared = await handleMcpRequest(
      request("{}", { raw: true, headers: { "Content-Length": "100000" } }),
      { createServer },
    );
    expect(declared.status).toBe(413);
    expect(createServer).not.toHaveBeenCalled();
  });

  it("sanitizes server construction failures", async () => {
    const response = await handleMcpRequest(request(initialize), {
      createServer: () => {
        throw new Error("secret upstream token");
      },
    });
    expect(response.status).toBe(500);
    expect(await response.text()).not.toContain("secret upstream token");
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
});

describe("local stdio transport", () => {
  it("serves initialization and tool discovery over pipes without network requests", async () => {
    const input = new PassThrough();
    const output = new PassThrough();
    const handle = serveStdio(createServer, {
      transport: new StdioServerTransport(input, output, {
        maxBufferSize: 64 * 1024,
      }),
      legacy: "serve",
    });
    try {
      const initialized = once(output, "data");
      input.write(`${JSON.stringify(initialize)}\n`);
      const [reply] = await initialized;
      expect(JSON.parse(String(reply))).toMatchObject({
        id: 1,
        result: { serverInfo: { name: "fixture-transit" } },
      });
      input.write(
        `${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized" })}\n`,
      );
      const listed = once(output, "data");
      input.write(
        `${JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" })}\n`,
      );
      const [list] = await listed;
      expect(JSON.parse(String(list))).toMatchObject({
        id: 2,
        result: { tools: [{ name: "echo_stop" }] },
      });
      expect(createServer).toHaveBeenCalledTimes(1);
      expect(fetch).not.toHaveBeenCalled();
    } finally {
      await handle.close();
      input.destroy();
      output.destroy();
    }
  });
});
