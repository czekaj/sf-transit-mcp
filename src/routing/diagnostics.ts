export type RoutingOperation =
  "search_places" | "plan_trip" | "get_stop_departures";
export type RoutingFailureCategory =
  "network" | "http" | "timeout" | "invalid_response";

export interface RoutingFailure {
  operation: RoutingOperation;
  category: RoutingFailureCategory;
  durationMs: number;
  status?: number;
  error?: unknown;
}

const MAX_DURATION_MS = 86_400_000;
const ERROR_NAMES = new Set([
  "Error",
  "TypeError",
  "SyntaxError",
  "AbortError",
  "TimeoutError",
]);
const TRANSPORT_CODES = new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "EAI_AGAIN",
  "ETIMEDOUT",
  "UND_ERR_CONNECT_TIMEOUT",
  "UND_ERR_SOCKET",
  "ERR_TLS_CERT_ALTNAME_INVALID",
  "UNABLE_TO_VERIFY_LEAF_SIGNATURE",
]);

function property(value: unknown, key: string): unknown {
  if (typeof value !== "object" || value === null) return undefined;
  try {
    return (value as Record<string, unknown>)[key];
  } catch {
    return undefined;
  }
}

function transportCode(error: unknown): string | undefined {
  const code = property(error, "code");
  if (typeof code === "string" && TRANSPORT_CODES.has(code)) return code;
  const causeCode = property(property(error, "cause"), "code");
  return typeof causeCode === "string" && TRANSPORT_CODES.has(causeCode)
    ? causeCode
    : undefined;
}

/** Log only allowlisted metadata; error messages and request data stay private. */
export function logRoutingFailure(failure: RoutingFailure): void {
  try {
    const { operation, category, durationMs, status, error } = failure;
    if (
      operation !== "search_places" &&
      operation !== "plan_trip" &&
      operation !== "get_stop_departures"
    )
      return;
    if (
      category !== "network" &&
      category !== "http" &&
      category !== "timeout" &&
      category !== "invalid_response"
    )
      return;

    const name = property(error, "name");
    const code = transportCode(error);
    console.error(
      JSON.stringify({
        event: "routing_provider_failure",
        provider: "transitous",
        operation,
        category,
        durationMs: Number.isFinite(durationMs)
          ? Math.min(MAX_DURATION_MS, Math.max(0, Math.round(durationMs)))
          : 0,
        ...(Number.isInteger(status) && status! >= 100 && status! <= 599
          ? { status }
          : {}),
        ...(typeof name === "string" && ERROR_NAMES.has(name)
          ? { errorName: name }
          : {}),
        ...(code ? { causeCode: code } : {}),
      }),
    );
  } catch {
    // Diagnostics must never replace the provider failure with a logging error.
  }
}
