// Shared code for every page.

// ----- Shared helpers used by every chart file -----
// Each chart registers a draw function; all charts redraw when the window is resized.

const App = {
  charts: [],
  register(drawFn) {
    this.charts.push(drawFn);
    drawFn();
  },
  // True when the user asked the system for less motion
  reduceMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  fmtInt: d3.format(","),
  fmtPct: d3.format(".1f"),
  // Compact axis ticks: 0, 10K, 20K ...
  fmtK: (d) => (d === 0 ? "0" : d >= 1000 ? `${d / 1000}K` : `${d}`),
};

// ----- Chart colours (one fixed colour per entity, used on every page) -----
// Strong hues for the groups the story is about; greys for context groups.
App.COLORS = {
  Motorcyclist: "#eb6834",
  "Pedal cyclist": "#1baf7a",
  Pedestrian: "#6250d6",
  "Car occupant": "#a3acb7",
  Other: "#dde0e4",
  Male: "#2a78d6",
  Female: "#e87ba4",
  "First Nations people": "#c4572a",
  "Non-Indigenous": "#a3acb6",
  // Motorcyclists + pedal cyclists + pedestrians combined ("riders & walkers")
  vru: "#23272e",
  ink: "#23272e",
  slate: "#2e5f8a",
  paper: "#f6f5f1",
};

// Lighter tint of a colour (mixed toward the page background)
App.tint = (hex, k = 0.5) => d3.interpolateRgb(hex, App.COLORS.paper)(k);

// Horizontal bar as a path: 4px rounded data end, square at the baseline.
// end = "right" (bar grows right from x) or "left" (bar grows left, rounded at x).
App.barPath = function (x, y, w, h, end = "right") {
  if (!(w > 0)) return "";
  const r = Math.min(4, w, h / 2);
  if (end === "right") {
    return `M${x},${y}h${w - r}a${r},${r} 0 0 1 ${r},${r}v${h - 2 * r}a${r},${r} 0 0 1 ${-r},${r}h${-(w - r)}Z`;
  }
  return `M${x + w},${y}h${-(w - r)}a${r},${r} 0 0 0 ${-r},${r}v${h - 2 * r}a${r},${r} 0 0 0 ${r},${r}h${w - r}Z`;
};

// Bars are capped in thickness and centred in their band, so they never fill the slot
App.barBand = (band, cap = 24) => {
  const h = Math.min(cap, band.bandwidth());
  return { h, off: (band.bandwidth() - h) / 2 };
};

// =========================================================
// Tooltip: hover to preview, click (or Enter) to pin.
// A pinned tooltip stays open until you click anywhere or press Escape.
// =========================================================
const tooltip = d3.select("#tooltip");
App.pinned = null; // { el, onClose }

function placeTooltip(event) {
  const node = tooltip.node();
  if (!node || !event) return;
  const pad = 14;
  let x, y;
  const w0 = node.offsetWidth;
  if (event.clientX !== undefined && event.type !== "focus") {
    // Right half of the screen: open to the left of the cursor, so the
    // tooltip never covers the labels at the right edge of a chart
    x = event.clientX > window.innerWidth / 2 ? event.clientX - w0 - pad : event.clientX + pad;
    y = event.clientY + pad;
  } else if (event.target) {
    // Keyboard: place the tooltip next to the focused element
    const box = event.target.getBoundingClientRect();
    x = box.right + pad;
    y = box.top;
  }
  const w = node.offsetWidth, h = node.offsetHeight;
  if (x + w > window.innerWidth - 8) x = Math.max(8, x - w - pad * 2);
  if (y + h > window.innerHeight - 8) y = Math.max(8, y - h - pad * 2);
  x = Math.max(8, x);
  // Page coordinates, so a pinned tooltip scrolls with its chart
  tooltip.style("left", `${x + window.scrollX}px`).style("top", `${y + window.scrollY}px`);
}

App.showTooltip = function (html, event) {
  if (App.pinned) return;
  tooltip.html(html).attr("hidden", null).classed("pinned", false);
  placeTooltip(event);
};

App.moveTooltip = function (event) {
  if (!App.pinned) placeTooltip(event);
};

App.hideTooltip = function () {
  if (!App.pinned) tooltip.attr("hidden", true);
};

