import { beforeEach, describe, expect, it, vi } from "vitest";
import { handleMcpRequest } from "../src/http.js";
import { createTransitServer } from "../src/tools.js";
import { ATTRIBUTION } from "../src/project.js";

// Synthetic timetable: public place names, invented services and times, never live data.
const origin = {
  latitude: 37.7955,
  longitude: -122.3937,
  label: "Ferry Building",
};
const destination = {
  latitude: 37.7936,
  longitude: -122.4836,
  label: "Baker Beach",
};
const at = (minute: number) =>
  `2026-10-29T14:${String(minute).padStart(2, "0")}:00-07:00`;
const place = (name: string, point = origin) => ({
  name,
  lat: point.latitude,
  lon: point.longitude,
});
const fixtureLeg = (
  mode: string,
  start: number,
  end: number,
  from: string,
  to: string,
) => ({
  mode,
  startTime: at(start),
  endTime: at(end),
  scheduledStartTime: at(start),
  scheduledEndTime: at(end),
  duration: (end - start) * 60,
  realTime: false,
  from: place(from),
  to: place(to),
});
const fixture = {
  direct: [],
  itineraries: [
    {
      duration: 40 * 60,
      startTime: at(5),
      endTime: at(45),
      transfers: 1,
      legs: [
        fixtureLeg("WALK", 5, 10, "Ferry Building", "Embarcadero"),
        {
          ...fixtureLeg("BUS", 15, 35, "Embarcadero", "Presidio"),
          scheduledStartTime: at(12),
          scheduledEndTime: at(32),
          realTime: true,
          agencyName: "TEST ONLY",
          routeShortName: "FIXTURE-1",
          headsign: "Presidio",
        },
        {
          ...fixtureLeg("BUS", 38, 45, "Presidio", "Baker Beach"),
          agencyName: "TEST ONLY",
          routeShortName: "FIXTURE-2",
          headsign: "Baker Beach",
        },
      ],
    },
  ],
};

interface RpcResult {
  result?: {
    content?: { type: string; text: string }[];
    structuredContent?: Record<string, unknown>;
    isError?: boolean;
    tools?: { name: string; annotations: { readOnlyHint: boolean } }[];
  };
  error?: unknown;
}

function harness(
  fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json(fixture)),
  protocolVersion = "2025-11-25",
) {
  const createServer = () =>
    createTransitServer({
      fetcher,
      now: () => new Date("2026-10-29T21:00:00Z"),
    });
  let id = 0;
  async function rpc(
    method: string,
    params: Record<string, unknown> = {},
  ): Promise<RpcResult> {
    const response = await handleMcpRequest(
      new Request("http://localhost/mcp", {
        method: "POST",
        headers: {
          Host: "localhost",
          Accept: "application/json, text/event-stream",
          "Content-Type": "application/json",
          "MCP-Protocol-Version": protocolVersion,
          "Mcp-Method": method,
          ...(typeof params.name === "string"
            ? { "Mcp-Name": params.name }
            : {}),
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: ++id,
          method,
          params: {
            ...params,
            ...(protocolVersion === "2026-07-28"
              ? {
                  _meta: {
                    "io.modelcontextprotocol/protocolVersion": protocolVersion,
                    "io.modelcontextprotocol/clientInfo": {
                      name: "offline-fixture",
                      version: "1",
                    },
                    "io.modelcontextprotocol/clientCapabilities": {},
                  },
                }
              : {}),
          },
        }),
      }),
      { createServer },
    );
    expect(response.status).toBe(200);
    const text = await response.text();
    const payload = response.headers
      .get("Content-Type")
      ?.includes("text/event-stream")
      ? text
          .split("\n")
          .find((line) => line.startsWith("data: "))!
          .slice(6)
      : text;
    return JSON.parse(payload) as RpcResult;
  }
  const call = (name: string, arguments_: unknown = {}) =>
    rpc("tools/call", { name, arguments: arguments_ });
  return { fetcher, rpc, call };
}

beforeEach(() => {
  vi.stubGlobal(
    "fetch",
    vi.fn(() => {
      throw new Error("External network forbidden in tests");
    }),
  );
});

