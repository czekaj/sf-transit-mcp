# Security

SF Bay Area Transit MCP is operated and published by **[Reindex Ventures LLC](https://reindexventures.com)** and was created by **Lucas Czekaj**.

## Report a vulnerability

Send security reports privately to **[contact@reindexventures.com](mailto:contact@reindexventures.com)**. Include the affected version or commit, the component or endpoint, steps to reproduce, and the impact. Use synthetic locations and remove credentials and personal trip details from examples.

Please report exploitable vulnerabilities privately before publishing reproduction details. For general support and ordinary bugs, use [GitHub issues](https://github.com/czekaj/sf-transit-mcp/issues).

## Security boundaries

The hosted MCP endpoint is public and requires no account or API key. Its tools search places, plan journeys, and report service information. They do not book travel, take payments, or provide filesystem or shell access. Tool annotations describe their intended read-only behavior; they are not an authorization system.

The HTTP wrapper rejects requests with an Origin header, caps incoming POST bodies at 64 KiB, and marks MCP responses `no-store`. Routing requests use the configured Transitous provider, reject redirects, have a 20-second deadline, and cap response size. Errors returned by the application avoid exposing raw provider responses or request URLs.

The itinerary widget uses the MCP client's bridge to receive results and request refreshes. Its resource policy declares no external network, resource, or frame domains. Attribution links are opened through the host's link mechanism. Place names and provider text are treated as data. These controls also depend on the MCP client enforcing the widget's sandbox and resource policy.

The application has no database or persistent user profiles. Its in-memory request budget is per process or Worker instance; it is not a global rate limit or a guarantee against abuse. Infrastructure providers and MCP clients have their own security and logging practices. See [Privacy](PRIVACY.md) for the data flow and retention limits.

## Running a copy

Local stdio runs with the permissions of the process that starts it and still makes network requests to Transitous. Review the source and dependencies before running it. Operators of other deployments are responsible for their configuration, access controls, updates, and privacy disclosures.
