import { COLOR_SCORE, MAX_TURNS } from './constants.js';
import { generateHypotheses } from './hypotheses.js';
import {
  bestNextMove,
  bestMoveCandidates,
  cellInsights,
  colorDistribution,
  filterHypotheses,
  mostLikelyRedCell,
  mostLikelyRedCells,
  outcomeBranches,
  projectedSequence,
} from './solver.js';
import {
  clearRecommended,
  createBoard,
  markLikelyRed,
  markRecommended,
  renderLegend,
  renderNoSolutions,
  renderResults,
  renderHoverIndicatorDistribution,
  renderHoverIndicatorEmpty,
  renderHoverIndicatorInput,
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
const modeBadge = document.getElementById('modeBadge');
const hoverIndicatorBody = document.getElementById('hoverIndicatorBody');
const btnSettings = document.getElementById('btnSettings');
const settingsPanel = document.getElementById('settingsPanel');
const modeInputs = document.querySelectorAll('input[name="strategyMode"]');

const observations = [];
const observationIndexMap = new Map();
let mode = 'score';
let currentHypotheses = [...allHypotheses];

renderLegend(legend);
const cells = createBoard(boardGrid, handleCycleCell, handleHoverCell, handleHoverLeave);
setGridLabels(cells);
updateBadges(turnBadge, hypothesisBadge, observations.length, allHypotheses.length);
modeBadge.textContent = 'Mode: score';
renderHoverIndicatorEmpty(hoverIndicatorBody);

function refreshBoardRecommendation(bestIndices = [], likelyRedIndices = []) {
  clearRecommended(cells);
  for (const idx of bestIndices) {
    markRecommended(cells, idx);
  }
  for (const idx of likelyRedIndices) {
    markLikelyRed(cells, idx);
  }
}

function recomputeCurrentHypotheses() {
  currentHypotheses = filterHypotheses(allHypotheses, observations);
}

function rebuildFromObservations() {
  for (let i = 0; i < cells.length; i += 1) {
    setCellState(cells, i, 'unknown');
  }
  refreshBoardRecommendation([], []);

  for (const obs of observations) {
    setCellState(cells, obs.index, obs.color);
  }

  recomputeCurrentHypotheses();
  updateBadges(turnBadge, hypothesisBadge, observations.length, currentHypotheses.length);
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
  refreshBoardRecommendation([], []);
  recomputeCurrentHypotheses();
  updateBadges(turnBadge, hypothesisBadge, observations.length, currentHypotheses.length);
}

function handleHoverCell(index) {
  const obsPos = observationIndexMap.get(index);
  if (obsPos != null) {
    renderHoverIndicatorInput(hoverIndicatorBody, index, observations[obsPos].color);
    return;
  }

  if (!currentHypotheses.length) {
    renderHoverIndicatorEmpty(hoverIndicatorBody);
    return;
  }

  const dist = colorDistribution(currentHypotheses, index);
  renderHoverIndicatorDistribution(hoverIndicatorBody, index, dist);
}

function handleHoverLeave() {
  renderHoverIndicatorEmpty(hoverIndicatorBody);
}

btnSettings.addEventListener('click', () => {
  const isOpen = settingsPanel.classList.contains('open');
  settingsPanel.classList.toggle('open', !isOpen);
  btnSettings.classList.toggle('active', !isOpen);
});

document.addEventListener('click', (event) => {
  if (!settingsPanel.classList.contains('open')) return;
  const target = event.target;
  if (settingsPanel.contains(target) || btnSettings.contains(target)) return;
  settingsPanel.classList.remove('open');
  btnSettings.classList.remove('active');
});

for (const input of modeInputs) {
  input.addEventListener('change', () => {
    if (!input.checked) return;
    mode = input.value;
    modeBadge.textContent = `Mode: ${mode === 'red' ? 'red hunt' : mode}`;
  });
}

btnAnalyze.addEventListener('click', () => {
  recomputeCurrentHypotheses();

  updateBadges(turnBadge, hypothesisBadge, observations.length, currentHypotheses.length);

  if (currentHypotheses.length === 0) {
    refreshBoardRecommendation(-1, -1);
    renderNoSolutions(resultsArea, 'No hidden board satisfies these observations.');
    return;
  }

  const bestMove = bestNextMove(currentHypotheses, observations, mode);
  const bestCandidates = bestMoveCandidates(currentHypotheses, observations, mode);
  if (!bestMove) {
    refreshBoardRecommendation([], []);
    renderNoSolutions(resultsArea, 'No moves left. All observed turns are already used.');
    return;
  }

  const likelyRed = mostLikelyRedCell(currentHypotheses);
  const likelyRedGroup = mostLikelyRedCells(currentHypotheses);
  const insights = cellInsights(currentHypotheses);
  const branches = outcomeBranches(currentHypotheses, observations, bestMove, mode);
  const sequence = projectedSequence(currentHypotheses, observations, mode);
  const accumulatedScore = observations.reduce((sum, obs) => sum + COLOR_SCORE[obs.color], 0);
  const expectedRemainingScore = sequence.reduce((sum, step) => sum + step.expectedScore, 0);
  const scoreSummary = {
    accumulated: accumulatedScore,
    expectedNext: bestMove.expectedScore,
    expectedRemaining: expectedRemainingScore,
    projectedTotal: accumulatedScore + expectedRemainingScore,
  };

  renderResults(resultsArea, {
    observations,
    mode,
    hypothesesCount: currentHypotheses.length,
    bestMove,
    likelyRed,
    insights,
    branches,
    sequence,
    scoreSummary,
  });

  refreshBoardRecommendation(
    bestCandidates.map((c) => c.index),
    likelyRedGroup.indices,
  );
});

btnUndo.addEventListener('click', () => {
  if (!observations.length) return;
  const removed = observations.pop();
  observationIndexMap.delete(removed.index);
  observationIndexMap.clear();
  observations.forEach((obs, i) => observationIndexMap.set(obs.index, i));

  rebuildFromObservations();
  renderHoverIndicatorEmpty(hoverIndicatorBody);
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
  renderHoverIndicatorEmpty(hoverIndicatorBody);
});
