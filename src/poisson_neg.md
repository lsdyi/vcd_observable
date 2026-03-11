---
title: Poisson & Negtive Binomial Regression
toc: false
---

```js
import _ from "lodash";
import jStat from "jstat";
import { multiply, transpose, dotMultiply, add } from "mathjs";

import { useOption } from "./components/hook/useOption.js";
import { modelList } from "./components/modelList.js";
import { getRanges } from "./components/getRanges.js";
import { modelConfig } from "./components/modelConfig.js";
import { normWeights } from "./components/normWeights.js";
import {
  negRegession,
  webR,
  getSummary,
  poissonRegession,
} from "./components/r.js";
import { getCombinations } from "./components/getCombinations.js";
import { PcaInputRange } from "./components/UI/PcaInputRange.js";
import { scatterPlot3d } from "./components/scatterPlot3d.js";
import { getPcaData } from "./components/getPcaData.js";
import { matrixData } from "./components/organizeData.js";
```

# Poisson & Negtive Binomial Regression

This document firstly fits data using poisson regression. According to lack fit in some data points, change to negtive binomial regression which is expected to have a good fit. The document provides the process of checking model fit or lack fit using visulization method.

These two regression methods model count data. In terms of histogram estimate, bar chart is used here. Each bar height equals to weight, and they sum up to one. In histogram context, the area of histogram should be one.

## Dataset from dgp

