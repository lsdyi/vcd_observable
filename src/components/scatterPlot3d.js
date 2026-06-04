import * as d3 from "npm:d3";
import Plotly from "plotly.js-dist-min";

function unpack(rows, key) {
  return rows.map((row) => row[key]);
}

const formatHoverText = (details) =>
  Object.entries(details)
    .map(([key, value]) => `<b>${key}</b>: ${value ?? ""}`)
    .join("<br>");

export const scatterPlot3d = (
  data,
  keys = ["x", "y", "z"],
  coordinate = [],
  data_with_weights = [],
  residualType = "deviance",
  onClick3D,
) => {
  // --- top residuals ---
  const top = data.some((d) => Number.isFinite(d.residual))
    ? [...data]
        .sort((a, b) => Math.abs(b.residual) - Math.abs(a.residual))
        .slice(0, 10)
    : [];

  const finiteWeights = data_with_weights
    .map((d) => d.weight)
    .filter((weight) => Number.isFinite(weight));
  const [minWeight = 0, maxWeight = 1] = d3.extent(finiteWeights);
  const weightDomain = minWeight === maxWeight ? [0, 1] : [minWeight, maxWeight];
  const wScale = d3
    .scaleLinear()
    .domain(weightDomain)
    .range([0.1, 1])
    .clamp(true);

  const baseColor = d3.color("rgb(31, 119, 180)"); // your default blue

  const getColor = (d) => {
    if (!Number.isFinite(d.weight)) return baseColor.formatRgb();

    const t = wScale(d.weight);
    return d3.interpolateRgb("white", baseColor)(t);
  };

  const colors = data_with_weights.map(getColor);
  const hoverText = data.map((d, index) => {
    const sourceIndex = d.idx ?? index;
    const row = data_with_weights[sourceIndex] || {};

    return formatHoverText({
      index: sourceIndex,
      residualType,
      [keys[0]]: d[keys[0]],
      [keys[1]]: d[keys[1]],
      [keys[2]]: d[keys[2]],
      ...row,
      weight: row.weight,
      residual: d.residual,
    });
  });
  const topHoverText = top.map((d) => {
    const sourceIndex = d.idx;
    const row = data_with_weights[sourceIndex] || {};

    return formatHoverText({
      index: sourceIndex,
      residualType,
      [keys[0]]: d[keys[0]],
      [keys[1]]: d[keys[1]],
      [keys[2]]: d[keys[2]],
      ...row,
      weight: row.weight,
      residual: d.residual,
    });
  });
  const conditionalOverlapsTopResidual = top.some((d) =>
    keys.every((key, index) => Object.is(d[key], coordinate[index])),
  );

  // --- main points ---
  const mainTrace = {
    x: unpack(data, keys[0]),
    y: unpack(data, keys[1]),
    z: unpack(data, keys[2]),
    mode: "markers",
    type: "scatter3d",
    marker: {
      size: 5,
      color: colors,
      opacity: 1,
    },
    text: hoverText,
    hovertemplate: "%{text}<extra></extra>",
    name: "data",
  };

  // --- shadow (glow) for top residuals ---
  const shadowTrace = {
    x: unpack(top, keys[0]),
    y: unpack(top, keys[1]),
    z: unpack(top, keys[2]),
    mode: "markers",
    type: "scatter3d",
    marker: {
      size: 14,
      color: "rgba(255,0,0,0.2)", // soft glow
    },
    hoverinfo: "skip",
  };

  // --- top residual points (red stroke) ---
  const topTrace = {
    x: unpack(top, keys[0]),
    y: unpack(top, keys[1]),
    z: unpack(top, keys[2]),
    mode: "markers",
    type: "scatter3d",
    marker: {
      size: 6,
      color: "white", // center fill
      line: {
        color: "red",
        width: 3, // stroke effect
      },
    },
    text: topHoverText,
    hovertemplate: "%{text}<extra></extra>",
    name: "top residuals",
  };

  // --- conditional point (orange) ---
  const conditionalTrace = {
    x: [coordinate[0]],
    y: [coordinate[1]],
    z: [coordinate[2]],
    mode: "markers",
    type: "scatter3d",
    marker: {
      size: 7,
      color: "orange",
      line: {
        color: conditionalOverlapsTopResidual ? "red" : "rgba(128,81,0,1)",
        width: conditionalOverlapsTopResidual ? 4 : 1,
      },
    },
    text: [
      formatHoverText({
        type: "conditional",
        residualType,
        [keys[0]]: coordinate[0],
        [keys[1]]: coordinate[1],
        [keys[2]]: coordinate[2],
        weight: "",
        residual: "",
      }),
    ],
    hovertemplate: "%{text}<extra></extra>",
    name: "conditional",
  };

  const layout = {
    margin: { l: 0, r: 0, b: 0, t: 0 },
    scene: {
      xaxis: { title: "PC1 Axis" },
      yaxis: { title: "Y Axis" },
      zaxis: { title: "Z Axis" },
    },
  };

  const container = document.createElement("div");

  Plotly.newPlot(
    container,
    [shadowTrace, mainTrace, topTrace, conditionalTrace],
    layout,
  );

  container.on("plotly_click", onClick3D);

  return container;
};
