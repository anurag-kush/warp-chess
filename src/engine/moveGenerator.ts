import {
  BoardState,
  Piece,
  SquareCoord,
  Move,
  PieceColor,
  PieceType,
  GateSquare,
  WARP_GATES,
} from './types';
import {
  parseCoord,
  toCoord,
  isWarpGate,
  getOppositeFloorCoord,
  ALL_COORDINATES,
} from './coords';

export function getPieceAt(state: BoardState, coord: SquareCoord): Piece | null {
  return state.board[coord] || null;
}

/**
 * Generates all pseudo-legal moves for the player whose turn it is.
 * King safety (leaving king in check) will be validated in validator.ts.
 */
export function generatePseudoLegalMoves(state: BoardState, forColor?: PieceColor): Move[] {
  const color = forColor || state.turn;
  const moves: Move[] = [];

  for (const coord of ALL_COORDINATES) {
    const piece = state.board[coord];
    if (piece && piece.color === color) {
      generatePieceMoves(state, coord, piece, moves);
    }
  }

  // Castling moves (only generated if checking for current turn player)
  if (color === state.turn) {
    generateCastlingMoves(state, color, moves);
  }

  return moves;
}

function generatePieceMoves(
  state: BoardState,
  from: SquareCoord,
  piece: Piece,
  moves: Move[]
): void {
  const { floor, fileIdx, rankIdx } = parseCoord(from);

  switch (piece.type) {
    case 'p':
      generatePawnMoves(state, from, piece, floor, fileIdx, rankIdx, moves);
      break;
    case 'n':
      generateKnightMoves(state, from, piece, floor, fileIdx, rankIdx, moves);
      break;
    case 'b':
      generateSlidingMoves(
        state,
        from,
        piece,
        floor,
        fileIdx,
        rankIdx,
        [
          [1, 1],
          [1, -1],
          [-1, 1],
          [-1, -1],
        ],
        moves
      );
      break;
    case 'r':
      generateSlidingMoves(
        state,
        from,
        piece,
        floor,
        fileIdx,
        rankIdx,
        [
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ],
        moves
      );
      break;
    case 'q':
      generateSlidingMoves(
        state,
        from,
        piece,
        floor,
        fileIdx,
        rankIdx,
        [
          [1, 1],
          [1, -1],
          [-1, 1],
          [-1, -1],
          [1, 0],
          [-1, 0],
          [0, 1],
          [0, -1],
        ],
        moves
      );
      break;
    case 'k':
      generateKingMoves(state, from, piece, floor, fileIdx, rankIdx, moves);
      break;
  }

  // Jump Piece unique ability: Change floor at same file and rank
  if (piece.isJumpPiece) {
    generateJumpMove(state, from, piece, moves);
  }
}

/**
 * Handles Regular Piece (or King) moving to a target cell on the same floor.
 * Checks if target cell is a Warp Gate:
 * If yes -> resolves mandatory Warp to opposite floor.
 * If friendly piece at warp destination -> move is illegal (not added).
 * If no -> regular move.
 */
