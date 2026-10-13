import { BoardState, PieceColor, PieceType } from '../engine/types';
import { ALL_COORDINATES, parseCoord, isWarpGate } from '../engine/coords';
import { isKingInCheck } from '../engine/validator';

const PIECE_VALUES: Record<PieceType, number> = {
  p: 100,
  n: 320,
  b: 330,
  r: 500,
  q: 950,
  k: 20000,
};

const JUMP_PIECE_BONUS = 60; // Tactical vertical agility bonus

export function evaluateBoard(state: BoardState, perspectiveColor: PieceColor): number {
  if (state.status === 'checkmate') {
    return state.winner === perspectiveColor ? 100000 : -100000;
  }
  if (state.status === 'stalemate' || state.status.startsWith('draw')) {
    return 0;
  }

  let whiteScore = 0;
  let blackScore = 0;

  for (const coord of ALL_COORDINATES) {
    const piece = state.board[coord];
    if (!piece) continue;

    let pieceScore = PIECE_VALUES[piece.type];
    if (piece.isJumpPiece) {
      pieceScore += JUMP_PIECE_BONUS;
    }

    const { floor, fileIdx, rankIdx } = parseCoord(coord);

    // Center preference on Floor 1
    if (floor === 1) {
      if ((fileIdx === 3 || fileIdx === 4) && (rankIdx === 3 || rankIdx === 4)) {
        pieceScore += 25;
      }
    }

    // Warp Gate tactical positioning bonus
    if (isWarpGate(coord)) {
      pieceScore += 15;
    }

    // Pawn advancement bonus
    if (piece.type === 'p') {
      const advancement = piece.color === 'w' ? rankIdx : 7 - rankIdx;
      pieceScore += advancement * 10;
    }

    if (piece.color === 'w') {
      whiteScore += pieceScore;
    } else {
      blackScore += pieceScore;
    }
  }

  // Check penalties
  if (isKingInCheck(state, 'w')) whiteScore -= 45;
  if (isKingInCheck(state, 'b')) blackScore -= 45;

  const totalScore = whiteScore - blackScore;
  return perspectiveColor === 'w' ? totalScore : -totalScore;
}
