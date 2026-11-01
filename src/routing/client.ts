import { z } from "zod";
import type { RoutingFailure, RoutingOperation } from "./diagnostics.js";
import {
  BAY_AREA_BOUNDS,
  getStopDeparturesInputSchema,
  planTripInputSchema,
  searchPlacesInputSchema,
} from "./schemas.js";
import type {
  GetStopDeparturesInput,
  PlanTripInput,
  SearchPlacesInput,
} from "./schemas.js";
import type {
  Coordinate,
  StopDepartures,
  StopDeparture,
  PlaceCandidate,
  PlaceSearchResult,
  TripItinerary,
  TripLeg,
  TripPlan,
} from "./types.js";

const MAX_RESPONSE_BYTES = 2 * 1024 * 1024;
const REQUEST_TIMEOUT_MS = 20_000;
const text = z.string().max(500);
const time = z.iso.datetime({ offset: true });
const seconds = z
  .number()
  .finite()
  .min(0)
  .max(7 * 86400);
const place = z.object({
  name: text,
  lat: z.number().finite().min(-90).max(90),
  lon: z.number().finite().min(-180).max(180),
  stopId: text.optional(),
  track: text.optional(),
});
const leg = z.object({
  mode: text,
  startTime: time,
  endTime: time,
  scheduledStartTime: time,
  scheduledEndTime: time,
  duration: seconds,
  realTime: z.boolean(),
  from: place,
  to: place,
  distance: z.number().finite().nonnegative().optional(),
  routeShortName: text.optional(),
  routeLongName: text.optional(),
  displayName: text.optional(),
  agencyName: text.optional(),
  headsign: text.nullish(),
  cancelled: z.boolean().optional(),
  interlineWithPreviousLeg: z.boolean().optional(),
  wheelchairAccessible: z.enum(["ACCESSIBLE", "NOT_ACCESSIBLE"]).optional(),
});
const itinerary = z.object({
  duration: seconds,
  startTime: time,
  endTime: time,
  transfers: z.number().int().min(0).max(100),
  legs: z.array(leg).min(1).max(64),
});
const planResponse = z.object({
  direct: z.array(itinerary).max(100),
  itineraries: z.array(itinerary).max(200),
});
const match = z.object({
  id: text,
  name: text,
  lat: z.number().finite(),
  lon: z.number().finite(),
  type: z.enum(["ADDRESS", "PLACE", "STOP"]),
  street: text.optional(),
  houseNumber: text.optional(),
  zip: text.optional(),
  areas: z
    .array(
      z.object({
        name: text,
        default: z.boolean().optional(),
        unique: z.boolean().optional(),
      }),
    )
    .max(40),
});

const departurePlace = place.extend({
  stopId: text.min(1),
  parentId: text.optional(),
  departure: time,
  scheduledDeparture: time,
  scheduledTrack: text.optional(),
  pickupType: z.enum(["NORMAL", "NOT_ALLOWED"]).optional(),
  cancelled: z.boolean().optional(),
});
const stopTime = z.object({
  place: departurePlace,
  mode: text.min(1),
  realTime: z.boolean(),
  headsign: text.nullish(),
  agencyId: text.optional(),
  agencyName: text,
  routeId: text,
  routeColor: z
    .string()
    .regex(/^[0-9a-fA-F]{6}$/)
    .optional(),
  routeShortName: text,
  routeLongName: text,
  displayName: text,
  pickupDropoffType: z.enum(["NORMAL", "NOT_ALLOWED"]),
  cancelled: z.boolean(),
  tripCancelled: z.boolean(),
});
const stopTimesResponse = z.object({
  place: place.extend({ stopId: text.min(1), parentId: text.optional() }),
  stopTimes: z.array(stopTime).max(500),
});
function departureRoute(item: z.infer<typeof stopTime>): string {
  const route =
    item.displayName || item.routeShortName || item.routeLongName || item.mode;
  const bartLine = /^(Blue|Green|Yellow|Red|Orange)(?:-[NS])?$/i.exec(route);
  if (
    (item.agencyId === "BA" || item.agencyName === "Bay Area Rapid Transit") &&
    bartLine
  ) {
    const line = bartLine[1]!;
    return line[0]!.toUpperCase() + line.slice(1).toLowerCase();
  }
  return route;
}
// Stations can span several platforms; never accept a distant stop merely
// because its provider ID or parent ID matches the requested station.
function nearby(
  a: { latitude: number; longitude: number },
  b: { lat: number; lon: number },
): boolean {
  const lat = ((a.latitude + b.lat) * Math.PI) / 360;
  return (
    Math.hypot(
      (a.latitude - b.lat) * 111_320,
      (a.longitude - b.lon) * 111_320 * Math.cos(lat),
    ) <= 1000
  );
}

