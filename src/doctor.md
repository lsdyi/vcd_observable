---
title: Doctor Visit
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
import { computeWeightsMixed, poissonKernel } from "./components/kernel.js";
import { getCombinations } from "./components/getCombinations.js";
import { PcaInputRange } from "./components/UI/PcaInputRange.js";
import { scatterPlot3d } from "./components/scatterPlot3d.js";
import { matrixData } from "./components/organizeData.js";
import { selectFromKeys, getCardinalityFromMatrix } from "./components/util.js";
import { Mutable } from "observablehq:stdlib";
```

# Real Dataset: Doctor Visit

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

## Select bandwidth

```js
const kernal = view(
  Inputs.range([0.01, 3], {
    value: 1,
    step: 0.01,
    label: "smoothing parameter",
  }),
);
```

Every data point with weight is listed as follows.

```js
display(data_with_weights);
```

<div class="grid grid-cols-4">
  ${scatterList.map(scatter => {
    return scatter
  })}
</div>

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
// reform + badh + age + educ + loginc
const keys = ["reform", "badh", "age", "educ", "loginc"];
const formMap = {};
const ranges = getRanges(doctorvisits);
keys.forEach((key) => {
  const result = ranges[key];
  if (result instanceof Set) {
    // @todo: countable variable
  } else {
    const { min, max } = result;
    formMap[key] = Inputs.range([min, max], {
      value: (min + max) / 2,
      step: 0.5,
      label: key,
    });
  }
});
```

```js
const dim = 2;
const axisAr = getCombinations(keys, dim);
const conditionPoint = Object.values(conditionPointObj);
const temp = keys.map((key) => doctorvisits.map((item) => item[key]));
const stdevs = temp.map((item) => jStat.stdev(item));

const data = doctorvisits.map((item) => _.pick(item, keys));
// const unnormalizedweights = normWeights(
//   data,
//   conditionPoint,
//   stdevs,
//   undefined,
//   kernal,
// );
// const totalunnormalizedweight = d3.sum(unnormalizedweights.map((d) => d.w));
// const weights2 = unnormalizedweights.map((d) => ({
//   id: d.id,
//   w: d.w / totalunnormalizedweight,
// }));

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
const externlH = kernal;

const weights = computeWeightsMixed({
  XCont,
  XCat,
  XOrd,
  x0,
  bwCont,
  lambdaCat,
  lambdaOrd,
  Ccat,
  externlH,
});

const data_with_weights = data.map((d, index) => ({
  ...d,
  numvisit: doctorvisits[index].numvisit,
  weight: weights[index],
}));

const dataState = Mutable(data_with_weights);
const resetDataState = (newData) => {
  dataState.value = newData;
};


const wmin = d3.min(data_with_weights, (d) => d.weight);
const wmax = d3.max(data_with_weights, (d) => d.weight);
```

```js
const scatterList = axisAr.map((item) => {
  const [key1, key2] = item;
  return Plot.plot({
    title: `${key1} vs ${key2}`,
    marks: [
      Plot.dot(data_with_weights, {
        x: key1,
        y: key2,
        fill: (d, i) => {
          const t = (d.weight - wmin) / (wmax - wmin);
          return residuals.values[i] > 2 || residuals.values[i] < -2
            ? d3.interpolateReds(t)
            : d3.interpolateBlues(t);
        },
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
import {
  negRegession,
  webR,
  getSummary,
  poissonRegession,
  cke,
  loess,
  getPearsonResiduals,
} from "./components/r.js";
import { getPcaData } from "./components/getPcaData.js";
```

```js
const isPoissonReg = model === "Poisson Regression";
// R regression code
await webR.objs.globalEnv.bind("doctorvisits", doctorvisits);

const output = isPoissonReg
  ? await poissonRegession(
      "doctorvisits",
      "numvisit ~ reform + badh + age + educ +  loginc",
    )
  : await negRegession(
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

const hy = 0.7228501;

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
