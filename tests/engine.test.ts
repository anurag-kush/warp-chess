import { describe, it, expect } from 'vitest';
import { WarpChessGame } from '../src/engine/game';
import { createInitialBoardState, createEmptyBoard, createPiece } from '../src/engine/board';
import { parseCoord, toCoord, isWarpGate, ALL_COORDINATES } from '../src/engine/coords';
import { getLegalMoves, isKingInCheck, isSquareAttacked } from '../src/engine/validator';
import { BoardState } from '../src/engine/types';

describe('Two-Layer Chess - Rules Engine (PRD Section 46)', () => {
  describe('Board and Coordinates (PRD Section 3 & 4)', () => {
    it('should have exactly 128 playable cells across 2 floors', () => {
      expect(ALL_COORDINATES.length).toBe(128);
    });

    it('should parse and serialize string coordinates correctly', () => {
      const parsed = parseCoord('2c6');
      expect(parsed.floor).toBe(2);
      expect(parsed.fileIdx).toBe(2); // 'c' is index 2
      expect(parsed.rankIdx).toBe(5); // rank 6 is index 5
      expect(toCoord(2, 2, 5)).toBe('2c6');
    });

    it('should correctly identify the four fixed Warp Gates', () => {
      expect(isWarpGate('1c6')).toBe(true);
      expect(isWarpGate('2c6')).toBe(true);
      expect(isWarpGate('1d3')).toBe(true);
      expect(isWarpGate('2d3')).toBe(true);
      expect(isWarpGate('1e6')).toBe(true);
      expect(isWarpGate('2e6')).toBe(true);
      expect(isWarpGate('1f3')).toBe(true);
      expect(isWarpGate('2f3')).toBe(true);
      expect(isWarpGate('1e4')).toBe(false);
      expect(isWarpGate('2a1')).toBe(false);
    });
  });

  describe('Initial Setup (PRD Section 6 & 7)', () => {
    it('should place standard 16 pieces for each player on Floor 1', () => {
      const game = new WarpChessGame();
      const state = game.getState();

      // White back rank
      expect(state.board['1e1']?.type).toBe('k');
      expect(state.board['1e1']?.color).toBe('w');
      expect(state.board['1d1']?.type).toBe('q');
      expect(state.board['1a1']?.type).toBe('r');
      expect(state.board['1h1']?.type).toBe('r');

      // Black back rank
      expect(state.board['1e8']?.type).toBe('k');
      expect(state.board['1e8']?.color).toBe('b');

      // Check pawn counts
      let whitePawns = 0;
      let blackPawns = 0;
      for (const coord of ALL_COORDINATES) {
        const p = state.board[coord];
        if (p && p.type === 'p') {
          if (p.color === 'w') whitePawns++;
          if (p.color === 'b') blackPawns++;
        }
      }
      expect(whitePawns).toBe(8);
      expect(blackPawns).toBe(8);
    });

    it('should place exactly 4 Jump pieces for White and Black on Floor 2', () => {
      const game = new WarpChessGame();
      const state = game.getState();

      // White Jump Pieces
      expect(state.board['2a1']).toMatchObject({ type: 'b', color: 'w', isJumpPiece: true });
      expect(state.board['2c1']).toMatchObject({ type: 'n', color: 'w', isJumpPiece: true });
      expect(state.board['2e1']).toMatchObject({ type: 'q', color: 'w', isJumpPiece: true });
      expect(state.board['2g1']).toMatchObject({ type: 'r', color: 'w', isJumpPiece: true });

      // Black Jump Pieces
      expect(state.board['2b8']).toMatchObject({ type: 'r', color: 'b', isJumpPiece: true });
      expect(state.board['2d8']).toMatchObject({ type: 'q', color: 'b', isJumpPiece: true });
      expect(state.board['2f8']).toMatchObject({ type: 'n', color: 'b', isJumpPiece: true });
      expect(state.board['2h8']).toMatchObject({ type: 'b', color: 'b', isJumpPiece: true });

      // No other pieces on Floor 2
      let totalFloor2Pieces = 0;
      for (const coord of ALL_COORDINATES) {
        if (coord.startsWith('2') && state.board[coord]) {
          totalFloor2Pieces++;
        }
      }
      expect(totalFloor2Pieces).toBe(8);
    });
  });

  describe('Warp Gates (PRD Section 9 - 14)', () => {
    it('landing on a Warp Gate triggers mandatory warp to opposite floor', () => {
      const board = createEmptyBoard();
      // White Rook at 1c5, gate is at 1c6
      board['1c5'] = createPiece('r', 'w');
      board['1e1'] = createPiece('k', 'w');
      board['1e8'] = createPiece('k', 'b');

      const state: BoardState = {
        ...createInitialBoardState(),
        board,
        turn: 'w',
      };

      const game = new WarpChessGame(state);
      const res = game.makeMove('1c5', '1c6');

      expect(res.success).toBe(true);
      expect(res.move?.moveType).toBe('warp');
      expect(res.move?.warpDestination).toBe('2c6');

      // Piece must end on 2c6, not on 1c6!
      const finalState = game.getState();
      expect(finalState.board['1c6']).toBeNull();
      expect(finalState.board['2c6']?.type).toBe('r');
      expect(finalState.board['2c6']?.color).toBe('w');
      expect(finalState.turn).toBe('b'); // Turn ended immediately
    });

    it('sliding over a Warp Gate without landing does NOT warp the piece', () => {
      const board = createEmptyBoard();
      // White Rook at 1c1, gate is at 1c6, moves to 1c8
      board['1c1'] = createPiece('r', 'w');
      board['1e1'] = createPiece('k', 'w');
      board['1e8'] = createPiece('k', 'b');

      const state: BoardState = {
        ...createInitialBoardState(),
        board,
        turn: 'w',
      };

      const game = new WarpChessGame(state);
      const res = game.makeMove('1c1', '1c8');

      expect(res.success).toBe(true);
      expect(res.move?.moveType).toBe('normal');

      // Rook must end on 1c8 (Floor 1), NOT on Floor 2!
      const finalState = game.getState();
      expect(finalState.board['1c8']?.type).toBe('r');
      expect(finalState.board['2c8']).toBeNull();
    });

    it('resolves dual captures on gate and opposite-floor destination', () => {
      const board = createEmptyBoard();
      board['1c5'] = createPiece('r', 'w'); // Attacking Rook
      board['1c6'] = createPiece('b', 'b'); // Enemy bishop on gate
      board['2c6'] = createPiece('n', 'b'); // Enemy knight on opposite destination gate
      board['1e1'] = createPiece('k', 'w');
      board['1e8'] = createPiece('k', 'b');

      const state: BoardState = {
        ...createInitialBoardState(),
        board,
        turn: 'w',
      };

      const game = new WarpChessGame(state);
      const res = game.makeMove('1c5', '1c6');

      expect(res.success).toBe(true);
      expect(res.move?.capturedPiece?.type).toBe('b');
      expect(res.move?.warpCapturedPiece?.type).toBe('n');

      const finalState = game.getState();
      expect(finalState.board['1c6']).toBeNull();
      expect(finalState.board['2c6']?.type).toBe('r');
      expect(finalState.board['2c6']?.color).toBe('w');
    });

    it('friendly piece at warp destination blocks warp (move is illegal)', () => {
      const board = createEmptyBoard();
      board['1c5'] = createPiece('r', 'w');
      board['2c6'] = createPiece('n', 'w'); // Friendly knight on destination!
      board['1e1'] = createPiece('k', 'w');
      board['1e8'] = createPiece('k', 'b');

      const state: BoardState = {
        ...createInitialBoardState(),
        board,
        turn: 'w',
      };

      const game = new WarpChessGame(state);
      const res = game.makeMove('1c5', '1c6');

      expect(res.success).toBe(false);
      expect(game.getState().board['1c5']?.type).toBe('r'); // Rook remained unmoved
    });
  });

  describe('Jump Pieces (PRD Section 15 - 23)', () => {
    it('Jump Piece can change floors at same file and rank', () => {
      const board = createEmptyBoard();
      board['2e4'] = createPiece('q', 'w', true); // White Jump Queen at 2e4
      board['1e1'] = createPiece('k', 'w');
      board['1e8'] = createPiece('k', 'b');

      const state: BoardState = {
        ...createInitialBoardState(),
        board,
        turn: 'w',
      };

      const game = new WarpChessGame(state);
      const res = game.makeMove('2e4', '1e4');

      expect(res.success).toBe(true);
      expect(res.move?.moveType).toBe('jump');

      const finalState = game.getState();
      expect(finalState.board['2e4']).toBeNull();
      expect(finalState.board['1e4']?.type).toBe('q');
      expect(finalState.board['1e4']?.isJumpPiece).toBe(true);
    });

    it('Jump ability is disabled when standing on a Warp Gate (PRD Section 18)', () => {
      const board = createEmptyBoard();
      board['2c6'] = createPiece('r', 'w', true); // White Jump Rook at gate 2c6
      board['1e1'] = createPiece('k', 'w');
      board['1e8'] = createPiece('k', 'b');

      const state: BoardState = {
        ...createInitialBoardState(),
        board,
        turn: 'w',
      };

      const game = new WarpChessGame(state);
      // Attempting to jump to 1c6 should be illegal
      const res = game.makeMove('2c6', '1c6');
      expect(res.success).toBe(false);

      // But normal rook moves on Floor 2 are completely legal!
      const normalMove = game.makeMove('2c6', '2c5');
      expect(normalMove.success).toBe(true);
    });

    it('Jump cannot capture pieces directly on opposite floor (PRD Section 21)', () => {
      const board = createEmptyBoard();
      board['2e4'] = createPiece('q', 'w', true);
      board['1e4'] = createPiece('p', 'b'); // Enemy pawn at 1e4
      board['1e1'] = createPiece('k', 'w');
      board['1e8'] = createPiece('k', 'b');

      const state: BoardState = {
        ...createInitialBoardState(),
        board,
        turn: 'w',
      };

      const game = new WarpChessGame(state);
      const res = game.makeMove('2e4', '1e4');
      expect(res.success).toBe(false); // Destination is occupied
    });
  });

  describe('Castling & Jump Rook Castling (PRD Section 34 - 36, 49.2, 49.3)', () => {
    it('executes Jump Rook Castling: King moves 2 squares, Jump Rook lands on passed square', () => {
      const board = createEmptyBoard();
      board['1e1'] = createPiece('k', 'w', false, false);
      board['2g1'] = createPiece('r', 'w', true, false); // White Jump Rook
      board['1e8'] = createPiece('k', 'b', false, false);

      const state: BoardState = {
        ...createInitialBoardState(),
        board,
        turn: 'w',
        castlingRights: {
          w: { kingside: false, queenside: false, jumpRook: true },
          b: { kingside: false, queenside: false, jumpRook: false },
        },
      };

      const game = new WarpChessGame(state);
      const res = game.makeMove('1e1', '1g1');

      expect(res.success).toBe(true);
      expect(res.move?.moveType).toBe('jump_castle');

      const finalState = game.getState();
      expect(finalState.board['1g1']?.type).toBe('k'); // King on 1g1
      expect(finalState.board['1f1']?.type).toBe('r'); // Jump Rook jumped to 1f1
      expect(finalState.board['2g1']).toBeNull(); // Jump Rook left Floor 2
    });
  });

  describe('Pawn Promotions (PRD Section 29 - 31)', () => {
    it('promotes on Floor 2 to Jump Piece respecting max 2 active limit', () => {
      const board = createEmptyBoard();
      board['2e7'] = createPiece('p', 'w'); // Pawn about to promote on Floor 2
      board['1e1'] = createPiece('k', 'w');
      board['1e8'] = createPiece('k', 'b');
      // Already 2 active Jump Queens for White
      board['2a1'] = createPiece('q', 'w', true);
      board['2b1'] = createPiece('q', 'w', true);

      const state: BoardState = {
        ...createInitialBoardState(),
        board,
        turn: 'w',
        activeJumpPieces: {
          w: { q: 2, r: 0, b: 0, n: 0 },
          b: { q: 1, r: 1, b: 1, n: 1 },
        },
      };

      const game = new WarpChessGame(state);
      // Attempting to promote to Jump Queen should fail (limit of 2 reached)
      const resQ = game.makeMove('2e7', '2e8', 'q');
      expect(resQ.success).toBe(false);

      // Promoting to Jump Knight should succeed
      const resN = game.makeMove('2e7', '2e8', 'n');
      expect(resN.success).toBe(true);
      expect(game.getState().board['2e8']?.isJumpPiece).toBe(true);
    });
  });

  describe('Warp En Passant (PRD Section 49.1)', () => {
    it('executes Scenario A: Same-floor en passant through Warp Gate 1d3 to Floor 2', () => {
      const board = createEmptyBoard();
      // White pawn double-moves 1d2 -> 1d4 (passes over gate 1d3)
      board['1d2'] = createPiece('p', 'w');
      board['1c4'] = createPiece('p', 'b'); // Black pawn on 1c4
      board['1e1'] = createPiece('k', 'w');
      board['1e8'] = createPiece('k', 'b');

      const state: BoardState = {
        ...createInitialBoardState(),
        board,
        turn: 'w',
      };

      const game = new WarpChessGame(state);
      // White moves 1d2 -> 1d4
      game.makeMove('1d2', '1d4');

      // Now it's Black's turn: Black captures warp en passant 1c4 -> 1d3 => warps to 2d3!
      const resWep = game.makeMove('1c4', '1d3');
      expect(resWep.success).toBe(true);
      expect(resWep.move?.moveType).toBe('warp_en_passant');
      expect(resWep.move?.warpDestination).toBe('2d3');

      const finalState = game.getState();
      expect(finalState.board['1d4']).toBeNull(); // Attacking pawn captured!
      expect(finalState.board['1d3']).toBeNull(); // Gate square passed through
      expect(finalState.board['2d3']?.type).toBe('p'); // Black pawn ends on 2d3
      expect(finalState.board['2d3']?.color).toBe('b');
    });
  });

  describe('Pawn Warp Gate Movement Restrictions', () => {
    it('restricts pawn from moving forward into a Warp Gate if the warp destination is occupied', () => {
      const board = createEmptyBoard();
      // White pawn at 1e5, Black pawn at 2e6 (Warp Gate destination)
      board['1e5'] = createPiece('p', 'w');
      board['2e6'] = createPiece('p', 'b');
      board['1e1'] = createPiece('k', 'w');
      board['1e8'] = createPiece('k', 'b');

      const state: BoardState = {
        ...createInitialBoardState(),
        board,
        turn: 'w',
      };

      const game = new WarpChessGame(state);
      // Attempting to move 1e5 -> 1e6 should fail because 2e6 is occupied (pawn cannot attack forward)
      const res = game.makeMove('1e5', '1e6');
      expect(res.success).toBe(false);

      // Verify that legal moves for 1e5 does NOT include 1e6
      const legalMoves = game.getLegalMovesForSquare('1e5');
      expect(legalMoves.some((m) => m.to === '1e6')).toBe(false);
    });

    it('allows pawn to move forward into a Warp Gate if the warp destination is empty', () => {
      const board = createEmptyBoard();
      // White pawn at 1e5, Floor 2 2e6 is empty
      board['1e5'] = createPiece('p', 'w');
      board['1e1'] = createPiece('k', 'w');
      board['1e8'] = createPiece('k', 'b');

      const state: BoardState = {
        ...createInitialBoardState(),
        board,
        turn: 'w',
      };

      const game = new WarpChessGame(state);
      const res = game.makeMove('1e5', '1e6');
      expect(res.success).toBe(true);
      expect(res.move?.moveType).toBe('warp');
      expect(res.move?.warpDestination).toBe('2e6');
      expect(game.getState().board['2e6']?.type).toBe('p');
      expect(game.getState().board['2e6']?.color).toBe('w');
    });
  });

  describe('King Warp Gate and Attack Safety (PRD Section 24 & 25)', () => {
    it('prevents King from moving onto an attacked Warp Gate even if destination floor is safe', () => {
      const board = createEmptyBoard();
      // User scenario: White King at 1g4, Black Queen at 1d1 attacking 1f3 along the diagonal
      board['1g4'] = createPiece('k', 'w');
      board['1d1'] = createPiece('q', 'b');
      board['1e8'] = createPiece('k', 'b'); // Black king

      const state: BoardState = {
        ...createInitialBoardState(),
        board,
        turn: 'w',
      };

      const game = new WarpChessGame(state);
      // King at 1g4 is in check from Queen at 1d1
      expect(isKingInCheck(game.getState(), 'w')).toBe(true);

      // Attempting to move King 1g4 -> 1f3 (which is attacked by the Queen) must be ILLEGAL!
      const res = game.makeMove('1g4', '1f3');
      expect(res.success).toBe(false);

      // Verify that 1f3 is not in legal moves for the King
      const legalMoves = game.getLegalMovesForSquare('1g4');
      expect(legalMoves.some((m) => m.to === '1f3')).toBe(false);
    });

    it('prevents any piece from capturing a King through a Warp Gate', () => {
      const board = createEmptyBoard();
      // Black Queen at 1d1, White King at 2f3 (opposite floor gate)
      board['1d1'] = createPiece('q', 'b');
      board['2f3'] = createPiece('k', 'w');
      board['1e8'] = createPiece('k', 'b');

      const state: BoardState = {
        ...createInitialBoardState(),
        board,
        turn: 'b',
      };

      const game = new WarpChessGame(state);
      // Black Queen attempting to move 1d1 -> 1f3 to capture King at 2f3 must be ILLEGAL!
      const res = game.makeMove('1d1', '1f3');
      expect(res.success).toBe(false);
    });
  });

  describe('Autonomous Bot Player (Section 56.4)', () => {
    it('selects valid legal moves from the starting board state', async () => {
      const { selectBotMove } = await import('../src/bot/botPlayer');
      const game = new WarpChessGame();
      const botMove = selectBotMove(game.getState(), 'medium');
      expect(botMove).not.toBeNull();
      expect(botMove?.piece.color).toBe('w');

      const res = game.makeMove(botMove!.from, botMove!.to, botMove!.promotion);
      expect(res.success).toBe(true);
    });
  });
});
