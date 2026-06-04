---
title: PCA example
toc: false
---

```js
import _ from "lodash";

import { modelConfig } from "./components/modelConfig.js";
import { webR } from "./components/r.js";
import { getPcaData } from "./components/getPcaData.js";
import { createPcaForm } from "./components/forms.js";
import { reconstructPcaCoordinate } from "./components/pcaUtils.js";
import { createPcaScatter3d } from "./components/plots.js";
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

const { pcaData, pcaProxyObj } = await getPcaData(
  continousCov,
  continousCovariates,
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

# PCA as a Navigation Layer

The full dashboard can use ordinary sliders when the covariate space is small. But when the model has many continuous covariates, pairwise scatterplots multiply quickly and the user loses the map. PCA gives the dashboard a lower-dimensional control surface: move in principal-component space, then reconstruct the corresponding covariate point.

## Dataset

This example uses the credit-card dataset and applies PCA to the continuous covariates used by the model.

```js
display(Inputs.table(creditCard));
```

The PCA input matrix is shown below. Each row remains tied to the original observation, which matters later when selecting points interactively.

```js
display(Inputs.table(continousCov));
```

## PCA Result

### Summary

```js
display(pcaSummaryText);
```

### First Principal Components

```js
display(pcaXText);
```

### Interpretation

1. Every point in PCA space corresponds to one row in the processed continuous-covariate matrix.
2. A point can be reconstructed from reduced space back to original covariate space using the PCA rotation, scale, and center.
3. In the dashboard, the first three components are used as a practical control surface. They do not preserve everything, but they give the user a coherent way to move through high-dimensional covariates.

### Scatterplot of PC1 and PC2

```js
display(pcaPlot2d);
```

### Scatterplot of PC1, PC2 and PC3

```js
const container = createPcaScatter3d({ pcaData, pcCordinate });
display(container);
```

## Reconstruct Data from Reduced Space to Original Space

```js
const pcCordinate = view(createPcaForm());
```

```js
const reConCor = reconstructPcaCoordinate({
  pcaProxyObj,
  continousKeys: continousCovariates,
  pcCordinate,
});
```

The selected point in reduced space is:

```js
display(pcCordinate);
```

The reconstructed covariate point is:

```js
display(tex`\hat{X} = Z W^T + \mu`);
display(reConCor);
```
