// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createTripWidget,
  applyTripHostContext,
  parseTripView,
  type WidgetBridge,
} from "../widget/app.js";
import { parseDepartureView } from "../widget/departures.js";
import fixture from "./fixtures/widget-trip.json";

let root: HTMLElement;
beforeEach(() => {
  document.body.replaceChildren();
  root = document.createElement("div");
  document.body.append(root);
});
function result() {
  return structuredClone(fixture);
}
function bridge() {
  return {
    callServerTool: vi
      .fn<WidgetBridge["callServerTool"]>()
      .mockResolvedValue(result()),
    openLink: vi.fn<WidgetBridge["openLink"]>().mockResolvedValue({}),
    requestDisplayMode: vi
      .fn<NonNullable<WidgetBridge["requestDisplayMode"]>>()
      .mockResolvedValue({ mode: "fullscreen" }),
  };
}
function button(label: string): HTMLButtonElement {
  const found = Array.from(root.querySelectorAll("button")).find((item) =>
    item.textContent?.includes(label),
  );
  if (!found) throw new Error(`Missing button: ${label}`);
  return found;
}
const settle = () => new Promise<void>((resolve) => queueMicrotask(resolve));

describe("journey widget", () => {
  it("renders supplied routes without making an initial request", () => {
    const host = bridge();
    const widget = createTripWidget(root, host);
    expect(root.textContent).toContain("Waiting for your route options");
    widget.receiveToolResult(result());
    expect(root.querySelectorAll(".route-card")).toHaveLength(2);
    expect(root.querySelector(".route-card[aria-pressed=true]")).not.toBeNull();
    expect(root.textContent).toContain("Live and scheduled times");
    expect(root.textContent).toContain("Leaving now");
    expect(root.textContent).toContain(
      "the data does not say when they were last updated",
    );
    expect(host.callServerTool).not.toHaveBeenCalled();
  });

  it("selects routes and expands timelines locally with honest totals and unknown accessibility", () => {
    const host = bridge();
    const widget = createTripWidget(root, host);
    widget.receiveToolResult(result());
    button("Journey details").click();
    expect(root.querySelector("#journey-details")?.textContent).toContain(
      "45 min travelling",
    );
    expect(root.textContent).toContain(
      "3 min before leaving · 48 min from 2:00 PM",
    );
    expect(root.textContent).toContain("Wait 4 min");
    expect(root.textContent).toContain("Vehicle accessibility unknown");
    expect(root.textContent).not.toContain(
      "Vehicle marked wheelchair accessible",
    );
    root.querySelectorAll<HTMLButtonElement>(".route-card")[1]!.click();
    expect(root.querySelector("#journey-details")?.textContent).toContain(
      "52 min travelling",
    );
    expect(root.textContent).toContain(
      "1 min before leaving · 53 min from 2:00 PM",
    );
    expect(host.callServerTool).not.toHaveBeenCalled();
  });

  it("refreshes only on click, preserves omitted time, and blocks duplicate requests", async () => {
    const host = bridge();
    let complete!: (value: unknown) => void;
    host.callServerTool.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const widget = createTripWidget(root, host);
    const incoming = result();
    widget.receiveToolResult(incoming);
    incoming.structuredContent.request.origin.label = "Externally mutated";
    button("Refresh").click();
    button("Refreshing").click();
    expect(host.callServerTool).toHaveBeenCalledTimes(1);
    expect(button("Refreshing").disabled).toBe(true);
    const args = host.callServerTool.mock.calls[0]![0].arguments;
    expect(args).not.toHaveProperty("departureTime");
    expect(args).not.toHaveProperty("arrivalTime");
    expect((args.origin as { label: string }).label).toBe(
      "San Francisco City Hall",
    );
    complete(result());
    await settle();
    await settle();
    expect(button("Refresh").disabled).toBe(false);
    expect(root.textContent).toContain("Routes updated.");
  });

  it("retains old results and marks a failed refresh prominently", async () => {
    const host = bridge();
    host.callServerTool.mockRejectedValue(
      new Error("SECRET internal response"),
    );
    const widget = createTripWidget(root, host);
    widget.receiveToolResult(result());
    button("Refresh").click();
    await settle();
    await settle();
    expect(root.querySelector('[role="alert"]')?.textContent).toBe(
      "Refresh failed. Showing your previous route results.",
    );
    expect(root.querySelectorAll(".route-card")).toHaveLength(2);
    expect(root.textContent).toContain("Previous results from");
    expect(root.textContent).not.toContain("SECRET");
    expect(root.textContent).not.toContain("Routes updated.");
  });

  it("does not let an older refresh overwrite a newer host trip", async () => {
    const host = bridge();
    let complete!: (value: unknown) => void;
    host.callServerTool.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const widget = createTripWidget(root, host);
    widget.receiveToolResult(result());
    button("Refresh").click();
    const next = result();
    next.structuredContent.destination.label = "A different destination";
    widget.receiveToolResult(next);
    complete(result());
    await settle();
    await settle();
    expect(root.querySelector(".journey-title")?.textContent).toContain(
      "A different destination",
    );
  });

  it("fences an old refresh as soon as a newer host trip starts", async () => {
    const host = bridge();
    let complete!: (value: unknown) => void;
    host.callServerTool.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const widget = createTripWidget(root, host);
    widget.receiveToolResult(result());
    button("Refresh").click();
    const newerRequest = structuredClone(fixture.structuredContent.request);
    newerRequest.destination.label = "A newer trip";
    widget.receiveToolInput({ arguments: newerRequest });
    complete(result());
    await settle();
    await settle();
    expect(root.textContent).toContain(
      "Planning a new trip. Showing previous routes until it is ready.",
    );
    expect(root.textContent).not.toContain("Routes updated.");
    expect(button("Refresh").disabled).toBe(true);
  });

  it("ignores late refresh results after teardown", async () => {
    const host = bridge();
    let complete!: (value: unknown) => void;
    host.callServerTool.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const widget = createTripWidget(root, host);
    widget.receiveToolResult(result());
    button("Refresh").click();
    widget.destroy();
    complete(result());
    await settle();
    await settle();
    expect(root.childElementCount).toBe(0);
  });

  it("renders errors and no-route results without silently requesting again", () => {
    const host = bridge();
    const widget = createTripWidget(root, host);
    widget.receiveToolResult({
      isError: true,
      content: [{ type: "text", text: "SECRET error" }],
    });
    expect(root.textContent).toContain("This trip couldn't load");
    expect(root.textContent).not.toContain("SECRET");
    const empty = result();
    empty.structuredContent.itineraries = [];
    widget.receiveToolResult(empty);
    expect(root.textContent).toContain("No routes found");
    expect(button("Journey details").disabled).toBe(true);
    expect(host.callServerTool).not.toHaveBeenCalled();
  });

  it("renders untrusted labels as text and opens only allowlisted attribution through the host", () => {
    const host = bridge();
    const widget = createTripWidget(root, host);
    const incoming = result();
    incoming.structuredContent.origin.label = '<img src=x onerror="alert(1)">';
    widget.receiveToolResult(incoming);
    expect(root.querySelector(".journey-title img")).toBeNull();
    expect(root.textContent).toContain("<img src=x");
    root.querySelector<HTMLAnchorElement>(".source-links a")!.click();
    expect(host.openLink).toHaveBeenCalledWith({
      url: "https://transitous.org/",
    });
    const unsafe = result();
    unsafe.structuredContent.attribution[0]!.url = "javascript:alert(1)";
    expect(() => parseTripView(unsafe.structuredContent)).toThrow();
  });

  it("shows calendar dates when a journey arrives the following Pacific day", () => {
    const host = bridge();
    const widget = createTripWidget(root, host);
    const incoming = result();
    incoming.structuredContent.itineraries[0]!.departureTime =
      "2026-10-29T23:45:00-07:00";
    incoming.structuredContent.itineraries[0]!.arrivalTime =
      "2026-10-30T00:30:00-07:00";
    widget.receiveToolResult(incoming);
    expect(root.querySelector(".card-times")?.textContent).toContain("Oct 30");
  });

  it("bounds inline options and opens all routes in supported fullscreen without a server call", async () => {
    const host = bridge();
    const widget = createTripWidget(root, host);
    widget.setFullscreenAvailable(true);
    const incoming = result();
    incoming.structuredContent.itineraries = Array.from({ length: 12 }, () =>
      structuredClone(incoming.structuredContent.itineraries[0]!),
    );
    widget.receiveToolResult(incoming);
    expect(root.querySelectorAll(".route-card")).toHaveLength(3);
    button("Journey details").click();
    await settle();
    await settle();
    expect(host.requestDisplayMode).toHaveBeenCalledWith({
      mode: "fullscreen",
    });
    expect(root.querySelectorAll(".route-card")).toHaveLength(12);
    widget.setDisplayMode("inline");
    expect(root.querySelectorAll(".route-card")).toHaveLength(3);
    expect(host.callServerTool).not.toHaveBeenCalled();
  });

  it("retains fullscreen capability and safe areas across partial theme updates", async () => {
    const host = bridge();
    const widget = createTripWidget(root, host);
    applyTripHostContext(widget, {
      availableDisplayModes: ["inline", "fullscreen"],
      safeAreaInsets: { top: 4, right: 8, bottom: 12, left: 8 },
    });
    widget.receiveToolResult(result());
    applyTripHostContext(widget, { theme: "dark" });
    button("Journey details").click();
    await settle();
    await settle();
    expect(host.requestDisplayMode).toHaveBeenCalledWith({
      mode: "fullscreen",
    });
    expect(
      document.documentElement.style.getPropertyValue("--safe-bottom"),
    ).toBe("12px");
    expect(host.callServerTool).not.toHaveBeenCalled();
  });

  it.each(["unavailable", "refused"])(
    "shows every route and step inline when fullscreen is %s",
    async (availability) => {
      const host = bridge();
      host.requestDisplayMode.mockRejectedValue(
        new Error("Fullscreen unavailable"),
      );
      const widget = createTripWidget(root, host);
      widget.setFullscreenAvailable(availability === "refused");
      const incoming = result();
      const first = incoming.structuredContent.itineraries[0]!;
      const prototypeLeg = first.legs[0]!;
      const start = Date.parse(first.departureTime);
      first.legs = Array.from({ length: 9 }, (_, index) => ({
        ...prototypeLeg,
        departureTime: new Date(start + index * 60_000).toISOString(),
        arrivalTime: new Date(start + (index + 1) * 60_000).toISOString(),
        scheduledDepartureTime: new Date(start + index * 60_000).toISOString(),
        scheduledArrivalTime: new Date(
          start + (index + 1) * 60_000,
        ).toISOString(),
        durationSeconds: 60,
      }));
      first.arrivalTime = first.legs[8]!.arrivalTime;
      first.durationSeconds = 9 * 60;
      incoming.structuredContent.itineraries = Array.from({ length: 9 }, () =>
        structuredClone(first),
      );
      widget.receiveToolResult(incoming);
      expect(root.querySelectorAll(".route-card")).toHaveLength(3);
      button("Journey details").click();
      await settle();
      await settle();
      expect(root.querySelectorAll(".route-card")).toHaveLength(9);
      expect(root.querySelectorAll(".timeline-leg")).toHaveLength(9);
      expect(host.callServerTool).not.toHaveBeenCalled();
    },
  );
});

