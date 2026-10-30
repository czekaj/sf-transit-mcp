import { Resvg } from "@resvg/resvg-js";
import { readFile, writeFile } from "node:fs/promises";

const assets = new URL("../assets/", import.meta.url);
// Keep the selected image-generated artwork intact; exports only frame and scale it.
const artwork = await readFile(new URL("route-monogram.png", assets));
if (
  artwork.subarray(0, 8).toString("hex") !== "89504e470d0a1a0a" ||
  artwork.readUInt32BE(16) !== 2056 ||
  artwork.readUInt32BE(20) !== 765
) {
  throw new Error(
    "Expected the original 2056 × 765 PNG. Update export viewports when replacing it.",
  );
}
const source = `data:image/png;base64,${artwork.toString("base64")}`;
const image = `<image width="2056" height="765" href="${source}"/>`;
function render(svg, width) {
  return new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: { defaultFontFamily: "Arial", loadSystemFonts: true },
  })
    .render()
    .asPng();
}

// This viewport contains the original SF route/bridge/tram symbol, excluding its wordmark.
const icon = `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512" viewBox="0 0 512 512">
  <title>SF Bay Area Transit MCP</title>
  <rect width="512" height="512" rx="108" fill="#FAF7F1"/>
  <svg x="24" y="56" width="464" height="400" viewBox="24 55 906 620" overflow="hidden">${image}</svg>
</svg>`;
for (const size of [32, 256, 512]) {
  await writeFile(new URL(`icon-${size}.png`, assets), render(icon, size));
}

const logo = `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="608" viewBox="0 0 1600 608">
  <title>SF Bay Area Transit MCP</title>
  <rect width="1600" height="608" rx="44" fill="#FAF7F1"/>
  <image x="48" y="24" width="1504" height="560" href="${source}"/>
</svg>`;
await writeFile(new URL("logo.png", assets), render(logo, 1600));

const social = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="640" viewBox="0 0 1280 640">
  <rect width="1280" height="640" fill="#FAF7F1"/>
  <text x="640" y="92" fill="#C34F35" font-family="Arial, Helvetica, sans-serif" font-size="18" font-weight="700" text-anchor="middle" letter-spacing="4">OPEN-SOURCE TRIP PLANNING</text>
  <image x="64" y="110" width="1152" height="429" href="${source}"/>
  <text x="640" y="558" fill="#4D6258" font-family="Arial, Helvetica, sans-serif" font-size="27" text-anchor="middle">From here to there, with Claude.</text>
  <path d="M0 632h1280" stroke="#C34F35" stroke-width="16"/>
</svg>`;
await writeFile(new URL("social-preview.png", assets), render(social, 1280));
console.log(
  "Exported original route-line logo, MCP icon sizes, and 1280 × 640 social preview.",
);
