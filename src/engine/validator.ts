import {
  BoardState,
  Piece,
  SquareCoord,
  Move,
  PieceColor,
  GameStatus,
} from './types';
import {
  parseCoord,
  toCoord,
  ALL_COORDINATES,
} from './coords';
import { cloneBoardState, countActiveJumpPieces, createPiece } from './board';
import { generatePseudoLegalMoves, getPieceAt } from './moveGenerator';

export function findKing(state: BoardState, color: PieceColor): { coord: SquareCoord; piece: Piece } | null {
  for (const coord of ALL_COORDINATES) {
    const piece = state.board[coord];
    if (piece && piece.color === color && piece.type === 'k') {
      return { coord, piece };
    }
  }
  return null;
}

/**
 * Checks if a square is attacked by an enemy piece.
 * ATTACK GEOMETRY IS STRICTLY PER-FLOOR (PRD Section 26, 27, 49.7).
 * Only pieces on the exact same floor as `targetSquare` can attack it.
 */
export function isSquareAttacked(
  state: BoardState,
  targetSquare: SquareCoord,
  attackerColor: PieceColor
): boolean {
  const { floor, fileIdx, rankIdx } = parseCoord(targetSquare);

  // 1. Attacked by enemy Pawn on same floor
  const pawnDirection = attackerColor === 'w' ? 1 : -1;
  const pawnRankIdx = rankIdx - pawnDirection; // Where an attacker pawn would stand
  if (pawnRankIdx >= 0 && pawnRankIdx <= 7) {
    for (const df of [-1, 1]) {
      const pf = fileIdx + df;
      if (pf >= 0 && pf <= 7) {
        const pCoord = toCoord(floor, pf, pawnRankIdx);
        const p = getPieceAt(state, pCoord);
        if (p && p.color === attackerColor && p.type === 'p') {
          return true;
        }
      }
    }
  }

  // 2. Attacked by enemy Knight on same floor
  const knightOffsets = [
    [1, 2], [2, 1], [2, -1], [1, -2],
    [-1, -2], [-2, -1], [-2, 1], [-1, 2],
  ];
  for (const [df, dr] of knightOffsets) {
    const kf = fileIdx + df;
    const kr = rankIdx + dr;
    if (kf >= 0 && kf <= 7 && kr >= 0 && kr <= 7) {
      const kCoord = toCoord(floor, kf, kr);
      const p = getPieceAt(state, kCoord);
      if (p && p.color === attackerColor && p.type === 'n') {
        return true;
      }
    }
  }

  // 3. Attacked by enemy Bishop or Queen on diagonals on same floor
  const diagDirs = [[1, 1], [1, -1], [-1, 1], [-1, -1]];
  for (const [df, dr] of diagDirs) {
    let f = fileIdx + df;
    let r = rankIdx + dr;
    while (f >= 0 && f <= 7 && r >= 0 && r <= 7) {
      const c = toCoord(floor, f, r);
      const p = getPieceAt(state, c);
      if (p) {
        if (p.color === attackerColor && (p.type === 'b' || p.type === 'q')) {
          return true;
        }
        break; // Ray blocked
      }
      f += df;
      r += dr;
    }
  }

  // 4. Attacked by enemy Rook or Queen on orthogonal rays on same floor
  const orthoDirs = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  for (const [df, dr] of orthoDirs) {
    let f = fileIdx + df;
    let r = rankIdx + dr;
    while (f >= 0 && f <= 7 && r >= 0 && r <= 7) {
      const c = toCoord(floor, f, r);
      const p = getPieceAt(state, c);
      if (p) {
        if (p.color === attackerColor && (p.type === 'r' || p.type === 'q')) {
          return true;
        }
        break; // Ray blocked
      }
      f += df;
      r += dr;
    }
  }

  // 5. Attacked by enemy King on adjacent square on same floor
  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue;
      const kf = fileIdx + df;
      const kr = rankIdx + dr;
      if (kf >= 0 && kf <= 7 && kr >= 0 && kr <= 7) {
        const kCoord = toCoord(floor, kf, kr);
        const p = getPieceAt(state, kCoord);
        if (p && p.color === attackerColor && p.type === 'k') {
          return true;
        }
      }
    }
  }

  return false;
}

export function isKingInCheck(state: BoardState, color: PieceColor): boolean {
  const kingInfo = findKing(state, color);
  if (!kingInfo) return false;
  const enemyColor: PieceColor = color === 'w' ? 'b' : 'w';
  return isSquareAttacked(state, kingInfo.coord, enemyColor);
}

/**
 * Applies a move directly on a state clone without mutating original state.
 */