function addMoveOrWarp(
  state: BoardState,
  from: SquareCoord,
  to: SquareCoord,
  piece: Piece,
  capturedOnTarget: Piece | null,
  moves: Move[],
  enPassantTargetSquare?: SquareCoord,
  promotion?: PieceType
): void {
  const targetIsGate = isWarpGate(to);

  // Jump pieces do NOT activate Warp Gates when landing on them (PRD Section 10 & 18)
  if (!targetIsGate || piece.isJumpPiece) {
    moves.push({
      from,
      to,
      piece,
      moveType: 'normal',
      capturedPiece: capturedOnTarget || undefined,
      enPassantTargetSquare,
      promotion,
    });
    return;
  }

  // A King can NEVER be captured in chess (neither on target square nor through warp)
  if (capturedOnTarget && capturedOnTarget.type === 'k') {
    return;
  }

  // Regular piece landing on Warp Gate -> MANDATORY WARP
  const warpDest = getOppositeFloorCoord(to);
  const destPiece = getPieceAt(state, warpDest);

  // A King can NEVER be captured at the warp destination
  if (destPiece && destPiece.type === 'k') {
    return;
  }

  // PRD Section 13: Move is illegal if friendly piece is on opposite floor destination
  if (destPiece && destPiece.color === piece.color) {
    return;
  }

  // Pawn Movement & Attack Restriction (PRD Section 28 & Rule Clarification):
  // Pawns move straight forward only into empty squares and can only attack diagonally sideways.
  // A pawn cannot capture straight forward, nor can it capture a piece at the warp destination
  // through the vertical warp transition. If warpDest is occupied by ANY piece (enemy or friendly),
  // the pawn is blocked and cannot move forward or warp there.
  if (piece.type === 'p' && destPiece !== null) {
    return;
  }

  // Enemy piece on opposite floor destination is captured as part of the warp (PRD Section 12)
  moves.push({
    from,
    to,
    piece,
    moveType: 'warp',
    warpDestination: warpDest,
    capturedPiece: capturedOnTarget || undefined,
    warpCapturedPiece: destPiece || undefined,
    enPassantTargetSquare,
    promotion,
  });
}

function generatePawnMoves(
  state: BoardState,
  from: SquareCoord,
  piece: Piece,
  floor: 1 | 2,
  fileIdx: number,
  rankIdx: number,
  moves: Move[]
): void {
  const direction = piece.color === 'w' ? 1 : -1;
  const startRankIdx = piece.color === 'w' ? 1 : 6;
  const promoRankIdx = piece.color === 'w' ? 7 : 0;

  const nextRankIdx = rankIdx + direction;

  // 1-step forward move
  if (nextRankIdx >= 0 && nextRankIdx <= 7) {
    const forwardCoord = toCoord(floor, fileIdx, nextRankIdx);
    if (!getPieceAt(state, forwardCoord)) {
      if (nextRankIdx === promoRankIdx) {
        addPawnPromotions(state, from, forwardCoord, piece, null, moves);
      } else {
        addMoveOrWarp(state, from, forwardCoord, piece, null, moves);
      }

      // 2-step forward move from initial rank
      if (rankIdx === startRankIdx) {
        const doubleRankIdx = rankIdx + 2 * direction;
        const doubleCoord = toCoord(floor, fileIdx, doubleRankIdx);
        if (!getPieceAt(state, doubleCoord)) {
          // Passed-over square is eligible for en passant
          addMoveOrWarp(state, from, doubleCoord, piece, null, moves, forwardCoord);
        }
      }
    }
  }

  // Captures (diagonal left & right)
  for (const df of [-1, 1]) {
    const targetFileIdx = fileIdx + df;
    if (targetFileIdx >= 0 && targetFileIdx <= 7 && nextRankIdx >= 0 && nextRankIdx <= 7) {
      const diagCoord = toCoord(floor, targetFileIdx, nextRankIdx);
      const targetPiece = getPieceAt(state, diagCoord);

      // Normal diagonal capture
      if (targetPiece && targetPiece.color !== piece.color) {
        if (nextRankIdx === promoRankIdx) {
          addPawnPromotions(state, from, diagCoord, piece, targetPiece, moves);
        } else {
          addMoveOrWarp(state, from, diagCoord, piece, targetPiece, moves);
        }
      }

      // Standard En Passant (only if target square is NOT a Warp Gate)
      if (state.enPassantTarget === diagCoord && !isWarpGate(diagCoord)) {
        // Find captured pawn on original floor at (targetFileIdx, rankIdx)
        const passedPawnCoord = toCoord(floor, targetFileIdx, rankIdx);
        const capturedPawn = getPieceAt(state, passedPawnCoord);
        if (capturedPawn && capturedPawn.color !== piece.color && capturedPawn.type === 'p') {
          moves.push({
            from,
            to: diagCoord,
            piece,
            moveType: 'en_passant',
            capturedPiece: capturedPawn,
          });
        }
      }
    }
  }

  // Warp En Passant (PRD Section 49.1)
  generateWarpEnPassant(state, from, piece, floor, fileIdx, rankIdx, moves);
}

