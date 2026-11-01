import type { WidgetBridge } from "./app.js";

type Stop = {
  stopId: string;
  latitude: number;
  longitude: number;
  label?: string;
};
type Request = { stop: Stop; departureTime?: string; limit?: number };
type Departure = {
  stopId: string;
  route: string;
  routeId?: string;
  routeColor?: string;
  agency?: string;
  headsign?: string;
  platform?: string;
  mode: string;
  departureTime: string;
  scheduledDepartureTime: string;
  realTime: boolean;
  cancelled: boolean;
  pickupAllowed: boolean;
};
export type DepartureView = {
  kind: "departures";
  stop: Stop;
  generatedAt: string;
  requestedTime: string;
  timeZone: "America/Los_Angeles";
  departures: Departure[];
  warnings: string[];
  request: Request;
  attribution: { label: string; url: string }[];
};
const sources = new Set([
  "https://transitous.org/",
  "https://transitous.org/sources/",
  "https://www.openstreetmap.org/copyright",
  "https://511.org/",
]);
function obj(v: unknown): Record<string, unknown> {
  if (!v || typeof v !== "object" || Array.isArray(v))
    throw Error("Invalid departure data");
  return v as Record<string, unknown>;
}
function text(v: unknown, max = 500): string {
  if (typeof v !== "string" || v.length > max || !v.trim())
    throw Error("Invalid departure text");
  return v;
}
function flag(v: unknown): boolean {
  if (typeof v !== "boolean") throw Error("Invalid departure flag");
  return v;
}
function date(v: unknown): string {
  const s = text(v, 50);
  if (
    !/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:\d{2})$/.test(
      s,
    ) ||
    !Number.isFinite(Date.parse(s))
  )
    throw Error("Invalid departure time");
  return s;
}
function list<T>(v: unknown, max: number, parse: (v: unknown) => T): T[] {
  if (!Array.isArray(v) || v.length > max)
    throw Error("Invalid departure list");
  return v.map(parse);
}
function stop(v: unknown): Stop {
  const s = obj(v);
  if (
    typeof s.latitude !== "number" ||
    typeof s.longitude !== "number" ||
    !Number.isFinite(s.latitude) ||
    !Number.isFinite(s.longitude) ||
    s.latitude < 36.85 ||
    s.latitude > 38.9 ||
    s.longitude < -123.6 ||
    s.longitude > -121.2
  )
    throw Error("Invalid stop");
  return {
    stopId: text(s.stopId),
    latitude: s.latitude,
    longitude: s.longitude,
    ...(s.label === undefined ? {} : { label: text(s.label) }),
  };
}
export function parseDepartureRequest(v: unknown): Request {
  const r = obj(v);
  const limit = r.limit;
  if (
    limit !== undefined &&
    (typeof limit !== "number" ||
      !Number.isInteger(limit) ||
      limit < 1 ||
      limit > 20)
  )
    throw Error("Invalid limit");
  return {
    stop: stop(r.stop),
    ...(r.departureTime === undefined
      ? {}
      : { departureTime: date(r.departureTime) }),
    ...(limit === undefined ? {} : { limit: limit as number }),
  };
}
export function parseDepartureView(v: unknown): DepartureView {
  const r = obj(v);
  if (r.kind !== "departures" || r.timeZone !== "America/Los_Angeles")
    throw Error("Invalid board");
  const result: DepartureView = {
    kind: "departures",
    stop: stop(r.stop),
    timeZone: "America/Los_Angeles",
    generatedAt: date(r.generatedAt),
    requestedTime: date(r.requestedTime),
    request: parseDepartureRequest(r.request),
    warnings: list(r.warnings, 20, (x) => text(x, 1000)),
    attribution: list(r.attribution, 8, (x) => {
      const a = obj(x);
      const url = new URL(text(a.url, 300)).href;
      if (!sources.has(url)) throw Error("Invalid source");
      return { label: text(a.label, 100), url };
    }),
    departures: list(r.departures, 20, (x) => {
      const d = obj(x);
      const item: Departure = {
        stopId: text(d.stopId),
        route: text(d.route),
        mode: text(d.mode, 50),
        departureTime: date(d.departureTime),
        scheduledDepartureTime: date(d.scheduledDepartureTime),
        realTime: flag(d.realTime),
        cancelled: flag(d.cancelled),
        pickupAllowed: flag(d.pickupAllowed),
      };
      for (const key of ["routeId", "agency", "headsign", "platform"] as const)
        if (d[key] !== undefined) item[key] = text(d[key]);
      if (d.routeColor !== undefined) {
        const color = text(d.routeColor, 6);
        if (!/^[a-f\d]{6}$/i.test(color)) throw Error("Invalid color");
        item.routeColor = color;
      }
      return item;
    }),
  };
  if (result.request.stop.stopId !== result.stop.stopId)
    throw Error("Mismatched stop");
  return result;
}
const time = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  hour: "numeric",
  minute: "2-digit",
});
const stamp = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZoneName: "short",
});
const retrievalDay = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/Los_Angeles",
  month: "short",
  day: "numeric",
  timeZoneName: "short",
});
function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  cls = "",
  value?: string,
): HTMLElementTagNameMap[K] {
  const n = document.createElement(tag);
  n.className = cls;
  if (value !== undefined) n.textContent = value;
  return n;
}
function matrix(value: string, cls: string, slots: number): HTMLElement {
  const n = el("div", cls);
  n.setAttribute("aria-label", value);
  const glyphs = el("span", "matrix-words");
  glyphs.setAttribute("aria-hidden", "true");
  const rows: string[] = [];
  let row = "";
  for (const word of value.toUpperCase().split(/\s+/)) {
    if (row && row.length + word.length + 1 > slots) {
      rows.push(row);
      row = "";
    }
    let remaining = word;
    while (remaining.length > slots) {
      rows.push(remaining.slice(0, slots));
      remaining = remaining.slice(slots);
    }
    row = row ? `${row} ${remaining}` : remaining;
  }
  if (row) rows.push(row);
  for (const value of rows) {
    const cells = el("span", "matrix-text");
    cells.style.setProperty("--matrix-slots", String(slots));
    for (const char of value.padEnd(slots, " ")) {
      const cell = el("span", "matrix-cell");
      cell.append(el("span", "matrix-glyph", char === " " ? "\u00a0" : char));
      cells.append(cell);
    }
    glyphs.append(cells);
  }
  const mobile = el("span", "matrix-mobile", value);
  mobile.setAttribute("aria-hidden", "true");
  n.append(glyphs, mobile);
  return n;
}
export function createDepartureBoard(
  bridge: WidgetBridge,
  changed: () => void,
) {
  let view: DepartureView | undefined;
  let input: Request | undefined;
  let pending = false;
  let message = "";
  let sequence = 0;
  let route = "";
  let direction = "";
  function reset() {
    sequence++;
    view = undefined;
    input = undefined;
    pending = false;
    message = "";
    route = "";
    direction = "";
  }
  function prepare(value: Request) {
    reset();
    input = parseDepartureRequest(value);
    pending = true;
  }
  function receive(value: DepartureView) {
    if (input && input.stop.stopId !== value.stop.stopId) return;
    view = value;
    input = value.request;
    pending = false;
    message = "";
    changed();
  }
  function fail() {
    pending = false;
    message = view
      ? "Refresh failed. Showing previous departures."
      : "Departures couldn't load. Try again.";
    changed();
  }
  async function load(value?: Request) {
    if (!value && pending) return;
    if (value) {
      reset();
      input = parseDepartureRequest(value);
    }
    if (!input) return;
    const id = ++sequence;
    const expected = input.stop.stopId;
    pending = true;
    message = "";
    changed();
    try {
      const result = obj(
        await bridge.callServerTool({
          name: "get_stop_departures",
          arguments: structuredClone(input),
        }),
      );
      if (id !== sequence) return;
      if (result.isError === true) throw Error();
      const next = parseDepartureView(result.structuredContent);
      if (next.stop.stopId !== expected) throw Error();
      receive(next);
    } catch {
      if (id === sequence) fail();
    }
  }
  function render() {
    const section = el("section", "departure-panel");
    section.setAttribute("aria-label", "Stop departures");
    section.setAttribute("aria-busy", String(pending));
    const top = el("div", "departure-panel-top");
    top.append(
      el("h2", "", view?.stop.label || input?.stop.label || "Stop departures"),
    );
    const refresh = el(
      "button",
      "button secondary-button",
      pending ? "Loading departures…" : "Refresh departures",
    );
    refresh.type = "button";
    refresh.disabled = pending || !input;
    refresh.addEventListener("click", () => void load());
    top.append(refresh);
    section.append(top);
    if (message) {
      const notice = el("p", "notice error-notice", message);
      notice.setAttribute("role", "alert");
      section.append(notice);
    }
    if (!view) {
      const status = el(
        "p",
        "muted",
        pending ? "Loading departures…" : "No departures loaded.",
      );
      status.setAttribute("role", "status");
      section.append(status);
      return section;
    }
    if (view.request.departureTime)
      section.append(
        el(
          "p",
          "departure-note",
          `Departures after ${stamp.format(new Date(view.requestedTime))}.`,
        ),
      );
    const filters = el("div", "departure-filters");
    for (const [label, values, selected, update] of [
      [
        "Line",
        [...new Set(view.departures.map((d) => d.route))],
        route,
        (v: string) => {
          route = v;
        },
      ],
      [
        "Direction",
        [
          ...new Set(
            view.departures.map((d) => d.headsign || "Destination unavailable"),
          ),
        ],
        direction,
        (v: string) => {
          direction = v;
        },
      ],
    ] as const) {
      const field = el("label", "departure-filter", label);
      const select = el("select");
      const all = el(
        "option",
        "",
        label === "Line" ? "All lines" : "All directions",
      );
      all.value = "";
      select.append(all);
      for (const value of values) {
        const option = el("option", "", value);
        option.value = value;
        select.append(option);
      }
      select.value = selected;
      select.dataset.focusKey = `departure-filter-${label}`;
      select.addEventListener("change", () => {
        update(select.value);
        const key = select.dataset.focusKey;
        changed();
        document
          .querySelector<HTMLSelectElement>(`select[data-focus-key="${key}"]`)
          ?.focus({ preventScroll: true });
      });
      field.append(select);
      filters.append(field);
    }
    section.append(filters);
    const board = el("div", "matrix-board");
    const title = el("div", "matrix-title");
    title.append(el("span", "", "Departures"));
    const retrieved = el("div", "board-clock");
    retrieved.append(
      el("strong", "", time.format(new Date(view.generatedAt))),
      el(
        "small",
        "",
        `RETRIEVED · ${retrievalDay.format(new Date(view.generatedAt))}`,
      ),
    );
    title.append(retrieved);
    board.append(title);
    const head = el("div", "departures-head");
    for (const label of ["Line", "Destination", "Status", "Departing"])
      head.append(el("span", "", label));
    board.append(head);
    const rows = view.departures.filter(
      (d) =>
        (!route || d.route === route) &&
        (!direction || (d.headsign || "Destination unavailable") === direction),
    );
    for (const d of rows) {
      const row = el("div", "departure-row");
      const line = matrix(d.route, "matrix-line", 6);
      const bartColor = (
        {
          blue: "#71bdf4",
          green: "#80d280",
          yellow: "#f5db61",
          red: "#ff9d94",
          orange: "#ffbf77",
        } as Record<string, string>
      )[d.route.toLowerCase().replace(/ line$/, "")];
      if (bartColor && (d.mode === "SUBWAY" || /bart/i.test(d.agency || "")))
        line.style.color = bartColor;
      else if (d.routeColor) {
        // Keep provider colors legible against the charcoal board.
        const rgb = [0, 2, 4].map((offset) =>
          parseInt(d.routeColor!.slice(offset, offset + 2), 16),
        );
        const luminance =
          rgb[0]! * 0.2126 + rgb[1]! * 0.7152 + rgb[2]! * 0.0722;
        line.style.color =
          luminance < 100
            ? `rgb(${rgb.map((channel) => Math.round(channel * 0.55 + 255 * 0.45)).join(",")})`
            : `#${d.routeColor}`;
      }
      const dest = matrix(
        d.headsign || "Destination unavailable",
        "matrix-destination",
        22,
      );
      if (d.platform)
        dest.append(
          el("small", "countdown-secondary", `Platform ${d.platform}`),
        );
      const status = matrix(
        d.cancelled
          ? d.pickupAllowed
            ? "Cancelled"
            : "Cancelled · No pickup"
          : !d.pickupAllowed
            ? "No pickup"
            : d.realTime
              ? "Live"
              : "Scheduled",
        `matrix-status${d.realTime && !d.cancelled && d.pickupAllowed ? " is-live" : ""}${d.cancelled || !d.pickupAllowed ? " is-unavailable" : ""}`,
        9,
      );
      const when = matrix(
        time.format(new Date(d.departureTime)),
        `matrix-departure${d.realTime && !d.cancelled && d.pickupAllowed ? " is-live" : ""}`,
        8,
      );
      if (d.realTime && d.departureTime !== d.scheduledDepartureTime)
        when.append(
          el(
            "small",
            "countdown-secondary",
            `Scheduled ${time.format(new Date(d.scheduledDepartureTime))}`,
          ),
        );
      row.append(line, dest, status, when);
      board.append(row);
    }
    if (!rows.length)
      board.append(
        el(
          "p",
          "departure-empty",
          view.departures.length
            ? "No loaded departures match these filters."
            : "No departures returned for this stop and time.",
        ),
      );
    section.append(
      board,
      el(
        "p",
        "departure-note",
        `Showing ${rows.length} of ${view.departures.length} departures from this request. Filters use these results only.`,
      ),
      el(
        "p",
        "departure-note",
        "Live estimates can change. Scheduled times follow the timetable.",
      ),
    );
    for (const warning of view.warnings)
      section.append(el("p", "departure-note", warning));
    const links = el("nav", "source-links");
    links.setAttribute("aria-label", "Departure data sources");
    for (const source of view.attribution) {
      const a = el("a", "", source.label);
      a.href = source.url;
      a.addEventListener("click", (e) => {
        e.preventDefault();
        void bridge.openLink({ url: source.url }).catch(() => {
          message = "The source link couldn't open.";
          changed();
        });
      });
      links.append(a);
    }
    section.append(links);
    return section;
  }
  return { reset, prepare, receive, fail, load, render };
}
