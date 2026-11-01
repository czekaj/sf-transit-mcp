# Live arrival and departure data research

Checked October 31, 2026. This is a research record, not a claim that a stop-arrivals tool has shipped.

## Recommendation

Use the existing Transitous integration for the first stop-arrivals feature. Its documented `/api/v6/stoptimes` endpoint returns stop events with scheduled times, predicted times, agency and route information, and a `realTime` flag. It needs no API key. An approved live check confirmed predictions for both BART and Muni.

Keep BART's direct GTFS-Realtime feed as an optional alternative. It is explicitly available without registration. Direct 511 access would require a registered key, so it is not needed for the first implementation.

Sources: [MOTIS OpenAPI v2.10.2](https://github.com/motis-project/motis/blob/v2.10.2/openapi.yaml), [Transitous API policy](https://transitous.org/api/), [BART GTFS-Realtime](https://www.bart.gov/schedules/developers/gtfs-realtime).

## What was actually verified

The owner approved four read-only Transitous requests: two stop searches and two departure-board requests. They used the project's identifying User-Agent, public stops, no credentials, no retries, and no automatic refresh. No other live feeds were queried for this research.

The departure-board responses were received on **October 31, 2026, at approximately 4:57 PM Pacific (PDT)**. All four requests returned HTTP 200.

| Stop                     | Transitous stop ID                      | Events returned | Marked `realTime: true` | Scheduled only |
| ------------------------ | --------------------------------------- | --------------: | ----------------------: | -------------: |
| Embarcadero BART         | `us-ca-SF-bayarea_mtc:embarcadero-bart` |              10 |                      10 |              0 |
| Judah St & 9th Ave, Muni | `us-ca-SFMTA_15193`                     |              10 |                       8 |              2 |

Both responses contained actual and scheduled arrival/departure fields. For example, a BART departure was predicted two minutes after its timetable departure, and a Muni N departure was predicted one minute after its timetable departure.

These are observations from two boards at one time. A live flag is not a guarantee of prediction accuracy, and neither response exposed the upstream feed's last-update timestamp. The response time records when we obtained the board, not when the agency last updated its prediction. No live checks were made for the other agencies below.

## Sources and access requirements

| Source                           | Data available                                                                                    | Access                                                             | Assessment for this project                                                                                                |
| -------------------------------- | ------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Transitous / MOTIS               | Stop arrivals/departures, schedules, predictions where available, cancellations and route details | No key; identifying User-Agent and attribution required            | Best first integration; two agencies verified live above                                                                   |
| BART GTFS-Realtime               | Trip updates and alerts                                                                           | No registration or key                                             | Strong direct alternative; needs matching static GTFS and protobuf decoding                                                |
| BART legacy ETD API              | Station departures, minutes until departure, destinations, platforms and train details            | BART publishes a shared public key; a personal key is not required | Simple JSON alternative, but shared-key access is different from a genuinely keyless API                                   |
| 511 StopMonitoring               | Expected arrivals/departures at a stop, JSON/XML                                                  | Free registered API key; default 60 requests per hour per key      | Useful direct regional source, but fails a strict no-maintained-key requirement                                            |
| 511 GTFS-Realtime                | Regional or agency trip updates, vehicle positions and alerts                                     | Registered API key                                                 | Good upstream feed source; unnecessary for our first on-demand board because Transitous already processes regional updates |
| AC Transit direct APIs           | Stop predictions, trip updates, positions and alerts                                              | Registered token                                                   | No supported anonymous direct API established                                                                              |
| Umo IQ / NextBus public XML feed | Stop predictions, route configuration and vehicle locations                                       | Documented syntax has no key parameter                             | Candidate for Muni; current compatibility and applicable reuse permission need confirmation                                |
| Marin Transit / Swiftly          | Trip updates and vehicle positions                                                                | Access key explicitly required                                     | Agency identifier is not an authentication key                                                                             |

Primary references: [511 API catalog](https://511.org/open-data/transit), [511 FAQ](https://511.org/about/faq), [BART legacy access](https://www.bart.gov/schedules/developers/api), [BART ETD schema](https://api.bart.gov/docs/etd/etd.aspx), [AC Transit API help](https://api.actransit.org/transit/Help), [Umo XML specification](https://www.nextbus.com/xmlFeedDocs/NextBusXMLFeed.pdf), [Marin Transit developer resources](https://marintransit.gov/developers).

### Transitous coverage and limitations

The [California source registry](https://github.com/public-transport/transitous/blob/main/feeds/us-ca.json) configures regional 511 TripUpdates with `agency=RG`, alongside its schedule sources. Transitous holds the credentials for those upstream feeds; our MCP does not acquire or embed them. Registry entries alone do not prove that each agency has working predictions at a given moment.

Transitous documents polling realtime sources once per minute. It consumes prediction updates and alerts; vehicle-position feeds are not its substitute for predictions. The service is best effort and permits qualifying light, open-source, noncommercial use. Coordinate significant usage under its policy. The policy's 720-request example specifically names expensive routing operations; it is not a documented universal departure-board allowance.

Sources: [Transitous realtime processing](https://transitous.org/doc/#realtime-data), [usage policy](https://transitous.org/api/).

### BART direct feeds

BART's developer page explicitly permits GTFS-Realtime without registration. It documents two exceptions: Oakland Airport Connector has no real-time arrivals, and Antioch/Pittsburg Center realtime trip IDs do not match static schedule trip IDs. Those exceptions need explicit treatment in a direct adapter.

An April 24, 2025 [migration notice](https://api.bart.gov/docs/overview/notices.aspx) describes a parallel platform-aware feed. Documentation alone did not establish which matching static/realtime combination should be selected today. Do not combine feeds from different generations without validation.

The legacy ETD API offers simpler JSON and an officially published shared key that may change. BART recommends GTFS/GTFS-Realtime as its supported standards. Its `Leaving` value means less than a minute before departure, not an exact timestamp or a zero-second arrival prediction. [BART glossary](https://api.bart.gov/docs/overview/glossary.aspx).

### Umo / NextBus caution

The vendor's public XML specification is revision 1.24, dated May 18, 2021. Its [current agency help](https://retro.umoiq.com/customStopSelector/cellPhoneHelp.jsp?cssFile=XXXX) names San Francisco Muni CIS as `sfmta-cis`, while older examples use `sf-muni`.

The specification sets a 10-second minimum polling interval and a bandwidth limit of 2 MB per 20 seconds per requesting IP. It offers no external support without a written contract and allows access to be limited or terminated. Its customer-oriented license language does not establish an unconditional open-data grant for this project. Anonymous technical access is not enough to settle reuse terms.

No Umo endpoint was called, no embedded app credentials were extracted, and no vendor-authored JSON contract was established. Prefer the already-working Transitous route over depending on this uncertain alternative.

## Agency coverage beyond the two live checks

“Feed documented” below means evidence of a realtime feed, not proof of current availability through our MCP. “No direct keyless source found” does not exclude keyless access through Transitous.

| Agency                    | Evidence found                                                                                                                                                                                                                            | Direct access and remaining uncertainty                                                                                                                             |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Muni / SFMTA              | Approved Transitous check returned predictions; [September 2026 Caltrans report](https://reports.dds.dot.ca.gov/gtfs_schedule/2026/09/282/index.html) records TripUpdates, positions and alerts                                           | Keyless via Transitous verified; direct 511 uses a key; Umo remains a candidate                                                                                     |
| BART                      | Approved Transitous check returned predictions; agency documents direct GTFS-Realtime                                                                                                                                                     | Keyless aggregate and direct options; coverage exceptions above                                                                                                     |
| Caltrain                  | [Agency developer resources](https://www.caltrain.com/developer-resources) and [April 2026 Caltrans report](https://reports.dds.dot.ca.gov/gtfs_schedule/2026/04/246/index.html) identify realtime data                                   | Documented regional option uses 511 key; live Transitous board not checked                                                                                          |
| SamTrans                  | [Official developer page](https://www.samtrans.com/developer) directs developers to 511; [September 2026 report](https://reports.dds.dot.ca.gov/gtfs_schedule/2026/09/290/index.html) records updates, positions and alerts               | No supported direct keyless API found; Transitous board not checked                                                                                                 |
| VTA bus and light rail    | [September 2026 report](https://reports.dds.dot.ca.gov/gtfs_schedule/2026/09/294/index.html) records updates, positions and alerts; [agency explanation](https://www.vta.gov/faq/what-real-time) distinguishes predictions from schedules | No supported direct keyless arrival API found; Transitous board not checked                                                                                         |
| AC Transit                | Agency's [API documentation](https://api.actransit.org/transit/Help) describes predictions and realtime feeds                                                                                                                             | Direct API token required; Transitous board not checked                                                                                                             |
| Golden Gate Transit buses | [Regional feed supplier's 2021 documentation](https://www.interline.io/blog/mtc-regional-gtfs-realtime-feed/) lists realtime feeds                                                                                                        | Historical feed evidence; current board and freshness not checked                                                                                                   |
| Golden Gate Ferry         | A [static schedule feed](https://www.transit.land/data/feeds/f-9q8z-goldengateferry) is documented                                                                                                                                        | No arrival-prediction feed confirmed in this research; do not infer live data from schedules                                                                        |
| SF Bay Ferry / WETA       | [February 2026 Caltrans report](https://reports.dds.dot.ca.gov/gtfs_schedule/2026/02/280/index.html) lists trip updates, positions and alerts                                                                                             | Regional keyed source documented; Transitous board not checked                                                                                                      |
| SMART                     | [Caltrans analysis](https://analysis.dds.dot.ca.gov/rt_operator_metrics/name-bay-area-511-sonoma-marin-area-rail-transit-t/operator-report-name-bay-area-511-sonoma-marin-are/index.html) identifies regional trip updates                | Regional keyed source documented; Transitous board not checked                                                                                                      |
| Marin Transit             | [Official developer page](https://marintransit.gov/developers) publishes realtime developer information                                                                                                                                   | Swiftly key required for predictions and positions                                                                                                                  |
| Tri Delta Transit         | [2024 agency procurement addendum](https://trideltatransit.com/wp-content/uploads/2024/11/Addendum2_2024-04-Microtransit-Software.pdf) publishes Connexionz update, position and alert URLs without key parameters                        | Promising direct keyless candidate; current health and reuse conditions not verified                                                                                |
| SolTrans                  | [Agency developer page](https://www.soltrans.org/resources/developer-resources) describes realtime feeds                                                                                                                                  | Position/alert links are published; the TripUpdates heading links to specification documentation rather than a usable feed, so prediction access needs confirmation |

The September SF, SamTrans and VTA reports record the presence of realtime feeds on September 4 and 18. These archived checks are evidence of recent published data, not a guarantee about October 31. Message-age charts measure feed age, not arrival-prediction accuracy. The SF report also includes Golden Gate Park Shuttle and should not be treated as an isolated Muni fleet measurement.

## What the feature should show

Add an on-demand stop-arrivals tool using stop IDs returned by the existing place search. A useful response would identify the stop, agency, route, destination, scheduled time, predicted time when available, platform when supplied, and cancellation status.

Requirements for an honest display:

- Label each event as a live estimate or scheduled time. Mixed boards are normal, as the Muni check demonstrated.
- Never treat missing realtime data as evidence that a vehicle is on time.
- Keep the time we fetched results separate from the agency's update time. If the latter is missing, say it is unavailable.
- Use Pacific time and distinguish arrivals from departures where the source supplies different values.
- Preserve cancellations and skipped-stop information instead of displaying them as ordinary boardable services.
- Do not promise platform information when it is absent; neither checked sample supplied it.
- Request data when the user asks or selects Refresh. Do not introduce continuous polling without reviewing the provider's usage conditions.
- Keep output bounded and filter stop searches to the Bay Area. The global provider can return similarly named stops elsewhere.

Vehicle coordinates alone are not stop-arrival predictions. [GTFS TripUpdates](https://gtfs.org/documentation/realtime/feed-entities/trip-updates/) carry the relevant timing updates. GTFS freshness recommendations are guidance, not an agency performance guarantee. [Realtime best practices](https://gtfs.org/documentation/realtime/realtime-best-practices/).

## Attribution and next validation

Retain Transitous, 511 and OpenStreetMap credits. Direct BART or AC Transit adapters must follow their separate agency terms; an open-source code license does not replace data conditions. References: [BART license](https://www.bart.gov/schedules/developers/developer-license-agreement), [AC Transit terms](https://www.actransit.org/data-terms-and-conditions/), [511 2026 agreement](https://511.org/sites/default/files/2026-04/511_Data_Agreement_Final_2026.pdf).

Before claiming additional agencies as live, conduct a separately approved, bounded check of representative stops and record the per-event realtime flags and available timestamps. Automated tests should use fixtures and never query live providers.
