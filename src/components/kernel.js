import jStat from "jstat";

// Gaussian kernel (continuous)
function kContinuous(x, xi, bw) {
  if (!Number.isFinite(x) || !Number.isFinite(xi) || !Number.isFinite(bw) || bw <= 0) {
    return x === xi ? 1 : 0;
  }

  const z = (x - xi) / bw;
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z);
}

// Aitchison–Aitken kernel (unordered categorical)
function kUnordered(x, xi, lambda, C) {
  if (!Number.isFinite(lambda)) return x === xi ? 1 : 0;
  if (!Number.isFinite(C) || C <= 1) return x === xi ? 1 : 0;

  const safeLambda = Math.max(0, Math.min(lambda, (C - 1) / C));
  return x === xi ? 1 - safeLambda : safeLambda / (C - 1);
}

// Li–Racine kernel (ordered categorical)
function kOrdered(x, xi, lambda) {
  if (!Number.isFinite(lambda)) return x === xi ? 1 : 0;

  const safeLambda = Math.max(0, Math.min(lambda, 1));
  const d = Math.abs(Number(x) - Number(xi));
  return Number.isFinite(d) ? Math.pow(safeLambda, d) : 0;
}

/**
 * x0 is the conditional covariate
 */
const computeWeightsMixed = ({
  XCont,
  XCat,
  XOrd,
  x0,
  bwCont,
  lambdaCat,
  lambdaOrd,
  Ccat,
  externalH,
  externalLamda
}) => {
  const n = XCont.length;
  const weights = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    let k1 = 1.0;
    let k2 = 1.0;
    let k3 = 1.0;

    // --- continuous part ---
    for (let j = 0; j < XCont[i]?.length; j++) {
      k1 *= kContinuous(x0.cont[j], XCont[i][j], bwCont[j] * externalH);
    }

    // --- categorical part ---
    for (let j = 0; j < XCat[i]?.length; j++) {
      k2 *= kUnordered(
        x0.cat[j],
        XCat[i][j],
        lambdaCat[j] * (externalLamda ?? 1),
        Ccat[j],
      );
    }

    // --- ordered part ---
    for (let j = 0; j < XOrd[i]?.length; j++) {
      k3 *= kOrdered(x0.ord[j], XOrd[i][j], lambdaOrd[j] * (externalLamda ?? 1));
    }

    const weight = k1 * k2 * k3;
    weights[i] = Number.isFinite(weight) && weight > 0 ? weight : 0;
  }

  // normalize weights
  const sum = weights.reduce((a, b) => a + b, 0);
  if (!Number.isFinite(sum) || sum <= 0) {
    return weights.map(() => 1 / n);
  }

  return weights.map((w) => w / sum);
};

// Poisson kernel (shifted)
const poissonKernel = (y, yi, h) => {
  const lambda = yi + h;
  return jStat.poisson.pdf(y, lambda);
};
export { computeWeightsMixed, poissonKernel, kContinuous };
