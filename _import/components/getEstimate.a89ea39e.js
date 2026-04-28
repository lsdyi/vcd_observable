import _ from "../../_node/lodash@4.17.23/index.7ea066fd.js";
import { multiply, transpose } from "../../_node/mathjs@undefined/index.7496a740.js";
import * as d3 from "../../_npm/d3@7.9.0/66d82917.js";
import jStat from "../../_node/jstat@1.9.6/index.bc60a888.js";

import { loess } from "./r.f6ca0c3a.js";
import { negBinomialPMF } from "./util.8c2c9357.js";
import { poissonKernel, kContinuous } from "./kernel.38228dd3.js";

const getEstimate = async (
  family,
  modelOutput,
  conditionPoint,
  data_with_weights,
  keys,
  responseKey,
  responseBw,
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
    
    const ckCoordinates = xGrid.map((item) => {
      const temp = data_with_weights.map((datapoint) => {
        const { Y, weight } = datapoint;
        return (
          (1 / responseBw) *
          weight *
          kContinuous(item, Y, responseBw)
        );
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
    // const xGrid = d3.range(data_with_weights[responseKey]);
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

    const ckCoordinates = xGrid.map((item) => {
      const temp = data_with_weights.map((datapoint) => {
        const { weight } = datapoint;
        const response = datapoint[responseKey[0]];
        return weight * poissonKernel(item, response, responseBw);
      });
      return {
        x: item,
        y: d3.sum(temp),
      };
    });
    const normalizer = d3.sum(ckCoordinates.map((item) => item.y));

    return {
      coordinates,
      weightedGLM,
      ckCoordinates: ckCoordinates.map((item) => {
        const { y } = item;
        return {
          ...item,
          y: y / normalizer,
        };
      }),
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

    // const response = data_with_weights.map(item => item[responseKey])
    // const minRes = d3.min(response)
    // const maxRes = d3.max(response)
    // const xGrid = d3.range(minRes, maxRes);
    const xGrid = d3.range(0, 50, 1);

    const coordinates = xGrid.map((item) => {
      return {
        x: item,
        y: negBinomialPMF(item, theta, theta / (mean + theta)) || 0,
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

        const y = negBinomialPMF(xCor, theta, theta / (mean + theta)) || 0;
        return y * item.weight;
      });

      return {
        x: xCor,
        y: d3.sum(yList),
      };
    });

    const ckCoordinates = xGrid.map((item) => {
      const temp = data_with_weights.map((datapoint) => {
        const { weight } = datapoint;
        const response = datapoint[responseKey[0]];
        return weight * poissonKernel(item, response, responseBw);
      });
      return {
        x: item,
        y: d3.sum(temp),
      };
    });

    const normalizer = d3.sum(ckCoordinates.map((item) => item.y));

    return {
      coordinates,
      weightedGLM,
      ckCoordinates: ckCoordinates.map((item) => {
        const { y } = item;
        return {
          ...item,
          y: y / normalizer,
        };
      }),
    };
  }
};

export { getEstimate };
