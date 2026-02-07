import kd from "../../_node/kd-tree-javascript@1.0.3/index.9d2a7aff.js";

function distance(x, xlocal, stdev, power) {
  let dist = 0;
  if (power == Infinity) {
    let dist = -Infinity;
    for (let i = 0; i < x.length; ++i) {
      dist = Math.max(dist, Math.abs((x[i] - xlocal[i]) / stdev[i]));
    }
    return dist;
  }
  for (let i = 0; i < x.length; ++i) {
    dist += Math.pow(Math.abs((x[i] - xlocal[i]) / stdev[i]), power);
  }
  return Math.pow(dist, 1 / power);
}

function find_k_nearest(data, xlocal, stdev, power, k_nearest) {
  var distance2 = function (x, xlocal) {
    return distance(x, xlocal, stdev, power);
  };
  const keys = Object.keys(data[0]);
  var tree = new kd.kdTree(data, distance2, keys);

  const conData = Object.fromEntries(
    keys.map((key, index) => [key, xlocal[index]]),
  );
  var nearest = tree.nearest(conData, k_nearest);
  return nearest;
}

// get every observation a weight according to conditional data, distance type
export const normWeights = (
  data,
  xlocal,
  stdevs,
  distance_type = "euclidean",
  kernal = 10,
  power = 2,
) => {
  if (distance_type == "euclidean") {
    var kernel = function (dist) {
      return Math.exp(-Math.pow(dist / kernal, 2));
    };
    return data.map((d, index) => ({
      id: index,
      w: kernel(distance(Object.values(d), xlocal, stdevs, power)),
    }));
  } else if (distance_type == "k-nearest") {
    // @todo: k number
    const k_nearest = 94;
    const k_nearest_neighbors = find_k_nearest(
      data.map((item, index) => ({id:index, ...item})),
      xlocal,
      stdevs,
      power,
      k_nearest,
    );
    const ids = k_nearest_neighbors.map((d) => d[0].id);
    return data.map((d, index) => ({
      id: index,
      w: ids.includes(d.id) ? 1 : 0,
    }));
  }
};