export function applyMoveSimulated(state: BoardState, move: Move): BoardState {
  const next = cloneBoardState(state);
  const color = move.piece.color;
  const enemyColor: PieceColor = color === 'w' ? 'b' : 'w';

  // 1. Remove piece from 'from' square
  next.board[move.from] = null;

  // Track if this is a pawn move or capture for 50-move rule
  const isPawnMove = move.piece.type === 'p';
  let isCapture = false;

  // 2. Handle move types
  if (move.moveType === 'normal') {
    if (next.board[move.to]) isCapture = true;
    let pieceToPlace = { ...move.piece, hasMoved: true };
    if (move.promotion) {
      const { floor } = parseCoord(move.to);
      const isJump = floor === 2;
      pieceToPlace = createPiece(move.promotion, color, isJump, true);
    }
    next.board[move.to] = pieceToPlace;
  } else if (move.moveType === 'jump') {
    // Jump: change floor at same file/rank
    next.board[move.to] = { ...move.piece, hasMoved: true };
  } else if (move.moveType === 'warp') {
    // Warp: Land on gate (capture enemy on gate if present), then mandatory warp to destination
    if (next.board[move.to]) isCapture = true;
    next.board[move.to] = null; // Passed through gate

    const warpDest = move.warpDestination!;
    if (next.board[warpDest]) isCapture = true;

    let pieceToPlace = { ...move.piece, hasMoved: true };
    if (move.promotion) {
      const { floor } = parseCoord(warpDest);
      const isJump = floor === 2;
      pieceToPlace = createPiece(move.promotion, color, isJump, true);
    }
    next.board[warpDest] = pieceToPlace;
  } else if (move.moveType === 'castle') {
    // Regular castling on Floor 1
    const rank = color === 'w' ? '1' : '8';
    if (move.to === `1g${rank}`) {
      // Kingside: King to 1g, Rook 1h -> 1f
      next.board[`1g${rank}`] = { ...move.piece, hasMoved: true };
      const rook = next.board[`1h${rank}`];
      next.board[`1h${rank}`] = null;
      if (rook) next.board[`1f${rank}`] = { ...rook, hasMoved: true };
    } else {
      // Queenside: King to 1c, Rook 1a -> 1d
      next.board[`1c${rank}`] = { ...move.piece, hasMoved: true };
      const rook = next.board[`1a${rank}`];
      next.board[`1a${rank}`] = null;
      if (rook) next.board[`1d${rank}`] = { ...rook, hasMoved: true };
    }
  } else if (move.moveType === 'jump_castle') {
    // Jump Rook Castling (Floor 1 King + Floor 2 Jump Rook)
    if (color === 'w') {
      // White: King 1e1 -> 1g1, Jump Rook 2g1 -> 1f1
      next.board['1g1'] = { ...move.piece, hasMoved: true };
      const jr = next.board['2g1'];
      next.board['2g1'] = null;
      if (jr) next.board['1f1'] = { ...jr, hasMoved: true };
    } else {
      // Black: King 1e8 -> 1c8, Jump Rook 2b8 -> 1d8
      next.board['1c8'] = { ...move.piece, hasMoved: true };
      const jr = next.board['2b8'];
      next.board['2b8'] = null;
      if (jr) next.board['1d8'] = { ...jr, hasMoved: true };
    }
  } else if (move.moveType === 'en_passant') {
    isCapture = true;
    next.board[move.to] = { ...move.piece, hasMoved: true };
    if (move.capturedPiece) {
      // Find and remove captured pawn
      for (const coord of ALL_COORDINATES) {
        const p = next.board[coord];
        if (p && p.id === move.capturedPiece.id) {
          next.board[coord] = null;
          break;
        }
      }
    }
  } else if (move.moveType === 'warp_en_passant') {
    isCapture = true;
    // Capturing pawn lands on gate, then warps to warpDestination
    const warpDest = move.warpDestination!;
    if (next.board[warpDest]) isCapture = true;

    next.board[warpDest] = { ...move.piece, hasMoved: true };

    // Remove the en passant captured pawn
    if (move.capturedPiece) {
      for (const coord of ALL_COORDINATES) {
        const p = next.board[coord];
        if (p && p.id === move.capturedPiece.id) {
          next.board[coord] = null;
          break;
        }
      }
    }
  }

  // Update castling rights
  if (move.piece.type === 'k') {
    next.castlingRights[color].kingside = false;
    next.castlingRights[color].queenside = false;
    next.castlingRights[color].jumpRook = false;
  }
  if (move.piece.type === 'r') {
    if (move.from === '1a1') next.castlingRights.w.queenside = false;
    if (move.from === '1h1') next.castlingRights.w.kingside = false;
    if (move.from === '1a8') next.castlingRights.b.queenside = false;
    if (move.from === '1h8') next.castlingRights.b.kingside = false;
    if (move.from === '2g1') next.castlingRights.w.jumpRook = false;
    if (move.from === '2b8') next.castlingRights.b.jumpRook = false;
  }

  // Update active jump pieces count
  next.activeJumpPieces.w = countActiveJumpPieces(next.board, 'w');
  next.activeJumpPieces.b = countActiveJumpPieces(next.board, 'b');

  // En passant target for next turn
  next.enPassantTarget = move.enPassantTargetSquare || null;

  // 50-move clock
  if (isPawnMove || isCapture) {
    next.halfmoveClock = 0;
  } else {
    next.halfmoveClock += 1;
  }

  if (color === 'b') {
    next.fullmoveNumber += 1;
  }

  next.turn = enemyColor;
  return next;
}

