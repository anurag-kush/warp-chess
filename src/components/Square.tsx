import React from 'react';
import { Piece, SquareCoord, MoveType } from '../engine/types';
import { isWarpGate } from '../engine/coords';
import { PieceIcon } from './PieceIcon';

interface SquareProps {
  coord: SquareCoord;
  piece: Piece | null;
  isSelected: boolean;
  isPossibleMove: boolean;
  possibleMoveType?: MoveType;
  isLastMove: boolean;
  isInCheck: boolean;
  floor: 1 | 2;
  showFileLabel: boolean;
  showRankLabel: boolean;
  onClick: () => void;
}

export const Square: React.FC<SquareProps> = ({
  coord,
  piece,
  isSelected,
  isPossibleMove,
  possibleMoveType,
  isLastMove,
  isInCheck,
  floor,
  showFileLabel,
  showRankLabel,
  onClick,
}) => {
  const fileChar = coord[1];
  const rankNum = parseInt(coord[2], 10);
  const fileIdx = fileChar.charCodeAt(0) - 97;
  const isLightSquare = (fileIdx + rankNum) % 2 !== 0;
  const isGate = isWarpGate(coord);

  // Floor Theming
  // Floor 1: Classic Earth/Oak (#f0d9b5 / #b58863)
  // Floor 2: Celestial Cobalt/Ether (#d2dff0 / #537895)
  const bgClass =
    floor === 1
      ? isLightSquare
        ? 'bg-[#f0d9b5]'
        : 'bg-[#b58863]'
      : isLightSquare
      ? 'bg-[#dce6f2]'
      : 'bg-[#4f709c]';

  const labelColor = isLightSquare
    ? floor === 1
      ? 'text-[#b58863]'
      : 'text-[#4f709c]'
    : floor === 1
    ? 'text-[#f0d9b5]'
    : 'text-[#dce6f2]';

  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={`Square ${coord}`}
      className={`relative w-full aspect-square flex items-center justify-center transition-colors focus:outline-none ${bgClass} ${
        isGate ? 'animate-warp-gate ring-1 ring-cyan-400/80' : ''
      } ${isSelected ? '!bg-amber-300 ring-2 ring-amber-500 z-10' : ''} ${
        isLastMove ? 'after:absolute after:inset-0 after:bg-yellow-400/25' : ''
      } ${isInCheck ? '!bg-rose-500/80 ring-2 ring-red-600 animate-pulse' : ''}`}
    >
      {/* Warp Gate Vortex Icon in background */}
      {isGate && (
        <div className="absolute inset-0 flex items-center justify-center opacity-35 pointer-events-none select-none">
          <span className="text-2xl text-cyan-200 drop-shadow-[0_0_8px_rgba(0,240,255,0.8)]">
            🌀
          </span>
        </div>
      )}

      {/* Piece */}
      {piece && (
        <div className="z-10 w-[82%] h-[82%] flex items-center justify-center">
          <PieceIcon piece={piece} className="w-full h-full" />
        </div>
      )}

      {/* Move Destination Indicators */}
      {isPossibleMove && (
        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
          {piece ? (
            // Capture target ring
            <div className="w-[86%] h-[86%] rounded-full border-4 border-rose-500/80 animate-ping opacity-60" />
          ) : possibleMoveType === 'warp' ? (
            // Warp Move Target
            <div className="w-6 h-6 rounded-full bg-cyan-400/80 shadow-[0_0_12px_#00f0ff] ring-2 ring-cyan-200 animate-pulse" />
          ) : possibleMoveType === 'jump' ? (
            // Jump Move Target
            <div className="w-6 h-6 rounded-full bg-purple-500/80 shadow-[0_0_12px_#a855f7] ring-2 ring-purple-200 animate-pulse" />
          ) : (
            // Normal Empty Move dot
            <div className="w-3.5 h-3.5 rounded-full bg-emerald-600/70" />
          )}
        </div>
      )}

      {/* File Coordinates (bottom rank) */}
      {showFileLabel && (
        <span
          className={`absolute bottom-0.5 right-1 text-[10px] font-bold pointer-events-none select-none ${labelColor}`}
        >
          {fileChar}
        </span>
      )}

      {/* Rank Coordinates (leftmost file) */}
      {showRankLabel && (
        <span
          className={`absolute top-0.5 left-1 text-[10px] font-bold pointer-events-none select-none ${labelColor}`}
        >
          {rankNum}
        </span>
      )}
    </button>
  );
};
