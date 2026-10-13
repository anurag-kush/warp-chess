import { Floor, File, Rank, SquareCoord, WARP_GATES, GateSquare } from './types';

export const FILES: readonly File[] = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;
export const RANKS: readonly Rank[] = [1, 2, 3, 4, 5, 6, 7, 8] as const;
export const FLOORS: readonly Floor[] = [1, 2] as const;

export interface CoordIndex {
  floor: Floor;
  fileIdx: number; // 0 to 7
  rankIdx: number; // 0 to 7 (where 0 corresponds to rank 1, 7 to rank 8)
}

export function parseCoord(coord: SquareCoord): CoordIndex {
  const floor = parseInt(coord[0], 10) as Floor;
  const file = coord[1] as File;
  const rank = parseInt(coord[2], 10) as Rank;

  const fileIdx = FILES.indexOf(file);
  const rankIdx = rank - 1;

  return { floor, fileIdx, rankIdx };
}

export function toCoord(floor: Floor, fileIdx: number, rankIdx: number): SquareCoord {
  if (floor < 1 || floor > 2 || fileIdx < 0 || fileIdx > 7 || rankIdx < 0 || rankIdx > 7) {
    throw new Error(`Coordinates out of bounds: floor ${floor}, file ${fileIdx}, rank ${rankIdx}`);
  }
  const file = FILES[fileIdx];
  const rank = (rankIdx + 1) as Rank;
  return `${floor}${file}${rank}` as SquareCoord;
}

export function isWarpGate(coord: SquareCoord): boolean {
  const square = coord.slice(1) as GateSquare;
  return WARP_GATES.includes(square);
}

export function getOppositeFloorCoord(coord: SquareCoord): SquareCoord {
  const currentFloor = parseInt(coord[0], 10) as Floor;
  const otherFloor: Floor = currentFloor === 1 ? 2 : 1;
  return `${otherFloor}${coord.slice(1)}` as SquareCoord;
}

export function generateAllCoordinates(): SquareCoord[] {
  const list: SquareCoord[] = [];
  for (const floor of FLOORS) {
    for (const file of FILES) {
      for (const rank of RANKS) {
        list.push(`${floor}${file}${rank}` as SquareCoord);
      }
    }
  }
  return list;
}

export const ALL_COORDINATES: readonly SquareCoord[] = generateAllCoordinates();
