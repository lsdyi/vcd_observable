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
const usePCA = showPCA.id === 0;
```

```js
const formMap = createConditionFormMap({ data, keys, continousKeys });
const formNode = Inputs.form(formMap);
setConditionFormMode({ formMap, formNode, keys, continousKeys, usePCA });
const conditionPointObjFromSlider = view(formNode);
```

```js
const pcaFormNode = createPcaForm();
setFormEnabled(pcaFormNode, usePCA);
const pcCordinate = view(pcaFormNode);
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
display(html`
  <div>
    <strong>Conditional Point</strong>
    ${JSON.stringify(conditionPoint, null, 2)}
  </div>
`);
```

```js
display(usePCA ? container : html`<span></span>`);
```

## Select Residual

```js
const selectedResidual = view(
  Inputs.radio(RESIDUAL_OPTIONS, {
    format: (x) => x.name,
    value: RESIDUAL_OPTIONS[DEFAULT_RESIDUAL_INDEX],
    label: "Residual",
  }),
);
```

```js
const residualType = selectedResidual.type;
```

```js
const onClick = createConditionFormUpdater({ formMap, formNode });
const scatterPlotList = createConditionalScatterGrid({
  keys,
  dataWithWeights: data_with_weights,
  residuals,
  residualType,
  conditionPointObj,
  width: 400,
  onClick: usePCA ? undefined : onClick,
});

display(
  html`<div>
    <div class="scatterplot-scroll-hint">Scroll horizontally to view all scatterplots.</div>
    <div class="scatterplot-scroll-row">
      ${scatterPlotList.map(
        (plot) => html`<div class="scatterplot-scroll-item">${plot}</div>`,
      )}
    </div>
  </div>`,
);
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
const { pcaData, pcaProxyObj } = usePCA
  ? await getPcaData(
      data.map((item) => _.pick(item, continousKeys)),
      continousKeys,
    )
  : { pcaData: [], pcaProxyObj: null };
const reConCor = usePCA
  ? reconstructPcaCoordinate({
      pcaProxyObj,
      continousKeys,
      pcCordinate,
    })
  : [];
const { conditionPoint, conditionPointObj } = getConditionPointState({
  usePCA,
  keys,
  continousKeys,
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
const container = usePCA
  ? createPcaScatter3d({
      pcaData,
      residuals,
      residualType,
      pcCordinate,
      dataWithWeights: data_with_weights,
      onClick: onClick3D,
    })
  : html`<span></span>`;
```

```js
// R regression code
await webR.objs.globalEnv.bind("data", data);

const rFunctions = {
  betaRegression,
  negativeBinomialRegression,
};
const { rFunName, family, conditional } = selectedModel;
const rFun = rFunctions[rFunName];

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

const newModelState = await getEstimate(
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
const temp = await getResiduals(residualType);
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
import { getEstimate } from "./components/getEstimate.js";
import { pageCache } from "./components/pageCache.js";
import { Mutable } from "observablehq:stdlib";
import {
  betaRegression,
  negativeBinomialRegression,
  webR,
  getSummary,
  poissonRegession,
  getResiduals,
} from "./components/r.js";
import {
  DATASET,
  MODEL,
  DEFAULT_DATASET_INDEX,
  DEFAULT_MODEL_INDEX,
  ESTIMATORS,
  RADIO_OPTIONS,
  RADIO_OPTION_INDEX,
  RESIDUAL_OPTIONS,
  DEFAULT_RESIDUAL_INDEX,
} from "./components/config.js";
import { getPcaData } from "./components/getPcaData.js";
import {
  createBandwidthInputs,
  createConditionFormMap,
  createConditionFormUpdater,
  createPcaForm,
  setConditionFormMode,
  setFormEnabled,
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

<style>
.scatterplot-scroll-hint {
  color: #4b5563;
  font-size: 13px;
  margin: 0 0 6px;
}

.scatterplot-scroll-row {
  display: flex;
  flex-direction: row;
  align-items: flex-start;
  gap: 16px;
  flex-wrap: nowrap;
  width: 100%;
  max-width: 100%;
  height: 300px;
  overflow-x: scroll;
  overflow-y: hidden;
  padding: 0 0 12px;
  scroll-snap-type: x proximity;
}

.scatterplot-scroll-item {
  flex: 0 0 300px;
  width: 300px;
  height: 300px;
  scroll-snap-align: start;
}

.scatterplot-scroll-item > svg {
  display: block;
  width: 100%;
  height: 100%;
}
</style>
