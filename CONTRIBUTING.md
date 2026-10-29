# Contributing

Changes should make real trips easier to understand and keep setup free of credentials. Open an issue describing the user-visible problem before proposing a large feature or a new provider.

## Local checks

Install with `npm ci --ignore-scripts`, then run `npm run check` and `npm run build:worker`. Neither command deploys anything. Tests must inject fixture responses and reject external network calls. Do not add live services to automated tests or CI; use synthetic public-place examples rather than anyone's home address.

The main boundaries are:

- `src/routing/`: validated inputs, the MOTIS HTTP contract, and normalized trip data.
- `src/tools.ts`: MCP tools, instructions, attribution, and safe errors.
- `src/format.ts`: readable Pacific-time journey instructions.
- `src/http.ts` and `src/stdio.ts`: HTTP and local MCP transports.
- `src/budget.ts`: per-instance courtesy limits without personal identifiers.
- `src/ui-resource.ts`: static MCP Apps resource, tool linkage, and sandbox policy.
- `widget/`: interactive route cards and timelines using the host's MCP Apps bridge.

Use `npm run preview:widget` to inspect the interface locally at `http://127.0.0.1:8798`. It uses `tests/fixtures/widget-trip.json`, explicitly fictional services, and no live transit requests. Check light and dark themes, narrow screens, route selection, details, and unsuccessful refreshes. The preview enforces a sandbox and CSP with no external connections or dynamic code evaluation. Rebuild and reload after changes.

Keep the widget self-contained. Render provider strings as text, open source links through the host, and preserve the user's original request when refreshing. Selecting a route must not query the provider. Preserve the text result for clients without MCP Apps, and show complete directions when fullscreen is unavailable. Build output in `src/generated/` and `dist/` is generated rather than committed.

Provider data is untrusted. Bound responses, keep deadlines, block redirects, and do not expose raw upstream failures. Preserve scheduled times alongside predictions. Do not infer freshness, accessibility, coverage, cancellations, or availability when the data does not establish them.

## Shared-service use

Follow [Transitous's usage policy](https://transitous.org/api/). Keep the application/version/contact identification and visible source credits. Forks serving their own users should update the project identity in `src/project.ts` and package metadata. Coordinate substantial or multiuser use with the provider. Never copy upstream API tokens from another project's feed registry.

## Pull requests

Explain the concrete behavior change and relevant verification. Include tests for routing correctness or protocol changes. Do not include credentials, private locations, real API recordings, generated transit databases, `node_modules`, or local environment files. Keep changes scoped; new features must work within the stated free, keyless setup.
