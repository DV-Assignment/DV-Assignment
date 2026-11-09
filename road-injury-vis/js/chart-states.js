// Chart 4 (Q4): states and territories, rate per 100,000 people or vulnerable road user share.
// Data: data/processed/q4_state_rates.csv and q4_state_road_user_rates.csv (exported from KNIME, ABS population joined)
// Columns used: year, state, cases, population, Rate_per_100k, road_user, cases_state_total

const STATE_NAMES = {
  NSW: "New South Wales", Vic: "Victoria", Qld: "Queensland", SA: "South Australia",
  WA: "Western Australia", Tas: "Tasmania", NT: "Northern Territory", ACT: "Australian Capital Territory",
};
const VRU = ["Motorcyclist", "Pedal cyclist", "Pedestrian"];
const Q4_MEASURES = [
  { key: "rate", label: "Injury rate per 100,000 people, all road users", unit: "per 100,000", title: "Road crash injury rate per 100,000 people by state and territory" },
  { key: "vru", label: "Riders & walkers share of cases (%)", unit: "%", title: "Share of cases who were motorcyclists, pedal cyclists or pedestrians, by state and territory (%)" },
  { key: "Motorcyclist", label: "Motorcyclist rate per 100,000 people", unit: "per 100,000", title: "Motorcyclist injury rate per 100,000 people by state and territory" },
  { key: "Pedal cyclist", label: "Pedal cyclist rate per 100,000 people", unit: "per 100,000", title: "Pedal cyclist injury rate per 100,000 people by state and territory" },
  { key: "Pedestrian", label: "Pedestrian rate per 100,000 people", unit: "per 100,000", title: "Pedestrian injury rate per 100,000 people by state and territory" },
];

const num = (v) => (v === "" || v === undefined ? null : +v);

