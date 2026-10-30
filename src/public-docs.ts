function escapeHtml(value: string): string {
  return value.replace(/[&<>"']/g, (character) => {
    const entities: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;",
    };
    return entities[character] ?? character;
  });
}

/** Public connection guide and data-handling summary, with no client-side code. */
export function renderPublicDocs(mcpUrl: string): string {
  const endpoint = escapeHtml(mcpUrl);
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="Connect your MCP-compatible AI agent to SF Bay Area Transit MCP. Plan journeys, understand the data flow, and review privacy and security information.">
  <meta name="color-scheme" content="light">
  <title>SF Bay Area Transit MCP — Connection guide</title>
  <link rel="icon" type="image/png" href="/sf-transit/icon.png">
  <style>
    :root { color-scheme: light; --paper: #f7f5ee; --card: #fffef9; --ink: #202e29; --muted: #53635a; --green: #235b48; --line: #d7dfd5; --accent: #e3b754; }
    * { box-sizing: border-box; }
    html { scroll-padding-top: 1.5rem; }
    body { margin: 0; background: var(--paper); color: var(--ink); font: 1rem/1.65 system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
    a { color: var(--green); text-underline-offset: .2em; text-decoration-thickness: .08em; }
    a:hover { text-decoration-thickness: .15em; }
    a:focus-visible { outline: 3px solid var(--green); outline-offset: 4px; border-radius: 2px; }
    .skip { position: absolute; top: -8rem; left: 1rem; z-index: 2; padding: .6rem 1rem; background: var(--card); }
    .skip:focus { top: 1rem; }
    .shell { width: min(100% - 3rem, 70rem); margin-inline: auto; }
    .masthead { display: flex; align-items: center; justify-content: space-between; gap: 1.5rem; padding-block: 1.5rem; border-bottom: 1px solid var(--line); }
    .brand { display: flex; align-items: center; gap: .8rem; font-weight: 750; line-height: 1.3; }
    .brand img { width: 3.25rem; height: 3.25rem; border-radius: .7rem; }
    .brand small { display: block; color: var(--muted); font-weight: 450; font-size: .82rem; }
    nav { display: flex; flex-wrap: wrap; gap: .5rem 1.4rem; font-size: .92rem; }
    .hero { padding-block: 2.75rem 2rem; max-width: 55rem; }
    .eyebrow { margin: 0 0 .8rem; color: var(--green); font-size: .82rem; font-weight: 750; letter-spacing: .11em; text-transform: uppercase; }
    h1 { margin: 0; max-width: 24ch; font-size: clamp(2.25rem, 4.4vw, 3.4rem); line-height: 1.07; letter-spacing: -.045em; font-weight: 750; }
    .lead { margin: 1.3rem 0 1.1rem; max-width: 48rem; font-size: 1.17rem; color: var(--muted); }
    .badge { display: inline-block; padding: .25rem .75rem; border: 1px solid var(--line); border-radius: 2rem; background: var(--card); color: var(--green); font-size: .9rem; font-weight: 650; }
    section { padding-block: 2.3rem; border-top: 1px solid var(--line); }
    h2 { margin: 0 0 1rem; font-size: clamp(1.5rem, 3vw, 1.9rem); line-height: 1.25; letter-spacing: -.025em; }
    h3 { margin: 0 0 .55rem; font-size: 1.06rem; line-height: 1.4; }
    p { margin: 0 0 1rem; }
    p:last-child { margin-bottom: 0; }
    .section-intro { max-width: 49rem; color: var(--muted); }
    .connection { display: grid; grid-template-columns: 1fr 1.05fr; gap: 2rem; align-items: start; }
    .endpoint { background: var(--green); color: #fffef9; border-radius: 1rem; padding: 1.4rem; }
    .endpoint-label { font-size: .85rem; font-weight: 650; margin-bottom: .65rem; }
    .endpoint code { display: block; font-size: .97rem; line-height: 1.7; overflow-wrap: anywhere; user-select: all; }
    .endpoint p { font-size: .86rem; margin-top: .9rem; color: #e0eadd; }
    ol { margin: 0; padding-left: 1.4rem; }
    li + li { margin-top: .65rem; }
    .note { padding: .9rem 1.1rem; border-left: 3px solid var(--accent); margin-top: 1.4rem; font-size: .94rem; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 1rem; }
    .card { background: var(--card); border: 1px solid var(--line); border-radius: 1rem; padding: 1.3rem; }
    .card p { color: var(--muted); font-size: .95rem; }
    .prompt { margin: 0; font-size: 1rem; }
    .prompt::before { content: "“"; color: var(--green); font-size: 1.65rem; line-height: 1; display: block; margin-bottom: .5rem; }
    .tool-name { display: block; margin-top: .7rem; color: var(--green); font-size: .82rem; }
    .details { display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; }
    .details ul { padding-left: 1.2rem; margin: 0; }
    .details li { color: var(--muted); }
    table { width: 100%; border-collapse: collapse; background: var(--card); font-size: .94rem; }
    caption { text-align: left; margin-bottom: 1rem; color: var(--muted); }
    th, td { padding: 1rem 1.1rem; text-align: left; vertical-align: top; border: 1px solid var(--line); overflow-wrap: anywhere; }
    th { width: 25%; font-weight: 650; }
    .links { display: flex; flex-wrap: wrap; gap: .65rem 1.5rem; margin-top: 1.1rem; }
    .contact { display: grid; grid-template-columns: 1.2fr 1fr; gap: 2rem; }
    footer { margin-top: 1.5rem; padding-block: 2rem 2.5rem; border-top: 1px solid var(--line); color: var(--muted); font-size: .85rem; }
    footer p + p { margin-top: .7rem; }
    @media (max-width: 46rem) {
      .shell { width: min(100% - 2rem, 70rem); }
      .masthead { align-items: flex-start; flex-direction: column; gap: 1rem; }
      .hero { padding-block: 2.8rem 2.2rem; }
      .connection, .details, .contact { grid-template-columns: 1fr; gap: 1.4rem; }
      .grid { grid-template-columns: 1fr; }
      .card { padding: 1.15rem; }
      th, td { padding: .8rem; }
      th { width: 30%; }
    }
    @media print {
      body { background: white; font-size: 10pt; }
      .shell { width: 100%; }
      nav, .skip { display: none; }
      .hero { padding-block: 1.5rem; }
      section { padding-block: 1.3rem; }
      .endpoint { background: white; color: black; border: 1px solid var(--line); }
      .endpoint p { color: black; }
      .card, tr { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <div class="shell">
    <header class="masthead">
      <div class="brand"><img src="/sf-transit/icon.png" width="52" height="52" alt=""><span>SF Bay Area Transit MCP<small>Connection guide</small></span></div>
      <nav aria-label="Page sections"><a href="#connect">Connect</a><a href="#journeys">Plan a trip</a><a href="#admin">IT review</a><a href="#help">Get help</a></nav>
    </header>
    <main id="main">
      <div class="hero">
        <p class="eyebrow">San Francisco &amp; the Bay Area</p>
        <h1>Your next journey, with your AI agent.</h1>
        <p class="lead">Connect an MCP-compatible AI agent to plan Bay Area trips. Ask how to get there and compare journeys with walking, buses, trains, ferries, transfers, and departure and arrival times.</p>
        <span class="badge">Free to use · No API keys or authentication</span>
      </div>

      <section id="connect" aria-labelledby="connect-title">
        <h2 id="connect-title">Connect your AI agent</h2>
        <div class="connection">
          <ol>
            <li>Open your agent's MCP or connector settings and add a remote MCP server to connect to the hosted service.</li>
            <li>Name it <strong>SF Bay Area Transit MCP</strong> and paste the exact server URL shown here. Choose <strong>no authentication</strong> if asked.</li>
            <li>Enable the server's tools for your conversation or task, then ask your agent for a Bay Area trip.</li>
          </ol>
          <div class="endpoint"><div class="endpoint-label">Official hosted MCP URL</div><code>${endpoint}</code><p>Select and copy the complete URL, including <strong>/sf-transit/mcp</strong>, without a trailing slash.</p></div>
        </div>
        <p class="note">Remote MCP support, connection steps, and availability depend on your client and workspace. For local installation and client-specific guidance, use the <a href="https://github.com/czekaj/sf-transit-mcp#readme">installation guide</a>. IT administrators can review the <a href="#admin">data and permissions summary</a> below.</p>
      </section>

      <section id="journeys" aria-labelledby="journeys-title">
        <h2 id="journeys-title">Start with a place and a time</h2>
        <p class="section-intro">Tell your agent your starting point and destination. Leave the time out to depart now, or give a departure time or arrival deadline. Your agent may ask you to choose between matching places.</p>
        <div class="grid">
          <div class="card"><blockquote class="prompt">How do I get from the Ferry Building to Baker Beach, leaving now?</blockquote></div>
          <div class="card"><blockquote class="prompt">Plan a trip from Oakland City Center to SFO, arriving by 9 tomorrow morning.</blockquote></div>
          <div class="card"><blockquote class="prompt">Compare transit and cycling from Golden Gate Park to the Ferry Building, with at most one transfer.</blockquote></div>
        </div>
        <p class="note">In clients that support interactive MCP Apps, journeys appear as route cards and a detailed timeline. Other clients receive readable itineraries. Refresh requests an updated trip; opening route details uses the result already returned.</p>
      </section>

      <section aria-labelledby="tools-title">
        <h2 id="tools-title">Three tools, one journey</h2>
        <div class="grid">
          <article class="card"><h3>Find a place</h3><p>Search for a Bay Area address, landmark, or transit stop and choose the matching location.</p><code class="tool-name">search_places</code></article>
          <article class="card"><h3>Plan a journey</h3><p>Compare complete trips with walking legs, transfer waits, transport routes, and travel times. Request a wheelchair profile or walking and personal-bicycle comparisons.</p><code class="tool-name">plan_trip</code></article>
          <article class="card"><h3>Check service information</h3><p>Read the current time, coverage source, and service limitations without making a request to the routing provider.</p><code class="tool-name">get_service_info</code></article>
        </div>
      </section>

      <section aria-labelledby="expect-title">
        <h2 id="expect-title">Understand your itinerary</h2>
        <div class="details">
          <div><h3>Times and accessibility</h3><ul>
            <li>Times use the Bay Area's Pacific timezone, including daylight-saving changes.</li>
            <li><strong>Scheduled</strong> times come from a timetable. <strong>Live predictions</strong> are estimates; the provider does not report their age, so the label does not establish freshness.</li>
            <li>The wheelchair profile applies to walking and transfers. Vehicle accessibility may be unknown; check each transit leg. Source data does not establish current elevator operation or guarantee that every entrance and path is accessible.</li>
          </ul></div>
          <div><h3>Coverage and limits</h3><ul>
            <li>Available journeys depend on Transitous's current feeds and service availability.</li>
            <li>Walking legs connect places and stops; they are not turn-by-turn walking directions.</li>
            <li>This service does not provide fares, tickets or bookings, service alerts, or bike-share availability. Cycling comparisons use a personal bicycle.</li>
            <li>The community-run provider is intended for light, noncommercial use. See its <a href="https://transitous.org/api/">usage policy</a>.</li>
          </ul></div>
        </div>
      </section>

      <section id="admin" aria-labelledby="admin-title">
        <h2 id="admin-title">For IT administrators</h2>
        <table>
          <caption>Permissions and data handling for the hosted connector. Full details are in the linked policies.</caption>
          <tbody>
            <tr><th scope="row">Access and actions</th><td>Public endpoint with no authentication or API keys. The three tools are read-only: they search and return information. They do not book travel, take payments, or access files or a shell.</td></tr>
            <tr><th scope="row">Data sent to Transitous</th><td>Place-search text, origin and destination coordinates, requested travel times, transport modes, and route preferences, including wheelchair routing. Requests include an application identifier. <a href="https://transitous.org/privacy/">Transitous's policy</a> says logs of the connecting IP address, request time, URL, and User-Agent are kept for up to two days. For hosted use, that connection originates from the Worker; local use connects from the user's network.</td></tr>
            <tr><th scope="row">Application storage</th><td>No application database, saved profiles, or saved home addresses. Requests and displayed journeys are processed in memory. The usage budget retains numeric request timestamps without trip details or user identifiers.</td></tr>
            <tr><th scope="row">Client and conversation</th><td>Your MCP client receives tool inputs and results, including the original trip request used for refresh. Conversation retention and use are governed by that client's policies. A home address used for a search, or its coordinates used for routing, is sent to Transitous. Locations and accessibility preferences can be personal information.</td></tr>
            <tr><th scope="row">Hosting and logs</th><td>Cloudflare processes hosted requests and network metadata. Application code does not log trip inputs or results. Infrastructure logging may occur; retention for Cloudflare edge, security, and diagnostic records has not been verified. See <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare's privacy policy</a>.</td></tr>
            <tr><th scope="row">Interactive results</th><td>The itinerary view receives data through the MCP client. It loads no external map assets and does not poll in the background. Selecting Refresh makes another trip request.</td></tr>
            <tr><th scope="row">Local alternative</th><td>A local stdio installation contacts Transitous from the user's network and avoids the operator's hosted Worker. The MCP client and Transitous still receive trip data. Setup is in the <a href="https://github.com/czekaj/sf-transit-mcp#readme">README</a>.</td></tr>
          </tbody>
        </table>
        <div class="links"><a href="https://github.com/czekaj/sf-transit-mcp/blob/main/PRIVACY.md">Privacy policy</a><a href="https://github.com/czekaj/sf-transit-mcp/blob/main/SECURITY.md">Security policy</a><a href="https://github.com/czekaj/sf-transit-mcp/blob/main/SUPPORT.md">Support</a><a href="https://github.com/czekaj/sf-transit-mcp">Source code</a></div>
      </section>

      <section id="help" aria-labelledby="help-title">
        <h2 id="help-title">Get help</h2>
        <div class="contact">
          <div><p>For questions or ordinary bugs, email <a href="mailto:contact@reindexventures.com">contact@reindexventures.com</a> or open a <a href="https://github.com/czekaj/sf-transit-mcp/issues">GitHub issue</a>. Include your client, what happened, and a public-place example.</p><p>GitHub issues are public. Send security reports, privacy requests, and personal trip details by email.</p></div>
          <div><p>Created by <strong>Lucas Czekaj</strong>.<br>Operated and published by <strong>Reindex Ventures LLC</strong>.</p><p><a href="https://reindexventures.com/?utm_source=sf-transit-mcp">Visit Reindex Ventures</a> · <a href="https://github.com/czekaj/sf-transit-mcp#readme">Project documentation</a></p></div>
        </div>
      </section>
    </main>
    <footer>
      <p><a href="https://transitous.org/">Routing by Transitous</a> · <a href="https://transitous.org/sources/">Transitous data sources</a> · <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a> · <a href="https://511.org/">Bay Area data provided by 511.org</a></p>
      <p>Open-source software under the <a href="https://github.com/czekaj/sf-transit-mcp/blob/main/LICENSE">MIT license</a>. Transit and map data retain their own licenses.</p>
    </footer>
  </div>
</body>
</html>`;
}
