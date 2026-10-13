import React, { useEffect, useRef } from 'react';
import { Move } from '../engine/types';

interface MoveLogProps {
  moves: Move[];
}

export const MoveLog: React.FC<MoveLogProps> = ({ moves }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTop = containerRef.current.scrollHeight;
    }
  }, [moves]);

  // Group moves into turns (white move + black move)
  const turns: { turnNum: number; white?: Move; black?: Move }[] = [];
  for (let i = 0; i < moves.length; i += 2) {
    turns.push({
      turnNum: Math.floor(i / 2) + 1,
      white: moves[i],
      black: moves[i + 1],
    });
  }

  return (
    <div className="flex flex-col h-full bg-slate-900 border border-slate-800 rounded-lg p-3 shadow-inner">
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-xs font-semibold text-slate-300">
        <span>Move History</span>
        <span className="text-[11px] text-slate-400">{moves.length} moves</span>
      </div>

      <div ref={containerRef} className="flex-1 overflow-y-auto space-y-1 font-mono text-xs pr-1">
        {turns.length === 0 ? (
          <div className="text-slate-400 italic text-center py-6">No moves made yet</div>
        ) : (
          turns.map((turn) => (
            <div key={turn.turnNum} className="flex items-center py-0.5 hover:bg-slate-800/60 rounded px-1">
              <span className="w-8 text-slate-400 font-bold">{turn.turnNum}.</span>
              <span className="w-28 text-slate-200">
                {turn.white?.notation || '-'}
              </span>
              <span className="w-28 text-slate-200">
                {turn.black?.notation || ''}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