describe("transit tools through real MCP HTTP", () => {
  it("serves a complete trip and widget refresh inputs over the July 2026 protocol", async () => {
    const { call, fetcher } = harness(undefined, "2026-07-28");
    const result = await call("plan_trip", { origin, destination });
    expect(result).toMatchObject({
      result: {
        resultType: "complete",
        _meta: {
          "io.modelcontextprotocol/serverInfo": { name: "sf-transit-mcp" },
        },
        structuredContent: {
          request: { origin, destination, modes: ["transit"] },
          itineraries: [{ durationSeconds: 2400, transfers: 1 }],
          attribution: ATTRIBUTION,
        },
      },
    });
    expect(result.result?.isError).not.toBe(true);
    expect(result.result?.content?.[0]?.text).toContain("2:45 PM PDT");
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("initializes and exposes three read-only tools without contacting an upstream", async () => {
    const { rpc, fetcher } = harness();
    expect(
      await rpc("initialize", {
        protocolVersion: "2025-11-25",
        capabilities: {},
        clientInfo: { name: "fixture", version: "1" },
      }),
    ).toMatchObject({ result: { serverInfo: { name: "sf-transit-mcp" } } });
    const result = await rpc("tools/list");
    expect(result.result?.tools?.map((tool) => tool.name)).toEqual([
      "search_places",
      "plan_trip",
      "get_service_info",
    ]);
    expect(
      result.result?.tools?.every((tool) => tool.annotations.readOnlyHint),
    ).toBe(true);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("returns ambiguous search candidates with attribution in text and structured content", async () => {
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      Response.json([
        {
          id: "fixture-beach",
          name: "Baker Beach",
          lat: destination.latitude,
          lon: destination.longitude,
          type: "PLACE",
          areas: [{ name: "San Francisco", default: true }],
        },
        {
          id: "fixture-entrance",
          name: "Baker Beach entrance",
          lat: 37.7925,
          lon: -122.4825,
          type: "PLACE",
          areas: [],
        },
      ]),
    );
    const { call } = harness(fetcher);
    const reply = await call("search_places", {
      query: "Baker Beach, San Francisco",
    });
    expect(reply.result?.structuredContent).toMatchObject({
      requiresSelection: true,
      candidates: [
        { id: "fixture-beach", label: "Baker Beach, San Francisco" },
        { id: "fixture-entrance" },
      ],
      attribution: ATTRIBUTION,
    });
    for (const source of ATTRIBUTION)
      expect(reply.result?.content?.[0]?.text).toContain(source.url);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("renders Pacific clock times, requested-time waiting, transfers, and distinct live/scheduled legs", async () => {
    const { call, fetcher } = harness();
    const reply = await call("plan_trip", { origin, destination });
    const text = reply.result?.content?.[0]?.text ?? "";
    expect(reply.result?.isError).not.toBe(true);
    expect(text).toContain("2:05 PM PDT");
    expect(text).toContain("2:45 PM PDT");
    expect(text).toContain(
      "Wait before leaving: 5 min. Total from requested departure time: 45 min.",
    );
    expect(text).toContain("Wait 5 min at Embarcadero");
    expect(text).toContain("Wait 3 min at Presidio");
    expect(text).toContain("live prediction; last update time not provided");
    expect(text).toContain("Scheduled departure: Oct 29, 2:12 PM PDT");
    expect(text).toContain("7 min, scheduled");
    const structured = reply.result?.structuredContent;
    expect(structured).toMatchObject({
      request: {
        origin,
        destination,
        modes: ["transit"],
        limit: 3,
        wheelchair: false,
      },
      wheelchairRequested: false,
      requestedTime: "2026-10-29T21:00:00.000Z",
      timeZone: "America/Los_Angeles",
      attribution: ATTRIBUTION,
      itineraries: [
        {
          durationSeconds: 2400,
          walkingSeconds: 300,
          waitingSeconds: 480,
          transfers: 1,
          legs: [
            { mode: "WALK" },
            {
              realTime: true,
              scheduledDepartureTime: at(12),
              departureTime: at(15),
            },
            { realTime: false },
          ],
        },
      ],
    });
    expect(structured?.request).not.toHaveProperty("departureTime");
    expect(structured?.request).not.toHaveProperty("arrivalTime");
    for (const source of ATTRIBUTION) expect(text).toContain(source.url);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("uses explicit requested departure time instead of the injected current clock when calculating waits", async () => {
    const { call } = harness();
    const reply = await call("plan_trip", {
      origin,
      destination,
      departureTime: at(3),
    });
    expect(reply.result?.content?.[0]?.text).toContain(
      "Wait before leaving: 2 min. Total from requested departure time: 42 min.",
    );
    expect(reply.result?.structuredContent?.request).toMatchObject({
      origin,
      destination,
      departureTime: at(3),
    });
    expect(reply.result?.structuredContent?.request).not.toHaveProperty(
      "arrivalTime",
    );
  });

  it("preserves arrive-by intention and supplied settings for an explicit UI refresh", async () => {
    const { call } = harness();
    const request = {
      origin,
      destination,
      arrivalTime: at(50),
      modes: ["transit"],
      maxTransfers: 2,
      limit: 1,
      wheelchair: true,
    };
    const reply = await call("plan_trip", request);
    expect(reply.result?.isError).not.toBe(true);
    expect(reply.result?.structuredContent).toMatchObject({
      request,
      wheelchairRequested: true,
      timeType: "arriveBy",
    });
    expect(reply.result?.structuredContent?.request).not.toHaveProperty(
      "departureTime",
    );
  });

  it("renders known and unknown wheelchair accessibility separately for transit legs", async () => {
    const accessibleFixture = structuredClone(fixture);
    Object.assign(accessibleFixture.itineraries[0]!.legs[1]!, {
      wheelchairAccessible: "ACCESSIBLE",
    });
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(Response.json(accessibleFixture));
    const { call } = harness(fetcher);
    const reply = await call("plan_trip", {
      origin,
      destination,
      wheelchair: true,
    });
    const text = reply.result?.content?.[0]?.text ?? "";
    expect(text).toContain("Wheelchair accessibility: reported accessible.");
    expect(text).toContain(
      "Wheelchair accessibility: unknown in the source data.",
    );
    expect(reply.result?.structuredContent).toMatchObject({
      itineraries: [
        {
          legs: [
            { mode: "WALK" },
            { wheelchairAccessible: true },
            { realTime: false },
          ],
        },
      ],
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it("returns service information and a deterministic clock without network access", async () => {
    const { call, fetcher } = harness();
    const reply = await call("get_service_info");
    expect(reply.result?.structuredContent).toMatchObject({
      currentTime: "2026-10-29T21:00:00.000Z",
      apiKeyRequired: false,
      authenticationRequired: false,
      storedProfiles: false,
    });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it.each([
    ["plan_trip", { origin, destination, departureTime: "tomorrow" }],
    ["plan_trip", { origin: { latitude: 51, longitude: 0 }, destination }],
    ["search_places", { query: "" }],
    ["get_service_info", { unexpected: true }],
  ])(
    "rejects invalid %s arguments before contacting an upstream",
    async (name, args) => {
      const { call, fetcher } = harness();
      const reply = await call(String(name), args);
      expect(Boolean(reply.error) || reply.result?.isError).toBe(true);
      expect(fetcher).not.toHaveBeenCalled();
    },
  );

  it("turns provider failure into a safe tool error without leaking response text or request coordinates", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockResolvedValue(
        new Response("PRIVATE_PROVIDER_STACK", { status: 503 }),
      );
    const { call } = harness(fetcher);
    const reply = await call("plan_trip", { origin, destination });
    expect(reply.result?.isError).toBe(true);
    const text = reply.result?.content?.[0]?.text ?? "";
    expect(text).toContain("UNAVAILABLE");
    expect(text).not.toContain("PRIVATE_PROVIDER_STACK");
    expect(text).not.toContain(String(origin.latitude));
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
});
