import { computeWeightsMixed } from "./kernel.a91a6573.js";
import { normWeights } from "./normWeights.12937a58.js";
import { getCardinalityFromMatrix, selectFromKeys } from "./util.8c2c9357.js";

export const normalizeRawWeights = ({ d3, rawWeights }) => {
  const total = d3.sum(rawWeights.map((d) => d.w));
  return rawWeights.map((d) => ({
    id: d.id,
    w: total === 0 ? 0 : d.w / total,
  }));
};

export const attachWeightsToRows = ({
  rows,
  covariates,
  responseKey,
  sourceResponseKey = responseKey,
  weights,
  extra = () => ({}),
}) =>
  covariates.map((row, index) => ({
    ...row,
    ...(responseKey ? { [responseKey]: rows[index][sourceResponseKey] } : {}),
    weight: weights.find((item) => item.id === index)?.w ?? 0,
    ...extra(rows[index], index),
  }));

export const computeKernelWeightedRows = ({
  d3,
  rows,
  covariates,
  conditionPoint,
  stdevs,
  kernelScale,
  responseKey,
  sourceResponseKey = responseKey,
  extra,
}) => {
  const rawWeights = normWeights(covariates, conditionPoint, stdevs, undefined, kernelScale);
  const weights = normalizeRawWeights({ d3, rawWeights });
  const dataWithWeights = attachWeightsToRows({
    rows,
    covariates,
    responseKey,
    sourceResponseKey,
    weights,
    extra,
  });

  return { dataWithWeights, weights };
};

export const computeStdevsByKey = ({ jStat, rows, keys }) =>
  keys.map((key) => jStat.stdev(rows.map((item) => item[key])));

export const computeDashboardWeights = ({
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
}) => {
  const XCont = selectFromKeys(data, continousKeys);
  const XCat = selectFromKeys(data, categoricalKeys);
  const XOrd = selectFromKeys(data, ordinalKeys);
  const x0 = {
    cont: selectFromKeys([conditionPointObj], continousKeys).flat(),
    cat: selectFromKeys([conditionPointObj], categoricalKeys).flat(),
    ord: selectFromKeys([conditionPointObj], ordinalKeys).flat(),
  };
  const Ccat = getCardinalityFromMatrix(XCat);

  const weights = computeWeightsMixed({
    XCont,
    XCat,
    XOrd,
    x0,
    bwCont,
    lambdaCat,
    lambdaOrd,
    Ccat,
    externalH,
    externalLamda,
  });

  const dataWithWeights = data.map((datum, index) => ({
    ...datum,
    weight: weights[index],
  }));

  return { dataWithWeights, weights };
};
