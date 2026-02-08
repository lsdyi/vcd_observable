import { webR } from "./r.5d0f4917.js";
import { organizeData } from "./organizeData.e4ace3b1.js";
import { modelConfig } from "./modelConfig.6feb3b8c.js";

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
