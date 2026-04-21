import { WebR } from "webr";
import jStat from "jstat";

import { modelConfig } from "./modelConfig.js";

const webR = new WebR();
await webR.init();
await webR.installPackages(["betareg", "statmod", "numDeriv", "MASS", "np"]);

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
const negRegession = async (
  dataName = "poiNegData",
  setup = "y ~ x1 + x2 + x3",
) => {
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
  dataName = "poiNegData",
  setup = "y ~ x1 + x2 + x3",
) => {
  const rCodes = `
    fit <- glm(${setup}, family = poisson, data = ${dataName})
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

const cke = async () => {
  const rCodes = `
    library(np)
    y_count <- ordered(poiNegData['y'])
    x1 <- poiNegData['x1']
    x2 <- poiNegData['x2']
    x3 <- poiNegData['x3']
    new_data <- data.frame(y_count, x1, x2,x3)
    
    bw_cond <- npcdensbw(y_count ~ x1 + x2 + x3,
    data = new_data,
    bwmethod = "cv.ml")

    summary_stats <- summary(bw_cond)
  `;

  await webR.evalR(rCodes);

  const result = await webR.evalR(
    'paste(capture.output(summary_stats), collapse = "\n")',
  );
  const text = await result.toArray();
  return text[0];
};

const loess = async () => {
  const rCodes = `
    # fit loess model
    fit <- loess(Y ~ X1 + X2 + X3, data = betaData, span = 0.5)
    summary_stats <- summary(fit)
    new_df <- data.frame(
      X1 = c(0),
      X2 = c(1),
      X3 = c(2)
    )

    mu = predict(fit, newdata = new_df)
    `;
  await webR.evalR(rCodes);

  const result = await webR.evalR(`
    c(
      mu
    )
    `);
  const output = await result.toJs();

  return output;
  // const result = await webR.evalR(
  //   'paste(capture.output(summary_stats), collapse = "\n")',
  // );
  // const text = await result.toArray();
  // return text[0];
};

export {
  webR,
  regressionBy,
  getSummary,
  betaRegession,
  negRegession,
  poissonRegession,
  cke,
  loess,
  getPearsonResiduals
};
