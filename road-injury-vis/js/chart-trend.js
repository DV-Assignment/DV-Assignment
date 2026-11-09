// Chart 1 (Q1): national trend line with reporting breaks.
// Data: data/processed/q1_national_trend.csv (exported from KNIME)
// Columns used: year, nonfatal_cases, YoY_change_pct

d3.csv("../data/processed/q1_national_trend.csv", (d) => ({
  year: +d.year,
  cases: +d.nonfatal_cases,
  change: d.YoY_change_pct === "" || d.YoY_change_pct === undefined ? null : +d.YoY_change_pct,
})).then((raw) => {
  const data = raw.filter((d) => d.year >= 2011 && d.year <= 2021 && !isNaN(d.cases));
  const container = d3.select("#chart-trend");
  const first = data[0];
  const last = data[data.length - 1];
  const low = data.find((d) => d.year === 2020);

  // Reporting breaks (positions are mid-year, because the changes started mid-year)
  const breaks = [
    { x: 2012.5, label: "Victoria counting change", short: "Vic change", detail: "From July 2012, Victoria no longer counts emergency-department-only care as an admission." },
    { x: 2017.45, label: "NSW counting change", short: "NSW change", detail: "From June 2017, NSW no longer counts emergency-department-only care as an admission." },
  ];

  function draw() {
    App.unpin();
    container.classed("live", true).selectAll("*").remove();
    const { width, height } = App.size(container, 0.48, 320, 440);
    const small = width < 560;
    const m = { top: 44, right: small ? 20 : 96, bottom: 36, left: small ? 40 : 48 };
    const iw = width - m.left - m.right;
    const ih = height - m.top - m.bottom;

    const svg = container.append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("aria-hidden", "true");
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

    const x = d3.scaleLinear().domain([2011, 2021]).range([0, iw]);
    // Y axis starts at 0 so the size of the change is not exaggerated
    const y = d3.scaleLinear().domain([0, 45000]).range([ih, 0]);

    // Soft yellow wash under the line
    const grad = svg.append("defs").append("linearGradient")
      .attr("id", "trend-wash").attr("x1", 0).attr("x2", 0).attr("y1", 0).attr("y2", 1);
    grad.append("stop").attr("offset", "0%").attr("stop-color", "#f2b705").attr("stop-opacity", 0.28);
    grad.append("stop").attr("offset", "100%").attr("stop-color", "#f2b705").attr("stop-opacity", 0.02);

    g.append("g").attr("class", "grid")
      .call(d3.axisLeft(y).ticks(small ? 3 : 5).tickSize(-iw).tickFormat(""));

    g.append("g").attr("class", "axis axis-x")
      .attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(small ? 5 : 11).tickFormat((d) => (small ? `'${String(d).slice(2)}` : d)).tickSizeOuter(0));

    g.append("g").attr("class", "axis axis-y")
      .call(d3.axisLeft(y).ticks(small ? 3 : 5).tickFormat(App.fmtK).tickSize(0).tickPadding(8))
      .call((a) => a.select(".domain").remove());

    // Reporting break markers: dashed line + label at the top
    const br = g.selectAll(".break").data(breaks).join("g").attr("class", "break");
    br.append("line").attr("class", "break-line")
      .attr("x1", (d) => x(d.x)).attr("x2", (d) => x(d.x))
      .attr("y1", -18).attr("y2", ih);
    br.append("text").attr("class", "break-label")
      .attr("x", (d) => x(d.x) + 6).attr("y", -22)
      .text((d) => (small ? d.short : d.label));

    // Area + line
    g.append("path").datum(data).attr("class", "trend-area")
      .attr("fill", "url(#trend-wash)")
      .attr("d", d3.area().x((d) => x(d.year)).y0(ih).y1((d) => y(d.cases)));
    g.append("path").datum(data).attr("class", "trend-line").attr("pathLength", 1)
      .attr("d", d3.line().x((d) => x(d.year)).y((d) => y(d.cases)));

    // Key annotations: start, the 2020 dip and the latest year
    const ann = g.append("g").attr("class", "annotations");
    ann.append("text").attr("class", "value-label")
      .attr("x", x(first.year)).attr("y", y(first.cases) - 14)
      .text(App.fmtInt(first.cases));
    ann.append("text").attr("class", "value-note")
      .attr("x", x(low.year)).attr("y", y(low.cases) + 24).attr("text-anchor", "middle")
      .text(`${App.fmtPct(low.change)}% in 2020`);
    const endX = small ? x(last.year) : x(last.year) + 14;
    const endAnchor = small ? "end" : "start";
    ann.append("text").attr("class", "value-label value-big")
      .attr("x", endX).attr("y", small ? y(last.cases) - 28 : y(last.cases) + 2)
      .attr("text-anchor", endAnchor)
      .text(App.fmtInt(last.cases));
    ann.append("text").attr("class", "value-note")
      .attr("x", endX).attr("y", small ? y(last.cases) - 12 : y(last.cases) + 20)
      .attr("text-anchor", endAnchor)
      .text(`+${Math.round((last.cases / first.cases - 1) * 100)}% since ${first.year}`);

    // Points: visible dot + a larger invisible hit area (mouse, touch and keyboard)
    const pts = g.selectAll(".pt").data(data).join("g")
      .attr("class", "pt")
      .style("animation-delay", (d, i) => `${300 + i * 90}ms`)
      .attr("transform", (d) => `translate(${x(d.year)},${y(d.cases)})`)
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", (d) => `${d.year}: ${App.fmtInt(d.cases)} cases. Press Enter to pin details.`);
    pts.append("circle").attr("class", "hit").attr("r", 16);
    pts.append("circle").attr("class", "trend-dot")
      .classed("end", (d) => d.year === last.year)
      .attr("r", (d) => (d.year === last.year ? 6.5 : 5));
    App.tip(pts, tip);

    // Make the dashed lines explain themselves on hover/click too
    App.tip(
      br.append("rect")
        .attr("x", (d) => x(d.x) - 10).attr("width", 20)
        .attr("y", -30).attr("height", ih + 30)
        .attr("fill", "transparent"),
      (d) => `<strong>${d.label}</strong>${d.detail}`
    );
  }

  function tip(d) {
    const change = d.change === null ? "First year" :
      `${d.change > 0 ? "+" : ""}${App.fmtPct(d.change)}% on ${d.year - 1}`;
    let note = "";
    if (d.year === 2012) note = "<em>Victoria counting change from July 2012</em>";
    if (d.year === 2017) note = "<em>NSW counting change from June 2017</em>";
    return `<strong>${d.year}</strong>
      <div class="row"><span>Non-fatal cases</span><b>${App.fmtInt(d.cases)}</b></div>
      <div class="row"><span>Change</span><b>${change}</b></div>
      <div class="row"><span>Since ${first.year}</span><b>${d.year === first.year ? "–" : (d.cases >= first.cases ? "+" : "") + App.fmtPct((d.cases / first.cases - 1) * 100) + "%"}</b></div>${note}`;
  }

  App.register(draw);
}).catch((err) => {
  d3.select("#chart-trend").append("p").attr("class", "note")
    .text("Could not load q1_national_trend.csv. Check the file is in data/processed/.");
  console.error(err);
});
