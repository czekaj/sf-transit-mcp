const GITHUB_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.4.7-4.1-1.4-4.1-1.4-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.6-1.4-5.6-6a4.7 4.7 0 0 1 1.3-3.2c-.1-.3-.6-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.9.1 3.2a4.7 4.7 0 0 1 1.3 3.2c0 4.6-2.8 5.7-5.6 6 .5.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z"/></svg>`;

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
  <meta name="description" content="Set up SF Bay Area Transit MCP, find transit routes with your AI agent, and review what information the service sends and stores.">
  <meta name="color-scheme" content="light">
  <title>SF Bay Area Transit MCP</title>
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
    nav { display: flex; flex-wrap: wrap; gap: .5rem 1.4rem; font-size: .92rem; }
    .repo-link { display: inline-flex; align-items: center; gap: .45rem; white-space: nowrap; }
    .repo-link svg { width: 1.1rem; height: 1.1rem; fill: currentColor; }
    .hero { display: grid; grid-template-columns: minmax(0, 1.15fr) minmax(0, .85fr); align-items: center; gap: clamp(2.5rem, 5vw, 4rem); padding-block: 4rem; }
    .hero-copy { min-width: 0; }
    .hero-logo { display: block; width: 100%; max-width: 27rem; height: auto; justify-self: center; border-radius: 20%; }
    .eyebrow { margin: 0 0 .8rem; color: var(--green); font-size: .82rem; font-weight: 750; letter-spacing: .11em; text-transform: uppercase; }
    h1 { margin: 0; font-size: clamp(3rem, 5.7vw, 4.75rem); line-height: 1.02; letter-spacing: -.045em; font-weight: 750; }
    h1 span { display: block; }
    .lead { margin: 1.4rem 0 1.2rem; max-width: 44ch; font-size: 1.2rem; line-height: 1.6; color: var(--muted); }
    .badge { display: inline-block; width: fit-content; padding: .25rem .75rem; border: 1px solid var(--line); border-radius: 2rem; background: var(--card); color: var(--green); font-size: .9rem; font-weight: 650; }
    .hero .endpoint { margin-top: 1.5rem; }
    section { padding-block: 2.3rem; border-top: 1px solid var(--line); }
    h2 { margin: 0 0 1rem; font-size: clamp(1.5rem, 3vw, 1.9rem); line-height: 1.25; letter-spacing: -.025em; }
    h3 { margin: 0 0 .55rem; font-size: 1.06rem; line-height: 1.4; }
    p { margin: 0 0 1rem; }
    p:last-child { margin-bottom: 0; }
    .section-intro { max-width: 49rem; color: var(--muted); }
    .endpoint { width: max-content; max-width: 100%; background: var(--green); color: #fffef9; border-radius: 1rem; padding: 1.1rem 1.3rem; }
    .endpoint-label { font-size: .85rem; font-weight: 650; margin-bottom: .65rem; }
    .endpoint code { display: block; font-size: .97rem; line-height: 1.7; overflow-wrap: anywhere; user-select: all; }
    .endpoint p { font-size: .86rem; margin-top: .65rem; color: #e0eadd; }
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
    .data-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .data-card { border-top: 4px solid var(--green); }
    .data-card ul { margin: .8rem 0 0; padding-left: 1.2rem; }
    .data-card li { margin-top: .35rem; }
    .data-label { display: flex; align-items: center; gap: .6rem; color: var(--green); }
    .data-label svg { width: 1.4rem; height: 1.4rem; flex: 0 0 auto; }
    .data-label h3 { margin: 0; }
    .retention { margin-top: 1.7rem; }
    .retention h3 { margin-bottom: .7rem; }
    .retention ul { margin: 0; padding-left: 1.2rem; }
    .feature { display: grid; grid-template-columns: .8fr 1.2fr; gap: 2rem; align-items: start; margin-top: 2rem; }
    .feature + .feature { padding-top: 2rem; border-top: 1px solid var(--line); }
    .feature figure { margin: 0; min-width: 0; }
    .feature img { display: block; width: 100%; height: auto; border: 1px solid var(--line); border-radius: 1rem; }
    .feature figcaption { color: var(--muted); margin-top: .65rem; font-size: .85rem; }
    .links { display: flex; flex-wrap: wrap; gap: .65rem 1.5rem; margin-top: 1.1rem; }
    .contact { display: grid; grid-template-columns: 1.2fr 1fr; gap: 2rem; }
    .profile-links { display: flex; flex-wrap: wrap; gap: .7rem 1.3rem; margin-top: 1rem; }
    .profile-links a { display: inline-flex; align-items: center; gap: .45rem; }
    .profile-links svg { width: 1.1rem; height: 1.1rem; fill: currentColor; }
    footer { margin-top: 1.5rem; padding-block: 2rem 2.5rem; border-top: 1px solid var(--line); color: var(--muted); font-size: .85rem; }
    footer p + p { margin-top: .7rem; }
    @media (max-width: 46rem) {
      .shell { width: min(100% - 2rem, 70rem); }
      .masthead { align-items: flex-start; flex-direction: column; gap: 1rem; }
      .hero { grid-template-columns: minmax(0, 1fr) 6.5rem; align-items: start; column-gap: 1rem; row-gap: 0; padding-block: 2.5rem; }
      .hero-copy { display: contents; }
      .hero-copy > * { grid-column: 1 / -1; }
      .hero-copy > h1 { grid-column: 1; font-size: clamp(2.1rem, 6vw, 3rem); line-height: 1.05; }
      .hero-copy > .eyebrow { font-size: .75rem; }
      .hero-logo { grid-column: 2; grid-row: 2; border-radius: 1rem; }
      .hero .lead { font-size: 1.06rem; }
      .details, .contact, .feature, .data-grid { grid-template-columns: 1fr; gap: 1.4rem; }
      .grid { grid-template-columns: 1fr; }
      .card { padding: 1.15rem; }
    }
    @media print {
      body { background: white; font-size: 10pt; }
      .shell { width: 100%; }
      nav, .skip { display: none; }
      .hero { padding-block: 1.5rem; }
      section { padding-block: 1.3rem; }
      .endpoint { background: white; color: black; border: 1px solid var(--line); }
      .endpoint p { color: black; }
      .card, figure { break-inside: avoid; }
    }
  </style>
</head>
<body>
  <a class="skip" href="#main">Skip to content</a>
  <div class="shell">
    <header class="masthead">
      <div class="brand"><img src="/sf-transit/icon.png" width="52" height="52" alt=""><span>SF Bay Area Transit MCP</span></div>
      <nav aria-label="Main navigation"><a href="#connect">Connect</a><a href="#journeys">Plan a trip</a><a href="#admin">IT review</a><a href="#help">Get help</a><a class="repo-link" href="https://github.com/czekaj/sf-transit-mcp" aria-label="View sf-transit-mcp on GitHub">${GITHUB_ICON}<span>GitHub</span></a></nav>
    </header>
    <main id="main">
      <div class="hero">
        <div class="hero-copy">
        <p class="eyebrow">San Francisco &amp; the Bay Area</p>
        <h1><span>Plan Bay Area</span> <span>transit trips.</span></h1>
        <p class="lead">Find bus, train, and ferry routes with your AI agent. Compare departure times, transfers, and how long each trip takes.</p>
        <span class="badge">Free to use · No API keys or authentication</span>
        <div class="endpoint"><div class="endpoint-label">Official hosted MCP URL</div><code>${endpoint}</code><p>Paste into your app's MCP settings.</p></div>
        </div>
        <img class="hero-logo" src="/sf-transit/icon.png" width="432" height="432" alt="Golden Gate Bridge and streetcar logo">
      </div>

      <section id="connect" aria-labelledby="connect-title">
        <h2 id="connect-title">Connect your AI agent</h2>
          <ol>
            <li>Open your AI app's MCP or connector settings and add a remote MCP server.</li>
            <li>Name it <strong>SF Bay Area Transit MCP</strong> and paste the official URL above. Choose <strong>no authentication</strong> if asked.</li>
            <li>Enable the three tools, then ask for a trip between two Bay Area places.</li>
          </ol>
        <p class="note">Your AI app must support remote MCP servers. Setup steps and work-account restrictions depend on the app. For local installation, use the <a href="https://github.com/czekaj/sf-transit-mcp#readme">README</a>.</p>
      </section>

      <section id="journeys" aria-labelledby="journeys-title">
        <h2 id="journeys-title">Example requests</h2>
        <p class="section-intro">Give a starting place and destination. Say when you want to leave or arrive. If you do not specify a time, the service plans a trip leaving now.</p>
        <div class="grid">
          <div class="card"><blockquote class="prompt">How do I get from the Ferry Building to Baker Beach, leaving now?</blockquote></div>
          <div class="card"><blockquote class="prompt">Plan a trip from Oakland City Center to SFO, arriving by 9 tomorrow morning.</blockquote></div>
          <div class="card"><blockquote class="prompt">Compare transit and cycling from Golden Gate Park to the Ferry Building, with at most one transfer.</blockquote></div>
        </div>
        <div class="feature">
          <div><h3>Compare routes</h3><p>See departure and arrival times, total travel time, time spent walking, and how many times you need to change vehicles. Select a route to see its steps.</p><p>These interactive displays require an AI app that supports MCP Apps. Other apps receive the same trip information as text.</p></div>
          <figure><a href="/sf-transit/screenshots/route-options.png" aria-label="View route comparison screenshot at full size"><img src="/sf-transit/screenshots/route-options.png" width="1464" height="1040" loading="lazy" alt="Claude showing three route choices from the Ferry Building to Baker Beach, including travel time, walking time, and transfers"></a><figcaption>Route comparison in Claude. The times shown are from this example, not a current travel recommendation. Select the image to view it at full size.</figcaption></figure>
        </div>
        <div class="feature">
          <div><h3>Read each step</h3><p>See where to walk, where to board, which service to take, and where to get off. Times and durations are shown for each step.</p><p>Select <strong>Refresh</strong> to request updated routes. Selecting a route or opening its details does not make another trip request.</p></div>
          <figure><a href="/sf-transit/screenshots/journey-details.png" aria-label="View trip steps screenshot at full size"><img src="/sf-transit/screenshots/journey-details.png" width="1464" height="1090" loading="lazy" alt="Claude showing the walking and bus instructions for the selected route to Baker Beach"></a><figcaption>Trip steps in Claude, cropped from the same example. Select the image to view it at full size.</figcaption></figure>
        </div>
      </section>

      <section aria-labelledby="tools-title">
        <h2 id="tools-title">Available tools</h2>
        <div class="grid">
          <article class="card"><h3>Find a place</h3><p>Search for a Bay Area address, landmark, or transit stop and choose the matching location.</p><code class="tool-name">search_places</code></article>
          <article class="card"><h3>Plan a trip</h3><p>Get routes, departure and arrival times, where to walk, and where to change vehicles. Compare transit with walking or riding your own bicycle. You can also request wheelchair routing.</p><code class="tool-name">plan_trip</code></article>
          <article class="card"><h3>Check service information</h3><p>Read the current time, data sources, and service limits. This tool does not contact Transitous, the service that calculates routes.</p><code class="tool-name">get_service_info</code></article>
        </div>
      </section>

      <section aria-labelledby="expect-title">
        <h2 id="expect-title">Times, accessibility, and limits</h2>
        <div class="details">
          <div><h3>Times and accessibility</h3><ul>
            <li>All times are Pacific time, including daylight-saving changes.</li>
            <li><strong>Scheduled</strong> times come from a timetable. <strong>Live estimates</strong> come from agency predictions. The data does not say when those estimates were last updated.</li>
            <li>The wheelchair option changes walking routes and paths between stops. Vehicle accessibility may be unknown; check each bus, train, or ferry in your result. The service does not verify elevator operation or entrance accessibility.</li>
          </ul></div>
          <div><h3>Coverage and limits</h3><ul>
            <li>Routes depend on the data supplied by transit agencies and whether Transitous is available.</li>
            <li>Walking instructions show the places and stops to walk between. They do not include directions for every street or turn.</li>
            <li>This service does not provide fares, tickets or bookings, service alerts, or bike-share availability. Cycling comparisons use a personal bicycle.</li>
            <li>Transitous is run by a community and permits light, noncommercial use. See its <a href="https://transitous.org/api/">usage policy</a>.</li>
          </ul></div>
        </div>
      </section>

      <section id="admin" aria-labelledby="admin-title">
        <h2 id="admin-title">Data and permissions</h2>
        <p class="section-intro">For users and IT administrators reviewing the hosted service.</p>
        <div class="data-grid">
          <article class="card data-card"><div class="data-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M5 19 19 5M5 5h14v14"/></svg><h3>Sent to Transitous</h3></div><ul><li>Place names or addresses you search for.</li><li>Map coordinates of your starting point and destination.</li><li>Departure or arrival time.</li><li>Transport choices and the wheelchair routing option.</li><li>This service's name and version.</li></ul></article>
          <article class="card data-card"><div class="data-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg><h3>Kept temporarily by this service</h3></div><ul><li>Request details and results while answering your request.</li><li>Times of recent requests to enforce usage limits, without trip details or user identifiers.</li></ul></article>
          <article class="card data-card"><div class="data-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M4 4h16v16H4zM4 4l16 16"/></svg><h3>Not saved by this software</h3></div><ul><li>Home-address profiles.</li><li>Search or trip history.</li><li>Trip requests or results in a database or application log.</li></ul></article>
          <article class="card data-card"><div class="data-label"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true"><path d="M12 3 4 6v6c0 5 8 9 8 9s8-4 8-9V6l-8-3ZM8 12l3 3 5-6"/></svg><h3>Actions the tools cannot take</h3></div><ul><li>Book trips, buy tickets, or make payments.</li><li>Read your files, email, or chat history.</li><li>Run commands or change your accounts.</li></ul></article>
        </div>
        <div class="retention"><h3>What other services may keep</h3><ul>
          <li><strong>Transitous</strong> logs the connecting IP address, request time, service identifier, and full request URL for up to two days. The URL can contain the locations and travel choices listed above. <a href="https://transitous.org/privacy/">Transitous privacy policy</a>.</li>
          <li><strong>Your AI app</strong> receives the request and results. It may save them with your conversation under its own settings and privacy policy.</li>
          <li><strong>Cloudflare</strong> hosts this service and processes requests and connection information. It may keep security and diagnostic records. We have not verified how long it keeps those records. <a href="https://www.cloudflare.com/privacypolicy/">Cloudflare privacy policy</a>.</li>
        </ul></div>
        <p class="note">If you use your home address in a search, that address or its map coordinates are sent to Transitous. Locations and wheelchair preferences can be personal information.</p>
        <div class="links"><a href="https://github.com/czekaj/sf-transit-mcp/blob/main/PRIVACY.md">Privacy policy</a><a href="https://github.com/czekaj/sf-transit-mcp/blob/main/SECURITY.md">Security policy</a><a href="https://github.com/czekaj/sf-transit-mcp/blob/main/SUPPORT.md">Support</a><a href="https://github.com/czekaj/sf-transit-mcp">Source code</a></div>
      </section>

      <section id="help" aria-labelledby="help-title">
        <h2 id="help-title">Get help</h2>
        <div class="contact">
          <div><p>For questions or bugs, email <a href="mailto:contact@reindexventures.com">contact@reindexventures.com</a> or open a <a href="https://github.com/czekaj/sf-transit-mcp/issues">GitHub issue</a>. Say which AI app you use, what you did, and what happened. Include an example using public places.</p><p>GitHub issues are public. Send security reports, privacy requests, and personal trip details by email.</p></div>
          <div><p>Created by <strong>Lucas Czekaj</strong>.<br>Operated and published by <strong><a href="https://reindexventures.com/?utm_source=sf-transit-mcp">Reindex Ventures LLC</a></strong>.</p><div class="profile-links"><a href="https://x.com/0xLCZ" aria-label="Lucas Czekaj on X, 0xLCZ"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 2H22l-7.8 8.9L23.5 23h-7.4l-5.8-7.6L3.7 23H.5l8.6-9.8L.1 2h7.6l5.2 6.9L18.9 2Zm-1.3 18.9h2L6.6 4.1H4.4z"/></svg><span>@0xLCZ</span></a><a href="https://github.com/czekaj/sf-transit-mcp" aria-label="SF Bay Area Transit MCP on GitHub">${GITHUB_ICON}<span>sf-transit-mcp</span></a></div></div>
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
