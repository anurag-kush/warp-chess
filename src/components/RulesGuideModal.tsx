import React from 'react';
import { X, BookOpen } from 'lucide-react';

interface RulesGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RulesGuideModal: React.FC<RulesGuideModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="bg-slate-900 border border-slate-700 rounded-xl max-w-2xl w-full max-h-[88vh] flex flex-col p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-100 transition-colors"
        >
          <X size={22} />
        </button>

        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          <h2 className="text-xl font-bold text-slate-100">Two-Layer Chess: Quick Rules Guide</h2>
        </div>

        <div className="overflow-y-auto space-y-4 pr-2 text-sm text-slate-300">
          {/* Concept */}
          <div className="p-3.5 bg-slate-800/80 rounded-lg border border-slate-700/60">
            <h4 className="font-semibold text-cyan-300 mb-1 flex items-center gap-2">
              <span>🏛️</span> Two Playable Floors (8 × 8 × 2)
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              The game is played across two overlapping 8x8 boards: <strong>Floor 1</strong> (Earth Foundation) and <strong>Floor 2</strong> (Jump Ether). Attacks are <strong>strictly same-floor</strong>. Pieces on Floor 1 never directly attack pieces on Floor 2.
            </p>
          </div>

          {/* Warp Gates */}
          <div className="p-3.5 bg-slate-800/80 rounded-lg border border-slate-700/60">
            <h4 className="font-semibold text-cyan-300 mb-1 flex items-center gap-2">
              <span>🌀</span> Fixed Warp Gates (<code className="text-cyan-200">c6, d3, e6, f3</code>)
            </h4>
            <ul className="text-xs space-y-1 list-disc list-inside text-slate-300">
              <li>Regular Pieces (including the King) use Warp Gates to switch floors.</li>
              <li>A Warp Gate activates <strong>only when a piece lands directly on it</strong>. Sliding over it does not activate it.</li>
              <li>Upon landing, the piece <strong>mandatorily teleports</strong> to the opposite floor and ends the turn.</li>
              <li>Captures happen on both the gate square and any enemy on the opposite destination!</li>
              <li>If a friendly piece is on the destination square, the move is blocked/illegal.</li>
            </ul>
          </div>

          {/* Jump Pieces */}
          <div className="p-3.5 bg-slate-800/80 rounded-lg border border-slate-700/60">
            <h4 className="font-semibold text-purple-300 mb-1 flex items-center gap-2">
              <span>🚀</span> Jump Pieces (Queen, Rook, Bishop, Knight with 'J' badge)
            </h4>
            <ul className="text-xs space-y-1 list-disc list-inside text-slate-300">
              <li>Each player starts with 4 Jump Pieces on Floor 2.</li>
              <li>Move normally on their current floor, plus a special <strong>Jump</strong> ability.</li>
              <li>A Jump switches floors at the <strong>exact same file and rank</strong> (e.g., <code className="text-purple-200">1e4 ↔ 2e4</code>).</li>
              <li>Jumping uses your entire turn. Destination square must be empty (Jump is not a direct attack).</li>
              <li><strong>Jump is disabled while standing on a Warp Gate</strong>.</li>
            </ul>
          </div>

          {/* Jump Rook Castling */}
          <div className="p-3.5 bg-slate-800/80 rounded-lg border border-slate-700/60">
            <h4 className="font-semibold text-amber-300 mb-1 flex items-center gap-2">
              <span>🏰</span> Jump Rook Castling
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              If the King (Floor 1) and your starting Jump Rook (Floor 2: White <code className="text-amber-200">2g1</code>, Black <code className="text-amber-200">2b8</code>) haven't moved, you can execute a Jump Castle! The King moves 2 squares on Floor 1, and the Jump Rook leaps down to Floor 1 onto the passed-over square.
            </p>
          </div>

          {/* Floor-dependent Promotion */}
          <div className="p-3.5 bg-slate-800/80 rounded-lg border border-slate-700/60">
            <h4 className="font-semibold text-emerald-300 mb-1 flex items-center gap-2">
              <span>👑</span> Floor-Dependent Promotion
            </h4>
            <ul className="text-xs space-y-1 list-disc list-inside text-slate-300">
              <li><strong>Floor 1 Promotion:</strong> Promotes to Regular Piece (Queen, Rook, Bishop, Knight).</li>
              <li><strong>Floor 2 Promotion:</strong> Promotes to a Jump Piece! Capped at a maximum of <strong>2 active</strong> Jump Pieces of each type per player.</li>
            </ul>
          </div>
        </div>

        <div className="mt-5 pt-3 border-t border-slate-800 text-center">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-slate-800 hover:bg-slate-700 text-white text-xs font-semibold rounded-lg transition-colors"
          >
            Got It, Let's Play!
          </button>
        </div>
      </div>
    </div>
  );
};
