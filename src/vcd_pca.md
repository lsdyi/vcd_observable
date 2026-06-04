---
title: Visualizing conditional distributions(PCA)
toc: false
---

```js
import _ from "lodash";
import jStat from "jstat";
import { multiply, transpose } from "mathjs";

import { useOption } from "./components/hook/useOption.js";
import { modelList } from "./components/modelList.js";
import { modelConfig } from "./components/modelConfig.js";
import { getCombinations } from "./components/getCombinations.js";
import { getPcaData } from "./components/getPcaData.js";
import { createPcaForm } from "./components/forms.js";
import { reconstructPcaCoordinate } from "./components/pcaUtils.js";
import { computeKernelWeightedRows, computeStdevsByKey } from "./components/weighting.js";
import { createPcaScatter3d, createWeightedScatterGridPlot } from "./components/plots.js";

```

# Visualizing Conditional Distributions with PCA

This page extends the slider prototype with PCA. Instead of moving one slider for every continuous covariate, the user moves through a three-dimensional PCA space. The selected PCA coordinates are reconstructed back into the original covariates, then the same local-fit comparison is recomputed.

## Load Dataset

We use the credit-card dataset as a higher-dimensional example for navigating conditional points.

```js
const creditCard = FileAttachment("./data/AER_credit_card_data.csv").csv({
  typed: true,
});
```

```js
display(Inputs.table(creditCard));
```

## Select Model

Use the dropdown menu to select the generalized linear model used for the model-based local distribution.

```js
const [option, setOption] = await useOption(modelList[4].family);
```

```jsx
// UI component
const Dropdown = () => {
  return (
    <select
      name="model-selection"
      defaultValue={option}
      onChange={(e) => setOption(e.target.value)}
    >
      {modelList.map((item) => {
        const { family } = item;
        return <option value={family}>{family}</option>;
      })}
    </select>
  );
};
display(<Dropdown />);
```

## Model Parameter Estimation

```jsx
const ShowEstimate = () => {
  return (
    <div>
      <table class="border-collapse border border-gray-400 ...">
        <thead>
          <tr>
            <th class="border border-gray-300 ...">param</th>
            <th class="border border-gray-300 ...">estimate</th>
          </tr>
        </thead>
        <tbody>
          {["Intercept", ...continousCovariates].map((item, index) => {
            return (
              <tr>
                <td class="border border-gray-300 ...">{`${item} beta_${index}`}</td>
                <td class="border border-gray-300 ...">{params[index]}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
display(<ShowEstimate />);
```

```js
display(pdfplot);
```

```js
const clicks = view(Inputs.button("Switch Model Summary"));
```

```js
const summary = await getSummary();
if (clicks % 2 !== 0) {
  display(summary);
} else {
  display(html`<div></div>`);
}
```

```js
// @todo: this import cant be lifted up?
import { webR, regressionBy, getSummary } from "./components/r.js";
await webR.objs.globalEnv.bind("df_raw", creditCard);

const { continousCovariates } = modelConfig;
const continousCov = creditCard.map((item) => {
  return _.pick(item, continousCovariates);
});
await webR.objs.globalEnv.bind("creditCard", continousCov);

const { pcaData, pcaProxyObj } = await getPcaData(
  continousCov,
  continousCovariates,
);
const reConCor = reconstructPcaCoordinate({
  pcaProxyObj,
  continousKeys: continousCovariates,
  pcCordinate,
});
const container = createPcaScatter3d({ pcaData, pcCordinate });
display(container);
const conditionPoint = Object.fromEntries(
      continousCovariates.map((key, index) => [key, reConCor[index]]),
    );
```

```js
const output = await regressionBy(option);
const params = output.values[0].values;
const { dist } = modelList.find((item) => item.family === option);
const mean = multiply(transpose([1, ...reConCor]), params);

const xGrid = d3.range(1, 40, 0.1);

const coordinates = xGrid.map((item) => {
  if (option === `gaussian(link = "identity")`) {
    return {
      x: item,
      y: dist.pdf(item, mean, 1),
    };
  } else if (option === `poisson(link = "log")`) {
    return {
      x: item,
      y: dist.pdf(item, Math.exp(mean)),
    };
  }
});

const pdfplot = Plot.plot({
  title: "pdf",
  color: {
    domain: [d3.min(xGrid), d3.max(xGrid)],
    scheme: "blues",
    label: "Closeness in time to selected time period",
    legend: false,
  },

  marks: [
    Plot.ruleX([0]),
    Plot.ruleY([0]),
    Plot.rectY(
      data_with_weights.map((item, index) => ({
        ...item,
        active: creditCard[index].active,
      })),
      Plot.binX(
        {
          y: (bindata, bin) => {
            return d3.sum(bindata.map((d) => d.weight)) / (bin.x2 - bin.x1);
          },
        },
        { x: "active", thresholds: 50, fill: "orange" },
      ),
    ),
    Plot.line(coordinates, { x: "x", y: "y", stroke: "blue", strokeWidth: 2 }),
  ],
});
```

## Check Model Adequacy

### Select Conditioning Data

```js
const pcCordinate = view(createPcaForm());
```

The PCA controls are a navigation tool. The actual conditional point used by the model is reconstructed in the original covariate units:

```js
display(reConCor);
```

### Select smoothing parameter

To give every data point a weight.

```js
const kernal = view(
  Inputs.range([0, 100], {
    value: 10,
    step: 0.1,
    label: "smoothing parameter",
  }),
);
```

```js

const data = continousCov;
const stdevs = computeStdevsByKey({
  jStat,
  rows: creditCard,
  keys: continousCovariates,
});
const { dataWithWeights: data_with_weights, weights } = computeKernelWeightedRows({
  d3,
  rows: creditCard,
  covariates: data,
  conditionPoint: reConCor,
  stdevs,
  kernelScale: kernal,
});
display(weights);
display(data);
```

```js
display(data_with_weights);

const scatterList = createWeightedScatterGridPlot({
  Plot,
  d3,
  axisPairs: getCombinations(continousCovariates, 2),
  data: data_with_weights,
  conditionPoint,
});
```

```js
display(html`<div class="grid grid-cols-4">${scatterList}</div>`);
```
