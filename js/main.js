import {
  CELL_COUNT,
  CENTER_INDEX,
  COLOR_SCORE,
  MAX_TURNS,
  REQUIRED_COUNTS,
} from './constants.js';
import {
  coordinateName,
  getDiagonalCells,
  getOrthNeighbors,
  getRowColCells,
} from './geometry.js';
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
const defaultResultsMarkup = resultsArea.innerHTML;
const turnBadge = document.getElementById('turnBadge');
const hypothesisBadge = document.getElementById('hypothesisBadge');
const modeBadge = document.getElementById('modeBadge');
const guessesLeftBadge = document.getElementById('guessesLeftBadge');
const hoverIndicatorBody = document.getElementById('hoverIndicatorBody');
const btnSettings = document.getElementById('btnSettings');
const settingsPanel = document.getElementById('settingsPanel');
const modeInputs = document.querySelectorAll('input[name="strategyMode"]');
const uniqueBestToggle = document.getElementById('uniqueBestToggle');

const observations = [];
const observationIndexMap = new Map();
let mode = 'score';
let currentHypotheses = [...allHypotheses];
const RUN_HISTORY_KEY = 'redBallMineRunScoresV1';
const SETTINGS_KEY = 'redBallMineSettingsV1';
let hasRecordedCurrentRun = false;
const guessDots = [];
let uniqueBestOnly = false;
const RED_CANDIDATES = [...Array(CELL_COUNT).keys()].filter((idx) => idx !== CENTER_INDEX);
const redRelationCache = new Map();

function getRedRelations(red) {
  let cached = redRelationCache.get(red);
  if (cached) return cached;
  const orth = new Set(getOrthNeighbors(red));
  const diag = new Set(getDiagonalCells(red));
  const rowCol = new Set(getRowColCells(red));
  const line = new Set([...diag, ...rowCol]);
  cached = { orth, diag, rowCol, line };
  redRelationCache.set(red, cached);
  return cached;
}

function observationCompatibleWithRed(observation, red) {
  const { index, color } = observation;
  if (color === 'unknown') return true;
  if (color === 'red') return index === red && index !== CENTER_INDEX;
  if (index === red) return false;

  const rel = getRedRelations(red);
  if (color === 'orange') return rel.orth.has(index);
  if (color === 'yellow') return rel.diag.has(index);
  if (color === 'green') return rel.rowCol.has(index);
  if (color === 'teal') return rel.line.has(index);
  if (color === 'blue') return !rel.line.has(index);
  return true;
}

function explainRuleBreaks(inputObservations) {
  const violations = new Set();
  const counts = {
    red: 0,
    orange: 0,
    yellow: 0,
    green: 0,
  };

  for (const obs of inputObservations) {
    if (obs.color in counts) {
      counts[obs.color] += 1;
    }
  }

  if (counts.red > REQUIRED_COUNTS.red) {
    violations.add('Rule broken: there must be exactly 1 red cell.');
  }

  if (counts.orange > REQUIRED_COUNTS.orange) {
    violations.add('Rule broken: there can be at most 2 orange cells.');
  }

  if (counts.yellow > REQUIRED_COUNTS.yellow) {
    violations.add('Rule broken: there can be at most 3 yellow cells.');
  }

  if (counts.green > REQUIRED_COUNTS.green) {
    violations.add('Rule broken: there can be at most 4 green cells.');
  }

  for (const obs of inputObservations) {
    if (obs.color === 'red' && obs.index === CENTER_INDEX) {
      violations.add('Rule broken: red cannot be placed on the center cell (C3).');
    }
  }

  for (const obs of inputObservations) {
    if (obs.color === 'unknown' || obs.color === 'red') continue;
    const possible = RED_CANDIDATES.some((red) => observationCompatibleWithRed(obs, red));
    if (possible) continue;

    const coord = coordinateName(obs.index);
    if (obs.color === 'orange') {
      violations.add(`Rule broken at ${coord}: orange must be orthogonally adjacent to red.`);
    }
    if (obs.color === 'yellow') {
      violations.add(`Rule broken at ${coord}: yellow must lie on a red diagonal.`);
    }
    if (obs.color === 'green') {
      violations.add(`Rule broken at ${coord}: green must lie in red's row or column.`);
    }
    if (obs.color === 'teal') {
      violations.add(`Rule broken at ${coord}: teal must lie on a red line (row, column, or diagonal).`);
    }
    if (obs.color === 'blue') {
      violations.add(`Rule broken at ${coord}: blue must be outside all red lines.`);
    }
  }

  const consistentReds = RED_CANDIDATES.filter((red) => (
    inputObservations.every((obs) => observationCompatibleWithRed(obs, red))
  ));

  if (!consistentReds.length) {
    violations.add('Rule conflict: these observations cannot come from one single red position.');
  }

  return [...violations];
}

function normalizeMode(value) {
  return value === 'score' || value === 'red' || value === 'hybrid' ? value : 'score';
}

function loadSettings() {
  try {
    const raw = window.localStorage.getItem(SETTINGS_KEY);
    if (!raw) return { mode: 'score', uniqueBestOnly: true };
    const parsed = JSON.parse(raw);
    return {
      mode: normalizeMode(parsed?.mode),
      uniqueBestOnly: Boolean(parsed?.uniqueBestOnly),
    };
  } catch {
    return { mode: 'score', uniqueBestOnly: true };
  }
}

function saveSettings() {
  try {
    window.localStorage.setItem(SETTINGS_KEY, JSON.stringify({
      mode,
      uniqueBestOnly,
    }));
  } catch {
    // Ignore storage failures (private mode / blocked storage).
  }
}

