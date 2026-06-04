---
title: Dashboard
toc: false
---

## Select Dataset

```js
const selectedDataset = view(
  Inputs.radio(DATASET, {
    format: (x) => x.name,
    value: DATASET[DEFAULT_DATASET_INDEX],
  }),
);
```

## Select Model

```js
const selectedModel = view(
  Inputs.select(MODEL, {
    unique: true,
    format: (x) => x.family + (x.conditional || ""),
    value: MODEL[DEFAULT_MODEL_INDEX],
  }),
);
```

## Select Conditional Data

```js
const showPCA = view(
  Inputs.radio(RADIO_OPTIONS, {
    format: (x) => x.name,
    value: RADIO_OPTIONS[RADIO_OPTION_INDEX],
    label: "PCA radio",
  }),
);
```

```js
const formMap = createConditionFormMap({ data, keys, continousKeys });
const formNode = Inputs.form(formMap);
const conditionPointObjFromSlider = view(formNode);
```

## Select bandwidth

```js
const bandwidthInputs = createBandwidthInputs();
const externalH = view(bandwidthInputs.h);
const externalLamda = view(bandwidthInputs.lambda);
```

Every data point with weight is listed as follows.

```js
display(data_with_weights);
display(d3.sort(data_with_weights, (item) => -item.weight).slice(0, 20));
```

```js
const pcaFormNode = createPcaForm();
const pcCordinate = view(pcaFormNode);
```

```js
display(html`
  <div>
    <strong>Conditional Point</strong>
    ${JSON.stringify(conditionPoint, null, 2)}
  </div>
`);
```

```js
display(showPCA.id === 0 ? container : html`<span></span>`);
```

```js
const onClick = createConditionFormUpdater({ formMap, formNode });
const scatterPlotList = createConditionalScatterGrid({
  keys,
  dataWithWeights: data_with_weights,
  residuals,
  conditionPointObj,
  width,
  onClick,
});

display(html`<div class="grid grid-cols-4">${scatterPlotList}</div>`);
```

```js
const selectedEstimators = view(
  Inputs.checkbox(ESTIMATORS, {
    format: (item) =>
      html`<span style="color: ${item.color}">${item.name}</span>`,
    value: ESTIMATORS.slice(1, ESTIMATORS.length - 1),
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

```js
// load all the datasets
const datasets = [
  await FileAttachment("./data/dgp.csv").csv({ typed: true }),
  await FileAttachment("./data/simulated_beta_data_phix.csv").csv({
    typed: true,
  }),
  await FileAttachment("./data/doctorvisits.csv").csv({ typed: true }),
];

const {
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
const data = datasets[index]; // original data selected
```

```js
const { pcaData, pcaProxyObj } = await getPcaData(
  data.map((item) => _.pick(item, continousKeys)),
  continousKeys,
);
const reConCor = reconstructPcaCoordinate({
  pcaProxyObj,
  continousKeys,
  pcCordinate,
});
const { conditionPoint, conditionPointObj } = getConditionPointState({
  showPCA,
  keys,
  reconstructedCoordinate: reConCor,
  sliderPoint: conditionPointObjFromSlider,
});
const { dataWithWeights: data_with_weights } = computeDashboardWeights({
  data,
  conditionPointObj,
  continousKeys,
  categoricalKeys,
  ordinalKeys,
  bwCont,
  lambdaCat,
  lambdaOrd,
  externalH,
  externalLamda,
});
const onClick3D = createPcaClickHandler({ pcaFormNode, formNode });
const container = createPcaScatter3d({
  pcaData,
  residuals,
  pcCordinate,
  dataWithWeights: data_with_weights,
  onClick: onClick3D,
});
```

```js
// R regression code
await webR.objs.globalEnv.bind("data", data);

const { rFun, family, conditional } = selectedModel;

const newModelOrData =
  pageCache.data !== data ||
  pageCache.family !== family ||
  pageCache.conditional !== conditional;

if (newModelOrData) {
  const output =
    (await rFun?.(
      "data",
      `${responseKey} ~ ${keys.join(" + ")} ${conditional || ""}`,
    )) ||
    (await poissonRegession("data", `${responseKey} ~ ${keys.join(" + ")}`));
  pageCache.output = output;
  pageCache.data = data;
  pageCache.family = family;
  pageCache.conditional = conditional;
}

const { output } = pageCache;

const newModelState =
  await getEstimate(
    family,
    output,
    conditionPoint,
    data_with_weights,
    keys,
    responseKey,
    responseBw,
    conditional,
  );
setModelState(newModelState);

const summary = await getSummary();
const temp = await getPearsonResiduals();
setResiduals(temp.values);
```

```js
const pdfplot = createResponseDensityPlot({
  Plot,
  d3,
  name,
  responseKey,
  dataWithWeights: data_with_weights,
  modelState,
  selectedEstimators,
});
```

```js
import _ from "lodash";

import {
  DATASET,
  MODEL,
  DEFAULT_DATASET_INDEX,
  DEFAULT_MODEL_INDEX,
  ESTIMATORS,
  RADIO_OPTIONS,
  RADIO_OPTION_INDEX,
} from "./components/config.js";
import { getEstimate } from "./components/getEstimate.js";
import { pageCache } from "./components/pageCache.js";
import { Mutable } from "observablehq:stdlib";
import {
  webR,
  getSummary,
  poissonRegession,
  getPearsonResiduals,
} from "./components/r.js";
import { getPcaData } from "./components/getPcaData.js";
import {
  createBandwidthInputs,
  createConditionFormMap,
  createConditionFormUpdater,
  createPcaForm,
} from "./components/forms.js";
import {
  createPcaClickHandler,
  getConditionPointState,
  reconstructPcaCoordinate,
} from "./components/pcaUtils.js";
import { computeDashboardWeights } from "./components/weighting.js";
import {
  createConditionalScatterGrid,
  createPcaScatter3d,
  createResponseDensityPlot,
} from "./components/plots.js";

// non-input state
const residuals = Mutable([]);
const setResiduals = (newValue) => {
  if (!_.isEqual(newValue, residuals.value)) {
    residuals.value = newValue;
  }
};

const modelState = Mutable({
  coordinates: [],
  weightedGLM: [],
  ckCoordinates: [],
  modCkdCoordinates: [],
});
const setModelState = (newValue) => {
  if (!_.isEqual(newValue, modelState.value)) {
    modelState.value = newValue;
  }
};
```
