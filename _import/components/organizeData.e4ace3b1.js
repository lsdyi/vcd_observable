// convert R proxy datatype to d3 datatype
// an array of numbers -> an array of object with every object being an observation
export const organizeData = (data, keys = [], nrow = 1319) => {
  const temp = matrixData(data, keys.length, nrow);
  return temp.map((item) => {
    const rowObj = Object.fromEntries(
      keys.map((key, index) => [key, item[index]]),
    );
    return rowObj;
  });
};

// convert R proxy datatype to a matrix
// an array of numbers -> a matrix
export const matrixData = (data, ncol = 8, nrow = 1319) => {
  const newData = [];
  for (let i = 0; i < nrow; i++) {
    const rowAr = [];
    for (let j = 0; j < ncol; j++) {
      const index = j * nrow + i;
      rowAr.push(data[index]);
    }
    newData.push(rowAr);
  }

  return newData;
};
