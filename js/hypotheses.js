import {
  CELL_COUNT,
  CENTER_INDEX,
  REQUIRED_COUNTS,
} from './constants.js';
import {
  getOrthNeighbors,
  getDiagonalCells,
  getRowColCells,
  uniqueSorted,
} from './geometry.js';

function combinations(items, k) {
  if (k === 0) return [[]];
  if (items.length < k) return [];
  const out = [];

  function walk(start, picked) {
    if (picked.length === k) {
      out.push([...picked]);
      return;
    }
    for (let i = start; i < items.length; i += 1) {
      picked.push(items[i]);
      walk(i + 1, picked);
      picked.pop();
    }
  }

  walk(0, []);
  return out;
}

function setDifference(base, bannedSet) {
  return base.filter((v) => !bannedSet.has(v));
}

function buildBoard(red, orange, yellow, green, teal) {
  const board = new Array(CELL_COUNT).fill('blue');
  board[red] = 'red';
  for (const idx of orange) board[idx] = 'orange';
  for (const idx of yellow) board[idx] = 'yellow';
  for (const idx of green) board[idx] = 'green';
  for (const idx of teal) board[idx] = 'teal';
  return board;
}

function validateCounts(board) {
  const count = {
    red: 0,
    orange: 0,
    yellow: 0,
    green: 0,
    teal: 0,
    blue: 0,
  };
  for (const color of board) {
    count[color] += 1;
  }
  return Object.entries(REQUIRED_COUNTS).every(([key, value]) => count[key] === value);
}

export function generateHypotheses() {
  const hypotheses = [];

  for (let red = 0; red < CELL_COUNT; red += 1) {
    if (red === CENTER_INDEX) continue;

    const orth = uniqueSorted(getOrthNeighbors(red));
    const diag = uniqueSorted(getDiagonalCells(red));
    const rowCol = uniqueSorted(getRowColCells(red));
    const line = uniqueSorted([...rowCol, ...diag]);

    if (orth.length < REQUIRED_COUNTS.orange) continue;
    if (diag.length < REQUIRED_COUNTS.yellow) continue;

    // Blue is forbidden on red's row/column/diagonal. Those 12 cells must be exactly O+Y+G+T.
    if (line.length !== 12) continue;

    const orangeChoices = combinations(orth, REQUIRED_COUNTS.orange);
    for (const orange of orangeChoices) {
      const usedAfterOrange = new Set(orange);
      const yellowPool = setDifference(diag, usedAfterOrange);
      const yellowChoices = combinations(yellowPool, REQUIRED_COUNTS.yellow);

      for (const yellow of yellowChoices) {
        const usedAfterYellow = new Set([...orange, ...yellow]);
        const greenPool = setDifference(rowCol, usedAfterYellow);
        const greenChoices = combinations(greenPool, REQUIRED_COUNTS.green);

        for (const green of greenChoices) {
          const usedAfterGreen = new Set([...orange, ...yellow, ...green]);
          const tealPool = setDifference(line, usedAfterGreen);
          const tealChoices = combinations(tealPool, REQUIRED_COUNTS.teal);

          for (const teal of tealChoices) {
            const board = buildBoard(red, orange, yellow, green, teal);
            if (validateCounts(board)) {
              hypotheses.push(board);
            }
          }
        }
      }
    }
  }

  return hypotheses;
}
