import { CELL_COUNT, COLOR_LABEL, COLORS, MAX_TURNS, PLAYABLE_COLORS, ROW_LABELS } from './constants.js';
import { coordinateName } from './geometry.js';

function fmtPct(p) {
  return `${(p * 100).toFixed(1)}%`;
}

function fmtNum(n) {
  return Number.isFinite(n) ? n.toFixed(3) : '--';
}

function colorCycleNext(color) {
  const idx = COLORS.indexOf(color);
  const next = (idx + 1) % COLORS.length;
  return COLORS[next];
}

export function createBoard(boardEl, onCycle) {
  boardEl.innerHTML = '';
  const cells = [];

  for (let i = 0; i < CELL_COUNT; i += 1) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'cell-btn state-unknown';
    btn.dataset.index = String(i);
    btn.dataset.color = 'unknown';
    btn.textContent = coordinateName(i);
    btn.setAttribute('role', 'gridcell');
    btn.setAttribute('aria-label', `Cell ${coordinateName(i)} unknown`);

    btn.addEventListener('click', () => {
      const nextColor = colorCycleNext(btn.dataset.color);
      onCycle(i, nextColor);
    });

    cells.push(btn);
    boardEl.appendChild(btn);
  }

  return cells;
}

export function renderLegend(legendEl) {
  const chips = COLORS;
  legendEl.innerHTML = chips
    .map((c) => `<span class="legend-chip state-${c}">${COLOR_LABEL[c]}</span>`)
    .join('');
}

export function setCellState(cells, index, color, recommended = false) {
  const btn = cells[index];
  btn.dataset.color = color;
  btn.className = `cell-btn state-${color}${recommended ? ' recommended' : ''}`;
  btn.textContent = coordinateName(index);
  btn.setAttribute('aria-label', `Cell ${coordinateName(index)} ${COLOR_LABEL[color]}`);
  btn.classList.add('flash');
  window.setTimeout(() => btn.classList.remove('flash'), 210);
}

export function clearRecommended(cells) {
  for (const c of cells) {
    c.classList.remove('recommended');
  }
}

export function markRecommended(cells, index) {
  if (index < 0) return;
  cells[index].classList.add('recommended');
}

export function updateBadges(turnBadgeEl, hypothesesBadgeEl, turnsUsed, hypothesesCount) {
  turnBadgeEl.textContent = `${turnsUsed} / ${MAX_TURNS} turns used`;
  hypothesesBadgeEl.textContent = `Hypotheses: ${hypothesesCount.toLocaleString()}`;
}

function buildDistributionRows(move) {
  return PLAYABLE_COLORS.map((color) => `
    <tr>
      <td>${COLOR_LABEL[color]}</td>
      <td>${fmtPct(move.distribution[color])}</td>
    </tr>
  `).join('');
}

function buildBranchRows(branches) {
  if (!branches.length) {
    return '<tr><td colspan="4">No valid branches from this state.</td></tr>';
  }
  return branches.map((b) => `
    <tr>
      <td>${COLOR_LABEL[b.color]}</td>
      <td>${fmtPct(b.probability)}</td>
      <td>${b.survivors.toLocaleString()}</td>
      <td>${b.nextMove ? b.nextMove.coordinate : '--'}</td>
    </tr>
  `).join('');
}

function buildSequenceRows(sequence) {
  if (!sequence.length) {
    return '<li>No remaining turns available.</li>';
  }

  return sequence.map((s) => (
    `<li><strong>Turn ${s.turn}</strong> click ${s.coordinate} (EV ${fmtNum(s.expectedScore)}), likely result ${COLOR_LABEL[s.mostLikelyOutcome]}, red chance ${fmtPct(s.redProbability)}</li>`
  )).join('');
}

export function renderNoSolutions(resultsArea, msg) {
  resultsArea.innerHTML = `
    <div class="card">
      <h3 class="section-label">Inconsistent Input</h3>
      <p class="warn">${msg}</p>
      <p class="subtext">Adjust one or more observed cells. The current state cannot be produced by the game rules.</p>
    </div>
  `;
}

export function renderResults(resultsArea, analysis) {
  const {
    observations,
    bestMove,
    likelyRed,
    branches,
    sequence,
    hypothesesCount,
  } = analysis;

  resultsArea.innerHTML = `
    <div class="card">
      <h3 class="section-label">Best Next Click</h3>
      <div class="big-value">${bestMove.coordinate}</div>
      <p class="subtext">Expected points: <strong>${fmtNum(bestMove.expectedScore)}</strong> · Red chance on this cell: <strong>${fmtPct(bestMove.redProbability)}</strong></p>
    </div>

    <div class="card">
      <h3 class="section-label">Most Likely Red Position</h3>
      <div class="big-value">${likelyRed.coordinate}</div>
      <p class="subtext">Posterior probability: <strong>${fmtPct(likelyRed.probability)}</strong> based on ${hypothesesCount.toLocaleString()} valid hidden boards.</p>
    </div>

    <div class="card">
      <h3 class="section-label">Color Outcome Probabilities At ${bestMove.coordinate}</h3>
      <table class="table">
        <thead><tr><th>Color</th><th>Probability</th></tr></thead>
        <tbody>${buildDistributionRows(bestMove)}</tbody>
      </table>
    </div>

    <div class="card">
      <h3 class="section-label">If This Turn Returns...</h3>
      <table class="table">
        <thead><tr><th>Observed Color</th><th>Probability</th><th>Surviving Boards</th><th>Next Best Cell</th></tr></thead>
        <tbody>${buildBranchRows(branches)}</tbody>
      </table>
    </div>

    <div class="card">
      <h3 class="section-label">Projected Sequence (Most-Likely Path)</h3>
      <ol class="sequence-list">${buildSequenceRows(sequence)}</ol>
      <p class="subtext">This sequence re-optimizes after each assumed most-likely outcome. Use Analyze again after each real click for the exact live update.</p>
    </div>

    <div class="card">
      <h3 class="section-label">Observed Cells</h3>
      <p class="subtext">${observations.length ? observations.map((o) => `${coordinateName(o.index)}=${COLOR_LABEL[o.color]}`).join(' · ') : 'None yet'}</p>
    </div>
  `;
}

export function setGridLabels(cells) {
  for (let i = 0; i < CELL_COUNT; i += 1) {
    const row = Math.floor(i / 5);
    const col = i % 5;
    cells[i].title = `${ROW_LABELS[row]}${col + 1}`;
  }
}
