# MCP compatibility

The server supports the published **2026-07-28** MCP revision and accepts the initialization messages used by older clients. Remote clients use Streamable HTTP at `/sf-transit/mcp` (with `/mcp` retained). Local clients use stdio, which exchanges messages through a local process's standard input and output.

The official TypeScript SDK and Cloudflare Agents SDK handle the July revision. They select the protocol version from each HTTP request or the opening stdio exchange. The project does not implement a separate protocol parser.

## Verified locally

| Protocol                    | Verification                                                                                                                        |
| --------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `2026-07-28`                | Official SDK client through HTTP and the real stdio entrypoint: discovery, tool listing and calls, widget listing and resource read |
| `2025-11-25`                | Official SDK client through HTTP and stdio, including initialization and the same tool/resource flow                                |
| `2025-06-18`, `2025-03-26`  | HTTP initialization and tool calls using each revision's messages                                                                   |
| `2024-11-05` message format | Compatibility adapter accepts initialization and tool messages; this does not provide the old HTTP+SSE transport                    |

Modern checks also verify `server/discover`, per-result server identity, `resultType`, required cache fields, header/body version agreement, method headers, and unsupported-version errors. A `plan_trip` call with made-up data verifies complete trip instructions, source credits, and the original request used for refresh with the July protocol.

The SDK client defaults to older protocol behavior. The modern checks explicitly enable automatic version negotiation and assert that `2026-07-28` was selected, so a newer SDK package alone cannot produce a false compatibility result.

All checks run offline. HTTP requests go directly into the local handler through a supplied fetch function. The stdio test blocks external fetch inside its child process. No check contacts the deployed Worker or Transitous. These tests verify the operations this project uses; they do not certify every optional MCP feature or every client's interface.

## Interactive UI and text fallback

MCP Apps is an optional extension, separate from the core protocol. Clients with Apps support can display route cards and trip details. Every trip also includes complete text instructions and structured data, so clients without Apps support still receive the route instructions.

The configured `PUBLIC_MCP_URL` determines the sandbox domain Claude uses to isolate the interactive view. Interactive behavior in other clients needs verification in those clients; support for the core MCP protocol does not guarantee the same interface controls.

## Deliberate limits

- The deprecated standalone HTTP+SSE transport (`/sse` plus a separate message endpoint) is not implemented.
- Direct browser HTTP connections are blocked by the Origin policy and have no CORS support. Native clients and hosts that connect from their backend are supported.
- The HTTP compatibility adapter retains no sessions and does not support sessionful server-to-client requests. Our transit tools do not use sampling, roots, or elicitation.
- Tools and the versioned widget resource are fixed for a build; cross-request change broadcasts are not configured.

See the [published MCP specification](https://modelcontextprotocol.io/specification/2026-07-28), its [July changes](https://modelcontextprotocol.io/specification/2026-07-28/changelog), and [MCP Apps](https://modelcontextprotocol.io/extensions/apps/overview).
