import {
  BoardState,
  Piece,
  SquareCoord,
  PieceColor,
  PieceType,
  JumpPieceCounts,
} from './types';
import { ALL_COORDINATES } from './coords';

let pieceIdCounter = 1;
export function createPiece(
  type: PieceType,
  color: PieceColor,
  isJumpPiece: boolean = false,
  hasMoved: boolean = false,
  customId?: string
): Piece {
  return {
    id: customId || `p_${pieceIdCounter++}_${color}_${type}${isJumpPiece ? '_j' : ''}`,
    type,
    color,
    isJumpPiece,
    hasMoved,
  };
}

export function createEmptyBoard(): Record<SquareCoord, Piece | null> {
  const board = {} as Record<SquareCoord, Piece | null>;
  for (const coord of ALL_COORDINATES) {
    board[coord] = null;
  }
  return board;
}

export function createInitialBoardState(): BoardState {
  const board = createEmptyBoard();

  // Floor 1: White Standard Pieces
  board['1a1'] = createPiece('r', 'w', false, false, 'w_r1');
  board['1b1'] = createPiece('n', 'w', false, false, 'w_n1');
  board['1c1'] = createPiece('b', 'w', false, false, 'w_b1');
  board['1d1'] = createPiece('q', 'w', false, false, 'w_q');
  board['1e1'] = createPiece('k', 'w', false, false, 'w_k');
  board['1f1'] = createPiece('b', 'w', false, false, 'w_b2');
  board['1g1'] = createPiece('n', 'w', false, false, 'w_n2');
  board['1h1'] = createPiece('r', 'w', false, false, 'w_r2');

  for (const file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const) {
    board[`1${file}2` as SquareCoord] = createPiece('p', 'w', false, false, `w_p_${file}`);
  }

  // Floor 1: Black Standard Pieces
  board['1a8'] = createPiece('r', 'b', false, false, 'b_r1');
  board['1b8'] = createPiece('n', 'b', false, false, 'b_n1');
  board['1c8'] = createPiece('b', 'b', false, false, 'b_b1');
  board['1d8'] = createPiece('q', 'b', false, false, 'b_q');
  board['1e8'] = createPiece('k', 'b', false, false, 'b_k');
  board['1f8'] = createPiece('b', 'b', false, false, 'b_b2');
  board['1g8'] = createPiece('n', 'b', false, false, 'b_n2');
  board['1h8'] = createPiece('r', 'b', false, false, 'b_r2');

  for (const file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const) {
    board[`1${file}7` as SquareCoord] = createPiece('p', 'b', false, false, `b_p_${file}`);
  }

  // Floor 2: White Jump Pieces
  board['2a1'] = createPiece('b', 'w', true, false, 'w_jb');
  board['2c1'] = createPiece('n', 'w', true, false, 'w_jn');
  board['2e1'] = createPiece('q', 'w', true, false, 'w_jq');
  board['2g1'] = createPiece('r', 'w', true, false, 'w_jr');

  // Floor 2: Black Jump Pieces
  board['2b8'] = createPiece('r', 'b', true, false, 'b_jr');
  board['2d8'] = createPiece('q', 'b', true, false, 'b_jq');
  board['2f8'] = createPiece('n', 'b', true, false, 'b_jn');
  board['2h8'] = createPiece('b', 'b', true, false, 'b_jb');

  const initialState: BoardState = {
    board,
    turn: 'w',
    castlingRights: {
      w: { kingside: true, queenside: true, jumpRook: true },
      b: { kingside: true, queenside: true, jumpRook: true },
    },
    enPassantTarget: null,
    halfmoveClock: 0,
    fullmoveNumber: 1,
    moveHistory: [],
    positionHistory: [],
    activeJumpPieces: {
      w: { q: 1, r: 1, b: 1, n: 1 },
      b: { q: 1, r: 1, b: 1, n: 1 },
    },
    status: 'active',
  };

  initialState.positionHistory.push(serializeBoardState(initialState));
  return initialState;
}

export function cloneBoardState(state: BoardState): BoardState {
  const newBoard = {} as Record<SquareCoord, Piece | null>;
  for (const coord of ALL_COORDINATES) {
    const p = state.board[coord];
    newBoard[coord] = p ? { ...p } : null;
  }

  return {
    board: newBoard,
    turn: state.turn,
    castlingRights: {
      w: { ...state.castlingRights.w },
      b: { ...state.castlingRights.b },
    },
    enPassantTarget: state.enPassantTarget,
    halfmoveClock: state.halfmoveClock,
    fullmoveNumber: state.fullmoveNumber,
    moveHistory: [...state.moveHistory],
    positionHistory: [...state.positionHistory],
    activeJumpPieces: {
      w: { ...state.activeJumpPieces.w },
      b: { ...state.activeJumpPieces.b },
    },
    status: state.status,
    winner: state.winner,
  };
}

export function countActiveJumpPieces(
  board: Record<SquareCoord, Piece | null>,
  color: PieceColor
): JumpPieceCounts {
  const counts: JumpPieceCounts = { q: 0, r: 0, b: 0, n: 0 };
  for (const coord of ALL_COORDINATES) {
    const p = board[coord];
    if (p && p.color === color && p.isJumpPiece) {
      if (p.type === 'q') counts.q++;
      else if (p.type === 'r') counts.r++;
      else if (p.type === 'b') counts.b++;
      else if (p.type === 'n') counts.n++;
    }
  }
  return counts;
}

/**
 * Creates a deterministic string hash of the board state for 3-fold repetition detection
 */
export function serializeBoardState(state: BoardState): string {
  const parts: string[] = [];
  for (const coord of ALL_COORDINATES) {
    const p = state.board[coord];
    if (p) {
      parts.push(`${coord}:${p.color}${p.type}${p.isJumpPiece ? 'J' : ''}`);
    }
  }
  const castlingStr = [
    state.castlingRights.w.kingside ? 'K' : '',
    state.castlingRights.w.queenside ? 'Q' : '',
    state.castlingRights.w.jumpRook ? 'WJR' : '',
    state.castlingRights.b.kingside ? 'k' : '',
    state.castlingRights.b.queenside ? 'q' : '',
    state.castlingRights.b.jumpRook ? 'BJR' : '',
  ].join('');

  return `${state.turn}|${castlingStr}|${state.enPassantTarget || '-'}|${parts.sort().join(';')}`;
}
