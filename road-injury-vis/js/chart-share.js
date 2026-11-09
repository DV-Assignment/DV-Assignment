// Chart 2 (Q2): road user share over time, stacked area.
// Data: data/processed/q2_road_user_share.csv (exported from KNIME)
// Columns used: year, road_user, nonfatal_cases

// Bottom to top: the three vulnerable groups first, so their combined share is one line
const SHARE_GROUPS = ["Motorcyclist", "Pedal cyclist", "Pedestrian", "Car occupant", "Other"]
  .map((key) => ({ key, label: key, hex: App.COLORS[key] }));
const VRU_KEYS = ["Motorcyclist", "Pedal cyclist", "Pedestrian"];

// Map the 12 BITRE road user categories into 5 groups
function shareGroup(roadUser) {
  if (VRU_KEYS.includes(roadUser)) return roadUser;
  if (roadUser.startsWith("Car ")) return "Car occupant";
  return "Other";
}

d3.csv("../data/processed/q2_road_user_share.csv", (d) => ({
  year: +d.year,
  group: shareGroup(d.road_user),
  cases: +d.nonfatal_cases,
})).then((raw) => {
  // Sum cases per year and group, then convert to % of the year total
  const years = d3.sort(d3.union(raw.map((d) => d.year)));
  const sums = d3.rollup(raw, (v) => d3.sum(v, (d) => d.cases), (d) => d.year, (d) => d.group);
  const data = years.map((year) => {
    const byGroup = sums.get(year);
    const total = d3.sum(byGroup.values());
    const row = { year, total };
    SHARE_GROUPS.forEach((g) => {
      row[g.key] = ((byGroup.get(g.key) || 0) / total) * 100;
      row[g.key + "_n"] = byGroup.get(g.key) || 0;
    });
    row.vru = d3.sum(VRU_KEYS, (k) => row[k]);
    return row;
  });

  const container = d3.select("#chart-road-users");
  const legend = d3.select("#legend-road-users");
  let selected = null; // highlighted group key

  // Legend buttons (keyboard accessible)
  legend.selectAll("button").data(SHARE_GROUPS).join("button")
    .attr("type", "button")
    .attr("aria-pressed", "false")
    .html((d) => `<span class="swatch" style="background:${d.hex}"></span>${d.label}`)
    .on("click", (event, d) => {
      selected = selected === d.key ? null : d.key;
      legend.selectAll("button").attr("aria-pressed", (b) => String(b.key === selected));
      container.selectAll(".share-area").classed("dim", (a) => selected && a.key !== selected);
      container.selectAll(".band-label").classed("dim", (a) => selected && a.key !== selected);
    });

  // Key for the black line (not a button: it is always shown)
  legend.append("span").attr("class", "legend-line")
    .html('<i aria-hidden="true"></i>Riders &amp; walkers combined');

  function draw() {
    App.unpin();
    container.classed("live", true).selectAll("*").remove();
    const { width, height } = App.size(container, 0.52, 320, 460);
    const small = width < 560;
    const m = { top: 28, right: small ? 14 : 150, bottom: 36, left: 44 };
    const iw = width - m.left - m.right;
    const ih = height - m.top - m.bottom;

    const svg = container.append("svg")
      .attr("viewBox", `0 0 ${width} ${height}`)
      .attr("aria-hidden", "true");
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

    const x = d3.scaleLinear().domain(d3.extent(years)).range([0, iw]);
    const y = d3.scaleLinear().domain([0, 100]).range([ih, 0]);

    const series = d3.stack().keys(SHARE_GROUPS.map((d) => d.key))(data);

    const area = d3.area()
      .x((d) => x(d.data.year))
      .y0((d) => y(d[0]))
      .y1((d) => y(d[1]));

    g.append("g").attr("class", "share-areas").selectAll(".share-area").data(series).join("path")
      .attr("class", "share-area")
      .classed("dim", (s) => selected && s.key !== selected)
      .attr("fill", (s) => App.COLORS[s.key])
      .attr("d", area);

    g.append("g").attr("class", "axis axis-x")
      .attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(x).ticks(small ? 5 : 11).tickFormat((d) => (small ? `'${String(d).slice(2)}` : d)).tickSizeOuter(0));
    g.append("g").attr("class", "axis axis-y")
      .call(d3.axisLeft(y).ticks(5).tickFormat((d) => d + "%").tickSize(0).tickPadding(8))
      .call((a) => a.select(".domain").remove());

    // The story line: motorcyclists + pedal cyclists + pedestrians combined
    g.append("path").datum(data).attr("class", "vru-line")
      .attr("d", d3.line().x((d) => x(d.year)).y((d) => y(d.vru)));
    const a = data[0], z = data[data.length - 1];
    const ann = g.append("g").attr("class", "vru-ann");
    ann.append("text").attr("class", "vru-title")
      .attr("x", 8).attr("y", y(a.vru) - 30)
      .text("Riders & walkers combined");
    ann.append("text").attr("class", "vru-val")
      .attr("x", 8).attr("y", y(a.vru) - 12)
      .html(`<tspan class="num">${App.fmtPct(a.vru)}%</tspan> in ${a.year}`);
    ann.append("text").attr("class", "vru-val")
      .attr("x", iw - 8).attr("y", y(z.vru) - 12).attr("text-anchor", "end")
      .html(`<tspan class="num">${App.fmtPct(z.vru)}%</tspan> in ${z.year}`);
    ann.selectAll("circle").data([a, z]).join("circle")
      .attr("class", "vru-dot").attr("r", 4.5)
      .attr("cx", (d) => x(d.year)).attr("cy", (d) => y(d.vru));

    // Direct labels at the right edge (desktop only; legend covers mobile)
    if (!small) {
      const lastRow = series.map((s) => ({ key: s.key, mid: (s[s.length - 1][0] + s[s.length - 1][1]) / 2, val: z[s.key] }));
      g.append("text").attr("class", "band-head")
        .attr("x", iw + 12).attr("y", -12)
        .text(`In ${z.year}`);
      const lab = g.selectAll(".band-label").data(lastRow).join("g")
        .attr("class", "band-label")
        .classed("dim", (d) => selected && d.key !== selected)
        .attr("transform", (d) => `translate(${iw + 12},${y(d.mid)})`);
      lab.append("rect").attr("x", 0).attr("y", -5).attr("width", 10).attr("height", 10).attr("rx", 2)
        .attr("fill", (d) => App.COLORS[d.key]);
      lab.append("text").attr("x", 16).attr("dy", "0.35em")
        .html((d) => `${d.key} <tspan class="band-val">${App.fmtPct(d.val)}%</tspan>`);
    }

    // Hover / click / keyboard: show all shares for one year
    const hoverLine = g.append("line").attr("class", "hover-line")
      .attr("y1", 0).attr("y2", ih).style("display", "none");

    function tipHtml(year) {
      const row = data.find((d) => d.year === year);
      const rows = SHARE_GROUPS.slice().reverse().map((gr) =>
        `<div class="row"><span><i class="tip-swatch" style="background:${gr.hex}"></i>${gr.label}</span><b>${App.fmtPct(row[gr.key])}%</b></div>`
      ).join("");
      return `<strong>${year}</strong>${rows}<div class="row tip-total"><span>Riders &amp; walkers</span><b>${App.fmtPct(row.vru)}%</b></div><div class="row"><span>All cases</span><b>${App.fmtInt(row.total)}</b></div>`;
    }
    function moveLine(year) {
      hoverLine.style("display", null).attr("x1", x(year)).attr("x2", x(year));
    }
    const yearAt = (event) => {
      const [mx] = d3.pointer(event, overlay.node());
      return Math.max(years[0], Math.min(years[years.length - 1], Math.round(x.invert(mx))));
    };

    const overlay = g.append("rect")
      .attr("class", "overlay")
      .attr("width", iw).attr("height", ih)
      .attr("fill", "transparent")
      .attr("tabindex", 0)
      .attr("aria-label", "Road user shares by year. Use left and right arrow keys to move between years, Enter to pin.");

    let keyYear = years[years.length - 1];
    overlay
      .on("mousemove", (event) => {
        if (App.pinned) return;
        const year = yearAt(event);
        moveLine(year);
        App.showTooltip(tipHtml(year), event);
      })
      .on("mouseleave blur", () => {
        if (App.pinned) return;
        hoverLine.style("display", "none");
        App.hideTooltip();
      })
      .on("click", (event) => {
        event.stopPropagation();
        const year = yearAt(event);
        const same = App.pinned && App.pinned.el === overlay.node() && App.pinned.year === year;
        App.unpin();
        if (same) return;
        moveLine(year);
        hoverLine.classed("pinned", true);
        App.pin(overlay.node(), tipHtml(year), event, () => {
          hoverLine.classed("pinned", false).style("display", "none");
        });
        App.pinned.year = year;
      })
      .on("focus", () => { if (App.pinned) return; moveLine(keyYear); App.showTooltip(tipHtml(keyYear), { target: overlay.node(), type: "focus" }); })
      .on("keydown", (event) => {
        if (event.key === "Enter" || event.key === " ") {
          event.preventDefault();
          App.unpin();
          moveLine(keyYear);
          hoverLine.classed("pinned", true);
          App.pin(overlay.node(), tipHtml(keyYear), { target: overlay.node(), type: "focus" }, () => hoverLine.classed("pinned", false).style("display", "none"));
          return;
        }
        if (event.key === "ArrowRight") keyYear = Math.min(years[years.length - 1], keyYear + 1);
        else if (event.key === "ArrowLeft") keyYear = Math.max(years[0], keyYear - 1);
        else return;
        event.preventDefault();
        App.unpin();
        moveLine(keyYear);
        App.showTooltip(tipHtml(keyYear), { target: overlay.node(), type: "focus" });
      });
  }

  App.register(draw);
}).catch((err) => {
  d3.select("#chart-road-users").append("p").attr("class", "note")
    .text("Could not load q2_road_user_share.csv. Check the file is in data/processed/.");
  console.error(err);
});
