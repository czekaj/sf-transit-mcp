# Transitous coordination message — unsent

**For Lucas Czekaj and Reindex Ventures LLC to review. Do not send yet.**

First establish whether the planned activity fits [Transitous's noncommercial policy](https://transitous.org/api/). A free price and MIT license do not establish that. Its policy excludes commercial use and asks excluded cases not to contact maintainers. If the owner determines this is excluded business use, change the provider plan instead of sending this draft.

For an eligible noncommercial project, the published channel is [Transitous on Matrix](https://matrix.to/#/#transitous:matrix.spline.de). No contact has been made.

## Draft message

Hello Transitous maintainers,

I'm Lucas Czekaj, creator of SF Bay Area Transit MCP, an MIT-licensed connector for user-requested San Francisco and Bay Area journeys in Claude. Reindex Ventures LLC is the proposed legal operator and publisher.

Source: https://github.com/czekaj/sf-transit-mcp

We are preparing a Claude Connectors Directory listing. Before publishing, we want to confirm the use fits your noncommercial policy and coordinate capacity.

The connector uses `/api/v1/geocode` and `/api/v6/plan`. A transit search makes one routing request. Explicit walking/bicycle comparisons use one request per selected mode, up to three. Selection and details are local; refresh is user-triggered. There is no polling, automatic retry, or background querying.

Requests carry the project name/version/contact in User-Agent. Results credit Transitous and link to your sources, with OpenStreetMap and Bay Area data attribution.

Current courtesy limits are 20 upstream requests per rolling minute and 600 per rolling day per running instance. They are not a global quota. Directory traffic is unknown.

Business context: The current project is free to use and MIT-licensed, and its code has no advertising or paid-placement features. I intend to include it in my professional portfolio for visibility as its creator. Reindex Ventures LLC is the legal operator and publisher. We have not concluded that this business context is permitted under your noncommercial policy; that is part of what we need to clarify before a directory launch.

Does this arrangement fit your permitted noncommercial use? If so, what aggregate request limits and launch approach would you want before a directory listing? Publication can remain pending while agreeing on an approach.

Planned endpoint, pending migration: https://mcp.riv.lc/sf-transit/mcp

Thanks,
Lucas Czekaj
Reindex Ventures LLC
contact@reindexventures.com
https://reindexventures.com

## Evidence after an authorized exchange

Keep the actual maintainer response and agreed scope with the submission evidence. Until it exists, do not claim Transitous approved directory traffic or describe Transitous as a partner.
