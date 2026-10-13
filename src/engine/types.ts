export type Floor = 1 | 2;
export type File = 'a' | 'b' | 'c' | 'd' | 'e' | 'f' | 'g' | 'h';
export type Rank = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

export type SquareCoord = `${Floor}${File}${Rank}`;
export type GateSquare = 'c6' | 'd3' | 'e6' | 'f3';

export const WARP_GATES: readonly GateSquare[] = ['c6', 'd3', 'e6', 'f3'] as const;

export type PieceType = 'p' | 'r' | 'n' | 'b' | 'q' | 'k';
export type PieceColor = 'w' | 'b';

export interface Piece {
  id: string;
  type: PieceType;
  color: PieceColor;
  isJumpPiece: boolean;
  hasMoved: boolean;
}

export type MoveType =
  | 'normal'
  | 'jump'
  | 'warp'
  | 'castle'
  | 'jump_castle'
  | 'en_passant'
  | 'warp_en_passant';

export interface Move {
  from: SquareCoord;
  to: SquareCoord;
  piece: Piece;
  moveType: MoveType;
  // If move activated a Warp Gate, final landing square on the opposite floor
  warpDestination?: SquareCoord;
  // Piece captured on 'to' square (or en passant target)
  capturedPiece?: Piece;
  // If warped and destination square had an enemy piece, it is captured too
  warpCapturedPiece?: Piece;
  // Promotion piece choice
  promotion?: PieceType;
  // If this move is a 2-square pawn move, record the passed-over square for en passant
  enPassantTargetSquare?: SquareCoord;
  isCheck?: boolean;
  isCheckmate?: boolean;
  notation?: string;
}

export interface CastlingRights {
  w: {
    kingside: boolean;
    queenside: boolean;
    jumpRook: boolean; // Jump Rook at 2g1
  };
  b: {
    kingside: boolean;
    queenside: boolean;
    jumpRook: boolean; // Jump Rook at 2b8
  };
}

export type GameStatus =
  | 'active'
  | 'check'
  | 'checkmate'
  | 'stalemate'
  | 'draw_50_moves'
  | 'draw_repetition'
  | 'draw_material'
  | 'resigned';

export interface JumpPieceCounts {
  q: number;
  r: number;
  b: number;
  n: number;
}

export interface BoardState {
  board: Record<SquareCoord, Piece | null>;
  turn: PieceColor;
  castlingRights: CastlingRights;
  enPassantTarget: SquareCoord | null; // Passed square eligible for en passant
  halfmoveClock: number; // For 50-move rule
  fullmoveNumber: number;
  moveHistory: Move[];
  positionHistory: string[]; // Serialization hashes for 3-fold repetition
  activeJumpPieces: {
    w: JumpPieceCounts;
    b: JumpPieceCounts;
  };
  status: GameStatus;
  winner?: PieceColor;
}
