import { MAX_TURNS } from './constants.js';
import { generateHypotheses } from './hypotheses.js';
import {
  bestNextMove,
  cellInsights,
  filterHypotheses,
  mostLikelyRedCell,
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
const btnSettings = document.getElementById('btnSettings');
const settingsPanel = document.getElementById('settingsPanel');
const modeInputs = document.querySelectorAll('input[name="strategyMode"]');

const observations = [];
const observationIndexMap = new Map();
let mode = 'score';

renderLegend(legend);
const cells = createBoard(boardGrid, handleCycleCell);
setGridLabels(cells);
updateBadges(turnBadge, hypothesisBadge, observations.length, allHypotheses.length);
modeBadge.textContent = 'Mode: score';

function refreshBoardRecommendation(idx = -1, likelyRedIdx = -1) {
  clearRecommended(cells);
  if (idx >= 0) {
    markRecommended(cells, idx);
  }
  if (likelyRedIdx >= 0) {
    markLikelyRed(cells, likelyRedIdx);
  }
}

function rebuildFromObservations() {
  for (let i = 0; i < cells.length; i += 1) {
    setCellState(cells, i, 'unknown');
  }
  refreshBoardRecommendation(-1, -1);

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
  refreshBoardRecommendation(-1, -1);
  updateBadges(turnBadge, hypothesisBadge, observations.length, allHypotheses.length);
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
  const currentHypotheses = filterHypotheses(allHypotheses, observations);

  updateBadges(turnBadge, hypothesisBadge, observations.length, currentHypotheses.length);

  if (currentHypotheses.length === 0) {
    refreshBoardRecommendation(-1, -1);
    renderNoSolutions(resultsArea, 'No hidden board satisfies these observations.');
    return;
  }

  const bestMove = bestNextMove(currentHypotheses, observations, mode);
  if (!bestMove) {
    refreshBoardRecommendation(-1, -1);
    renderNoSolutions(resultsArea, 'No moves left. All observed turns are already used.');
    return;
  }

  const likelyRed = mostLikelyRedCell(currentHypotheses);
  const insights = cellInsights(currentHypotheses);
  const branches = outcomeBranches(currentHypotheses, observations, bestMove, mode);
  const sequence = projectedSequence(currentHypotheses, observations, mode);

  renderResults(resultsArea, {
    observations,
    mode,
    hypothesesCount: currentHypotheses.length,
    bestMove,
    likelyRed,
    insights,
    branches,
    sequence,
  });

  refreshBoardRecommendation(bestMove.index, likelyRed.index);
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
