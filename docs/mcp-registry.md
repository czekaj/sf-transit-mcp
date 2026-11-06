# Official MCP Registry publication

Version **0.1.0 was published November 6, 2026** through the local CLI. The [Registry entry](https://registry.modelcontextprotocol.io/v0.1/servers/io.github.czekaj%2Fsf-transit-mcp/versions/0.1.0) was verified active and latest, with metadata matching [`server.json`](../server.json) exactly.

## Initial publication evidence

- **Owner approval:** In this conversation on November 6, 2026, Lucas explicitly approved the one-time checks, local CLI publication of `io.github.czekaj/sf-transit-mcp@0.1.0`, and the Registry terms including CC0 metadata. He also explicitly authorized pushing these changes with the resulting Cloudflare Worker deployment. This approval covers this publication and push, not future versions or a publishing-workflow dispatch.
- **Approved manifest SHA-256:** `ec558974037dd64ae12df1dafbbdb8c9506f6418763b3afba10f8d22d386b138`, rechecked immediately before publication.
- **Readiness:** The documentation returned HTTP 200 and identified Reindex Ventures LLC and the correct connection URL. The icon returned HTTP 200 as a 512 × 512 PNG. MCP initialization reported `sf-transit-mcp@0.1.0`; tool discovery returned `search_places`, `plan_trip`, `get_stop_departures`, and `get_service_info`. Resource discovery returned `ui://sf-transit/itinerary-cc6c98636f8c5635.html`. Only `get_service_info` was called; no Transitous requests were made by these checks. The initial Python documentation request returned 403; curl succeeded, and the remaining checks used curl without retries or polling.
- **Availability:** The exact Registry version returned 404 before publication.
- **Authentication and publication:** Publisher v1.8.7 authenticated through GitHub as `czekaj`, with publish permission for `io.github.czekaj/*`. `mcp-publisher publish server.json` reported success.
- **Readback:** One GET of the exact Registry version matched the full manifest, reported `status: active` and `isLatest: true`, and recorded `publishedAt: 2026-11-06T16:07:08.96022Z` (8:07 AM Pacific).
- **Local validation before publication:** `npm run check` passed, including all 181 tests. Workflow lint passed; offline checks rejected incorrect manifest versions/endpoints, invalid descriptions, unknown fields, and unauthorized workflow actors, branches, or commits. No GitHub publishing workflow was dispatched.

## Public listing

| Field                        | Value                                                                                                |
| ---------------------------- | ---------------------------------------------------------------------------------------------------- |
| Registry identifier          | `io.github.czekaj/sf-transit-mcp`                                                                    |
| Display name                 | SF Bay Area Transit MCP                                                                              |
| Initial version              | `0.1.0`                                                                                              |
| Description                  | Plan San Francisco and Bay Area transit trips and check upcoming stop departures. Free, no API keys. |
| Verified publisher namespace | GitHub account `czekaj`                                                                              |
| Legal operator               | Reindex Ventures LLC, declared in publisher-provided metadata and public documentation               |
| Source                       | `https://github.com/czekaj/sf-transit-mcp`                                                           |
| Documentation                | `https://mcp.riv.lc/sf-transit`                                                                      |
| Icon                         | `https://mcp.riv.lc/sf-transit/icon.png`                                                             |
| Connection                   | `https://mcp.riv.lc/sf-transit/mcp`, Streamable HTTP, no authentication                              |

This lists the existing hosted service. It publishes no npm package and needs no DNS change. The GitHub namespace verifies the account, not the legal operator's business identity. The publisher-provided operator field is additional metadata, not a Registry business-verification claim.

## Local validation

```sh
npm run registry:check
npm run check
```

`registry:check` validates the manifest against a checked-in copy of the official JSON Schema and checks its identity, version, URLs, transport, and icon against `src/project.ts` and `package.json`. It rejects unknown top-level fields and package-install entries. It prints the manifest's SHA-256 fingerprint for review. It performs no network requests, authentication, or publication, and is included in the existing offline CI checks.

The schema was downloaded November 6, 2026 from:

`https://static.modelcontextprotocol.io/schemas/2025-12-11/server.schema.json`

The copy is [`scripts/schemas/mcp-server-2025-12-11.schema.json`](../scripts/schemas/mcp-server-2025-12-11.schema.json), with only formatting changed by Prettier. Its local SHA-256 is `8ca42989ecdbce74f5bd0301f3db4cc760e6ad8d1054d44734a24ed0f977f998`; the downloaded source SHA-256 was `3fba09590c99f61735d234822279f4223fab9e300c0a81e81c91ab62a4114de0`. Update it deliberately when the Registry changes its supported schema.

Do not substitute `mcp-publisher validate` in local checks or CI: publisher v1.8.7 sends the manifest to the live Registry's `/v0/validate` API. Automated tests must remain offline. The Registry can still reject publication for online rules that a local schema cannot establish.

## Approval required before external actions

The owner's production-access rule in AGENTS.md requires approval for each specific action and scope. The initial publication approval is recorded above; repeat publications, live checks, and workflow runs need their own approval. Preparing these files alone grants no production access.

1. **One-time production readiness check.** Read the documentation and icon at the exact URLs above, send an MCP initialization request and list tools/resources through the exact connection URL, and call only `get_service_info`. Confirm all four expected tools are advertised. These requests must not call Transitous, invoke trip planning, search places, retrieve departures, or poll. Check the Registry's exact identifier/version once to establish whether it already exists. Stop if the endpoint is unavailable or the identifier/version conflicts; deployment and metadata changes require separate approval.
2. **Publication.** Authenticate as `czekaj` and publish the exact reviewed `server.json` as `io.github.czekaj/sf-transit-mcp@0.1.0` to `https://registry.modelcontextprotocol.io`. Include any Registry-side validation performed by the publisher or service, and one GET of `/v0.1/servers/io.github.czekaj%2Fsf-transit-mcp/versions/0.1.0` afterward to verify the name, version, endpoint, and active status. This makes the metadata public and available for downstream indexing. On an ambiguous failure, read the exact version once before considering another publication attempt; do not retry publication blindly.
3. **Registry terms.** The owner must authorize accepting the [Registry Terms of Service](https://modelcontextprotocol.io/registry/terms-of-service) on behalf of Reindex Ventures LLC. Submitted metadata is dedicated to the public domain under CC0, an irrevocable dedication. The project code retains its MIT license. Published version metadata cannot be edited in place; corrections require another version.
4. **Enabling the GitHub workflow.** Putting these files on the default branch and running the workflow require separate approval. The documented Cloudflare Git integration deploys pushes to `main`, including documentation-only changes. Approval to publish Registry metadata does not authorize that deployment. No repository/environment settings, pushes, merges, workflow dispatches, or deployments are part of local preparation.

Record the exact manifest fingerprint and, for a workflow run, the full reviewed commit SHA with the owner's approval. Before broad promotion, assess expected traffic against [Transitous's usage policy](https://transitous.org/api/); a listing alone is not a separate provider-approval trigger.

## Manual publishing workflow

[`publish-mcp.yml`](../.github/workflows/publish-mcp.yml) has only a `workflow_dispatch` trigger. Pushes, tags, releases, and ordinary CI cannot publish. Both the original actor and the actor rerunning a workflow must be `czekaj`, the repository must be `czekaj/sf-transit-mcp`, the selected branch must be `main`, and its workflow commit must match the full SHA entered as `reviewed_commit`.

After approval to enable the workflow and to publish that exact version:

1. Open GitHub Actions → **Publish to official MCP Registry** → **Run workflow**.
2. Select `main`; enter its full reviewed commit SHA and the exact manifest version.
3. Leave **approve_publication** unchecked for an offline validation run. No Registry authentication or publication happens in that mode.
4. For the approved publication run, check **approve_publication** and run it. An agent may dispatch only with the owner's explicit approval for that action; access to the owner's GitHub credentials is not approval.

The publish job gets permission to request a short-lived GitHub identity token. No long-lived GitHub token or npm token is needed. It downloads publisher **v1.8.7**, verifies the Linux archive against its pinned SHA-256 digest, authenticates explicitly to the official Registry, publishes the checked-out manifest, and removes its saved publisher credential. Checkout/setup actions are pinned to commits. The workflow does not deploy the Worker, contact our hosted endpoint, run live tests, or automatically query the published listing.

For a later release, update `server.json`, `package.json`, and `PROJECT.version` together, run the offline checks, and obtain approval for the new commit/version. Review and approval are per publication; there is no standing permission to publish future versions.

## Publish locally without enabling GitHub Actions

The installed publisher can submit the reviewed manifest without pushing or deploying the repository. This still requires the production-read, authentication, publication, verification, and terms approvals above. After approval, use publisher v1.8.7:

```sh
mcp-publisher login github --registry=https://registry.modelcontextprotocol.io
mcp-publisher publish server.json
```

The owner completes the GitHub device authorization. Check that the reviewed manifest fingerprint is unchanged immediately before publication. This interactive route does not use the workflow's GitHub identity token.

## References

- [Remote server manifests](https://modelcontextprotocol.io/registry/remote-servers)
- [GitHub Actions authentication and publishing](https://modelcontextprotocol.io/registry/github-actions)
- [Version immutability](https://modelcontextprotocol.io/registry/versioning)
- [Publisher v1.8.7 validation implementation](https://github.com/modelcontextprotocol/registry/blob/v1.8.7/cmd/publisher/commands/validate.go)
- [Publisher v1.8.7 release](https://github.com/modelcontextprotocol/registry/releases/tag/v1.8.7)
