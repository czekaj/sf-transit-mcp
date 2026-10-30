import { PRIVACY_HTML } from "./generated/privacy.js";
import { renderPublicPage } from "./public-page.js";

/** The policy body is generated from PRIVACY.md during the build. */
export function renderPublicPrivacy(): string {
  return renderPublicPage({
    title: "Privacy policy | SF Bay Area Transit MCP",
    description:
      "How SF Bay Area Transit MCP and its providers handle place searches, trip requests, and privacy questions.",
    content: `<article class="policy">
      <a class="back-link" href="/sf-transit">← Back to documentation</a>
      ${PRIVACY_HTML}
      <p class="policy-source"><a href="https://github.com/czekaj/sf-transit-mcp/blob/main/PRIVACY.md">Read this policy on GitHub</a></p>
    </article>`,
  });
}
