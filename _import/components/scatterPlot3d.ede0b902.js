import Plotly from "../../_node/plotly.js-dist-min@3.3.1/index.2e2a1aa9.js";

function unpack(rows, key) {
  return rows.map(function (row) {
    return row[key];
  });
}

export const scatterPlot3d = (data, keys = ["x", "y", "z"]) => {
  const trace = [
    {
      x: unpack(data, keys[0]),
      y: unpack(data, keys[1]),
      z: unpack(data, keys[2]),
      mode: "markers",
      type: "scatter3d",
      marker: {
        size: 5,
        color: "rgb(23, 190, 207)",
        opacity: 0.8,
      },
    },
  ];

  const layout = {
    margin: { l: 0, r: 0, b: 0, t: 0 },
    scene: {
      xaxis: { title: "X Axis" },
      yaxis: { title: "Y Axis" },
      zaxis: { title: "Z Axis" },
    },
  };

  // Create the plot
  const container = document.createElement("div");
  Plotly.newPlot(container, trace, layout);
  return container;
};

