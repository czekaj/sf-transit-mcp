import {
  App,
  applyDocumentTheme,
  applyHostStyleVariables,
  type McpUiHostContext,
} from "@modelcontextprotocol/ext-apps";
import type {
  Coordinate,
  TripItinerary,
  TripLeg,
  TripPlace,
  TripPlan,
} from "../src/routing/types.js";

type TripRequest = Record<string, unknown>;
type Attribution = { label: string; url: string };
export interface TripView extends TripPlan {
  request?: TripRequest;
  wheelchairRequested: boolean;
  attribution: Attribution[];
}
export interface WidgetBridge {
  callServerTool(params: {
    name: "plan_trip";
    arguments: TripRequest;
  }): Promise<unknown>;
  openLink(params: { url: string }): Promise<unknown>;
  requestDisplayMode?: (params: { mode: "fullscreen" }) => Promise<unknown>;
}
const allowedLinks = new Set([
  "https://transitous.org/",
  "https://transitous.org/sources/",
  "https://www.openstreetmap.org/copyright",
  "https://511.org/",
]);
const clock = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  hour: "numeric",
  minute: "2-digit",
});
const datedClock = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});
const localDay = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const calendarDate = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  month: "short",
  day: "numeric",
});
const at = (value: string) => clock.format(new Date(value));
const dated = (value: string) => datedClock.format(new Date(value));
const relativeClock = (start: string, value: string) =>
  localDay.format(new Date(start)) === localDay.format(new Date(value))
    ? at(value)
    : `${at(value)} · ${calendarDate.format(new Date(value))}`;
