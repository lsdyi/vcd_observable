---
title: Visualizing conditional distributions(Close Loop)
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
    Object.keys(obj).forEach(key => {
      const val = obj[key];

      if (typeof val === 'number') {
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
const formMap = {}
Object.keys(ranges).forEach(key => {
  const result = ranges[key];
  if (result instanceof Set) {
    // @todo: countable variable
  } else {
    const {min, max} = result
    formMap[key] = Inputs.range([min, max], {value: (min + max)/2, step: 1, label: key})
  }
});

const conditionPoint = view(
  Inputs.form(formMap)
)
```
```js
display(conditionPoint)
display(ranges)
```