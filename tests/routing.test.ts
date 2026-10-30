import { afterEach, describe, expect, it, vi } from "vitest";
import { createRoutingClient, RoutingError } from "../src/routing/client.js";
import {
  planTripInputSchema,
  searchPlacesInputSchema,
} from "../src/routing/schemas.js";

const point = { latitude: 37.77, longitude: -122.43 };
const input = {
  origin: point,
  destination: { latitude: 37.79, longitude: -122.48 },
};
const start = "2026-10-29T14:00:00-07:00";
const end = "2026-10-29T14:30:00-07:00";
const place = { name: "Stop", lat: 37.78, lon: -122.45, stopId: "SF_1" };
const transitLeg = {
  mode: "BUS",
  startTime: start,
  endTime: end,
  scheduledStartTime: "2026-10-29T13:58:00-07:00",
  scheduledEndTime: "2026-10-29T14:28:00-07:00",
  duration: 1800,
  realTime: true,
  from: place,
  to: place,
  agencyName: "Muni",
  routeShortName: "29",
  headsign: "Baker Beach",
  source: "SECRET INTERNAL PATH",
};
const trip = {
  duration: 1800,
  startTime: start,
  endTime: end,
  transfers: 0,
  legs: [transitLeg],
};
const fixture = {
  direct: [],
  itineraries: [trip],
  requestParameters: { key: "SECRET" },
};
const now = () => new Date("2026-10-29T20:50:00Z");
const userAgent = "sf-transit-mcp-test/0.1.0 (+https://example.org/contact)";
function clientWith(data: unknown) {
  const fetcher = vi.fn<typeof fetch>().mockResolvedValue(Response.json(data));
  return {
    fetcher,
    client: createRoutingClient({
      baseUrl: "http://localhost:8080",
      userAgent,
      fetcher,
      now,
    }),
  };
}
afterEach(() => vi.useRealTimers());

describe("routing input", () => {
  it("requires Bay Area coordinates, valid explicit timezone times, and one time direction", () => {
    expect(
      planTripInputSchema.safeParse({
        ...input,
        departureTime: "2026-10-29T14:00:00",
      }).success,
    ).toBe(false);
    expect(
      planTripInputSchema.safeParse({
        ...input,
        departureTime: start,
        arrivalTime: end,
      }).success,
    ).toBe(false);
    expect(
      planTripInputSchema.safeParse({
        ...input,
        origin: { latitude: 51, longitude: -122 },
      }).success,
    ).toBe(false);
    expect(
      planTripInputSchema.safeParse({
        ...input,
        origin: { latitude: NaN, longitude: -122 },
      }).success,
    ).toBe(false);
    expect(
      planTripInputSchema.safeParse({ ...input, modes: ["car"] }).success,
    ).toBe(false);
    expect(searchPlacesInputSchema.safeParse({ query: " " }).success).toBe(
      false,
    );
  });
});

