const params = new URLSearchParams(window.location.search);
const allowedViews = ["bart", "muni", "trip"];
let view = allowedViews.includes(params.get("view"))
  ? params.get("view")
  : "bart";
let theme = params.get("theme") === "dark" ? "dark" : "light";
let bartDirection = "all";
let muniDirection = "ocean";
let muniRoute = "N";
let boardOpen = false;
let selectedTrip = 0;
const app = document.querySelector("#app");
const status = document.querySelector("#preview-status");

const icons = {
  refresh: '<path d="M19 8a7 7 0 1 0 1 7M19 3v5h-5"/>',
  arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
  chevron: '<path d="m6 9 6 6 6-6"/>',
  check: '<path d="m5 12 4 4L19 6"/>',
  walk: '<circle cx="13" cy="4" r="2"/><path d="m9 21 2-7 3 3 1 4M6 12l3-5 4 1 2 4 3 1M9 7l2 7"/>',
  bus: '<rect x="5" y="3" width="14" height="16" rx="3"/><path d="M5 11h14M8 19v2m8-2v2M9 6h6"/><path d="M8.5 15h.01m6.99 0h.01"/>',
  train:
    '<rect x="5" y="3" width="14" height="15" rx="4"/><path d="M5 11h14M9 7h6M8 21l2-3m6 3-2-3M8.5 14h.01m6.99 0h.01"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
};
const icon = (name) =>
  `<svg aria-hidden="true" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${icons[name]}</svg>`;
const brand = (context) =>
  `<div class="brand-label"><img class="brand-icon" src="/assets/icon-256.png" alt="" width="30" height="30"><p class="eyebrow">SF Bay Area Transit MCP</p><span class="brand-divider"></span><span class="brand-context">${context}</span></div>`;
const escapeHtml = (text) =>
  text.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
const flapText = (text) =>
  `<span class="sr-only">${escapeHtml(text)}</span><span class="flap-words" aria-hidden="true">${text
    .toUpperCase()
    .split(" ")
    .map(
      (word) =>
        `<span class="flap-word">${Array.from(word)
          .map(
            (character) =>
              `<span class="flap-character">${escapeHtml(character)}</span>`,
          )
          .join("")}</span>`,
    )
    .join("")}</span>`;
const matrixText = (text, slots, accessibleText = text) =>
  `<span class="sr-only">${escapeHtml(accessibleText)}</span><span class="matrix-mobile" aria-hidden="true">${escapeHtml(text)}</span><span class="matrix-text" aria-hidden="true">${Array.from(
    text.toUpperCase().padEnd(slots, " "),
  )
    .map(
      (character) =>
        `<span class="matrix-cell"><span class="matrix-glyph">${character === " " ? "&nbsp;" : escapeHtml(character)}</span></span>`,
    )
    .join("")}</span>`;
const tag = (live) =>
  `<span class="timing-tag${live ? " live" : ""}">${live ? "Live estimate" : "Scheduled"}</span>`;
const refresh = (scope = "board") =>
  `<button class="button" type="button" data-refresh="${scope}" aria-label="Refresh ${scope === "trip-stop" ? "departures at Sacramento Street and Davis Street" : "departures"}">${icon("refresh")}<span>Refresh</span></button>`;
const legend = () =>
  `<div class="legend"><span class="legend-item live"><i class="dot live" aria-hidden="true"></i>LIVE · live estimate from real-time data</span><span class="legend-item scheduled">SCHEDULED · timetable only</span></div>`;
const credits = () =>
  `<div class="credits"><span>Data:</span><span class="source">Transitous</span><span>·</span><span class="source">511</span><span>·</span><span class="source">OpenStreetMap</span></div>`;
const footer = () =>
  `${legend()}<footer class="widget-footer">${credits()}<span class="time-zone">All times PDT</span></footer>`;
const pill = (mode, text = "") =>
  `<span class="route-pill ${mode === "walk" ? "street" : ""}">${icon(mode)}${text ? `<span>${text}</span>` : ""}</span>`;

