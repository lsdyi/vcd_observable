import { webR } from "./r.js";
import { organizeData } from "./organizeData.js";
import { modelConfig } from "./modelConfig.js";

export const getPcaData = async () => {
  const { continousCovariates } = modelConfig;

  const pcaProxy = await webR.evalR(`
    data <- as.data.frame(creditCard)
    data_pca <- prcomp(data, center = TRUE, scale. = TRUE)
    summary_stats <- summary(data_pca)
`);
  const pcaProxyObj = await pcaProxy.toJs();
  const pcaData = organizeData(
    pcaProxyObj.values[4].values,
    continousCovariates.map((_, index) => {
      return `pc${index + 1}`;
    }),
  );

  return { pcaData, pcaProxyObj };
};
