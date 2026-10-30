# Cloudflare deployment

This project runs as a stateless Cloudflare Worker. It needs no API keys, OAuth, storage, Containers, or background jobs. Use an account on **Workers Free** to keep hosting within its free allowance. The Wrangler configuration does not select or enforce your account's billing plan.

The MCP endpoint is `/sf-transit/mcp`, with no trailing slash. `/mcp` remains available for existing connections. A request on a different path from the configured `PUBLIC_MCP_URL` uses the host's default widget sandbox so it is not assigned the canonical URL's sandbox hash. When `HOMEPAGE_URL` is empty, the root URL returns service information and advertises the canonical endpoint. Set it to redirect visitors to your website instead. `/sf-transit` and `/sf-transit/` redirect to the GitHub repository. These page redirects do not affect the MCP endpoint.

## Prepare locally

Requires Node.js 22.12 or newer. From the repository directory:

```sh
npm ci --ignore-scripts
npm run check
npm run build:worker
```

The checks use synthetic fixtures. The Worker build is a dry run: it bundles locally without creating a deployment, changing DNS, or calling a transit provider. A successful build does not verify the deployed Worker's runtime limits.

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

## Maintainer deployment on czekaj.us

The named `production` environment prepares these settings:

| Setting                                | Value                                    |
| -------------------------------------- | ---------------------------------------- |
| Worker                                 | `sf-transit-mcp`                         |
| Custom Domain                          | `lucas.czekaj.us`                        |
| Claude connector URL                   | `https://lucas.czekaj.us/sf-transit/mcp` |
| `PUBLIC_MCP_URL`                       | Same exact connector URL                 |
| `HOMEPAGE_URL`                         | `https://www.czekaj.us`                  |
| `workers.dev` and version preview URLs | Disabled                                 |

These are deployment settings, not a claim that this URL is live.

Before publishing, confirm that `czekaj.us` is an active Cloudflare zone in the Workers Free account you intend to use, and that `lucas.czekaj.us` is available for this service. Cloudflare cannot create a Custom Domain over an existing CNAME. Review any existing DNS record or service before changing it.

Check this environment locally:

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

Cloudflare runs these commands in its build service; you do not need the CLI installed locally. The production configuration supplies `PUBLIC_MCP_URL` and `HOMEPAGE_URL` automatically. Both the default and production configurations target the same Worker name, so `--env production` is needed to select the maintainer's domain and redirect settings.

Saving build settings applies them to the next build. Retry the latest `main` build to use the updated settings. Future pushes to the connected production branch trigger Cloudflare builds and deployments. See [Workers Builds configuration](https://developers.cloudflare.com/workers/ci-cd/builds/configuration/).

### Deploy from the CLI

After the owner approves the specific production deployment, log in to the intended account and publish:

```sh
npx wrangler login
npm run build:widget
WRANGLER_SEND_METRICS=false npx wrangler deploy --env production
```

This publishes `sf-transit-mcp` and attaches the **whole hostname** `lucas.czekaj.us`. Cloudflare manages its DNS record and HTTPS certificate. The prepared production routing is:

| Path                            | Behavior                                               |
| ------------------------------- | ------------------------------------------------------ |
| `/`                             | Redirect to `https://www.czekaj.us`                    |
| `/sf-transit` or `/sf-transit/` | Redirect to `https://github.com/czekaj/sf-transit-mcp` |
| `/sf-transit/mcp`               | Serve MCP                                              |
| `/mcp`                          | Serve the compatibility MCP endpoint                   |
| Other unclaimed paths           | Return 404                                             |

Page redirects use HTTP 308 for GET and HEAD, with a one-hour cache lifetime. Their targets are fixed; incoming query strings are not forwarded. POST requests to page paths return 404. The redirects run in the Worker, so no separate Cloudflare redirect rules are needed.

After deployment, verify MCP initialization, tool discovery, and the widget resource through the exact connector URL. These checks do not need a transit API request. Live verification is a separate production action requiring the owner's approval; it is not part of the automated test suite.

See [Cloudflare Custom Domains](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/) and [Wrangler environments](https://developers.cloudflare.com/workers/wrangler/environments/) for how these settings work.

## Share the hostname with other MCPs

The Custom Domain makes SF Transit the default Worker for `lucas.czekaj.us`. It does not prevent other Workers from serving specific paths on that hostname. [Cloudflare Routes run before the Custom Domain Worker](https://developers.cloudflare.com/workers/configuration/routing/custom-domains/#interaction-with-routes).

For a second MCP, configure a route in **that project's Worker configuration**, for example:

```jsonc
{
  "routes": [
    {
      "pattern": "lucas.czekaj.us/another-service/*",
      "zone_name": "czekaj.us",
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

This uses Cloudflare's routing without an extra gateway Worker. The Custom Domain remains the shared hostname's foundation: keep it in place while other routes depend on it, or migrate it deliberately if the default Worker changes.

## Free usage limits

Workers Free has a daily request allowance and a per-request CPU limit. When the allowance is exhausted, service can become unavailable; this configuration does not enable a paid upgrade. Check the current [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/) and [limits](https://developers.cloudflare.com/workers/platform/limits/).

Transitous has its own [usage policy](https://transitous.org/api/). The MCP's per-instance courtesy limits do not enforce a global request quota across Cloudflare's network. Coordinate with Transitous before serving many users or substantial automated traffic.
