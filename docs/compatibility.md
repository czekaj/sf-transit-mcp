# MCP compatibility

The server supports the published **2026-07-28** MCP revision and keeps initialization-based compatibility for older clients. HTTP uses Streamable HTTP at `/sf-transit/mcp` (with `/mcp` retained); local clients use stdio.

The July revision is handled by the official TypeScript SDK and Cloudflare Agents SDK. Their serving wrappers select the protocol from each HTTP request or the opening stdio exchange. The project does not implement a separate protocol parser.

## Verified locally

| Protocol                    | Verification                                                                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `2026-07-28`                | Official SDK client through HTTP and the real stdio entrypoint: discovery, tool listing and calls, widget listing and resource read |
| `2025-11-25`                | Official SDK client through HTTP and stdio, including initialization and the same tool/resource flow                                |
| `2025-06-18`, `2025-03-26`  | HTTP initialization and tool calls using each revision's messages                                                                   |
| `2024-11-05` message format | Compatibility adapter accepts initialization and tool messages; this does not provide the old HTTP+SSE transport                    |

Modern checks also verify `server/discover`, per-result server identity, `resultType`, required cache fields, header/body version agreement, method headers, and unsupported-version errors. A synthetic `plan_trip` call verifies the complete itinerary, attribution, and widget refresh inputs using the July protocol.

The SDK client defaults to older protocol behavior. The modern checks explicitly enable automatic version negotiation and assert that `2026-07-28` was selected, so a newer SDK package alone cannot produce a false compatibility result.

All checks run offline. HTTP requests go directly into the local handler through an injected fetch function. The stdio fixture blocks external fetch inside its child process. No check contacts the deployed Worker or Transitous. These tests verify the flows this project uses; they are not a certification of every optional MCP feature or every host application's UI behavior.

## Interactive UI and text fallback

MCP Apps is an optional extension, separate from the core protocol. Hosts with Apps support can display the itinerary widget. Every trip also includes complete text instructions and structured data, so ordinary MCP clients remain useful without rendering a widget.

The configured `PUBLIC_MCP_URL` supplies Claude's host-specific widget sandbox domain. Interactive behavior in other hosts needs verification with those hosts; support for the core MCP protocol does not guarantee that every host implements the same UI actions.

## Deliberate limits

- The deprecated standalone HTTP+SSE transport (`/sse` plus a separate message endpoint) is not implemented.
- Direct browser HTTP connections are blocked by the Origin policy and have no CORS support. Native clients and hosts that connect from their backend are supported.
- The HTTP compatibility adapter retains no sessions and does not support sessionful server-to-client requests. Our transit tools do not use sampling, roots, or elicitation.
- Tools and the versioned widget resource are fixed for a build; cross-request change broadcasts are not configured.

See the [published MCP specification](https://modelcontextprotocol.io/specification/2026-07-28), its [July changes](https://modelcontextprotocol.io/specification/2026-07-28/changelog), and [MCP Apps](https://modelcontextprotocol.io/extensions/apps/overview).
