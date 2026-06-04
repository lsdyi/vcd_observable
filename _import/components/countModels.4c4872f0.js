import jStat from "../../_node/jstat@1.9.6/index.bc60a888.js";
import { multiply, transpose } from "../../_node/mathjs@undefined/index.7496a740.js";

import { poissonKernel } from "./kernel.a91a6573.js";
import { negBinomialPMF } from "./util.8c2c9357.js";

const poissonPdf = (x, mean) => jStat.jStat.poisson.pdf(x, mean) || 0;
const negBinomialPdf = (x, mean, theta) =>
  negBinomialPMF(x, theta, theta / (mean + theta)) || 0;

export const createCountModelCurves = ({
  d3,
  dataWithWeights,
  covariateKeys,
  conditionPoint,
  estimates,
  isPoissonReg,
  xGrid = d3.range(0, 50, 1),
}) => {
  const coefficientCount = covariateKeys.length + 1;
  const theta = estimates[coefficientCount];
  const meanAt = (covariates) =>
    Math.exp(multiply(transpose([1, ...covariates]), estimates.slice(0, coefficientCount)));
  const densityAt = (x, mean) =>
    isPoissonReg ? poissonPdf(x, mean) : negBinomialPdf(x, mean, theta);
  const conditionalMean = meanAt(conditionPoint);

  const coordinates = xGrid.map((x) => ({
    x,
    y: densityAt(x, conditionalMean),
  }));

  const weightedDen = xGrid.map((x) => ({
    x,
    y: d3.sum(
      dataWithWeights.map((row) => {
        const covariates = covariateKeys.map((key) => row[key]);
        return densityAt(x, meanAt(covariates)) * row.weight;
      }),
    ),
  }));

  return { coordinates, theta, weightedDen, xGrid };
};

export const createPoissonKernelCurve = ({
  d3,
  dataWithWeights,
  responseKey,
  bandwidth,
  xGrid,
}) =>
  xGrid.map((x) => ({
    x,
    y: d3.sum(
      dataWithWeights.map((row) => row.weight * poissonKernel(x, row[responseKey], bandwidth)),
    ),
  }));

export const createCountPmfPlot = ({
  Plot,
  dataWithWeights,
  responseKey,
  coordinates,
  weightedDen,
  ckdCoordinates,
}) =>
  Plot.plot({
    title: "pmf",
    color: {
      legend: true,
    },
    marks: [
      Plot.ruleX([0]),
      Plot.ruleY([0]),
      Plot.barY(dataWithWeights, {
        x: responseKey,
        y: "weight",
        fill: "steelblue",
        opacity: 0.7,
      }),
      Plot.line(coordinates, {
        x: "x",
        y: "y",
        stroke: "#F28C28",
        strokeWidth: 2,
        marker: "circle",
      }),
      Plot.line(weightedDen, {
        x: "x",
        y: "y",
        stroke: "green",
        strokeWidth: 2,
        marker: "circle",
      }),
      Plot.line(ckdCoordinates || [], {
        x: "x",
        y: "y",
        stroke: "red",
        strokeWidth: 2,
        marker: "circle",
      }),
    ],
  });