describe("departure boards", () => {
  const stop = {
    stopId: "stop-1",
    latitude: 37.79,
    longitude: -122.4,
    label: "Embarcadero",
  };
  function result() {
    return {
      structuredContent: {
        kind: "departures",
        stop,
        timeZone: "America/Los_Angeles",
        generatedAt: "2026-10-29T14:00:00-07:00",
        requestedTime: "2026-10-29T14:00:00-07:00",
        request: { stop, limit: 20 },
        warnings: [],
        attribution: [{ label: "Transitous", url: "https://transitous.org/" }],
        departures: [true, false, false].map((live, index) => ({
          stopId: "stop-1",
          route: index ? "Green" : "Blue",
          mode: "SUBWAY",
          headsign: index ? "Daly City" : "Dublin / Pleasanton",
          routeColor: "71BDF4",
          departureTime: "2026-10-29T14:06:00-07:00",
          scheduledDepartureTime: "2026-10-29T14:05:00-07:00",
          realTime: live,
          cancelled: index === 1,
          pickupAllowed: index !== 2,
        })),
      },
    };
  }
  let root: HTMLElement;
  beforeEach(() => {
    document.body.replaceChildren();
    root = document.createElement("div");
    document.body.append(root);
  });
  function host() {
    return {
      callServerTool: vi
        .fn<WidgetBridge["callServerTool"]>()
        .mockResolvedValue(result()),
      openLink: vi.fn().mockResolvedValue({}),
    };
  }
  function button(label: string) {
    return [...root.querySelectorAll("button")].find((b) =>
      b.textContent?.includes(label),
    )!;
  }
  const settle = async () => {
    await Promise.resolve();
    await Promise.resolve();
  };
  it("renders standalone live, cancellation and no pickup states without requesting", () => {
    const bridge = host();
    const widget = createTripWidget(root, bridge);
    widget.receiveToolResult(result());
    expect(root.querySelectorAll(".departure-row")).toHaveLength(3);
    expect(root.textContent).toContain("RETRIEVED");
    expect(root.textContent).not.toContain("min after retrieval");
    expect(
      root.querySelector(".matrix-departure")?.getAttribute("aria-label"),
    ).toMatch(/\d:\d{2} [AP]M/);
    expect(root.querySelectorAll(".matrix-status.is-unavailable")).toHaveLength(
      2,
    );
    expect(root.querySelectorAll(".matrix-departure.is-live")).toHaveLength(1);
    expect(bridge.callServerTool).not.toHaveBeenCalled();
    const select = root.querySelector("select")!;
    select.value = "Blue";
    select.dispatchEvent(new Event("change"));
    expect(root.querySelectorAll(".departure-row")).toHaveLength(1);
    expect(root.textContent).toContain("Filters use these results only");
    expect(bridge.callServerTool).not.toHaveBeenCalled();
  });
  it("keeps previous departures on refresh failure and sanitizes errors", async () => {
    const bridge = host();
    bridge.callServerTool.mockRejectedValue(Error("SECRET"));
    const widget = createTripWidget(root, bridge);
    widget.receiveToolResult(result());
    button("Refresh departures").click();
    await settle();
    expect(root.textContent).toContain(
      "Refresh failed. Showing previous departures.",
    );
    expect(root.textContent).not.toContain("SECRET");
    expect(root.querySelectorAll(".departure-row")).toHaveLength(3);
    expect(bridge.callServerTool.mock.calls[0]![0]).toEqual({
      name: "get_stop_departures",
      arguments: { stop, limit: 20 },
    });
  });
  it("renders empty and pending standalone states with no automatic calls", () => {
    const bridge = host();
    const widget = createTripWidget(root, bridge);
    widget.receiveToolInput({ arguments: { stop } });
    expect(root.textContent).toContain("Loading departures");
    const empty = result();
    empty.structuredContent.departures = [];
    widget.receiveToolResult(empty);
    expect(root.textContent).toContain("No departures returned");
    expect(bridge.callServerTool).not.toHaveBeenCalled();
  });
  it("preserves stop IDs and opens a board only on explicit click without replacing trip", async () => {
    const bridge = host();
    const widget = createTripWidget(root, bridge);
    const incoming = structuredClone(fixture);
    const leg = incoming.structuredContent.itineraries[0]!.legs.find(
      (l) => l.mode !== "WALK",
    )!;
    Object.assign(leg.from, stop);
    expect(
      parseTripView(incoming.structuredContent).itineraries[0]!.legs.find(
        (l) => l.mode !== "WALK",
      )!.from.stopId,
    ).toBe("stop-1");
    widget.receiveToolResult(incoming);
    button("Journey details").click();
    expect(bridge.callServerTool).not.toHaveBeenCalled();
    button("Next departures").click();
    await settle();
    expect(root.querySelectorAll(".route-card")).toHaveLength(2);
    expect(root.querySelectorAll(".departure-row")).toHaveLength(3);
    widget.receiveToolResult(result());
    expect(root.querySelectorAll(".route-card")).toHaveLength(2);
  });
  it("fences an old inline call when a newer trip starts", async () => {
    const bridge = host();
    let complete!: (v: unknown) => void;
    bridge.callServerTool.mockImplementation(
      () =>
        new Promise((resolve) => {
          complete = resolve;
        }),
    );
    const widget = createTripWidget(root, bridge);
    const incoming = structuredClone(fixture);
    Object.assign(
      incoming.structuredContent.itineraries[0]!.legs.find(
        (l) => l.mode !== "WALK",
      )!.from,
      stop,
    );
    widget.receiveToolResult(incoming);
    button("Journey details").click();
    button("Next departures").click();
    widget.receiveToolInput({ arguments: incoming.structuredContent.request });
    complete(result());
    await settle();
    widget.receiveToolResult(result());
    expect(root.querySelector(".departure-panel")).toBeNull();
    expect(root.textContent).toContain("Planning a new trip");
  });
  it("does not offer a board for missing stop IDs", () => {
    const widget = createTripWidget(root, host());
    widget.receiveToolResult(structuredClone(fixture));
    button("Journey details").click();
    expect(root.querySelector(".departures-open")).toBeNull();
  });
  it("rejects untrusted fields and preserves provider labels as text", () => {
    const source = result();
    for (const change of [
      (x: ReturnType<typeof result>) => {
        x.structuredContent.departures[0]!.routeColor = "red;";
      },
      (x: ReturnType<typeof result>) => {
        x.structuredContent.generatedAt = "bad";
      },
      (x: ReturnType<typeof result>) => {
        x.structuredContent.request.limit = 21;
      },
      (x: ReturnType<typeof result>) => {
        x.structuredContent.attribution[0]!.url = "javascript:alert(1)";
      },
    ]) {
      const bad = structuredClone(source);
      change(bad);
      expect(() => parseDepartureView(bad.structuredContent)).toThrow();
    }
    source.structuredContent.stop = {
      ...stop,
      label: "<img src=x onerror=alert(1)>",
    };
    const widget = createTripWidget(root, host());
    widget.receiveToolResult(source);
    expect(root.querySelector(".departure-panel h2 img")).toBeNull();
    expect(root.textContent).toContain("<img src=x");
  });
});

