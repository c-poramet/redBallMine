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
  projectedSequenceFromCandidate,
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
const RUN_HISTORY_KEY = 'redBallMineRunScoresV1';
let hasRecordedCurrentRun = false;

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

function loadRunHistory() {
  try {
    const raw = window.localStorage.getItem(RUN_HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter((x) => Number.isFinite(x));
  } catch {
    return [];
  }
}

function saveRunHistory(scores) {
  try {
    window.localStorage.setItem(RUN_HISTORY_KEY, JSON.stringify(scores));
  } catch {
    // Ignore storage failures (private mode / blocked storage).
  }
}

function finalizeRunComparison(currentScore) {
  const history = loadRunHistory();
  if (!hasRecordedCurrentRun) {
    history.push(currentScore);
    saveRunHistory(history);
    hasRecordedCurrentRun = true;
  }

  const bestScore = history.length ? Math.max(...history) : currentScore;
  const betterRuns = history.filter((score) => score > currentScore).length;
  const equalRuns = history.filter((score) => score === currentScore).length;

  return {
    currentScore,
    bestScore,
    rank: betterRuns + 1,
    totalRuns: history.length || 1,
    tiedRuns: equalRuns,
    isBest: betterRuns === 0,
  };
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

  if (observations.length < MAX_TURNS) {
    hasRecordedCurrentRun = false;
  }

  // Keep hover indicator in sync instantly after click without requiring mouse move.
  handleHoverCell(index);

  if (observations.length >= MAX_TURNS) {
    analyzeBoard();
  }
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

function isFormEditingTarget(target) {
  if (!(target instanceof Element)) return false;
  return Boolean(target.closest('input, textarea, select, [contenteditable="true"]'));
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

function analyzeBoard() {
  const isFinalTurn = observations.length >= MAX_TURNS;
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
  const accumulatedScore = observations.reduce((sum, obs) => sum + COLOR_SCORE[obs.color], 0);
  const candidateViews = bestCandidates.map((candidate) => {
    const branches = outcomeBranches(currentHypotheses, observations, candidate, mode);
    const sequence = projectedSequenceFromCandidate(currentHypotheses, observations, candidate, mode);
    const expectedRemaining = sequence.reduce((sum, step) => sum + step.expectedScore, 0);
    return {
      ...candidate,
      branches,
      sequence,
      expectedRemaining,
      projectedTotal: accumulatedScore + expectedRemaining,
    };
  });

  const expectedRemainingScore = isFinalTurn ? 0 : (candidateViews[0]?.expectedRemaining ?? 0);
  const scoreSummary = {
    accumulated: accumulatedScore,
    expectedNext: isFinalTurn ? 0 : bestMove.expectedScore,
    expectedRemaining: expectedRemainingScore,
    projectedTotal: accumulatedScore + expectedRemainingScore,
  };

  const runComparison = isFinalTurn ? finalizeRunComparison(accumulatedScore) : null;

  renderResults(resultsArea, {
    observations,
    mode,
    hypothesesCount: currentHypotheses.length,
    bestMove,
    bestCandidates: candidateViews,
    likelyRed,
    insights,
    branches: candidateViews[0]?.branches ?? [],
    sequence: candidateViews[0]?.sequence ?? projectedSequence(currentHypotheses, observations, mode),
    scoreSummary,
    isFinalTurn,
    runComparison,
  });

  refreshBoardRecommendation(
    bestCandidates.map((c) => c.index),
    likelyRedGroup.indices,
  );
}

btnAnalyze.addEventListener('click', () => {
  analyzeBoard();
});

document.addEventListener('keydown', (event) => {
  if (isFormEditingTarget(event.target)) return;

  if ((event.ctrlKey || event.metaKey) && !event.altKey && !event.shiftKey && event.key.toLowerCase() === 'z') {
    event.preventDefault();
    btnUndo.click();
    return;
  }

  if (event.ctrlKey || event.metaKey || event.altKey) return;

  if (event.key === 'Enter') {
    event.preventDefault();
    analyzeBoard();
    return;
  }

  if (event.key === ' ' || event.key === 'Spacebar' || event.code === 'Space') {
    event.preventDefault();
    btnReset.click();
  }
});

btnUndo.addEventListener('click', () => {
  if (!observations.length) return;
  const removed = observations.pop();
  observationIndexMap.delete(removed.index);
  observationIndexMap.clear();
  observations.forEach((obs, i) => observationIndexMap.set(obs.index, i));

  rebuildFromObservations();
  renderHoverIndicatorEmpty(hoverIndicatorBody);
  if (observations.length < MAX_TURNS) {
    hasRecordedCurrentRun = false;
  }
});

btnReset.addEventListener('click', () => {
  observations.length = 0;
  observationIndexMap.clear();
  resultsArea.innerHTML = `
    <div class="placeholder-state">
      <div class="placeholder-badge">RED BALL MINE SOLVER</div>
      <p class="placeholder-text">Click cells to set observed colors, then click <strong>Analyze</strong>.</p>
      <p class="placeholder-meta">adaptive expected value engine</p>

      <section class="placeholder-section">
        <h4>Controls</h4>
        <div class="placeholder-rows">
          <div class="placeholder-row"><kbd>Click Cell</kbd><span>Cycle observed color for that board position.</span></div>
          <div class="placeholder-row"><kbd>Enter</kbd><span>Analyze from current observations.</span></div>
          <div class="placeholder-row"><kbd>Ctrl + Z</kbd><span>Undo your most recent observed cell.</span></div>
          <div class="placeholder-row"><kbd>Space</kbd><span>Reset and start a new run.</span></div>
        </div>
      </section>

      <section class="placeholder-section">
        <h4>Modes</h4>
        <div class="placeholder-rows">
          <div class="placeholder-row"><kbd>Score</kbd><span>Max expected points for the next turn.</span></div>
          <div class="placeholder-row"><kbd>Red Hunt</kbd><span>Max chance of hitting red immediately.</span></div>
          <div class="placeholder-row"><kbd>Hybrid</kbd><span>Blend expected score and red-hit chance.</span></div>
        </div>
      </section>

      <section class="placeholder-section">
        <h4>Tips</h4>
        <ul class="placeholder-tips">
          <li>Hover any cell to preview predicted color distribution.</li>
          <li>Use <strong>Hybrid</strong> when you want balanced score and red discovery.</li>
          <li>At 5 guesses, the solver auto-reveals final result and run ranking.</li>
        </ul>
      </section>
    </div>
  `;
  rebuildFromObservations();
  renderHoverIndicatorEmpty(hoverIndicatorBody);
  hasRecordedCurrentRun = false;
});
