---
title: Doctor Visit
toc: false
---

```js
import _ from "lodash";
import jStat from "jstat";

import { getCombinations } from "./components/getCombinations.js";
import {
  createRangeFormMap,
  createWeightedScatterGrid,
} from "./components/pageComponents.js";
import { computeDashboardWeights } from "./components/weighting.js";
import {
  createCountModelCurves,
  createCountPmfPlot,
  createPoissonKernelCurve,
} from "./components/countModels.js";
import {
  negativeBinomialRegression,
  webR,
  getSummary,
  poissonRegression,
  getPearsonResiduals,
} from "./components/r.js";
```

# Real Dataset: Doctor Visits

This page applies the thesis method to the German doctor-visit data. The response is a count: how many times each woman visited a physician during the last three months. The interesting question is not only whether Poisson or negative-binomial regression fits globally, but whether either model fits around a particular patient profile.

```js
display(Inputs.table(doctorvisits));
```

## Select Model

```js
const model = view(
  Inputs.select(["Poisson Regression", "Negative Binomial Regression"], {
    unique: true,
    label: "Select Model",
  }),
);
```

## Select Conditional Data

```js
const conditionPointObj = view(Inputs.form(formMap));
```

## Select Bandwidth

```js
const kernal = view(
  Inputs.range([0.01, 3], {
    value: 1,
    step: 0.01,
    label: "smoothing parameter",
  }),
);
```

The selected profile defines a local neighborhood. Observations with larger weights are closer to that profile and therefore matter more in the local comparison.

```js
display(data_with_weights);
```

```js
display(html`<div class="grid grid-cols-4">${scatterList}</div>`);
```

```js
display(pdfplot);
```

```js
display(summary);
```

<!-- js logics -->

```js
const doctorvisits = FileAttachment("./data/doctorvisits.csv").csv({
  typed: true,
});
```

```js
const keys = ["reform", "badh", "age", "educ", "loginc"];
const formMap = createRangeFormMap({
  data: doctorvisits,
  keys,
  defaults: { reform: 1, badh: 0, age: 35, educ: 11.5 },
  step: 0.5,
});
```

```js
const dim = 2;
const axisAr = getCombinations(keys, dim);
const conditionPoint = Object.values(conditionPointObj);
const data = doctorvisits.map((item) => _.pick(item, keys));

const categoricalKeys = ["reform", "badh"];
const continousKeys = ["age", "educ", "loginc"];
const ordinalKeys = [];
const bwCont = [13.91312, 2.417221, 124196.4];
const lambdaCat = [0.3210706, 0.01451098];
const lambdaOrd = [];
const externalH = kernal;
const { dataWithWeights: weightedCovariates } = computeDashboardWeights({
  data,
  conditionPointObj,
  continousKeys,
  categoricalKeys,
  ordinalKeys,
  bwCont,
  lambdaCat,
  lambdaOrd,
  externalH,
  externalLamda: 1,
});

const data_with_weights = weightedCovariates.map((d, index) => ({
  ...d,
  numvisit: doctorvisits[index].numvisit,
}));
```

```js
const scatterList = createWeightedScatterGrid({
  Plot,
  d3,
  axisPairs: axisAr,
  data: data_with_weights,
  conditionPoint: conditionPointObj,
  residuals,
});
```

```js
const isPoissonReg = model === "Poisson Regression";

// Fit the count model in WebR and keep the local comparison in JavaScript.
await webR.objs.globalEnv.bind("doctorvisits", doctorvisits);

const output = isPoissonReg
  ? await poissonRegression(
      "doctorvisits",
      "numvisit ~ reform + badh + age + educ +  loginc",
    )
  : await negativeBinomialRegression(
      "doctorvisits",
      "numvisit ~ reform + badh + age + educ +  loginc",
    );
const estimates = output.values;
const summary = await getSummary();
const residuals = await getPearsonResiduals();

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

const h = jStat.stdev(data_with_weights.map((item) => item.numvisit));
const ckdCoordinates = createPoissonKernelCurve({
  d3,
  dataWithWeights: data_with_weights,
  responseKey: "numvisit",
  bandwidth: h,
  xGrid,
});
```

```js
const pdfplot = createCountPmfPlot({
  Plot,
  dataWithWeights: data_with_weights,
  responseKey: "numvisit",
  coordinates,
  weightedDen,
  ckdCoordinates,
});
```
