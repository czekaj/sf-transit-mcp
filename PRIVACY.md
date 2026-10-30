# Privacy policy

Last updated: October 30, 2026

SF Bay Area Transit MCP is operated and published by **[Reindex Ventures LLC](https://reindexventures.com)** and was created by **Lucas Czekaj**. This notice covers this project's software and the hosted service operated by Reindex Ventures LLC. Other people who run a copy may use different infrastructure and policies.

## What a trip request contains

The tools process the place names or addresses you search for, the map coordinates of your starting point and destination, requested travel times, transport choices, and options such as wheelchair routing. Locations and accessibility preferences can be personal information.

The server returns matching places and trip options to your AI app. Trip results include the original request so the route display can request an updated trip when you select Refresh. The app receives the inputs and results and handles conversation history under its own policies. If you use a home address in a search, that address or its map coordinates are sent to Transitous as described below.

## Hosted service and local use

- **Use the hosted service:** Requests pass through Cloudflare, where this service runs, before it contacts Transitous. Cloudflare processes request contents and connection information, such as the connecting IP address and traffic information. If your AI app sends requests through its own servers, Cloudflare receives that connection from the app's servers.
- **Run the server on your machine:** The server contacts Transitous from your network. Trip requests do not pass through the operator's hosted service. Your AI app still receives the inputs and results. Running locally still requires an internet connection to Transitous.

Cloudflare describes its handling of service traffic and network information in its [privacy policy](https://www.cloudflare.com/privacypolicy/).

## Transitous

Place searches send search text to Transitous. Trip planning sends map coordinates, travel times, transport choices, and route options, including the wheelchair routing choice. These values are included in the HTTPS request URL. Requests also include the service name and version in the User-Agent header.

[Transitous's privacy policy](https://transitous.org/privacy/) says it logs the connecting IP address, request time, full request URL, and User-Agent to investigate errors and prevent abuse. It keeps those logs for up to two days. Its policy explains how to request deletion. Hosted requests connect from Cloudflare; local requests connect from your machine's network.

## Storage and logs

This software does not save home-address profiles, search history, or trip history. It has no database. It uses request details and results temporarily to answer each request. The route display keeps the trip and original request while it is open, and requests an updated trip when you select Refresh.

To enforce usage limits, the software temporarily keeps the times of recent requests. Those records contain no trip details or user identifiers.

The software does not add advertising trackers, analytics software, or tracking cookies. It does not write trip requests or results to application logs. Your AI app and hosting providers may keep their own records. The Cloudflare configuration disables logs for individual requests and enables sampled monitoring. We have not verified how long Cloudflare keeps network, security, or diagnostic records.

The homepage redirect to the operator's website adds the fixed referral label `utm_source=sf-transit-mcp`. This value identifies the project, not an individual visitor. Incoming request query strings are not copied into that redirect.

## Contact and requests

For privacy questions or requests concerning data handled by the operator, contact **[contact@reindexventures.com](mailto:contact@reindexventures.com)**. We can address data under our control; your MCP client and Transitous handle their own records under their respective policies.

General support is available through [GitHub issues](https://github.com/czekaj/sf-transit-mcp/issues). Issues are public: use the privacy contact for personal trip details or privacy requests. Contact messages contain whatever information you provide and are used to respond to your request.
