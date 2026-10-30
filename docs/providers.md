# Transitous provider

This project uses [Transitous](https://transitous.org/) for place search and Bay Area trip planning. Transitous provides a free public service without an account, API key, or payment setup. Running the MCP locally does not require hosting a routing engine or downloading transit feeds. Cloud hosting has its own limits and terms.

## API contract

The default origin is `https://api.transitous.org`. The client uses:

| Operation                         | Endpoint          | Input                                                               |
| --------------------------------- | ----------------- | ------------------------------------------------------------------- |
| Find addresses, places, and stops | `/api/v1/geocode` | Search text, with a San Francisco location bias                     |
| Plan a journey                    | `/api/v6/plan`    | Selected origin and destination coordinates, travel time, and modes |

The contract follows the [MOTIS v2.10.2 OpenAPI definition](https://raw.githubusercontent.com/motis-project/motis/refs/tags/v2.10.2/openapi.yaml), linked by Transitous's API documentation. Coordinate pairs use latitude,longitude order. Place search returns candidates; select the intended place before requesting a journey. The client filters results to the Bay Area.

Results preserve scheduled departure and arrival times separately from provider estimates. A leg's `realTime` flag indicates that the provider has live information for that leg. It does not establish the age of that information. A response timestamp records when the MCP produced the result, not when an agency updated its prediction. Walking and cycling durations are routing estimates.

## Regional coverage

Transitous's [published sources](https://transitous.org/sources/) list the regional 511 feed, including Muni/SFMTA, BART, AC Transit, Caltrain, VTA, SamTrans, Golden Gate Transit and Ferry, SF Bay Ferry, and other Bay Area operators. The source list also identifies a regional realtime feed. Its [California source registry](https://github.com/public-transport/transitous/blob/main/feeds/us-ca.json) documents the regional schedule and TripUpdates inputs. Transitous handles upstream access; this MCP does not need a 511 token.

Coverage depends on the provider's current imported schedules and available predictions. A listed agency does not guarantee live predictions for every trip. The source list says OSM supports geocoding and street routing. Address and place matches depend on that map data. An empty search or journey result must be reported as such.

## Use of the shared service

The [Transitous usage policy](https://transitous.org/api/) permits light use by open-source, noncommercial applications. Publish the code under an appropriate open-source license; light prototype testing before publication is permitted. Every request must identify the application name, version, and a contact URL or email through `User-Agent`.

Qualifying light use does not need separate prior approval. Directory publication is not listed as a separate approval trigger. The significant-resource coordination conditions below still apply; a directory listing does not waive them.

This MCP makes requests when a person searches for places or asks for a trip. It does not poll automatically, refresh in the background, scrape the provider, or retry requests indefinitely. A trip comparison can send one request per selected travel mode.

Coordinate with Transitous before operating with many users, significant automated requests, or more than 720 routing requests in 24 hours. That number is a coordination threshold, not a guaranteed allowance. Commercial use is excluded by the policy. Transitous is run by volunteers on a best-effort basis, offers no service guarantee, and may withdraw access. The public default must not be replaced with Transitous staging or internal server addresses.

## Privacy

Place queries and journey coordinates are sent to Transitous. Its [privacy policy](https://transitous.org/privacy/) states that logs include the requesting IP, time, requested URL, and user agent. URLs can contain address searches, start and destination coordinates, and travel times. Transitous retains these logs for up to two days. Do not put a home address or other private trip into repository examples, fixtures, or application logs.

## Attribution and data licenses

Show these credits with returned results and keep them visible when building another interface around this MCP:

- Routing and transit sources: [Transitous data sources](https://transitous.org/sources/).
- Map data: [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under ODbL.
- Regional transit data: [data provided by 511.org](https://511.org/).

The repository's software license covers its code. It does not replace the separate licenses of transit feeds, OSM data, or provider results. Transitous's source page links the relevant data conditions. The [511 Data Disseminator Agreement](https://511.org/sites/default/files/2026-04/511_Data_Agreement_Final_2026.pdf) requires linked source acknowledgment near the data and limits redistribution and sublicensing. Do not bundle third-party feed archives under the code license or use agency logos without the required permission.

## Verification

Default tests use synthetic local fixtures and injected HTTP responses. They do not contact Transitous, 511, or any other live service. This keeps repeated tests independent of shared-service capacity and current timetables.

A manual live check should use public landmarks rather than a home address and a small, bounded number of requests. Keep it separate from automated tests and background monitoring. Local fixture success verifies the client contract; it does not establish current live route availability.
