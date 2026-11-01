import { handleMcpRequest, MCP_ENDPOINT } from "./http.js";
import { ATTRIBUTION, PROJECT } from "./project.js";
import { createTransitServer } from "./tools.js";
import { PUBLIC_ASSETS_BASE64 } from "./generated/public-assets.js";
import { renderPublicDocs } from "./public-docs.js";
import { renderPublicPrivacy } from "./public-privacy.js";

const publicAssets: ReadonlyMap<string, Uint8Array> = new Map(
  Object.entries(PUBLIC_ASSETS_BASE64).map(
    ([path, encoded]) =>
      [
        path,
        Uint8Array.from(atob(encoded), (character) => character.charCodeAt(0)),
      ] as const,
  ),
);

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);
    if (
      [
        "/sf-transit",
        "/sf-transit/",
        "/sf-transit/privacy",
        "/sf-transit/privacy/",
      ].includes(url.pathname) &&
      ["GET", "HEAD"].includes(request.method)
    ) {
      const mcpUrl = env.PUBLIC_MCP_URL || PROJECT.hostedMcpUrl;
      return new Response(
        request.method === "HEAD"
          ? null
          : url.pathname.startsWith("/sf-transit/privacy")
            ? renderPublicPrivacy()
            : renderPublicDocs(mcpUrl),
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
    const publicAsset = publicAssets.get(url.pathname);
    if (publicAsset && ["GET", "HEAD"].includes(request.method)) {
      return new Response(request.method === "HEAD" ? null : publicAsset, {
        headers: {
          "Content-Type": url.pathname.endsWith(".jpg")
            ? "image/jpeg"
            : "image/png",
          "Content-Length": String(publicAsset.byteLength),
          "Cache-Control": "public, max-age=3600",
          "Access-Control-Allow-Origin": "*",
          "X-Content-Type-Options": "nosniff",
          "Referrer-Policy": "no-referrer",
        },
      });
    }
    const redirectTarget = url.pathname === "/" ? env.HOMEPAGE_URL : undefined;
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
