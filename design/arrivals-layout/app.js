const fixtures = {
  Caltrain: {
    stop: "San Francisco · 4th & King",
    subtitle: "Southbound departures",
    rows: [
      ["Local Weekend", "Tamien", "5:55 PM", true],
      ["Local Weekend", "San Jose Diridon", "6:25 PM", true, "6:22 PM"],
      ["Local Weekend", "Tamien", "6:55 PM", true],
      ["Local Weekend", "San Jose Diridon", "7:25 PM", false],
      ["Local Weekend", "Tamien", "7:55 PM", false],
    ],
  },
  BART: {
    stop: "Embarcadero",
    subtitle: "Departures from this station",
    rows: [
      ["Blue", "Dublin / Pleasanton", "5:55 PM", true],
      ["Green", "Berryessa", "6:25 PM", true, "6:22 PM"],
      ["Yellow", "San Francisco Airport", "6:55 PM", true],
      ["Blue", "Dublin / Pleasanton", "7:25 PM", false],
      ["Yellow", "San Francisco Airport", "7:55 PM", false],
    ],
  },
  Muni: {
    stop: "Embarcadero & Folsom",
    subtitle: "Departures from this stop",
    rows: [
      ["N Judah", "Ocean Beach", "5:55 PM", true],
      ["T Third Street", "Chinatown", "6:25 PM", true, "6:22 PM"],
      ["N Judah", "Ocean Beach", "6:55 PM", true],
      ["T Third Street", "Chinatown", "7:25 PM", false],
      ["N Judah", "Ocean Beach", "7:55 PM", false],
    ],
  },
};
let layout = "a";
let operator = "Caltrain";
function el(tag, className, value) {
  const node = document.createElement(tag);
  node.className = className;
  if (value !== undefined) node.textContent = value;
  return node;
}
function matrix(value, slots, className) {
  const outer = el("div", `matrix ${className}`);
  outer.setAttribute("aria-label", value);
  const grid = el("div", "tiles");
  grid.setAttribute("aria-hidden", "true");
  let line = "";
  const lines = [];
  for (const word of value.toUpperCase().split(/\s+/)) {
    if (line && line.length + word.length + 1 > slots) {
      lines.push(line);
      line = "";
    }
    line = line ? `${line} ${word}` : word;
  }
  if (line) lines.push(line);
  for (const text of lines) {
    const row = el("div", "tile-line");
    row.style.setProperty("--slots", slots);
    for (const char of text.padEnd(slots, " ")) {
      const cell = el("span", "tile");
      cell.append(el("span", "glyph", char === " " ? "\u00a0" : char));
      row.append(cell);
    }
    grid.append(row);
  }
  const plain = el("span", "plain", value);
  plain.setAttribute("aria-hidden", "true");
  outer.append(grid, plain);
  return outer;
}
function render() {
  const fixture = fixtures[operator];
  document.querySelector("#stop").textContent = fixture.stop;
  document.querySelector("#subtitle").textContent = fixture.subtitle;
  document.querySelector("#context").textContent = operator;
  document.querySelector("#direction-note").textContent =
    layout === "a"
      ? "A · Recommended. Keep service names in the board, with live or scheduled status beneath each departure."
      : "B · Put the destination first, with the full service name underneath. Keep timing together on the right.";
  const rows = document.querySelector("#rows");
  rows.replaceChildren();
  rows.dataset.layout = layout;
  const head = el("div", "column-head");
  for (const label of layout === "a"
    ? ["Service", "Destination", "Departs"]
    : ["Destination", "Departs"])
    head.append(el("span", "", label));
  rows.append(head);
  for (const [service, destination, time, live, scheduled] of fixture.rows) {
    const row = el("div", "departure-row");
    const name = matrix(service, 13, "service");
    if (operator === "BART")
      name.style.color = {
        Blue: "#71bdf4",
        Green: "#80d280",
        Yellow: "#f5db61",
      }[service];
    const place = matrix(destination, 22, "destination");
    if (layout === "b") {
      const full = el("div", "full-service", service);
      if (operator === "BART") full.style.color = name.style.color;
      place.append(full);
    }
    const timing = el("div", `timing${live ? " live" : ""}`);
    const exact = matrix(time, 8, "exact-time");
    timing.append(
      exact,
      el("div", `status${live ? " live" : ""}`, live ? "Live" : "Scheduled"),
    );
    if (scheduled && scheduled !== time) {
      const reference = el("div", "scheduled-reference");
      reference.append(el("span", "", "Scheduled"), el("span", "", scheduled));
      timing.append(reference);
    }
    if (layout === "a") row.append(name);
    row.append(place, timing);
    rows.append(row);
  }
}
for (const button of document.querySelectorAll("[data-layout]"))
  button.addEventListener("click", () => {
    layout = button.dataset.layout;
    document
      .querySelectorAll("button[data-layout]")
      .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
    render();
  });
for (const button of document.querySelectorAll("[data-theme]"))
  button.addEventListener("click", () => {
    document.documentElement.dataset.theme = button.dataset.theme;
    document
      .querySelectorAll("button[data-theme]")
      .forEach((b) => b.setAttribute("aria-pressed", String(b === button)));
  });
document.querySelector("#operator").addEventListener("change", (event) => {
  operator = event.target.value;
  render();
});
document.querySelector("#narrow").addEventListener("click", (event) => {
  const button = event.currentTarget;
  const narrow = button.getAttribute("aria-pressed") !== "true";
  button.setAttribute("aria-pressed", String(narrow));
  document.querySelector("#preview").classList.toggle("narrow", narrow);
});
render();
