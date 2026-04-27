---
title: Dashboard
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
import {
  DATASET,
  MODEL,
  DEFAULT_DATASET_INDEX,
  DEFAULT_MODEL_INDEX,
  ESTIMATORS,
  DEFAULT_ESTIMATOR_LIST,
} from "./components/config.js";
import { getEstimate } from "./components/getEstimate.js";
import { chart } from "./components/scatterPlot.js";
import { pageCache } from "./components/pageCache.js";

import { Mutable } from "observablehq:stdlib";
```

## Select Dataset

```js
const selectedDataset = view(
  Inputs.radio(DATASET, {
    format: (x) => x.name,
    value: DATASET[DEFAULT_DATASET_INDEX],
  }),
);
```

```js
const datasets = [
  await FileAttachment("./data/dgp.csv").csv({ typed: true }),
  await FileAttachment("./data/simulated_beta_data_phix.csv").csv({
    typed: true,
  }),
  await FileAttachment("./data/doctorvisits.csv").csv({ typed: true }),
];
```

## Select Model

```js
const selectedModel = view(
  Inputs.select(MODEL, {
    unique: true,
    format: (x) => x.family,
    value: MODEL[DEFAULT_MODEL_INDEX],
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
  Inputs.range([0.01, 10], {
    value: 1,
    step: 0.01,
    label: "smoothing parameter",
  }),
);
```

Every data point with weight is listed as follows.

```js
display(data_with_weights);
display(d3.sort(data_with_weights, (item) => -item.weight).slice(0, 20));
```

<div class="grid grid-cols-4">
  ${
    scatterPlotList
  }
</div>

```js
const selectedEstimators = view(
  Inputs.checkbox(ESTIMATORS, {
    format: (item) => item.name,
    value: ESTIMATORS,
  }),
);
```

```js
display(selectedEstimators);
```

```js
display(pdfplot);
```

```js
display(summary);
```

<!-- js logics -->

```js
const {
  csvPath,
  categoricalKeys,
  continousKeys,
  ordinalKeys,
  bwCont,
  lambdaCat,
  lambdaOrd,
  index,
  keys,
  responseKey,
  name,
  responseBw,
} = selectedDataset;

const data = datasets[index];

const formMap = {};
const ranges = getRanges(data);
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
const temp = keys.map((key) => data.map((item) => item[key]));
const stdevs = temp.map((item) => jStat.stdev(item));

const XCont = selectFromKeys(data, continousKeys);
const XCat = selectFromKeys(data, categoricalKeys);
const XOrd = selectFromKeys(data, ordinalKeys);

const x0 = {
  cont: selectFromKeys([conditionPointObj], continousKeys).flat(),
  cat: selectFromKeys([conditionPointObj], categoricalKeys).flat(),
  ord: selectFromKeys([conditionPointObj], []).flat(),
};

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
const scatterPlotList = axisAr.map((item) => {
  const [key1, key2] = item;

  return chart(
    [
      ...data_with_weights.map((item, index) => {
        return {
          group: "observation", // group key
          x: item[key1],
          y: item[key2],
          weight: item.weight,
          residual: residuals.values[index],
        };
      }),
      {
        group: "conditional", // group key
        x: conditionPointObj[key1],
        y: conditionPointObj[key2],
        weight: item.weight,
      },
    ],
    width,
    width,
  );
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
// R regression code
await webR.objs.globalEnv.bind("data", data);

const { rFun, family } = selectedModel;

const newModelOrData = pageCache.data !== data || pageCache.family !== family;

if (newModelOrData) {
  const output =
    (await rFun?.("data", `${responseKey} ~ ${keys.join(" + ")}`)) ||
    (await poissonRegession("data", `${responseKey} ~ ${keys.join(" + ")}`));
  pageCache.output = output;
  pageCache.data = data;
  pageCache.family = family;
}

const { output } = pageCache;

const { coordinates, weightedGLM, ckCoordinates, modCkdCoordinates } =
  await getEstimate(
    family,
    output,
    conditionPoint,
    data_with_weights,
    keys,
    responseKey,
    responseBw,
  );

console.log(
  "sum",
  responseBw,
  d3.sum(
    ckCoordinates.map(
      (item) => item.y * (ckCoordinates[1].x - ckCoordinates[0].x),
    ),
  ),
  d3.sum(data_with_weights.map((item) => item.weight)),
);

const summary = await getSummary();
const residuals = await getPearsonResiduals();

function negBinomialPMF(k, r, p) {
  if (k < 0) return 0;
  const coef = jStat.gammafn(k + r) / (jStat.gammafn(r) * jStat.gammafn(k + 1));
  return coef * Math.pow(p, r) * Math.pow(1 - p, k);
}
```

```js
const showGLMEstimator =
  selectedEstimators.findIndex((item) => item.id === 0) !== -1;

const showWeightedGLMEstimator =
  selectedEstimators.findIndex((item) => item.id === 1) !== -1;

const showWeightedHist =
  selectedEstimators.findIndex((item) => item.id === 4) !== -1;

const showCKE = selectedEstimators.findIndex((item) => item.id === 2) !== -1;

const showModifiedCKE =
  selectedEstimators.findIndex((item) => item.id === 3) !== -1;

const ssum = d3.sum(data_with_weights.map((item) => item[responseKey[0]]));
const marks =
  name === "Continous Response"
    ? [
        Plot.ruleX([0]),
        Plot.ruleY([0]),
        Plot.rectY(
          showWeightedHist &&
            data_with_weights.map((item, index) => ({
              ...item,
              active: true,
            })),
          Plot.binX(
            {
              y: (bindata, bin) => {
                return d3.sum(bindata.map((d) => d.weight)) / (bin.x2 - bin.x1);
              },
            },
            { x: "Y", thresholds: 50, fill: "steelblue", opacity: 0.7 },
          ),
        ),
        // Plot.rectY(
        //   data_with_weights,
        //   Plot.binX(
        //     {
        //       y: (bin, b) =>
        //         bin.length / ((b.x2 - b.x1) * data_with_weights.length),
        //     },
        //     {
        //       x: "Y",
        //       thresholds: 50,
        //       fill: "purple",
        //       opacity: 0.5,
        //     },
        //   ),
        // ),   // response density
        Plot.line(showGLMEstimator && coordinates, {
          x: "x",
          y: "y",
          stroke: "#F28C28",
          strokeWidth: 2,
        }),

        // conditional kernel estimator
        Plot.line(showCKE && ckCoordinates, {
          x: "x",
          y: "y",
          stroke: "red",
          strokeWidth: 2,
        }),

        // conditional kernel estimator
        Plot.line((showModifiedCKE && modCkdCoordinates) || [], {
          x: "x",
          y: "y",
          stroke: "black",
          strokeWidth: 2,
        }),

        // weighted conditional density
        Plot.line(showWeightedGLMEstimator && weightedGLM, {
          x: "x",
          y: "y",
          stroke: "green",
          strokeWidth: 2,
        }),
      ]
    : [
        Plot.ruleX([0]),
        Plot.ruleY([0]),
        Plot.barY(showWeightedHist && data_with_weights, {
          x: responseKey[0],
          y: "weight",
          fill: "steelblue",
          opacity: 0.7,
        }),
        Plot.line(showGLMEstimator && coordinates, {
          x: "x",
          y: "y",
          stroke: "#F28C28",
          strokeWidth: 2,
          marker: "circle",
        }),
        Plot.line(showWeightedGLMEstimator && weightedGLM, {
          x: "x",
          y: "y",
          stroke: "green",
          strokeWidth: 2,
          marker: "circle",
        }),
        Plot.line(showCKE && ckCoordinates, {
          x: "x",
          y: "y",
          stroke: "red",
          strokeWidth: 2,
          marker: "circle",
        }),
      ];

const pdfplot = Plot.plot({
  title: name === "Continous Response" ? "pdf" : "pmf",

  color: {
    legend: true,
  },

  marks,
});
```
