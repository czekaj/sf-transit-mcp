import type { TripPlan } from "./routing/types.js";

const clock = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});
const at = (time: string) => clock.format(new Date(time));
const minutes = (seconds: number) => `${Math.ceil(seconds / 60)} min`;

export function formatTripPlan(
  plan: TripPlan,
  wheelchairRequested = false,
): string {
  const lines = [
    `${plan.origin.label ?? "Origin"} → ${plan.destination.label ?? "Destination"}`,
    "Times are in America/Los_Angeles.",
  ];
  for (const [index, trip] of plan.itineraries.entries()) {
    lines.push(
      "",
      `Option ${index + 1}: ${at(trip.departureTime)} → ${at(trip.arrivalTime)}; ${minutes(trip.durationSeconds)} travelling, ${trip.transfers} transfer(s), ${minutes(trip.walkingSeconds)} walking.`,
    );
    if (plan.timeType === "departAfter") {
      const beforeLeaving = Math.max(
        0,
        (Date.parse(trip.departureTime) - Date.parse(plan.requestedTime)) /
          1000,
      );
      lines.push(
        `Wait before leaving: ${minutes(beforeLeaving)}. Total from requested departure: ${minutes(beforeLeaving + trip.durationSeconds)}.`,
      );
    }
    for (const [legIndex, leg] of trip.legs.entries()) {
      const previous = trip.legs[legIndex - 1];
      if (previous) {
        const wait =
          (Date.parse(leg.departureTime) - Date.parse(previous.arrivalTime)) /
          1000;
        if (wait >= 60)
          lines.push(
            `  Wait ${minutes(wait)} at ${leg.from.label ?? "the stop"}.`,
          );
      }
      const isWalking = leg.mode === "WALK";
      const isCycling = leg.mode === "BIKE" || leg.mode === "BICYCLE";
      const action = isWalking
        ? "Walk"
        : isCycling
          ? "Cycle"
          : `${leg.stayOnVehicle ? "Stay on" : "Take"} ${[leg.agency, leg.route ?? leg.mode].filter(Boolean).join(" ")}`;
      const basis =
        isWalking || isCycling
          ? "estimated travel time"
          : leg.realTime
            ? "live prediction; update age unavailable"
            : "scheduled";
      lines.push(
        `${legIndex + 1}. ${at(leg.departureTime)}: ${action}${leg.headsign ? ` toward ${leg.headsign}` : ""} from ${leg.from.label ?? "origin"}${leg.from.platform ? ` (platform ${leg.from.platform})` : ""} to ${leg.to.label ?? "destination"}; arrive ${at(leg.arrivalTime)} (${minutes(leg.durationSeconds)}, ${basis}).`,
      );
      if (leg.realTime && leg.departureTime !== leg.scheduledDepartureTime) {
        lines.push(
          `   Scheduled departure: ${at(leg.scheduledDepartureTime)}.`,
        );
      }
      if (wheelchairRequested && !isWalking && !isCycling) {
        lines.push(
          `   Wheelchair accessibility: ${leg.wheelchairAccessible === true ? "reported accessible" : "unknown in the source data"}.`,
        );
      }
    }
  }
  if (plan.warnings.length) lines.push("", ...plan.warnings);
  return lines.join("\n");
}
