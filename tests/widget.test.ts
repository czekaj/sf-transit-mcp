// @vitest-environment happy-dom
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  createTripWidget,
  applyTripHostContext,
  parseTripView,
  type WidgetBridge,
} from "../widget/app.js";
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
