import { WebR } from "webr";

import { modelConfig } from "./modelConfig.js";

const webR = new WebR();
await webR.init();
await webR.installPackages(["betareg", "statmod", "numDeriv", "MASS"]);

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

const betaRegession = async (dataName = "data", setup = "Y ~ X1 + X2 + X3", family = "beta regression") => {
  const rCodes = `
    library(betareg)
    fit <- betareg(${setup}, link = "logit", data = ${dataName})
    summary_stats <- summary(fit)
  `;

  await webR.evalR(rCodes);

  // Extracting coefficients specifically
  const result = await webR.evalR("as.data.frame(summary(fit)$coefficients)");
  const output = await result.toJs();

  return output;
};

// negative binomial regression
const negRegession = async (dataName = "data", setup = "Y ~ X1 + X2 + X3") => {
  const rCodes = `
    library(MASS)
    fit <- glm.nb(${setup}, data = ${dataName})
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

// poisson regression
const poissonRegession = async (
  dataName = "data",
  setup = "Y ~ X1 + X2 + X3",
  family = "poisson",
) => {
  const rCodes = `
    fit <- glm(${setup}, family = ${family}, data = ${dataName})
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

const getPearsonResiduals = async () => {
  const rCodes = `
    p_res <- residuals(fit, type = "pearson")
  `;

  const result = await webR.evalR(rCodes);

  const output = await result.toJs();

  return output;
};

const loess = async () => {
  const rCodes = `
    loessFit <- loess(Y ~ X1 + X2 + X3, data = data, span = 0.5)
    summary_stats <- summary(loessFit)
    new_df <- data.frame(
      X1 = c(0),
      X2 = c(1),
      X3 = c(2)
    )

    mu = predict(loessFit, newdata = new_df)
    `;
  await webR.evalR(rCodes);

  const result = await webR.evalR(`
    c(
      mu
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
  loess,
  getPearsonResiduals,
};