const minutes = (value: number) => Math.ceil(value / 60);
const isStreet = (mode: string) => ["WALK", "BIKE", "BICYCLE"].includes(mode);

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value))
    throw new Error("Invalid trip data");
  return value as Record<string, unknown>;
}
function string(value: unknown, max = 500): string {
  if (typeof value !== "string" || value.length > max)
    throw new Error("Invalid trip text");
  return value;
}
function number(value: unknown, maximum = 604800): number {
  if (
    typeof value !== "number" ||
    !Number.isFinite(value) ||
    value < 0 ||
    value > maximum
  )
    throw new Error("Invalid trip number");
  return value;
}
function boolean(value: unknown): boolean {
  if (typeof value !== "boolean") throw new Error("Invalid trip flag");
  return value;
}
function date(value: unknown): string {
  const result = string(value, 50);
  if (
    !/^\d{4}-\d\d-\d\dT\d\d:\d\d(?::\d\d(?:\.\d+)?)?(?:Z|[+-]\d\d:\d\d)$/.test(
      result,
    ) ||
    !Number.isFinite(Date.parse(result))
  )
    throw new Error("Invalid trip time");
  return result;
}
function array<T>(
  value: unknown,
  parse: (item: unknown) => T,
  max: number,
): T[] {
  if (!Array.isArray(value) || value.length > max)
    throw new Error("Invalid trip list");
  return value.map(parse);
}
function coordinate(value: unknown, bounded = false): Coordinate {
  const item = record(value);
  if (
    typeof item.latitude !== "number" ||
    typeof item.longitude !== "number" ||
    !Number.isFinite(item.latitude) ||
    !Number.isFinite(item.longitude) ||
    item.latitude < (bounded ? 36.85 : -90) ||
    item.latitude > (bounded ? 38.9 : 90) ||
    item.longitude < (bounded ? -123.6 : -180) ||
    item.longitude > (bounded ? -121.2 : 180)
  )
    throw new Error("Invalid trip location");
  return {
    latitude: item.latitude,
    longitude: item.longitude,
    ...(item.label !== undefined ? { label: string(item.label, 500) } : {}),
  };
}
function place(value: unknown): TripPlace {
  const item = record(value);
  return {
    ...coordinate(item),
    ...(item.platform !== undefined ? { platform: string(item.platform) } : {}),
  };
}
function leg(value: unknown): TripLeg {
  const item = record(value);
  const result: TripLeg = {
    mode: string(item.mode, 50),
    departureTime: date(item.departureTime),
    arrivalTime: date(item.arrivalTime),
    scheduledDepartureTime: date(item.scheduledDepartureTime),
    scheduledArrivalTime: date(item.scheduledArrivalTime),
    durationSeconds: number(item.durationSeconds),
    realTime: boolean(item.realTime),
    from: place(item.from),
    to: place(item.to),
    stayOnVehicle: boolean(item.stayOnVehicle),
    ...(item.route !== undefined ? { route: string(item.route) } : {}),
    ...(item.agency !== undefined ? { agency: string(item.agency) } : {}),
    ...(item.headsign !== undefined ? { headsign: string(item.headsign) } : {}),
    ...(item.wheelchairAccessible !== undefined
      ? { wheelchairAccessible: boolean(item.wheelchairAccessible) }
      : {}),
  };
  if (Date.parse(result.arrivalTime) < Date.parse(result.departureTime))
    throw new Error("Invalid trip chronology");
  return result;
}
function itinerary(value: unknown): TripItinerary {
  const item = record(value);
  if (!["transit", "walk", "bicycle"].includes(String(item.kind)))
    throw new Error("Invalid trip mode");
  const result: TripItinerary = {
    kind: item.kind as TripItinerary["kind"],
    departureTime: date(item.departureTime),
    arrivalTime: date(item.arrivalTime),
    durationSeconds: number(item.durationSeconds),
    transfers: number(item.transfers, 100),
    walkingSeconds: number(item.walkingSeconds),
    waitingSeconds: number(item.waitingSeconds),
    realTime: boolean(item.realTime),
    legs: array(item.legs, leg, 64),
  };
  if (
    !result.legs.length ||
    Date.parse(result.arrivalTime) < Date.parse(result.departureTime)
  )
    throw new Error("Invalid itinerary");
  return result;
}
function request(value: unknown): TripRequest {
  const item = record(value);
  const result: TripRequest = {
    origin: coordinate(item.origin, true),
    destination: coordinate(item.destination, true),
  };
  if (item.departureTime !== undefined)
    result.departureTime = date(item.departureTime);
  if (item.arrivalTime !== undefined)
    result.arrivalTime = date(item.arrivalTime);
  if (result.departureTime && result.arrivalTime)
    throw new Error("Conflicting trip times");
  if (item.modes !== undefined) {
    const modes = array(item.modes, (value) => string(value, 20), 3);
    if (
      !modes.length ||
      new Set(modes).size !== modes.length ||
      modes.some((value) => !["transit", "walk", "bicycle"].includes(value))
    )
      throw new Error("Invalid requested modes");
    result.modes = modes;
  }
  for (const [key, minimum, maximum] of [
    ["limit", 1, 6],
    ["maxTransfers", 0, 8],
  ] as const) {
    if (item[key] !== undefined) {
      const value = number(item[key], maximum);
      if (!Number.isInteger(value) || value < minimum)
        throw new Error("Invalid trip preference");
      result[key] = value;
    }
  }
  if (item.wheelchair !== undefined)
    result.wheelchair = boolean(item.wheelchair);
  return result;
}
function attribution(value: unknown): Attribution[] {
  return array(
    value,
    (raw) => {
      const item = record(raw);
      const label = string(item.label, 100);
      const url = new URL(string(item.url, 300));
      if (!allowedLinks.has(url.href)) throw new Error("Invalid source link");
      return { label, url: url.href };
    },
    8,
  );
}

/** Read only the bounded view fields; never reuse host input as refresh arguments. */
export function parseTripView(value: unknown): TripView {
  const item = record(value);
  if (
    item.timeZone !== "America/Los_Angeles" ||
    !["departAfter", "arriveBy"].includes(String(item.timeType))
  )
    throw new Error("Invalid trip context");
  return {
    origin: coordinate(item.origin),
    destination: coordinate(item.destination),
    requestedTime: date(item.requestedTime),
    generatedAt: date(item.generatedAt),
    timeType: item.timeType as TripPlan["timeType"],
    timeZone: "America/Los_Angeles",
    itineraries: array(item.itineraries, itinerary, 18),
    warnings: array(item.warnings, (value) => string(value, 1000), 20),
    wheelchairRequested:
      item.wheelchairRequested === undefined
        ? false
        : boolean(item.wheelchairRequested),
    attribution: attribution(item.attribution),
    ...(item.request !== undefined ? { request: request(item.request) } : {}),
  };
}

