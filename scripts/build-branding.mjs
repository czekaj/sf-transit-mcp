import { Resvg } from "@resvg/resvg-js";
import { readFile, writeFile } from "node:fs/promises";

const assets = new URL("../assets/", import.meta.url);
const icon = await readFile(new URL("icon.svg", assets), "utf8");
const body = icon.replace(/^<svg[^>]*>/, "").replace(/<\/svg>\s*$/, "");
function render(svg, width) {
  return new Resvg(svg, {
    fitTo: { mode: "width", value: width },
    font: { defaultFontFamily: "Arial", loadSystemFonts: true },
  })
    .render()
    .asPng();
}
for (const size of [32, 256, 512]) {
  await writeFile(new URL(`icon-${size}.png`, assets), render(icon, size));
}
const logo = `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="160" viewBox="0 0 500 160">
  <title>SF Bay Area Transit MCP</title>
  <rect width="500" height="160" rx="24" fill="#FAF7F1"/>
  <svg x="14" y="14" width="132" height="132" viewBox="0 0 64 64" fill="none">${body}</svg>
  <g fill="#234B40" font-family="Arial, Helvetica, sans-serif">
    <text x="178" y="74" font-size="44" font-weight="700" letter-spacing="-1.5">SF Bay Area</text>
    <text x="178" y="123" font-size="44" font-weight="700" letter-spacing="-1.5">Transit MCP</text>
  </g>
</svg>`;
await writeFile(new URL("logo.svg", assets), logo);
await writeFile(new URL("logo.png", assets), render(logo, 1000));
const social = `<svg xmlns="http://www.w3.org/2000/svg" width="1280" height="640" viewBox="0 0 1280 640">
  <rect width="1280" height="640" fill="#FAF7F1"/>
  <path d="M0 624h1280" stroke="#C34F35" stroke-width="32"/>
  <svg x="82" y="150" width="320" height="320" viewBox="0 0 64 64" fill="none">${body}</svg>
  <g font-family="Arial, Helvetica, sans-serif">
    <text x="472" y="196" fill="#C34F35" font-size="18" font-weight="700" letter-spacing="4">OPEN-SOURCE TRIP PLANNING</text>
    <text x="468" y="282" fill="#234B40" font-size="76" font-weight="700" letter-spacing="-3">SF Bay Area</text>
    <text x="468" y="364" fill="#234B40" font-size="76" font-weight="700" letter-spacing="-3">Transit MCP</text>
    <text x="474" y="429" fill="#4D6258" font-size="29">From here to there, with Claude.</text>
  </g>
</svg>`;
await writeFile(new URL("social-preview.svg", assets), social);
await writeFile(new URL("social-preview.png", assets), render(social, 1280));
console.log("Built SVG/PNG branding and 1280 × 640 repository social preview.");
