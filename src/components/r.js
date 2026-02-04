import { WebR } from "webr";

const webR = new WebR();
await webR.init();

const regressionBy = async (family) => {
  await webR.evalR(`
  df <- as.data.frame(df_raw)
  model <- glm(active ~ age + income + expenditure + dependents + months, family = ${family}, data = df)
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

export { webR, regressionBy, getSummary };
