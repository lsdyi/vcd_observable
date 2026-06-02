---
title: Interactive Visualization of Conditional Distributions
toc: false
---

```js
import { createPortalData } from "./components/pageComponents.js";

const { localFitData, methodFlow, weightData } = createPortalData(d3);
const selectedKernelWeight = d3.max(weightData, (d) => d.weight);
```

```js
const localFitPlot = Plot.plot({
  height: 260,
  marginLeft: 48,
  color: {
    domain: ["Weighted GLM", "Conditional kernel"],
    range: ["#1b7f5f", "#c73632"],
    legend: true,
  },
  x: { label: "response y" },
  y: { label: "density", grid: true },
  marks: [
    Plot.areaY(localFitData, {
      x: "y",
      y: "density",
      fill: "estimator",
      fillOpacity: 0.08,
    }),
    Plot.line(localFitData, {
      x: "y",
      y: "density",
      stroke: "estimator",
      strokeWidth: 2.4,
    }),
    Plot.ruleY([0]),
  ],
});

const weightPlot = Plot.plot({
  height: 220,
  marginLeft: 44,
  x: { label: "covariate direction", grid: true },
  y: { label: "normalized kernel weight", grid: true },
  marks: [
    Plot.ruleX([0.45], { stroke: "#f28c28", strokeWidth: 2 }),
    Plot.dot(weightData, {
      x: "x",
      y: "weight",
      r: (d) => 3 + d.relativeWeight * 8,
      fill: "#3466a0",
      fillOpacity: (d) => 0.25 + d.relativeWeight * 0.7,
    }),
    Plot.line(weightData, {
      x: "x",
      y: "weight",
      stroke: "#3466a0",
      strokeWidth: 2,
    }),
    Plot.text([{ x: 0.45, weight: selectedKernelWeight * 1.08, label: "selected x" }], {
      x: "x",
      y: "weight",
      text: "label",
      dy: -4,
      fill: "#805100",
    }),
  ],
});

const flowPlot = Plot.plot({
  height: 190,
  marginLeft: 24,
  marginRight: 24,
  x: { domain: [-0.25, 3.25], axis: null },
  y: { domain: [-0.65, 0.65], axis: null },
  marks: [
    Plot.link(
      [
        { x1: 0.18, x2: 0.82, y1: 0, y2: 0 },
        { x1: 1.18, x2: 1.82, y1: 0, y2: 0 },
        { x1: 2.18, x2: 2.82, y1: 0, y2: 0 },
      ],
      { x1: "x1", x2: "x2", y1: "y1", y2: "y2", stroke: "#9aa5b1", strokeWidth: 2 },
    ),
    Plot.dot(methodFlow, { x: "x", y: 0, r: 18, fill: "#f28c28", stroke: "#805100" }),
    Plot.text(methodFlow, {
      x: "x",
      y: 0,
      text: (_, i) => `${i + 1}`,
      fill: "white",
      fontWeight: 700,
      dy: 1,
    }),
    Plot.text(methodFlow, {
      x: "x",
      y: -0.28,
      text: "step",
      fill: "currentColor",
      fontWeight: 700,
    }),
    Plot.text(methodFlow, {
      x: "x",
      y: -0.47,
      text: "detail",
      fill: "#667085",
      lineWidth: 14,
      fontSize: 11,
    }),
  ],
});
```