function element<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
  text?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  if (text !== undefined) node.textContent = text;
  return node;
}
const paths = {
  walk: "M13 4a1.5 1.5 0 1 0 0 .1M9 21l2-6-3-3 2-5 4 3 4 1M10 7 6 9M11 15l5 5M13 10l-1 4",
  bus: "M5 16V5c0-2 14-2 14 0v11M5 9h14M5 16h14M7 16v3M17 16v3M8 12h.01M16 12h.01",
  bike: "M7 17a4 4 0 1 0 0 .1M18 17a4 4 0 1 0 0 .1M7 17l4-9 7 9M7 17h7l-3-9M9 5h4M16 5h3l1 4",
  refresh: "M19 8a8 8 0 1 0 1 7M19 3v5h-5",
  chevron: "m8 10 4 4 4-4",
  check: "m5 12 4 4L19 6",
  arrow: "M4 12h16m-6-6 6 6-6 6",
} as const;
function icon(kind: keyof typeof paths): SVGSVGElement {
  const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
  svg.setAttribute("viewBox", "0 0 24 24");
  svg.setAttribute("aria-hidden", "true");
  svg.setAttribute("fill", "none");
  svg.setAttribute("stroke", "currentColor");
  svg.setAttribute("stroke-width", "1.7");
  svg.setAttribute("stroke-linecap", "round");
  svg.setAttribute("stroke-linejoin", "round");
  const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
  path.setAttribute("d", paths[kind]);
  svg.append(path);
  return svg;
}
function routeBadge(leg: TripLeg): HTMLElement {
  const walking = leg.mode === "WALK";
  const cycling = ["BIKE", "BICYCLE"].includes(leg.mode);
  const badge = element(
    "span",
    `route-badge ${walking || cycling ? "street-badge" : "transit-badge"}`,
  );
  badge.append(
    icon(walking ? "walk" : cycling ? "bike" : "bus"),
    element(
      "span",
      "",
      walking
        ? "Walk"
        : cycling
          ? "Bike"
          : leg.route || leg.mode.replaceAll("_", " "),
    ),
  );
  return badge;
}
function timingBasis(trip: TripItinerary): string {
  const legs = trip.legs.filter((leg) => !isStreet(leg.mode));
  if (!legs.length) return "Travel estimate";
  const predictions = legs.filter((leg) => leg.realTime).length;
  return predictions === legs.length
    ? "Live estimates"
    : predictions
      ? "Live + schedule"
      : "Scheduled";
}

function initialRouteIndices(routes: TripItinerary[]): number[] {
  if (routes.length <= 3) return routes.map((_, index) => index);
  const indices: number[] = [];
  for (const kind of ["transit", "walk", "bicycle"] as const) {
    const index = routes.findIndex((route) => route.kind === kind);
    if (index !== -1) indices.push(index);
  }
  for (let index = 0; index < routes.length && indices.length < 3; index++) {
    if (!indices.includes(index)) indices.push(index);
  }
  return indices.sort((left, right) => left - right);
}

