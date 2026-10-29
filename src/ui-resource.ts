import { createHash } from "node:crypto";
import type { McpServer } from "@modelcontextprotocol/server";
import {
  registerAppResource,
  RESOURCE_MIME_TYPE,
} from "@modelcontextprotocol/ext-apps/server";
import { WIDGET_HTML, WIDGET_RESOURCE_URI } from "./generated/widget.js";

export { WIDGET_RESOURCE_URI };

function claudeDomain(serverUrl: string): string {
  const url = new URL(serverUrl);
  const loopback = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (
    /[\u0000-\u0020\u007f]/.test(serverUrl) ||
    serverUrl.length > 2048 ||
    url.username ||
    url.password ||
    url.search ||
    url.hash ||
    (url.protocol !== "https:" && !(url.protocol === "http:" && loopback))
  ) {
    throw new Error(
      "The MCP server URL must use HTTPS or HTTP loopback without credentials, query, or fragment.",
    );
  }
  // Claude hashes the exact configured connector URL, including its path/slash.
  return `${createHash("sha256").update(serverUrl).digest("hex").slice(0, 32)}.claudemcpcontent.com`;
}

/** Static UI only: trip data arrives through the host's tool-result bridge. */
export function registerItineraryResource(
  server: McpServer,
  serverUrl?: string,
): void {
  const ui = {
    csp: {
      connectDomains: [],
      resourceDomains: [],
      frameDomains: [],
      baseUriDomains: [],
    },
    permissions: {},
    prefersBorder: true,
    ...(serverUrl !== undefined ? { domain: claudeDomain(serverUrl) } : {}),
  };
  registerAppResource(
    server,
    "Bay Area itinerary",
    WIDGET_RESOURCE_URI,
    {
      description:
        "Interactive journey alternatives, walking and transfer timelines, and service timing information.",
      mimeType: RESOURCE_MIME_TYPE,
      _meta: { ui },
    },
    async () => ({
      contents: [
        {
          uri: WIDGET_RESOURCE_URI,
          mimeType: RESOURCE_MIME_TYPE,
          text: WIDGET_HTML,
          _meta: { ui },
        },
      ],
    }),
  );
}