it("keeps matrix labels in fixed padded slots and preserves long destinations", () => {
  const stop = { stopId: "matrix-stop", latitude: 37.79, longitude: -122.4 };
  const widget = createTripWidget(root, bridge());
  widget.receiveToolResult({
    structuredContent: {
      kind: "departures",
      stop,
      timeZone: "America/Los_Angeles",
      generatedAt: "2026-10-29T14:00:00-07:00",
      requestedTime: "2026-10-29T14:00:00-07:00",
      request: { stop },
      warnings: [],
      attribution: [],
      departures: [
        {
          stopId: stop.stopId,
          route: "Yellow",
          agency: "BART",
          mode: "SUBWAY",
          headsign: "San Francisco Airport",
          departureTime: "2026-10-29T14:06:00-07:00",
          scheduledDepartureTime: "2026-10-29T14:06:00-07:00",
          realTime: false,
          cancelled: false,
          pickupAllowed: true,
        },
        {
          stopId: stop.stopId,
          route: "Blue",
          mode: "SUBWAY",
          headsign: "A very long destination that stays completely readable",
          departureTime: "2026-10-29T14:06:00-07:00",
          scheduledDepartureTime: "2026-10-29T14:06:00-07:00",
          realTime: true,
          cancelled: false,
          pickupAllowed: true,
        },
      ],
    },
  });
  const first = root.querySelector(".departure-row")!;
  for (const [selector, slots] of [
    [".matrix-line", 13],
    [".matrix-destination", 22],
    [".matrix-departure", 8],
  ] as const) {
    const field = first.querySelector(selector)!;
    expect(field.querySelectorAll(".matrix-text")).toHaveLength(1);
    expect(field.querySelectorAll(".matrix-cell")).toHaveLength(slots);
  }
  expect(
    first.querySelector(".matrix-destination .matrix-mobile")?.textContent,
  ).toBe("San Francisco Airport");
  const long = root.querySelectorAll(".matrix-destination")[1]!;
  expect(long.querySelectorAll(".matrix-text").length).toBeGreaterThan(1);
  expect(long.getAttribute("aria-label")).toBe(
    "A very long destination that stays completely readable",
  );
});

