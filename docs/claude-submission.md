# Claude connector submission draft

**Prepared October 30, 2026. Not submitted.** Publisher and legal operator: **Reindex Ventures LLC**. Creator: **Lucas Czekaj**.

## Launch requirements

- **Transitous policy:** Its [published policy](https://transitous.org/api/) permits qualifying light, open-source, noncommercial use without a separate prior-approval process. It asks for coordination when significant resource use is expected, including many users, automated requests, or more than 720 routing requests per 24 hours. A directory listing is not named as a separate approval trigger. Assess the intended use and expected traffic against those conditions; the policy does not define LLC ownership alone as commercial use. Current per-instance limits are not a global quota. Use the [unsent coordination draft](transitous-coordination-draft.md) if coordination or clarification is needed.
- **Endpoint:** The production configuration targets `https://mcp.riv.lc/sf-transit/mcp`. The [company deployment guide](cloudflare.md#company-production-deployment) uses `wrangler.jsonc` with `--env production`. Complete an authorized deployment and endpoint check before submitting; local validation does not establish that the endpoint is live. The GitHub repository remains `czekaj/sf-transit-mcp`.
- **Public identity and links:** Approved company website: `https://reindexventures.com`. Publish the privacy/support information and verify those public links through an authorized check.
- **Evidence:** The approved Claude screenshot shows one Ferry Building → Baker Beach trip. It does not show that every tool or the latest release passed. Complete an approved check in Claude and MCP Inspector before confirming the portal's testing statement.

## Portal-ready fields

Use [Submit new → MCP connector](https://claude.ai/directory/manage) from the organization intended to own the listing. Confirm paid-plan and role eligibility. [Publishing guidance](https://claude.com/docs/directory/publish)

### 1. Connection

| Field                              | Value                                |
| ---------------------------------- | ------------------------------------ |
| Submission                         | Remote MCP connector with an MCP App |
| URL choice                         | One universal URL                    |
| Approved target, pending migration | `https://mcp.riv.lc/sf-transit/mcp`  |
| Authentication                     | None                                 |

Use the approved target only after migration and verification; do not submit an unverified URL.

### 2. Tools

This inventory reflects local source, not new live verification. The portal imports the server's current metadata. Each tool exposes the same human-readable name in both `title` and `annotations.title` for MCP clients and the directory validator.

| Tool               | Title                       | readOnlyHint | destructiveHint | idempotentHint | openWorldHint |
| ------------------ | --------------------------- | ------------ | --------------- | -------------- | ------------- |
| `search_places`    | Find Bay Area places        | true         | false           | true           | true          |
| `plan_trip`        | Plan a Bay Area trip        | true         | false           | true           | true          |
| `get_service_info` | Transit service information | true         | false           | true           | false         |

Place search returns matching places to choose from. Trip planning returns complete journeys plus route cards. Service information returns time, sources, and limitations without contacting Transitous. There are no write tools. Import the current `ui://` resource URI, which includes a version identifier, rather than pasting one from an older build.

### 3. Listing

**Name:** SF Bay Area Transit MCP

**Slug:** `sf-bay-area-transit`

**Author name:** Reindex Ventures LLC

**Author URL:** `https://reindexventures.com`

**One-liner — 155 characters; maximum 200:**

> Plan San Francisco and Bay Area trips with your AI agent. Compare buses, trains, ferries, walking, and cycling, with departure times and total travel time.

**Description — 1130 characters including paragraph breaks; maximum 2,000:**

Plan trips across San Francisco and the Bay Area with your AI agent. Search for an address, landmark, or transit stop, then compare routes showing which services to take, where to walk, where to change vehicles, and when to leave and arrive.

Coverage includes BART, Muni, Caltrain, AC Transit, VTA, SamTrans, Golden Gate Transit and Ferry, and SF Bay Ferry, depending on available routing data. Set a departure time or arrival deadline, limit transfers, or compare transit with walking or riding your own bicycle.

In AI apps that support MCP Apps, compare routes in an interactive display and open each route's instructions. Other apps receive the trip information as text. Times come from schedules or live estimates where available. Fares, tickets, service alerts, bike-share availability, and turn-by-turn walking directions are not included.

Free and open source, with no API keys or authentication. Routing and place search use Transitous for light, noncommercial use. Search text, trip coordinates, and travel preferences are sent to that service.

Created by Lucas Czekaj. Operated and published by Reindex Ventures LLC.

| Field                                     | Value                                                                                                                                           |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Categories                                | Suggested concepts: Travel / Transportation; Maps / Local information. Exact portal choices are unverified; choose the closest offered options. |
| Documentation, after deployment           | `https://mcp.riv.lc/sf-transit`                                                                                                                 |
| Privacy URL, after deployment             | `https://mcp.riv.lc/sf-transit/privacy`                                                                                                         |
| Public support / privacy / security email | `contact@reindexventures.com`                                                                                                                   |
| Support page, after publication           | `https://github.com/czekaj/sf-transit-mcp/blob/main/SUPPORT.md`                                                                                 |
| Icon                                      | [assets/icon-512.png](../assets/icon-512.png)                                                                                                   |
| Hosted icon URL, after deployment         | `https://mcp.riv.lc/sf-transit/icon.png`                                                                                                        |
| Proposed slug                             | `sf-bay-area-transit` — owner decision; availability unverified, not reserved                                                                   |

The slug becomes permanent after publication. [Listing URL guidance](https://claude.com/docs/connectors/building/after-publishing#directory-listing-urls-are-permanent)

For a portal field requesting an image URL, use the hosted icon URL after deploying and checking it. It returns the same 512 × 512 PNG as the local asset. The connector preview's generic globe is separate from the directory listing icon; the server also supplies an embedded PNG in MCP metadata.

The Documentation URL is the HTML user guide and IT-admin review page, covering connection setup, tools and permissions, provider data sharing, operator identity, support, and limitations. The GitHub README remains the source for installation, development, and self-hosting instructions.

### 4. Use cases

**Primary:** Plan trips between Bay Area places. Compare where to walk, which vehicles to take, where to switch vehicles, and when to leave and arrive.

**Additional:** Set an arrival deadline or compare transit with a direct walk or personal-bicycle trip. Request wheelchair routing for streets and paths; results state when vehicle accessibility is unknown.

**Setup:** Connect to the universal HTTPS endpoint. No service account, provider key, OAuth client, or credentials.

**Access:** Read-only; no bookings, ticket purchases, payments, or account changes.

### 5. Company

| Field                                         | Value                         |
| --------------------------------------------- | ----------------------------- |
| Company / legal operator / publisher          | Reindex Ventures LLC          |
| Company website                               | `https://reindexventures.com` |
| Creator / primary review contact              | Lucas Czekaj                  |
| Review / support / privacy / security contact | `contact@reindexventures.com` |

The endpoint's public documentation should identify its relationship to Reindex Ventures LLC.

### 6. Authentication

**Requirement:** None. **Method:** `none`.

**Explanation:** “This connector reads public transport and map information. It does not access a user's third-party account. The endpoint accepts MCP requests without credentials.”

Claude explicitly supports connectors without authentication. [Authentication guidance](https://claude.com/docs/connectors/building/authentication#supported-authentication-types)

### 7. Data handling

**API ownership:** Select **Calls a third-party API we don't control**. Transitous operates the underlying routing and place-search API. Reindex Ventures LLC operates the MCP server, but has no separate partnership agreement with Transitous. Its public policy permits qualifying light, open-source, noncommercial use. Explain that permission basis in Additional notes. The portal warns that third-party API use typically blocks listing; acceptance is not confirmed by the provider's permission to use its API.

**Personal health data:** Select **Other / depends on configuration** and explain the wheelchair-routing option. When requested by the user, the server processes and forwards that preference to Transitous; it can indicate a disability. The server does not access medical records or healthcare accounts, and does not save trip history.

**Sponsored or promoted content:** Select **No**.

**API-use explanation:** “The connector uses Transitous's public MOTIS API for trip planning and place search under its published policy for light, open-source, noncommercial use. Requests identify the application, and results credit the data sources. We have no separate partnership or special capacity agreement. We must coordinate with Transitous if expected usage meets its published criteria for significant resource use.”

**Information sent:** Place-search text, selected coordinates, time, and travel preferences needed for the requested journey. Starting addresses can be personal data; a wheelchair preference can reveal sensitive information. The connector does not access conversation history or save a home profile.

**Privacy policy:** Use the hosted [privacy policy](https://mcp.riv.lc/sf-transit/privacy) after deployment. Its content is generated from [PRIVACY.md](../PRIVACY.md). It explains who operates the service, what Cloudflare processes, what Transitous receives and retains, and how to contact the operator. Do not answer “no data transmitted.”

**Allowed link URIs:** Leave the optional portal allowlist empty. Current app links belong to Transitous, OpenStreetMap, and 511. Only owned origins may be declared there; third-party links can still open with host confirmation. [Submission requirements](https://claude.com/docs/connectors/building/submission)

### 8. Test & launch

**Reviewer access instructions:**

“Connect to `https://mcp.riv.lc/sf-transit/mcp` with authentication set to None. No account, credentials, or seeded account data are required. Use public places rather than a home address. Returned journeys depend on the current timetable and provider availability.”

| Reviewer prompt                                                                                         | Expected check                                              |
| ------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------- |
| “What time is it in San Francisco, and what data does this connector use?”                              | `get_service_info`: time zone, sources, limitations.        |
| “Find the Ferry Building and Baker Beach in San Francisco. Show candidates if a place is ambiguous.”    | `search_places`: candidate labels and coordinates.          |
| “Plan a transit trip from the Ferry Building to Baker Beach, leaving now. Include walks and transfers.” | `plan_trip`: complete text and route cards where supported. |
| “Plan the same trip arriving by 4 PM tomorrow with at most one transfer.”                               | Arrival deadline, Pacific time, transfer constraint.        |
| “Compare that trip with a direct walk or a personal bicycle trip.”                                      | Explicit mode comparison.                                   |

Selecting a route and opening its details use the results already returned. Only clicking Refresh should request new routes. Check that results distinguish scheduled times from estimates and state when accessibility is unknown.

**Testing confirmation:** Pending an approved check of every tool in Claude and MCP Inspector. Do not mark it complete based on the single supplied capture. [Review criteria](https://claude.com/docs/connectors/building/review-criteria)

### 9. Compliance

Review the actual portal acknowledgments before accepting them. Current scope: public-data read tools; no financial transfers, runtime AI-media generation, or conversation-history collection. Project artwork was AI-generated with its prompt recorded; answer artwork disclosures accurately.

Compliance with Transitous's published use conditions is required. A separate provider approval is not a blanket prerequisite for qualifying light use or directory submission. The owner must authorize accepting directory terms on behalf of Reindex Ventures LLC.

### 10. Review and submit

Use the verified migrated endpoint, attach approved images, and record the checked release and evidence. Review portal warnings before the owner submits. This draft claims no directory acceptance or Verified badge.

## Screenshot files

The portal requires 3–5 PNGs, at least 1,000 pixels wide, cropped to the app response without the prompt; supply each prompt separately. [Screenshot specifications](https://claude.com/docs/connectors/building/submission#carousel-screenshots-for-mcp-apps)

Three owner-approved lossless crops of the existing real Claude capture are prepared. Each is 1,464 pixels wide. The image files contain only the captured app response; the prompt is supplied separately below. [Provenance and crop rectangles](../assets/claude-submission/provenance.json) record the source hash and output hashes.

| Prepared output                                                              | Crop                                  |
| ---------------------------------------------------------------------------- | ------------------------------------- |
| [01-route-options.png](../assets/claude-submission/01-route-options.png)     | Route alternatives and timing summary |
| [02-journey-details.png](../assets/claude-submission/02-journey-details.png) | Detailed trip instructions            |
| [03-full-widget.png](../assets/claude-submission/03-full-widget.png)         | Full app area present in the capture  |

**Exact paired prompt for each:** “How do I get from the Ferry Building to Baker Beach, leaving now?”

Verify image widths and readability. Three crops of one trip do not prove three independent tests. Use additional approved captures if needed; previews with made-up data are not evidence of live results in Claude.

Recreate these exports in a development environment with Pillow installed, then format their provenance file:

```sh
python3 scripts/prepare-claude-screenshots.py
npx prettier --write assets/claude-submission/provenance.json
```

Pillow is only used for preparing screenshots; it is not a runtime dependency of the MCP.

## Sources

Official public documentation consulted October 30, 2026: [submission](https://claude.com/docs/connectors/building/submission), [review criteria](https://claude.com/docs/connectors/building/review-criteria), [publishing](https://claude.com/docs/directory/publish), [authentication](https://claude.com/docs/connectors/building/authentication), and [Transitous policy](https://transitous.org/api/).
