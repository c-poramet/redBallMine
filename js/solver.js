import { CELL_COUNT, COLOR_SCORE, MAX_TURNS, PLAYABLE_COLORS } from './constants.js';
import { coordinateName } from './geometry.js';

function matchesObservation(board, observations) {
  return observations.every((obs) => board[obs.index] === obs.color);
}

export function filterHypotheses(allHypotheses, observations) {
  return allHypotheses.filter((h) => matchesObservation(h, observations));
}

export function colorDistribution(hypotheses, index) {
  const dist = {
    red: 0,
    orange: 0,
    yellow: 0,
    green: 0,
    teal: 0,
    blue: 0,
  };
  if (hypotheses.length === 0) return dist;

  for (const h of hypotheses) {
    dist[h[index]] += 1;
  }
  for (const color of PLAYABLE_COLORS) {
    dist[color] /= hypotheses.length;
  }
  return dist;
}

export function expectedValue(hypotheses, index) {
  if (hypotheses.length === 0) return 0;
  let sum = 0;
  for (const h of hypotheses) {
    sum += COLOR_SCORE[h[index]];
  }
  return sum / hypotheses.length;
}

export function redProbabilities(hypotheses) {
  const probs = new Array(CELL_COUNT).fill(0);
  if (hypotheses.length === 0) return probs;

  for (const h of hypotheses) {
    for (let i = 0; i < CELL_COUNT; i += 1) {
      if (h[i] === 'red') probs[i] += 1;
    }
  }

  for (let i = 0; i < CELL_COUNT; i += 1) {
    probs[i] /= hypotheses.length;
  }
  return probs;
}

export function bestNextMove(hypotheses, observations) {
  const observed = new Set(observations.map((o) => o.index));

  let bestIndex = -1;
  let bestEV = -Infinity;
  let bestRedProb = 0;

  for (let i = 0; i < CELL_COUNT; i += 1) {
    if (observed.has(i)) continue;
    const ev = expectedValue(hypotheses, i);
    const redProb = colorDistribution(hypotheses, i).red;
    if (ev > bestEV || (ev === bestEV && redProb > bestRedProb)) {
      bestIndex = i;
      bestEV = ev;
      bestRedProb = redProb;
    }
  }

  if (bestIndex < 0) {
    return null;
  }

  return {
    index: bestIndex,
    coordinate: coordinateName(bestIndex),
    expectedScore: bestEV,
    redProbability: bestRedProb,
    distribution: colorDistribution(hypotheses, bestIndex),
  };
}

export function mostLikelyRedCell(hypotheses) {
  const probs = redProbabilities(hypotheses);
  let idx = 0;
  for (let i = 1; i < probs.length; i += 1) {
    if (probs[i] > probs[idx]) idx = i;
  }
  return {
    index: idx,
    coordinate: coordinateName(idx),
    probability: probs[idx],
    all: probs,
  };
}

export function outcomeBranches(hypotheses, observations, bestMove) {
  const branches = [];
  for (const color of PLAYABLE_COLORS) {
    const nextObs = [...observations, { index: bestMove.index, color }];
    const survivors = filterHypotheses(hypotheses, nextObs);
    if (survivors.length === 0) continue;

    const nextBest = bestNextMove(survivors, nextObs);
    branches.push({
      color,
      probability: bestMove.distribution[color],
      survivors: survivors.length,
      nextMove: nextBest,
    });
  }

  branches.sort((a, b) => b.probability - a.probability);
  return branches;
}

export function projectedSequence(hypotheses, observations) {
  const out = [];
  let currentHypotheses = hypotheses;
  let currentObs = [...observations];
  const remainingTurns = Math.max(0, MAX_TURNS - observations.length);

  for (let step = 0; step < remainingTurns; step += 1) {
    const move = bestNextMove(currentHypotheses, currentObs);
    if (!move) break;

    const dist = move.distribution;
    let mostLikelyColor = 'blue';
    for (const color of PLAYABLE_COLORS) {
      if (dist[color] > dist[mostLikelyColor]) {
        mostLikelyColor = color;
      }
    }

    out.push({
      turn: observations.length + step + 1,
      index: move.index,
      coordinate: move.coordinate,
      expectedScore: move.expectedScore,
      mostLikelyOutcome: mostLikelyColor,
      redProbability: move.redProbability,
    });

    currentObs = [...currentObs, { index: move.index, color: mostLikelyColor }];
    currentHypotheses = filterHypotheses(currentHypotheses, currentObs);
    if (currentHypotheses.length === 0) break;
  }

  return out;
}
