import * as d3 from "npm:d3";
import Plotly from "plotly.js-dist-min";

function unpack(rows, key) {
  return rows.map((row) => row[key]);
}

export const scatterPlot3d = (
  data,
  keys = ["x", "y", "z"],
  coordinate = [],
  data_with_weights = [],
  onClick3D
) => {
  // --- top residuals ---
  const top = [...data]
    .sort((a, b) => Math.abs(b.residual) - Math.abs(a.residual))
    .slice(0, 10);

  const wScale = d3
    .scaleLinear()
    .domain(d3.extent(data_with_weights, (d) => d.weight))
    .range([0.1, 1]);

  const baseColor = d3.color("rgb(31, 119, 180)"); // your default blue

  const getColor = (d) => {
    if (d.weight === undefined) return baseColor.formatRgb();

    const t = wScale(d.weight);
    return d3.interpolateRgb("white", baseColor)(t);
  };

  const colors = data_with_weights.map(getColor);
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
    },
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
