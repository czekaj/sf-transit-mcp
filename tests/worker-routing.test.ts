import { afterEach, beforeAll, describe, expect, it, vi } from "vitest";
import { build } from "esbuild";
import { fileURLToPath } from "node:url";
import {
  Miniflare,
  Response as FixtureResponse,
  convertV4MiniflareOptions,
  type V4FetchHandler,
} from "miniflare";

let script: string;
let runtime: Miniflare | undefined;

beforeAll(async () => {
  const result = await build({
    stdin: {
      resolveDir: fileURLToPath(new URL("..", import.meta.url)),
      contents: `
        import { createRoutingClient } from "./src/routing/client.ts";
        export default {
          async fetch(request) {
            const client = createRoutingClient({
              baseUrl: "https://routing.fixture.invalid",
              userAgent: "sf-transit-mcp-test/0.1.0 (+https://example.org/contact)",
              fetcher: (input, init) => fetch(input, init),
              now: () => new Date("2026-10-31T20:00:00Z"),
            });
            try {
              const result = new URL(request.url).pathname === "/plan"
                ? await client.planTrip({
                    origin: { latitude: 37.77, longitude: -122.43 },
                    destination: { latitude: 37.79, longitude: -122.48 },
                  })
                : await client.searchPlaces({ query: "Fixture Station" });
              return Response.json(result);
            } catch (error) {
              return Response.json({ code: error.code, message: error.message }, { status: 502 });
            }
          }
        };
      `,
    },
    bundle: true,
    format: "esm",
    platform: "browser",
    target: "es2022",
    write: false,
  });
  script = result.outputFiles[0]!.text;
});

afterEach(async () => {
  await runtime?.dispose();
  runtime = undefined;
});

function start(outboundService: V4FetchHandler): Miniflare {
  // Every outbound call stays in this fixture handler. Disable Cloudflare
  // metadata discovery so neither the Worker nor the harness uses live services.
  runtime = new Miniflare(
    convertV4MiniflareOptions({
      cf: false,
      modules: true,
      compatibilityDate: "2026-10-29",
      compatibilityFlags: ["nodejs_compat"],
      script,
      outboundService,
    }),
  );
  return runtime;
}

describe("routing in the actual Workers runtime with a fake provider", () => {
  it("completes place search using a redirect mode supported by Workers", async () => {
    const provider = vi.fn<V4FetchHandler>().mockImplementation((request) => {
      expect(new URL(request.url).hostname).toBe("routing.fixture.invalid");
      return FixtureResponse.json([
        {
          id: "fixture-station",
          name: "Fixture Station",
          type: "STOP",
          lat: 37.78,
          lon: -122.45,
          areas: [],
        },
      ]);
    });
    const response = await start(provider).dispatchFetch(
      "http://localhost/search",
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      candidates: [{ label: "Fixture Station" }],
    });
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it("completes trip planning without contacting a live routing service", async () => {
    const from = { name: "START", lat: 37.77, lon: -122.43 };
    const to = { name: "END", lat: 37.79, lon: -122.48 };
    const startTime = "2026-10-31T21:00:00Z";
    const endTime = "2026-10-31T21:30:00Z";
    const provider = vi.fn<V4FetchHandler>().mockImplementation((request) => {
      expect(new URL(request.url).pathname).toBe("/api/v6/plan");
      return FixtureResponse.json({
        direct: [],
        itineraries: [
          {
            duration: 1800,
            startTime,
            endTime,
            transfers: 0,
            legs: [
              {
                mode: "BUS",
                startTime,
                endTime,
                scheduledStartTime: startTime,
                scheduledEndTime: endTime,
                duration: 1800,
                realTime: false,
                from,
                to,
              },
            ],
          },
        ],
      });
    });
    const response = await start(provider).dispatchFetch(
      "http://localhost/plan",
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      itineraries: [{ durationSeconds: 1800 }],
    });
    expect(provider).toHaveBeenCalledTimes(1);
  });

  it.each([301, 302, 303, 307, 308])(
    "rejects a %s redirect without sending data to the redirect destination",
    async (status) => {
      const provider = vi.fn<V4FetchHandler>().mockImplementation(
        () =>
          new FixtureResponse(null, {
            status,
            headers: {
              Location: "https://other.fixture.invalid/?private=SECRET",
            },
          }),
      );
      const response = await start(provider).dispatchFetch(
        "http://localhost/search",
      );
      expect(response.status).toBe(502);
      const body = await response.text();
      expect(body).toContain("UNAVAILABLE");
      expect(body).not.toContain("SECRET");
      expect(body).not.toContain("other.fixture.invalid");
      expect(provider).toHaveBeenCalledTimes(1);
    },
  );
});
