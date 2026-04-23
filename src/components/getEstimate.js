import _ from "lodash";

import { loess } from "./r.js";

import { multiply, transpose, dotMultiply, add } from "mathjs";
import * as d3 from "npm:d3";
import jStat from "jstat";

import { poissonKernel } from "./kernel.js";

const getEstimate = async (
  family,
  modelOutput,
  conditionPoint,
  data_with_weights,
  keys,
  responseKey,
) => {
  if (family === "beta regression") {
    const betas = modelOutput.values[0].values;
    const phi = modelOutput.values[4].values[0];

    const linearCom = multiply(transpose([1, ...conditionPoint]), betas);
    const mu = 1 / (1 + Math.exp(-linearCom));

    const xGrid = d3.range(0, 1, 0.01);

    const coordinates = xGrid.map((item) => {
      return {
        x: item,
        y: jStat.beta.pdf(item, mu * phi, (1 - mu) * phi),
      };
    });

    const weightedGLM = xGrid.map((xCor) => {
      const yList = data_with_weights.map((item) => {
        const covariateObj = _.pick(item, ["X1", "X2", "X3"]);
        const covariates = Object.values(covariateObj);
        const linearCom = multiply(transpose([1, ...covariates]), betas);
        const mu = 1 / (1 + Math.exp(-linearCom));

        const y = jStat.beta.pdf(xCor, mu * phi, (1 - mu) * phi);
        return y * item.weight;
      });

      return {
        x: xCor,
        y: d3.sum(yList),
      };
    });

    const h = 1;

    const ckCoordinates = xGrid.map((item) => {
      const temp = data_with_weights.map((datapoint) => {
        const { Y, weight } = datapoint;
        return (1 / h) * weight * jStat.normal.pdf((item - Y) / h, 0, 1);
      });
      return {
        x: item,
        y: d3.sum(temp),
      };
    });

    // const loessRes = await loess();
    // const loessMu = loessRes.values[0];

    // const data_with_weights_e = data_with_weights.map((d, index) => ({
    //   ...d,
    //   e: d.Y - loessMu,
    // }));
    // const weightedResidual = d3.sum(
    //   data_with_weights_e.map((item) => item.weight * item.e),
    // );

    // const modCkdCoordinates = xGrid.map((item) => {
    //   const temp = data_with_weights_e.map((datapoint) => {
    //     const { Y, weight, e } = datapoint;
    //     const yStar = loessMu + e - weightedResidual;
    //     return (1 / h) * weight * jStat.normal.pdf((item - yStar) / h, 0, 1);
    //   });
    //   return {
    //     x: item,
    //     y: d3.sum(temp),
    //   };
    // });
    return {
      coordinates,
      weightedGLM,
      ckCoordinates,
      modCkdCoordinates: [],
    };
  } else if (family === `poisson(link = "log")`) {
    const estimates = modelOutput.values;

    const mean = Math.exp(
      multiply(
        transpose([1, ...conditionPoint]),
        estimates.slice(0, keys.length + 1),
      ),
    );

    const xGrid = d3.range(0, 50, 1);
    const coordinates = xGrid.map((item) => {
      return {
        x: item,
        y: jStat.jStat.poisson.pdf(item, mean) || 0,
      };
    });

    const weightedGLM = xGrid.map((xCor) => {
      const yList = data_with_weights.map((item) => {
        const covariateObj = _.pick(item, keys);
        const covariates = Object.values(covariateObj);
        const mean = Math.exp(
          multiply(
            transpose([1, ...covariates]),
            estimates.slice(0, keys.length + 1),
          ),
        );
        const y = jStat.jStat.poisson.pdf(xCor, mean) || 0;
        return y * item.weight;
      });

      return {
        x: xCor,
        y: d3.sum(yList),
      };
    });

    const h = jStat.stdev(
      data_with_weights.map((item) => item[responseKey[0]]),
    );

    const hy = 0.7228501;

    const ckCoordinates = xGrid.map((item) => {
      const temp = data_with_weights.map((datapoint) => {
        const { weight } = datapoint;
        const response = datapoint[responseKey[0]];
        return weight * poissonKernel(item, response, h);
      });
      return {
        x: item,
        y: d3.sum(temp),
      };
    });

    return {
      coordinates,
      weightedGLM,
      ckCoordinates,
    };
  } else if (family === `negative binomial regression`) {
    const estimates = modelOutput.values;

    const mean = Math.exp(
      multiply(
        transpose([1, ...conditionPoint]),
        estimates.slice(0, keys.length + 1),
      ),
    );
    const theta = estimates[estimates.length - 1];

    const xGrid = d3.range(0, 50, 1);
    const coordinates = xGrid.map((item) => {
      return {
        x: item,
        y: jStat.negbin.pdf(item, theta, theta / (mean + theta)) || 0,
      };
    });

    const weightedGLM = xGrid.map((xCor) => {
      const yList = data_with_weights.map((item) => {
        const y = jStat.negbin.pdf(xCor, theta, theta / (mean + theta)) || 0;
        return y * item.weight;
      });

      return {
        x: xCor,
        y: d3.sum(yList),
      };
    });

    const h = jStat.stdev(
      data_with_weights.map((item) => item[responseKey[0]]),
    );

    const hy = 0.7228501;

    const ckCoordinates = xGrid.map((item) => {
      const temp = data_with_weights.map((datapoint) => {
        const { weight } = datapoint;
        const response = datapoint[responseKey[0]];
        return weight * poissonKernel(item, response, h);
      });
      return {
        x: item,
        y: d3.sum(temp),
      };
    });

    return {
      coordinates,
      weightedGLM,
      ckCoordinates,
    };
  }
};

export { getEstimate };
