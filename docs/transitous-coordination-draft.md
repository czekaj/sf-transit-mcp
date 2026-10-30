# Transitous capacity coordination draft — unsent

**For Lucas Czekaj and Reindex Ventures LLC to review. Do not send yet.**

Transitous's [published policy](https://transitous.org/api/) already permits qualifying light, open-source, noncommercial use. It does not require every project to obtain separate prior approval. Use this draft when significant resource use is expected, or a genuine policy question needs clarification. A directory listing is not itself named as an approval trigger.

Its policy asks for coordination for many users, automated requests, or more than 720 routing requests per 24 hours. Commercial use is excluded; this draft is not a request to bypass that exclusion. The policy does not state that LLC ownership by itself makes a project commercial.

For an eligible noncommercial project, the published channel is [Transitous on Matrix](https://matrix.to/#/#transitous:matrix.spline.de). No contact has been made.

## Draft message

Hello Transitous maintainers,

I'm Lucas Czekaj, creator of SF Bay Area Transit MCP, an MIT-licensed connector that plans San Francisco and Bay Area trips when people ask in Claude. Reindex Ventures LLC is the legal operator and publisher.

Source: https://github.com/czekaj/sf-transit-mcp

We are preparing a Claude Connectors Directory listing and are considering its potential to bring many users. We would like to coordinate capacity under your published usage policy.

The connector uses `/api/v1/geocode` and `/api/v6/plan`. A transit search makes one routing request. Requested walking or bicycle comparisons use one request per selected mode, up to three. Selecting a route or opening its details uses the results already returned. Selecting Refresh makes a new request. There are no automatic update checks, retries, or background requests.

Requests identify the project name, version, and contact in User-Agent. Results credit Transitous and link to your sources, with credits for OpenStreetMap and Bay Area data.

Current limits are 20 requests to Transitous per rolling minute and 600 per rolling day per running instance. They do not enforce a total limit across all instances. We do not yet know how much traffic a directory listing would bring.

Business context: The current project is free to use and MIT-licensed, and its code has no advertising or paid-placement features. I intend to include it in my professional portfolio for visibility as its creator. Reindex Ventures LLC is the legal operator and publisher. Your noncommercial-use condition continues to apply.

What total request limits and launch approach would fit your available capacity? Please also flag any issue with the described use under your policy. We can adjust how we make the service available and its request limits based on your guidance.

Planned endpoint, pending migration: https://mcp.riv.lc/sf-transit/mcp

Thanks,
Lucas Czekaj
Reindex Ventures LLC
contact@reindexventures.com
https://reindexventures.com

## Evidence after an authorized exchange

Keep the actual maintainer response and agreed scope with the submission evidence. Until it exists, do not claim Transitous approved directory traffic or describe Transitous as a partner.
