import { WebR } from "webr";

const webR = new WebR();
await webR.init();

const regressionBy = async (family) => {
  await webR.evalR(`
  df <- as.data.frame(df_raw)
  model <- glm(active ~ age + income + expenditure + owner + selfemp + dependents + months, family = ${family}, data = df)
  summary_stats <- summary(model)
`);

  // Extracting coefficients specifically
  const result = await webR.evalR("as.data.frame(summary_stats$coefficients)");
  const output = await result.toJs();

  return output;
};

export { webR, regressionBy };
