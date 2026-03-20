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

function allCells() {
  return [...Array(CELL_COUNT).keys()];
}

function deriveTealCells(red, orange, yellow, green) {
  const rowCol = uniqueSorted(getRowColCells(red));
  const diag = uniqueSorted(getDiagonalCells(red));
  const line = new Set([...rowCol, ...diag]);
  const used = new Set([red, ...orange, ...yellow, ...green]);
  return [...line].filter((idx) => !used.has(idx));
}

function validateRules(board, red) {
  const orth = new Set(getOrthNeighbors(red));
  const rowCol = new Set(getRowColCells(red));
  const diag = new Set(getDiagonalCells(red));
  const line = new Set([...rowCol, ...diag]);

  let orangeCount = 0;
  let yellowCount = 0;
  let greenCount = 0;

  for (let i = 0; i < board.length; i += 1) {
    const color = board[i];
    if (i === red && color !== 'red') return false;
    if (color === 'orange') {
      orangeCount += 1;
      if (!orth.has(i)) return false;
    }
    if (color === 'yellow') {
      yellowCount += 1;
      if (!diag.has(i)) return false;
    }
    if (color === 'green') {
      greenCount += 1;
      if (!rowCol.has(i)) return false;
    }
    if (color === 'teal') {
      if (!line.has(i)) return false;
    }
    if (color === 'blue') {
      if (line.has(i)) return false;
    }
  }

  return (
    orangeCount === REQUIRED_COUNTS.orange &&
    yellowCount === REQUIRED_COUNTS.yellow &&
    greenCount === REQUIRED_COUNTS.green
  );
}

export function generateHypotheses() {
  const hypotheses = [];

  for (let red = 0; red < CELL_COUNT; red += 1) {
    if (red === CENTER_INDEX) continue;

    const orth = uniqueSorted(getOrthNeighbors(red));
    const diag = uniqueSorted(getDiagonalCells(red));
    const rowCol = uniqueSorted(getRowColCells(red));
    if (orth.length < REQUIRED_COUNTS.orange) continue;
    if (diag.length < REQUIRED_COUNTS.yellow) continue;

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
          const teal = deriveTealCells(red, orange, yellow, green);
          const board = buildBoard(red, orange, yellow, green, teal);
          if (validateRules(board, red)) {
            hypotheses.push(board);
          }
        }
      }
    }
  }

  return hypotheses;
}
