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
import { NegRegession, webR, getSummary } from "./components/r.js";
import { getCombinations } from "./components/getCombinations.js";
import { PcaInputRange } from "./components/UI/PcaInputRange.js";
import { scatterPlot3d } from "./components/scatterPlot3d.js";
import { getPcaData } from "./components/getPcaData.js";
import { matrixData } from "./components/organizeData.js";
```

# Poisson & Negtive Binomial Regression

This document firstly fits data using poisson regression. According to lack fit in some data points, change to negtive binomial regression which is expected to have a good fit. The document briefly provides the process of checking model fit or lack fit using visulization method.

## Dataset from dgp

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

<div class="grid grid-cols-4">
  ${sactterAr.map(scatter => {
    return scatter
  })}
</div>

```js
display(pdfplot)
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
      step: 1,
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

const sactterAr = axisAr.map((item) => {
  const [key1, key2] = item;
  return Plot.plot({
    color: {
      scheme: "blues",
      transform: (f) => Math.sqrt(f),
    },
    title: `${key1} vs ${key2}`,
    marks: [
      Plot.dot(data_with_weights, {
        x: key1,
        y: key2,
        fill: "weight",
        sort: "weight",
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
          r: 5,
        },
      ),
    ],
  });
});
```

```js
// R regression code
await webR.objs.globalEnv.bind("poiNegData", poiNegData);
const output = await NegRegession();
const estimates = output.values;
const summary = await getSummary();

const mean = Math.exp(
  multiply(transpose([1, ...conditionPoint]), estimates.slice(0, 4)),
);
const theta = estimates[4];

const xGrid = d3.range(0, 50, 1);
const coordinates = xGrid.map((item) => {
  return {
    x: item,
    y: jStat.negbin.pdf(item, theta, mean / (mean + theta)) || 0,
  };
});

const pdfplot = Plot.plot({
  title: "pmf",
  color: {
    scheme: "blues",
    label: "Closeness in time to selected time period",
    legend: false,
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
  ],
});
```
