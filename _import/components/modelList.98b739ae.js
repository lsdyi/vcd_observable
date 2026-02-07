import jStat from "../../_node/jstat@1.9.6/index.bc60a888.js";

export const modelList = [
  { family: `binomial(link = "logit")` },
  { family: `gaussian(link = "identity")`, dist: jStat.normal },
  { family: `Gamma(link = "inverse")` },
  { family: `inverse.gaussian(link = "1/mu^2")` },
  { family: `poisson(link = "log")`, dist: jStat.poisson },
  { family: `quasi(link = "identity", variance = "constant")` },
  { family: `quasibinomial(link = "logit")` },
  { family: `quasipoisson(link = "log")` },
];
