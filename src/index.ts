import { handleMcpRequest, MCP_ENDPOINT } from "./http.js";
import { ATTRIBUTION, PROJECT } from "./project.js";
import { createTransitServer } from "./tools.js";

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    const redirectTarget =
      url.pathname === "/"
        ? env.HOMEPAGE_URL
        : url.pathname === "/sf-transit" || url.pathname === "/sf-transit/"
          ? PROJECT.url
          : undefined;
    if (redirectTarget && ["GET", "HEAD"].includes(request.method)) {
      return new Response(null, {
        status: 308,
        headers: {
          Location: redirectTarget,
          "Cache-Control": "public, max-age=3600",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "no-referrer",
        },
      });
    }
    if (url.pathname === "/" && request.method === "GET") {
      return Response.json(
        {
          name: PROJECT.name,
          version: PROJECT.version,
          source: PROJECT.url,
          mcpEndpoint: MCP_ENDPOINT,
          authenticationRequired: false,
          description:
            "San Francisco and Bay Area trip planning via Transitous.",
          usagePolicy: "https://transitous.org/api/",
          attribution: ATTRIBUTION,
        },
        {
          headers: {
            "Cache-Control": "no-store",
            "X-Content-Type-Options": "nosniff",
          },
        },
      );
    }
    return handleMcpRequest(request, {
      createServer: () => {
        const serverUrl = env.PUBLIC_MCP_URL;
        // Only pin the configured origin and path. Aliases use the host's default
        // widget sandbox rather than another connector URL's domain hash.
        const configuredUrl = serverUrl ? new URL(serverUrl) : undefined;
        return createTransitServer(
          serverUrl &&
            configuredUrl?.origin === url.origin &&
            configuredUrl.pathname === url.pathname
            ? { serverUrl }
            : {},
        );
      },
    });
  },
} satisfies ExportedHandler<Env>;