export function createTripWidget(root: HTMLElement, bridge: WidgetBridge) {
  let view: TripView | undefined;
  let selected = 0;
  let expanded = false;
  let pending = false;
  let awaitingResult = false;
  let destroyed = false;
  let message = "";
  let failed = false;
  let inputLabels: { origin: string; destination: string } | undefined;
  let canFullscreen = false;
  let fullscreen = false;
  let revision = 0;

  function render() {
    if (destroyed) return;
    const focused = root.contains(document.activeElement)
      ? (document.activeElement as HTMLElement)?.dataset.focusKey
      : undefined;
    root.replaceChildren();
    root.classList.add("trip-app");
    root.setAttribute("aria-busy", String(pending || awaitingResult));
    if (!view) {
      const state = element("section", "initial-state");
      state.append(
        element("p", "eyebrow", "BAY AREA JOURNEYS"),
        element(
          "h1",
          "loading-title",
          failed ? "This trip couldn't load" : "Finding your way there",
        ),
      );
      const status = element(
        "p",
        "muted",
        failed
          ? "Try the trip request again in the conversation."
          : inputLabels
            ? `${inputLabels.origin} → ${inputLabels.destination}`
            : "Waiting for your route options…",
      );
      status.setAttribute("role", failed ? "alert" : "status");
      state.append(status);
      if (!failed) {
        const skeleton = element("div", "skeleton-grid");
        skeleton.setAttribute("aria-hidden", "true");
        for (let i = 0; i < 3; i++)
          skeleton.append(element("div", "skeleton-card"));
        state.append(skeleton);
      }
      root.append(state);
      return;
    }
    const header = element("header", "journey-header");
    const title = element("h1", "journey-title");
    title.append(
      element("span", "origin-name", view.origin.label || "Origin"),
      icon("arrow"),
      element(
        "span",
        "destination-name",
        view.destination.label || "Destination",
      ),
    );
    const timeLabel =
      view.timeType === "arriveBy"
        ? "Arrive by"
        : view.request && view.request.departureTime === undefined
          ? "Leaving now ·"
          : "Leave after";
    header.append(
      element("p", "eyebrow", "BAY AREA JOURNEYS"),
      title,
      element("p", "request-time", `${timeLabel} ${dated(view.requestedTime)}`),
    );
    root.append(header);
    if (message) {
      const notice = element(
        "p",
        failed ? "notice error-notice" : "notice status-notice",
        message,
      );
      notice.setAttribute("role", failed ? "alert" : "status");
      root.append(notice);
    }
    const choices = element("div", "route-grid");
    choices.setAttribute("role", "group");
    choices.setAttribute("aria-label", "Choose a route");
    const visibleIndices =
      fullscreen || (expanded && !canFullscreen)
        ? view.itineraries.map((_, index) => index)
        : initialRouteIndices(view.itineraries);
    if (!visibleIndices.includes(selected) && visibleIndices.length)
      visibleIndices[visibleIndices.length - 1] = selected;
    visibleIndices.forEach((index) => {
      const trip = view!.itineraries[index]!;
      const button = element(
        "button",
        `route-card${index === selected ? " is-selected" : ""}`,
      );
      button.type = "button";
      button.dataset.focusKey = `route-${index}`;
      button.setAttribute("aria-pressed", String(index === selected));
      button.setAttribute(
        "aria-label",
        `Option ${index + 1}, ${minutes(trip.durationSeconds)} minutes, ${at(trip.departureTime)} to ${relativeClock(trip.departureTime, trip.arrivalTime)}, ${trip.transfers} transfers, ${minutes(trip.walkingSeconds)} minutes walking`,
      );
      const top = element("span", "card-top");
      top.append(
        element(
          "span",
          "option-label",
          trip.kind === "transit"
            ? `Route ${index + 1}`
            : trip.kind === "walk"
              ? "Walking"
              : "Cycling",
        ),
      );
      const check = element("span", "selection-mark");
      check.append(icon("check"));
      top.append(check);
      const duration = element("span", "duration");
      duration.append(
        element("strong", "", String(minutes(trip.durationSeconds))),
        element("span", "", "min"),
      );
      const times = element(
        "span",
        "card-times",
        `${at(trip.departureTime)} → ${relativeClock(trip.departureTime, trip.arrivalTime)}`,
      );
      const badges = element("span", "route-sequence");
      trip.legs.slice(0, 6).forEach((leg, legIndex) => {
        if (legIndex) {
          const arrow = element("span", "sequence-arrow", "›");
          arrow.setAttribute("aria-hidden", "true");
          badges.append(arrow);
        }
        badges.append(routeBadge(leg));
      });
      if (trip.legs.length > 6)
        badges.append(
          element("span", "sequence-more", `+${trip.legs.length - 6} steps`),
        );
      const stats = element(
        "span",
        "card-stats",
        `${trip.transfers === 0 ? "No transfers" : `${trip.transfers} transfer${trip.transfers === 1 ? "" : "s"}`} · ${minutes(trip.walkingSeconds)} min walk`,
      );
      const basis = element("span", "timing-basis", timingBasis(trip));
      button.append(top, duration, times, badges, stats, basis);
      button.addEventListener("click", () => {
        selected = index;
        render();
      });
      choices.append(button);
    });
    if (!view.itineraries.length) {
      const empty = element("section", "empty-state");
      empty.append(
        element("h2", "", "No routes found"),
        element(
          "p",
          "muted",
          "Try another time or destination in the conversation.",
        ),
      );
      root.append(empty);
    } else root.append(choices);
    if (visibleIndices.length < view.itineraries.length)
      root.append(
        element(
          "p",
          "option-count",
          `Showing ${visibleIndices.length} of ${view.itineraries.length} routes. Open journey details for all options.`,
        ),
      );

    const controls = element("div", "controls");
    const details = element(
      "button",
      "button secondary-button",
      expanded ? "Hide details" : "Journey details",
    );
    details.type = "button";
    details.dataset.focusKey = "details";
    details.disabled = !view.itineraries.length;
    details.setAttribute("aria-expanded", String(expanded));
    details.setAttribute("aria-controls", "journey-details");
    details.append(icon("chevron"));
    details.addEventListener("click", () => {
      expanded = !expanded;
      render();
      if (expanded && canFullscreen && bridge.requestDisplayMode)
        void bridge
          .requestDisplayMode({ mode: "fullscreen" })
          .then((result) => {
            if (
              !destroyed &&
              result &&
              typeof result === "object" &&
              "mode" in result &&
              result.mode === "fullscreen"
            ) {
              fullscreen = true;
            } else {
              canFullscreen = false;
            }
            render();
          })
          .catch(() => {
            canFullscreen = false;
            render();
          });
    });
    const refreshButton = element(
      "button",
      "button primary-button",
      pending ? "Refreshing…" : "Refresh",
    );
    refreshButton.type = "button";
    refreshButton.dataset.focusKey = "refresh";
    refreshButton.disabled = pending || awaitingResult || !view.request;
    refreshButton.prepend(icon("refresh"));
    refreshButton.addEventListener("click", () => {
      void refresh();
    });
    controls.append(details, refreshButton);
    root.append(controls);
    const selectedTrip = view.itineraries[selected];
    if (expanded && selectedTrip) root.append(timeline(selectedTrip, view));
    const footer = element("footer", "journey-footer");
    footer.append(
      element(
        "p",
        "retrieved-time",
        `${failed ? "Previous results" : "Results"} from ${dated(view.generatedAt)} · Pacific time`,
      ),
    );
    if (view.warnings.length) {
      const warnings = element("div", "data-notes");
      for (const warning of view.warnings)
        warnings.append(element("p", "", warning));
      footer.append(warnings);
    }
    const links = element("nav", "source-links");
    links.setAttribute("aria-label", "Data attribution");
    for (const link of view.attribution) {
      const anchor = element("a", "", link.label);
      anchor.href = link.url;
      anchor.addEventListener("click", (event) => {
        event.preventDefault();
        void bridge.openLink({ url: link.url }).catch(() => {
          message = "The source link couldn't open.";
          render();
        });
      });
      links.append(anchor);
    }
    footer.append(links);
    root.append(footer);
    if (focused)
      Array.from(root.querySelectorAll<HTMLElement>("[data-focus-key]"))
        .find((item) => item.dataset.focusKey === focused)
        ?.focus({ preventScroll: true });
  }

  function timeline(trip: TripItinerary, current: TripView): HTMLElement {
    const section = element("section", "journey-details");
    section.id = "journey-details";
    section.setAttribute("aria-label", `Details for route ${selected + 1}`);
    const heading = element("div", "details-heading");
    heading.append(
      element("h2", "", "Your journey"),
      element(
        "span",
        "muted",
        `${minutes(trip.durationSeconds)} min travelling`,
      ),
    );
    section.append(heading);
    if (current.timeType === "departAfter") {
      const beforeLeaving = Math.max(
        0,
        (Date.parse(trip.departureTime) - Date.parse(current.requestedTime)) /
          1000,
      );
      const summary = element(
        "p",
        "departure-summary",
        `${minutes(beforeLeaving)} min before leaving · ${minutes(beforeLeaving + trip.durationSeconds)} min from ${at(current.requestedTime)}`,
      );
      section.append(summary);
    }
    const list = element("ol", "timeline");
    const visibleLegs =
      fullscreen || !canFullscreen ? trip.legs : trip.legs.slice(0, 6);
    visibleLegs.forEach((leg, index) => {
      const previous = trip.legs[index - 1];
      const gap = previous
        ? (Date.parse(leg.departureTime) - Date.parse(previous.arrivalTime)) /
          1000
        : 0;
      if (gap >= 60) {
        const wait = element("li", "wait-item");
        wait.append(
          element("span", "wait-line"),
          element(
            "p",
            "",
            `Wait ${minutes(gap)} min at ${leg.from.label || "the stop"}`,
          ),
        );
        list.append(wait);
      }
      const row = element("li", "timeline-leg");
      const time = element(
        "time",
        "leg-time",
        relativeClock(trip.departureTime, leg.departureTime),
      );
      time.dateTime = leg.departureTime;
      const body = element("div", "leg-body");
      const legHeading = element("div", "leg-heading");
      legHeading.append(
        routeBadge(leg),
        element("span", "leg-duration", `${minutes(leg.durationSeconds)} min`),
      );
      body.append(legHeading);
      if (!isStreet(leg.mode)) {
        if (leg.agency) body.append(element("p", "leg-agency", leg.agency));
        if (leg.headsign)
          body.append(
            element(
              "p",
              "leg-direction",
              `${leg.stayOnVehicle ? "Stay on toward" : "Toward"} ${leg.headsign}`,
            ),
          );
      }
      body.append(
        element(
          "p",
          "stop-line",
          `From ${leg.from.label || "origin"}${leg.from.platform ? ` · Platform ${leg.from.platform}` : ""}`,
        ),
        element(
          "p",
          "stop-line",
          `To ${leg.to.label || "destination"} · ${relativeClock(trip.departureTime, leg.arrivalTime)}`,
        ),
      );
      const basis = isStreet(leg.mode)
        ? "Travel estimate"
        : leg.realTime
          ? "Live estimate · update age unavailable"
          : "Scheduled";
      body.append(element("p", "leg-basis", basis));
      if (
        leg.realTime &&
        Date.parse(leg.departureTime) !== Date.parse(leg.scheduledDepartureTime)
      )
        body.append(
          element(
            "p",
            "leg-basis",
            `Scheduled departure ${at(leg.scheduledDepartureTime)}`,
          ),
        );
      if (current.wheelchairRequested && !isStreet(leg.mode))
        body.append(
          element(
            "p",
            "leg-basis",
            leg.wheelchairAccessible === true
              ? "Vehicle marked wheelchair accessible"
              : leg.wheelchairAccessible === false
                ? "Vehicle marked inaccessible"
                : "Vehicle accessibility unknown",
          ),
        );
      row.append(time, body);
      list.append(row);
    });
    section.append(list);
    if (visibleLegs.length < trip.legs.length)
      section.append(
        element(
          "p",
          "option-count",
          `${visibleLegs.length} of ${trip.legs.length} steps shown. ${canFullscreen ? "Open fullscreen to see the complete journey." : "Ask Claude for the remaining steps."}`,
        ),
      );
    return section;
  }

  function applyToolResult(result: unknown) {
    if (destroyed) return;
    awaitingResult = false;
    try {
      const envelope = record(result);
      if (envelope.isError === true) throw new Error("Tool error");
      const next = parseTripView(envelope.structuredContent);
      view = next;
      if (!next.itineraries.length) expanded = false;
      selected = Math.min(selected, Math.max(0, next.itineraries.length - 1));
      failed = false;
      message = pending ? "Routes updated." : "";
    } catch {
      failed = true;
      message = view
        ? "Refresh failed. Showing your previous route results."
        : "This trip couldn't load.";
    }
    render();
  }
  function receiveToolResult(result: unknown) {
    revision += 1;
    applyToolResult(result);
  }
  async function refresh() {
    if (pending || awaitingResult || !view?.request || destroyed) return;
    const currentRevision = revision;
    const originalRequest = structuredClone(view.request);
    pending = true;
    failed = false;
    message = "Refreshing route options…";
    render();
    try {
      const result = await bridge.callServerTool({
        name: "plan_trip",
        arguments: originalRequest,
      });
      if (revision === currentRevision && !destroyed) applyToolResult(result);
    } catch {
      if (revision === currentRevision && !destroyed) {
        failed = true;
        message = "Refresh failed. Showing your previous route results.";
      }
    } finally {
      pending = false;
      render();
    }
  }
  function receiveToolInput(value: unknown) {
    if (destroyed) return;
    try {
      const input = request(record(value).arguments);
      const origin = record(input.origin);
      const destination = record(input.destination);
      inputLabels = {
        origin: origin.label === undefined ? "Origin" : string(origin.label),
        destination:
          destination.label === undefined
            ? "Destination"
            : string(destination.label),
      };
      revision += 1;
      awaitingResult = true;
      failed = false;
      if (view)
        message =
          "Planning a new trip. Showing previous routes until it is ready.";
    } catch {
      return;
    }
    render();
  }
  render();
  return {
    receiveToolResult,
    receiveToolInput,
    setFullscreenAvailable(value: boolean) {
      const available = value && Boolean(bridge.requestDisplayMode);
      if (available !== canFullscreen) {
        canFullscreen = available;
        render();
      }
    },
    setDisplayMode(mode: string) {
      fullscreen = mode === "fullscreen";
      render();
    },
    showConnectionError() {
      revision += 1;
      awaitingResult = false;
      failed = true;
      message = view
        ? "The app connection was interrupted. Showing previous results."
        : "This trip couldn't load.";
      render();
    },
    destroy() {
      revision += 1;
      destroyed = true;
      root.replaceChildren();
    },
  };
}

