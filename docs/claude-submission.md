# Claude connector submission draft

**Prepared October 30, 2026. Not submitted.** Publisher and legal operator: **Reindex Ventures LLC**. Creator: **Lucas Czekaj**.

## Publication blockers

- **Transitous eligibility and traffic:** Its [policy](https://transitous.org/api/) permits light, open-source, noncommercial use. A free price and LLC ownership do not establish eligibility. Resolve the business context, then coordinate permitted directory traffic before publication. Many users, automated traffic, or more than 720 routing requests per 24 hours require coordination. Current per-instance limits are not a global quota. See the [unsent coordination draft](transitous-coordination-draft.md).
- **Endpoint:** The owner approved preparing `https://mcp.riv.lc/sf-transit/mcp`. Migration and a completion check still require specific production approval. The current endpoint is `https://lucas.czekaj.us/sf-transit/mcp`; the new URL is not claimed live. The separate [company configuration and cutover plan](cloudflare.md#prepared-company-deployment-on-rivlc) keep the current build target unchanged until the move is approved. The GitHub repository remains `czekaj/sf-transit-mcp`.
- **Public identity and links:** Approved company website: `https://reindexventures.com`. Publish the privacy/support information and verify those public links through an authorized check.
- **Evidence:** The approved Claude screenshot proves one Ferry Building → Baker Beach flow. It does not prove every tool or the latest release passed. Complete an approved Claude/Inspector pass before confirming the portal's testing statement.

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

This inventory reflects local source, not new live verification. The portal imports the server's current metadata.

| Tool               | Title                       | readOnlyHint | destructiveHint | idempotentHint | openWorldHint |
| ------------------ | --------------------------- | ------------ | --------------- | -------------- | ------------- |
| `search_places`    | Find Bay Area places        | true         | false           | true           | true          |
| `plan_trip`        | Plan a Bay Area journey     | true         | false           | true           | true          |
| `get_service_info` | Transit service information | true         | false           | true           | false         |

Place search returns candidates. Trip planning returns complete journeys plus route cards. Service information returns time, sources, and limitations without an upstream request. There are no write tools. Import the current content-versioned `ui://` resource URI rather than pasting an old hash.

### 3. Listing

**Name:** SF Bay Area Transit MCP

**One-liner — 154 characters; maximum 200:**

> Plan San Francisco and Bay Area transit trips with walking, transfers, schedules, and live estimates. Compare route cards and inspect each step in Claude.

**Description — 1027 characters including paragraph breaks; maximum 2,000:**

Find your way around San Francisco and the Bay Area in Claude. Search an address, landmark, or transit stop, then compare complete journeys with walking connections, route numbers, headsigns, transfers, departure times, arrival times, and travel duration.

Choose when to leave or an arrival deadline. Compare transit with a direct walk or a personal bicycle trip. Explore route cards and journey timelines in MCP Apps clients, then refresh a trip when you choose. Other clients receive readable instructions.

Routing and place search use Transitous, a community-run open-source service. Trips can combine published timetables and live predictions; prediction age is unavailable. Coverage and wheelchair information depend on source data. Fares, service alerts, bike-share availability, and turn-by-turn street navigation are not included.

Operated by Reindex Ventures LLC and created by Lucas Czekaj. This connector serves light, noncommercial trip planning. Place-search text and journey coordinates are sent to Transitous.

| Field                                     | Value                                                                                                                                           |
| ----------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| Categories                                | Suggested concepts: Travel / Transportation; Maps / Local information. Exact portal choices are unverified; choose the closest offered options. |
| Documentation                             | `https://github.com/czekaj/sf-transit-mcp#readme`                                                                                               |
| Privacy URL, after publication            | `https://github.com/czekaj/sf-transit-mcp/blob/main/PRIVACY.md`                                                                                 |
| Public support / privacy / security email | `contact@reindexventures.com`                                                                                                                   |
| Support page, after publication           | `https://github.com/czekaj/sf-transit-mcp/blob/main/SUPPORT.md`                                                                                 |
| Icon                                      | [assets/icon-512.png](../assets/icon-512.png)                                                                                                   |
| Proposed slug                             | `sf-bay-area-transit` — owner decision; availability unverified, not reserved                                                                   |

The slug becomes permanent after publication. [Listing URL guidance](https://claude.com/docs/connectors/building/after-publishing#directory-listing-urls-are-permanent)

### 4. Use cases

**Primary:** Plan journeys between Bay Area places; compare routes; inspect walking connections, transfers, and timing.

**Additional:** Arrival deadlines, direct walking/personal-bicycle comparisons, and a wheelchair street-routing profile with unknown vehicle accessibility shown honestly.

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

Claude explicitly supports authless connectors. [Authentication guidance](https://claude.com/docs/connectors/building/authentication#supported-authentication-types)

### 7. Data handling

**Underlying API:** Third party operated by Transitous; not controlled by Reindex Ventures LLC. Choose the portal's corresponding third-party option, not a partnership claim.

**Permission explanation, pending eligibility:** “The connector uses Transitous's public MOTIS routing and geocoding API under its published usage policy, conditional on open-source, noncommercial, light use and attribution. Directory traffic eligibility and capacity have not yet been confirmed.”

**Information sent:** Place-search text, selected coordinates, time, and travel preferences needed for the requested journey. Starting addresses can be personal data; a wheelchair preference can reveal sensitive information. No health-data feature, sponsored content, conversation-history access, or stored home profile is offered.

**Privacy source of truth:** The final published [PRIVACY.md](../PRIVACY.md), including operator details, Cloudflare processing, Transitous sharing/retention, and the approved contact email. Do not answer “no data transmitted.”

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

Route selection/details use returned data. Only clicking Refresh should request new routes. Inspect mixed schedule/prediction labels and unknown accessibility.

**Testing confirmation:** Pending an approved every-tool pass in Claude and MCP Inspector. Do not mark it complete based on the single supplied capture. [Review criteria](https://claude.com/docs/connectors/building/review-criteria)

### 9. Compliance

Review the actual portal acknowledgments before accepting them. Current scope: public-data read tools; no financial transfers, runtime AI-media generation, or conversation-history collection. Project artwork was AI-generated with its prompt recorded; answer artwork disclosures accurately.

API legitimacy remains conditional on provider eligibility/capacity. The owner must authorize accepting directory terms on behalf of Reindex Ventures LLC.

### 10. Review and submit

Use the verified migrated endpoint, attach approved images, and record the checked release and evidence. Review portal warnings before the owner submits. This draft claims no directory acceptance or Verified badge.

## Screenshot handoff

The portal requires 3–5 PNGs, at least 1,000 pixels wide, cropped to the app response without the prompt; supply each prompt separately. [Screenshot specifications](https://claude.com/docs/connectors/building/submission#carousel-screenshots-for-mcp-apps)

Three owner-approved lossless crops of the existing real Claude capture are prepared. Each is 1,464 pixels wide. The image files contain only the captured app response; the prompt is supplied separately below. [Provenance and crop rectangles](../assets/claude-submission/provenance.json) record the source hash and output hashes.

| Prepared output                                                              | Crop                                  |
| ---------------------------------------------------------------------------- | ------------------------------------- |
| [01-route-options.png](../assets/claude-submission/01-route-options.png)     | Route alternatives and timing summary |
| [02-journey-details.png](../assets/claude-submission/02-journey-details.png) | Expanded journey timeline             |
| [03-full-widget.png](../assets/claude-submission/03-full-widget.png)         | Full app area present in the capture  |

**Exact paired prompt for each:** “How do I get from the Ferry Building to Baker Beach, leaving now?”

Verify native crop widths and readability. Three crops of one flow do not prove three independent tests. Use additional approved captures if needed; synthetic preview data is not live Claude evidence.

Recreate these exports in a development environment with Pillow installed, then format their provenance file:

```sh
python3 scripts/prepare-claude-screenshots.py
npx prettier --write assets/claude-submission/provenance.json
```

Pillow is only used for preparing screenshots; it is not a runtime dependency of the MCP.

## Sources

Official public documentation consulted October 30, 2026: [submission](https://claude.com/docs/connectors/building/submission), [review criteria](https://claude.com/docs/connectors/building/review-criteria), [publishing](https://claude.com/docs/directory/publish), [authentication](https://claude.com/docs/connectors/building/authentication), and [Transitous policy](https://transitous.org/api/).
