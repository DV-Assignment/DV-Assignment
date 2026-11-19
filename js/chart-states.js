// Chart 4 (Q4): states and territories, rate per 100,000 people or vulnerable road user share.
// Data: data/processed/q4_state_rates.csv and q4_state_road_user_rates.csv (exported from KNIME, ABS population joined)
// Columns used: year, state, cases, population, Rate_per_100k, road_user, cases_state_total
// Map: a simple outline of Australia split into states (simplified from ABS ASGS state boundaries), built into this file
// The bar chart, the map and the small table all follow the same Show and Year menus.

const STATE_NAMES = {
  NSW: "New South Wales", Vic: "Victoria", Qld: "Queensland", SA: "South Australia",
  WA: "Western Australia", Tas: "Tasmania", NT: "Northern Territory", ACT: "Australian Capital Territory",
};
const VRU = ["Motorcyclist", "Pedal cyclist", "Pedestrian"];
// Simple state shapes for the map (no extra file needed)
const AUS_SHAPES = {"type":"FeatureCollection","features":[{"type":"Feature","properties":{"state":"NSW"},"geometry":{"type":"MultiPolygon","coordinates":[[[[151.1,-33.8],[150.8,-35.1],[150.2,-35.7],[150.0,-37.5],[148.1,-36.8],[148.0,-36.0],[147.7,-35.9],[146.9,-36.1],[145.1,-35.8],[144.6,-36.1],[143.4,-35.2],[143.3,-34.8],[142.8,-34.5],[142.5,-34.8],[142.0,-34.1],[141.0,-34.0],[141.0,-29.0],[149.0,-29.0],[149.5,-28.6],[150.3,-28.5],[151.0,-28.7],[151.4,-29.2],[152.0,-28.9],[152.0,-28.5],[152.5,-28.3],[153.6,-28.2],[153.6,-28.8],[152.5,-32.4],[151.6,-33.0],[151.4,-33.5],[151.1,-33.4],[151.3,-33.6],[151.1,-33.8]]]]}},{"type":"Feature","properties":{"state":"Vic"},"geometry":{"type":"MultiPolygon","coordinates":[[[[145.1,-38.4],[144.7,-38.3],[145.1,-38.1],[144.9,-37.8],[144.4,-38.1],[144.7,-38.3],[143.5,-38.9],[142.4,-38.3],[141.4,-38.4],[141.0,-38.1],[141.0,-34.0],[142.2,-34.2],[142.6,-34.8],[142.8,-34.5],[143.3,-34.8],[143.4,-35.2],[144.7,-36.1],[145.5,-35.8],[146.9,-36.1],[147.9,-36.0],[148.1,-36.8],[150.0,-37.5],[147.8,-38.0],[146.9,-38.6],[146.2,-38.7],[146.5,-38.8],[146.4,-39.1],[145.4,-38.5],[145.5,-38.2],[145.1,-38.4]]]]}},{"type":"Feature","properties":{"state":"Qld"},"geometry":{"type":"MultiPolygon","coordinates":[[[[141.7,-15.0],[141.5,-13.9],[141.9,-12.6],[141.6,-12.6],[142.0,-12.0],[142.1,-10.9],[142.6,-10.7],[142.9,-11.8],[143.2,-12.0],[143.1,-12.3],[143.5,-12.8],[143.8,-14.4],[144.5,-14.2],[145.4,-15.0],[145.4,-16.5],[146.0,-16.9],[146.3,-18.9],[148.8,-20.2],[148.9,-20.5],[148.7,-20.6],[149.2,-21.1],[149.8,-22.4],[150.0,-22.7],[150.0,-22.1],[150.5,-22.6],[150.6,-22.3],[150.8,-22.4],[150.9,-23.6],[151.4,-24.1],[151.8,-24.0],[152.5,-25.2],[152.9,-25.3],[153.0,-26.0],[153.2,-25.9],[153.1,-27.5],[153.4,-27.6],[153.6,-28.2],[152.5,-28.3],[152.0,-28.5],[152.0,-28.9],[151.4,-29.2],[151.0,-28.7],[150.3,-28.5],[149.5,-28.6],[149.0,-29.0],[141.0,-29.0],[141.0,-26.0],[138.0,-26.0],[138.0,-16.5],[139.0,-16.9],[139.2,-17.3],[140.0,-17.7],[140.6,-17.6],[141.3,-16.5],[141.7,-15.0]]]]}},{"type":"Feature","properties":{"state":"SA"},"geometry":{"type":"MultiPolygon","coordinates":[[[[138.5,-34.8],[138.1,-34.1],[137.8,-35.1],[136.8,-35.2],[137.0,-34.9],[137.4,-34.9],[137.4,-34.1],[138.0,-33.6],[137.8,-32.4],[137.8,-33.0],[135.9,-34.5],[136.0,-35.0],[135.1,-34.6],[135.5,-34.6],[135.3,-34.0],[134.7,-33.2],[134.2,-33.1],[134.3,-32.6],[133.8,-32.5],[133.7,-32.1],[132.2,-32.0],[131.1,-31.5],[129.0,-31.7],[129.0,-26.0],[141.0,-26.0],[141.0,-38.1],[140.4,-37.9],[139.8,-37.3],[139.9,-36.6],[139.4,-35.9],[138.8,-35.5],[138.1,-35.6],[138.5,-34.8]]]]}},{"type":"Feature","properties":{"state":"WA"},"geometry":{"type":"MultiPolygon","coordinates":[[[[113.4,-26.4],[113.4,-26.0],[113.6,-26.6],[113.9,-26.5],[113.5,-25.5],[113.7,-26.2],[113.9,-25.9],[114.1,-26.5],[114.2,-26.3],[114.3,-25.9],[113.4,-24.2],[113.8,-23.5],[113.7,-22.6],[114.0,-21.9],[114.1,-22.5],[114.3,-22.5],[114.6,-21.8],[115.5,-21.5],[116.8,-20.5],[117.4,-20.8],[118.8,-20.3],[119.1,-20.0],[119.6,-20.1],[121.1,-19.5],[121.8,-18.5],[122.4,-18.1],[122.2,-17.3],[122.8,-16.8],[122.9,-16.4],[123.6,-17.6],[123.6,-17.0],[123.9,-17.2],[124.0,-16.9],[123.5,-16.7],[123.7,-16.4],[123.6,-16.2],[124.4,-16.5],[124.4,-16.3],[124.9,-16.4],[124.4,-16.3],[124.7,-15.8],[124.5,-16.0],[124.4,-15.5],[124.7,-15.3],[125.4,-15.7],[124.8,-15.2],[125.1,-15.0],[125.5,-15.2],[125.1,-14.7],[125.6,-14.6],[125.6,-14.2],[125.6,-14.6],[125.8,-14.4],[125.9,-14.6],[126.2,-14.1],[126.0,-13.9],[126.3,-14.2],[126.5,-13.9],[126.6,-14.2],[126.9,-14.0],[126.8,-13.8],[127.4,-13.9],[128.2,-14.7],[128.0,-15.5],[128.1,-15.2],[128.3,-15.5],[128.4,-14.8],[129.0,-14.9],[129.0,-31.7],[127.3,-32.3],[126.0,-32.3],[124.2,-33.0],[123.5,-33.9],[120.0,-33.9],[118.0,-35.1],[116.5,-35.0],[115.0,-34.3],[115.0,-33.5],[115.4,-33.6],[115.7,-33.3],[115.7,-32.3],[116.0,-31.9],[115.7,-32.1],[115.1,-30.5],[114.9,-29.1],[113.4,-26.4]]]]}},{"type":"Feature","properties":{"state":"Tas"},"geometry":{"type":"MultiPolygon","coordinates":[[[[144.8,-41.1],[144.7,-40.6],[145.3,-40.7],[146.4,-41.2],[146.8,-41.1],[147.1,-41.4],[146.8,-41.1],[148.0,-40.8],[148.3,-41.0],[148.3,-42.2],[148.2,-42.0],[148.0,-42.1],[147.8,-42.9],[147.4,-42.8],[147.6,-42.8],[147.4,-43.1],[147.1,-42.8],[147.3,-43.1],[147.2,-43.3],[147.0,-43.1],[146.9,-43.6],[146.0,-43.6],[145.9,-43.4],[146.2,-43.3],[145.5,-43.0],[145.2,-42.2],[145.6,-42.4],[145.2,-42.2],[144.8,-41.1]]]]}},{"type":"Feature","properties":{"state":"NT"},"geometry":{"type":"MultiPolygon","coordinates":[[[[130.5,-12.7],[130.7,-12.7],[130.6,-12.4],[131.0,-12.6],[130.8,-12.4],[131.3,-12.0],[132.1,-12.3],[132.6,-12.1],[132.5,-11.5],[131.8,-11.3],[132.0,-11.1],[132.2,-11.4],[132.3,-11.1],[133.2,-11.7],[133.9,-11.7],[134.2,-12.1],[134.7,-11.9],[135.2,-12.3],[135.9,-12.0],[135.7,-12.3],[136.0,-12.1],[136.0,-12.5],[136.2,-12.5],[136.2,-12.2],[136.6,-11.9],[136.6,-12.3],[137.0,-12.3],[136.5,-12.8],[136.7,-13.0],[136.5,-13.0],[136.5,-13.2],[136.3,-13.0],[135.9,-13.3],[135.9,-14.2],[135.4,-14.7],[136.3,-15.6],[136.7,-15.7],[136.7,-15.9],[137.0,-15.9],[138.0,-16.5],[138.0,-26.0],[129.0,-26.0],[129.0,-14.9],[129.2,-15.2],[129.2,-14.8],[129.7,-15.1],[129.5,-14.8],[129.9,-14.8],[129.4,-14.3],[129.8,-13.5],[130.3,-13.3],[130.1,-12.9],[130.5,-12.7]]]]}},{"type":"Feature","properties":{"state":"ACT"},"geometry":{"type":"MultiPolygon","coordinates":[[[[149.4,-35.3],[149.4,-35.4],[149.2,-35.3],[149.1,-35.4],[149.1,-35.6],[149.1,-35.6],[149.1,-35.7],[149.1,-35.8],[149.0,-35.9],[149.0,-35.9],[148.9,-35.8],[148.9,-35.7],[148.9,-35.8],[148.8,-35.6],[148.8,-35.6],[148.8,-35.5],[148.8,-35.3],[149.1,-35.1],[149.2,-35.2],[149.2,-35.2],[149.2,-35.2],[149.3,-35.3],[149.4,-35.3]]]]}}]};
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
  Promise.resolve(AUS_SHAPES),
]).then(([totals, users, geo]) => {
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

    drawMap(rows, combined, measure, year, hue, fmtV, tip);
    drawTable(rows, combined, measure, year, fmtV, pct);
  }

  // ----- Map: same numbers as the bars, darker colour = higher value -----
  const mapBox = d3.select("#chart-states-map");
  function drawMap(rows, combined, measure, year, hue, fmtV, tip) {
    d3.select("#q4-map-title").text(`Map, ${year}`);
    mapBox.classed("live", true).selectAll("*").remove();
    const { width, height } = App.size(mapBox, 0.85, 300, 460);
    const svg = mapBox.append("svg").attr("viewBox", `0 0 ${width} ${height}`).attr("aria-hidden", "true");
    const legendH = 46;
    const proj = d3.geoMercator().fitExtent([[10, legendH + 6], [width - 70, height - 10]], geo);
    const path = d3.geoPath(proj);

    const byState = new Map(rows.map((d) => [d.state, d]));
    const vals = rows.filter((d) => d.value !== null).map((d) => d.value);
    // Colour runs from the lowest to the highest state, so small differences are still visible
    const minV = d3.min(vals) ?? 0;
    const maxV = d3.max(vals) || 1;
    const color = d3.scaleLinear().domain([minV, maxV]).range([App.tint(hue, 0.85), hue]);
    const fill = (d) => (d && d.value !== null ? color(d.value) : "#e6e4de");

    const shapes = svg.append("g").selectAll("path").data(geo.features).join("path")
      .attr("class", "map-state")
      .attr("d", path)
      .attr("fill", (f) => fill(byState.get(f.properties.state)))
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", (f) => {
        const d = byState.get(f.properties.state);
        return `${STATE_NAMES[f.properties.state]}: ${d && d.value !== null ? fmtV(d.value) : "not published"} ${measure.unit}. Press Enter to pin details.`;
      });
    App.tip(shapes, (f) => tip(byState.get(f.properties.state) || { state: f.properties.state, value: null, cases: null, base: 0, note: "" }));

    // Labels: state code and value. ACT and Tas are small, so their labels sit outside with a short line.
    const outside = { ACT: [60, 16], Tas: [44, 4] };
    const labels = svg.append("g").attr("class", "map-labels");
    geo.features.forEach((f) => {
      const code = f.properties.state;
      const d = byState.get(code);
      const [cx, cy] = path.centroid(f);
      const off = outside[code];
      const lx = off ? cx + off[0] : cx, ly = off ? cy + off[1] : cy;
      if (off) labels.append("line").attr("class", "map-leader").attr("x1", cx).attr("y1", cy).attr("x2", lx - 4).attr("y2", ly - 6);
      const dark = !off && d && d.value !== null && d3.hsl(color(d.value)).l < 0.55;
      const t = labels.append("text").attr("x", lx).attr("y", ly)
        .attr("text-anchor", off ? "start" : "middle")
        .classed("on-dark", dark);
      t.append("tspan").attr("class", "map-code").text(code);
      t.append("tspan").attr("x", lx).attr("dy", "1.15em").text(d && d.value !== null ? fmtV(d.value) : "n.p.");
    });

    // Colour legend: light = low, dark = high, with a tick for the 8 combined
    const lw = Math.min(260, width - 40);
    const lg = svg.append("g").attr("class", "map-legend").attr("transform", "translate(10,8)");
    const gradId = "q4-grad";
    const grad = svg.append("defs").append("linearGradient").attr("id", gradId);
    grad.append("stop").attr("offset", "0%").attr("stop-color", color(minV));
    grad.append("stop").attr("offset", "100%").attr("stop-color", color(maxV));
    lg.append("text").attr("y", 0).attr("dy", "0.8em")
      .text(`${measure.unit === "%" ? "Share of cases (%)" : "Rate per 100,000 people"} · tick = 8 combined (${fmtV(combined)})`);
    lg.append("rect").attr("y", 18).attr("width", lw).attr("height", 10).attr("rx", 2).attr("fill", `url(#${gradId})`);
    const lx = d3.scaleLinear().domain([minV, maxV]).range([0, lw]).clamp(true);
    lg.append("text").attr("y", 42).text(`${fmtV(minV)} (lowest)`);
    lg.append("text").attr("x", lw).attr("y", 42).attr("text-anchor", "end").text(`${fmtV(maxV)} (highest)`);
    lg.append("line").attr("class", "ref-line").attr("x1", lx(combined)).attr("x2", lx(combined)).attr("y1", 14).attr("y2", 32);
  }

  // ----- Small table: the same numbers in words, for readers who prefer a table -----
  function drawTable(rows, combined, measure, year, fmtV, pct) {
    const box = d3.select("#q4-table");
    box.selectAll("*").remove();
    box.append("caption").text(`${measure.label}, ${year}. Sorted from highest to lowest.`);
    const head = box.append("thead").append("tr");
    [ "State or territory", pct ? "Share" : "Rate per 100,000", "Cases", pct ? "All cases" : "Population", "vs 8 combined" ]
      .forEach((h) => head.append("th").attr("scope", "col").text(h));
    const body = box.append("tbody");
    rows.forEach((d) => {
      const tr = body.append("tr");
      tr.append("th").attr("scope", "row").text(STATE_NAMES[d.state]);
      tr.append("td").text(d.value === null ? "n.p." : fmtV(d.value));
      tr.append("td").text(d.cases === null ? "n.p." : App.fmtInt(d.cases));
      tr.append("td").text(App.fmtInt(d.base));
      tr.append("td").text(d.value === null ? "–" : d.value >= combined ? "Higher" : "Lower");
    });
    const foot = box.append("tfoot").append("tr");
    foot.append("th").attr("scope", "row").text("8 combined");
    foot.append("td").text(fmtV(combined));
    foot.append("td").attr("colspan", 3).text("");
  }

  App.register(draw);
}).catch((err) => {
  d3.select("#chart-states").append("p").attr("class", "note")
    .text("Could not load the Q4 CSV files. Check they are in data/processed/.");
  console.error(err);
});
