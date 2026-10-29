import {
  AppBridge,
  PostMessageTransport,
} from "@modelcontextprotocol/ext-apps/app-bridge";
import type { CallToolResult } from "@modelcontextprotocol/client";

const fixture = (await fetch("/fixture.json").then((response) =>
  response.json(),
)) as CallToolResult & {
  structuredContent: {
    request: Record<string, unknown>;
    itineraries: unknown[];
    warnings: string[];
  };
};
const frame = document.querySelector<HTMLIFrameElement>("#view")!;
const status = document.querySelector<HTMLElement>("#status")!;
let refreshes = 0;
let failNext = false;
let dark = false;
function canonical(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object")
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, child]) => [key, canonical(child)]),
    );
  return value;
}
const bridge = new AppBridge(
  null,
  { name: "SF Transit local preview", version: "1" },
  { openLinks: {}, serverTools: {} },
  {
    hostContext: {
      theme: "light",
      displayMode: "inline",
      availableDisplayModes: ["inline", "fullscreen"],
      platform: "web",
      locale: "en-US",
      timeZone: "America/Los_Angeles",
    },
  },
);
bridge.onrequestdisplaymode = async ({ mode }) => {
  bridge.setHostContext({ displayMode: mode });
  document.querySelector<HTMLElement>("#frame-wrap")!.style.maxWidth =
    mode === "fullscreen" ? "100%" : "740px";
  status.textContent = `Preview display mode: ${mode}.`;
  return { mode };
};
bridge.oninitialized = () => {
  void showFixture();
};
bridge.onsizechange = ({ height }) => {
  if (height !== undefined) frame.style.height = `${Math.ceil(height)}px`;
};
bridge.onopenlink = async ({ url }) => {
  status.textContent = `Source link selected: ${url} (navigation disabled in the preview).`;
  return {};
};
bridge.oncalltool = async ({ name, arguments: args }) => {
  if (
    name !== "plan_trip" ||
    JSON.stringify(canonical(args)) !==
      JSON.stringify(canonical(fixture.structuredContent.request))
  )
    throw new Error("Preview only accepts the original synthetic trip request");
  refreshes++;
  status.textContent = `Simulated refreshes: ${refreshes}. No live service was contacted.`;
  if (failNext) {
    failNext = false;
    document
      .querySelector("#fail-refresh")!
      .setAttribute("aria-pressed", "false");
    return {
      isError: true,
      content: [
        { type: "text", text: "UNAVAILABLE: Fixture service is unavailable." },
      ],
    };
  }
  return structuredClone(fixture);
};
async function showFixture() {
  await bridge.sendToolInput({ arguments: fixture.structuredContent.request });
  await bridge.sendToolResult(structuredClone(fixture));
  status.textContent = `Connected to the sandboxed widget. Simulated refreshes: ${refreshes}.`;
}
document.querySelector("#theme")!.addEventListener("click", () => {
  dark = !dark;
  bridge.setHostContext({ theme: dark ? "dark" : "light" });
  document.body.dataset.theme = dark ? "dark" : "light";
  document.querySelector("#theme")!.textContent = dark
    ? "Light theme"
    : "Dark theme";
});
document.querySelector("#mobile")!.addEventListener("click", (event) => {
  const button = event.currentTarget as HTMLButtonElement;
  const active = button.getAttribute("aria-pressed") !== "true";
  button.setAttribute("aria-pressed", String(active));
  document.querySelector<HTMLElement>("#frame-wrap")!.style.maxWidth = active
    ? "360px"
    : "740px";
});
document.querySelector("#normal")!.addEventListener("click", () => {
  void showFixture();
});
document.querySelector("#empty")!.addEventListener("click", () => {
  const empty = structuredClone(fixture);
  empty.structuredContent.itineraries = [];
  empty.structuredContent.warnings = ["No journeys found for this time."];
  void bridge.sendToolResult(empty);
});
document.querySelector("#error")!.addEventListener("click", () => {
  void bridge.sendToolResult({
    isError: true,
    content: [
      { type: "text", text: "UNAVAILABLE: Fixture service is unavailable." },
    ],
  });
});
document.querySelector("#fail-refresh")!.addEventListener("click", (event) => {
  failNext = !failNext;
  (event.currentTarget as HTMLButtonElement).setAttribute(
    "aria-pressed",
    String(failNext),
  );
});
await bridge.connect(
  new PostMessageTransport(frame.contentWindow!, frame.contentWindow!),
);
frame.src = "/widget.html";
