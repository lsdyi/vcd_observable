---
title: PCA example
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
import {
  webR,
  regressionBy,
  getSummary,
  calculatePCA,
} from "./components/r.js";
import { scatterPlot3d, demo } from "./components/scatterPlot3d.js";
```

```js
const creditCard = FileAttachment("./data/AER_credit_card_data.csv").csv({
  typed: true,
});
```

```js
const { continousCovariates } = modelConfig;
const continousCov = creditCard.map((item) => {
  return _.pick(item, continousCovariates);
});
await webR.objs.globalEnv.bind("creditCard", continousCov);
const temp = await webR.evalR(`
    data <- as.data.frame(creditCard)
    data_pca <- prcomp(data, center = TRUE, scale. = TRUE)
    summary_stats <- summary(data_pca)
`);
const temp2 = await temp.toJs()
console.log(temp2["x"])
// Extracting coefficients specifically
const result = await webR.evalR("summary_stats");
const output = await calculatePCA(continousCov);

const pcaSummaryProxy = await webR.evalR(
  'paste(capture.output(summary_stats), collapse = "\n")',
);
const pcaSummaryText = (await pcaSummaryProxy.toArray())[0];

const pcaXProxy = await webR.evalR(
  'paste(capture.output(head(summary_stats$x)), collapse = "\n")',
);
const pcaXText = (await pcaXProxy.toArray())[0];

// Transform R output to D3-friendly format
const pcaData = output.values[0].values.map((val, i) => ({
  pc1: val,
  pc2: output.values[1].values[i],
  pc3: output.values[2].values[i],
  label:
    creditCard.map((item) => {
      return _.pick(item, continousCovariates);
    })[i].label || i, // Optional label
}));

const pcaPlot2d = Plot.plot({
  marginTop: 30,
  x: { nice: true, label: null, tickFormat: "" },
  y: { axis: null },
  marks: [
    Plot.dot(pcaData, {
      x: "pc1",
      y: "pc2",
      z: "pc3",
    }),
    Plot.ruleX([0]),
    Plot.ruleY([0]),
    Plot.text(pcaData, {
      x: "pc1",
      y: "pc2",
      text: "name",
      lineAnchor: "bottom",
      dy: -10,
      lineWidth: 10,
      fontSize: 12,
    }),
  ],
});
```

<h1>PCA example</h1>
<title>PCA example</title>
<h2>Dataset</h2>
<p>
Use creditCard dataset, the dataset is shown as follows.
</p>

```js
display(Inputs.table(creditCard));
```

<p>Do PCA to numeric continous covariates. The covariates and data are as follows.</p>

```js
display(Inputs.table(continousCov));
```

<h2>PCA Result</h2>
<h3>Excecute R codes, get the pca summary</h3>

```js
display(pcaSummaryText);
```

<h3>Excecute R codes, get all the principle components</h3>

```js
display(pcaXText);
```

<h3>PCA Conclusion</h3>
<p>Every observation in PCA components corresposes to one observation in processed dataset. According to pca model summary, the first 2 components covers <mark>46.6%</mark> coverage of data i.e. PC1 and PC2. The first 3 components covers <mark>60.28%</mark> of data i.e PC1, PC2 and PC3.</p>

<h3>Scatterplot of PC1 and PC2</h3>

```js
display(pcaPlot2d);
```

<h3>Scatterplot of PC1, PC2 and PC3</h3>

```js
const container = scatterPlot3d(pcaData, ["pc1", "pc2", "pc3"]);
display(container);
```
