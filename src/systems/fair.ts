import fair from '../data/fair.json';
import { getGameState } from './gameState';
import { countItem, removeItem, type ItemId } from './inventory';

// La feria del día 7 (HU-58 a HU-60). Datos en src/data/fair.json: el día, los premios del concurso de la
// cosecha y la duración y los premios del concurso de pesca.

export const HARVEST_CONTEST = fair.harvest.title;
export const FISHING_CONTEST = fair.fishing.title;

// HU-58: la feria dura todo el día 7. Antes y después, la plaza tiene su aspecto normal.
export function isFairDay(): boolean {
  return getGameState().day === fair.day;
}

// --- Concurso de la cosecha (HU-59) ---

const HARVEST_PRIZES: Record<string, number> = fair.harvest.prizes;

// Cosechas del inventario que se pueden presentar, en el orden de los premios.
export function presentableCrops(): ItemId[] {
  return (Object.keys(HARVEST_PRIZES) as ItemId[]).filter((item) => countItem(item) > 0);
}

// Entrega la cosecha y cobra el premio. Devuelve el premio.
export function enterHarvestContest(item: ItemId): number {
  const state = getGameState();
  const prize = HARVEST_PRIZES[item];
  removeItem(item, 1);
  state.money += prize;
  state.dayStats.moneyEarned += prize; // HU-39
  state.harvestContestDone = true;
  return prize;
}

// --- Concurso de pesca (HU-60) ---

// Empieza el concurso: dura 90 minutos de juego (1 minuto y 30 segundos reales).
export function startFishingContest(): void {
  const state = getGameState();
  state.fishingContest = { endsAt: state.minutes + fair.fishing.minutes, best: 0 };
  state.fishingContestDone = true;
}

export function isFishingContestRunning(): boolean {
  return getGameState().fishingContest !== null;
}

// Anota un pez pescado durante el concurso: cuenta el más grande.
export function recordContestCatch(size: number): void {
  const contest = getGameState().fishingContest;
  if (contest) {
    contest.best = Math.max(contest.best, size);
  }
}

// Si el concurso ha llegado a su hora de fin, lo termina, cobra el premio y devuelve el mensaje que hay que
// mostrar. Si no ha terminado (o no hay concurso), devuelve null.
export function finishFishingContestIfDue(): string | null {
  const state = getGameState();
  const contest = state.fishingContest;
  if (!contest || state.minutes < contest.endsAt) {
    return null;
  }
  state.fishingContest = null;
  if (contest.best === 0) {
    return 'Concurso terminado: no has pescado nada';
  }
  const prize = fair.fishing.prizes.find(({ minSize }) => contest.best >= minSize)!.money;
  state.money += prize;
  state.dayStats.moneyEarned += prize; // HU-39
  return `Concurso terminado: tu mejor pez mide ${contest.best} cm`;
}
