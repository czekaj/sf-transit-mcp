import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import { Validator } from "@cfworker/json-schema";
import { PROJECT } from "../src/project.js";

const manifestBytes = await readFile(
  process.argv[2] ?? new URL("../server.json", import.meta.url),
);
const manifest = JSON.parse(manifestBytes.toString("utf8"));
const schema = JSON.parse(
  await readFile(
    new URL("./schemas/mcp-server-2025-12-11.schema.json", import.meta.url),
    "utf8",
  ),
);
const result = new Validator(schema, "7", false).validate(manifest);
assert.ok(result.valid, JSON.stringify(result.errors, null, 2));

for (const key of Object.keys(manifest)) {
  assert.ok(
    Object.hasOwn(schema.definitions.ServerDetail.properties, key),
    `Unknown server.json field: ${key}`,
  );
}

const packageJson = JSON.parse(
  await readFile(new URL("../package.json", import.meta.url), "utf8"),
);
const owner = new URL(PROJECT.url).pathname.split("/")[1];
const website = PROJECT.hostedMcpUrl.replace(/\/mcp$/, "");
assert.equal(manifest.$schema, schema.$id);
assert.equal(manifest.name, `io.github.${owner}/${PROJECT.name}`);
assert.equal(manifest.title, PROJECT.title);
assert.equal(manifest.version, PROJECT.version);
assert.equal(manifest.version, packageJson.version);
assert.equal(manifest.websiteUrl, website);
assert.deepEqual(manifest.repository, {
  url: PROJECT.url,
  source: "github",
});
assert.deepEqual(manifest.remotes, [
  { type: "streamable-http", url: PROJECT.hostedMcpUrl },
]);
assert.deepEqual(manifest.icons, [
  {
    src: `${website}/icon.png`,
    mimeType: "image/png",
    sizes: ["512x512"],
  },
]);
assert.equal(manifest.packages, undefined, "This listing is remote-only.");

console.log(`Valid offline: ${manifest.name}@${manifest.version}`);
console.log(
  `Manifest SHA-256: ${createHash("sha256").update(manifestBytes).digest("hex")}`,
);
