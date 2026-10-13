import React from 'react';
import { Piece } from '../engine/types';

interface PieceIconProps {
  piece: Piece;
  className?: string;
}

export const PieceIcon: React.FC<PieceIconProps> = ({ piece, className = 'w-10 h-10' }) => {
  const isWhite = piece.color === 'w';

  const fillColor = isWhite ? '#ffffff' : '#1e293b';
  const strokeColor = isWhite ? '#334155' : '#94a3b8';
  const detailColor = isWhite ? '#64748b' : '#cbd5e1';

  const renderSvgContent = () => {
    switch (piece.type) {
      case 'k':
        return (
          <g fill={fillColor} stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            {/* Crown & Cross */}
            <path d="M22.5 11.5v-4M20.5 9.5h4" strokeWidth="1.8" />
            <path d="M22.5 11.5c-4 0-6.5 4.5-8 8.5 2 .5 5 1 8 1s6-.5 8-1c-1.5-4-4-8.5-8-8.5z" />
            <path d="M12 26c1.5-3 3-5 5.5-6 1.5 2 3 3 5 3s3.5-1 5-3c2.5 1 4 3 5.5 6-3 1-7 1.5-10.5 1.5S15 27 12 26z" />
            <path d="M11.5 30c0-1.5.5-3 2-4 2 1 5.5 1.5 9 1.5s7-.5 9-1.5c1.5 1 2 2.5 2 4 0 2-3 4-11 4s-11-2-11-4z" />
            <path d="M11 36h23v2.5H11z" />
            <path d="M9 40h27v2H9z" />
          </g>
        );
      case 'q':
        return (
          <g fill={fillColor} stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="6.5" cy="14" r="1.8" fill={detailColor} />
            <circle cx="14.5" cy="10.5" r="1.8" fill={detailColor} />
            <circle cx="22.5" cy="9" r="1.8" fill={detailColor} />
            <circle cx="30.5" cy="10.5" r="1.8" fill={detailColor} />
            <circle cx="38.5" cy="14" r="1.8" fill={detailColor} />
            <path d="M9 26c8.5-1.5 18.5-1.5 27 0l2.5-11.5-8.5 7.5-7.5-12.5-7.5 12.5-8.5-7.5L9 26z" />
            <path d="M9 26c0 2 1.5 3.5 3 4.5 3.5 1 7 1.5 10.5 1.5s7-.5 10.5-1.5c1.5-1 3-2.5 3-4.5" />
            <path d="M11 34.5h23v2.5H11z" />
            <path d="M9 39h27v2H9z" />
          </g>
        );
      case 'r':
        return (
          <g fill={fillColor} stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 39h27v2H9z" />
            <path d="M12 36v3h21v-3" />
            <path d="M11 17v4.5h23V17" />
            <path d="M9 10v7h4v-3h6v3h7v-3h6v3h4v-7H9z" />
            <path d="M14 21.5l1.5 14.5h14L31 21.5H14z" />
          </g>
        );
      case 'b':
        return (
          <g fill={fillColor} stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="22.5" cy="8.5" r="1.8" fill={detailColor} />
            <path d="M17.5 26c-2 2-3 4-3 6.5h16c0-2.5-1-4.5-3-6.5" />
            <path d="M15 16.5c-1 2.5-1 5.5 0 8 2.5 1.5 5 2 7.5 2s5-.5 7.5-2c1-2.5 1-5.5 0-8-1.5-3.5-5-6-7.5-6s-6 2.5-7.5 6z" />
            <path d="M21 14l3 3M24 14l-3 3" strokeWidth="1.3" />
            <path d="M11.5 36.5h22v2.5h-22z" />
            <path d="M9.5 40h26v2h-26z" />
          </g>
        );
      case 'n':
        return (
          <g fill={fillColor} stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 10c-3 0-5.5 1.5-6.5 4.5-.5 1.5-.5 3-2.5 4.5-1.5 1-3.5 1.5-4 3.5-.5 2 1 3.5 3 4l4 1s.5 2 2 3.5c1.5 1.5 3 2 4 4.5H33c0-4-1-8.5-3.5-12.5C27 14 26 10 22 10z" />
            <circle cx="19.5" cy="15.5" r="1.5" fill={detailColor} />
            <path d="M9.5 39h26v2h-26z" />
          </g>
        );
      case 'p':
        return (
          <g fill={fillColor} stroke={strokeColor} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="22.5" cy="12" r="4.5" />
            <path d="M19.5 17c-2 3-3.5 6-3.5 10 0 3 2 5.5 6.5 5.5s6.5-2.5 6.5-5.5c0-4-1.5-7-3.5-10" />
            <path d="M13.5 36h18v2.5h-18z" />
            <path d="M11.5 39.5h22v2h-22z" />
          </g>
        );
    }
  };

  return (
    <div className={`relative flex items-center justify-center select-none ${className}`}>
      {/* Jump Piece Ambient Halo */}
      {piece.isJumpPiece && (
        <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-sm pointer-events-none animate-pulse" />
      )}

      {/* Chess Piece Vector */}
      <svg
        viewBox="0 0 45 45"
        className={`w-full h-full drop-shadow ${
          piece.isJumpPiece ? 'animate-jump-glow' : ''
        }`}
      >
        {renderSvgContent()}
      </svg>

      {/* Jump Piece Distinct Badge */}
      {piece.isJumpPiece && (
        <span
          title="Jump Piece: Can leap between floors at same coordinate!"
          className="absolute -top-1 -right-1 flex items-center justify-center w-4 h-4 text-[9px] font-extrabold tracking-tighter text-white bg-purple-600 border border-purple-300 rounded-full shadow-md pointer-events-none"
        >
          J
        </span>
      )}
    </div>
  );
};
