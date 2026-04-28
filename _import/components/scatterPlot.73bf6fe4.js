import * as d3 from "../../_npm/d3@7.9.0/66d82917.js";

/**
 *
 * @param {*} data
 * different groups -> different color
 * same group but different weight -> different darkness
 * topNresidual -> red shadow
 * @returns
 */
function chart(data, width, height, topNresidual = 10) {
  const k = height / width;
  const minX = d3.min(data.map((item) => item.x));
  const maxX = d3.max(data.map((item) => item.x));
  const minY = d3.min(data.map((item) => item.y));
  const maxY = d3.max(data.map((item) => item.y));

  const x = d3
    .scaleLinear()
    .domain([minX - 0.5, maxX + 0.5])
    .range([0, width]);

  const y = d3
    .scaleLinear()
    .domain([minY - 0.5, maxY + 0.5])
    .range([height, 0]);

  const z = d3
    .scaleOrdinal()
    .domain([...new Set(data.map((d) => d.group))])
    .range(d3.schemeCategory10);

  const grouped = d3.group(data, (d) => d.group);

  const wScaleByCat = new Map(
    Array.from(grouped, ([key, values]) => [
      key,
      d3
        .scaleLinear()
        .domain(d3.extent(values, (d) => d.weight))
        .range([0.1, 1.5]),
    ]),
  );

  const getColor = (d) => {
    if (d.weight === undefined) {
      return z(d.group);
    }
    const base = d3.color(z(d.group));
    const t = wScaleByCat.get(d.group)(d.weight);

    return d3.interpolateRgb("white", base)(t);
  };

  const xAxis = (g, x) =>
    g
      .attr("transform", `translate(0,${height})`)
      .call(d3.axisTop(x).ticks(12))
      .call((g) => g.select(".domain").attr("display", "none"));

  const yAxis = (g, y) =>
    g
      .call(d3.axisRight(y).ticks(12 * k))
      .call((g) => g.select(".domain").attr("display", "none"));

  const grid = (g, x, y) =>
    g
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.1)
      .call((g) =>
        g
          .selectAll(".x")
          .data(x.ticks(12))
          .join(
            (enter) =>
              enter.append("line").attr("class", "x").attr("y2", height),
            (update) => update,
            (exit) => exit.remove(),
          )
          .attr("x1", (d) => 0.5 + x(d))
          .attr("x2", (d) => 0.5 + x(d)),
      )
      .call((g) =>
        g
          .selectAll(".y")
          .data(y.ticks(12 * k))
          .join(
            (enter) =>
              enter.append("line").attr("class", "y").attr("x2", width),
            (update) => update,
            (exit) => exit.remove(),
          )
          .attr("y1", (d) => 0.5 + y(d))
          .attr("y2", (d) => 0.5 + y(d)),
      );

  const zoom = d3.zoom().scaleExtent([0.5, 32]).on("zoom", zoomed);

  const svg = d3
    .create("svg")
    .attr("viewBox", [0, 0, width, height])
    .attr("style", "overflow:hidden");

  const gGrid = svg.append("g");

  const gDot = svg
    .append("g")
    .attr("fill", "none")
    .attr("stroke-linecap", "round");

  const defs = svg.append("defs");

  const glow = defs
    .append("filter")
    .attr("id", "red-glow")
    .attr("x", "-50%") // expand filter region
    .attr("y", "-50%")
    .attr("width", "200%")
    .attr("height", "200%");

  glow
    .append("feGaussianBlur")
    .attr("in", "SourceAlpha") // 👈 use circle shape only
    .attr("stdDeviation", 1)
    .attr("result", "blur");

  glow
    .append("feFlood")
    .attr("flood-color", "red")
    .attr("flood-opacity", 1)
    .attr("result", "color");

  glow
    .append("feComposite")
    .attr("in", "color")
    .attr("in2", "blur")
    .attr("operator", "in")
    .attr("result", "shadow");

  glow
    .append("feMerge")
    .selectAll("feMergeNode")
    .data(["shadow", "SourceGraphic"])
    .join("feMergeNode")
    .attr("in", (d) => d);

  const dataSortedByResidual = d3
    .sort(
      data.map((item, index) => ({
        ...item,
        idx: index,
      })),
      (item) => item.residual,
    )
    .slice(0, topNresidual);

  gDot
    .selectAll("circle")
    .data(data)
    .join("circle")
    .attr("cx", (d) => x(d.x))
    .attr("cy", (d) => y(d.y))
    .attr("r", (d) => (d.weight === undefined ? 8 : 5))
    .attr("fill", (d) => getColor(d))
    .attr("style", (_, index) =>
      dataSortedByResidual.findIndex((item) => item.idx === index) !== -1
        ? `overflow:hidden;stroke:red`
        : `overflow:hidden`,
    )
    .attr("filter", (_, index) =>
      dataSortedByResidual.findIndex((item) => item.idx === index) !== -1
        ? "url(#red-glow)"
        : null,
    );

  const gx = svg.append("g");
  const gy = svg.append("g");

  svg.call(zoom).call(zoom.transform, d3.zoomIdentity);

  function zoomed({ transform }) {
    const zx = transform.rescaleX(x).interpolate(d3.interpolateRound);
    const zy = transform.rescaleY(y).interpolate(d3.interpolateRound);

    gDot.attr("transform", transform).attr("stroke-width", 5 / transform.k);

    gx.call(xAxis, zx);
    gy.call(yAxis, zy);
    gGrid.call(grid, zx, zy);
  }

  return Object.assign(svg.node(), {
    reset() {
      svg.transition().duration(750).call(zoom.transform, d3.zoomIdentity);
    },
  });
}

export { chart };
