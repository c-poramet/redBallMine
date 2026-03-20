import { MAX_TURNS } from './constants.js';
import { generateHypotheses } from './hypotheses.js';
import {
  bestNextMove,
  filterHypotheses,
  mostLikelyRedCell,
  outcomeBranches,
  projectedSequence,
} from './solver.js';
import {
  clearRecommended,
  createBoard,
  markRecommended,
  renderLegend,
  renderNoSolutions,
  renderResults,
  setCellState,
  setGridLabels,
  updateBadges,
} from './ui.js';

const allHypotheses = generateHypotheses();

const boardGrid = document.getElementById('boardGrid');
const legend = document.getElementById('legend');
const btnAnalyze = document.getElementById('btnAnalyze');
const btnUndo = document.getElementById('btnUndo');
const btnReset = document.getElementById('btnReset');
const resultsArea = document.getElementById('resultsArea');
const turnBadge = document.getElementById('turnBadge');
const hypothesisBadge = document.getElementById('hypothesisBadge');

const observations = [];
const observationIndexMap = new Map();

renderLegend(legend);
const cells = createBoard(boardGrid, handleCycleCell);
setGridLabels(cells);
updateBadges(turnBadge, hypothesisBadge, observations.length, allHypotheses.length);

function refreshBoardRecommendation(idx = -1) {
  clearRecommended(cells);
  if (idx >= 0) {
    markRecommended(cells, idx);
  }
}

function rebuildFromObservations() {
  for (let i = 0; i < cells.length; i += 1) {
    setCellState(cells, i, 'unknown');
  }
  refreshBoardRecommendation(-1);

  for (const obs of observations) {
    setCellState(cells, obs.index, obs.color);
  }

  updateBadges(turnBadge, hypothesisBadge, observations.length, allHypotheses.length);
}

function handleCycleCell(index, color) {
  const existingPos = observationIndexMap.get(index);

  if (existingPos == null && color !== 'unknown' && observations.length >= MAX_TURNS) {
    renderNoSolutions(resultsArea, 'Maximum of 5 observed turns reached. Use Undo or Reset to change state.');
    return;
  }

  if (existingPos == null) {
    if (color !== 'unknown') {
      observations.push({ index, color });
      observationIndexMap.set(index, observations.length - 1);
    }
  } else if (color === 'unknown') {
    observations.splice(existingPos, 1);
    observationIndexMap.clear();
    observations.forEach((obs, i) => observationIndexMap.set(obs.index, i));
  } else {
    observations[existingPos].color = color;
  }

  setCellState(cells, index, color);
  refreshBoardRecommendation(-1);
  updateBadges(turnBadge, hypothesisBadge, observations.length, allHypotheses.length);
}

btnAnalyze.addEventListener('click', () => {
  const currentHypotheses = filterHypotheses(allHypotheses, observations);

  updateBadges(turnBadge, hypothesisBadge, observations.length, currentHypotheses.length);

  if (currentHypotheses.length === 0) {
    refreshBoardRecommendation(-1);
    renderNoSolutions(resultsArea, 'No hidden board satisfies these observations.');
    return;
  }

  const bestMove = bestNextMove(currentHypotheses, observations);
  if (!bestMove) {
    refreshBoardRecommendation(-1);
    renderNoSolutions(resultsArea, 'No moves left. All observed turns are already used.');
    return;
  }

  const likelyRed = mostLikelyRedCell(currentHypotheses);
  const branches = outcomeBranches(currentHypotheses, observations, bestMove);
  const sequence = projectedSequence(currentHypotheses, observations);

  renderResults(resultsArea, {
    observations,
    hypothesesCount: currentHypotheses.length,
    bestMove,
    likelyRed,
    branches,
    sequence,
  });

  refreshBoardRecommendation(bestMove.index);
});

btnUndo.addEventListener('click', () => {
  if (!observations.length) return;
  const removed = observations.pop();
  observationIndexMap.delete(removed.index);
  observationIndexMap.clear();
  observations.forEach((obs, i) => observationIndexMap.set(obs.index, i));

  rebuildFromObservations();
});

btnReset.addEventListener('click', () => {
  observations.length = 0;
  observationIndexMap.clear();
  resultsArea.innerHTML = `
    <div class="placeholder-state">
      <div class="placeholder-pill">Ready</div>
      <p class="placeholder-text">Start by recording what you observed in game, then click Analyze Best Move.</p>
    </div>
  `;
  rebuildFromObservations();
});
