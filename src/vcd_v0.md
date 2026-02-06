---
title: Visualizing conditional distributions(Close Loop)
toc: false
---

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
// state block must be ahead of component block cuz useState here is async
import { useOption } from "./components/hook/useOption.js";
import { modelList } from "./components/modelList.js";

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

<mark>
Use possion regression to make the process first.
"active ~ age + income + expenditure ~~+ owner + selfemp +~~ dependents + months"
The strike through above is because these two covariates are not numerical. We'll consider this later.</mark>

## Model Parameter Estimation

```js
import { webR, regressionBy, getSummary } from "./components/r.js";
await webR.objs.globalEnv.bind("df_raw", creditCard);

const output = await regressionBy(option);
display(output.values[0].values);
```

```js
const clicks = view(Inputs.button("Switch Summary"));
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
const getRanges = (arr) => {
  if (!arr.length) return {};

  return arr.reduce((acc, obj) => {
    Object.keys(obj).forEach((key) => {
      const val = obj[key];

      if (typeof val === "number") {
        // Initialize or update numeric min/max
        if (!acc[key]) {
          acc[key] = { min: val, max: val };
        } else {
          acc[key].min = Math.min(acc[key].min, val);
          acc[key].max = Math.max(acc[key].max, val);
        }
      } else {
        // Handle strings/categories using a Set for unique values
        if (!acc[key]) acc[key] = new Set();
        acc[key].add(val);
      }
    });
    return acc;
  }, {});
};

const ranges = getRanges(creditCard);

// Formatting the output for readability
const formMap = {};
Object.keys(ranges).forEach((key) => {
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

```js
import { normWeights } from "./components/normWeights.js";
import jStat from "jstat";
import _ from "lodash";

const keys = Object.keys(conditionPoint);
const conPointAr = Object.values(conditionPoint);

const temp = keys.map((key) => creditCard.map((item) => item[key]));
const stdevs = temp.map((item) => jStat.stdev(item));

const data = creditCard.map((item) => _.pick(item, keys));
const unnormalizedweights = normWeights(data, conPointAr, stdevs);
const totalunnormalizedweight = d3.sum(unnormalizedweights.map((d) => d.w));
const weights = unnormalizedweights.map((d) => ({
  id: d.id,
  w: d.w / totalunnormalizedweight,
}));
display(weights);
display(data);
```

```js
import { getCombinations } from "./components/getCombinations.js";

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
