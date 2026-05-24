import { webR } from "./r.js";
import { organizeData } from "./organizeData.js";

export const getPcaData = async (data = [], continousCovariates) => {
  await webR.objs.globalEnv.bind("data_original", data);
  const pcaProxy = await webR.evalR(`
    data_pca <- prcomp(data_original, center = TRUE, scale. = TRUE)
    pca_summary_stats <- summary(data_pca)
`);
  const pcaProxyObj = await pcaProxy.toJs();
  const pcaData = organizeData(
    pcaProxyObj.values[4].values,
    continousCovariates.map((_, index) => {
      return `pc${index + 1}`;
    }),
    data.length
  );

  return { pcaData, pcaProxyObj };
};
