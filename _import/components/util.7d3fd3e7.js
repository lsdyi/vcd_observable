const selectFromKeys = (data, keys = []) => {
  const matrix = data.map((row) =>
    keys
      .filter((key) => row.hasOwnProperty(key)) // keep only existing keys
      .map((key) => row[key]),
  );

  return matrix;
};

const getCardinalityFromMatrix = (matrix) => {
  const cols = matrix[0].length;
  const result = [];

  for (let j = 0; j < cols; j++) {
    const set = new Set();

    for (let i = 0; i < matrix.length; i++) {
      set.add(matrix[i][j]);
    }

    result.push(set.size);
  }

  return result;
};

export { selectFromKeys, getCardinalityFromMatrix };
