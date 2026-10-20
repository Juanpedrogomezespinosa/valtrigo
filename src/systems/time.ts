import { GAME_MINUTES_PER_SECOND, MINUTES_PER_DAY } from '../config';
import { getGameState } from './gameState';

// Reloj del juego (HU-22). Ninguna escena calcula la hora por su cuenta.
// La hora avanza 1 minuto de juego por cada segundo real mientras la partida no está en pausa.

// Milisegundos reales acumulados que aún no completan un minuto de juego.
let pendingMs = 0;

export function resetClock(): void {
  pendingMs = 0;
}

// Avanza el reloj con el tiempo real transcurrido. Devuelve true si se ha llegado a medianoche (24:00):
// en ese caso el reloj se queda en 23:59 y es quien llama el que decide qué pasa (HU-22, escenario 4).
export function advanceTime(deltaMs: number): boolean {
  const state = getGameState();
  pendingMs += deltaMs;
  const msPerMinute = 1000 / GAME_MINUTES_PER_SECOND;
  while (pendingMs >= msPerMinute) {
    pendingMs -= msPerMinute;
    if (state.minutes + 1 >= MINUTES_PER_DAY) {
      pendingMs = 0;
      return true;
    }
    state.minutes += 1;
  }
  return false;
}

// HU-23: oscuridad de la pantalla entre 0 (luz normal) y 1 (completamente oscura).
// Se oscurece poco a poco de 20:00 a 21:00, está oscura hasta las 06:00 y la luz vuelve poco a poco
// de 06:00 a 07:00.
export function darkness(minutes = getGameState().minutes): number {
  const dusk = 20 * 60;
  const dawn = 6 * 60;
  if (minutes >= dusk && minutes < dusk + 60) return (minutes - dusk) / 60;
  if (minutes >= dusk + 60 || minutes < dawn) return 1;
  if (minutes < dawn + 60) return 1 - (minutes - dawn) / 60;
  return 0;
}

export function getDay(): number {
  return getGameState().day;
}

// Hora en formato HH:MM.
export function getTimeText(): string {
  const minutes = getGameState().minutes;
  const hours = Math.floor(minutes / 60);
  return `${String(hours).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
}