it("fits Local Weekend, falls back for unbroken names, and groups plain status with time", () => {
  const stop = { stopId: "caltrain", latitude: 37.77, longitude: -122.4 };
  const departure = {
    stopId: stop.stopId,
    route: "Local Weekend",
    mode: "RAIL",
    headsign: "Tamien",
    departureTime: "2026-10-29T17:55:00-07:00",
    scheduledDepartureTime: "2026-10-29T17:55:00-07:00",
    realTime: true,
    cancelled: false,
    pickupAllowed: true,
  };
  const widget = createTripWidget(root, bridge());
  widget.receiveToolResult({
    structuredContent: {
      kind: "departures",
      stop,
      timeZone: "America/Los_Angeles",
      generatedAt: departure.departureTime,
      requestedTime: departure.departureTime,
      request: { stop },
      warnings: [],
      attribution: [],
      departures: [
        departure,
        {
          ...departure,
          route: "ExceptionallyLongUnbrokenServiceName",
          headsign: "UnbrokenDestinationNameBeyondTwentyTwoCharacters",
        },
        { ...departure, cancelled: true },
        { ...departure, pickupAllowed: false },
      ],
    },
  });
  const rows = root.querySelectorAll(".departure-row");
  expect(rows[0]!.children).toHaveLength(3);
  expect(rows[0]!.querySelectorAll(".matrix-line .matrix-text")).toHaveLength(
    1,
  );
  expect(rows[0]!.querySelectorAll(".matrix-line .matrix-cell")).toHaveLength(
    13,
  );
  expect(
    rows[0]!
      .querySelector(".matrix-line .matrix-text")
      ?.textContent?.replaceAll("\u00a0", " "),
  ).toBe("LOCAL WEEKEND");
  expect(
    rows[0]!.querySelector(".matrix-departure .matrix-status")?.textContent,
  ).toBe("Live");
  expect(rows[0]!.querySelector(".matrix-status .matrix-glyph")).toBeNull();
  expect(rows[1]!.querySelectorAll(".matrix-fallback")).toHaveLength(2);
  expect(
    rows[1]!.querySelector(".matrix-line .matrix-mobile")?.textContent,
  ).toBe("ExceptionallyLongUnbrokenServiceName");
  for (const row of [rows[2]!, rows[3]!]) {
    expect(row.querySelector(".matrix-status.is-unavailable")).not.toBeNull();
    expect(row.querySelector(".matrix-departure.is-live")).toBeNull();
  }
});

