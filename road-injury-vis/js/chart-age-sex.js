// Chart 3 (Q3): age and sex pyramid with year and road user filters.
// Data: data/processed/q3_age_sex_road_user.csv (exported from KNIME)
// Columns used: year, age_group, sex, road_user, age_order, nonfatal_cases

const Q3_SEX = [
  { key: "Male", hex: App.COLORS.Male },
  { key: "Female", hex: App.COLORS.Female },
];
const Q3_USERS = ["All road users", "Vulnerable road users", "Motorcyclist", "Pedal cyclist", "Pedestrian", "Car occupant", "Other"];

// Same grouping as Chart 2
function q3Group(roadUser) {
  if (["Motorcyclist", "Pedal cyclist", "Pedestrian"].includes(roadUser)) return roadUser;
  if (roadUser.startsWith("Car ")) return "Car occupant";
  return "Other";
}

d3.csv("../data/processed/q3_age_sex_road_user.csv", (d) => ({
  year: +d.year,
  age: d.age_group,
  order: +d.age_order,
  sex: d.sex,
  group: q3Group(d.road_user),
  cases: +d.nonfatal_cases,
})).then((raw) => {
  // Keep known age groups and Male / Female only
  const rows = raw.filter((d) => d.age !== "Missing" && (d.sex === "Male" || d.sex === "Female"));
  const ages = d3.sort(d3.union(rows.map((d) => d.age)), (a) => rows.find((r) => r.age === a).order);
  const years = d3.sort(d3.union(rows.map((d) => d.year)));

  const yearSel = d3.select("#q3-year");
  yearSel.selectAll("option").data(["all", ...years]).join("option")
    .attr("value", (d) => d)
    .text((d) => (d === "all" ? "All years (2011–2021)" : d));
  yearSel.property("value", years[years.length - 1]);

  const userSel = d3.select("#q3-user");
  userSel.selectAll("option").data(Q3_USERS).join("option").attr("value", (d) => d).text((d) => d);

  const container = d3.select("#chart-age-sex");
  yearSel.on("change", draw);
  userSel.on("change", draw);

  function filtered() {
    const year = yearSel.property("value");
    const user = userSel.property("value");
    return rows.filter((d) =>
      (year === "all" || d.year === +year) &&
      (user === "All road users" ||
        (user === "Vulnerable road users" && ["Motorcyclist", "Pedal cyclist", "Pedestrian"].includes(d.group)) ||
        d.group === user));
  }

  function draw() {
    App.unpin();
    const sel = filtered();
    const sums = d3.rollup(sel, (v) => d3.sum(v, (d) => d.cases), (d) => d.age, (d) => d.sex);
    const sexTotal = d3.rollup(sel, (v) => d3.sum(v, (d) => d.cases), (d) => d.sex);
    const allTotal = (sexTotal.get("Male") || 0) + (sexTotal.get("Female") || 0) || 1;
    const data = ages.map((age) => ({
      age,
      Male: sums.get(age)?.get("Male") || 0,
      Female: sums.get(age)?.get("Female") || 0,
    }));

    container.classed("live", true).selectAll("*").remove();
    const { width, height } = App.size(container, 0.5, 340, 440);
    const small = width < 560;
    const m = { top: 52, right: small ? 34 : 48, bottom: 32, left: small ? 34 : 48 };
    const mid = small ? 52 : 72; // centre column for age labels
    const iw = width - m.left - m.right;
    const ih = height - m.top - m.bottom;
    const half = (iw - mid) / 2;

    const svg = container.append("svg").attr("viewBox", `0 0 ${width} ${height}`).attr("aria-hidden", "true");
    const g = svg.append("g").attr("transform", `translate(${m.left},${m.top})`);

    const maxV = d3.max(data, (d) => Math.max(d.Male, d.Female)) || 1;
    const x = d3.scaleLinear().domain([0, maxV]).nice().range([0, half]);
    const y = d3.scaleBand().domain(ages.slice().reverse()).range([0, ih]).padding(0.2);
    const { h: bh, off } = App.barBand(y, small ? 22 : 26);

    // Hairline grid and axes on both halves (left side reversed for males)
    const ticks = small ? 2 : 4;
    const xl = x.copy().range([half, 0]);
    const xr = x.copy().range([half + mid, half + mid + half]);
    g.append("g").attr("class", "grid").attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(xl).ticks(ticks).tickSize(-ih).tickFormat(""));
    g.append("g").attr("class", "grid").attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(xr).ticks(ticks).tickSize(-ih).tickFormat(""));
    g.append("g").attr("class", "axis axis-x").attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(xl).ticks(ticks).tickFormat(App.fmtK).tickSizeOuter(0));
    g.append("g").attr("class", "axis axis-x").attr("transform", `translate(0,${ih})`)
      .call(d3.axisBottom(xr).ticks(ticks).tickFormat(App.fmtK).tickSizeOuter(0));

    // Side headings: swatch + sex + total + share (text stays in ink, the swatch carries colour)
    Q3_SEX.forEach((s, i) => {
      const total = sexTotal.get(s.key) || 0;
      const right = i === 1;
      const hx = right ? half + mid : half;
      const head = g.append("g").attr("class", "side-head")
        .attr("transform", `translate(${hx},-30)`);
      const label = head.append("text")
        .attr("text-anchor", right ? "start" : "end")
        .attr("x", right ? 18 : -18)
        .html(`<tspan class="side-label">${s.key}</tspan> <tspan class="side-val">${App.fmtInt(total)} · ${Math.round((total / allTotal) * 100)}%</tspan>`);
      head.append("rect").attr("x", right ? 0 : -12).attr("y", -10).attr("width", 12).attr("height", 12).attr("rx", 3).attr("fill", s.hex);
      label.attr("dy", 0);
    });

    // Age labels in the middle
    g.selectAll(".age-label").data(ages).join("text")
      .attr("class", "age-label")
      .attr("x", half + mid / 2).attr("y", (d) => y(d) + y.bandwidth() / 2)
      .attr("dy", "0.35em").attr("text-anchor", "middle")
      .text((d) => d);

    // Bars
    const bars = [];
    data.forEach((d) => {
      bars.push({ age: d.age, sex: "Male", value: d.Male, other: d.Female });
      bars.push({ age: d.age, sex: "Female", value: d.Female, other: d.Male });
    });
    // The largest age group on each side gets a bold label
    const peak = {
      Male: d3.greatest(data, (d) => d.Male)?.age,
      Female: d3.greatest(data, (d) => d.Female)?.age,
    };
    const year = yearSel.property("value");
    const user = userSel.property("value");

    function tip(d) {
      const total = sexTotal.get(d.sex) || 1;
      const ratio = d.other ? d.value / d.other : 0;
      return `<strong>${d.sex}, aged ${d.age}</strong>` +
        `<div class="row"><span>Cases</span><b>${App.fmtInt(d.value)}</b></div>` +
        `<div class="row"><span>Share of all ${d.sex.toLowerCase()}s</span><b>${App.fmtPct((d.value / total) * 100)}%</b></div>` +
        (d.sex === "Male" && d.other ? `<div class="row"><span>Males per female</span><b>${ratio.toFixed(1)}</b></div>` : "") +
        `<em>${user}, ${year === "all" ? "2011–2021" : year}</em>`;
    }

    const barSel = g.selectAll(".bar").data(bars).join("path")
      .attr("class", (d) => (d.sex === "Male" ? "bar grow-left" : "bar"))
      .style("animation-delay", (d) => `${(ages.length - 1 - ages.indexOf(d.age)) * 60}ms`)
      .attr("fill", (d) => (d.sex === "Male" ? Q3_SEX[0].hex : Q3_SEX[1].hex))
      .attr("d", (d) => (d.sex === "Male"
        ? App.barPath(half - x(d.value), y(d.age) + off, x(d.value), bh, "left")
        : App.barPath(half + mid, y(d.age) + off, x(d.value), bh, "right")))
      .attr("tabindex", 0)
      .attr("role", "button")
      .attr("aria-label", (d) => `${d.sex}, aged ${d.age}: ${App.fmtInt(d.value)} cases. Press Enter to pin details.`);
    App.tip(barSel, tip);

    // Value labels at the bar ends
    g.selectAll(".bar-label").data(bars).join("text")
      .attr("class", "bar-label")
      .classed("peak", (d) => peak[d.sex] === d.age)
      .attr("x", (d) => (d.sex === "Male" ? half - x(d.value) - 6 : half + mid + x(d.value) + 6))
      .attr("y", (d) => y(d.age) + y.bandwidth() / 2)
      .attr("dy", "0.35em")
      .attr("text-anchor", (d) => (d.sex === "Male" ? "end" : "start"))
      .text((d) => (small && d.value >= 1000 ? `${(d.value / 1000).toFixed(1)}K` : App.fmtInt(d.value)));
  }

  App.register(draw);
}).catch((err) => {
  d3.select("#chart-age-sex").append("p").attr("class", "note")
    .text("Could not load q3_age_sex_road_user.csv. Check the file is in data/processed/.");
  console.error(err);
});