App.pin = function (el, html, event, onClose) {
  // Clicking the pinned mark again closes it
  if (App.pinned && App.pinned.el === el) { App.unpin(); return; }
  App.unpin();
  App.pinned = { el, onClose };
  d3.select(el).classed("is-pinned", true);
  const chart = el.closest(".chart");
  if (chart) chart.classList.add("has-pin");
  tooltip
    .html(`<button type="button" class="tip-close" aria-label="Close details">&times;</button>${html}<div class="tip-hint">Pinned &middot; click anywhere to close</div>`)
    .attr("hidden", null)
    .classed("pinned", true);
  placeTooltip(event);
};

App.unpin = function () {
  if (!App.pinned) return;
  const { el, onClose } = App.pinned;
  App.pinned = null;
  d3.select(el).classed("is-pinned", false);
  document.querySelectorAll(".chart.has-pin").forEach((c) => c.classList.remove("has-pin"));
  tooltip.attr("hidden", true).classed("pinned", false);
  if (onClose) onClose();
};

// Any click that is not on a chart mark closes the pinned tooltip
document.addEventListener("click", () => App.unpin());
document.addEventListener("keydown", (e) => { if (e.key === "Escape") App.unpin(); });

// Attach hover + pin behaviour to marks. html(d) returns the tooltip content.
App.tip = function (sel, html) {
  sel
    .style("cursor", "pointer")
    .on("mouseenter.tip mousemove.tip", (event, d) => App.showTooltip(html(d), event))
    .on("mouseleave.tip", App.hideTooltip)
    .on("focus.tip", (event, d) => App.showTooltip(html(d), { target: event.currentTarget, type: "focus" }))
    .on("blur.tip", App.hideTooltip)
    .on("click.tip", (event, d) => {
      event.stopPropagation();
      App.pin(event.currentTarget, html(d), event);
    })
    .on("keydown.tip", (event, d) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      App.pin(event.currentTarget, html(d), { target: event.currentTarget, type: "focus" });
    });
};

// ----- Chart size helper: width follows the container, height follows width -----
App.size = function (container, ratio = 0.55, minH = 300, maxH = 460) {
  const width = container.node().getBoundingClientRect().width;
  const height = Math.max(minH, Math.min(maxH, width * ratio));
  return { width, height };
};

// ----- Redraw all charts on resize (debounced); a pinned tooltip closes first -----
let resizeTimer;
let lastWidth = window.innerWidth;
window.addEventListener("resize", () => {
  // Mobile browsers fire resize on scroll (address bar); only redraw on width change
  if (window.innerWidth === lastWidth) return;
  lastWidth = window.innerWidth;
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    App.unpin();
    App.charts.forEach((draw) => draw());
  }, 150);
});

// ----- Page motion: scroll reveal and count-up (skipped when reduced motion is on) -----
(function () {
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduce || !("IntersectionObserver" in window)) return;

  // Reveal blocks as they scroll in. Only blocks below the fold are hidden first,
  // so nothing that is already on screen flickers.
  const targets = document.querySelectorAll(
    ".stat-row, .mix-wrap, .route li, .facts li, .chart-card, .insight, .pager, .section-head"
  );
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add("reveal-in");
      entry.target.classList.remove("reveal-pending");
      io.unobserve(entry.target);
    });
  }, { rootMargin: "0px 0px -8% 0px" });

  targets.forEach((el) => {
    if (el.getBoundingClientRect().top > window.innerHeight) {
      el.classList.add("reveal-pending");
      io.observe(el);
    }
  });

  // Count up numbers marked with data-count (the final value is already in the HTML)
  document.querySelectorAll("[data-count]").forEach((el) => {
    const end = +el.dataset.count;
    const fmt = d3.format(",");
    const t = d3.timer((elapsed) => {
      const k = Math.min(1, elapsed / 1400);
      el.textContent = fmt(Math.round(end * d3.easeCubicOut(k)));
      if (k === 1) t.stop();
    });
  });
})();

// ----- Charts animate in only once they scroll into view -----
(function () {
  const charts = document.querySelectorAll(".chart");
  if (App.reduceMotion || !("IntersectionObserver" in window)) {
    charts.forEach((c) => c.classList.add("in-view"));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("in-view");
      io.unobserve(e.target);
    });
  }, { threshold: 0.2 });
  charts.forEach((c) => io.observe(c));
})();
