---
title: Visualizing conditional distributions(Close Loop)
toc: false
---

```js
import _ from "lodash";
import jStat from "jstat";
import { multiply, transpose } from "mathjs";

import { useOption } from "./components/hook/useOption.js";
import { modelList } from "./components/modelList.js";
import { getRanges } from "./components/getRanges.js";
import { modelConfig } from "./components/modelConfig.js";
import { normWeights } from "./components/normWeights.js";
import { getCombinations } from "./components/getCombinations.js";
```

<h1>Visualizing conditional distributions(Close Loop)</h1>
<title>Visualizing conditional distributions(Close Loop)</title>

<mark>Process</mark>

- load dataset
- select model <mark>use **possion regression** to make the process first</mark>
- select conditional data
- plot predictive distribution
- plot observed data dist
- plot selected data dist
- data generating process

<h2>Load Dataset</h2>

We use [credit card dataset](https://www.kaggle.com/datasets/dansbecker/aer-credit-card-data/data)

```js
const creditCard = FileAttachment("./data/AER_credit_card_data.csv").csv({
  typed: true,
});
```

```js
display(Inputs.table(creditCard));
```

<h2>Select Model</h2>
Use a dropdown menu to select generalized linear model to fit the dataset.

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

```js
// @todo: this import cant be lifted up?
import { webR, regressionBy, getSummary } from "./components/r.js";
await webR.objs.globalEnv.bind("df_raw", creditCard);

const output = await regressionBy(option);
const params = output.values[0].values;
const { dist } = modelList.find((item) => item.family === option);
const mean = multiply(transpose([1, ...conPointAr]), params);

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
  // title: md`Local histogram and conditional distribution fit<br>E(bleaching | x) = ${meanbleaching.toFixed(3)}<br>Pr(No bleaching | x) = ${probZeroModel.toFixed(3)}`,
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

```jsx
const Demo = () => {
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
          {["Intercept", ...keys].map((item, index) => {
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
display(<Demo />);
```

```js
display(pdfplot)
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

## Check Model Adequacy

### Select Conditioning Data

```js
const ranges = getRanges(creditCard);

// Formatting the output for readability
const formMap = {};
const { continousCovariates } = modelConfig;
continousCovariates.forEach((key) => {
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

const conditionPoint = view(Inputs.form(formMap));
```

```js
display(conditionPoint);
display(ranges);
```

### Select Kernal Weight

To give every data point a weight.

```js
const kernal = view(
  Inputs.range([0, 100], {
    value: 10,
    step: 0.1,
    label: "kernal weight",
  }),
);
```

```js
const keys = continousCovariates;
const conPointAr = Object.values(conditionPoint);

const temp = keys.map((key) => creditCard.map((item) => item[key]));
const stdevs = temp.map((item) => jStat.stdev(item));

const data = creditCard.map((item) => _.pick(item, keys));
const unnormalizedweights = normWeights(
  data,
  conPointAr,
  stdevs,
  undefined,
  kernal,
);
const totalunnormalizedweight = d3.sum(unnormalizedweights.map((d) => d.w));
const weights = unnormalizedweights.map((d) => ({
  id: d.id,
  w: d.w / totalunnormalizedweight,
}));
display(weights);
display(data);
```

```js
const weighteddata = "Yes";
const data_with_weights = data.map((d, index) => ({
  ...d,
  weight:
    weighteddata == "Yes"
      ? weights.find((item) => item.id === index).w
      : 1 / data.length,
}));

display(data_with_weights);

const distance_type = "euclidean";

const dim = 2;
const axisAr = getCombinations(keys, dim);

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
        filter: (d) => distance_type == "euclidean",
        x: key1,
        y: key2,
        fill: "weight",
        sort: "weight",
      }),
      // Plot.dot(data_with_weights, {
      //   filter: (d) => (distance_type == "k-nearest") & (d.weight == 0),
      //   x: "heatstress",
      //   y: "cloudfree",
      //   fill: "#E8E8E8",
      //   sort: "weight",
      // }),
      // Plot.dot(data_with_weights, {
      //   filter: (d) => (distance_type == "k-nearest") & (d.weight > 0),
      //   x: "heatstress",
      //   y: "cloudfree",
      //   fill: "#0047AB",
      //   sort: "weight",
      // }),

      // conditional data point with orange color
      Plot.dot(
        [
          {
            [key1]: conditionPoint[key1],
            [key2]: conditionPoint[key2],
          },
        ],
        {
          x: key1,
          y: key2,
          fill: "orange",
          r: 5,
        },
      ),
      // Plot.tip(
      //   data_with_weights,
      //   Plot.pointer({
      //     x: "heatstress",
      //     y: "cloudfree",
      //     title: (d) =>
      //       [
      //         "bleaching = ",
      //         d.reports.toFixed(1),
      //         ", depth = ",
      //         d.age.toFixed(1),
      //         ", weight = ",
      //         d.income.toFixed(3),
      //       ].join(""),
      //   }),
      // ),
    ],
  });
});
```

<div class="grid grid-cols-4">
  ${sactterAr.map(scatter => {
    return scatter
  })}
</div>