function setMode(nextMode, persist = true) {
  mode = normalizeMode(nextMode);
  for (const input of modeInputs) {
    input.checked = input.value === mode;
  }
  modeBadge.textContent = `Mode: ${mode === 'red' ? 'red hunt' : mode}`;
  if (persist) saveSettings();
}

function initGuessesLeftBadge() {
  guessesLeftBadge.innerHTML = '';
  for (let i = 0; i < MAX_TURNS; i += 1) {
    const dot = document.createElement('span');
    dot.className = 'guess-dot is-on';
    dot.setAttribute('aria-hidden', 'true');
    guessDots.push(dot);
    guessesLeftBadge.appendChild(dot);
  }
}

function updateGuessesLeftBadge(turnsUsed) {
  const left = Math.max(0, MAX_TURNS - turnsUsed);
  guessDots.forEach((dot, idx) => {
    dot.classList.toggle('is-on', idx < left);
  });
  guessesLeftBadge.setAttribute('aria-label', `${left} guesses left`);
}

function updateStatusBadges(hypothesesCount) {
  updateBadges(turnBadge, hypothesisBadge, observations.length, hypothesesCount);
  updateGuessesLeftBadge(observations.length);
}

renderLegend(legend);
const cells = createBoard(boardGrid, handleCycleCell, handleHoverCell, handleHoverLeave);
setGridLabels(cells);
initGuessesLeftBadge();
updateStatusBadges(allHypotheses.length);
renderHoverIndicatorEmpty(hoverIndicatorBody);

const initialSettings = loadSettings();
setMode(initialSettings.mode, false);
setUniqueBestOnly(initialSettings.uniqueBestOnly, 'settings');

function refreshBoardRecommendation(bestIndices = [], likelyRedIndices = []) {
  clearRecommended(cells);
  for (const idx of bestIndices) {
    markRecommended(cells, idx);
  }
  for (const idx of likelyRedIndices) {
    markLikelyRed(cells, idx);
  }
}

function hasResultsDashboard() {
  return Boolean(resultsArea.querySelector('.results-dashboard'));
}

function setUniqueBestOnly(nextValue, source = '') {
  uniqueBestOnly = Boolean(nextValue);
  if (uniqueBestToggle && source !== 'settings') {
    uniqueBestToggle.checked = uniqueBestOnly;
  }

  const sectionToggle = resultsArea.querySelector('#bestUniqueToggle');
  if (sectionToggle && source !== 'section') {
    sectionToggle.checked = uniqueBestOnly;
  }

  if (hasResultsDashboard()) {
    analyzeBoard();
  }

  saveSettings();
}

function toKeyNum(value) {
  return Number.isFinite(value) ? value.toFixed(6) : 'nan';
}

function candidateEquivalenceKey(candidate) {
  const distKey = ['red', 'orange', 'yellow', 'green', 'teal', 'blue']
    .map((c) => `${c}:${toKeyNum(candidate.distribution?.[c] ?? 0)}`)
    .join('|');
  const branchKey = (candidate.branches ?? [])
    .map((b) => `${b.color}:${toKeyNum(b.probability)}:${b.survivors}:${toKeyNum(b.nextMove?.expectedScore ?? -1)}:${toKeyNum(b.nextMove?.redProbability ?? -1)}`)
    .join('|');
  const seqKey = (candidate.sequence ?? [])
    .map((s) => `${s.turn}:${toKeyNum(s.expectedScore)}:${s.mostLikelyOutcome}:${toKeyNum(s.redProbability)}`)
    .join('|');
  return [
    toKeyNum(candidate.objective),
    toKeyNum(candidate.expectedScore),
    toKeyNum(candidate.redProbability),
    toKeyNum(candidate.expectedRemaining ?? 0),
    toKeyNum(candidate.projectedTotal ?? 0),
    distKey,
    branchKey,
    seqKey,
  ].join('||');
}

function uniqueCandidateViews(candidates) {
  const seen = new Set();
  const out = [];
  for (const c of candidates) {
    const key = candidateEquivalenceKey(c);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(c);
  }
  return out;
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
  updateStatusBadges(currentHypotheses.length);
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
  updateStatusBadges(currentHypotheses.length);

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
    setMode(input.value);
  });
}

if (uniqueBestToggle) {
  uniqueBestToggle.addEventListener('change', () => {
    setUniqueBestOnly(uniqueBestToggle.checked, 'settings');
  });
}

function analyzeBoard() {
  const isFinalTurn = observations.length >= MAX_TURNS;
  recomputeCurrentHypotheses();

  updateStatusBadges(currentHypotheses.length);

  if (currentHypotheses.length === 0) {
    refreshBoardRecommendation([], []);
    const ruleBreaks = explainRuleBreaks(observations);
    renderNoSolutions(resultsArea, 'No hidden board satisfies these observations.', ruleBreaks);
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

  const displayCandidates = uniqueBestOnly ? uniqueCandidateViews(candidateViews) : candidateViews;

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
    bestCandidates: displayCandidates,
    likelyRed,
    insights,
    branches: displayCandidates[0]?.branches ?? [],
    sequence: displayCandidates[0]?.sequence ?? projectedSequence(currentHypotheses, observations, mode),
    scoreSummary,
    isFinalTurn,
    runComparison,
    uniqueBestOnly,
    onToggleUniqueBest: (checked) => setUniqueBestOnly(checked, 'section'),
  });

  refreshBoardRecommendation(
    displayCandidates.map((c) => c.index),
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
  resultsArea.innerHTML = defaultResultsMarkup;
  rebuildFromObservations();
  renderHoverIndicatorEmpty(hoverIndicatorBody);
  hasRecordedCurrentRun = false;
});
