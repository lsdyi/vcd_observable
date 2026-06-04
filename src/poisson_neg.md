---
title: Poisson & Negative Binomial Regression
toc: false
---

```js
import _ from "lodash";
import jStat from "jstat";

import {
  negativeBinomialRegression,
  webR,
  getSummary,
  poissonRegression,
} from "./components/r.js";
import { getCombinations } from "./components/getCombinations.js";
import {
  createRangeFormMap,
  createWeightedScatterGrid,
} from "./components/pageComponents.js";
import { computeKernelWeightedRows, computeStdevsByKey } from "./components/weighting.js";
import { createCountModelCurves, createCountPmfPlot } from "./components/countModels.js";
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

const data = poiNegData.map((item) => _.pick(item, keys));
const stdevs = computeStdevsByKey({ jStat, rows: poiNegData, keys });
const { dataWithWeights: data_with_weights } = computeKernelWeightedRows({
  d3,
  rows: poiNegData,
  covariates: data,
  conditionPoint,
  stdevs,
  kernelScale: kernal,
  responseKey: "Y",
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

const xGrid = d3.range(0, 50, 1);
const { coordinates, weightedDen } = createCountModelCurves({
  d3,
  dataWithWeights: data_with_weights,
  covariateKeys: keys,
  conditionPoint,
  estimates,
  isPoissonReg,
  xGrid,
});

const pdfplot = createCountPmfPlot({
  Plot,
  dataWithWeights: data_with_weights,
  responseKey: "Y",
  coordinates,
  weightedDen,
});
```
