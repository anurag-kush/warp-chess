import React from 'react';
import { BoardState, SquareCoord, Move, Floor } from '../engine/types';
import { FILES, RANKS } from '../engine/coords';
import { Square } from './Square';

interface BoardViewProps {
  floor: Floor;
  boardState: BoardState;
  selectedSquare: SquareCoord | null;
  possibleMoves: Move[];
  lastMove: Move | null;
  flipped: boolean;
  kingInCheckCoord: SquareCoord | null;
  onSquareClick: (coord: SquareCoord) => void;
}

export const BoardView: React.FC<BoardViewProps> = ({
  floor,
  boardState,
  selectedSquare,
  possibleMoves,
  lastMove,
  flipped,
  kingInCheckCoord,
  onSquareClick,
}) => {
  const orderedRanks = flipped ? [...RANKS] : [...RANKS].reverse();
  const orderedFiles = flipped ? [...FILES].reverse() : [...FILES];

  const floorTitle = floor === 1 ? 'Floor 1: Foundation' : 'Floor 2: Jump Sanctuary';
  const floorBadge = floor === 1 ? 'bg-amber-800/60 text-amber-200 border-amber-600/40' : 'bg-cyan-950/80 text-cyan-300 border-cyan-500/40';

  return (
    <div className="flex flex-col items-center w-full max-w-[420px] sm:max-w-[460px]">
      {/* Floor Header */}
      <div className="flex items-center justify-between w-full px-2 py-1.5 mb-2 bg-slate-900/90 rounded-lg border border-slate-800 shadow">
        <div className="flex items-center gap-2">
          <span className={`px-2 py-0.5 text-xs font-semibold rounded border ${floorBadge}`}>
            {floorTitle}
          </span>
        </div>
        <span className="text-xs text-slate-400 font-mono">
          {floor === 1 ? 'Standard + Warp Portals' : 'Jump Units + Airspace'}
        </span>
      </div>

      {/* 8x8 Grid Container */}
      <div className="w-full aspect-square border-4 border-slate-800 rounded-lg overflow-hidden shadow-2xl grid grid-cols-8 grid-rows-8 bg-slate-950">
        {orderedRanks.map((rank, rankIndex) =>
          orderedFiles.map((file, fileIndex) => {
            const coord = `${floor}${file}${rank}` as SquareCoord;
            const piece = boardState.board[coord];
            const isSelected = selectedSquare === coord;

            // Check if this square is a candidate target move
            const moveMatch = possibleMoves.find((m) => {
              if (m.moveType === 'warp' || m.moveType === 'warp_en_passant') {
                return m.to === coord || m.warpDestination === coord;
              }
              return m.to === coord;
            });

            const isPossibleMove = !!moveMatch;
            const possibleMoveType = moveMatch?.moveType;

            const isLastMove =
              lastMove?.from === coord ||
              lastMove?.to === coord ||
              lastMove?.warpDestination === coord;

            const isInCheck = kingInCheckCoord === coord;

            // Only show coordinates on border squares
            const showFileLabel = rankIndex === 7;
            const showRankLabel = fileIndex === 0;

            return (
              <Square
                key={coord}
                coord={coord}
                piece={piece}
                isSelected={isSelected}
                isPossibleMove={isPossibleMove}
                possibleMoveType={possibleMoveType}
                isLastMove={isLastMove}
                isInCheck={isInCheck}
                floor={floor}
                showFileLabel={showFileLabel}
                showRankLabel={showRankLabel}
                onClick={() => onSquareClick(coord)}
              />
            );
          })
        )}
      </div>
    </div>
  );
};