Promise.all([
  d3.csv("../data/processed/q4_state_rates.csv", (d) => ({
    year: +d.year, state: d.state, cases: +d.cases, population: +d.population,
  })),
  d3.csv("../data/processed/q4_state_road_user_rates.csv", (d) => ({
    year: +d.year, state: d.state, user: d.road_user, cases: num(d.cases),
    status: d.Publication_status, stateTotal: +d.cases_state_total, population: +d.population,
  })),
]).then(([totals, users]) => {
  const years = d3.sort(d3.union(totals.map((d) => d.year)));

  const measureSel = d3.select("#q4-measure");
  measureSel.selectAll("option").data(Q4_MEASURES).join("option").attr("value", (d) => d.key).text((d) => d.label);
  const yearSel = d3.select("#q4-year");
  yearSel.selectAll("option").data(years).join("option").attr("value", (d) => d).text((d) => d);
  yearSel.property("value", years[years.length - 1]);
  measureSel.on("change", draw);
  yearSel.on("change", draw);

  const container = d3.select("#chart-states");
  const fmtVal = d3.format(".1f");

  // Build one value per state for the chosen measure and year
  function values(measure, year) {
    const t = totals.filter((d) => d.year === year);
    const u = users.filter((d) => d.year === year);
    let rows, combined;
    if (measure === "rate") {
      rows = t.map((d) => ({ state: d.state, value: (d.cases / d.population) * 1e5, cases: d.cases, base: d.population, note: "" }));
      combined = (d3.sum(t, (d) => d.cases) / d3.sum(t, (d) => d.population)) * 1e5;
    } else if (measure === "vru") {
      rows = t.map((d) => {
        const part = u.filter((r) => r.state === d.state && VRU.includes(r.user));
        const hidden = part.some((r) => r.status !== "Published");
        const c = d3.sum(part, (r) => r.cases || 0);
        return { state: d.state, value: (c / d.cases) * 100, cases: c, base: d.cases, note: hidden ? "Some counts not published" : "" };
      });
      combined = (d3.sum(rows, (d) => d.cases) / d3.sum(rows, (d) => d.base)) * 100;
    } else {
      rows = u.filter((r) => r.user === measure).map((r) => ({
        state: r.state,
        value: r.cases === null ? null : (r.cases / r.population) * 1e5,
        cases: r.cases, base: r.population,
        note: r.status === "Partly published" ? "Part of the count not published" : (r.status === "Not published" ? "Not published (small count)" : ""),
      }));
      const ok = rows.filter((d) => d.value !== null);
      combined = (d3.sum(ok, (d) => d.cases) / d3.sum(ok, (d) => d.base)) * 1e5;
    }
    return { rows: d3.sort(rows, (d) => -(d.value ?? -1)), combined };
  }

  // Bar colour follows the measure, so every option looks different:
  // all road users = road-sign blue, riders & walkers combined = black (as on the Q2 chart),
  // a single road user = that road user's own colour.
  const measureHue = (key) => App.COLORS[key] || App.COLORS.slate;

  function draw() {
    App.unpin();
    const measure = Q4_MEASURES.find((d) => d.key === measureSel.property("value"));
    const year = +yearSel.property("value");
    const { rows, combined } = values(measure.key, year);
    const pct = measure.unit === "%";
    const fmtV = (v) => `${fmtVal(v)}${pct ? "%" : ""}`;
    d3.select("#q4-title").text(`${measure.title}, ${year}`);

    container.classed("live", true).selectAll("*").remove();
    const { width, height } = App.size(container, 0.5, 340, 420);
    const small = width < 560;
    const m = { top: 40, right: small ? 52 : 70, bottom: 30, left: small ? 44 : 200 };
    const iw = width - m.left - m.right;
    const ih = height - m.top - m.bottom;

    const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`).attr("aria-hidden", "true");
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

    const maxV = d3.max(rows, (d) => d.value) || 1;
    const x = d3.scaleLinear().domain([0, Math.max(maxV, combined)]).nice().range([0, iw]);
    const y = d3.scaleBand().domain(rows.map((d) => d.state)).range([0, ih]).padding(0.25);
    const { h: bh, off } = App.barBand(y, 26);

    g.append("g").attr("class", "grid").attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(small ? 3 : 6).tickSize(-ih).tickFormat(""));
    g.append("g").attr("class", "axis axis-x").attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(small ? 3 : 6).tickFormat((d) => (pct ? d + "%" : d)).tickSizeOuter(0));
    g.append("g").attr("class", "axis axis-cat")
      .call(d3.axisLeft(y).tickSize(0).tickPadding(10).tickFormat((d) => (small ? d : STATE_NAMES[d])))
      .call((a) => a.select(".domain").remove());

    // Above the combined value: full colour. Below: lighter tint. Top state: bold label.
    const hue = measureHue(measure.key);
    const top = rows[0].state;
    function tip(d) {
      const diff = d.value === null ? null : d.value - combined;
      return `<strong>${STATE_NAMES[d.state]}, ${year}</strong>` +
        `<div class="row"><span>${pct ? "Share" : "Rate per 100,000"}</span><b>${d.value === null ? "n.p." : fmtV(d.value)}</b></div>` +
        `<div class="row"><span>Cases</span><b>${d.cases === null ? "n.p." : App.fmtInt(d.cases)}</b></div>` +
        `<div class="row"><span>${pct ? "All cases" : "Population"}</span><b>${App.fmtInt(d.base)}</b></div>` +
        `<div class="row tip-total"><span>vs 8 combined (${fmtV(combined)})</span><b>${diff === null ? "–" : (diff >= 0 ? "+" : "") + fmtVal(diff)}${pct && diff !== null ? " pts" : ""}</b></div>` +
        (d.note ? `<em>${d.note}</em>` : "");
    }

    // Reference line: all 8 states combined, with a label pill on top
    g.append("line").attr("class", "ref-line")
      .attr("x1", x(combined)).attr("x2", x(combined)).attr("y1", -12).attr("y2", ih);
    const barSel = g.selectAll(".bar").data(rows.filter((d) => d.value !== null)).join("path")
      .attr("class", "bar")
      .attr("fill", (d) => (d.value >= combined ? hue : App.tint(hue, 0.55)))
      .attr("d", (d) => App.barPath(0, y(d.state) + off, x(d.value), bh))
      .style("animation-delay", (d, i) => `${i * 60}ms`)
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", (d) => `${STATE_NAMES[d.state]}: ${fmtVal(d.value)} ${measure.unit}. Press Enter to pin details.`);
    App.tip(barSel, tip);

    g.selectAll(".bar-label").data(rows).join("text")
      .attr("class", (d) => (d.value === null ? "np-label" : "bar-label"))
      .classed("peak", (d) => d.state === top)
      .attr("y", (d) => y(d.state) + y.bandwidth() / 2).attr("dy", "0.35em")
      .text((d) => (d.value === null ? "n.p." : fmtV(d.value) + (d.note ? "*" : "")))
      // A label that would sit across the dashed line moves just past it
      .attr("x", function (d) {
        const lx = d.value === null ? 4 : x(d.value) + 6;
        const w = this.getComputedTextLength();
        const rx = x(combined);
        return lx < rx + 4 && lx + w > rx - 4 ? rx + 6 : lx;
      });

    // Label pill for the reference line, on top of everything
    const ref = g.append("g").attr("class", "pill").attr("transform", `translate(${x(combined)},-22)`);
    const refText = ref.append("text").attr("text-anchor", "middle").attr("dy", "0.35em")
      .text(`8 combined: ${fmtV(combined)}`);
    const b = refText.node().getBBox();
    ref.insert("rect", "text").attr("x", b.x - 7).attr("y", b.y - 3).attr("width", b.width + 14).attr("height", b.height + 6).attr("rx", 4);
  }

  App.register(draw);
}).catch((err) => {
  d3.select("#chart-states").append("p").attr("class", "note")
    .text("Could not load the Q4 CSV files. Check they are in data/processed/.");
  console.error(err);
});
