// See https://observablehq.com/framework/config for documentation.
export default {
  title: "VCD Project",
  root: "src",
  head: '<link rel="icon" href="https://avatars.githubusercontent.com/u/52379902?v=4" type="image/png" sizes="32x32">',
  theme: ["air", "near-midnight"],
  search: true,
  pages: [
    { name: "Overview", path: "/" },
    {
      name: "Application",
      pages: [{ name: "Dashboard", path: "/dashboard" }],
    },
    {
      name: "Method Notes",
      pages: [
        { name: "Density Estimator", path: "/density_estimate" },
        { name: "PCA Navigation", path: "/pca" },
        { name: "Poisson & Negative Binomial", path: "/poisson_neg" },
        { name: "Doctor Visit", path: "/doctor" },
      ],
    },
    {
      name: "Prototypes",
      pages: [
        { name: "React Dashboard", path: "/react_dashboard" },
        { name: "Slider Prototype", path: "/vcd_v0" },
        { name: "PCA Prototype", path: "/vcd_pca" },
      ],
    },
  ],
};
