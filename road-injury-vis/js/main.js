// Entry point: confirms D3 has loaded. Chart modules will be added per research question.
d3.select("#d3-check")
  .append("p")
  .text(`D3 version ${d3.version} loaded.`);
