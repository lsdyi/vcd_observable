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
Inputs.table(creditCard);
```

<h2>Select Model</h2>

Use a dropdown menu to select generalized linear model to fit the dataset.

<select name="cars" id="cars">
  <option value="volvo">Linear Regression (Gaussian)</option>
  <option value="saab">Logistic Regression (Binomial + Logit)</option>
  <option value="mercedes">Poisson Regression (Poisson + Log)</option>
  <option value="audi">Negative Binomial Regression</option>
</select>

<mark>
Use possion regression to make the process first. 
"active ~ age + income + expenditure ~~+ owner + selfemp +~~ dependents + months"
The strike through above is because these two covariates are not numerical. We'll consider this later.</mark>

## Select Conditioning Data

```js
// cant use dataset right now, its async
const ebay = await FileAttachment("./data/ebay.csv").csv({ typed: true });

// active ~ age + income + expenditure + owner + selfemp + dependents + months"
// display(ebay);
```

```js
import { webR, regressionBy } from "./components/r.js";
await webR.objs.globalEnv.bind("df_raw", creditCard);

const output = await regressionBy(`poisson`)
const output2 = await regressionBy(`gaussian`)

display(output.values[0].values)
display(output2.values[0].values)

```
