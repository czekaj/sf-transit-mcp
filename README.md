<p><img src="assets/logo.png" alt="SF Bay Area Transit MCP" width="520" /></p>

# SF Bay Area Transit MCP

**Created by Lucas Czekaj ([X: @0xLCZ](https://x.com/0xLCZ)). Operated and published by [Reindex Ventures LLC](https://reindexventures.com).**

Use your AI agent to plan trips in San Francisco and the Bay Area. Results show where to walk, which buses or trains to take, where to transfer, and when to depart and arrive.

**Free to use. No API keys or authentication.** Connect an AI agent or app that supports remote MCP servers, or run the server on your computer. MCP connects AI apps to tools. Apps that support MCP Apps can display interactive trip details. The hosted service runs on Cloudflare Workers Free. [Transitous](https://transitous.org/) provides trip planning and place search.

> “How do I get from the Ferry Building to Baker Beach, leaving now?”
>
> “I need to reach the Ferry Building by 9 tomorrow morning.”
>
> “Compare transit with cycling, and avoid more than one transfer.”

The default provider is for **light, noncommercial, open-source use**. It is a community service, and availability is not guaranteed. See [provider details](docs/providers.md).

## Get started

### Connect to the hosted service

1. In your AI agent's MCP or connector settings, add a remote server with the **official hosted URL**:

   ```text
   https://mcp.riv.lc/sf-transit/mcp
   ```

2. Set authentication to **None** if asked.
3. Ask: “How do I get from the Ferry Building to Baker Beach, leaving now?”

The [user guide and IT review](https://mcp.riv.lc/sf-transit) explain setup, tool permissions, data handling, support, and service limits. Place searches and trip coordinates are sent to Transitous; see the [privacy policy](PRIVACY.md).

### Install a local server from GitHub

Requires Node.js 22.12 or newer and Git.

For Claude Desktop, add this to its MCP configuration. It installs the server from this public repository and starts it:

```json
{
  "mcpServers": {
    "sf-transit": {
      "command": "npx",
      "args": [
        "--yes",
        "--package=git+https://github.com/czekaj/sf-transit-mcp.git",
        "sf-transit-mcp"
      ]
    }
  }
}
```

Restart Claude Desktop and ask for a trip. For Claude Code:

```sh
claude mcp add sf-transit -- npx --yes --package=git+https://github.com/czekaj/sf-transit-mcp.git sf-transit-mcp
```

### Run a local copy

```sh
git clone https://github.com/czekaj/sf-transit-mcp.git
```

From the project directory:

```sh
npm ci --ignore-scripts
npm run build
```

For Claude Desktop, replace the example below with the full path to your local copy:

```json
{
  "mcpServers": {
    "sf-transit": {
      "command": "node",
      "args": ["/absolute/path/to/sf-transit-mcp/dist/stdio.js"]
    }
  }
}
```

Restart Claude Desktop. For Claude Code, register the same local server:

```sh
claude mcp add sf-transit -- node /absolute/path/to/sf-transit-mcp/dist/stdio.js
```

The server starts without credentials or environment variables. Include your starting address in the trip request, or use an address already in your conversation. This service does not save a home address. When several places match, choose the intended place before planning the trip.

**Privacy:** place searches and trip coordinates go to Transitous. Its [privacy policy](https://transitous.org/privacy/) says request URLs are logged for up to two days. This application's code does not log or save addresses or trip results. Your AI app and hosting providers have their own retention practices. The [project privacy policy](PRIVACY.md) explains who receives the data and how it is handled.

For help, see [Support](SUPPORT.md) or open a [GitHub issue](https://github.com/czekaj/sf-transit-mcp/issues). Send security or privacy reports to [contact@reindexventures.com](mailto:contact@reindexventures.com); see [Security](SECURITY.md).

## What it does

| Tool               | Purpose                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------- |
| `search_places`    | Find matching Bay Area addresses, landmarks, and stops, with their coordinates.                 |
| `plan_trip`        | Plan trips leaving now, departing after a time, or arriving by a deadline.                      |
| `get_service_info` | Read the current time, data sources, credits, and service limits without contacting Transitous. |

Transit trips include walking to and from stops. You can limit transfers, request the wheelchair routing option, or compare transit with walking or using your own bicycle. Results include readable instructions and data the app can display.

**MCP compatibility:** supports protocol version `2026-07-28` over Streamable HTTP for remote connections and stdio for local connections. Older versions are also supported. Local tests check both current and older connection procedures. See the [tested versions and client limitations](docs/compatibility.md).

Times use **America/Los_Angeles**, the Bay Area's Pacific timezone, including daylight-saving changes. Travel time and the wait before departure are shown separately. Each bus, train, or ferry section identifies timetable times or live predictions. The provider does not report how old its predictions are. A live prediction may be out of date.

### Interactive journeys

In apps that support [MCP Apps](https://modelcontextprotocol.io/extensions/apps/overview), including Claude, `plan_trip` also displays interactive trip details:

- Compare trip options with departure and arrival times, transfers, and walking time.
- Open trip details for stops, travel directions, platforms, walking sections, and transfer waits.
- See which transit times are live estimates and which follow the schedule.
- Select Refresh to update the same trip. “Leaving now” updates to the current time; a specified departure time or arrival deadline stays fixed.

Selecting a trip and opening details use the results already returned. Refresh requests the trip again and uses the same request limits as an ordinary trip search. The view does not update automatically or load external maps. Apps without MCP Apps support receive readable trip instructions and the same result data.

The interactive view supports light and dark themes, narrow screens, keyboard controls, and fullscreen details where the app supports them. It shows trip options and each part of the trip in order. It does not include a street map.

<p><a href="docs/claude-trip-example.png"><img src="docs/claude-trip-example.png" alt="Claude showing Ferry Building to Baker Beach route options and a detailed walking and Muni journey" width="720" /></a></p>

_A Ferry Building → Baker Beach trip displayed in Claude. Select the screenshot to view it at full size._

Transitous lists data sources for Muni, BART, Caltrain, AC Transit, VTA, SamTrans, and regional ferries. Available trips and predictions depend on the data currently supplied. Place search is limited to the Bay Area. Walking instructions describe connections between places and stops, without turn-by-turn directions. The wheelchair routing option applies to walking and transfer paths. Vehicle accessibility may be unknown; check each transit section. The data does not confirm current elevator operation or guarantee accessible entrances and paths. Results do not include fares, tickets, service alerts, or bike-share availability.

## Cloudflare hosting

The same code serves remote MCP connections at `/sf-transit/mcp` using Streamable HTTP. Existing `/mcp` connections continue to work. It uses no Containers, databases, storage bindings, API keys, OAuth, or background jobs. Running the server on your computer avoids a separate hosting service. **Workers Free** provides a free hosting allowance. The person deploying the service needs a Cloudflare account; people connecting to the MCP endpoint do not.

Build and preview locally:

```sh
npm run build:worker
npm run dev:worker
```

`build:worker` builds locally without deploying. The local test URL is `http://localhost:8787/sf-transit/mcp`.

To publish to your own Cloudflare account, review `wrangler.jsonc`, use a Workers Free account, and run Wrangler's deploy command yourself. Connect your remote MCP client to the resulting `https://<worker>.<subdomain>.workers.dev/sf-transit/mcp` URL, with no authentication. An agent running in the cloud cannot use your computer's `localhost` URL.

For a Claude remote connector, set `vars.PUBLIC_MCP_URL` in `wrangler.jsonc` to the **exact connector URL**, including `/sf-transit/mcp`, with no trailing slash. Claude uses a separate web address for the interactive view. The server calculates that address from this URL. You do not need to register the view's address. Leave the value empty for local use or to let the app choose its default address. If the connector URL changes, update this value too.

Reindex Ventures LLC's production configuration targets **`https://mcp.riv.lc/sf-transit/mcp`**. The named `production` environment in `wrangler.jsonc` configures the `sf-transit-mcp` Worker, its company hostname, and a root redirect to `https://reindexventures.com`. The repository remains `czekaj/sf-transit-mcp`.

For Cloudflare's connected Git build, use `npm run build:widget` as the build command and `npx wrangler deploy --env production` as the deploy command. Production URL variables come from this configuration; no manual URL variables or alternate configuration file are needed. The default configuration has no custom domain, so forks can deploy independently. See the [Cloudflare deployment guide](docs/cloudflare.md).

Check the maintainer configuration locally without deploying:

```sh
npm run build:worker:production
```

A public deployment must follow [Transitous's usage policy](https://transitous.org/api/). Coordinate with its maintainers before serving many users or sending substantial automated traffic. Each running server or Worker instance limits Transitous requests to 20 in the previous minute and 600 in the previous 24 hours. These limits reset when an instance restarts and **do not limit total requests across all instances**. The service does not request updates in the background or retry automatically. A normal transit search makes one Transitous request. Comparing transport modes makes one request per mode.

## Development

```sh
npm run check
npm run build:worker
```

Tests use fictional examples and simulated service responses. They do not call live transit APIs. Worker builds and type generation run locally. After changing Wrangler configuration, regenerate types:

```sh
npm run types:worker
```

Preview the interactive view with fictional transit services and public-place examples:

```sh
npm run preview:widget
```

Open `http://127.0.0.1:8798`. The preview uses the MCP Apps connection in an isolated frame. Controls show light and dark themes, narrow screens, empty results, and failed refreshes. It makes **no transit API requests**. Rebuild and reload after editing the view. `npm run build:widget` creates its HTML and an MCP resource identified by the file contents. Generated files are not committed.

The MCP connection, Transitous requests, and display code are separate. Requests and responses follow the [MOTIS API version linked by Transitous](https://transitous.org/api/). See [CONTRIBUTING.md](CONTRIBUTING.md) for contribution and testing guidance.

The [Claude submission materials](docs/claude-submission.md) contain listing copy, reviewer instructions, approved screenshot assets, and the remaining launch requirements. The listing is a draft. Provider use remains subject to [Transitous's published policy](https://transitous.org/api/); qualifying light use does not require separate prior approval.

### Project artwork

The SF icon combines the Golden Gate Bridge, transit route endpoints, and a streetcar. Its original AI-generated PNG is [`assets/route-monogram.png`](assets/route-monogram.png), with the [generation prompt](assets/route-monogram.prompt.txt) alongside it. MCP server, tool, and resource descriptions include a PNG icon, following the [MCP icons specification](https://modelcontextprotocol.io/specification/2025-11-25/basic#icons). Apps choose whether to display it.

The Worker also serves the 512 × 512 PNG at `/sf-transit/icon.png` for directory forms that require a hosted icon URL. After deployment, the company URL is `https://mcp.riv.lc/sf-transit/icon.png`. It serves the image directly without authentication or a redirect, using the existing Worker rather than a separate image-hosting service.

Run `npm run build:branding` to create the logo, icon sizes, and `assets/social-preview.png` from the original artwork. The script crops and resizes the selected image; it does not call an image service. If the source image changes, adjust the cropping and sizing in `scripts/build-branding.mjs`. The social preview is a 1280 × 640 image for GitHub's **Settings → Social preview**. Committing it does not change that setting. Artwork uses the project's MIT license.

## License and credits

Code: [MIT](LICENSE). Transit and map data retain their own licenses.

[Routing by Transitous](https://transitous.org/) · [Transitous data sources](https://transitous.org/sources/) · [© OpenStreetMap contributors](https://www.openstreetmap.org/copyright) · [Bay Area data provided by 511.org](https://511.org/)