export class RoutingError extends Error {
  constructor(
    public readonly code:
      "INVALID_INPUT" | "UNAVAILABLE" | "TIMEOUT" | "INVALID_RESPONSE",
    message: string,
  ) {
    super(message);
    this.name = "RoutingError";
  }
}

function validate<T>(schema: z.ZodType<T>, input: unknown): T {
  const result = schema.safeParse(input);
  if (!result.success)
    throw new RoutingError(
      "INVALID_INPUT",
      "Check trip inputs, Bay Area coordinates, and timestamps with an explicit timezone.",
    );
  return result.data;
}
function inside(latitude: number, longitude: number): boolean {
  return (
    latitude >= BAY_AREA_BOUNDS.south &&
    latitude <= BAY_AREA_BOUNDS.north &&
    longitude >= BAY_AREA_BOUNDS.west &&
    longitude <= BAY_AREA_BOUNDS.east
  );
}
function normalizePlace(value: z.infer<typeof place>) {
  return {
    label: value.name,
    latitude: value.lat,
    longitude: value.lon,
    ...(value.stopId ? { stopId: value.stopId } : {}),
    ...(value.track ? { platform: value.track } : {}),
  };
}
function normalizeItinerary(
  value: z.infer<typeof itinerary>,
  kind: TripItinerary["kind"],
  originLabel: string | undefined,
  destinationLabel: string | undefined,
): TripItinerary {
  const legs: TripLeg[] = value.legs.map((item) => ({
    mode: item.mode,
    departureTime: item.startTime,
    arrivalTime: item.endTime,
    scheduledDepartureTime: item.scheduledStartTime,
    scheduledArrivalTime: item.scheduledEndTime,
    durationSeconds: item.duration,
    realTime: item.realTime,
    from: normalizePlace(item.from),
    to: normalizePlace(item.to),
    stayOnVehicle: item.interlineWithPreviousLeg ?? false,
    ...(item.wheelchairAccessible
      ? { wheelchairAccessible: item.wheelchairAccessible === "ACCESSIBLE" }
      : {}),
    ...(item.distance !== undefined ? { distanceMeters: item.distance } : {}),
    ...(item.displayName || item.routeShortName || item.routeLongName
      ? {
          route: item.displayName || item.routeShortName || item.routeLongName!,
        }
      : {}),
    ...(item.headsign ? { headsign: item.headsign } : {}),
    ...(item.agencyName ? { agency: item.agencyName } : {}),
  }));
  const firstLeg = legs[0];
  const lastLeg = legs.at(-1);
  if (firstLeg?.from.label === "START") {
    firstLeg.from.label = originLabel ?? "Origin";
  }
  if (lastLeg?.to.label === "END") {
    lastLeg.to.label = destinationLabel ?? "Destination";
  }
  if (
    Date.parse(value.endTime) < Date.parse(value.startTime) ||
    legs.some(
      (item, index) =>
        Date.parse(item.arrivalTime) < Date.parse(item.departureTime) ||
        Date.parse(item.departureTime) < Date.parse(value.startTime) ||
        Date.parse(item.arrivalTime) > Date.parse(value.endTime) ||
        (index > 0 &&
          Date.parse(item.departureTime) <
            Date.parse(legs[index - 1]!.arrivalTime)),
    )
  ) {
    throw new RoutingError(
      "INVALID_RESPONSE",
      "The routing service returned an invalid trip.",
    );
  }
  return {
    kind,
    departureTime: value.startTime,
    arrivalTime: value.endTime,
    durationSeconds: value.duration,
    transfers: value.transfers,
    walkingSeconds: legs
      .filter((item) => item.mode === "WALK")
      .reduce((sum, item) => sum + item.durationSeconds, 0),
    waitingSeconds: Math.max(
      0,
      value.duration -
        legs.reduce((sum, item) => sum + item.durationSeconds, 0),
    ),
    realTime: legs.some((item) => item.realTime),
    legs,
  };
}

