import type { GameState } from './gameState';

// Sistema de guardado. Todo acceso a localStorage pasa por aquí.
// Si el navegador no permite guardar datos, el juego sigue funcionando sin partida guardada.

const SAVE_KEY = 'valtrigo.partida';
const SAVE_VERSION = 1;

interface SaveData {
  version: number;
  state: GameState;
}

function readSaveData(): SaveData | null {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) {
      return null;
    }
    const data = JSON.parse(raw) as SaveData;
    return data.version === SAVE_VERSION ? data : null;
  } catch {
    return null;
  }
}

// Indica si existe una partida guardada válida.
export function hasSavedGame(): boolean {
  return readSaveData() !== null;
}

// Guarda la partida y sobrescribe la anterior, si la había.
// Devuelve false si el navegador no permite guardar.
export function writeSave(state: GameState): boolean {
  try {
    const data: SaveData = { version: SAVE_VERSION, state };
    localStorage.setItem(SAVE_KEY, JSON.stringify(data));
    return true;
  } catch {
    return false;
  }
}
