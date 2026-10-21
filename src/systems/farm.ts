import crops from '../data/crops.json';
import { getGameState, type GameState, type PlotState } from './gameState';
import type { ItemId } from './inventory';
import type { TilePosition } from './zones';

// Huerto y manzano de la granja (HU-41 a HU-45). Todo cambio en las parcelas pasa por aquí.
// - Cada parcela se guarda por su casilla ("x,y") solo cuando deja de estar sin cavar.
// - Semillas y cultivos en src/data/crops.json: qué da cada semilla, cuántos días de riego necesita
//   y su fotograma en public/assets/sprites/cultivos.png.

export type SeedId = keyof typeof crops;

export const SEEDS = Object.keys(crops) as SeedId[];

// Fotogramas de cultivos.png que no dependen del cultivo.
export const FRAME = { soil: 0, seeds: 1, sprout: 2, growing: 3 } as const;

const UNDUG: PlotState = { dug: false, seed: null, grown: 0, watered: false };

function plotKey({ x, y }: TilePosition): string {
  return `${x},${y}`;
}

export function getPlot(tile: TilePosition): PlotState {
  return getGameState().plots[plotKey(tile)] ?? UNDUG;
}

function setPlot(tile: TilePosition, plot: PlotState): void {
  getGameState().plots[plotKey(tile)] = plot;
}

export function isSeed(item: string): item is SeedId {
  return item in crops;
}

export function cropOf(seed: SeedId): ItemId {
  return crops[seed].crop as ItemId;
}

// HU-44: un cultivo está listo cuando ha crecido todos los días que necesita.
export function isReady(plot: PlotState): boolean {
  return plot.seed !== null && plot.grown >= crops[plot.seed as SeedId].days;
}

// Fotograma de cultivos.png que se dibuja sobre la tierra cavada, o null si la parcela está vacía.
export function cropFrame(plot: PlotState): number | null {
  if (!plot.seed) return null;
  const { days, frame } = crops[plot.seed as SeedId];
  if (plot.grown >= days) return frame;
  if (plot.grown === 0) return FRAME.seeds;
  return plot.grown * 2 < days ? FRAME.sprout : FRAME.growing;
}

// HU-41: la parcela queda cavada.
export function dig(tile: TilePosition): void {
  setPlot(tile, { ...UNDUG, dug: true });
}

// HU-42: la parcela cavada y vacía queda sembrada.
export function sow(tile: TilePosition, seed: SeedId): void {
  setPlot(tile, { dug: true, seed, grown: 0, watered: false });
}

// HU-43: la parcela queda regada hasta el día siguiente.
export function water(tile: TilePosition): void {
  setPlot(tile, { ...getPlot(tile), watered: true });
}

// HU-44: tras cosechar, la parcela queda cavada y vacía.
export function clearPlot(tile: TilePosition): void {
  dig(tile);
}

// HU-43 y HU-44: al empezar un día, cada cultivo regado el día anterior crece un día y todas las parcelas
// quedan sin regar. Un cultivo sin regar no crece, pero tampoco se pierde.
export function growOvernight(state: GameState): void {
  for (const plot of Object.values(state.plots)) {
    if (plot.seed && plot.watered && !isReady(plot)) {
      plot.grown += 1;
    }
    plot.watered = false;
  }
}

// HU-45: el manzano tiene una Manzana al empezar la partida y, después de recogerla, otra a los 2 días.
const APPLE_REGROW_DAYS = 2;

export function hasApple(state = getGameState()): boolean {
  return state.applePickedDay === null || state.day >= state.applePickedDay + APPLE_REGROW_DAYS;
}

export function pickApple(): void {
  const state = getGameState();
  state.applePickedDay = state.day;
}