<style>
  .thesis-hero {
    display: grid;
    grid-template-columns: minmax(0, 1.05fr) minmax(320px, 0.95fr);
    gap: 2rem;
    align-items: center;
    padding: 2.5rem 0 2rem;
  }

  .eyebrow {
    margin: 0 0 0.7rem;
    color: #b35f00;
    font-size: 0.78rem;
    font-weight: 700;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .thesis-title {
    margin: 0;
    max-width: 820px;
    font-size: clamp(2.15rem, 6vw, 4.8rem);
    line-height: 0.98;
    letter-spacing: 0;
  }

  .lede {
    margin: 1.15rem 0 0;
    max-width: 720px;
    color: #475467;
    font-size: 1.08rem;
    line-height: 1.65;
  }

  .hero-actions {
    display: flex;
    flex-wrap: wrap;
    gap: 0.8rem;
    margin-top: 1.35rem;
  }

  .button-link {
    display: inline-flex;
    align-items: center;
    min-height: 42px;
    padding: 0 1rem;
    border: 1px solid #d0d5dd;
    border-radius: 8px;
    color: #1f2937;
    font-weight: 650;
    text-decoration: none;
    background: white;
  }

  .button-link.primary {
    border-color: #1b7f5f;
    color: white;
    background: #1b7f5f;
  }

  .visual-panel,
  .analogy-card,
  .method-panel,
  .case-card,
  .route-card {
    border: 1px solid #d0d5dd;
    border-radius: 8px;
    background: white;
  }

  .visual-panel {
    padding: 1rem;
  }

  .visual-caption {
    margin: 0.85rem 0 0;
    color: #667085;
    font-size: 0.9rem;
    line-height: 1.45;
  }

  .section {
    padding: 2.25rem 0;
  }

  .section h2 {
    margin: 0 0 0.7rem;
    font-size: clamp(1.55rem, 3vw, 2.35rem);
    letter-spacing: 0;
  }

  .section-intro {
    max-width: 780px;
    color: #475467;
    font-size: 1.02rem;
    line-height: 1.65;
  }

  .method-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    margin-top: 1.2rem;
  }

  .analogy-grid {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 1rem;
    margin-top: 1.2rem;
  }

  .analogy-card {
    padding: 1rem;
  }

  .analogy-card h3 {
    margin: 0 0 0.45rem;
    font-size: 1.08rem;
    letter-spacing: 0;
  }

  .analogy-card p {
    margin: 0 0 0.75rem;
    color: #667085;
    line-height: 1.55;
  }

  .analogy-card ul {
    margin: 0;
    padding-left: 1.1rem;
    color: #475467;
    line-height: 1.55;
  }

  .analogy-arrow {
    margin-top: 1rem;
    padding: 0.85rem 1rem;
    border-left: 4px solid #1b7f5f;
    background: #f6fbf8;
    color: #344054;
    line-height: 1.55;
  }

  .method-panel {
    padding: 1rem;
  }

  .method-panel h3,
  .case-card h3,
  .route-card h3 {
    margin: 0 0 0.45rem;
    font-size: 1rem;
    letter-spacing: 0;
  }

  .method-panel p,
  .case-card p,
  .route-card p {
    margin: 0;
    color: #667085;
    line-height: 1.55;
  }

  .plot-grid,
  .case-grid,
  .route-grid,
  .resource-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 1rem;
    margin-top: 1.2rem;
  }

  .plot-grid {
    grid-template-columns: minmax(0, 1.1fr) minmax(280px, 0.9fr);
  }

  .case-card,
  .route-card,
  .resource-card {
    padding: 1rem;
  }

  .case-label {
    display: inline-flex;
    margin-bottom: 0.65rem;
    color: #805100;
    font-size: 0.78rem;
    font-weight: 700;
    text-transform: uppercase;
  }

  .route-card a,
  .resource-card a {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    margin-top: 0.75rem;
    color: #1b7f5f;
    font-weight: 700;
    text-decoration: none;
  }

  .resource-grid {
    gap: 0;
    overflow: hidden;
    border: 1px solid #d0d5dd;
    border-radius: 8px;
    background: white;
  }

  .resource-card {
    display: grid;
    grid-template-rows: auto auto 1fr auto;
    min-height: 230px;
    border: 0;
    border-right: 1px solid #e4e7ec;
    border-radius: 0;
  }

  .resource-card:last-child {
    border-right: 0;
  }

  .resource-icon {
    display: inline-grid;
    place-items: center;
    width: 42px;
    height: 42px;
    margin-bottom: 0.9rem;
    border-radius: 8px;
    color: #1b7f5f;
    background: #eef8f3;
  }

  .resource-icon svg {
    width: 22px;
    height: 22px;
    stroke: currentColor;
    stroke-width: 2;
    fill: none;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .resource-card h3 {
    margin: 0 0 0.45rem;
    font-size: 1.02rem;
    letter-spacing: 0;
  }

  .resource-card p {
    margin: 0;
    color: #667085;
    line-height: 1.55;
  }

  .resource-card a::after {
    content: "->";
    margin-left: 0.1rem;
  }

  @media (max-width: 860px) {
    .thesis-hero,
    .analogy-grid,
    .method-grid,
    .plot-grid,
    .case-grid,
    .route-grid,
    .resource-grid {
      grid-template-columns: 1fr;
    }

    .resource-grid {
      gap: 0;
    }

    .resource-card {
      min-height: 0;
      border-right: 0;
      border-bottom: 1px solid #e4e7ec;
    }

    .resource-card:last-child {
      border-bottom: 0;
    }
  }
</style>

<section class="thesis-hero">
  <div>
    <p class="eyebrow">Master's thesis · local model assessment</p>
    <h1 class="thesis-title">Interactive visualization of conditional distributions</h1>
    <p class="lede">
      A regression model can look convincing from far away and still fail in the exact neighborhood where a researcher needs it to work. This project turns that problem into something visible: choose a model, move through covariate space, and compare the model's local distribution with data-driven alternatives.
    </p>
    <div class="hero-actions">
      <a class="button-link primary" href="./dashboard">Open the dashboard</a>
      <a class="button-link" href="./vcd_pca">Explore PCA view</a>
      <a class="button-link" href="./doctor">Doctor visit data</a>
    </div>
  </div>
  <div class="visual-panel">
    ${localFitPlot}
    <p class="visual-caption">
      The central visual idea: compare the model-implied local distribution with a nonparametric estimate around the same conditional point.
    </p>
  </div>
</section>

<section class="section">
  <h2>From Global Fit To Local Fit</h2>
  <p class="section-intro">
    The thesis starts from a familiar diagnostic habit: compare a fitted model distribution with a data-driven distribution. In a global check, that comparison is made for the response as a whole. In the local version, the same comparison is made after asking where in covariate space we are standing.
  </p>
  <div class="analogy-grid">
    <div class="analogy-card">
      <h3>Global fit check</h3>
      <p>Use when the first question is whether the model explains the overall response distribution.</p>
      <ul>
        <li>Compare the model-implied marginal distribution with a histogram or KDE.</li>
        <li>Every observation contributes to the check.</li>
        <li>Useful as an overview, a first warning, or a sanity check before deeper diagnosis.</li>
      </ul>
    </div>
    <div class="analogy-card">
      <h3>Local fit check</h3>
      <p>Use when the model may behave differently for different covariate profiles.</p>
      <ul>
        <li>Choose a conditional point and weight nearby observations more heavily.</li>
        <li>Compare the weighted model distribution with weighted nonparametric estimators.</li>
        <li>Useful for finding where a model fits, where it fails, and how it might be refined.</li>
      </ul>
    </div>
  </div>
  <div class="analogy-arrow">
    The transformation is simple but powerful: <strong>global comparison</strong> becomes <strong>local comparison</strong> by replacing equal contribution from all observations with kernel weights around a selected covariate point.
  </div>
</section>

<section class="section">
  <h2>The Method In One Pass</h2>
  <p class="section-intro">
    The dashboard keeps both sides of the analogy visible. The parametric side asks what the fitted model says the response should look like near the selected point. The nonparametric side asks what the nearby data say without trusting the model form. Because both sides use the same local weights, disagreement is evidence about local fit rather than an artifact of comparing different neighborhoods.
  </p>
  <div class="visual-panel">
    ${flowPlot}
  </div>
  <div class="method-grid">
    <div class="method-panel">
      <h3>Parametric side</h3>
      <p>Generalized linear models describe a full conditional distribution, not only a fitted mean. The dashboard includes Poisson, negative binomial, beta regression, and related GLM choices.</p>
    </div>
    <div class="method-panel">
      <h3>Nonparametric side</h3>
      <p>Weighted histograms, conditional kernel estimators, and modified kernel estimators provide model-agnostic local references for the response distribution.</p>
    </div>
    <div class="method-panel">
      <h3>Local weighting</h3>
      <p>Kernel weights decide which observations belong to the neighborhood of the selected covariate point. Bandwidth controls how narrow or generous that neighborhood is.</p>
    </div>
    <div class="method-panel">
      <h3>Interactive exploration</h3>
      <p>Observable Framework, D3, Plotly, and WebR make the method browser-based: the model, sliders, scatterplots, PCA view, and comparison plot update together.</p>
    </div>
  </div>
</section>

<section class="section">
  <h2>Why Bandwidth Matters</h2>
  <p class="section-intro">
    The selected conditional point is not a single observation. It is a neighborhood. A small bandwidth asks a very local question, sometimes with too little evidence. A larger bandwidth listens to more observations, but may smooth away the local signal. The dashboard keeps this choice visible.
  </p>
  <div class="plot-grid">
    <div class="visual-panel">
      ${weightPlot}
      <p class="visual-caption">These displayed weights are normalized across observations, so their total is 1.</p>
    </div>
    <div class="visual-panel">
      ${localFitPlot}
      <p class="visual-caption">When the weighted GLM curve and the data-driven curve disagree, the model may be locally misspecified.</p>
    </div>
  </div>
</section>

<section class="section">
  <h2>What The Experiments Show</h2>
  <div class="case-grid">
    <div class="case-card">
      <span class="case-label">Experiment 1</span>
      <h3>Locally overdispersed counts</h3>
      <p>A Poisson model can look reasonable in one region and fail where the data are generated with negative-binomial variation. The local view reveals where the variance assumption breaks.</p>
    </div>
    <div class="case-card">
      <span class="case-label">Experiment 2</span>
      <h3>Beta responses with changing precision</h3>
      <p>A beta regression with fixed precision can miss regions where the response becomes much more or less concentrated. The plots point toward a precision parameter that depends on covariates.</p>
    </div>
    <div class="case-card">
      <span class="case-label">Real data</span>
      <h3>Doctor visits after health reform</h3>
      <p>The German doctor-visit data are overdispersed overall, but the thesis also checks how Poisson and negative-binomial models behave at particular patient profiles.</p>
    </div>
  </div>
</section>

<section class="section">
  <h2>Start Exploring</h2>
  <div class="route-grid">
    <div class="route-card">
      <h3>Dashboard</h3>
      <p>The main thesis interface: choose data, select a model, move the conditional point, adjust bandwidth, and compare estimators.</p>
      <a href="./dashboard">Go to dashboard</a>
    </div>
    <div class="route-card">
      <h3>PCA workflow</h3>
      <p>Use principal components to navigate higher-dimensional covariate spaces without drowning in pairwise scatterplots.</p>
      <a href="./vcd_pca">Open PCA page</a>
    </div>
    <div class="route-card">
      <h3>Background examples</h3>
      <p>See smaller demonstrations for PCA, density estimation, and count-data modeling before entering the full dashboard.</p>
      <a href="./density_estimate">View examples</a>
    </div>
  </div>
</section>

<section class="section">
  <h2>Project Resources</h2>
  <p class="section-intro">
    The thesis and the web application are developed in parallel: the paper gives the statistical argument, while the Observable app makes the method explorable in the browser.
  </p>
  <div class="resource-grid">
    <div class="resource-card">
      <span class="resource-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M10 20.5c-4.5 1.2-4.5-2-6.3-2.5" />
          <path d="M14 22v-3.9c0-1 .3-1.7.8-2.2-2.7-.3-5.6-1.4-5.6-6.1 0-1.4.5-2.5 1.3-3.4-.1-.3-.6-1.7.1-3.4 0 0 1.1-.3 3.5 1.3a12 12 0 0 1 6.4 0C22.9 2.7 24 3 24 3c.7 1.7.2 3.1.1 3.4.8.9 1.3 2 1.3 3.4 0 4.7-2.9 5.8-5.6 6.1.5.5.8 1.3.8 2.5V22" transform="scale(.86) translate(-1 0)" />
        </svg>
      </span>
      <h3>Web application repository</h3>
      <p>Source code for this Observable Framework site, including the dashboard, reusable components, data, and deployment setup.</p>
      <a href="https://github.com/lsdyi/vcd_observable">Open GitHub repo</a>
    </div>
    <div class="resource-card">
      <span class="resource-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M4 19.5V5a2 2 0 0 1 2-2h10.5L20 6.5v13a1.5 1.5 0 0 1-1.5 1.5H6a2 2 0 0 1-2-1.5Z" />
          <path d="M16 3v4h4" />
          <path d="M8 11h8" />
          <path d="M8 15h6" />
        </svg>
      </span>
      <h3>Thesis Overleaf project</h3>
      <p>The collaborative LaTeX workspace used for writing and revising the thesis manuscript.</p>
      <a href="https://www.overleaf.com/project/696eb73c13ae0d69be0a84bd">Open Overleaf project</a>
    </div>
    <div class="resource-card">
      <span class="resource-icon" aria-hidden="true">
        <svg viewBox="0 0 24 24">
          <path d="M6 3h9l5 5v13H6z" />
          <path d="M15 3v5h5" />
          <path d="M9 13h6" />
          <path d="M9 17h4" />
          <path d="M4 7v14h14" />
        </svg>
      </span>
      <h3>Thesis LaTeX repository</h3>
      <p>Version-controlled LaTeX source for the thesis, including chapters, figures, bibliography, and compiled paper assets.</p>
      <a href="https://github.com/lsdyi/vcd">Open thesis repo</a>
    </div>
  </div>
</section>
