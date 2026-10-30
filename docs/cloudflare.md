# Cloudflare deployment

This project runs as a Cloudflare Worker without saving trip data between requests. It needs no API keys, OAuth, database, Containers, or background jobs. Use an account on **Workers Free** to keep hosting within its free allowance. The Wrangler configuration does not select or enforce your account's billing plan.

The MCP endpoint is `/sf-transit/mcp`, with no trailing slash. `/mcp` remains available for existing connections. Requests on a different origin or path from `PUBLIC_MCP_URL` use the host's default widget sandbox so they are not assigned a different connector URL's hash. When `HOMEPAGE_URL` is empty, the root URL returns service information and advertises the canonical endpoint. Set it to redirect visitors to your website instead. `/sf-transit` and `/sf-transit/` serve the public HTML guide. These page routes do not affect the MCP endpoint.

The project is created by **Lucas Czekaj** and operated and published by **[Reindex Ventures LLC](https://reindexventures.com)**. Its repository stays at `czekaj/sf-transit-mcp`.

## Prepare locally

Requires Node.js 22.12 or newer. From the repository directory:

```sh
npm ci --ignore-scripts
npm run check
npm run build:worker
```

The checks use made-up local examples. The Worker build is a dry run: it bundles locally without creating a deployment, changing DNS, or calling a transit provider. A successful build does not verify the deployed Worker's runtime limits.

## Deploy your own copy

The default `wrangler.jsonc` configuration has no custom domain or account ID. It deploys independently of the maintainer's domain.

1. Use a Cloudflare account on Workers Free.
2. Choose your Worker name and `workers.dev` account subdomain. Set `vars.PUBLIC_MCP_URL` to `https://<worker>.<subdomain>.workers.dev/sf-transit/mcp` so Claude's widget uses the same URL as your connector.
3. Build the widget and log in through Wrangler:

   ```sh
   npm run build:widget
   npx wrangler login
   ```

4. Publish when ready:

   ```sh
   WRANGLER_SEND_METRICS=false npx wrangler deploy --env ""
   ```

Add the resulting HTTPS endpoint to Claude as a custom connector with no authentication. The Cloudflare login is for the person deploying the Worker; people using the MCP do not need a Cloudflare account.

## Company production deployment

The single maintainer production configuration is `env.production` in [`wrangler.jsonc`](../wrangler.jsonc):

| Setting                                | Value                               |
| -------------------------------------- | ----------------------------------- |
| Worker                                 | `sf-transit-mcp`                    |
| Custom Domain                          | `mcp.riv.lc`                        |
| Zone                                   | `riv.lc`                            |
| Claude connector / `PUBLIC_MCP_URL`    | `https://mcp.riv.lc/sf-transit/mcp` |
| `HOMEPAGE_URL`                         | `https://reindexventures.com`       |
| Repository                             | `czekaj/sf-transit-mcp`             |
| `workers.dev` and version preview URLs | Disabled                            |

The `riv.lc` zone must be active in the intended Cloudflare account. Cloudflare cannot create a Custom Domain over an existing CNAME. This production configuration manages the company hostname only; it contains no personal-domain routes or redirects. Deployments reconcile this Worker's domain bindings with the configuration, so an obsolete Custom Domain on the same Worker may be detached.

Check the production configuration locally without deploying:

```sh
npm run build:worker:production
```

### Deploy from the connected GitHub repository

In the `sf-transit-mcp` Worker's **Settings → Build**, use:

| Setting           | Value                                  |
| ----------------- | -------------------------------------- |
| Production branch | `main`                                 |
| Build command     | `npm run build:widget`                 |
| Deploy command    | `npx wrangler deploy --env production` |

Cloudflare runs these commands in its build service; you do not need the CLI installed locally. The production configuration supplies `PUBLIC_MCP_URL` and `HOMEPAGE_URL` automatically. No manual URL variables or alternate configuration file are needed. Both the default and production configurations target the same Worker name, so `--env production` selects the company domain and redirect settings.

Wrangler uses the repository configuration when deploying. Editing domains or variables only in the dashboard can be undone on the next deployment; update `wrangler.jsonc` for lasting changes. See [Wrangler's configuration guidance](https://developers.cloudflare.com/workers/wrangler/configuration/#source-of-truth).

Saving build settings applies them to the next build. Retry the latest `main` build to use the updated settings. Future pushes to the connected production branch trigger Cloudflare builds and deployments. See [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).

### Deploy from the CLI

As an alternative to the connected Git build, log in to the intended account and publish:

```sh
npx wrangler login
npm run build:widget
WRANGLER_SEND_METRICS=false npx wrangler deploy --env production
```

This publishes `sf-transit-mcp` and attaches the **whole hostname** `mcp.riv.lc`. Cloudflare manages its DNS record and HTTPS certificate. Production routing is:

| Path                                            | Behavior                                       |
| ----------------------------------------------- | ---------------------------------------------- |
| `/`                                             | Redirect to `https://reindexventures.com`      |
| `/sf-transit` or `/sf-transit/`                 | Serve the public HTML user guide and IT review |
| `/sf-transit/privacy` or `/sf-transit/privacy/` | Serve the HTML privacy policy                  |
| `/sf-transit/mcp`                               | Serve MCP                                      |
| `/mcp`                                          | Serve the compatibility MCP endpoint           |
| `/sf-transit/icon.png`                          | Serve the public 512 × 512 PNG directory icon  |
| Other unclaimed paths                           | Return 404                                     |

The homepage redirect uses HTTP 308 for GET and HEAD, with a one-hour cache lifetime. It adds `utm_source=sf-transit-mcp` to the configured destination and preserves its other parameters. Incoming request query strings are not forwarded. POST requests to page paths return 404. The redirect runs in the Worker, so no separate Cloudflare redirect rule is needed.

The icon URL returns `image/png` directly for GET and HEAD, without authentication or redirects. It has a one-hour public cache lifetime and allows other websites to display the image. Directory forms can use `https://mcp.riv.lc/sf-transit/icon.png` after deployment. The documentation screenshots at `/sf-transit/screenshots/route-options.png` and `/sf-transit/screenshots/journey-details.png` use the same response settings. These images are bundled with the Worker and need no separate image-hosting service.

The documentation URL returns static HTML for GET and HEAD, without authentication, scripts, external fonts, or a separate hosting service. Use `https://mcp.riv.lc/sf-transit` as the directory's public Documentation URL after deployment. The page explains user setup, permissions, data handling, service limitations, and support; the README retains developer and self-hosting instructions.

Use `https://mcp.riv.lc/sf-transit/privacy` as the directory's Privacy URL after deployment. The HTML policy is generated from `PRIVACY.md` by the existing `npm run build:widget` command. Edit that Markdown file to update the policy. The page uses the same styling and response headers as the public guide.

After deployment, verify the page redirects, MCP initialization, tool discovery, and the widget resource through the exact connector URL. These checks do not need a transit API request and are not part of the automated test suite. Update Claude to the exact company connector URL so its widget sandbox matches. Local tests and dry runs do not establish that a deployment is live.

See [Cloudflare Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/) and [Wrangler environments](https://developers.cloudflare.com/workers/wrangler/environments/) for how these settings work.

## Share the company hostname with other MCPs

The Custom Domain makes SF Transit the default Worker for `mcp.riv.lc`. Other Workers can serve specific paths on that hostname. [Cloudflare Routes run before the Custom Domain Worker](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/#interaction-with-routes).

For a second MCP, configure a route in **that project's Worker configuration**, for example:

```jsonc
{
  "routes": [
    {
      "pattern": "mcp.riv.lc/another-service/*",
      "zone_name": "riv.lc",
    },
  ],
}
```

That Worker must accept its full `/another-service/mcp` path: Cloudflare selects a Worker without removing the path prefix. It should return its own response directly rather than forwarding to the default Worker. Each MCP keeps its own code, deployment, connector URL, and widget sandbox configuration.

| Request path           | Worker                                     |
| ---------------------- | ------------------------------------------ |
| `/sf-transit/mcp`      | SF Transit                                 |
| `/another-service/mcp` | The second MCP, once its route is deployed |
| An unclaimed path      | Default SF Transit Worker, returning 404   |

This uses Cloudflare's routing without an extra forwarding Worker. Keep the Custom Domain in place while other routes use the hostname. If the default Worker changes, plan how those routes will continue to work before changing the domain configuration.

## Free usage limits

Workers Free has a daily request allowance and a per-request CPU limit. When the allowance is exhausted, service can become unavailable; this configuration does not enable a paid upgrade. Check the current [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) and [limits](https://developers.cloudflare.com/workers/platform/limits/).

Transitous has its own [usage policy](https://transitous.org/api/). Each running MCP instance limits requests, but those limits do not enforce a total quota across Cloudflare's network. Coordinate with Transitous before serving many users or substantial automated traffic.
