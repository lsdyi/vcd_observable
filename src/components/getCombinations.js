/**
 * n choose r
 * C(n, r)
 * @param {Array} arr - The original array (n)
 * @param {number} r - The size of combinations to choose
 * @returns {Array[]} - An array of all combinations of r elements
 */
export const getCombinations = (arr, r) => {
  const results = [];

  function backtrack(start, currentCombo) {
    // Base case: if the combination is the desired size, save it
    if (currentCombo.length === r) {
      results.push([...currentCombo]);
      return;
    }

    // Iterate through the array starting from 'start' index
    for (let i = start; i < arr.length; i++) {
      currentCombo.push(arr[i]);      // Choose the element
      backtrack(i + 1, currentCombo); // Recurse to next elements
      currentCombo.pop();             // Backtrack (remove the element)
    }
  }

  backtrack(0, []);
  return results;
}