Data generating process references [thesis paper](https://www.overleaf.com/project/696eb73c13ae0d69be0a84bd).

```js
display(Inputs.table(poiNegData));
```

```js
const poiNegData = FileAttachment("./data/dgp.csv").csv({
  typed: true,
});
```

## Select Conditional Data

```js
const conditionPointObj = view(Inputs.form(formMap));
```

Covariates scatterplots are shown here. They're color firstly by regime property which indicates response. And darker color points means they're closer to conidtional datapoint in terms of Mahalanobis distance.

<div class="grid grid-cols-4">
  ${sactterAr.map(scatter => {
    return scatter
  })}
</div>

```js
display(pdfplot);
```

## Weight Datapoint

```js
const kernal = view(
  Inputs.range([0.1, 100], {
    value: 10,
    step: 0.1,
    label: "kernal weight",
  }),
);
```

Every data point with weight is listed as follows.

```js
display(data_with_weights);
```

## Generalized linear model

```js
const model = view(
  Inputs.select(["Poisson Regression", "Negative Binomial Regression"], {
    unique: true,
    label: "Select Model",
  }),
);
```

```js
display(summary);
```

<!-- js logics -->

```js
const keys = ["x1", "x2", "x3"];
const formMap = {};
const ranges = getRanges(poiNegData);
keys.forEach((key) => {
  const result = ranges[key];
  if (result instanceof Set) {
    // @todo: countable variable
  } else {
    const { min, max } = result;
    formMap[key] = Inputs.range([min, max], {
      value: (min + max) / 2,
      step: 0.1,
      label: key,
    });
  }
});
```

```js
const dim = 2;
const keys = ["x1", "x2", "x3"];
const axisAr = getCombinations(keys, dim);
const conditionPoint = Object.values(conditionPointObj);
const temp = keys.map((key) => poiNegData.map((item) => item[key]));
const stdevs = temp.map((item) => jStat.stdev(item));

const data = poiNegData.map((item) => _.pick(item, keys));
const unnormalizedweights = normWeights(
  data,
  conditionPoint,
  stdevs,
  undefined,
  kernal,
);
const totalunnormalizedweight = d3.sum(unnormalizedweights.map((d) => d.w));
const weights = unnormalizedweights.map((d) => ({
  id: d.id,
  w: d.w / totalunnormalizedweight,
}));

const data_with_weights = data.map((d, index) => ({
  ...d,
  Y: poiNegData[index].y,
  regime: poiNegData[index].regime,
  weight: weights.find((item) => item.id === index).w,
}));

const wmin = d3.min(data_with_weights, (d) => d.weight);
const wmax = d3.max(data_with_weights, (d) => d.weight);

const sactterAr = axisAr.map((item) => {
  const [key1, key2] = item;
  return Plot.plot({
    title: `${key1} vs ${key2}`,
    marks: [
      Plot.dot(data_with_weights, {
        x: key1,
        y: key2,
        fill: (d) => {
          const t = (d.weight - wmin) / (wmax - wmin);
          return d3.interpolateReds(t);
        },
        filter: (d) => d.regime === "NegBin",
      }),

      Plot.dot(data_with_weights, {
        x: key1,
        y: key2,
        sort: "weight",
        fill: (d) => {
          const t = (d.weight - wmin) / (wmax - wmin);
          return d3.interpolateBlues(t);
        },
        filter: (d) => d.regime === "Poisson",
      }),

      // conditional data point with orange color
      Plot.dot(
        [
          {
            [key1]: conditionPointObj[key1],
            [key2]: conditionPointObj[key2],
          },
        ],
        {
          x: key1,
          y: key2,
          fill: "orange",
          r: 10,
        },
      ),
    ],
  });
});
```

```js
const isPoissonReg = model === "Poisson Regression";
// R regression code
await webR.objs.globalEnv.bind("poiNegData", poiNegData);
// const output = await negRegession();
const output = isPoissonReg ? await poissonRegession() : await negRegession();
const estimates = output.values;
const summary = await getSummary();

const mean = Math.exp(
  multiply(transpose([1, ...conditionPoint]), estimates.slice(0, 4)),
);

const theta = estimates[4];

const xGrid = d3.range(0, 50, 1);
const coordinates = xGrid.map((item) => {
  if (isPoissonReg) {
    return {
      x: item,
      y: jStat.jStat.poisson.pdf(item, mean) || 0,
    };
  } else {
    return {
      x: item,
      y: jStat.negbin.pdf(item, theta, mean / (mean + theta)) || 0,
    };
  }
});

const denCoordinates = xGrid.map((xCor) => {
  if (isPoissonReg) {
    const yList = data_with_weights.map((item) => {
      const covariateObj = _.pick(item, ["x1", "x2", "x3"]);
      const covariates = Object.values(covariateObj);
      const mean = Math.exp(
        multiply(transpose([1, ...covariates]), estimates.slice(0, 4)),
      );
      const y = jStat.jStat.poisson.pdf(xCor, mean) || 0;
      return y * item.weight;
    });

    return {
      x: xCor,
      y: d3.sum(yList),
    };
  } else {
    const yList = data_with_weights.map((item) => {
      const covariateObj = _.pick(item, ["x1", "x2", "x3"]);
      const covariates = Object.values(covariateObj);
      const mean = Math.exp(
        multiply(transpose([1, ...covariates]), estimates.slice(0, 4)),
      );
      const y = jStat.negbin.pdf(xCor, theta, mean / (mean + theta)) || 0;
      return y * item.weight;
    });

    return {
      x: xCor,
      y: d3.sum(yList),
    };
  }
});

const h = jStat.stdev(data_with_weights.map((item) => item.Y));
const ckdCoordinates = xGrid.map((item) => {
  const temp = data_with_weights.map(datapoint => {
    return datapoint.Y === item ? datapoint.weight : 0
  })
  return {
    x: item,
    y: d3.sum(temp)
  };
});

const pdfplot = Plot.plot({
  title: "pmf",

  color: {
    legend: true,
  },

  marks: [
    Plot.ruleX([0]),
    Plot.ruleY([0]),
    Plot.barY(data_with_weights, {
      x: "Y",
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
    Plot.line(denCoordinates, {
      x: "x",
      y: "y",
      stroke: "green",
      strokeWidth: 2,
      marker: "circle",
    }),
    Plot.line(ckdCoordinates, {
      x: "x",
      y: "y",
      stroke: "red",
      strokeWidth: 2,
      marker: "circle",
    }),
  ],
});
```