export function applyTripHostContext(
  widget: Pick<
    ReturnType<typeof createTripWidget>,
    "setFullscreenAvailable" | "setDisplayMode"
  >,
  context: McpUiHostContext | undefined,
) {
  if (!context) return;
  if (context.theme) applyDocumentTheme(context.theme);
  if (context.styles?.variables)
    applyHostStyleVariables(context.styles.variables);
  for (const edge of ["top", "right", "bottom", "left"] as const) {
    const inset = context.safeAreaInsets?.[edge];
    if (inset !== undefined && Number.isFinite(inset)) {
      document.documentElement.style.setProperty(
        `--safe-${edge}`,
        `${Math.max(0, inset)}px`,
      );
    }
  }
  if (context.availableDisplayModes !== undefined) {
    widget.setFullscreenAvailable(
      context.availableDisplayModes.includes("fullscreen"),
    );
  }
  if (context.displayMode) widget.setDisplayMode(context.displayMode);
}

const root =
  typeof document !== "undefined"
    ? document.querySelector<HTMLElement>("[data-mcp-transit-app]")
    : null;
if (root) {
  const app = new App(
    { name: "sf-transit-journeys", version: "0.1.0" },
    { availableDisplayModes: ["inline", "fullscreen"] },
  );
  const widget = createTripWidget(root, {
    callServerTool: (params) => app.callServerTool(params),
    openLink: (params) => app.openLink(params),
    requestDisplayMode: (params) => app.requestDisplayMode(params),
  });
  app.ontoolresult = (result) => widget.receiveToolResult(result);
  app.ontoolinput = (input) => widget.receiveToolInput(input);
  app.ontoolcancelled = () => widget.showConnectionError();
  app.onhostcontextchanged = (context) => applyTripHostContext(widget, context);
  app.onteardown = async () => {
    widget.destroy();
    return {};
  };
  void app
    .connect()
    .then(() => applyTripHostContext(widget, app.getHostContext()))
    .catch(() => widget.showConnectionError());
}
