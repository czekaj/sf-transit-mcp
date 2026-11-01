# Transitous provider

This project uses [Transitous](https://transitous.org/) for place search, Bay Area trip planning, and stop departures. Transitous provides a free public service without an account, API key, or payment setup. Running the MCP locally does not require hosting a routing engine or downloading transit feeds. Cloud hosting has its own limits and terms.

## API contract

The default API address is `https://api.transitous.org`. The client uses:

| Operation                         | Endpoint            | Input                                                               |
| --------------------------------- | ------------------- | ------------------------------------------------------------------- |
| Find addresses, places, and stops | `/api/v1/geocode`   | Search text, with a San Francisco location bias                     |
| Get stop departures               | `/api/v6/stoptimes` | Selected stop ID, departure time, and result limit                  |
| Plan a journey                    | `/api/v6/plan`      | Selected origin and destination coordinates, travel time, and modes |

Requests and responses follow the [MOTIS v2.10.2 OpenAPI definition](https://raw.githubusercontent.com/motis-project/motis/refs/tags/v2.10.2/openapi.yaml), linked by Transitous's API documentation. Coordinate pairs use latitude,longitude order. Place search returns matching places; select the intended place before requesting a trip. The client filters results to the Bay Area.

Results keep scheduled departure and arrival times separate from provider estimates. The `realTime` field indicates that the provider has live information for that part of the trip. It does not say how old that information is. The result's timestamp records when the MCP produced the result, not when an agency updated its estimate. Walking and cycling times are estimates.

For `get_stop_departures`, supply `stop: { stopId, latitude, longitude, label? }`. Use the ID and coordinates from a `search_places` candidate whose type is `STOP` (`candidate.id` becomes `stopId`), or a transit boarding stop in `plan_trip` (`leg.from.stopId`). Do not invent stop IDs. `departureTime` is optional; when supplied, it must include an explicit UTC offset. `limit` accepts 1–20 and defaults to 10.

Departures preserve scheduled and predicted times, cancellation and boarding status, and route, destination, agency, and platform details when supplied. Times display in Pacific time. The retrieval time does not establish prediction freshness. Each requested board or board refresh makes one provider request. Filtering loaded routes and destinations makes no request.

## Regional coverage

Transitous's [published sources](https://transitous.org/sources/) list the regional 511 feed, including Muni/SFMTA, BART, AC Transit, Caltrain, VTA, SamTrans, Golden Gate Transit and Ferry, SF Bay Ferry, and other Bay Area operators. The source list also identifies a regional feed for live estimates. Its [California source registry](https://github.com/public-transport/transitous/blob/main/feeds/us-ca.json) documents the schedule and TripUpdates inputs used for those estimates. Transitous obtains these feeds; this MCP does not need a 511 token.

Coverage depends on the schedules and estimates currently available from the provider. A listed agency does not guarantee live estimates for every trip. Transitous uses OpenStreetMap (OSM) data to find addresses and plan routes along streets. Address and place matches depend on that map data. If no places or routes are found, report that result.

## Use of the shared service

The [Transitous usage policy](https://transitous.org/api/) permits light use by open-source, noncommercial applications. Publish the code under an appropriate open-source license; light prototype testing before publication is permitted. Every request must identify the application name, version, and a contact URL or email through `User-Agent`.

Qualifying light use does not need separate prior approval. Directory publication is not listed as a separate approval trigger. The significant-resource coordination conditions below still apply; a directory listing does not waive them.

This MCP makes requests when a person searches for places, asks for a trip or stop departures, opens a board at a boarding step, or selects Refresh. It does not repeatedly check for updates, collect routes in bulk, or retry failed requests automatically. A trip comparison can send one request per selected travel mode.

Coordinate with Transitous before operating with many users, significant automated requests, or more than 720 routing requests in 24 hours. That number is a coordination threshold, not a guaranteed allowance. Commercial use is excluded by the policy. Transitous is run by volunteers on a best-effort basis, offers no service guarantee, and may withdraw access. The public default must not be replaced with Transitous staging or internal server addresses.

## Privacy

Search text, trip coordinates, and requested stop IDs and departure times are sent to Transitous. Its [privacy policy](https://transitous.org/privacy/) states that logs include the connecting IP address, time, requested URL, and User-Agent. URLs can contain address searches, start and destination coordinates, and travel times. Transitous retains these logs for up to two days. Do not put a home address or other private trip into repository examples, test data, or application logs.

## Attribution and data licenses

Show these credits with returned results and keep them visible when building another interface around this MCP:

- Routing and transit sources: [Transitous data sources](https://transitous.org/sources/).
- Map data: [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright), available under ODbL.
- Regional transit data: [data provided by 511.org](https://511.org/).

The repository's software license covers its code. It does not replace the separate licenses of transit feeds, OSM data, or provider results. Transitous's source page links the relevant data conditions. The [511 Data Disseminator Agreement](https://511.org/sites/default/files/2026-04/511_Data_Agreement_Final_2026.pdf) requires linked source acknowledgment near the data and limits redistribution and sublicensing. Do not bundle third-party feed archives under the code license or use agency logos without the required permission.

## Verification

Default tests use made-up local examples and simulated HTTP responses. They do not contact Transitous, 511, or any other live service. Repeated tests therefore do not use shared-service capacity or depend on current timetables.

A manual live check should use public landmarks rather than a home address and a small, bounded number of requests. Keep it separate from automated tests and background monitoring. Passing local tests shows that the client handles the tested requests and responses; it does not establish current live route availability.