function generateWarpEnPassant(
  state: BoardState,
  from: SquareCoord,
  piece: Piece,
  floor: 1 | 2,
  fileIdx: number,
  rankIdx: number,
  moves: Move[]
): void {
  if (!state.enPassantTarget) return;

  const targetParsed = parseCoord(state.enPassantTarget);
  const targetSquare = state.enPassantTarget.slice(1) as GateSquare;
  if (!WARP_GATES.includes(targetSquare)) return;

  // The pawn that double-moved landed on targetFloor at (targetFileIdx, targetRankIdx + direction)
  const isTargetFloor1 = targetParsed.floor === 1;
  const isCurrentFloor1 = floor === 1;

  // Scenario A: Same-Floor Warp En Passant (Both on Floor 1, attacker passed over gate)
  if (isTargetFloor1 && isCurrentFloor1) {
    const direction = piece.color === 'w' ? 1 : -1;
    const enemyDoubleRank = targetParsed.rankIdx - direction; // Where the enemy pawn actually sits
    const isAdjacent = Math.abs(fileIdx - targetParsed.fileIdx) === 1;
    const isCorrectRank = rankIdx === enemyDoubleRank;

    if (isAdjacent && isCorrectRank) {
      const enemyPawnCoord = toCoord(1, targetParsed.fileIdx, enemyDoubleRank);
      const enemyPawn = getPieceAt(state, enemyPawnCoord);
      if (enemyPawn && enemyPawn.color !== piece.color && enemyPawn.type === 'p') {
        const warpDest = getOppositeFloorCoord(state.enPassantTarget);
        const destPiece = getPieceAt(state, warpDest);
        if (!destPiece || destPiece.color !== piece.color) {
          moves.push({
            from,
            to: state.enPassantTarget,
            piece,
            moveType: 'warp_en_passant',
            warpDestination: warpDest,
            capturedPiece: enemyPawn,
            warpCapturedPiece: destPiece || undefined,
          });
        }
      }
    }
  }

  // Scenario B: Cross-Floor Warp En Passant (Defender is on Floor 2, attacker double-moved on Floor 1 over gate)
  if (isTargetFloor1 && !isCurrentFloor1) {
    const direction = piece.color === 'w' ? 1 : -1;
    const enemyDoubleRank = targetParsed.rankIdx - direction;
    const isAdjacent = Math.abs(fileIdx - targetParsed.fileIdx) === 1;
    const isCorrectRank = rankIdx === enemyDoubleRank;

    if (isAdjacent && isCorrectRank) {
      const gateOnFloor2 = toCoord(2, targetParsed.fileIdx, targetParsed.rankIdx);
      const enemyPawnCoord = toCoord(1, targetParsed.fileIdx, enemyDoubleRank);
      const enemyPawn = getPieceAt(state, enemyPawnCoord);
      if (enemyPawn && enemyPawn.color !== piece.color && enemyPawn.type === 'p') {
        const warpDest = state.enPassantTarget; // Lands on Floor 1 gate
        const destPiece = getPieceAt(state, warpDest);
        if (!destPiece || destPiece.color !== piece.color) {
          moves.push({
            from,
            to: gateOnFloor2,
            piece,
            moveType: 'warp_en_passant',
            warpDestination: warpDest,
            capturedPiece: enemyPawn,
            warpCapturedPiece: destPiece || undefined,
          });
        }
      }
    }
  }
}

