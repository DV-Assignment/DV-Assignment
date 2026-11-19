// Chart 5 (Q5): First Nations people compared with non-Indigenous people, share of each group's cases.
// Data: data/processed/q5_first_nations_profile.csv (exported from KNIME)
// Columns used: status, category, year, dimension, cases, n_suppressed_halves, Share_pct

const Q5_GROUPS = [
  { key: "First Nations people", hex: App.COLORS["First Nations people"] },
  { key: "Non-Indigenous", hex: App.COLORS["Non-Indigenous"] },
];
// Shorter labels for long BITRE category names
const Q5_SHORT = {
  "Car driver, passenger or unknown position": "Car occupant",
  "Heavy transport driver, passenger or unknown position": "Heavy transport",
  "Pick-up truck or van occupant": "Pick-up or van",
};
const AGE_ORDER = ["0-7", "8-16", "17-25", "26-39", "40-64", "65+"];

d3.csv("../data/processed/q5_first_nations_profile.csv", (d) => ({
  status: d.status,
  category: d.category,
  label: Q5_SHORT[d.category] || d.category,
  year: +d.year,
  dim: d.dimension,
  cases: d.cases === "" ? null : +d.cases,
  partial: +d.n_suppressed_halves === 1,
  share: d.Share_pct === "" ? null : +d.Share_pct,
})).then((rows) => {
  const years = d3.sort(d3.union(rows.map((d) => d.year)));
  let dim = "Road user";

  const yearSel = d3.select("#q5-year");
  yearSel.selectAll("option").data(years).join("option").attr("value", (d) => d).text((d) => d);
  yearSel.property("value", years[years.length - 1]);
  yearSel.on("change", draw);

  const toggle = d3.selectAll(".toggle button").on("click", function () {
    dim = this.dataset.dim;
    toggle.attr("aria-pressed", function () { return String(this.dataset.dim === dim); });
    draw();
  });

  d3.select("#legend-first-nations").selectAll("span.item").data(Q5_GROUPS).join("span")
    .attr("class", "item")
    .html((d) => `<span class="swatch" style="background:${d.hex}"></span>${d.key}`);

  const container = d3.select("#chart-first-nations");

  function draw() {
    App.unpin();
    const year = +yearSel.property("value");
    const sel = rows.filter((d) => d.year === year && d.dim === dim);
    d3.select("#q5-title").text(`Share of cases by ${dim.toLowerCase()}: First Nations people compared with non-Indigenous people, ${year}`);

    // Category order: age in natural order, road user by First Nations share
    let cats;
    if (dim === "Age group") cats = AGE_ORDER;
    else {
      const fn = sel.filter((d) => d.status === Q5_GROUPS[0].key);
      cats = d3.sort(fn, (d) => -(d.share ?? -1)).map((d) => d.label);
    }

    container.classed("live", true).selectAll("*").remove();
    const { width, height } = App.size(container, 0.6, 380, 500);
    const small = width < 560;
    const m = { top: 8, right: 56, bottom: 30, left: small ? 100 : 140 };
    const iw = width - m.left - m.right;
    const ih = height - m.top - m.bottom;

    const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`).attr("aria-hidden", "true");
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

    const x = d3.scaleLinear().domain([0, d3.max(sel, (d) => d.share) || 1]).nice().range([0, iw]);
    const y = d3.scaleBand().domain(cats).range([0, ih]).padding(0.28);
    // Two bars per category, each capped at 16px with a 2px gap between them
    const bh = Math.min(16, (y.bandwidth() - 2) / 2);
    const pairOff = (y.bandwidth() - (bh * 2 + 2)) / 2;
    const yOf = (d) => y(d.label) + pairOff + (d.status === Q5_GROUPS[0].key ? 0 : bh + 2);

    g.append("g").attr("class", "grid").attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(small ? 4 : 6).tickSize(-ih).tickFormat(""));
    g.append("g").attr("class", "axis axis-x").attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(small ? 4 : 6).tickFormat((d) => d + "%").tickSizeOuter(0));
    g.append("g").attr("class", "axis axis-cat")
      .call(d3.axisLeft(y).tickSize(0).tickPadding(10).tickFormat((d) => (dim === "Age group" ? `Aged ${d}` : d)))
      .call((a) => a.select(".domain").remove());

    const color = (s) => Q5_GROUPS.find((gr) => gr.key === s).hex;
    const other = (d) => sel.find((r) => r.category === d.category && r.status !== d.status);

    function tip(d) {
      const o = other(d);
      const gap = o && o.share !== null && d.share !== null ? d.share - o.share : null;
      return `<strong>${d.status}, ${year}</strong><div class="tip-sub">${dim === "Age group" ? "Aged " + d.label : d.label}</div>` +
        `<div class="row"><span>Share of group's cases</span><b>${d.share === null ? "n.p." : App.fmtPct(d.share) + "%"}</b></div>` +
        `<div class="row"><span>Cases</span><b>${d.cases === null ? "n.p." : App.fmtInt(d.cases)}</b></div>` +
        (o ? `<div class="row"><span>${o.status}</span><b>${o.share === null ? "n.p." : App.fmtPct(o.share) + "%"}</b></div>` : "") +
        (gap !== null ? `<div class="row tip-total"><span>Difference</span><b>${gap >= 0 ? "+" : ""}${App.fmtPct(gap)} pts</b></div>` : "") +
        (d.partial ? "<em>Part of this count is not published.</em>" : "");
    }

    const barSel = g.selectAll(".bar").data(sel.filter((d) => d.share !== null)).join("path")
      .attr("class", "bar")
      .attr("fill", (d) => color(d.status))
      .attr("d", (d) => App.barPath(0, yOf(d), x(d.share), bh))
      .style("animation-delay", (d) => `${cats.indexOf(d.label) * 70}ms`)
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", (d) => `${d.status}, ${d.label}: ${App.fmtPct(d.share)}% of cases. Press Enter to pin details.`);
    App.tip(barSel, tip);

    g.selectAll(".bar-label").data(sel).join("text")
      .attr("class", (d) => (d.share === null ? "np-label" : "bar-label"))
      .classed("peak", (d) => d.status === Q5_GROUPS[0].key && d.share !== null)
      .attr("x", (d) => (d.share === null ? 4 : x(d.share) + 6))
      .attr("y", (d) => yOf(d) + bh / 2)
      .attr("dy", "0.35em")
      .style("font-size", small ? "11px" : null)
      .text((d) => (d.share === null ? "n.p." : App.fmtPct(d.share) + "%" + (d.partial ? "*" : "")));
  }

  App.register(draw);
}).catch((err) => {
  d3.select("#chart-first-nations").append("p").attr("class", "note")
    .text("Could not load q5_first_nations_profile.csv. Check the file is in data/processed/.");
  console.error(err);
});
