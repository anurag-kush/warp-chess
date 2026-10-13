import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  RotateCcw,
  Undo2,
  Volume2,
  VolumeX,
  HelpCircle,
  MessageSquare,
  Bot,
  Users,
  ArrowLeftRight,
  BookOpen,
} from 'lucide-react';
import { WarpChessGame } from './engine/game';
import { SquareCoord, Move, PieceType, PieceColor, GameStatus } from './engine/types';
import { findKing } from './engine/validator';
import { selectBotMove, BotDifficulty } from './bot/botPlayer';
import { sounds } from './utils/sounds';
import { BoardView } from './components/BoardView';
import { MoveLog } from './components/MoveLog';
import { PromotionModal } from './components/PromotionModal';
import { FeedbackModal } from './components/FeedbackModal';
import { RulesGuideModal } from './components/RulesGuideModal';

export const App: React.FC = () => {
  const gameRef = useRef<WarpChessGame>(new WarpChessGame());
  const [boardState, setBoardState] = useState(gameRef.current.getState());
  const [selectedSquare, setSelectedSquare] = useState<SquareCoord | null>(null);
  const [possibleMoves, setPossibleMoves] = useState<Move[]>([]);
  const [lastMove, setLastMove] = useState<Move | null>(null);
  const [flipped, setFlipped] = useState<boolean>(false);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);

  // Game Settings & Modes
  const [gameMode, setGameMode] = useState<'bot' | 'pass_and_play'>('bot');
  const [botDifficulty, setBotDifficulty] = useState<BotDifficulty>('medium');
  const [playerColor, setPlayerColor] = useState<PieceColor>('w');
  const [isBotThinking, setIsBotThinking] = useState<boolean>(false);

  // Modals
  const [promotionPending, setPromotionPending] = useState<{
    from: SquareCoord;
    to: SquareCoord;
    floor: 1 | 2;
  } | null>(null);
  const [feedbackOpen, setFeedbackOpen] = useState<boolean>(false);
  const [rulesOpen, setRulesOpen] = useState<boolean>(false);

  // Mobile active floor tab (1 or 2)
  const [mobileActiveFloor, setMobileActiveFloor] = useState<1 | 2>(1);

  // Sound toggle
  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    sounds.setEnabled(next);
  };

  // Find King in check square (if any)
  const kingInCheckCoord = React.useMemo(() => {
    if (boardState.status === 'check' || boardState.status === 'checkmate') {
      const kingInfo = findKing(boardState, boardState.turn);
      return kingInfo ? kingInfo.coord : null;
    }
    return null;
  }, [boardState]);

  // Handle sound triggers
  const playMoveAudio = useCallback((move: Move, nextStatus: GameStatus) => {
    if (nextStatus === 'checkmate') {
      sounds.playVictory();
    } else if (nextStatus === 'check') {
      sounds.playCheck();
    } else if (move.moveType === 'warp' || move.moveType === 'warp_en_passant') {
      sounds.playWarp();
    } else if (move.moveType === 'jump') {
      sounds.playJump();
    } else if (move.capturedPiece || move.warpCapturedPiece) {
      sounds.playCapture();
    } else {
      sounds.playMove();
    }
  }, []);

  // Execute a verified move
  const executeMove = useCallback(
    (from: SquareCoord, to: SquareCoord, promotion?: PieceType) => {
      const result = gameRef.current.makeMove(from, to, promotion);
      if (result.success && result.move) {
        const nextState = gameRef.current.getState();
        setBoardState(nextState);
        setLastMove(result.move);
        setSelectedSquare(null);
        setPossibleMoves([]);
        playMoveAudio(result.move, nextState.status);
      }
    },
    [playMoveAudio]
  );

  // Trigger Bot Turn if applicable
  useEffect(() => {
    if (
      gameMode !== 'bot' ||
      boardState.turn === playerColor ||
      boardState.status === 'checkmate' ||
      boardState.status === 'stalemate' ||
      boardState.status === 'resigned'
    ) {
      setIsBotThinking(false);
      return;
    }

    setIsBotThinking(true);
    const timer = setTimeout(() => {
      try {
        const move = selectBotMove(boardState, botDifficulty);
        if (move) {
          executeMove(move.from, move.to, move.promotion);
        }
      } finally {
        setIsBotThinking(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [boardState, gameMode, playerColor, botDifficulty, executeMove]);

  // Handle Square Selection and Clicks
  const handleSquareClick = (coord: SquareCoord) => {
    if (isBotThinking) return;

    // If a piece is already selected, check if clicked square is a move target
    if (selectedSquare) {
      const moveMatch = possibleMoves.find((m) => {
        if (m.moveType === 'warp' || m.moveType === 'warp_en_passant') {
          return m.to === coord || m.warpDestination === coord;
        }
        return m.to === coord;
      });

      if (moveMatch) {
        const destSquare = moveMatch.to;
        // Check if move requires promotion selection
        if (
          moveMatch.piece.type === 'p' &&
          (destSquare.endsWith('8') || destSquare.endsWith('1'))
        ) {
          const targetFloor = parseInt(destSquare[0], 10) as 1 | 2;
          setPromotionPending({ from: selectedSquare, to: destSquare, floor: targetFloor });
          return;
        }

        executeMove(selectedSquare, destSquare);
        return;
      }
    }

    // Otherwise, select piece if it belongs to current player
    const piece = boardState.board[coord];
    if (piece && piece.color === boardState.turn) {
      // In bot mode, prevent clicking bot's pieces
      if (gameMode === 'bot' && piece.color !== playerColor) return;

      setSelectedSquare(coord);
      const moves = gameRef.current.getLegalMovesForSquare(coord);
      setPossibleMoves(moves);
    } else {
      setSelectedSquare(null);
      setPossibleMoves([]);
    }
  };

  const handlePromotionSelect = (promoType: PieceType) => {
    if (!promotionPending) return;
    executeMove(promotionPending.from, promotionPending.to, promoType);
    setPromotionPending(null);
  };

  const handleNewGame = () => {
    gameRef.current.restart();
    setBoardState(gameRef.current.getState());
    setSelectedSquare(null);
    setPossibleMoves([]);
    setLastMove(null);
  };

  const handleUndo = () => {
    if (isBotThinking) return;
    // In bot mode, undo both the bot's move and the player's last move
    if (gameMode === 'bot') {
      gameRef.current.undo();
      gameRef.current.undo();
    } else {
      gameRef.current.undo();
    }
    setBoardState(gameRef.current.getState());
    setSelectedSquare(null);
    setPossibleMoves([]);
    const history = gameRef.current.getState().moveHistory;
    setLastMove(history.length > 0 ? history[history.length - 1] : null);
  };

  // Status banner text
  const getStatusText = () => {
    if (boardState.status === 'checkmate') {
      const winnerName = boardState.winner === 'w' ? 'White' : 'Black';
      return `🏆 Checkmate! ${winnerName} is victorious!`;
    }
    if (boardState.status === 'stalemate') return '🤝 Draw by Stalemate!';
    if (boardState.status === 'draw_50_moves') return '🤝 Draw by 50-Move Rule';
    if (boardState.status === 'draw_repetition') return '🤝 Draw by 3-Fold Repetition';
    if (boardState.status === 'draw_material') return '🤝 Draw by Insufficient Material';
    if (boardState.status === 'check') {
      return `⚠️ Check! ${boardState.turn === 'w' ? 'White' : 'Black'} King is under attack!`;
    }
    return `${boardState.turn === 'w' ? 'White' : 'Black'} to move`;
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30 px-4 py-2.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between flex-wrap gap-2">
          {/* Logo & Title */}
          <div className="flex items-center gap-2.5">
            <span className="text-2xl filter drop-shadow">🌀</span>
            <div>
              <h1 className="text-base sm:text-lg font-black tracking-tight bg-gradient-to-r from-cyan-400 via-purple-300 to-indigo-400 bg-clip-text text-transparent">
                Warp Chess
              </h1>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                Two-Layer Chess (8×8×2)
              </span>
            </div>
          </div>

          {/* Controls Bar */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Mode Switcher */}
            <div className="flex items-center bg-slate-800 rounded-lg p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => {
                  setGameMode('bot');
                  handleNewGame();
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                  gameMode === 'bot'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Bot size={13} />
                <span>Vs Bot</span>
              </button>
              <button
                onClick={() => {
                  setGameMode('pass_and_play');
                  handleNewGame();
                }}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md font-medium transition-colors ${
                  gameMode === 'pass_and_play'
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <Users size={13} />
                <span>Pass & Play</span>
              </button>
            </div>

            {/* Bot Difficulty (if in Bot mode) */}
            {gameMode === 'bot' && (
              <>
                <select
                  value={botDifficulty}
                  onChange={(e) => setBotDifficulty(e.target.value as BotDifficulty)}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-400"
                >
                  <option value="easy">Easy Bot</option>
                  <option value="medium">Medium Bot</option>
                  <option value="hard">Hard Bot</option>
                </select>
                <select
                  value={playerColor}
                  onChange={(e) => {
                    setPlayerColor(e.target.value as PieceColor);
                    handleNewGame();
                  }}
                  className="bg-slate-800 border border-slate-700 text-slate-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-cyan-400"
                >
                  <option value="w">Play White</option>
                  <option value="b">Play Black</option>
                </select>
              </>
            )}

            {/* Flip Board */}
            <button
              onClick={() => setFlipped((f) => !f)}
              title="Flip Board Orientation"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeftRight size={15} />
            </button>

            {/* Undo */}
            <button
              onClick={handleUndo}
              title="Undo Move"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <Undo2 size={15} />
            </button>

            {/* Restart */}
            <button
              onClick={handleNewGame}
              title="New Game"
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <RotateCcw size={15} />
            </button>

            {/* Sound Toggle */}
            <button
              onClick={toggleSound}
              title={soundEnabled ? 'Mute Sound' : 'Enable Sound'}
              className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
            </button>

            {/* Rules Guide Button */}
            <button
              onClick={() => setRulesOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-700/60 text-indigo-200 transition-colors shadow"
            >
              <HelpCircle size={13} />
              <span className="hidden sm:inline">Rules</span>
            </button>

            {/* Official Rulebook Link */}
            <a
              href="https://github.com/anurag-kush/warp-chess/blob/main/RULEBOOK.md"
              target="_blank"
              rel="noopener noreferrer"
              title="Open Official Rulebook on GitHub"
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-colors shadow"
            >
              <BookOpen size={13} />
              <span className="hidden sm:inline">Rulebook</span>
            </a>

            {/* Feedback Button */}
            <button
              onClick={() => setFeedbackOpen(true)}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow transition-all"
            >
              <MessageSquare size={13} />
              <span className="hidden sm:inline">Feedback</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-3 py-4 flex flex-col items-center">
        {/* Concept Notice & Feedback Callout Banner */}
        <div className="w-full max-w-4xl mb-3.5 px-3.5 py-2.5 rounded-lg bg-gradient-to-r from-cyan-950/60 via-slate-900/90 to-purple-950/60 border border-cyan-800/40 shadow-md text-xs text-slate-300 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
          <div className="flex items-start sm:items-center gap-2.5">
            <span className="text-lg flex-shrink-0">♟️🌀</span>
            <p className="leading-snug text-slate-300">
              <strong className="text-cyan-300 font-semibold">Variant Concept Under Active Build:</strong> Warp Chess is a chess variant concept still under construction, and we would greatly appreciate your feedback. Most of the moves have been tested and configured as such, but we encourage you to share any discrepancies you see with us — we will try to fix it or give you a fair explanation!
            </p>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0 self-end sm:self-auto">
            <button
              onClick={() => setFeedbackOpen(true)}
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-cyan-600 hover:bg-cyan-500 text-white transition-colors flex items-center gap-1 shadow-sm"
            >
              <MessageSquare size={12} />
              <span>Feedback</span>
            </button>
            <a
              href="https://github.com/anurag-kush/warp-chess/blob/main/RULEBOOK.md"
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1 text-xs font-semibold rounded-md bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-indigo-200 border border-indigo-700/50 transition-colors flex items-center gap-1 shadow-sm"
            >
              <BookOpen size={12} />
              <span>Rulebook</span>
            </a>
          </div>
        </div>

        {/* Status Alert Banner */}
        <div
          className={`w-full max-w-4xl px-4 py-2 mb-4 rounded-lg flex items-center justify-between border text-xs sm:text-sm font-semibold transition-all ${
            boardState.status === 'checkmate'
              ? 'bg-emerald-950/80 border-emerald-500 text-emerald-200 animate-bounce'
              : boardState.status === 'check'
              ? 'bg-rose-950/80 border-rose-500 text-rose-200 animate-pulse'
              : 'bg-slate-900 border-slate-800 text-slate-200'
          }`}
        >
          <div className="flex items-center gap-2">
            <span
              className={`w-3 h-3 rounded-full border ${
                boardState.turn === 'w'
                  ? 'bg-white border-slate-400'
                  : 'bg-slate-900 border-slate-600 ring-1 ring-slate-400'
              }`}
            />
            <span>{getStatusText()}</span>
          </div>

          {isBotThinking && (
            <div className="flex items-center gap-1.5 text-xs text-cyan-400 animate-pulse font-mono">
              <Bot size={14} />
              <span>Bot is calculating...</span>
            </div>
          )}
        </div>

        {/* Mobile Floor Tabs (visible only on small screens) */}
        <div className="flex lg:hidden w-full max-w-md mb-3 bg-slate-900 rounded-lg p-1 border border-slate-800">
          <button
            onClick={() => setMobileActiveFloor(1)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mobileActiveFloor === 1
                ? 'bg-amber-800/80 text-amber-100 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Floor 1: Foundation
          </button>
          <button
            onClick={() => setMobileActiveFloor(2)}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              mobileActiveFloor === 2
                ? 'bg-cyan-800/80 text-cyan-100 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Floor 2: Jump Sanctuary
          </button>
        </div>

        {/* Board & Sidebar Layout */}
        <div className="w-full flex flex-col lg:flex-row items-center lg:items-start justify-center gap-6">
          {/* Dual Board Grid (Desktop: Side-by-Side; Mobile: Tabbed) */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 w-full lg:w-auto">
            {/* Floor 1 */}
            <div className={`w-full sm:w-auto ${mobileActiveFloor === 1 ? 'block' : 'hidden lg:block'}`}>
              <BoardView
                floor={1}
                boardState={boardState}
                selectedSquare={selectedSquare}
                possibleMoves={possibleMoves}
                lastMove={lastMove}
                flipped={flipped}
                kingInCheckCoord={kingInCheckCoord}
                onSquareClick={handleSquareClick}
              />
            </div>

            {/* Floor 2 */}
            <div className={`w-full sm:w-auto ${mobileActiveFloor === 2 ? 'block' : 'hidden lg:block'}`}>
              <BoardView
                floor={2}
                boardState={boardState}
                selectedSquare={selectedSquare}
                possibleMoves={possibleMoves}
                lastMove={lastMove}
                flipped={flipped}
                kingInCheckCoord={kingInCheckCoord}
                onSquareClick={handleSquareClick}
              />
            </div>
          </div>

          {/* Sidebar: Move Log & Key Legend */}
          <div className="w-full max-w-[420px] lg:w-72 flex flex-col gap-3">
            {/* Move History */}
            <div className="h-64 sm:h-72">
              <MoveLog moves={boardState.moveHistory} />
            </div>

            {/* Quick Mechanics Legend */}
            <div className="bg-slate-900 border border-slate-800 rounded-lg p-3 text-xs text-slate-300 shadow">
              <div className="font-semibold text-slate-200 pb-1.5 mb-2 border-b border-slate-800">
                Quick Legend
              </div>
              <ul className="space-y-1.5 text-[11px]">
                <li className="flex items-center gap-2">
                  <span className="text-base">🌀</span>
                  <span><strong>Warp Gates (c6, d3, e6, f3):</strong> Mandatory teleport to other floor upon landing.</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="px-1 py-0.2 text-[9px] font-bold bg-purple-600 rounded text-white">J</span>
                  <span><strong>Jump Units:</strong> Leap between floors at same coordinates (1xy ↔ 2xy).</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-base">🛡️</span>
                  <span><strong>Attacks:</strong> Only hit pieces on the exact same floor!</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </main>

      {/* Promotion Modal */}
      {promotionPending && (
        <PromotionModal
          color={boardState.turn}
          floor={promotionPending.floor}
          activeJumpCounts={boardState.activeJumpPieces[boardState.turn]}
          onSelect={handlePromotionSelect}
          onCancel={() => setPromotionPending(null)}
        />
      )}

      {/* Feedback Modal */}
      <FeedbackModal
        isOpen={feedbackOpen}
        onClose={() => setFeedbackOpen(false)}
        gameMetadata={{
          totalMoves: boardState.moveHistory.length,
          gameStatus: boardState.status,
        }}
      />

      {/* Rules Guide Modal */}
      <RulesGuideModal isOpen={rulesOpen} onClose={() => setRulesOpen(false)} />
    </div>
  );
};

export default App;
