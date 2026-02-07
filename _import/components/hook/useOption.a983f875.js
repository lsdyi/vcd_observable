import { Mutable } from "../../../_observablehq/stdlib.73a8ec5a.js";

export const useOption = async (originalVal) => {
  const option = await Mutable(originalVal);
  const setOption = (val) => {
    option.value = val;
  };

  return [
    option,
    setOption
  ]
};
