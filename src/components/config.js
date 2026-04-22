const DATASET = [
  {
    index: 0,
    name: "Discrete Response",
    categoricalKeys: [],
    ordinalKeys: [],
    continousKeys: ["X1", "X2", "X3"],
    keys: ["X1", "X2", "X3"],
    responseKey: ["Y"],
    bwCont: [13.91312, 2.417221, 124196.4], // continous covariate bandwidth
    lambdaCat: [0.3210706, 0.01451098], // categorical covariate bandwidth
    lambdaOrd: [], // ordinal covariate bandwidth
  },

  {
    index: 1,
    name: "Continous Response",
  },

  {
    index: 2,
    name: "Real Dataset: Doctor Visit",
    categoricalKeys: ["reform", "badh"],
    ordinalKeys: [],
    continousKeys: ["age", "educ", "loginc"],
    keys: ["reform", "badh", "age", "educ", "loginc"],
    responseKey: ["numvisit"],
    bwCont: [13.91312, 2.417221, 124196.4], // continous covariate bandwidth
    lambdaCat: [0.3210706, 0.01451098], // categorical covariate bandwidth
    lambdaOrd: [], // ordinal covariate bandwidth
  },
];
export { DATASET };
