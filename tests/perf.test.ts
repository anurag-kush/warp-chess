import { test, expect } from 'vitest';
import { WarpChessGame } from '../src/engine/game';
import { selectBotMove } from '../src/bot/botPlayer';

test('measure bot calculation speed on all difficulties', () => {
  const game = new WarpChessGame();
  game.makeMove('1e2', '1e4');

  const modes = ['easy', 'medium', 'hard'] as const;
  for (const mode of modes) {
    const start = performance.now();
    const move = selectBotMove(game.getState(), mode);
    const duration = performance.now() - start;
    console.log(`[${mode}] move selected in ${duration.toFixed(0)}ms: from ${move?.from} to ${move?.to}`);
    expect(move).not.toBeNull();
    expect(duration).toBeLessThan(1500); // Well under 5 seconds!
  }
});