const bartRows = [
  {
    line: "Blue",
    destination: "Daly City",
    minutes: 3,
    time: "5:03 PM",
    live: true,
    direction: "sf",
  },
  {
    line: "Green",
    destination: "Berryessa",
    minutes: 7,
    time: "5:07 PM",
    live: true,
    direction: "east",
  },
  {
    line: "Yellow",
    destination: "Antioch",
    minutes: 10,
    time: "5:10 PM",
    live: true,
    direction: "east",
  },
  {
    line: "Green",
    destination: "Daly City",
    minutes: 13,
    time: "5:13 PM",
    live: false,
    direction: "sf",
  },
  {
    line: "Yellow",
    destination: "San Francisco Airport",
    minutes: 18,
    time: "5:18 PM",
    live: true,
    direction: "sf",
  },
];
const muniRows = [
  {
    route: "N",
    destination: "Ocean Beach",
    minutes: 3,
    time: "5:03 PM",
    live: false,
    direction: "ocean",
  },
  {
    route: "N",
    destination: "Ocean Beach",
    minutes: 8,
    time: "5:08 PM",
    live: true,
    scheduled: "5:10 PM",
    direction: "ocean",
  },
  {
    route: "N",
    destination: "Ocean Beach",
    minutes: 15,
    time: "5:15 PM",
    live: true,
    direction: "ocean",
  },
  {
    route: "N",
    destination: "Ocean Beach",
    minutes: 24,
    time: "5:24 PM",
    live: true,
    direction: "ocean",
  },
  {
    route: "N",
    destination: "Caltrain",
    minutes: 5,
    time: "5:05 PM",
    live: true,
    direction: "caltrain",
  },
  {
    route: "N",
    destination: "Caltrain",
    minutes: 19,
    time: "5:19 PM",
    live: false,
    direction: "caltrain",
  },
];

function departureRows(rows, muni = false) {
  return `<section class="flap-board matrix-board" aria-label="Upcoming departures"><div class="matrix-title"><h2>${muni ? "Muni" : "BART"} departures</h2><div class="board-clock"><span>5:00 <small>PM</small></span><span class="board-clock-label">Retrieved · PDT</span></div></div><div class="departures-head" aria-hidden="true"><span>Line</span><span>Destination</span><span>Status</span><span>Departing</span></div><div class="departures-list">${rows
    .map(
      (row) => `<div class="departure-row">
    <div class="matrix-line${muni ? "" : ` line-${row.line.toLowerCase()}`}">${matrixText(muni ? "N" : row.line, 6, muni ? "N Judah" : `${row.line} line`)}</div>
    <div class="matrix-destination">${matrixText(row.destination, 22)}${row.scheduled ? `<span class="scheduled-reference">Scheduled ${row.scheduled}</span>` : ""}</div>
    <div class="matrix-status ${row.live ? "is-live" : "is-scheduled"}">${matrixText(row.live ? "LIVE" : "SCHEDULED", 9, row.live ? "Live estimate" : "Scheduled")}</div>
    <div class="matrix-departure${row.live ? " is-live" : ""}">${matrixText(row.time.padStart(8, "0"), 8)}</div>
  </div>`,
    )
    .join("")}</div></section>`;
}

function renderBart() {
  const rows = bartRows.filter(
    (row) => bartDirection === "all" || row.direction === bartDirection,
  );
  return `${brand("Departures")}<h1>Embarcadero</h1><p class="subtitle">BART <span class="separator">·</span> Saturday, October 31</p>
  <div class="board-meta"><p class="retrieved">Retrieved 5:00 PM PDT</p>${refresh()}</div>
  <div class="filters" aria-label="Direction"><span class="filter-label">Direction</span>${[
    ["all", "All directions"],
    ["sf", "San Francisco & Peninsula"],
    ["east", "East Bay"],
  ]
    .map(
      ([id, label]) =>
        `<button type="button" class="filter-button" data-direction="${id}" aria-pressed="${bartDirection === id}">${label}</button>`,
    )
    .join("")}</div>
  ${departureRows(rows)}${footer()}`;
}

function renderMuni() {
  const rows = muniRows.filter(
    (row) =>
      row.direction === muniDirection &&
      (muniRoute === "all" || row.route === muniRoute),
  );
  return `${brand("Departures")}<h1>Judah & 9th Avenue</h1><p class="subtitle">Muni <span class="separator">·</span> Saturday, October 31</p>
  <div class="board-meta"><p class="retrieved">Retrieved 5:00 PM PDT</p>${refresh()}</div>
  <div class="select-filters"><div class="select-field"><label for="route-filter">Route</label><select id="route-filter"><option value="N"${muniRoute === "N" ? " selected" : ""}>N Judah</option><option value="all"${muniRoute === "all" ? " selected" : ""}>All routes</option></select></div><div class="select-field"><label for="direction-filter">Direction</label><select id="direction-filter"><option value="ocean"${muniDirection === "ocean" ? " selected" : ""}>Toward Ocean Beach</option><option value="caltrain"${muniDirection === "caltrain" ? " selected" : ""}>Toward Caltrain</option></select></div></div>
  ${!rows[0]?.live ? '<p class="board-note"><strong>Next departure is scheduled.</strong> Live estimates are available for later trains.</p>' : ""}
  ${departureRows(rows, true)}${footer()}`;
}

