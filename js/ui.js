import {
  CELL_COUNT,
  COLOR_LABEL,
  COLORS,
  MAX_TURNS,
  PLAYABLE_COLORS,
  ROW_LABELS,
  STRATEGY_LABEL,
} from './constants.js';
import { coordinateName } from './geometry.js';

function fmtPct(p) {
  return `${(p * 100).toFixed(1)}%`;
}

function fmtNum(n) {
  return Number.isFinite(n) ? n.toFixed(3) : '--';
}

function colorBase(color) {
  const map = {
    blue: '79,110,201',
    teal: '77,167,161',
    green: '108,169,101',
    yellow: '200,182,83',
    orange: '201,127,80',
    red: '201,74,74',
  };
  return map[color] || '255,255,255';
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
    c.classList.remove('likely-red');
  }
}

export function markRecommended(cells, index) {
  if (index < 0) return;
  cells[index].classList.add('recommended');
}

export function markLikelyRed(cells, index) {
  if (index < 0) return;
  cells[index].classList.add('likely-red');
}

export function updateBadges(turnBadgeEl, hypothesesBadgeEl, turnsUsed, hypothesesCount) {
  turnBadgeEl.textContent = `${turnsUsed} / ${MAX_TURNS} turns used`;
  hypothesesBadgeEl.textContent = `Hypotheses: ${hypothesesCount.toLocaleString()}`;
}

function buildDistributionRows(move) {
  return PLAYABLE_COLORS.map((color) => `
    <tr>
      <td>${COLOR_LABEL[color]}</td>
      <td>
        <div class="prob-row">
          <div class="prob-track"><div class="prob-fill fill-${color}" style="width:${(move.distribution[color] * 100).toFixed(1)}%"></div></div>
          <span>${fmtPct(move.distribution[color])}</span>
        </div>
      </td>
    </tr>
  `).join('');
}

function buildHeatmap(likelyRed) {
  const max = Math.max(...likelyRed.all, 0.00001);
  return likelyRed.all.map((p, idx) => {
    const intensity = p / max;
    const alpha = (0.15 + (0.65 * intensity)).toFixed(3);
    return `
      <div class="heat-cell" style="background:rgba(201,74,74,${alpha})">
        <span class="heat-coord">${coordinateName(idx)}</span>
        <span class="heat-prob">${fmtPct(p)}</span>
      </div>
    `;
  }).join('');
}

function buildInsightGrid(insights) {
  return insights.map((info) => `
    <div class="insight-cell insight-${info.likelyColor}" style="background: rgba(${colorBase(info.likelyColor)}, ${(0.08 + (0.52 * info.likelyProb)).toFixed(3)});">
      <span class="insight-coord">${info.coordinate}</span>
      <span class="insight-color">${COLOR_LABEL[info.likelyColor]}</span>
    </div>
  `).join('');
}

function buildBranchRows(branches) {
  if (!branches.length) {
    return '<tr><td colspan="4">No valid branches from this state.</td></tr>';
  }
  return branches.map((b) => `
    <tr class="branch-row branch-${b.color}">
      <td><span class="branch-chip branch-chip-${b.color}">${COLOR_LABEL[b.color]}</span></td>
      <td>
        <div class="prob-row">
          <div class="prob-track"><div class="prob-fill fill-${b.color}" style="width:${(b.probability * 100).toFixed(1)}%"></div></div>
          <span>${fmtPct(b.probability)}</span>
        </div>
      </td>
      <td>${b.survivors.toLocaleString()}</td>
      <td>${b.nextMove ? b.nextMove.coordinate : '--'}</td>
    </tr>
  `).join('');
}

function buildSequenceRows(sequence) {
  if (!sequence.length) {
    return '<div class="sequence-empty">No remaining turns available.</div>';
  }

  return sequence.map((s) => `
    <div class="sequence-step outcome-${s.mostLikelyOutcome}">
      <div class="sequence-top">
        <span class="sequence-turn">Turn ${s.turn}</span>
        <span class="sequence-cell">${s.coordinate}</span>
      </div>
      <div class="sequence-meta">
        <span>EV ${fmtNum(s.expectedScore)}</span>
        <span>Likely ${COLOR_LABEL[s.mostLikelyOutcome]}</span>
        <span>Red ${fmtPct(s.redProbability)}</span>
      </div>
    </div>
  `).join('');
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
    insights,
    branches,
    sequence,
    scoreSummary,
    mode,
    hypothesesCount,
  } = analysis;

  resultsArea.innerHTML = `
    <div class="results-dashboard">
      <div class="card card-hero">
        <h3 class="section-label">Best Next Click</h3>
        <div class="hero-grid">
          <div>
            <div class="big-value">${bestMove.coordinate}</div>
            <p class="subtext">Mode: <strong>${STRATEGY_LABEL[mode]}</strong> · Objective <strong>${fmtNum(bestMove.objective)}</strong></p>
          </div>
          <div class="quick-stats">
            <span><em>Expected</em><strong>${fmtNum(bestMove.expectedScore)}</strong></span>
            <span><em>Red chance</em><strong>${fmtPct(bestMove.redProbability)}</strong></span>
            <span><em>Hypotheses</em><strong>${hypothesesCount.toLocaleString()}</strong></span>
          </div>
        </div>
      </div>

      <div class="card">
        <h3 class="section-label">Color Outcome At ${bestMove.coordinate}</h3>
        <table class="table compact-table">
          <tbody>${buildDistributionRows(bestMove)}</tbody>
        </table>
      </div>

      <div class="card">
        <h3 class="section-label">Most Likely Red Position</h3>
        <div class="heatmap-grid">${buildHeatmap(likelyRed)}</div>
      </div>

      <div class="card">
        <h3 class="section-label">Per-Cell Likelihood Details</h3>
        <div class="insight-grid">${buildInsightGrid(insights)}</div>
      </div>

      <div class="card">
        <h3 class="section-label">Score Outlook</h3>
        <div class="quick-stats">
          <span><em>Accumulated</em><strong>${fmtNum(scoreSummary.accumulated)}</strong></span>
          <span><em>Expected next</em><strong>${fmtNum(scoreSummary.expectedNext)}</strong></span>
          <span><em>Expected remaining</em><strong>${fmtNum(scoreSummary.expectedRemaining)}</strong></span>
          <span><em>Projected total</em><strong>${fmtNum(scoreSummary.projectedTotal)}</strong></span>
        </div>
      </div>

      <div class="card">
        <h3 class="section-label">If This Turn Returns...</h3>
        <table class="table compact-table">
          <thead><tr><th>Color</th><th>Prob</th><th>Boards</th><th>Next</th></tr></thead>
          <tbody>${buildBranchRows(branches)}</tbody>
        </table>
      </div>

      <div class="card card-sequence">
        <h3 class="section-label">Projected Sequence</h3>
        <div class="sequence-track">${buildSequenceRows(sequence)}</div>
        <p class="subtext">${observations.length ? observations.map((o) => `${coordinateName(o.index)}=${COLOR_LABEL[o.color]}`).join(' · ') : 'No observed cells yet'}</p>
      </div>
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
