# Security

SF Bay Area Transit MCP is operated and published by **[Reindex Ventures LLC](https://reindexventures.com)** and was created by **Lucas Czekaj**.

## Report a vulnerability

Send security reports privately to **[contact@reindexventures.com](mailto:contact@reindexventures.com)**. Include the affected version or commit, the part of the service affected, steps to reproduce, and the impact. Use made-up locations and remove credentials and personal trip details from examples.

Please report exploitable vulnerabilities privately before publishing reproduction details. For general support and ordinary bugs, use [GitHub issues](https://github.com/czekaj/sf-transit-mcp/issues).

## Security boundaries

The hosted MCP URL is public and requires no account or API key. Its tools search places, plan trips, and report service information. They do not book travel, take payments, read files, or run commands. Tool annotations describe these limits to AI apps; the annotations do not enforce access controls.

The MCP URL rejects requests with an Origin header, limits incoming POST bodies to 64 KiB, and marks MCP responses `no-store`. The public docs and images are served separately. Requests to Transitous reject redirects, have a 20-second timeout, and limit response size. Error messages avoid exposing complete provider responses or request URLs.

The route display receives results and requests refreshes through your AI app. Its declared security policy allows no direct network connections, external files, or embedded pages. Source links open through the app. Place names and provider text are displayed as data. These restrictions depend on the app enforcing the display's security policy.

The software has no database or saved user profiles. Request limits apply separately to each running copy and reset when that copy restarts. They do not enforce one total limit across the hosted service or guarantee protection against abuse. Hosting providers and AI apps have their own security and logging practices. See [Privacy](PRIVACY.md) for what information is sent and stored.

## Running a copy

A local server communicates with your AI app through its input and output streams, called stdio. It runs with the permissions of the software that starts it and contacts Transitous over the internet. Review the source and dependencies before running it. People who host their own copies are responsible for configuration, access controls, updates, and privacy disclosures.