const trips = [
  {
    minutes: 62,
    start: "5:04 PM",
    end: "6:06 PM",
    walk: "22 min walk",
    stats: "No transfers",
    routes: ["1"],
    basis: "Includes live estimates",
  },
  {
    minutes: 68,
    start: "5:02 PM",
    end: "6:10 PM",
    walk: "16 min walk",
    stats: "1 transfer",
    routes: ["1", "29"],
    basis: "Includes live estimates",
  },
  {
    minutes: 89,
    start: "5:00 PM",
    end: "6:29 PM",
    walk: "89 min walk",
    stats: "Walking only",
    routes: [],
    basis: "Estimated walking time",
  },
];

function tripCards() {
  return `<div class="route-grid" aria-label="Trip options">${trips.map((trip, index) => `<button type="button" class="route-card${selectedTrip === index ? " is-selected" : ""}" data-trip="${index}" aria-pressed="${selectedTrip === index}"><div class="card-top"><span class="option-label">Option ${index + 1}</span><span class="selection-mark">${icon("check")}</span></div><div class="duration"><strong>${trip.minutes}</strong> min</div><div class="card-times">${trip.start} – ${trip.end}</div><div class="route-sequence">${pill("walk")}${trip.routes.map((route) => `<span class="arrow">›</span>${pill("bus", route)}`).join("")}${trip.routes.length ? `<span class="arrow">›</span>${pill("walk")}` : ""}</div><div class="card-stats">${trip.stats} · ${trip.walk}</div><div class="card-basis">${trip.basis}</div></button>`).join("")}</div>`;
}

function inlineBoard() {
  return `<button type="button" class="button inline-toggle" id="stop-departures-toggle" aria-controls="stop-departures" aria-expanded="${boardOpen}">${icon("clock")}Next departures at this stop${icon("chevron")}</button>
  <section class="inline-board" id="stop-departures" aria-label="Next departures at Sacramento Street and Davis Street"${boardOpen ? "" : " hidden"}>
  <div class="inline-board-header"><h3 class="inline-board-title">Sacramento St & Davis St</h3><p class="inline-board-direction">1 California · toward Geary + 33rd Avenue</p></div>
  <div class="board-meta"><p class="retrieved">Retrieved 5:00 PM PDT</p>${refresh("trip-stop")}</div>
  <div class="inline-departures">${[
    ["5:11 PM", true],
    ["5:23 PM", true],
    ["5:31 PM", false],
  ]
    .map(
      ([time, live]) =>
        `<div class="inline-departure"><span class="inline-time${live ? " is-live" : ""}">${matrixText(time.padStart(8, "0"), 8)}</span>${tag(live)}</div>`,
    )
    .join("")}</div>
  <div class="inline-board-foot">Departures for this stop and direction.</div></section>`;
}

function timeline() {
  if (selectedTrip === 2)
    return `<ol class="timeline"><li class="timeline-leg"><div class="leg-time">5:00 PM</div><div class="leg-body"><div class="leg-heading">${pill("walk", "Walk")}<span class="leg-duration">89 min</span></div><p class="stop-line"><span>From</span> Ferry Building</p><p class="stop-line"><span>To</span> Baker Beach</p></div></li><li class="timeline-leg"><div class="leg-time">6:29 PM</div><div class="leg-body"><div class="arrive-label">Arrive at Baker Beach</div></div></li></ol>`;
  if (selectedTrip === 1)
    return `<ol class="timeline"><li class="timeline-leg"><div class="leg-time">5:02 PM</div><div class="leg-body"><div class="leg-heading">${pill("walk", "Walk")}<span class="leg-duration">7 min</span></div><p class="stop-line"><span>From</span> Ferry Building</p><p class="stop-line"><span>To</span> Sacramento St & Davis St</p></div></li><li class="timeline-leg"><div class="leg-time">5:11 PM</div><div class="leg-body"><div class="leg-heading">${pill("bus", "1 California")}<span class="leg-duration">30 min</span></div><p class="leg-direction">Toward Geary + 33rd Avenue</p><p class="stop-line">Sacramento St & Davis St → California St & 25th Ave</p><p class="leg-basis">${tag(true)}</p>${inlineBoard()}</div></li><li class="timeline-leg"><div class="leg-time">5:49 PM</div><div class="leg-body"><div class="leg-heading">${pill("bus", "29 Sunset")}<span class="leg-duration">12 min</span></div><p class="leg-direction">Toward Baker Beach</p><p class="stop-line">25th Ave & California St → Bowley St & Lincoln Blvd</p><p class="leg-basis">${tag(true)}</p></div></li><li class="timeline-leg"><div class="leg-time">6:01 PM</div><div class="leg-body"><div class="leg-heading">${pill("walk", "Walk")}<span class="leg-duration">9 min</span></div><p class="stop-line"><span>To</span> Baker Beach</p></div></li><li class="timeline-leg"><div class="leg-time">6:10 PM</div><div class="leg-body"><div class="arrive-label">Arrive at Baker Beach</div></div></li></ol>`;
  return `<ol class="timeline"><li class="timeline-leg"><div class="leg-time">5:04 PM</div><div class="leg-body"><div class="leg-heading">${pill("walk", "Walk")}<span class="leg-duration">7 min</span></div><p class="stop-line"><span>From</span> Ferry Building</p><p class="stop-line"><span>To</span> Sacramento St & Davis St</p></div></li>
  <li class="timeline-leg"><div class="leg-time">5:11 PM</div><div class="leg-body"><div class="leg-heading">${pill("bus", "1 California")}<span class="leg-duration">40 min</span></div><p class="leg-direction">Toward Geary + 33rd Avenue</p><p class="stop-line"><span>Board</span> Sacramento St & Davis St</p><p class="stop-line"><span>Get off</span> California St & 25th Ave</p><p class="leg-basis">${tag(true)}</p>${inlineBoard()}</div></li>
  <li class="timeline-leg"><div class="leg-time">5:51 PM</div><div class="leg-body"><div class="leg-heading">${pill("walk", "Walk")}<span class="leg-duration">15 min</span></div><p class="stop-line"><span>From</span> California St & 25th Ave</p><p class="stop-line"><span>To</span> Baker Beach</p></div></li><li class="timeline-leg"><div class="leg-time">6:06 PM</div><div class="leg-body"><div class="arrive-label">Arrive at Baker Beach</div></div></li></ol>`;
}

