---
title: Poisson & Negative Binomial Regression
toc: false
---

```js
import _ from "lodash";
import jStat from "jstat";
import { multiply, transpose } from "mathjs";

import { normWeights } from "./components/normWeights.js";
import {
  negativeBinomialRegression,
  webR,
  getSummary,
  poissonRegression,
} from "./components/r.js";
import { getCombinations } from "./components/getCombinations.js";
import {
  attachWeights,
  createRangeFormMap,
  createWeightedScatterGrid,
  normalizeWeights,
} from "./components/pageComponents.js";
```

# Poisson & Negative Binomial Regression

This page is the thesis method in its most controlled setting. The data are generated from two count regimes: one region follows a Poisson model, while another region has extra variation and is better described by a negative-binomial model.

The global story can look calm. The local story is sharper: after choosing a conditional point, the weighted bar chart shows the empirical count distribution around that point, and the model curves show whether Poisson or negative binomial regression follows the same shape.

## Dataset from dgp

The simulated data are the locally overdispersed count experiment from the thesis.

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

The scatterplots show where the chosen point sits in covariate space. Darker points carry more local weight; red points belong to the negative-binomial regime and blue points belong to the Poisson regime.

```js
display(html`<div class="grid grid-cols-4">${scatterList}</div>`);
```

```js
display(pdfplot);
```

## Weight Datapoint

```js
const kernal = view(
  Inputs.range([0.1, 100], {
    value: 10,
    step: 0.1,
    label: "smoothing parameter",
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
const keys = ["X1", "X2", "X3"];
const formMap = createRangeFormMap({
  data: poiNegData,
  keys,
  defaults: { X1: -1, X2: 0, X3: 0 },
  step: 0.1,
});
```

```js
const dim = 2;
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
const weights = normalizeWeights({ d3, rawWeights: unnormalizedweights });

const data_with_weights = attachWeights({
  rows: poiNegData,
  covariates: data,
  responseKey: "Y",
  sourceResponseKey: "Y",
  weights,
  extra: (row) => ({ regime: row.REGIME }),
});

const scatterList = createWeightedScatterGrid({
  Plot,
  d3,
  axisPairs: axisAr,
  data: data_with_weights,
  conditionPoint: conditionPointObj,
  regimeKey: "regime",
  pointRadius: 8,
});
```

```js
const isPoissonReg = model === "Poisson Regression";

// Fit the selected count model in WebR, then compare its local PMF to the weighted data.
await webR.objs.globalEnv.bind("poiNegData", poiNegData);
const output = isPoissonReg ? await poissonRegression() : await negativeBinomialRegression();
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
      y: jStat.negbin.pdf(item, theta, theta / (mean + theta)) || 0,
    };
  }
});

const weightedDen = xGrid.map((xCor) => {
  if (isPoissonReg) {
    const yList = data_with_weights.map((item) => {
      const covariateObj = _.pick(item, keys);
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
      const covariateObj = _.pick(item, keys);
      const covariates = Object.values(covariateObj);
      const mean = Math.exp(
        multiply(transpose([1, ...covariates]), estimates.slice(0, 4)),
      );
      const y = jStat.negbin.pdf(xCor, theta, theta / (mean + theta)) || 0;
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
  const temp = data_with_weights.map((datapoint) => {
    return datapoint.Y === item ? datapoint.weight : 0;
  });
  return {
    x: item,
    y: d3.sum(temp),
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
    Plot.line(weightedDen, {
      x: "x",
      y: "y",
      stroke: "green",
      strokeWidth: 2,
      marker: "circle",
    }),
    // Plot.line(ckdCoordinates, {
    //   x: "x",
    //   y: "y",
    //   stroke: "red",
    //   strokeWidth: 2,
    //   marker: "circle",
    // }),
  ],
});
```
