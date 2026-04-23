---
title: Density Estimator
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
import { getCombinations } from "./components/getCombinations.js";
import { PcaInputRange } from "./components/UI/PcaInputRange.js";
import { scatterPlot3d } from "./components/scatterPlot3d.js";
import { matrixData } from "./components/organizeData.js";
import { Mutable } from "observablehq:stdlib";
```

# Density Estimator

This page covers

- conditional histogram
- kernel estimator for conditional density
- modified estimator

## Conditional Histogram

It's expected to plot a histogram given a conditional datapoint. The hisogram shows conditional distribution.

${tex`(X^{(1)}, X^{(2)}, X^{(1=3)},\dots,X^{(p)})`} is a random vector. A matrix ${tex`\bold{X}`} is a sample from this random vector, with sample size ${tex`N = n`}. Dataset ${tex`\bold{X}`} is manifested as n datapoints in p-dimensional dataspace.

In order to give every datapoint a weight ${tex`w_i`}. Define a kernel function ${tex`K(x)`} to assign weights according to the Mahalanobis distance ${tex`d`} to a condtional datapoint ${tex`c = (c_1, c_2, c_3,...,c_p)`}.

```tex
d_i =
\sqrt{
\sum_{j=1}^{p}
\left(
\frac{x_{ij} - c_j}{s_j}
\right)^2
},
\qquad i = 1,\dots,n
```

```tex
s_j = \operatorname{sd}\!\left(X^{(j)}\right)
```

```tex
w_i = K(d_i)/\sum_{i=1}^{n}K(d_i)
```

Kernel function ${tex`K(x) : \mathbb{R} \to \mathbb{R}`} will assign larger value to distance close to 0. ${tex`K(x)`} has a parameter ${tex`h`} specifying how values are varied.

```tex
K(x) = e^{-\frac{x^2}{h^2}}
```

Plot a weighted histogram, with the binSize height to be sum of weights, corresponded to data points fallen in this bin, divided by binSize. The area of histogram should be 1 which is expected to be compared to density curves.

```js

```

```js
// const betaData = FileAttachment("./data/simulated_beta_data.csv").csv({
//   typed: true,
// });

const betaData = FileAttachment("./data/simulated_beta_data_phix.csv").csv({
  typed: true,
});
```

## Simulated dataset

There are three covariates ${tex`X_1, X_2, X_3`} with covariance matrix ${tex`\Sigma`} and mean to be 0.

```tex
\mathbf{X} =
\begin{pmatrix}
X_1 \\
X_2 \\
X_3
\end{pmatrix}
\sim
\mathcal{N} \Big(
\begin{pmatrix}
0 \\
0 \\
0
\end{pmatrix},
\Sigma
\Big),

\\

\Sigma
=
\begin{pmatrix}
1 & 0.5 & 0.3 \\
0.5 & 1 & 0.4 \\
0.3 & 0.4 & 1
\end{pmatrix}
```

Response variable Y is defined as follows.

```tex
Y_i \sim \text{Beta}(\mu_i \phi, (1-\mu_i)\phi), \quad i = 1, \dots, n \\
\text{logit}(\mu_i) = \beta_0 + \beta_1 X_{i1} + \beta_2 X_{i2} + \beta_3 X_{i3} \\

\beta_0 = 0.5, \\
\beta_1 = 0.7, \\
\beta_2 = -0.3, \\
\beta_3 = 0.2, \\
\phi = 5
```

```js
display(Inputs.table(betaData));
```

```js
const conditionPointObj = view(Inputs.form(formMap));
```

```js
const kernal = view(
  Inputs.range([0.1, 100], {
    value: 10,
    step: 0.1,
    label: "kernal weight",
  }),
);
```

Every datapoint has weight as follows.

```js
display(data_with_weights);
```

Use R to do beta regression, there are 5 parameters to be estimated in total. They're as follows.

```js
display(output);
```

beta estimate

```js
display(betas);
```

phi estimate

```js
display(phi);
```

```tex
Y \mid \mathbf{X} = \mathbf{x}
\sim
\text{Beta}\big(\mu(\mathbf{x}) \, \phi,\; (1-\mu(\mathbf{x})) \, \phi \big)

\\

\mu(\mathbf{x}) =
\frac{1}{1 + \exp\!\left(-(\beta_0 + \beta_1 x_1 + \beta_2 x_2 + \beta_3 x_3)\right)}
```

Conditional point is set to ${tex`c = (0, 1, 2)`}. It should be able to change flexibly.

```js
display(pdfplot);
```

<!-- js logics -->
```js
const keys = ["X1", "X2", "X3"];
const formMap = {};
const ranges = getRanges(betaData);
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
import { betaRegession, webR, loess } from "./components/r.js";

