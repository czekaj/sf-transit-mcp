import { escapeHtml, GITHUB_ICON, renderPublicPage } from "./public-page.js";

/** Public connection guide and data-handling summary, with no client-side code. */
export function renderPublicDocs(mcpUrl: string): string {
  const endpoint = escapeHtml(mcpUrl);
  return renderPublicPage({
    title: "SF Bay Area Transit MCP",
    description:
      "Set up SF Bay Area Transit MCP, find transit routes with your AI agent, and review what information the service sends and stores.",
    content: `      <div class="hero">
        <div class="hero-copy">
        <p class="eyebrow">San Francisco &amp; the Bay Area</p>
        <h1><span>Plan Bay Area</span> <span>transit trips.</span></h1>
        <p class="lead">Find bus, train, and ferry routes with your AI agent. Compare departure times, transfers, and how long each trip takes.</p>
        <span class="badge">Free to use · No API keys or authentication</span>
        <div class="endpoint"><div class="endpoint-label">Official hosted MCP URL</div><code>${endpoint}</code><p>Paste into your app's MCP settings.</p></div>
        </div>
        <img class="hero-logo" src="/sf-transit/icon.png" width="432" height="432" alt="Golden Gate Bridge and streetcar logo">
      </div>

      <section aria-labelledby="agencies-title">
        <h2 id="agencies-title">Transit services</h2>
        <p class="section-intro">Transitous provides routing data for these Bay Area services and others:</p>
        <ul class="agencies">
          <li>BART</li><li>Muni</li><li>Caltrain</li><li>AC Transit</li><li>VTA</li><li>SamTrans</li><li>Golden Gate Transit</li><li>Golden Gate Ferry</li><li>SF Bay Ferry</li>
        </ul>
        <p class="section-intro">Routes and live estimates depend on the data currently available. <a href="https://transitous.org/sources/">View data sources</a>.</p>
      </section>

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
        <div class="links"><a href="/sf-transit/privacy">Privacy policy</a><a href="https://github.com/czekaj/sf-transit-mcp/blob/main/SECURITY.md">Security policy</a><a href="https://github.com/czekaj/sf-transit-mcp/blob/main/SUPPORT.md">Support</a><a href="https://github.com/czekaj/sf-transit-mcp">Source code</a></div>
      </section>

      <section id="help" aria-labelledby="help-title">
        <h2 id="help-title">Get help</h2>
        <div class="contact">
          <div><p>For questions or bugs, email <a href="mailto:contact@reindexventures.com">contact@reindexventures.com</a> or open a <a href="https://github.com/czekaj/sf-transit-mcp/issues">GitHub issue</a>. Say which AI app you use, what you did, and what happened. Include an example using public places.</p><p>GitHub issues are public. Send security reports, privacy requests, and personal trip details by email.</p></div>
          <div><p>Created by <strong>Lucas Czekaj</strong>.<br>Operated and published by <strong><a href="https://reindexventures.com/?utm_source=sf-transit-mcp">Reindex Ventures LLC</a></strong>.</p><div class="profile-links"><a href="https://x.com/0xLCZ" aria-label="Lucas Czekaj on X, 0xLCZ"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M18.9 2H22l-7.8 8.9L23.5 23h-7.4l-5.8-7.6L3.7 23H.5l8.6-9.8L.1 2h7.6l5.2 6.9L18.9 2Zm-1.3 18.9h2L6.6 4.1H4.4z"/></svg><span>@0xLCZ</span></a><a href="https://github.com/czekaj/sf-transit-mcp" aria-label="SF Bay Area Transit MCP on GitHub">${GITHUB_ICON}<span>sf-transit-mcp</span></a></div></div>
        </div>
      </section>`,
  });
}
