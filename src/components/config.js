import jStat from "jstat";

const DATASET = [
  {
    index: 0,
    name: "Discrete Response",
    categoricalKeys: [],
    ordinalKeys: [],
    continousKeys: ["X1", "X2", "X3"],
    keys: ["X1", "X2", "X3"],
    responseKey: ["Y"],
    bwCont: [0.1463431, 0.5160716, 44238.28], // continous covariate bandwidth
    lambdaCat: [], // categorical covariate bandwidth
    lambdaOrd: [], // ordinal covariate bandwidth
    responseBw: 1.358901,
  },

  {
    index: 1,
    name: "Continous Response",
    categoricalKeys: [],
    ordinalKeys: [],
    continousKeys: ["X1", "X2", "X3", "X4", "X5"],
    keys: ["X1", "X2", "X3", "X4", "X5"],
    responseKey: ["Y"],
    bwCont: [0.2339905, 0.5806615, 0.7938251, 0.1497883, 0.4333948], // continous covariate bandwidth
    lambdaCat: [], // categorical covariate bandwidth
    lambdaOrd: [], // ordinal covariate bandwidth
    responseBw: 0.02880596,
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
    rFunName: "negativeBinomialRegression",
  },
  {
    family: `beta regression`,
    rFunName: "betaRegression",
  },
  {
    family: `beta regression`,
    rFunName: "betaRegression",
    conditional: ' | X1',
  },
];

const ESTIMATORS = [
  { id: 0, name: "GLM", color: "#F28C28" },
  { id: 1, name: "weighted GLM estimator", color: "#008000" },
  { id: 4, name: "conditional histogram", color: "#4682B4" },
  { id: 2, name: "conditional kernel estimator", color: "#FF0000" },
  { id: 3, name: "modiﬁed kernel estimator", color: "#6A5ACD" },
];

const DEFAULT_DATASET_INDEX = 0;
const DEFAULT_MODEL_INDEX = 4;
const DEFAULT_ESTIMATOR_LIST = [0, 1, 2, 3];

const RADIO_OPTIONS = [
  {
    name: "use PCA",
    id: 0,
  },
  {
    name: "NOT use PCA",
    id: 1,
  },
];
const RADIO_OPTION_INDEX = 0;

export {
  DATASET,
  MODEL,
  DEFAULT_DATASET_INDEX,
  DEFAULT_MODEL_INDEX,
  ESTIMATORS,
  DEFAULT_ESTIMATOR_LIST,
  RADIO_OPTIONS,
  RADIO_OPTION_INDEX
};
