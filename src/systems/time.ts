import { getGameState } from './gameState';

// Reloj del juego. Ninguna escena calcula la hora por su cuenta.
// El avance del tiempo se implementa en HU-22.

export function getDay(): number {
  return getGameState().day;
}

// Hora en formato HH:MM.
export function getTimeText(): string {
  const minutes = getGameState().minutes;
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
