---
title: Doctor Visit
toc: false
---

```js
import _ from "lodash";
import jStat from "jstat";
import { multiply, transpose } from "mathjs";

import { computeWeightsMixed, poissonKernel } from "./components/kernel.js";
import { getCombinations } from "./components/getCombinations.js";
import { selectFromKeys, getCardinalityFromMatrix } from "./components/util.js";
import {
  createRangeFormMap,
  createWeightedScatterGrid,
} from "./components/pageComponents.js";
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
const XCont = selectFromKeys(data, continousKeys);
const XCat = selectFromKeys(data, categoricalKeys);
const XOrd = [];
const x0 = {
  cont: selectFromKeys([conditionPointObj], continousKeys).flat(),
  cat: selectFromKeys([conditionPointObj], categoricalKeys).flat(),
  ord: selectFromKeys([conditionPointObj], []).flat(),
};
const bwCont = [13.91312, 2.417221, 124196.4];
const lambdaCat = [0.3210706, 0.01451098];
const lambdaOrd = [];
const Ccat = getCardinalityFromMatrix(XCat);
const externalH = kernal;

const weights = computeWeightsMixed({
  XCont,
  XCat,
  XOrd,
  x0,
  bwCont,
  lambdaCat,
  lambdaOrd,
  Ccat,
  externalH,
});

const data_with_weights = data.map((d, index) => ({
  ...d,
  numvisit: doctorvisits[index].numvisit,
  weight: weights[index],
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

const mean = Math.exp(
  multiply(transpose([1, ...conditionPoint]), estimates.slice(0, 6)),
);
const theta = estimates[6];

function negBinomialPMF(k, r, p) {
  if (k < 0) return 0;
  const coef = jStat.gammafn(k + r) / (jStat.gammafn(r) * jStat.gammafn(k + 1));
  return coef * Math.pow(p, r) * Math.pow(1 - p, k);
}

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
      y: negBinomialPMF(item, theta, theta / (mean + theta)) || 0,
    };
  }
});

const weightedDen = xGrid.map((xCor) => {
  if (isPoissonReg) {
    const yList = data_with_weights.map((item) => {
      const covariateObj = _.pick(item, keys);
      const covariates = Object.values(covariateObj);
      const mean = Math.exp(
        multiply(transpose([1, ...covariates]), estimates.slice(0, 6)),
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
        multiply(transpose([1, ...covariates]), estimates.slice(0, 6)),
      );
      const y = negBinomialPMF(xCor, theta, theta / (mean + theta)) || 0;
      return y * item.weight;
    });

    return {
      x: xCor,
      y: d3.sum(yList),
    };
  }
});

const h = jStat.stdev(data_with_weights.map((item) => item.numvisit));

const ckdCoordinates = xGrid.map((item) => {
  const temp = data_with_weights.map((datapoint) => {
    const { numvisit, weight } = datapoint;

    return weight * poissonKernel(item, numvisit, h);
  });
  return {
    x: item,
    y: d3.sum(temp),
  };
});
```

```js
const pdfplot = Plot.plot({
  title: "pmf",

  color: {
    legend: true,
  },

  marks: [
    Plot.ruleX([0]),
    Plot.ruleY([0]),
    Plot.barY(data_with_weights, {
      x: "numvisit",
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