function renderTrip() {
  return `${brand("Trip options")}<h1 class="trip-heading"><span>Ferry Building</span>${icon("arrow")}<span>Baker Beach</span></h1><p class="subtitle trip-subtitle">Depart after 5:00 PM <span class="separator">·</span> Saturday, October 31</p>
  ${tripCards()}<section class="journey-details" aria-label="Selected trip"><div class="details-heading"><h2>Option ${selectedTrip + 1} · Journey details</h2><span>${trips[selectedTrip].minutes} min total</span></div><p class="departure-summary">${selectedTrip === 2 ? "Walk from Ferry Building at 5:00 PM. Arrive at 6:29 PM." : `Leave Ferry Building at ${trips[selectedTrip].start}. Arrive at ${trips[selectedTrip].end}.`}</p>${timeline()}</section>
  <div class="trip-footer"><p class="trip-retrieved">Trip retrieved 4:58 PM PDT</p>${footer()}</div>`;
}

function updatePreviewControls() {
  document.documentElement.dataset.theme = theme;
  document
    .querySelectorAll("[data-view]")
    .forEach((button) =>
      button.setAttribute("aria-pressed", String(button.dataset.view === view)),
    );
  document
    .querySelectorAll("button[data-theme]")
    .forEach((button) =>
      button.setAttribute(
        "aria-pressed",
        String(button.dataset.theme === theme),
      ),
    );
  const query = new URLSearchParams({ view, theme });
  window.history.replaceState({}, "", `${window.location.pathname}?${query}`);
}
function render() {
  updatePreviewControls();
  app.innerHTML =
    view === "muni"
      ? renderMuni()
      : view === "trip"
        ? renderTrip()
        : renderBart();
}

document.addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;
  if (button.dataset.view) {
    view = button.dataset.view;
    status.textContent = "";
    render();
  } else if (button.dataset.theme) {
    theme = button.dataset.theme;
    updatePreviewControls();
  } else if (button.dataset.direction) {
    bartDirection = button.dataset.direction;
    render();
  } else if (button.dataset.trip !== undefined) {
    selectedTrip = Number(button.dataset.trip);
    boardOpen = false;
    render();
  } else if (button.id === "stop-departures-toggle") {
    boardOpen = !boardOpen;
    button.setAttribute("aria-expanded", String(boardOpen));
    document.querySelector("#stop-departures").hidden = !boardOpen;
  } else if (button.dataset.refresh) {
    status.textContent =
      button.dataset.refresh === "trip-stop"
        ? "Example stop departures reloaded. The trip itinerary has not changed."
        : "Example departures reloaded.";
    button.querySelector("span").textContent = "Refreshed";
    const display =
      button.closest(".inline-board") || app.querySelector(".flap-board");
    if (display) {
      display.classList.remove("is-flipping");
      void display.offsetWidth;
      display.classList.add("is-flipping");
    }
  }
});
document.addEventListener("change", (event) => {
  if (event.target.id === "route-filter") muniRoute = event.target.value;
  else if (event.target.id === "direction-filter")
    muniDirection = event.target.value;
  else return;
  render();
});
render();
