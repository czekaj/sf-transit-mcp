# Privacy policy

Last updated: October 30, 2026

SF Bay Area Transit MCP is operated and published by **[Reindex Ventures LLC](https://reindexventures.com)** and was created by **Lucas Czekaj**. This notice covers this project's software and the hosted service operated by Reindex Ventures LLC. Other people who run a copy may use different infrastructure and policies.

## What a trip request contains

The tools process the place names or addresses you search for, origin and destination coordinates, requested travel times, transport modes, and route preferences such as wheelchair access. A location or accessibility preference can be personal information.

The server returns candidate places and itineraries to your MCP client, such as Claude. Trip results also include the validated original trip request so the itinerary widget can refresh it. The client receives these inputs and results and handles its conversation history under its own policies. A home address can remain in your client's context, but an address used in a place search, or its coordinates used to plan a trip, is sent onward as described below.

## Hosted service and local use

- **Hosted on Cloudflare Workers:** Tool requests pass through Cloudflare and the operator's Worker before the Worker contacts Transitous. Cloudflare processes request contents and network metadata, such as the connecting IP address and traffic information. When your MCP client connects through its own backend, that connection may come from the client's infrastructure.
- **Local stdio:** The server runs on your machine and contacts Transitous from your network. Trip requests do not pass through the operator's hosted Worker. Your MCP client still receives the inputs and results; local use is not offline use.

Cloudflare describes its handling of service traffic and network information in its [privacy policy](https://www.cloudflare.com/privacypolicy/).

## Transitous

Place searches send search text to Transitous. Trip planning sends coordinates, travel times, transport modes, and route options, including the wheelchair routing choice. These are HTTPS requests with those values in the request URL's query string. The application also sends a User-Agent identifying the project and version.

[Transitous's privacy policy](https://transitous.org/privacy/) says it logs the connecting IP address, request time, requested URL, and User-Agent for debugging and abuse prevention, and keeps those logs for up to two days. Its policy explains how to request deletion. In hosted mode, the provider connection originates from the Worker; in local mode, it originates from your machine's network.

## Storage and logs

The application has no database, saved user profiles, or saved home addresses. Request and itinerary data are processed in memory. The widget holds the displayed itinerary and request while it is in use; it makes another tool request when you select Refresh. The application also keeps numeric request timestamps in process memory for its usage budget, without trip details or user identifiers.

The application does not add advertising trackers, analytics SDKs, or tracking cookies, and its code does not log trip inputs or results. This does not describe retention by your MCP client or infrastructure providers. The repository's Cloudflare configuration disables invocation logs and enables sampled observability. We have not verified a retention period for Cloudflare edge, security, or diagnostic records; this service does not promise zero infrastructure logging.

Page redirects to the operator's website and the project repository add the fixed referral label `utm_source=sf-transit-mcp`. This value identifies the project, not an individual visitor. Incoming request query strings are not copied into those redirects.

## Contact and requests

For privacy questions or requests concerning data handled by the operator, contact **[contact@reindexventures.com](mailto:contact@reindexventures.com)**. We can address data under our control; your MCP client and Transitous handle their own records under their respective policies.

General support is available through [GitHub issues](https://github.com/czekaj/sf-transit-mcp/issues). Issues are public: use the privacy contact for personal trip details or privacy requests. Contact messages contain whatever information you provide and are used to respond to your request.
