import diary from '../data/diary.json';
import fountain from '../data/fountain.json';
import { MAX_ENERGY } from '../config';
import { getGameState } from './gameState';

// La fuente de la plaza (HU-75). Datos en src/data/fountain.json.
// - Beber recupera energía una vez al día.
// - Echar una moneda cuesta dinero y da la primera pista que todavía sirve: cada pista deja de servir cuando ya
//   se ha hecho lo que indica (`unless`), y algunas solo valen a partir de un día (`fromDay`).

export const FOUNTAIN = fountain;

type Hint = (typeof fountain.hints)[number] & { fromDay?: number };

// Bebe si hoy no se ha bebido. Devuelve el mensaje que hay que mostrar.
export function drink(): string {
  const state = getGameState();
  if (state.fountainDay === state.day) {
    return fountain.drink.already;
  }
  state.fountainDay = state.day;
  state.energy = Math.min(MAX_ENERGY, state.energy + fountain.drink.energy);
  return fountain.drink.message;
}

// Echa una moneda: devuelve la pista, o null si no hay dinero suficiente (y entonces no se cobra nada).
export function throwCoin(): string | null {
  const state = getGameState();
  if (state.money < fountain.coin.cost) {
    return null;
  }
  state.money -= fountain.coin.cost;
  return currentHint();
}

export function currentHint(): string {
  return (fountain.hints as Hint[]).find(isUseful)?.text ?? fountain.noHints;
}

function isUseful(hint: Hint): boolean {
  const state = getGameState();
  if (hint.fromDay !== undefined && state.day < hint.fromDay) return false;
  const { chestOpened, pickedUp, allDiaryPages } = hint.unless as { chestOpened?: string; pickedUp?: string; allDiaryPages?: boolean };
  if (chestOpened) return !state.openedChests.includes(chestOpened);
  if (pickedUp) return !state.pickedUpItems.includes(pickedUp);
  if (allDiaryPages) return state.diaryPages.length < Object.keys(diary.pages).length;
  return true;
}
