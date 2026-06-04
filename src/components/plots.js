import { getCombinations } from "./getCombinations.js";
import { chart } from "./scatterPlot.js";
import { scatterPlot3d } from "./scatterPlot3d.js";

export const createPcaScatter3d = ({
  pcaData,
  residuals = [],
  residualType = "deviance",
  pcCordinate,
  dataWithWeights,
  onClick,
}) =>
  scatterPlot3d(
    pcaData.map((item, index) => ({
      ...item,
      idx: index,
      residual: residuals[index],
    })),
    ["pc1", "pc2", "pc3"],
    pcCordinate,
    dataWithWeights,
    residualType,
    onClick,
  );

export const createConditionalScatterGrid = ({
  keys,
  dataWithWeights,
  residuals = [],
  residualType = "deviance",
  conditionPointObj,
  width,
  onClick,
}) =>
  getCombinations(keys, 2).map(([key1, key2]) =>
    chart(
      [
        ...dataWithWeights.map((item, index) => ({
          group: "observation",
          x: item[key1],
          y: item[key2],
          weight: item.weight,
          residual: residuals[index],
        })),
        {
          group: "conditional",
          x: conditionPointObj[key1],
          y: conditionPointObj[key2],
        },
      ],
      width,
      width,
      10,
      key1,
      key2,
      dataWithWeights,
      residualType,
      onClick,
    ),
  );

export const createResponseDensityPlot = ({
  Plot,
  d3,
  name,
  responseKey,
  dataWithWeights,
  modelState,
  selectedEstimators,
}) => {
  const { coordinates, weightedGLM, ckCoordinates, modCkdCoordinates } = modelState;
  const selectedIds = new Set(selectedEstimators.map((item) => item.id));
  const showGLMEstimator = selectedIds.has(0);
  const showWeightedGLMEstimator = selectedIds.has(1);
  const showCKE = selectedIds.has(2);
  const showModifiedCKE = selectedIds.has(3);
  const showWeightedHist = selectedIds.has(4);

  const marks =
    name === "Continous Response"
      ? [
          Plot.ruleX([0]),
          Plot.ruleY([0]),
          Plot.rectY(
            showWeightedHist && dataWithWeights.map((item) => ({ ...item, active: true })),
            Plot.binX(
              {
                y: (bindata, bin) =>
                  d3.sum(bindata.map((d) => d.weight)) / (bin.x2 - bin.x1),
              },
              { x: "Y", thresholds: 50, fill: "steelblue", opacity: 0.7 },
            ),
          ),
          Plot.line(showGLMEstimator && coordinates, {
            x: "x",
            y: "y",
            stroke: "#F28C28",
            strokeWidth: 2,
          }),
          Plot.line(showCKE && ckCoordinates, {
            x: "x",
            y: "y",
            stroke: "red",
            strokeWidth: 2,
          }),
          Plot.line((showModifiedCKE && modCkdCoordinates) || [], {
            x: "x",
            y: "y",
            stroke: "black",
            strokeWidth: 2,
          }),
          Plot.line(showWeightedGLMEstimator && weightedGLM, {
            x: "x",
            y: "y",
            stroke: "green",
            strokeWidth: 2,
          }),
        ]
      : [
          Plot.ruleX([0]),
          Plot.ruleY([0]),
          Plot.barY(showWeightedHist && dataWithWeights, {
            x: responseKey[0],
            y: "weight",
            fill: "steelblue",
            opacity: 0.7,
          }),
          Plot.line(showGLMEstimator && coordinates, {
            x: "x",
            y: "y",
            stroke: "#F28C28",
            strokeWidth: 2,
            marker: "circle",
          }),
          Plot.line(showWeightedGLMEstimator && weightedGLM, {
            x: "x",
            y: "y",
            stroke: "green",
            strokeWidth: 2,
            marker: "circle",
          }),
          Plot.line(showCKE && ckCoordinates, {
            x: "x",
            y: "y",
            stroke: "red",
            strokeWidth: 2,
            marker: "circle",
          }),
        ];

  return Plot.plot({
    title: name === "Continous Response" ? "pdf" : "pmf",
    color: {
      legend: true,
    },
    marks,
  });
};

export const createWeightedScatterGridPlot = ({
  Plot,
  d3,
  axisPairs,
  data,
  conditionPoint,
}) =>
  axisPairs.map(([key1, key2]) =>
    Plot.plot({
      color: {
        scheme: "blues",
        transform: (f) => Math.sqrt(f),
      },
      title: `${key1} vs ${key2}`,
      marks: [
        Plot.dot(data, {
          x: key1,
          y: key2,
          fill: "weight",
          sort: "weight",
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
            fill: "orange",
            r: 5,
          },
        ),
      ],
    }),
  );
