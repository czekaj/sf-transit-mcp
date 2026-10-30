export const GITHUB_ICON = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 .3a12 12 0 0 0-3.8 23.4c.6.1.8-.3.8-.6v-2.2c-3.4.7-4.1-1.4-4.1-1.4-.5-1.4-1.3-1.7-1.3-1.7-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1.1 1.8 2.8 1.3 3.5 1 .1-.8.4-1.3.8-1.6-2.7-.3-5.6-1.4-5.6-6a4.7 4.7 0 0 1 1.3-3.2c-.1-.3-.6-1.6.1-3.2 0 0 1-.3 3.3 1.2a11.5 11.5 0 0 1 6 0c2.3-1.5 3.3-1.2 3.3-1.2.7 1.6.2 2.9.1 3.2a4.7 4.7 0 0 1 1.3 3.2c0 4.6-2.8 5.7-5.6 6 .5.4.8 1.1.8 2.2v3.2c0 .3.2.7.8.6A12 12 0 0 0 12 .3Z"/></svg>`;

export function escapeHtml(value: string): string {
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

/** Shared layout for the public guide and policy pages. HTML content is trusted repository content. */
export function renderPublicPage({
  title,
  description,
  content,
}: {
  title: string;
  description: string;
  content: string;
}): string {
  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <meta name="description" content="${escapeHtml(description)}">
  <meta name="color-scheme" content="light">
  <title>${escapeHtml(title)}</title>
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
    .agencies { display: flex; flex-wrap: wrap; gap: .65rem; list-style: none; margin: 1.2rem 0; padding: 0; }
    .agencies li { margin: 0; padding: .4rem .9rem; border: 1px solid var(--line); border-radius: .6rem; background: var(--card); font-weight: 650; }
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
    .policy { max-width: 48rem; margin-inline: auto; padding-block: 3rem; overflow-wrap: anywhere; }
    .policy .back-link { display: inline-block; margin-bottom: 1.5rem; }
    .policy h1 { margin-bottom: 1rem; font-size: clamp(2.5rem, 5vw, 3.5rem); line-height: 1.1; }
    .policy h2 { margin-top: 2rem; }
    .policy ul { padding-left: 1.3rem; }
    .policy code { font-size: .9em; }
    .policy-source { margin-top: 2rem; padding-top: 1rem; border-top: 1px solid var(--line); font-size: .9rem; }
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
      <nav aria-label="Main navigation"><a href="/sf-transit#connect">Connect</a><a href="/sf-transit#journeys">Plan a trip</a><a href="/sf-transit#admin">IT review</a><a href="/sf-transit#help">Get help</a><a class="repo-link" href="https://github.com/czekaj/sf-transit-mcp" aria-label="View sf-transit-mcp on GitHub">${GITHUB_ICON}<span>GitHub</span></a></nav>
    </header>
    <main id="main">
      ${content}
    </main>
    <footer>
      <p><a href="https://transitous.org/">Routing by Transitous</a> · <a href="https://transitous.org/sources/">Transitous data sources</a> · <a href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a> · <a href="https://511.org/">Bay Area data provided by 511.org</a></p>
      <p>Open-source software under the <a href="https://github.com/czekaj/sf-transit-mcp/blob/main/LICENSE">MIT license</a>. Transit and map data retain their own licenses.</p>
    </footer>
  </div>
</body>
</html>`;
}
