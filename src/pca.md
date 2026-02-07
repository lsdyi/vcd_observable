---
title: PCA example
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
import { webR, regressionBy, getSummary } from "./components/r.js";
import { scatterPlot3d } from "./components/scatterPlot3d.js";
import { organizeData, matrixData } from "./components/organizeData.js";
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
const pcaProxy = await webR.evalR(`
    data <- as.data.frame(creditCard)
    data_pca <- prcomp(data, center = TRUE, scale. = TRUE)
    summary_stats <- summary(data_pca)
`);
const pcaProxyObj = await pcaProxy.toJs();
const pcaData = organizeData(
  pcaProxyObj.values[4].values,
  continousCovariates.map((_, index) => {
    return `pc${index + 1}`;
  }),
);

const pcaSummaryProxy = await webR.evalR(
  'paste(capture.output(summary_stats), collapse = "\n")',
);
const pcaSummaryText = (await pcaSummaryProxy.toArray())[0];

const pcaXProxy = await webR.evalR(
  'paste(capture.output(head(summary_stats$x)), collapse = "\n")',
);
const pcaXText = (await pcaXProxy.toArray())[0];

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

1. Every observation in PCA components corresposes to one observation in processed dataset.
2. [Reconstruct data from reduced Space to original Space](#reconstruct-data-from-reduced-space-to-original-space)
   - data from observation: use index to do 1v1 map, See Conclusion 1.
   - Data never existing in observation: mathematical way (matrix transformation). Mathematical way is a general way. With all components, it will do non-loss transformation, which is the same effect as Conclusion 1

3. According to pca model summary, the first 2 components covers <mark>46.6%</mark> coverage of data i.e. PC1 and PC2. The first 3 components covers <mark>60.28%</mark> of data i.e PC1, PC2 and PC3.</p>

<h3>Scatterplot of PC1 and PC2</h3>

```js
display(pcaPlot2d);
```

<h3>Scatterplot of PC1, PC2 and PC3</h3>

```js
const container = scatterPlot3d(pcaData, ["pc1", "pc2", "pc3"], pcCordinate);
display(container);
```

### Reconstruct Data from Reduced Space to Original Space

```js
const inputRanges = ["pc1", "pc2", "pc3"].map((pcaKey) => {
  return Inputs.range([0, 100], {
    value: 0,
    step: 0.1,
    label: pcaKey,
  });
});
const pcCordinate = view(Inputs.form(inputRanges));
```

```js
const zCor = continousCovariates.map((_, index) => {
  return pcCordinate[index] || 0;
});
const rotationMatrix = matrixData(pcaProxyObj.values[1].values, 8, 8);
const scaleVec = pcaProxyObj.values[3].values;
const centerVec = pcaProxyObj.values[2].values;

const reConCor = add(
  dotMultiply(scaleVec, multiply(zCor, transpose(rotationMatrix))),
  centerVec,
);
```

Data in the reduced space is 

```js
display(pcCordinate)
```

Reconstructed data is

```js
display(tex`\hat{X} = Z W^T + \mu`)
display(reConCor)
```
