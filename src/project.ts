export const PROJECT = {
  name: "sf-transit-mcp",
  version: "0.1.0",
  url: "https://github.com/riv-lc/sf-transit-mcp",
  providerUrl: "https://api.transitous.org",
  userAgent: "sf-transit-mcp/0.1.0 (+https://github.com/riv-lc/sf-transit-mcp)",
} as const;

export const ATTRIBUTION = [
  { label: "Routing by Transitous", url: "https://transitous.org" },
  { label: "Transitous data sources", url: "https://transitous.org/sources/" },
  {
    label: "© OpenStreetMap contributors",
    url: "https://www.openstreetmap.org/copyright",
  },
  { label: "Bay Area data provided by 511.org", url: "https://511.org" },
] as const;

export const ATTRIBUTION_TEXT = ATTRIBUTION.map(
  ({ label, url }) => `[${label}](${url})`,
).join(" · ");
