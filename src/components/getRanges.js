// get range of each variables from dataset
export const getRanges = (arr) => {
  if (!arr.length) return {};

  return arr.reduce((acc, obj) => {
    Object.keys(obj).forEach((key) => {
      const val = obj[key];

      if (typeof val === "number") {
        // Initialize or update numeric min/max
        if (!acc[key]) {
          acc[key] = { min: val, max: val };
        } else {
          acc[key].min = Math.min(acc[key].min, val);
          acc[key].max = Math.max(acc[key].max, val);
        }
      } else {
        // Handle strings/categories using a Set for unique values
        if (!acc[key]) acc[key] = new Set();
        acc[key].add(val);
      }
    });
    return acc;
  }, {});
};