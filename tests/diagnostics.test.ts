import { describe, expect, it, vi } from "vitest";
import {
  logRoutingFailure,
  type RoutingFailure,
} from "../src/routing/diagnostics.js";

function capture(failure: Partial<RoutingFailure> = {}) {
  const sink = vi.spyOn(console, "error").mockImplementation(() => {});
  logRoutingFailure({
    operation: "plan_trip",
    category: "network",
    durationMs: 12.7,
    ...failure,
  });
  expect(sink).toHaveBeenCalledTimes(1);
  expect(sink.mock.calls[0]).toHaveLength(1);
  return JSON.parse(sink.mock.calls[0]![0] as string);
}

describe("routing provider diagnostics", () => {
  it("logs a structured, fixed provider event with useful transport metadata", () => {
    const error = new TypeError("private URL", {
      cause: { code: "ENOTFOUND", hostname: "private host" },
    });
    expect(capture({ error })).toEqual({
      event: "routing_provider_failure",
      provider: "transitous",
      operation: "plan_trip",
      category: "network",
      durationMs: 13,
      errorName: "TypeError",
      causeCode: "ENOTFOUND",
    });
  });

  it("allows departures diagnostics without logging stop identifiers", () => {
    const event = capture({
      operation: "get_stop_departures",
      error: new Error("SECRET-stop-id"),
      stopId: "SECRET-stop-id",
      category: "network",
      durationMs: 12,
    } as RoutingFailure);
    expect(event.operation).toBe("get_stop_departures");
    expect(JSON.stringify(event)).not.toContain("SECRET-stop-id");
  });

  it.each([200, 299, 300, 302, 399, 400, 429, 500, 599])(
    "includes HTTP status %i when diagnosing a failed operation",
    (status) => {
      expect(capture({ category: "http", status }).status).toBe(status);
    },
  );

  it.each([0, 99, 600, 404.5, NaN, Infinity])(
    "omits invalid HTTP status %s",
    (status) => {
      expect(capture({ status })).not.toHaveProperty("status");
    },
  );

  it.each([
    [NaN, 0],
    [Infinity, 0],
    [-Infinity, 0],
    [-12, 0],
    [12.4, 12],
    [12.7, 13],
    [Number.MAX_VALUE, 86_400_000],
  ])("bounds duration %s to %i", (durationMs, expected) => {
    expect(capture({ durationMs }).durationMs).toBe(expected);
  });

  it("never serializes request inputs, messages, stacks, bodies, or unknown codes", () => {
    const secret =
      "SECRET 37.77,-122.43 Home https://example.org/?query=address";
    const inspectPrivate = vi.fn(() => {
      throw new Error("must not read private error details");
    });
    const error = {
      name: secret,
      code: secret,
      cause: { code: secret, body: secret, cause: secret },
      get message() {
        return inspectPrivate();
      },
      get stack() {
        return inspectPrivate();
      },
      toJSON: inspectPrivate,
    };
    const event = capture({
      operation: "search_places",
      category: "invalid_response",
      durationMs: 12.7,
      error,
      query: secret,
      body: secret,
      location: secret,
    } as RoutingFailure);
    expect(event).toEqual({
      event: "routing_provider_failure",
      provider: "transitous",
      operation: "search_places",
      category: "invalid_response",
      durationMs: 13,
    });
    expect(inspectPrivate).not.toHaveBeenCalled();
  });

  it("handles malicious error getters and proxies without exposing their values", () => {
    const error = new Proxy(
      {},
      {
        get() {
          throw new Error("SECRET location");
        },
      },
    );
    expect(capture({ error })).not.toHaveProperty("errorName");
  });

  it("ignores unexpected operation and category strings", () => {
    const sink = vi.spyOn(console, "error").mockImplementation(() => {});
    logRoutingFailure({
      operation: "SECRET query",
      category: "network",
      durationMs: 1,
    } as unknown as RoutingFailure);
    logRoutingFailure({
      operation: "plan_trip",
      category: "SECRET body",
      durationMs: 1,
    } as unknown as RoutingFailure);
    expect(sink).not.toHaveBeenCalled();
  });

  it("does not interrupt request handling when the logging sink throws", () => {
    vi.spyOn(console, "error").mockImplementation(() => {
      throw new Error("logging unavailable");
    });
    expect(() =>
      logRoutingFailure({
        operation: "plan_trip",
        category: "timeout",
        durationMs: 20_000,
      }),
    ).not.toThrow();
  });
});
