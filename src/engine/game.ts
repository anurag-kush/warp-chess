import {
  BoardState,
  SquareCoord,
  Move,
  PieceType,
} from './types';
import {
  createInitialBoardState,
  cloneBoardState,
  serializeBoardState,
} from './board';
import {
  getLegalMoves,
  applyMoveSimulated,
  evaluateGameStatus,
} from './validator';

export class WarpChessGame {
  private state: BoardState;
  private historyStack: BoardState[] = [];

  constructor(initialState?: BoardState) {
    this.state = initialState ? cloneBoardState(initialState) : createInitialBoardState();
  }

  public getState(): BoardState {
    return this.state;
  }

  public getLegalMovesForSquare(coord: SquareCoord): Move[] {
    const allLegal = getLegalMoves(this.state, this.state.turn);
    return allLegal.filter((m) => m.from === coord);
  }

  public getAllLegalMoves(): Move[] {
    return getLegalMoves(this.state, this.state.turn);
  }

  public makeMove(
    from: SquareCoord,
    to: SquareCoord,
    promotion?: PieceType
  ): { success: boolean; move?: Move; error?: string } {
    if (this.state.status === 'checkmate' || this.state.status === 'stalemate' || this.state.status === 'resigned') {
      return { success: false, error: 'Game is already over' };
    }

    const legalMoves = this.getLegalMovesForSquare(from);
    // Find matching move
    const candidateMoves = legalMoves.filter((m) => m.to === to);

    if (candidateMoves.length === 0) {
      return { success: false, error: `Illegal move from ${from} to ${to}` };
    }

    let selectedMove: Move | undefined;
    if (promotion) {
      selectedMove = candidateMoves.find((m) => m.promotion === promotion);
      if (!selectedMove) {
        return { success: false, error: `Promotion to ${promotion} is not allowed (e.g. limit reached)` };
      }
    } else {
      selectedMove = candidateMoves[0];
    }

    // Save previous state for undo
    this.historyStack.push(cloneBoardState(this.state));

    // Apply move
    const nextState = applyMoveSimulated(this.state, selectedMove);

    // Compute notation
    selectedMove.notation = this.formatMoveNotation(selectedMove);

    // Check check / checkmate status on new state
    const evalResult = evaluateGameStatus(nextState);
    nextState.status = evalResult.status;
    nextState.winner = evalResult.winner;

    if (evalResult.status === 'checkmate') {
      selectedMove.isCheckmate = true;
      selectedMove.notation += '#';
    } else if (evalResult.status === 'check') {
      selectedMove.isCheck = true;
      selectedMove.notation += '+';
    }

    // Append move to history
    nextState.moveHistory.push(selectedMove);
    nextState.positionHistory.push(serializeBoardState(nextState));

    this.state = nextState;
    return { success: true, move: selectedMove };
  }

  public undo(): boolean {
    if (this.historyStack.length === 0) return false;
    const prev = this.historyStack.pop();
    if (prev) {
      this.state = prev;
      return true;
    }
    return false;
  }

  public resign(): void {
    if (this.state.status === 'checkmate' || this.state.status === 'stalemate') return;
    this.state.status = 'resigned';
    this.state.winner = this.state.turn === 'w' ? 'b' : 'w';
  }

  public restart(): void {
    this.state = createInitialBoardState();
    this.historyStack = [];
  }

  private formatMoveNotation(move: Move): string {
    const p = move.piece;
    const pieceChar = p.type === 'p' ? '' : p.type.toUpperCase();
    const jumpPrefix = p.isJumpPiece ? 'J' : '';

    if (move.moveType === 'jump') {
      return `${jumpPrefix}${pieceChar}${move.from}↕${move.to}`;
    }

    if (move.moveType === 'castle') {
      return move.to.includes('g') ? 'O-O' : 'O-O-O';
    }

    if (move.moveType === 'jump_castle') {
      return move.to.includes('g') ? 'JR-O-O' : 'JR-O-O-O';
    }

    if (move.moveType === 'warp') {
      const cap = move.capturedPiece || move.warpCapturedPiece ? 'x' : '→';
      return `${jumpPrefix}${pieceChar}${move.from}${cap}${move.to}🌀${move.warpDestination}`;
    }

    if (move.moveType === 'warp_en_passant') {
      return `${move.from}x${move.to}(w.e.p.)🌀${move.warpDestination}`;
    }

    if (move.moveType === 'en_passant') {
      return `${move.from}x${move.to}(e.p.)`;
    }

    const captureChar = move.capturedPiece ? 'x' : '-';
    let base = `${jumpPrefix}${pieceChar}${move.from}${captureChar}${move.to}`;
    if (move.promotion) {
      base += `=${move.promotion.toUpperCase()}`;
    }
    return base;
  }
}
