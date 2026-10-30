import { handleMcpRequest, MCP_ENDPOINT } from "./http.js";
import { ATTRIBUTION, PROJECT } from "./project.js";
import { createTransitServer } from "./tools.js";
import { LISTING_ICON_BASE64 } from "./generated/branding.js";
import { renderPublicDocs } from "./public-docs.js";

const listingIcon = Uint8Array.from(atob(LISTING_ICON_BASE64), (character) =>
  character.charCodeAt(0),
);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (
      ["/sf-transit/docs", "/sf-transit/docs/"].includes(url.pathname) &&
      ["GET", "HEAD"].includes(request.method)
    ) {
      const mcpUrl = env.PUBLIC_MCP_URL || PROJECT.hostedMcpUrl;
      return new Response(
        request.method === "HEAD" ? null : renderPublicDocs(mcpUrl),
        {
          headers: {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
            "Content-Security-Policy":
              "default-src 'none'; style-src 'unsafe-inline'; img-src 'self'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
            "X-Content-Type-Options": "nosniff",
            "Referrer-Policy": "no-referrer",
          },
        },
      );
    }
    if (
      url.pathname === "/sf-transit/icon.png" &&
      ["GET", "HEAD"].includes(request.method)
    ) {
      return new Response(request.method === "HEAD" ? null : listingIcon, {
        headers: {
          "Content-Type": "image/png",
          "Content-Length": String(listingIcon.byteLength),
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "no-referrer",
        },
      });
    }
    const redirectTarget =
      url.pathname === "/"
        ? env.HOMEPAGE_URL
        : url.pathname === "/sf-transit" || url.pathname === "/sf-transit/"
          ? PROJECT.url
          : undefined;
    if (redirectTarget && ["GET", "HEAD"].includes(request.method)) {
      const destination = new URL(redirectTarget);
      destination.searchParams.set("utm_source", PROJECT.name);
      return new Response(null, {
        status: 308,
        headers: {
          Location: destination.href,
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
