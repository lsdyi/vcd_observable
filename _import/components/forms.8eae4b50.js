import * as Inputs from "../../_node/@observablehq/inputs@0.12.0/index.4eed0a6e.js";

import { getRanges } from "./getRanges.5556642d.js";
import { PcaInputRange } from "./UI/PcaInputRange.a6a44b29.js";

export const createConditionFormMap = ({ data, keys, continousKeys = keys }) => {
  const ranges = getRanges(data);
  const formMap = {};

  keys.forEach((key) => {
    const result = ranges[key];

    if (continousKeys.includes(key)) {
      const { min, max } = result;
      const value = (min + max) / 2;
      const range = max - min;
      const step = range > 100 ? 1 : range > 10 ? 0.1 : range > 1 ? 0.01 : 0.001;

      formMap[key] = Inputs.range([min, max], {
        value,
        step,
        label: key,
      });
      return;
    }

    const options = Array.from(new Set(data.map((item) => item[key])));
    const sortedOptions =
      typeof options[0] === "number"
        ? options.sort((a, b) => a - b)
        : options.sort();

    formMap[key] = Inputs.select(sortedOptions, {
      label: key,
      value: sortedOptions[0],
    });
  });

  return formMap;
};

export const createBandwidthInputs = () => ({
  h: Inputs.range([0.01, 20], {
    value: 1,
    step: 0.01,
    label: "Smoothing parameter for continous covariate",
  }),
  lambda: Inputs.range([0.01, 100], {
    value: 1,
    step: 0.01,
    label: "Smoothing parameter for discrete covariate",
  }),
});

export const createPcaForm = () => Inputs.form(PcaInputRange());

export const createConditionFormUpdater = ({ formMap, formNode }) => (datum) => {
  Object.keys(formMap).forEach((key) => {
    if (datum[key] !== undefined) {
      const input = formMap[key];
      input.value = datum[key];
      input.dispatchEvent(new Event("input"));
    }
  });

  formNode.dispatchEvent(new Event("input", { bubbles: true }));
};