it("compares scheduled references by Pacific displayed day and minute", () => {
  const stop = { stopId: "timing", latitude: 37.77, longitude: -122.4 };
  const departure = {
    stopId: stop.stopId,
    route: "Local Weekend",
    mode: "RAIL",
    headsign: "Tamien",
    departureTime: "2026-10-30T00:05:30-07:00",
    scheduledDepartureTime: "2026-10-30T07:05:30Z",
    realTime: true,
    cancelled: false,
    pickupAllowed: true,
  };
  const widget = createTripWidget(root, bridge());
  widget.receiveToolResult({
    structuredContent: {
      kind: "departures",
      stop,
      timeZone: "America/Los_Angeles",
      generatedAt: departure.departureTime,
      requestedTime: departure.departureTime,
      request: { stop },
      warnings: [],
      attribution: [],
      departures: [
        departure,
        { ...departure, scheduledDepartureTime: "2026-10-30T00:05:00-07:00" },
        { ...departure, scheduledDepartureTime: "2026-10-30T00:02:00-07:00" },
        { ...departure, scheduledDepartureTime: "2026-10-29T00:05:00-07:00" },
        { ...departure, scheduledDepartureTime: "2026-10-29T23:59:00-07:00" },
      ],
    },
  });
  const rows = root.querySelectorAll(".departure-row");
  expect(rows[0]!.querySelector(".scheduled-reference")).toBeNull();
  expect(rows[1]!.querySelector(".scheduled-reference")).toBeNull();
  expect(rows[2]!.querySelector(".scheduled-time")?.textContent).toBe(
    "12:02 AM",
  );
  expect(rows[3]!.querySelector(".scheduled-date")?.textContent).toContain(
    "Oct 29",
  );
  expect(rows[4]!.querySelector(".scheduled-date")?.textContent).toBe("Oct 29");
  expect(rows[4]!.querySelector(".scheduled-time")?.textContent).toBe(
    "11:59 PM",
  );
});
