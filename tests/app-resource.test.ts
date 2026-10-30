import { createHash } from "node:crypto";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleMcpRequest } from "../src/http.js";
import { createTransitServer } from "../src/tools.js";
import { WIDGET_HTML, WIDGET_RESOURCE_URI } from "../src/generated/widget.js";

interface UiMeta {
  csp: {
    connectDomains: string[];
    resourceDomains: string[];
    frameDomains: string[];
    baseUriDomains: string[];
  };
  permissions: Record<string, unknown>;
  domain?: string;
}
interface Result {
  result?: {
    tools?: {
      name: string;
      _meta?: {
        ui?: { resourceUri?: string; visibility?: string[] };
        "ui/resourceUri"?: string;
      };
    }[];
    resources?: { uri: string; mimeType: string; _meta: { ui: UiMeta } }[];
    contents?: {
      uri: string;
      mimeType: string;
      text: string;
      _meta: { ui: UiMeta };
    }[];
  };
  error?: unknown;
}

async function rpc(
  method: string,
  params: unknown = {},
  serverUrl?: string,
): Promise<Result> {
  const response = await handleMcpRequest(
    new Request("http://localhost/sf-transit/mcp", {
      method: "POST",
      headers: {
        Host: "localhost",
        Accept: "application/json, text/event-stream",
        "Content-Type": "application/json",
        "MCP-Protocol-Version": "2025-11-25",
      },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    }),
    {
      createServer: () =>
        createTransitServer(serverUrl === undefined ? {} : { serverUrl }),
    },
  );
  expect(response.status).toBe(200);
  const body = await response.text();
  const payload = response.headers
    .get("Content-Type")
    ?.includes("text/event-stream")
    ? body
        .split("\n")
        .find((line) => line.startsWith("data: "))!
        .slice(6)
    : body;
  return JSON.parse(payload) as Result;
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("External network forbidden in tests");
    }),
  );
});

describe("MCP itinerary app resource", () => {
  it("links plan_trip to the bundled content-addressed UI and retains model and app access", async () => {
    const reply = await rpc("tools/list");
    const tool = reply.result?.tools?.find((item) => item.name === "plan_trip");
    expect(tool?._meta?.ui).toEqual({
      resourceUri: WIDGET_RESOURCE_URI,
      visibility: ["model", "app"],
    });
    expect(tool?._meta?.["ui/resourceUri"]).toBe(WIDGET_RESOURCE_URI);
    const match = /^ui:\/\/sf-transit\/itinerary-([a-f0-9]{8,64})\.html$/.exec(
      WIDGET_RESOURCE_URI,
    );
    expect(match).not.toBeNull();
    expect(createHash("sha256").update(WIDGET_HTML).digest("hex")).toMatch(
      new RegExp(`^${match![1]}`),
    );
    expect(fetch).not.toHaveBeenCalled();
  });

  it("serves the static HTML with MCP App MIME and denies external domains and browser permissions", async () => {
    const listing = await rpc("resources/list");
    const resource = listing.result?.resources?.find(
      (item) => item.uri === WIDGET_RESOURCE_URI,
    );
    expect(resource?.mimeType).toBe("text/html;profile=mcp-app");
    const reply = await rpc("resources/read", { uri: WIDGET_RESOURCE_URI });
    const content = reply.result?.contents?.[0];
    expect(content).toMatchObject({
      uri: WIDGET_RESOURCE_URI,
      mimeType: "text/html;profile=mcp-app",
      text: WIDGET_HTML,
    });
    expect(content?._meta.ui).toEqual(resource?._meta.ui);
    expect(content?._meta.ui.csp).toEqual({
      connectDomains: [],
      resourceDomains: [],
      frameDomains: [],
      baseUriDomains: [],
    });
    expect(content?._meta.ui.permissions).toEqual({});
    expect(content?._meta.ui).not.toHaveProperty("domain");
    expect(WIDGET_HTML).toMatch(/<!doctype html>/i);
    expect(WIDGET_HTML).not.toMatch(/<script\b[^>]*\bsrc\s*=/i);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("derives Claude's stable domain from the exact configured connector URL", async () => {
    const reply = await rpc(
      "resources/read",
      { uri: WIDGET_RESOURCE_URI },
      "https://example.com/mcp",
    );
    expect(reply.result?.contents?.[0]?._meta.ui.domain).toBe(
      "c3d80a4ed901ee05b21755a88273b4a4.claudemcpcontent.com",
    );
    const slash = await rpc(
      "resources/read",
      { uri: WIDGET_RESOURCE_URI },
      "https://example.com/mcp/",
    );
    expect(slash.result?.contents?.[0]?._meta.ui.domain).not.toBe(
      reply.result?.contents?.[0]?._meta.ui.domain,
    );
  });

  it.each([
    "http://localhost:8787/mcp",
    "http://127.0.0.1:8787/mcp",
    "http://[::1]:8787/mcp",
  ])(
    "supports an explicitly configured loopback server URL: %s",
    async (serverUrl) => {
      const reply = await rpc(
        "resources/read",
        { uri: WIDGET_RESOURCE_URI },
        serverUrl,
      );
      expect(reply.result?.contents?.[0]?._meta.ui.domain).toMatch(
        /^[a-f0-9]{32}\.claudemcpcontent\.com$/,
      );
    },
  );

  it.each([
    "http://example.com/mcp",
    "https://user:password@example.com/mcp",
    "https://example.com/mcp?token=value",
    "https://example.com/mcp#fragment",
    "file:///tmp/mcp",
    "not-a-url",
    " https://example.com/mcp ",
    "https://exa\nmple.com/mcp",
  ])(
    "rejects invalid configured server URLs before serving the resource: %s",
    (serverUrl) => {
      expect(() => createTransitServer({ serverUrl })).toThrow();
      expect(fetch).not.toHaveBeenCalled();
    },
  );

  it("does not resolve arbitrary UI URIs or fetch remote resources", async () => {
    const reply = await rpc("resources/read", {
      uri: "https://example.com/untrusted.html",
    });
    expect(reply.error).toBeDefined();
    expect(fetch).not.toHaveBeenCalled();
  });
});
