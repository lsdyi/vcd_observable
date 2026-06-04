import * as Inputs from "../../_node/@observablehq/inputs@0.12.0/index.4eed0a6e.js";

import { getRanges } from "./getRanges.5556642d.js";

export const createRangeFormMap = ({ data, keys, defaults = {}, step = 0.5 }) => {
  const ranges = getRanges(data);
  const formMap = {};

  keys.forEach((key) => {
    const range = ranges[key];

    if (range instanceof Set) {
      const values = Array.from(range).sort((a, b) =>
        typeof a === "number" && typeof b === "number" ? a - b : String(a).localeCompare(String(b)),
      );
      formMap[key] = Inputs.select(values, {
        label: key,
        value: defaults[key] ?? values[0],
      });
      return;
    }

    const { min, max } = range;
    formMap[key] = Inputs.range([min, max], {
      value: defaults[key] ?? (min + max) / 2,
      step,
      label: key,
    });
  });

  return formMap;
};

export const createWeightedScatterGrid = ({
  Plot,
  d3,
  axisPairs,
  data,
  conditionPoint,
  regimeKey,
  residuals,
  residualThreshold = 2,
  pointRadius = 5,
}) => {
  const wmin = d3.min(data, (d) => d.weight) ?? 0;
  const wmax = d3.max(data, (d) => d.weight) ?? 1;
  const scaleWeight = (weight) => (wmax === wmin ? 0.5 : (weight - wmin) / (wmax - wmin));

  return axisPairs.map(([key1, key2]) =>
    Plot.plot({
      title: `${key1} vs ${key2}`,
      height: 250,
      marks: [
        Plot.dot(data, {
          x: key1,
          y: key2,
          sort: "weight",
          fill: (d, index) => {
            const t = scaleWeight(d.weight);
            const highResidual =
              residuals && Math.abs(residuals.values?.[index] ?? 0) > residualThreshold;

            if (highResidual) return d3.interpolateReds(t);
            if (regimeKey && d[regimeKey] === "NegBin") return d3.interpolateReds(t);
            return d3.interpolateBlues(t);
          },
          fillOpacity: 0.85,
        }),
        Plot.dot(
          [
            {
              [key1]: conditionPoint[key1],
              [key2]: conditionPoint[key2],
            },
          ],
          {
            x: key1,
            y: key2,
            fill: "#f28c28",
            stroke: "#805100",
            r: pointRadius,
          },
        ),
      ],
    }),
  );
};

export const createParameterTable = ({ params, labels }) => {
  const table = document.createElement("table");
  table.className = "table";

  const thead = document.createElement("thead");
  thead.innerHTML = "<tr><th>parameter</th><th>estimate</th></tr>";

  const tbody = document.createElement("tbody");
  labels.forEach((label, index) => {
    const row = document.createElement("tr");
    const param = document.createElement("td");
    const estimate = document.createElement("td");

    param.textContent = label;
    estimate.textContent =
      typeof params[index] === "number" ? params[index].toFixed(4) : String(params[index] ?? "");
    row.append(param, estimate);
    tbody.append(row);
  });

  table.append(thead, tbody);
  return table;
};

export const createPortalData = (d3) => {
  const normalPdf = (x, mean, sd) =>
    Math.exp(-0.5 * ((x - mean) / sd) ** 2) / (sd * Math.sqrt(2 * Math.PI));

  const responseGrid = d3.range(-3, 3.05, 0.05);
  const localFitData = responseGrid.flatMap((y) => [
    { y, density: normalPdf(y, 0, 0.75), estimator: "Weighted GLM" },
    {
      y,
      density: 0.62 * normalPdf(y, -0.85, 0.42) + 0.38 * normalPdf(y, 1.15, 0.55),
      estimator: "Conditional kernel",
    },
  ]);

  const rawWeightData = d3.range(-3, 3.05, 0.18).map((x) => ({
    x,
    rawWeight: Math.exp(-0.5 * ((x - 0.45) / 0.65) ** 2),
  }));
  const rawWeightTotal = d3.sum(rawWeightData, (d) => d.rawWeight);
  const maxRawWeight = d3.max(rawWeightData, (d) => d.rawWeight);
  const weightData = rawWeightData.map((d) => ({
    ...d,
    weight: d.rawWeight / rawWeightTotal,
    relativeWeight: d.rawWeight / maxRawWeight,
  }));

  const bandwidthData = d3.range(-3, 3.05, 0.05).flatMap((x) => [
    {
      x,
      weight: Math.exp(-0.5 * ((x - 0.45) / 0.35) ** 2),
      bandwidth: "narrow bandwidth",
    },
    {
      x,
      weight: Math.exp(-0.5 * ((x - 0.45) / 1.05) ** 2),
      bandwidth: "wide bandwidth",
    },
  ]);

  const methodFlow = [
    { step: "Choose a model", detail: "GLM, beta, Poisson, negative binomial", x: 0 },
    { step: "Pick a place", detail: "a conditional point in covariate space", x: 1 },
    { step: "Weight neighbors", detail: "near observations matter more", x: 2 },
    { step: "Compare shapes", detail: "parametric curve vs data-driven estimators", x: 3 },
  ];

  return { bandwidthData, localFitData, methodFlow, weightData };
};