const conditionPoint = Object.values(conditionPointObj);

const keys = ["X1", "X2", "X3"];
const temp = keys.map((key) => betaData.map((item) => item[key]));
const stdevs = temp.map((item) => jStat.stdev(item));

const data = betaData.map((item) => _.pick(item, keys));
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

await webR.objs.globalEnv.bind("betaData", betaData);
const output = await betaRegession();
const betas = output.values[0].values;
const phi = output.values[4].values[0];

const linearCom = multiply(transpose([1, ...conditionPoint]), betas);
const mu = 1 / (1 + Math.exp(-linearCom));

const loessRes = await loess()
const loessMu = loessRes.values[0]

const data_with_weights = data.map((d, index) => ({
  ...d,
  Y: betaData[index].Y,
  weight: weights.find((item) => item.id === index).w,
  e: betaData[index].Y - loessMu,
}));
const weightedResidual = d3.sum(
  data_with_weights.map((item) => item.weight * item.e),
);

const xGrid = d3.range(0, 1, 0.01);

const coordinates = xGrid.map((item) => {
  return {
    x: item,
    y: jStat.beta.pdf(item, mu * phi, (1 - mu) * phi),
  };
});

const denCoordinates = xGrid.map((xCor) => {
  const yList = data_with_weights.map((item) => {
    const covariateObj = _.pick(item, ["X1", "X2", "X3"]);
    const covariates = Object.values(covariateObj);
    const linearCom = multiply(transpose([1, ...covariates]), betas);
    const mu = 1 / (1 + Math.exp(-linearCom));

    const y = jStat.beta.pdf(xCor, mu * phi, (1 - mu) * phi);
    return y * item.weight;
  });

  return {
    x: xCor,
    y: d3.sum(yList),
  };
});

const h = jStat.stdev(data_with_weights.map((item) => item.Y));

const ckdCoordinates = xGrid.map((item) => {
  const temp = data_with_weights.map((datapoint) => {
    const { Y, weight } = datapoint;
    return (1 / h) * weight * jStat.normal.pdf((item - Y) / h, 0, 1);
  });
  return {
    x: item,
    y: d3.sum(temp),
  };
});


const modCkdCoordinates = xGrid.map((item) => {
  const temp = data_with_weights.map((datapoint) => {
    const { Y, weight, e } = datapoint;
    const yStar = loessMu + e - weightedResidual;
    return (1 / h) * weight * jStat.normal.pdf((item - yStar) / h, 0, 1);
  });
  return {
    x: item,
    y: d3.sum(temp),
  };
});

const pdfplot = Plot.plot({
  title: "pdf",
  color: {
    // domain: [d3.min(xGrid), d3.max(xGrid)],
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
    Plot.line(coordinates, {
      x: "x",
      y: "y",
      stroke: "#F28C28",
      strokeWidth: 2,
    }),

    // conditional kernel estimator
    Plot.line(ckdCoordinates, {
      x: "x",
      y: "y",
      stroke: "red",
      strokeWidth: 2,
    }),

    // conditional kernel estimator
    Plot.line(modCkdCoordinates, {
      x: "x",
      y: "y",
      stroke: "black",
      strokeWidth: 2,
    }),

    // weighted conditional density
    Plot.line(denCoordinates, {
      x: "x",
      y: "y",
      stroke: "green",
      strokeWidth: 2,
    }),
  ],
});
```

## Kernel Estimator

```tex
\hat f_{X,Y}(x,y)
=
\frac{1}{n h_x h_y}
\sum_{i=1}^{n}
K\!\left(\frac{x-X_i}{h_x}\right)
K\!\left(\frac{y-Y_i}{h_y}\right)
```

```tex
\hat f(y|x)=
\frac{\sum_{i=1}^{n} K_h(x-X_i)L_b(y-Y_i)}
{\sum_{i=1}^{n} K_h(x-X_i)}
```

In case response data is count data, kernel estimator is the same as bin chart.

```tex
\hat P(Y=y \mid X=x) =
\frac{\sum K_h(x-X_i) \mathbf{1}(Y_i=y)}
{\sum K_h(x-X_i)}
```

## Modified Kernel Estimator

Conditional kernel density estimator with residual correction (often associated with Hyndman–Yao / Fan–Yao style estimators).

```tex
\hat f_*(y|x)
=
\frac{1}{b}
\sum_{j=1}^{n}
w_j(x)
K\!\left(
\frac{\|y - Y_j^*(x)\|_y}{b}
\right)
```

```tex
Y_j^*(x)
=
\hat r(x)
+
e_j
-
\sum_{i=1}^{n} w_i(x)e_i
```

```tex
e_j = Y_j - \hat r(X_j)
```