export function createRoutingClient({
  baseUrl,
  userAgent,
  fetcher,
  now = () => new Date(),
  onFailure,
}: {
  baseUrl: string;
  userAgent: string;
  fetcher: typeof fetch;
  now?: () => Date;
  onFailure?: (failure: RoutingFailure) => void;
}) {
  let base: URL;
  try {
    base = new URL(baseUrl);
    if (
      !["http:", "https:"].includes(base.protocol) ||
      base.username ||
      base.password ||
      base.search ||
      base.hash
    )
      throw new Error();
  } catch {
    throw new RoutingError(
      "UNAVAILABLE",
      "The routing service is not configured correctly.",
    );
  }
  if (
    typeof userAgent !== "string" ||
    userAgent.length > 300 ||
    /[\r\n]/.test(userAgent) ||
    !/^[\w.-]+\/\d[\w.+-]*/.test(userAgent) ||
    !/(https?:\/\/[^\s)]+|[^\s()]+@[^\s()]+\.[^\s()]+)/.test(userAgent)
  ) {
    throw new RoutingError(
      "UNAVAILABLE",
      "The routing client needs an application name, version, and contact URL or email.",
    );
  }

  async function get(
    operation: RoutingOperation,
    path: string,
    params: URLSearchParams,
  ): Promise<unknown> {
    const started = performance.now();
    let status: number | undefined;
    const controller = new AbortController();
    let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
    let rejectDeadline!: (reason: RoutingError) => void;
    const deadline = new Promise<never>((_, reject) => {
      rejectDeadline = reject;
    });
    const timeout = setTimeout(() => {
      controller.abort();
      rejectDeadline(
        new RoutingError(
          "TIMEOUT",
          "The routing service took too long. Try again shortly.",
        ),
      );
    }, REQUEST_TIMEOUT_MS);
    try {
      const url = new URL(path, base);
      url.search = params.toString();
      const response = await Promise.race([
        fetcher(url, {
          method: "GET",
          headers: { Accept: "application/json", "User-Agent": userAgent },
          // Workers supports only manual/follow. Reject redirects below without
          // forwarding trip parameters or application headers to another origin.
          redirect: "manual",
          signal: controller.signal,
        }),
        deadline,
      ]);
      status = response.status;
      if (!response.ok)
        throw new RoutingError(
          "UNAVAILABLE",
          "The routing service is unavailable. Try again shortly.",
        );
      if (
        !response.headers
          .get("content-type")
          ?.toLowerCase()
          .includes("application/json")
      )
        throw new RoutingError(
          "INVALID_RESPONSE",
          "The routing service returned an invalid response.",
        );
      const length = response.headers.get("content-length");
      if (
        length &&
        (!/^\d+$/.test(length) || Number(length) > MAX_RESPONSE_BYTES)
      )
        throw new RoutingError(
          "INVALID_RESPONSE",
          "The routing response exceeded its size limit.",
        );
      if (!response.body)
        throw new RoutingError(
          "INVALID_RESPONSE",
          "The routing service returned an empty response.",
        );
      reader = response.body.getReader();
      const decoder = new TextDecoder();
      let body = "";
      let size = 0;
      for (;;) {
        const { value, done } = await Promise.race([reader.read(), deadline]);
        if (done) break;
        size += value.byteLength;
        if (size > MAX_RESPONSE_BYTES)
          throw new RoutingError(
            "INVALID_RESPONSE",
            "The routing response exceeded its size limit.",
          );
        body += decoder.decode(value, { stream: true });
      }
      body += decoder.decode();
      try {
        return JSON.parse(body) as unknown;
      } catch {
        throw new RoutingError(
          "INVALID_RESPONSE",
          "The routing service returned an invalid response.",
        );
      }
    } catch (error) {
      // A RoutingError thrown before a response can be the local request budget,
      // not a provider failure. Only transport failures, timeouts, and responses
      // received from the provider belong in upstream diagnostics.
      if (
        controller.signal.aborted ||
        status !== undefined ||
        !(error instanceof RoutingError)
      ) {
        try {
          onFailure?.({
            operation,
            category: controller.signal.aborted
              ? "timeout"
              : error instanceof RoutingError
                ? error.code === "INVALID_RESPONSE"
                  ? "invalid_response"
                  : "http"
                : "network",
            durationMs: performance.now() - started,
            ...(status !== undefined ? { status } : {}),
            error,
          });
        } catch {
          // A diagnostic sink must not change the error returned to the user.
        }
      }
      if (controller.signal.aborted)
        throw new RoutingError(
          "TIMEOUT",
          "The routing service took too long. Try again shortly.",
        );
      if (error instanceof RoutingError) throw error;
      throw new RoutingError(
        "UNAVAILABLE",
        "The routing service could not complete the request.",
      );
    } finally {
      clearTimeout(timeout);
      controller.abort();
      if (reader) {
        void reader.cancel().catch(() => {});
        reader.releaseLock();
      }
    }
  }

  return {
    async getStopDepartures(
      raw: GetStopDeparturesInput,
    ): Promise<StopDepartures> {
      const input = validate(getStopDeparturesInputSchema, raw);
      const generatedAt = now().toISOString();
      const requestedTime = input.departureTime ?? generatedAt;
      const params = new URLSearchParams({
        stopId: input.stop.stopId,
        time: requestedTime,
        arriveBy: "false",
        direction: "LATER",
        n: String(input.limit),
        fetchStops: "false",
        withScheduledSkippedStops: "true",
      });
      const parsed = stopTimesResponse.safeParse(
        await get("get_stop_departures", "/api/v6/stoptimes", params),
      );
      if (!parsed.success)
        throw new RoutingError(
          "INVALID_RESPONSE",
          "The departures service returned an invalid response.",
        );
      const station = parsed.data.place;
      if (
        station.stopId !== input.stop.stopId ||
        !inside(station.lat, station.lon) ||
        !nearby(input.stop, station)
      )
        throw new RoutingError(
          "INVALID_RESPONSE",
          "The departures service returned a different stop.",
        );
      const sameStation = (event: z.infer<typeof departurePlace>) =>
        event.stopId === station.stopId || event.parentId === station.stopId;
      if (
        parsed.data.stopTimes.some(
          (item) =>
            !inside(item.place.lat, item.place.lon) ||
            !nearby(input.stop, item.place),
        )
      )
        throw new RoutingError(
          "INVALID_RESPONSE",
          "The departures service returned a different stop.",
        );
      // MOTIS also returns nearby OSM-equivalent stops, sometimes with different
      // names. Keep this board tied to the selected stop or its child platforms.
      const departures: StopDeparture[] = parsed.data.stopTimes
        .filter((item) => sameStation(item.place))
        .map((item) => ({
          stopId: item.place.stopId,
          route: departureRoute(item),
          ...(item.routeId ? { routeId: item.routeId } : {}),
          ...(item.routeColor ? { routeColor: item.routeColor } : {}),
          ...(item.agencyName ? { agency: item.agencyName } : {}),
          ...(item.headsign ? { headsign: item.headsign } : {}),
          departureTime: item.realTime
            ? item.place.departure
            : item.place.scheduledDeparture,
          scheduledDepartureTime: item.place.scheduledDeparture,
          realTime: item.realTime,
          cancelled:
            item.cancelled ||
            item.tripCancelled ||
            (item.place.cancelled ?? false),
          pickupAllowed:
            item.pickupDropoffType === "NORMAL" &&
            item.place.pickupType !== "NOT_ALLOWED" &&
            !item.cancelled &&
            !item.tripCancelled &&
            !item.place.cancelled,
          ...((item.realTime ? item.place.track : item.place.scheduledTrack)
            ? {
                platform: item.realTime
                  ? item.place.track!
                  : item.place.scheduledTrack!,
              }
            : {}),
          mode: item.mode,
        }))
        .filter(
          (item) => Date.parse(item.departureTime) >= Date.parse(requestedTime),
        )
        .sort(
          (a, b) => Date.parse(a.departureTime) - Date.parse(b.departureTime),
        )
        .slice(0, input.limit);
      const warnings: string[] = [];
      if (!departures.length)
        warnings.push(
          "No departures were returned for this stop and time. Check another time or stop.",
        );
      if (departures.some((item) => !item.realTime))
        warnings.push(
          "Some departures follow the published schedule because live estimates are unavailable.",
        );
      if (departures.some((item) => item.realTime))
        warnings.push("Live predictions do not include a last update time.");
      return {
        kind: "departures",
        stop: { ...normalizePlace(station), stopId: station.stopId },
        generatedAt,
        requestedTime,
        timeZone: "America/Los_Angeles",
        departures,
        warnings,
      };
    },
    async searchPlaces(raw: SearchPlacesInput): Promise<PlaceSearchResult> {
      const input = validate(searchPlacesInputSchema, raw);
      const params = new URLSearchParams({
        text: input.query,
        numResults: String(input.limit),
        language: "en",
        place: "37.7749,-122.4194",
      });
      const parsed = z
        .array(match)
        .max(100)
        .safeParse(await get("search_places", "/api/v1/geocode", params));
      if (!parsed.success)
        throw new RoutingError(
          "INVALID_RESPONSE",
          "The place search service returned an invalid response.",
        );
      const candidates: PlaceCandidate[] = parsed.data
        .filter((item) => inside(item.lat, item.lon))
        .slice(0, input.limit)
        .map((item) => {
          const street = [item.houseNumber, item.street]
            .filter(Boolean)
            .join(" ");
          const parts = [
            item.name,
            street,
            ...item.areas
              .filter((area) => area.default || area.unique)
              .map((area) => area.name),
            item.zip,
          ].filter((part): part is string => Boolean(part));
          return {
            id: item.id,
            label: [...new Set(parts)].join(", "),
            latitude: item.lat,
            longitude: item.lon,
            type: item.type,
          };
        });
      return {
        query: input.query,
        candidates,
        requiresSelection: candidates.length > 1,
        warnings: candidates.length
          ? []
          : [
              "No Bay Area matches were returned. Try a more specific address or city.",
            ],
      };
    },
    async planTrip(raw: PlanTripInput): Promise<TripPlan> {
      const input = validate(planTripInputSchema, raw);
      const generatedAt = now().toISOString();
      const requestedTime =
        input.arrivalTime ?? input.departureTime ?? generatedAt;
      const timeType = input.arrivalTime ? "arriveBy" : "departAfter";
      // MOTIS 2.10.2 routes in whole minutes. Round toward the requested constraint.
      const timestamp = Date.parse(requestedTime);
      const roundedTimestamp =
        (input.arrivalTime
          ? Math.floor(timestamp / 60_000)
          : Math.ceil(timestamp / 60_000)) * 60_000;
      const providerTime =
        roundedTimestamp === timestamp
          ? requestedTime
          : new Date(roundedTimestamp).toISOString();
      const baseParams = {
        fromPlace: `${input.origin.latitude},${input.origin.longitude}`,
        toPlace: `${input.destination.latitude},${input.destination.longitude}`,
        time: providerTime,
        arriveBy: String(Boolean(input.arrivalTime)),
        numItineraries: String(input.limit),
        maxItineraries: String(input.limit),
        pedestrianProfile: input.wheelchair ? "WHEELCHAIR" : "FOOT",
        useRoutedTransfers: "true",
        detailedLegs: "false",
        timetableView: "true",
      };
      const batches = await Promise.all(
        input.modes.map(async (mode) => {
          const params = new URLSearchParams({
            ...baseParams,
            transitModes: mode === "transit" ? "TRANSIT" : "",
            directModes:
              mode === "transit" ? "" : mode === "bicycle" ? "BIKE" : "WALK",
            preTransitModes: "WALK",
            postTransitModes: "WALK",
          });
          if (input.maxTransfers !== undefined)
            params.set("maxTransfers", String(input.maxTransfers));
          const parsed = planResponse.safeParse(
            await get("plan_trip", "/api/v6/plan", params),
          );
          if (!parsed.success)
            throw new RoutingError(
              "INVALID_RESPONSE",
              "The routing service returned an invalid response.",
            );
          const results = (
            mode === "transit" ? parsed.data.itineraries : parsed.data.direct
          )
            .filter(
              (item) =>
                !item.legs.some(
                  (part) =>
                    part.cancelled ||
                    (input.wheelchair &&
                      part.wheelchairAccessible === "NOT_ACCESSIBLE"),
                ),
            )
            .map((item) =>
              normalizeItinerary(
                item,
                mode,
                input.origin.label,
                input.destination.label,
              ),
            );
          if (
            results.some((item) =>
              input.arrivalTime
                ? Date.parse(item.arrivalTime) > Date.parse(requestedTime)
                : Date.parse(item.departureTime) < Date.parse(requestedTime),
            )
          ) {
            throw new RoutingError(
              "INVALID_RESPONSE",
              "The routing service returned a trip outside the requested time.",
            );
          }
          return results.slice(0, input.limit);
        }),
      );
      const itineraries = batches.flat();
      const warnings: string[] = [];
      if (itineraries.length === 0)
        warnings.push(
          "No trips were found for these places and this time. Check the timetable coverage or try another time.",
        );
      if (
        itineraries.some(
          (item) =>
            item.kind === "transit" &&
            item.legs.some(
              (part) => !["WALK", "BIKE"].includes(part.mode) && !part.realTime,
            ),
        )
      )
        warnings.push(
          "Some bus, train, or ferry times follow the published schedule because live estimates are unavailable.",
        );
      if (itineraries.some((item) => item.realTime))
        warnings.push(
          "Some times are live estimates, but the data does not say when they were last updated.",
        );
      if (input.wheelchair)
        warnings.push(
          "The wheelchair option changes walking routes and paths between stops. Vehicle accessibility may be unknown; check each bus, train, or ferry in your result.",
        );
      return {
        origin: input.origin as Coordinate,
        destination: input.destination as Coordinate,
        requestedTime,
        timeType,
        generatedAt,
        timeZone: "America/Los_Angeles",
        itineraries,
        warnings,
      };
    },
  };
}
