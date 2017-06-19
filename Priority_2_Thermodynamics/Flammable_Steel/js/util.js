/* File: util.js
 * Description: A collection of utility functions for use throughout the 
 *        steel.js project.
 *
 * Authors: Brooke Bullek (May 2017)
 *          Under the supervision of Margot Vigeant, Bucknell University
 * (c) Margot Vigeant 2017
 */

/*
 * Creates and returns a two-dimensional array initialized with zeroes.
 * (p5.js doesn't have native support for 2D arrays otherwise.)
 */
function create2DArray(numRows, numCols) {
  array2D = []
  // Create nested array
  for (var i = 0; i < numRows; i++) {
    array2D[i] = [];
    for (var j = 0; j < numCols; j++) {
      array2D[i][j] = 0;
    }
  }
  return array2D;
}

/*
 * Returns a random number within the specified min/max range.
 */
function rand (min, max) { 
  return Math.random() * (max - min) + min;
}