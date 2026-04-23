import jStat from "jstat";
import { betaRegession, negRegession } from "./r.js";

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
    categoricalKeys: [],
    ordinalKeys: [],
    continousKeys: ["X1", "X2", "X3"],
    keys: ["X1", "X2", "X3"],
    responseKey: ["Y"],
    bwCont: [0.4163451, 2.120657, 1.909542], // continous covariate bandwidth
    lambdaCat: [], // categorical covariate bandwidth
    lambdaOrd: [], // ordinal covariate bandwidth
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

const MODEL = [
  {
    family: `binomial(link = "logit")`,
  },
  {
    family: `gaussian(link = "identity")`,
    dist: jStat.normal,
  },
  {
    family: `Gamma(link = "inverse")`,
  },
  {
    family: `inverse.gaussian(link = "1/mu^2")`,
  },
  {
    family: `poisson(link = "log")`,
    dist: jStat.poisson,
  },
  {
    family: `quasi(link = "identity", variance = "constant")`,
  },
  {
    family: `quasibinomial(link = "logit")`,
  },
  {
    family: `quasipoisson(link = "log")`,
  },

  {
    family: `negative binomial regression`,
    rFun: negRegession,
  },
  {
    family: `beta regression`,
    rFun: betaRegession,
  },
];

const DEFAULT_DATASET_INDEX = 0;
const DEFAULT_MODEL_INDEX = 4;

export { DATASET, MODEL, DEFAULT_DATASET_INDEX, DEFAULT_MODEL_INDEX };