describe("MOTIS client", () => {
  it("replaces endpoint sentinels while preserving snapped coordinates and intermediate names", async () => {
    const middleStart = "2026-10-29T14:10:00-07:00";
    const middleEnd = "2026-10-29T14:20:00-07:00";
    const response = {
      direct: [],
      itineraries: [
        {
          ...trip,
          legs: [
            {
              ...transitLeg,
              mode: "WALK",
              duration: 600,
              endTime: middleStart,
              from: { ...place, name: "START" },
              to: { ...place, name: "Boarding Stop" },
            },
            {
              ...transitLeg,
              duration: 600,
              startTime: middleStart,
              endTime: middleEnd,
              from: { ...place, name: "Boarding Stop" },
              to: { ...place, name: "Alighting Stop" },
            },
            {
              ...transitLeg,
              mode: "WALK",
              duration: 600,
              startTime: middleEnd,
              from: { ...place, name: "Alighting Stop" },
              to: { ...place, name: "END" },
            },
          ],
        },
      ],
    };
    const { client } = clientWith(response);
    const result = await client.planTrip({
      ...input,
      origin: { ...input.origin, label: "Home" },
      destination: { ...input.destination, label: "Baker Beach entrance" },
    });
    const legs = result.itineraries[0]!.legs;
    expect(legs[0]!.from).toMatchObject({
      label: "Home",
      latitude: place.lat,
      longitude: place.lon,
    });
    expect(legs[2]!.to).toMatchObject({
      label: "Baker Beach entrance",
      latitude: place.lat,
      longitude: place.lon,
    });
    expect(legs[0]!.to.label).toBe("Boarding Stop");
    expect(legs[1]!.from.label).toBe("Boarding Stop");
    expect(legs[1]!.to.label).toBe("Alighting Stop");
    expect(legs[2]!.from.label).toBe("Alighting Stop");

    const unlabeled = await clientWith(response).client.planTrip(input);
    expect(unlabeled.itineraries[0]!.legs[0]!.from.label).toBe("Origin");
    expect(unlabeled.itineraries[0]!.legs[2]!.to.label).toBe("Destination");
  });

  it("uses v6 transit routing with an explicit clock and preserves scheduled versus live times", async () => {
    const { client, fetcher } = clientWith(fixture);
    const result = await client.planTrip(input);
    expect(fetcher).toHaveBeenCalledTimes(1);
    const url = new URL(String(fetcher.mock.calls[0]![0]));
    expect(url.pathname).toBe("/api/v6/plan");
    expect(url.searchParams.get("time")).toBe(now().toISOString());
    expect(url.searchParams.get("directModes")).toBe("");
    expect(url.searchParams.get("useRoutedTransfers")).toBe("true");
    expect(fetcher.mock.calls[0]![1]?.redirect).toBe("error");
    expect(
      new Headers(fetcher.mock.calls[0]![1]?.headers).get("User-Agent"),
    ).toBe(userAgent);
    expect(result.itineraries[0]?.legs[0]).toMatchObject({
      route: "29",
      realTime: true,
      scheduledDepartureTime: transitLeg.scheduledStartTime,
      departureTime: start,
    });
    expect(JSON.stringify(result)).not.toContain("SECRET");
    expect(result.warnings.join(" ")).toContain(
      "the data does not say when they were last updated",
    );
  });

  it("passes arrival time, zero transfers and wheelchair profile exactly", async () => {
    const { client, fetcher } = clientWith(fixture);
    const result = await client.planTrip({
      ...input,
      arrivalTime: end,
      maxTransfers: 0,
      wheelchair: true,
      modes: ["transit"],
    });
    const params = new URL(String(fetcher.mock.calls[0]![0])).searchParams;
    expect(params.get("time")).toBe(end);
    expect(params.get("arriveBy")).toBe("true");
    expect(params.get("maxTransfers")).toBe("0");
    expect(params.get("pedestrianProfile")).toBe("WHEELCHAIR");
    expect(result.timeType).toBe("arriveBy");
  });

  it("searches addresses and landmarks, retaining candidates for explicit selection", async () => {
    const { client, fetcher } = clientWith([
      {
        id: "beach1",
        name: "Baker Beach",
        lat: 37.79,
        lon: -122.48,
        type: "PLACE",
        areas: [{ name: "San Francisco", default: true }],
      },
      {
        id: "beach2",
        name: "Baker Beach entrance",
        lat: 37.78,
        lon: -122.48,
        type: "PLACE",
        areas: [],
      },
      {
        id: "outside",
        name: "Elsewhere",
        lat: 51,
        lon: 1,
        type: "PLACE",
        areas: [],
      },
    ]);
    const result = await client.searchPlaces({ query: "Baker Beach" });
    const url = new URL(String(fetcher.mock.calls[0]![0]));
    expect(url.pathname).toBe("/api/v1/geocode");
    expect(url.searchParams.get("text")).toBe("Baker Beach");
    expect(url.searchParams.has("q")).toBe(false);
    expect(url.searchParams.has("min")).toBe(false);
    expect(url.searchParams.has("max")).toBe(false);
    expect(result.candidates).toHaveLength(2);
    expect(result.requiresSelection).toBe(true);
    expect(result.candidates[0]?.label).toContain("San Francisco");
  });

  it("keeps direct comparisons independent of transit cutoff, and caps each result group", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(async (request) => {
        const direct = new URL(String(request)).searchParams.get("directModes");
        return Response.json(
          direct
            ? {
                direct: [
                  {
                    ...trip,
                    legs: [{ ...transitLeg, mode: direct, realTime: false }],
                  },
                ],
                itineraries: [],
              }
            : { direct: [], itineraries: [trip, trip] },
        );
      });
    const result = await createRoutingClient({
      baseUrl: "http://localhost:8080",
      userAgent,
      fetcher,
      now,
    }).planTrip({ ...input, modes: ["transit", "walk", "bicycle"], limit: 1 });
    expect(result.itineraries.map((item) => item.kind)).toEqual([
      "transit",
      "walk",
      "bicycle",
    ]);
    expect(fetcher).toHaveBeenCalledTimes(3);
  });

  it("filters cancelled services and explains schedule-only and absent results", async () => {
    const { client } = clientWith({
      direct: [],
      itineraries: [{ ...trip, legs: [{ ...transitLeg, cancelled: true }] }],
    });
    expect(
      (await client.planTrip({ ...input, modes: ["transit"] })).itineraries,
    ).toEqual([]);
    const scheduled = clientWith({
      direct: [],
      itineraries: [{ ...trip, legs: [{ ...transitLeg, realTime: false }] }],
    });
    expect(
      (
        await scheduled.client.planTrip({ ...input, modes: ["transit"] })
      ).warnings.join(" "),
    ).toContain("published schedule");
  });

  it("rejects trips outside the requested departure or arrival interval", async () => {
    const departure = clientWith(fixture);
    await expect(
      departure.client.planTrip({
        ...input,
        departureTime: "2026-10-29T14:01:00-07:00",
      }),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
    const arrival = clientWith(fixture);
    await expect(
      arrival.client.planTrip({
        ...input,
        arrivalTime: "2026-10-29T14:29:00-07:00",
      }),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("rejects impossible leg chronology", async () => {
    const { client } = clientWith({
      direct: [],
      itineraries: [
        {
          ...trip,
          legs: [{ ...transitLeg, endTime: "2026-10-29T13:00:00-07:00" }],
        },
      ],
    });
    await expect(client.planTrip(input)).rejects.toMatchObject({
      code: "INVALID_RESPONSE",
    });
  });

  it("rounds departure forward and arrival backward to respect minute precision", async () => {
    const departure = clientWith({ direct: [], itineraries: [] });
    await departure.client.planTrip({
      ...input,
      departureTime: "2026-10-29T14:00:20-07:00",
    });
    expect(
      new URL(String(departure.fetcher.mock.calls[0]![0])).searchParams.get(
        "time",
      ),
    ).toBe("2026-10-29T21:01:00.000Z");
    const arrival = clientWith({ direct: [], itineraries: [] });
    await arrival.client.planTrip({
      ...input,
      arrivalTime: "2026-10-29T14:00:20-07:00",
    });
    expect(
      new URL(String(arrival.fetcher.mock.calls[0]![0])).searchParams.get(
        "time",
      ),
    ).toBe("2026-10-29T21:00:00.000Z");
  });

  it("explains empty regional searches without claiming exhaustive coverage", async () => {
    const { client } = clientWith([]);
    const result = await client.searchPlaces({ query: "Baker Beach" });
    expect(result.candidates).toEqual([]);
    expect(result.warnings.join(" ")).toContain(
      "more specific address or city",
    );
  });

  it("does not recommend a vehicle explicitly marked inaccessible", async () => {
    const { client } = clientWith({
      direct: [],
      itineraries: [
        {
          ...trip,
          legs: [{ ...transitLeg, wheelchairAccessible: "NOT_ACCESSIBLE" }],
        },
      ],
    });
    const result = await client.planTrip({ ...input, wheelchair: true });
    expect(result.itineraries).toEqual([]);
  });

  it("sanitizes network and provider errors without leaking URLs, keys or response text", async () => {
    const fetcher = vi
      .fn<typeof fetch>()
      .mockRejectedValue(new Error("https://private.internal/?api_key=SECRET"));
    const client = createRoutingClient({
      baseUrl: "https://private.internal",
      userAgent,
      fetcher,
      now,
    });
    await expect(
      client.planTrip({ ...input, modes: ["transit"] }),
    ).rejects.toMatchObject({ code: "UNAVAILABLE" });
    await expect(
      client.planTrip({ ...input, modes: ["transit"] }),
    ).rejects.not.toThrow("SECRET");
    fetcher.mockResolvedValue(
      new Response("SECRET provider stack", { status: 500 }),
    );
    await expect(client.searchPlaces({ query: "Home" })).rejects.not.toThrow(
      "SECRET",
    );
  });

  it("rejects malformed and oversized provider responses", async () => {
    const { client } = clientWith({ itineraries: [{ broken: "SECRET" }] });
    await expect(
      client.planTrip({ ...input, modes: ["transit"] }),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
    const fetcher = vi.fn<typeof fetch>().mockResolvedValue(
      new Response("[]", {
        headers: {
          "content-type": "application/json",
          "content-length": "99999999",
        },
      }),
    );
    await expect(
      createRoutingClient({
        baseUrl: "http://localhost",
        userAgent,
        fetcher,
      }).searchPlaces({ query: "Beach" }),
    ).rejects.toMatchObject({ code: "INVALID_RESPONSE" });
  });

  it("enforces a deadline even if a fetch implementation ignores cancellation", async () => {
    vi.useFakeTimers();
    const fetcher = vi
      .fn<typeof fetch>()
      .mockImplementation(() => new Promise(() => {}));
    const result = createRoutingClient({
      baseUrl: "http://localhost",
      userAgent,
      fetcher,
    }).searchPlaces({ query: "Beach" });
    const assertion = expect(result).rejects.toMatchObject({ code: "TIMEOUT" });
    await vi.advanceTimersByTimeAsync(20_001);
    await assertion;
  });

  it("rejects invalid inputs before contacting a service", async () => {
    const { client, fetcher } = clientWith(fixture);
    await expect(
      client.planTrip({ ...input, departureTime: "today" }),
    ).rejects.toBeInstanceOf(RoutingError);
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("requires policy-compliant application identification and contact", () => {
    const fetcher = vi.fn<typeof fetch>();
    expect(() =>
      createRoutingClient({
        baseUrl: "https://api.transitous.org",
        userAgent: "sf-transit-mcp",
        fetcher,
      }),
    ).toThrow(RoutingError);
    expect(fetcher).not.toHaveBeenCalled();
  });
});
