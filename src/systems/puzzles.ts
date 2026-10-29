import puzzles from '../data/puzzles.json';
import { getGameState } from './gameState';
import { addItem, canAdd, type ItemId } from './inventory';

// Puzles del mundo (HU-77 a HU-79). Datos en src/data/puzzles.json. Cada uno se resuelve una sola vez y queda
// anotado en `GameState.solvedPuzzles`. Lo que se lleva a medias (losas encendidas, campanas tocadas, cajas
// movidas) no se guarda: vuelve a empezar al salir de la zona.

export type PuzzleId = keyof typeof puzzles;
export const PUZZLES = puzzles;

export function isSolved(puzzle: PuzzleId): boolean {
  return getGameState().solvedPuzzles.includes(puzzle);
}

// Indica si caben en el inventario los objetos de la recompensa (si no, el puzle no se resuelve todavía).
export function canReceivePuzzleReward(puzzle: PuzzleId): boolean {
  return puzzles[puzzle].reward.items.every(({ item, quantity }) => canAdd(item as ItemId, quantity));
}

// Marca el puzle como resuelto y da la recompensa. Las monedas cuentan como ganadas en el día (HU-39).
export function solvePuzzle(puzzle: PuzzleId): void {
  const state = getGameState();
  const { money, items } = puzzles[puzzle].reward;
  state.money += money;
  state.dayStats.moneyEarned += money;
  for (const { item, quantity } of items) addItem(item as ItemId, quantity);
  state.solvedPuzzles.push(puzzle);
}