function addPawnPromotions(
  state: BoardState,
  from: SquareCoord,
  to: SquareCoord,
  piece: Piece,
  captured: Piece | null,
  moves: Move[]
): void {
  const { floor } = parseCoord(to);
  const promoTypes: ('q' | 'r' | 'b' | 'n')[] = ['q', 'r', 'b', 'n'];

  for (const pType of promoTypes) {
    // Floor 2 promotions: Jump pieces capped at max 2 active (PRD Section 30, 31)
    if (floor === 2) {
      const activeCounts = state.activeJumpPieces[piece.color];
      if (activeCounts[pType] >= 2) {
        continue; // Cannot promote to this Jump Piece if max 2 already active
      }
    }

    addMoveOrWarp(state, from, to, piece, captured, moves, undefined, pType);
  }
}

function generateKnightMoves(
  state: BoardState,
  from: SquareCoord,
  piece: Piece,
  floor: 1 | 2,
  fileIdx: number,
  rankIdx: number,
  moves: Move[]
): void {
  const knightOffsets = [
    [1, 2],
    [2, 1],
    [2, -1],
    [1, -2],
    [-1, -2],
    [-2, -1],
    [-2, 1],
    [-1, 2],
  ];

  for (const [df, dr] of knightOffsets) {
    const nf = fileIdx + df;
    const nr = rankIdx + dr;
    if (nf >= 0 && nf <= 7 && nr >= 0 && nr <= 7) {
      const targetCoord = toCoord(floor, nf, nr);
      const targetPiece = getPieceAt(state, targetCoord);
      if (!targetPiece || targetPiece.color !== piece.color) {
        addMoveOrWarp(state, from, targetCoord, piece, targetPiece, moves);
      }
    }
  }
}

function generateSlidingMoves(
  state: BoardState,
  from: SquareCoord,
  piece: Piece,
  floor: 1 | 2,
  fileIdx: number,
  rankIdx: number,
  directions: number[][],
  moves: Move[]
): void {
  for (const [df, dr] of directions) {
    let nf = fileIdx + df;
    let nr = rankIdx + dr;

    while (nf >= 0 && nf <= 7 && nr >= 0 && nr <= 7) {
      const targetCoord = toCoord(floor, nf, nr);
      const targetPiece = getPieceAt(state, targetCoord);

      if (!targetPiece) {
        addMoveOrWarp(state, from, targetCoord, piece, null, moves);
      } else {
        if (targetPiece.color !== piece.color) {
          addMoveOrWarp(state, from, targetCoord, piece, targetPiece, moves);
        }
        break; // Blocked by piece
      }

      nf += df;
      nr += dr;
    }
  }
}

function generateKingMoves(
  state: BoardState,
  from: SquareCoord,
  piece: Piece,
  floor: 1 | 2,
  fileIdx: number,
  rankIdx: number,
  moves: Move[]
): void {
  for (let df = -1; df <= 1; df++) {
    for (let dr = -1; dr <= 1; dr++) {
      if (df === 0 && dr === 0) continue;
      const nf = fileIdx + df;
      const nr = rankIdx + dr;
      if (nf >= 0 && nf <= 7 && nr >= 0 && nr <= 7) {
        const targetCoord = toCoord(floor, nf, nr);
        const targetPiece = getPieceAt(state, targetCoord);
        if (!targetPiece || targetPiece.color !== piece.color) {
          addMoveOrWarp(state, from, targetCoord, piece, targetPiece, moves);
        }
      }
    }
  }
}

/**
 * Jump Piece vertical jump to opposite floor at exact same file & rank (PRD Section 16-18, 21).
 * - Only available if NOT on a Warp Gate (PRD Section 18).
 * - Destination square on opposite floor must be unoccupied (PRD Section 21: jump is not an attack).
 */
function generateJumpMove(
  state: BoardState,
  from: SquareCoord,
  piece: Piece,
  moves: Move[]
): void {
  // Jump is disabled when standing on a Warp Gate
  if (isWarpGate(from)) {
    return;
  }

  const oppositeCoord = getOppositeFloorCoord(from);
  const destPiece = getPieceAt(state, oppositeCoord);

  // Jump does not attack: destination must be empty
  if (!destPiece) {
    moves.push({
      from,
      to: oppositeCoord,
      piece,
      moveType: 'jump',
    });
  }
}