export function isLegalMove(state: BoardState, move: Move): boolean {
  const color = move.piece.color;
  const enemyColor: PieceColor = color === 'w' ? 'b' : 'w';

  // 1. A King can never be captured by any move
  if (move.capturedPiece?.type === 'k' || move.warpCapturedPiece?.type === 'k') {
    return false;
  }

  // 2. Castling special path checks: King cannot castle out of check, through check, or into check
  if (move.moveType === 'castle') {
    if (isKingInCheck(state, color)) return false;
    const rank = color === 'w' ? '1' : '8';
    if (move.to === `1g${rank}`) {
      if (isSquareAttacked(state, `1f${rank}`, enemyColor)) return false;
      if (isSquareAttacked(state, `1g${rank}`, enemyColor)) return false;
    } else {
      if (isSquareAttacked(state, `1d${rank}`, enemyColor)) return false;
      if (isSquareAttacked(state, `1c${rank}`, enemyColor)) return false;
    }
  }

  if (move.moveType === 'jump_castle') {
    if (isKingInCheck(state, color)) return false;
    if (color === 'w') {
      if (isSquareAttacked(state, '1f1', enemyColor)) return false;
      if (isSquareAttacked(state, '1g1', enemyColor)) return false;
    } else {
      if (isSquareAttacked(state, '1d8', enemyColor)) return false;
      if (isSquareAttacked(state, '1c8', enemyColor)) return false;
    }
  }

  // 3. King Movement & Warp Gate Safety (PRD Section 24 & 25):
  // A King can NEVER step onto an attacked square.
  if (move.piece.type === 'k') {
    // A. Check if the square the King steps on (move.to) is attacked on that floor
    const stepState = cloneBoardState(state);
    stepState.board[move.from] = null;
    stepState.board[move.to] = { ...move.piece, hasMoved: true };
    if (isSquareAttacked(stepState, move.to, enemyColor)) {
      return false; // King cannot step onto an attacked square or gate!
    }

    // B. If it's a Warp move, King safety must also account for the destination floor (PRD Section 24)
    if (move.moveType === 'warp' && move.warpDestination) {
      const warpState = cloneBoardState(stepState);
      warpState.board[move.to] = null;
      warpState.board[move.warpDestination] = { ...move.piece, hasMoved: true };
      if (isSquareAttacked(warpState, move.warpDestination, enemyColor)) {
        return false; // King cannot warp into check on the destination floor!
      }
    }
  }

  // 4. Simulate full move and verify friendly King safety after resolution
  const simulated = applyMoveSimulated(state, move);
  return !isKingInCheck(simulated, color);
}

export function getLegalMoves(state: BoardState, forColor?: PieceColor): Move[] {
  const pseudoMoves = generatePseudoLegalMoves(state, forColor);
  return pseudoMoves.filter((m) => isLegalMove(state, m));
}

/**
 * Checks if material on board is insufficient to checkmate (PRD Section 49.6)
 */
export function isInsufficientMaterial(state: BoardState): boolean {
  const pieces: Piece[] = [];
  for (const coord of ALL_COORDINATES) {
    const p = state.board[coord];
    if (p) pieces.push(p);
  }

  // King vs King
  if (pieces.length === 2) return true;

  // King + Bishop vs King OR King + Knight vs King
  if (pieces.length === 3) {
    const nonKings = pieces.filter((p) => p.type !== 'k');
    if (nonKings.length === 1 && (nonKings[0].type === 'b' || nonKings[0].type === 'n')) {
      return true;
    }
  }

  return false;
}

export function evaluateGameStatus(state: BoardState): { status: GameStatus; winner?: PieceColor } {
  const currentKing = findKing(state, state.turn);
  const enemyColor: PieceColor = state.turn === 'w' ? 'b' : 'w';
  const enemyKing = findKing(state, enemyColor);

  if (!currentKing) {
    return { status: 'checkmate', winner: enemyColor };
  }
  if (!enemyKing) {
    return { status: 'checkmate', winner: state.turn };
  }

  const legalMoves = getLegalMoves(state, state.turn);
  const inCheck = isKingInCheck(state, state.turn);

  if (legalMoves.length === 0) {
    if (inCheck) {
      const winner: PieceColor = state.turn === 'w' ? 'b' : 'w';
      return { status: 'checkmate', winner };
    } else {
      return { status: 'stalemate' };
    }
  }

  // 50-move rule
  if (state.halfmoveClock >= 100) {
    return { status: 'draw_50_moves' };
  }

  // 3-fold repetition
  const currentHash = state.positionHistory[state.positionHistory.length - 1];
  const count = state.positionHistory.filter((h) => h === currentHash).length;
  if (count >= 3) {
    return { status: 'draw_repetition' };
  }

  // Insufficient material
  if (isInsufficientMaterial(state)) {
    return { status: 'draw_material' };
  }

  if (inCheck) {
    return { status: 'check' };
  }

  return { status: 'active' };
}
