import jStat from "../../_node/jstat@1.9.6/index.bc60a888.js";
import { betaRegession, negRegession } from "./r.f6ca0c3a.js";

const DATASET = [
  {
    index: 0,
    name: "Discrete Response",
    categoricalKeys: [],
    ordinalKeys: [],
    continousKeys: ["X1", "X2", "X3"],
    keys: ["X1", "X2", "X3"],
    responseKey: ["Y"],
    bwCont: [0.09691224, 0.5892781, 1.02301], // continous covariate bandwidth
    lambdaCat: [0.3210706, 0.01451098], // categorical covariate bandwidth
    lambdaOrd: [], // ordinal covariate bandwidth
    responseBw: 1.081108,
  },

  {
    index: 1,
    name: "Continous Response",
    categoricalKeys: [],
    ordinalKeys: [],
    continousKeys: ["X1", "X2", "X3"],
    keys: ["X1", "X2", "X3"],
    responseKey: ["Y"],
    // bwCont: [0.3980219, 0.5821581, 1.292169], // not fixed phi dataset
    bwCont: [0.4163451, 2.120657, 1.909542], // continous covariate bandwidth
    lambdaCat: [], // categorical covariate bandwidth
    lambdaOrd: [], // ordinal covariate bandwidth
    // responseBw: 0.04209059, // not fixed phi dataset
    responseBw: 0.004129468,
  },

  {
    index: 2,
    name: "Real Dataset: Doctor Visit",
    categoricalKeys: ["reform", "badh"],
    ordinalKeys: [],
    continousKeys: ["age", "educ", "loginc"],
    keys: ["reform", "badh", "age", "educ", "loginc"],
    responseKey: ["numvisit"],
    bwCont: [5.786841, 0.4327276, 213813.7], // continous covariate bandwidth
    lambdaCat: [0.4845307, 0.01094098], // categorical covariate bandwidth
    lambdaOrd: [], // ordinal covariate bandwidth
    responseBw: 1.257102,
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

const ESTIMATORS = [
  { id: 0, name: "GLM", color: "orange" },
  { id: 1, name: "weighted-GLM", color: "green" },
  { id: 4, name: "weighted-histogram", color: "blue" },
  { id: 2, name: "conditional kernel", color: "red" },
  { id: 3, name: "modified conditional kernel", color: "black" },
];

const DEFAULT_DATASET_INDEX = 1;
const DEFAULT_MODEL_INDEX = MODEL.length - 1;
const DEFAULT_ESTIMATOR_LIST = [0, 1, 2, 3];

export {
  DATASET,
  MODEL,
  DEFAULT_DATASET_INDEX,
  DEFAULT_MODEL_INDEX,
  ESTIMATORS,
  DEFAULT_ESTIMATOR_LIST,
};
