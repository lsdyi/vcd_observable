import { WebR } from "../../_node/webr@0.5.8/index.d12ac113.js";

import { modelConfig } from "./modelConfig.6feb3b8c.js";

const webR = new WebR();
await webR.init();
await webR.installPackages(["betareg", "MASS"]);

const regressionBy = async (family) => {
  const { continousCovariates, response } = modelConfig;
  const modelStr = `${response} ~ ${continousCovariates.join(" + ")}`;
  await webR.evalR(`
  df <- as.data.frame(df_raw)
  model <- glm(${modelStr}, family = ${family}, data = df)
  summary_stats <- summary(model)
`);

  // Extracting coefficients specifically
  const result = await webR.evalR("as.data.frame(summary_stats$coefficients)");
  const output = await result.toJs();

  return output;
};

const getSummary = async () => {
  const result = await webR.evalR(
    'paste(capture.output(summary_stats), collapse = "\n")',
  );
  const text = await result.toArray();
  return text[0];
};

const betaRegession = async () => {
  const rCodes = `
    library(betareg)
    fit <- betareg(Y ~ X1 + X2 + X3, link = "logit", data = betaData)
  `;

  await webR.evalR(rCodes);

  // Extracting coefficients specifically
  const result = await webR.evalR("as.data.frame(summary(fit)$coefficients)");
  const output = await result.toJs();

  return output;
};

// negative binomial regression
const negRegession = async () => {
  const rCodes = `
    library(MASS)
    fit <- glm.nb(y ~ x1 + x2 + x3, data = poiNegData)
    summary_stats <- summary(fit)
  `;

  await webR.evalR(rCodes);

  // Extracting coefficients specifically
  const result = await webR.evalR(`
c(
    coef(fit), # regression coefficients
    fit$theta # dispersion parameter
)
    `);
  const output = await result.toJs();

  return output;
};

// negative binomial regression
const poissonRegession = async () => {
  const rCodes = `
    fit <- glm(y ~ x1 + x2 + x3, family = poisson, data = poiNegData)
    summary_stats <- summary(fit)
  `;

  await webR.evalR(rCodes);

  // Extracting coefficients specifically
  const result = await webR.evalR(`
c(
    coef(fit), # regression coefficients
    fit$theta # dispersion parameter
)
    `);
  const output = await result.toJs();

  return output;
};

export {
  webR,
  regressionBy,
  getSummary,
  betaRegession,
  negRegession,
  poissonRegession,
};
