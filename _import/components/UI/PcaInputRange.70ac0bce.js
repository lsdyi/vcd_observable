import * as Inputs from "../../../_node/@observablehq/inputs@0.12.0/index.4eed0a6e.js";

export const PcaInputRange = (keys = ["pc1", "pc2", "pc3"]) => {
  const inputRanges = keys.map((pcaKey) => {
    return Inputs.range([0, 100], {
      value: 0,
      step: 0.1,
      label: pcaKey,
    });
  });

  return inputRanges;
};