/**
 * Castling move generation (Standard Floor 1 castling and Jump Rook castling)
 */
function generateCastlingMoves(state: BoardState, color: PieceColor, moves: Move[]): void {
  const kingCoord: SquareCoord = color === 'w' ? '1e1' : '1e8';
  const king = getPieceAt(state, kingCoord);
  if (!king || king.color !== color || king.hasMoved || king.type !== 'k') {
    return;
  }

  const rank = color === 'w' ? '1' : '8';
  const rights = state.castlingRights[color];

  // 1. Regular Kingside Castling (Floor 1: King e->g, Rook h->f)
  if (rights.kingside) {
    const rookCoord: SquareCoord = `1h${rank}` as SquareCoord;
    const rook = getPieceAt(state, rookCoord);
    if (rook && !rook.hasMoved && rook.type === 'r' && rook.color === color) {
      const fSquare: SquareCoord = `1f${rank}` as SquareCoord;
      const gSquare: SquareCoord = `1g${rank}` as SquareCoord;
      if (!getPieceAt(state, fSquare) && !getPieceAt(state, gSquare)) {
        moves.push({
          from: kingCoord,
          to: gSquare,
          piece: king,
          moveType: 'castle',
        });
      }
    }
  }

  // 2. Regular Queenside Castling (Floor 1: King e->c, Rook a->d)
  if (rights.queenside) {
    const rookCoord: SquareCoord = `1a${rank}` as SquareCoord;
    const rook = getPieceAt(state, rookCoord);
    if (rook && !rook.hasMoved && rook.type === 'r' && rook.color === color) {
      const bSquare: SquareCoord = `1b${rank}` as SquareCoord;
      const cSquare: SquareCoord = `1c${rank}` as SquareCoord;
      const dSquare: SquareCoord = `1d${rank}` as SquareCoord;
      if (!getPieceAt(state, bSquare) && !getPieceAt(state, cSquare) && !getPieceAt(state, dSquare)) {
        moves.push({
          from: kingCoord,
          to: cSquare,
          piece: king,
          moveType: 'castle',
        });
      }
    }
  }

  // 3. Jump Rook Castling (PRD Section 49.3 & 35)
  if (rights.jumpRook) {
    if (color === 'w') {
      // White Jump Rook at 2g1. King moves 1e1 -> 1g1, Jump Rook jumps 2g1 -> 1f1
      const jrCoord: SquareCoord = '2g1';
      const jr = getPieceAt(state, jrCoord);
      if (jr && !jr.hasMoved && jr.isJumpPiece && jr.type === 'r' && jr.color === 'w') {
        const fSquare: SquareCoord = '1f1';
        const gSquare: SquareCoord = '1g1';
        if (!getPieceAt(state, fSquare) && !getPieceAt(state, gSquare)) {
          moves.push({
            from: kingCoord,
            to: gSquare,
            piece: king,
            moveType: 'jump_castle',
          });
        }
      }
    } else {
      // Black Jump Rook at 2b8. King moves 1e8 -> 1c8, Jump Rook jumps 2b8 -> 1d8
      const jrCoord: SquareCoord = '2b8';
      const jr = getPieceAt(state, jrCoord);
      if (jr && !jr.hasMoved && jr.isJumpPiece && jr.type === 'r' && jr.color === 'b') {
        const bSquare: SquareCoord = '1b8';
        const cSquare: SquareCoord = '1c8';
        const dSquare: SquareCoord = '1d8';
        if (!getPieceAt(state, bSquare) && !getPieceAt(state, cSquare) && !getPieceAt(state, dSquare)) {
          moves.push({
            from: kingCoord,
            to: cSquare,
            piece: king,
            moveType: 'jump_castle',
          });
        }
      }
    }
  }
}
