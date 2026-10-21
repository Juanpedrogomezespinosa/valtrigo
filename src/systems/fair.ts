import fair from '../data/fair.json';
import { GAME_MINUTES_PER_SECOND } from '../config';
import { getGameState } from './gameState';
import { countItem, ITEMS, removeItem, type ItemId } from './inventory';
import { randomInt } from './random';
import { toMinutes } from './time';

// La feria del día 7 (HU-58 a HU-60 y HU-66). Datos en src/data/fair.json: el día, los horarios, los premios
// por puesto y, de cada concurso, cómo se puntúa y los resultados fijos de los vecinos que compiten.

export const HARVEST_CONTEST = fair.harvest.title;
export const FISHING_CONTEST = fair.fishing.title;
export const CONTESTS_CLOSED_MESSAGE = fair.contestsClosed;
export const FAIR_WAKE_UP_MINUTES = toMinutes(fair.wakeUp);
export const CONTESTS_CLOSE_MINUTES = toMinutes(fair.contestsClose);
export const CEREMONY_MINUTES = toMinutes(fair.ceremony);

// HU-58: la feria es el día 7. Antes y después, la plaza tiene su aspecto normal.
export function isFairDay(day = getGameState().day): boolean {
  return day === fair.day;
}

// Los concursos admiten participantes de 12:00 a 17:00 del día de la feria.
export function areContestsOpen(): boolean {
  const { minutes } = getGameState();
  return isFairDay() && minutes >= toMinutes(fair.contestsOpen) && minutes < CONTESTS_CLOSE_MINUTES;
}

// --- Clasificación (HU-66) ---

// Un participante de un concurso: un vecino (su id en dialogues.json) o el jugador (npc null), con su
// resultado (kilos o centímetros) y la descripción de lo que presentó.
export interface Entry {
  npc: string | null;
  score: number;
  detail: string;
}

// Los tres primeros, de más a menos. En caso de empate queda por delante el vecino: los vecinos van primero
// en la lista y la ordenación conserva el orden de los empatados.
function podium(entries: Entry[]): Entry[] {
  return [...entries].sort((a, b) => b.score - a.score).slice(0, 3);
}

// Premio del jugador según su puesto en el podio (0 si no está entre los tres primeros).
export function prizeFor(ranking: Entry[]): number {
  const place = ranking.findIndex((entry) => entry.npc === null);
  return place === -1 ? 0 : fair.prizes[place];
}

// --- Concurso de la cosecha (HU-59) ---

type Crop = keyof typeof fair.harvest.crops;
const CROPS = fair.harvest.crops;

// "una Calabaza de 11 kg".
export function cropDetail(item: string, weight: number): string {
  return `${CROPS[item as Crop].article} ${ITEMS[item as ItemId].name} de ${weight} kg`;
}

// Cosechas del inventario que se pueden presentar, en el orden de fair.json.
export function presentableCrops(): ItemId[] {
  return (Object.keys(CROPS) as ItemId[]).filter((item) => countItem(item) > 0);
}

// Entrega la cosecha. Su peso sale al azar dentro del rango de su tipo.
export function enterHarvestContest(item: ItemId): number {
  const { minWeight, maxWeight } = CROPS[item as Crop];
  const weight = randomInt(minWeight, maxWeight);
  removeItem(item, 1);
  getGameState().harvestEntry = { item, weight };
  return weight;
}

export function harvestRanking(): Entry[] {
  const entries: Entry[] = fair.harvest.rivals.map(({ npc, item, weight }) => ({ npc, score: weight, detail: cropDetail(item, weight) }));
  const entry = getGameState().harvestEntry;
  if (entry) {
    entries.push({ npc: null, score: entry.weight, detail: cropDetail(entry.item, entry.weight) });
  }
  return podium(entries);
}

// --- Concurso de pesca (HU-60) ---

// Inscripción: el concurso aún no ha empezado (empieza al lanzar la caña en el lago).
export function signUpForFishingContest(): void {
  const state = getGameState();
  state.fishingContest = { endsAt: null, best: 0 };
  state.fishingContestDone = true;
}

// HU-60: al lanzar la caña por primera vez después de inscribirse empieza la cuenta atrás.
export function startFishingContestIfSignedUp(): void {
  const state = getGameState();
  if (state.fishingContest && state.fishingContest.endsAt === null) {
    state.fishingContest.endsAt = state.minutes + fair.fishing.minutes;
  }
}

// Concurso en marcha (empezado y sin terminar): pescar no gasta energía y pican todas las especies.
export function isFishingContestRunning(): boolean {
  return getGameState().fishingContest?.endsAt != null;
}

// Cuenta atrás del concurso en tiempo real: "1:30" al empezar. Null si no está en marcha.
export function contestCountdown(): string | null {
  const state = getGameState();
  const endsAt = state.fishingContest?.endsAt;
  if (endsAt == null) return null;
  const seconds = Math.max(0, Math.ceil((Math.min(endsAt, CONTESTS_CLOSE_MINUTES) - state.minutes) / GAME_MINUTES_PER_SECOND));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

// Anota un pez pescado durante el concurso: cuenta el más grande.
export function recordContestCatch(size: number): void {
  const contest = getGameState().fishingContest;
  if (contest?.endsAt != null) {
    contest.best = Math.max(contest.best, size);
  }
}

// Termina el concurso si ha llegado su hora o las 17:00, y devuelve el mensaje que hay que mostrar.
// Una inscripción que no llegó a empezar se cierra a las 17:00 sin resultado ni mensaje.
export function finishFishingContestIfDue(): string | null {
  const state = getGameState();
  const contest = state.fishingContest;
  if (!contest) return null;
  const closed = state.minutes >= CONTESTS_CLOSE_MINUTES;
  if (contest.endsAt === null) {
    if (closed) state.fishingContest = null;
    return null;
  }
  if (state.minutes < contest.endsAt && !closed) return null;
  state.fishingContest = null;
  state.fishingResult = contest.best;
  return contest.best === 0
    ? 'Concurso terminado: no has pescado nada'
    : `Concurso terminado: tu mejor pez mide ${contest.best} cm`;
}

export function fishingRanking(): Entry[] {
  const entries: Entry[] = fair.fishing.rivals.map(({ npc, size }) => ({ npc, score: size, detail: `un pez de ${size} cm` }));
  const result = getGameState().fishingResult;
  if (result) {
    entries.push({ npc: null, score: result, detail: `un pez de ${result} cm` });
  }
  return podium(entries);
}

// --- Ceremonia (HU-66) ---

// La ceremonia está pendiente: es el día de la feria, son las 18:00 o más tarde y aún no se ha celebrado.
export function isCeremonyDue(): boolean {
  const state = getGameState();
  return isFairDay() && state.minutes >= CEREMONY_MINUTES && !state.ceremonyDone;
}

// Cobra el premio de un concurso. Devuelve la cantidad (0 si el jugador no está en el podio).
export function awardPrize(ranking: Entry[]): number {
  const prize = prizeFor(ranking);
  const state = getGameState();
  state.money += prize;
  state.dayStats.moneyEarned += prize; // HU-39
  return prize;
}
