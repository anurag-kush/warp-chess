import React from 'react';
import { PieceType, PieceColor, Floor, JumpPieceCounts } from '../engine/types';
import { PieceIcon } from './PieceIcon';
import { createPiece } from '../engine/board';

interface PromotionModalProps {
  color: PieceColor;
  floor: Floor;
  activeJumpCounts: JumpPieceCounts;
  onSelect: (type: PieceType) => void;
  onCancel: () => void;
}

export const PromotionModal: React.FC<PromotionModalProps> = ({
  color,
  floor,
  activeJumpCounts,
  onSelect,
  onCancel,
}) => {
  const isFloor2 = floor === 2;
  const promoOptions: { type: 'q' | 'r' | 'b' | 'n'; name: string }[] = [
    { type: 'q', name: isFloor2 ? 'Jump Queen' : 'Queen' },
    { type: 'r', name: isFloor2 ? 'Jump Rook' : 'Rook' },
    { type: 'b', name: isFloor2 ? 'Jump Bishop' : 'Bishop' },
    { type: 'n', name: isFloor2 ? 'Jump Knight' : 'Knight' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-sm w-full p-5 shadow-2xl">
        <h3 className="text-lg font-bold text-center text-slate-100 mb-1">
          Promote Pawn
        </h3>
        <p className="text-xs text-center text-slate-400 mb-4">
          {isFloor2
            ? 'Promoting on Floor 2: Choose a Jump Unit (max 2 active)'
            : 'Promoting on Floor 1: Choose a Regular Piece'}
        </p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          {promoOptions.map(({ type, name }) => {
            const currentActive = isFloor2 ? activeJumpCounts[type] : 0;
            const isLimitReached = isFloor2 && currentActive >= 2;
            const mockPiece = createPiece(type, color, isFloor2);

            return (
              <button
                key={type}
                disabled={isLimitReached}
                onClick={() => onSelect(type)}
                className={`flex flex-col items-center justify-center p-3 rounded-lg border transition-all ${
                  isLimitReached
                    ? 'opacity-40 bg-slate-950 border-slate-800 cursor-not-allowed'
                    : 'bg-slate-800 hover:bg-slate-700 border-slate-600 hover:border-cyan-400 active:scale-95'
                }`}
              >
                <div className="w-12 h-12 mb-2">
                  <PieceIcon piece={mockPiece} className="w-full h-full" />
                </div>
                <span className="text-xs font-semibold text-slate-200">{name}</span>
                {isFloor2 && (
                  <span
                    className={`text-[10px] mt-0.5 ${
                      isLimitReached ? 'text-rose-400 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {isLimitReached ? 'Limit reached (2/2)' : `Active: ${currentActive}/2`}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          onClick={onCancel}
          className="w-full py-2 text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 hover:bg-slate-800 rounded-lg transition-colors"
        >
          Cancel Move
        </button>
      </div>
    </div>
  );
};
