import { GRID_SIZE } from './constants.js';

export function toIndex(row, col) {
  return row * GRID_SIZE + col;
}

export function toRowCol(index) {
  return {
    row: Math.floor(index / GRID_SIZE),
    col: index % GRID_SIZE,
  };
}

export function coordinateName(index) {
  const { row, col } = toRowCol(index);
  return `${String.fromCharCode(65 + row)}${col + 1}`;
}

export function getOrthNeighbors(index) {
  const { row, col } = toRowCol(index);
  const out = [];
  if (row > 0) out.push(toIndex(row - 1, col));
  if (row < GRID_SIZE - 1) out.push(toIndex(row + 1, col));
  if (col > 0) out.push(toIndex(row, col - 1));
  if (col < GRID_SIZE - 1) out.push(toIndex(row, col + 1));
  return out;
}

export function getDiagonalCells(index) {
  const { row, col } = toRowCol(index);
  const out = [];
  for (let r = 0; r < GRID_SIZE; r += 1) {
    for (let c = 0; c < GRID_SIZE; c += 1) {
      if (r === row && c === col) continue;
      if (Math.abs(r - row) === Math.abs(c - col)) {
        out.push(toIndex(r, c));
      }
    }
  }
  return out;
}

export function getRowColCells(index) {
  const { row, col } = toRowCol(index);
  const out = [];
  for (let i = 0; i < GRID_SIZE; i += 1) {
    if (i !== col) out.push(toIndex(row, i));
    if (i !== row) out.push(toIndex(i, col));
  }
  return out;
}

export function uniqueSorted(values) {
  return [...new Set(values)].sort((a, b) => a - b);
}
