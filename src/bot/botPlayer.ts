import { BoardState, Move, PieceColor } from '../engine/types';
import { getLegalMoves, applyMoveSimulated, isKingInCheck } from '../engine/validator';
import { evaluateBoard } from './evaluate';

export type BotDifficulty = 'easy' | 'medium' | 'hard';

/**
 * Orders moves so high-impact moves (captures, warps, promotions) are searched first
 * to maximize alpha-beta pruning efficiency.
 */
function orderMoves(moves: Move[]): Move[] {
  return [...moves].sort((a, b) => {
    let scoreA = 0;
    let scoreB = 0;

    if (a.capturedPiece) scoreA += 120;
    if (a.warpCapturedPiece) scoreA += 160;
    if (a.moveType === 'warp') scoreA += 50;
    if (a.moveType === 'jump') scoreA += 40;
    if (a.promotion) scoreA += 100;

    if (b.capturedPiece) scoreB += 120;
    if (b.warpCapturedPiece) scoreB += 160;
    if (b.moveType === 'warp') scoreB += 50;
    if (b.moveType === 'jump') scoreB += 40;
    if (b.promotion) scoreB += 100;

    return scoreB - scoreA;
  });
}

function minimax(
  state: BoardState,
  depth: number,
  alpha: number,
  beta: number,
  isMaximizing: boolean,
  botColor: PieceColor,
  deadline: number
): number {
  // Time cutoff check: never exceed deadline
  if (depth === 0 || performance.now() >= deadline) {
    return evaluateBoard(state, botColor);
  }

  const legalMoves = getLegalMoves(state, state.turn);
  if (legalMoves.length === 0) {
    const inCheck = isKingInCheck(state, state.turn);
    if (inCheck) {
      return state.turn === botColor ? -100000 : 100000;
    }
    return 0; // Stalemate
  }

  // Branching control: prune to top candidates to keep response blazing fast
  const orderedMoves = orderMoves(legalMoves).slice(0, 18);

  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of orderedMoves) {
      if (performance.now() >= deadline) break;
      const nextState = applyMoveSimulated(state, move);
      const evaluation = minimax(nextState, depth - 1, alpha, beta, false, botColor, deadline);
      maxEval = Math.max(maxEval, evaluation);
      alpha = Math.max(alpha, evaluation);
      if (beta <= alpha) break; // Prune
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of orderedMoves) {
      if (performance.now() >= deadline) break;
      const nextState = applyMoveSimulated(state, move);
      const evaluation = minimax(nextState, depth - 1, alpha, beta, true, botColor, deadline);
      minEval = Math.min(minEval, evaluation);
      beta = Math.min(beta, evaluation);
      if (beta <= alpha) break; // Prune
    }
    return minEval;
  }
}

export function selectBotMove(
  state: BoardState,
  difficulty: BotDifficulty = 'medium'
): Move | null {
  const legalMoves = getLegalMoves(state, state.turn);
  if (legalMoves.length === 0) return null;

  const botColor = state.turn;
  const ordered = orderMoves(legalMoves);

  if (difficulty === 'easy') {
    // Fast tactical 1-ply: pick best capture or strong move with slight randomness
    if (Math.random() < 0.25) {
      const randIdx = Math.floor(Math.random() * Math.min(8, ordered.length));
      return ordered[randIdx];
    }
    let bestScore = -Infinity;
    let bestMove = ordered[0];
    const topCandidates = ordered.slice(0, 16);
    for (const move of topCandidates) {
      const nextState = applyMoveSimulated(state, move);
      const score = evaluateBoard(nextState, botColor);
      if (score > bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }
    return bestMove;
  }

  // Hard deadline: Maximum 1200ms total calculation time (guarantees < 2s response)
  const maxCalculationTimeMs = difficulty === 'hard' ? 1400 : 900;
  const deadline = performance.now() + maxCalculationTimeMs;
  const searchDepth = difficulty === 'hard' ? 3 : 2;

  let bestMove = ordered[0];
  let bestEval = -Infinity;
  let alpha = -Infinity;
  const beta = Infinity;

  // Search candidate moves
  const candidateMoves = ordered.slice(0, 24);

  for (const move of candidateMoves) {
    if (performance.now() >= deadline) break;

    const nextState = applyMoveSimulated(state, move);
    const score = minimax(nextState, searchDepth - 1, alpha, beta, false, botColor, deadline);

    if (score > bestEval) {
      bestEval = score;
      bestMove = move;
    }
    alpha = Math.max(alpha, score);
  }

  return bestMove;
}
