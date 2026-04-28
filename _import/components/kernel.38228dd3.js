import jStat from "../../_node/jstat@1.9.6/index.bc60a888.js";

// Gaussian kernel (continuous)
function kContinuous(x, xi, bw) {
  const z = (x - xi) / bw;
  return (1 / Math.sqrt(2 * Math.PI)) * Math.exp(-0.5 * z * z);
}

// Aitchison–Aitken kernel (unordered categorical)
function kUnordered(x, xi, lambda, C) {
  return x === xi ? 1 - lambda : lambda / (C - 1);
}

// Li–Racine kernel (ordered categorical)
function kOrdered(x, xi, lambda) {
  const d = Math.abs(Number(x) - Number(xi));
  return Math.pow(lambda, d);
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
  externlH,
}) => {
  const n = XCont.length;
  const weights = new Array(n).fill(0);

  for (let i = 0; i < n; i++) {
    let k1 = 1.0;
    let k2 = 1.0;
    let k3 = 1.0;

    // --- continuous part ---
    for (let j = 0; j < XCont[i]?.length; j++) {
      k1 *= kContinuous(x0.cont[j], XCont[i][j], bwCont[j] * externlH);
    }

    // --- categorical part ---
    for (let j = 0; j < XCat[i]?.length; j++) {
      k2 *= kUnordered(x0.cat[j], XCat[i][j], lambdaCat[j], Ccat[j] * externlH);
    }

    // --- ordered part ---
    for (let j = 0; j < XOrd[i]?.length; j++) {
      k3 *= kOrdered(x0.ord[j], XOrd[i][j], lambdaOrd[j] * externlH);
    }

    weights[i] = k1 * k2 * k3;
  }

  // normalize weights
  const sum = weights.reduce((a, b) => a + b, 0);
  return weights.map((w) => w / sum);
};

// Poisson kernel (shifted)
const poissonKernel = (y, yi, h) => {
  const lambda = yi + h;
  return jStat.poisson.pdf(y, lambda);
};
export { computeWeightsMixed, poissonKernel, kContinuous };
