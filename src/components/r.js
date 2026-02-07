import { WebR } from "webr";

import { modelConfig } from "./modelConfig.js";

const webR = new WebR();
await webR.init();
await webR.installPackages(['jsonlite']);

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

async function calculatePCA(jsData) {
  // 1. Convert your JS data to a JSON string for easy transfer
  const jsonData = JSON.stringify(jsData);

  // 2. Execute the R code
  const result = await webR.evalR(`
    library(jsonlite)
    data <- fromJSON('${jsonData}')
    pca_res <- prcomp(data, center = TRUE, scale. = TRUE)
    
    # We return a list to capture multiple parts of the analysis
    list(
      pc1 = pca_res$x[,1],
      pc2 = pca_res$x[,2],
      pc3 = pca_res$x[,3],
      loadings = pca_res$rotation,
      variance = (pca_res$sdev^2) / sum(pca_res$sdev^2)
    )
  `);

  // 3. Convert the R object back to a JS object
  const output = await result.toJs();
  return output;
}

export { webR, regressionBy, getSummary, calculatePCA };
