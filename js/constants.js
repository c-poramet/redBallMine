export const GRID_SIZE = 5;
export const CELL_COUNT = GRID_SIZE * GRID_SIZE;
export const CENTER_INDEX = 12;
export const MAX_TURNS = 5;

export const COLORS = [
  'unknown',
  'blue',
  'teal',
  'green',
  'yellow',
  'orange',
  'red',
];

export const PLAYABLE_COLORS = COLORS.slice(1);

export const COLOR_LABEL = {
  unknown: 'Unknown',
  red: 'Red',
  orange: 'Orange',
  yellow: 'Yellow',
  green: 'Green',
  teal: 'Teal',
  blue: 'Blue',
};

export const COLOR_SCORE = {
  red: 6,
  orange: 5,
  yellow: 4,
  green: 3,
  teal: 2,
  blue: 1,
};

export const STRATEGY_LABEL = {
  score: 'score',
  red: 'red hunt',
  hybrid: 'hybrid',
};

export const REQUIRED_COUNTS = {
  red: 1,
  orange: 2,
  yellow: 3,
  green: 4,
  teal: 3,
  blue: 12,
};

export const ROW_LABELS = ['A', 'B', 'C', 'D', 'E'];
