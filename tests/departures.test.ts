import { describe, expect, it, vi } from "vitest";
import bart from "./fixtures/departures-bart.json";
import muni from "./fixtures/departures-muni.json";
import fremont from "./fixtures/departures-fremont.json";
import { createRoutingClient } from "../src/routing/client.js";
import { getStopDeparturesInputSchema } from "../src/routing/schemas.js";
import { formatStopDepartures } from "../src/format.js";
const now = () => new Date("2026-10-31T23:50:00Z");
const request = (
  data: { place: { stopId: string; lat: number; lon: number } } = bart,
) => ({
  stop: {
    stopId: data.place.stopId,
    latitude: data.place.lat,
    longitude: data.place.lon,
  },
});
function setup(data: unknown, status = 200) {
  const fetcher = vi
    .fn<typeof fetch>()
    .mockImplementation(async () => Response.json(data, { status }));
  const onFailure = vi.fn();
  const client = createRoutingClient({
    baseUrl: "http://localhost:8080",
    userAgent: "fixture/1.0 (+https://example.org/contact)",
    fetcher,
    now,
    onFailure,
  });
  return { client, fetcher, onFailure };
}
describe("stop departures", () => {
  it("normalizes BART parent stations and bounded single-request live predictions", async () => {
    const { client, fetcher } = setup(bart);
    const result = await client.getStopDepartures(request());
    expect(result).toMatchObject({
      kind: "departures",
      requestedTime: now().toISOString(),
      generatedAt: now().toISOString(),
      timeZone: "America/Los_Angeles",
      stop: { stopId: bart.place.stopId },
    });
    expect(result.departures[0]).toMatchObject({
      realTime: true,
      routeColor: "0099cc",
      pickupAllowed: true,
    });
    expect(fetcher).toHaveBeenCalledTimes(1);
    const [url, init] = fetcher.mock.calls[0]!;
    expect(String(url)).toContain("/api/v6/stoptimes?");
    expect(new URL(String(url)).searchParams.get("n")).toBe("10");
    expect(init?.redirect).toBe("manual");
    expect(formatStopDepartures(result)).toContain("live prediction");
  });
  it("normalizes only known BART line names while retaining IDs and destinations", async () => {
    const data = structuredClone(bart);
    Object.assign(data.stopTimes[1]!, {
      agencyId: "OTHER",
      agencyName: "Other Agency",
    });
    const result = await setup(data).client.getStopDepartures(request());
    expect(result.departures[0]).toMatchObject({
      route: "Blue",
      routeId: data.stopTimes[0]!.routeId,
      headsign: data.stopTimes[0]!.headsign,
    });
    expect(result.departures[1]!.route).toBe("Green-N");
  });
  it("accepts omitted optional Place flags while using required event flags", async () => {
    const data = structuredClone(bart);
    Reflect.deleteProperty(data.stopTimes[0]!.place, "pickupType");
    Reflect.deleteProperty(data.stopTimes[0]!.place, "cancelled");
    const result = await setup(data).client.getStopDepartures(request());
    expect(result.departures[0]).toMatchObject({
      cancelled: false,
      pickupAllowed: true,
    });
  });

  it("keeps the Fremont board usable while excluding adjacent Market Street services", async () => {
    const { client, fetcher } = setup(fremont);
    const result = await client.getStopDepartures({
      ...request(fremont),
      limit: 20,
      departureTime: "2026-11-01T00:00:00Z",
    });
    const matching = fremont.stopTimes
      .filter((item) => item.place.stopId === fremont.place.stopId)
      .filter(
        (item) =>
          Date.parse(
            item.realTime
              ? item.place.departure
              : item.place.scheduledDeparture,
          ) >= Date.parse(result.requestedTime),
      );
    expect(matching.length).toBeGreaterThan(0);
    expect(
      fremont.stopTimes.some(
        (item) => item.place.stopId !== fremont.place.stopId,
      ),
    ).toBe(true);
    expect(result.departures).toHaveLength(matching.length);
    expect(
      result.departures.every((item) => item.stopId === fremont.place.stopId),
    ).toBe(true);
    expect(result.stop.stopId).toBe(fremont.place.stopId);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("does not include sibling platforms when a child stop is selected", async () => {
    const data = structuredClone(bart);
    Object.assign(data.place, {
      stopId: data.stopTimes[0]!.place.stopId,
      parentId: bart.place.stopId,
    });
    const result = await setup(data).client.getStopDepartures(request(data));
    expect(result.departures.length).toBeGreaterThan(0);
    expect(
      result.departures.every((item) => item.stopId === data.place.stopId),
    ).toBe(true);
  });
  it("rejects a mismatched top-level stop even when events match", async () => {
    const data = structuredClone(bart);
    data.place.stopId = "other";
    await expect(
      setup(data).client.getStopDepartures(request()),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("uses scheduled departure and platform when live estimates are unavailable", async () => {
    const data = structuredClone(muni);
    data.stopTimes[0]!.place.departure = "2026-11-01T02:00:00Z";
    Object.assign(data.stopTimes[0]!.place, {
      track: "live-platform",
      scheduledTrack: "scheduled-platform",
    });
    const result = await setup(data).client.getStopDepartures(request(data));
    expect(result.departures[0]).toMatchObject({
      departureTime: data.stopTimes[0]!.place.scheduledDeparture,
      realTime: false,
      platform: "scheduled-platform",
    });
    expect(formatStopDepartures(result)).toContain("scheduled");
  });
  it("preserves cancellations and boarding restrictions", async () => {
    const data = structuredClone(bart);
    data.stopTimes[0]!.tripCancelled = true;
    data.stopTimes[1]!.pickupDropoffType = "NOT_ALLOWED";
    const result = await setup(data).client.getStopDepartures(request());
    expect(result.departures[0]).toMatchObject({
      cancelled: true,
      pickupAllowed: false,
    });
    expect(result.departures[1]).toMatchObject({
      cancelled: false,
      pickupAllowed: false,
    });
    expect(formatStopDepartures(result)).toContain("CANCELLED");
  });
  it("keeps live and scheduled status per event in a mixed response", async () => {
    const data = structuredClone(bart);
    data.stopTimes[1]!.realTime = false;
    data.stopTimes[1]!.place.departure = "2026-11-01T02:00:00Z";
    const result = await setup(data).client.getStopDepartures(request());
    expect(
      result.departures.find(
        (item) => item.routeId === data.stopTimes[1]!.routeId,
      ),
    ).toMatchObject({
      realTime: false,
      departureTime: data.stopTimes[1]!.place.scheduledDeparture,
    });
    expect(result.departures.some((item) => item.realTime)).toBe(true);
    expect(result.warnings).toHaveLength(2);
  });

  it("filters departed events against requested time, sorts and limits", async () => {
    const data = structuredClone(bart);
    data.stopTimes.reverse();
    const result = await setup(data).client.getStopDepartures({
      ...request(),
      departureTime: "2026-10-31T23:58:00Z",
      limit: 1,
    });
    expect(result.departures).toHaveLength(1);
    expect(
      Date.parse(result.departures[0]!.departureTime),
    ).toBeGreaterThanOrEqual(Date.parse(result.requestedTime));
  });
  it("accepts a valid empty timetable", async () => {
    const result = await setup({
      ...bart,
      stopTimes: [],
    }).client.getStopDepartures(request());
    expect(result.departures).toEqual([]);
    expect(result.warnings).toHaveLength(1);
  });
  it.each(["region", "distance", "flag", "oversize"])(
    "rejects %s provider response",
    async (kind) => {
      const data = structuredClone(bart);
      if (kind === "region") data.stopTimes[0]!.place.lat = 51;
      if (kind === "distance") data.stopTimes[0]!.place.lat = 38;
      if (kind === "flag")
        Object.assign(data.stopTimes[0]!, { realTime: "true" });
      if (kind === "oversize")
        data.stopTimes = Array(501).fill(data.stopTimes[0]);
      await expect(
        setup(data).client.getStopDepartures(request()),
      ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
    },
  );
  it("rejects provider HTTP errors with safe operation metadata", async () => {
    const { client, onFailure } = setup({}, 503);
    await expect(client.getStopDepartures(request())).rejects.toMatchObject({
      code: "UNAVAILABLE",
    });
    expect(onFailure).toHaveBeenCalledWith(
      expect.objectContaining({
        operation: "get_stop_departures",
        status: 503,
      }),
    );
  });
  it.each([
    { stop: { stopId: "x", latitude: 51, longitude: 0 } },
    { stop: { stopId: "", latitude: 37.7, longitude: -122.4 } },
    { ...request(), limit: 21 },
    { ...request(), departureTime: "2026-10-31T12:00:00" },
  ])("rejects invalid input without a request", async (input) => {
    expect(getStopDeparturesInputSchema.safeParse(input).success).toBe(false);
    const { client, fetcher } = setup(bart);
    await expect(client.getStopDepartures(input)).rejects.toMatchObject({
      code: "INVALID_INPUT",
    });
    expect(fetcher).not.toHaveBeenCalled();
  });
});
