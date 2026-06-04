import * as d3 from "../../_npm/d3@7.9.0/66d82917.js";

function chart(
  data,
  width,
  height,
  topNresidual = 10,
  xLabelText = "X Axis",
  yLabelText = "Y Axis",
  data_with_weights,
  residualType = "deviance",
  onClick,
) {
  const compact = width <= 500 || height <= 500;
  const margin = compact
    ? { top: 28, right: 18, bottom: 48, left: 58 }
    : { top: 50, right: 30, bottom: 80, left: 100 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const tickFontSize = compact ? 11 : 30;
  const labelFontSize = compact ? 16 : 40;
  const xTickCount = compact ? 5 : 12;
  const observationRadius = compact ? 2 : 5;
  const conditionalRadius = compact ? 5 : 8;
  const residualStrokeWidth = compact ? 1.5 : 3;

  const k = innerHeight / innerWidth;

  const getDomain = (values) => {
    const finiteValues = values.filter((value) => Number.isFinite(value));
    const [min = 0, max = 1] = d3.extent(finiteValues);
    const span = max - min;
    const pad = span > 0 ? span * 0.04 : 0.5;

    return [min - pad, max + pad];
  };

  const xDomain = getDomain(data.map((d) => d.x));
  const yDomain = getDomain(data.map((d) => d.y));

  const x = d3
    .scaleLinear()
    .domain(xDomain)
    .range([0, innerWidth]);

  const y = d3
    .scaleLinear()
    .domain(yDomain)
    .range([innerHeight, 0]);

  const z = d3
    .scaleOrdinal()
    .domain([...new Set(data.map((d) => d.group))])
    .range(d3.schemeCategory10);

  const grouped = d3.group(data, (d) => d.group);

  const wScaleByCat = new Map(
    Array.from(grouped, ([key, values]) => {
      const finiteWeights = values
        .map((d) => d.weight)
        .filter((weight) => Number.isFinite(weight));
      const [minWeight = 0, maxWeight = 1] = d3.extent(finiteWeights);
      const domain = minWeight === maxWeight ? [0, 1] : [minWeight, maxWeight];

      return [
        key,
        d3
          .scaleLinear()
          .domain(domain)
          .range([0.1, 1.5])
          .clamp(true),
      ];
    }),
  );

  const getColor = (d) => {
    if (!Number.isFinite(d.weight)) return z(d.group);
    const base = d3.color(z(d.group));
    const t = wScaleByCat.get(d.group)(d.weight);
    return d3.interpolateRgb("white", base)(t);
  };

  const formatTooltipRows = (rows) =>
    Object.entries(rows)
      .map(
        ([key, value]) => `
        <div>
          <strong>${key}:</strong> ${value ?? ""}
        </div>
      `,
      )
      .join("");

  const svg = d3
    .create("svg")
    .attr("viewBox", [0, 0, width, height])
    .style("overflow", "hidden");

  // ===== Main plotting area =====
  const gMain = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

  const gGrid = gMain.append("g");

  const tooltip = d3
    .select("body")
    .append("div")
    .style("position", "absolute")
    .style("pointer-events", "none")
    .style("background", "rgba(0,0,0,0.7)")
    .style("color", "white")
    .style("padding", "6px 10px")
    .style("border-radius", "4px")
    .style("font-size", "12px")
    .style("visibility", "hidden");

  const gDot = gMain
    .append("g")
    .attr("fill", "none")
    .attr("stroke-linecap", "round");

  // ===== Axes =====
  const gx = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top + innerHeight})`);

  // const gy = svg
  //   .append("g")
  //   .attr("transform", `translate(${margin.left + innerWidth},${margin.top})`);
  const gy = svg
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);
  const xAxis = (g, scale) =>
    g
      .call(d3.axisBottom(scale).ticks(xTickCount))
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll("text").style("font-size", `${tickFontSize}px`));

  const yAxis = (g, scale) =>
    g
      .call(d3.axisLeft(scale).ticks(xTickCount * k))
      .call((g) => g.select(".domain").remove())
      .call((g) => g.selectAll("text").style("font-size", `${tickFontSize}px`));

  const grid = (g, xScale, yScale) =>
    g
      .attr("stroke", "currentColor")
      .attr("stroke-opacity", 0.1)
      .call((g) =>
        g
          .selectAll(".x")
          .data(xScale.ticks(xTickCount))
          .join("line")
          .attr("class", "x")
          .attr("x1", (d) => 0.5 + xScale(d))
          .attr("x2", (d) => 0.5 + xScale(d))
          .attr("y1", 0)
          .attr("y2", innerHeight),
      )
      .call((g) =>
        g
          .selectAll(".y")
          .data(yScale.ticks(xTickCount * k))
          .join("line")
          .attr("class", "y")
          .attr("y1", (d) => 0.5 + yScale(d))
          .attr("y2", (d) => 0.5 + yScale(d))
          .attr("x1", 0)
          .attr("x2", innerWidth),
      );

  const defs = svg.append("defs");

  const glow = defs
    .append("filter")
    .attr("id", "red-glow")
    .attr("x", "-50%")
    .attr("y", "-50%")
    .attr("width", "200%")
    .attr("height", "200%");

  glow
    .append("feGaussianBlur")
    .attr("in", "SourceAlpha")
    .attr("stdDeviation", 1)
    .attr("result", "blur");

  glow.append("feFlood").attr("flood-color", "red").attr("result", "color");

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

  const dataSortedByResidual = data.some((d) => Number.isFinite(d.residual))
    ? d3
        .sort(
          data.map((d, i) => ({ ...d, idx: i })),
          (a, b) => Math.abs(b.residual) - Math.abs(a.residual)
        )
        .slice(0, topNresidual)
    : [];

  const isTopResidual = (datum) =>
    datum.group !== "conditional" && dataSortedByResidual.some((d) => d.idx === datum.idx);
  const sameCoordinate = (a, b) => {
    if (Number.isFinite(a) && Number.isFinite(b)) {
      return Math.abs(a - b) <= 1e-9;
    }

    return String(a) === String(b);
  };
  const overlapsTopResidual = (datum) =>
    datum.group === "conditional" &&
    dataSortedByResidual.some(
      (residualPoint) =>
        sameCoordinate(residualPoint.x, datum.x) && sameCoordinate(residualPoint.y, datum.y),
    );
  const hasResidualHighlight = (datum) => isTopResidual(datum) || overlapsTopResidual(datum);
  const pointKey = (d) => `${d.x}\u0000${d.y}`;
  const stackedGroups = d3.group(
    data.map((d, i) => ({ ...d, idx: i })).filter((d) => d.group !== "conditional"),
    pointKey,
  );
  const jitterByIndex = new Map();
  for (const values of stackedGroups.values()) {
    if (values.length < 2) continue;

    values.forEach((d, index) => {
      const angle = index * 2.399963229728653;
      const radius = compact
        ? Math.min(3.5, 0.8 + Math.sqrt(index) * 0.9)
        : Math.min(10, 2 + Math.sqrt(index) * 3);
      jitterByIndex.set(d.idx, {
        x: Math.cos(angle) * radius,
        y: Math.sin(angle) * radius,
      });
    });
  }
  const getJitter = (d) => jitterByIndex.get(d.idx) || { x: 0, y: 0 };

  gDot
    .selectAll("circle")
    .data(data.map((d, i) => ({ ...d, idx: i })))
    .join("circle")
    .attr("cx", (d) => x(d.x) + getJitter(d).x)
    .attr("cy", (d) => y(d.y) + getJitter(d).y)
    .attr("r", (d) => (d.weight === undefined ? conditionalRadius : observationRadius))
    .attr("fill", (d) => getColor(d))
    .attr("stroke", (d) => (hasResidualHighlight(d) ? "red" : "none"))
    .attr("stroke-width", (d) => (hasResidualHighlight(d) ? residualStrokeWidth : 1))
    .attr("filter", (d) => (hasResidualHighlight(d) ? "url(#red-glow)" : null))
    .on("mouseover", function (event, d) {
      const obs = data_with_weights[d.idx] || d;
      const details = {
        group: d.group,
        index: d.idx,
        residualType,
        [xLabelText]: d.x,
        [yLabelText]: d.y,
        ...obs,
        weight: Number.isFinite(d.weight) ? d.weight : obs.weight,
        residual: Number.isFinite(d.residual) ? d.residual : obs.residual,
      };

      tooltip.style("visibility", "visible").html(`
      ${formatTooltipRows(details)}
    `);

      d3.select(this).attr("stroke", hasResidualHighlight(d) ? "red" : "black");
    })
    .on("mousemove", function (event) {
      tooltip
        .style("top", event.pageY + 10 + "px")
        .style("left", event.pageX + 10 + "px");
    })
    .on("mouseout", function (event) {
      tooltip.style("visibility", "hidden");

      d3.select(this).attr("stroke", (d) => (hasResidualHighlight(d) ? "red" : "none"));
    })
    .on("click", function (event, d) {
      if (!onClick) return;

      const obs = data_with_weights[d.idx];
      if (obs) {
        onClick?.(obs);
      }
      tooltip.style("visibility", "hidden");
    });

  // ===== Labels (in margin area → no clipping) =====
  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr("x", margin.left + innerWidth / 2)
    .attr("y", height - (compact ? 12 : 10))
    .style("font-size", `${labelFontSize}px`)
    .style("font-weight", "600")
    .text(xLabelText);

  svg
    .append("text")
    .attr("text-anchor", "middle")
    .attr(
      "transform",
      `translate(${margin.left / 3}, ${margin.top + innerHeight / 2}) rotate(-90)`,
    )
    .style("font-size", `${labelFontSize}px`)
    .style("font-weight", "600")
    .text(yLabelText);

  // ===== Zoom =====
  const zoom = d3.zoom().scaleExtent([0.5, 32]).on("zoom", zoomed);

  svg.call(zoom).call(zoom.transform, d3.zoomIdentity);

  function zoomed({ transform }) {
    const zx = transform.rescaleX(x);
    const zy = transform.rescaleY(y);

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
