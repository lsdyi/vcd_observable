import { Mutable } from "observablehq:stdlib";

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
