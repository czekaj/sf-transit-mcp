import { RoutingError } from "./routing/client.js";

/** Numeric counters only: no addresses, requests, or user identifiers are retained. */
export function createBudgetedFetch(
  fetcher: typeof fetch,
  now: () => number = Date.now,
): typeof fetch {
  let timestamps: number[] = [];
  return async (input, init) => {
    const current = now();
    timestamps = timestamps.filter((time) => current - time < 86_400_000);
    const inLastMinute = timestamps.filter(
      (time) => current - time < 60_000,
    ).length;
    // A per-process/isolate courtesy limit, not a distributed provider quota.
    if (inLastMinute >= 20 || timestamps.length >= 600) {
      throw new RoutingError(
        "UNAVAILABLE",
        "This instance has reached its request budget. Try again later.",
      );
    }
    timestamps.push(current);
    return fetcher(input, init);
  };
}
