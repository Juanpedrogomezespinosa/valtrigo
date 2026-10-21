import Phaser from 'phaser';
import { MAX_ENERGY, WAKE_UP_MINUTES } from '../config';
import { FAIR_WAKE_UP_MINUTES, isFairDay } from './fair';
import { createNewGameState, emptyDayStats, getGameState, type GameState } from './gameState';
import { growOvernight } from './farm';
import { readSave } from './save';
import { findMapPoint, pointTile } from './zones';

// Dormir y despertar (HU-22, HU-24 y HU-25).
// Al empezar un nuevo día el personaje despierta en su casa, junto a la cama, a las 06:00 y con la
// energía al máximo. Lo conseguido en el día (HU-39) y lo hecho para las tareas del día (HU-63) vuelven a cero,
// y el huerto avanza un día (HU-44).

function wakeUp(scene: Phaser.Scene, base: GameState, day: number): GameState {
  const morning: GameState = {
    ...structuredClone(base),
    day,
    // HU-58: el día de la feria es festivo y el jugador se despierta a las 12:00.
    minutes: isFairDay(day) ? FAIR_WAKE_UP_MINUTES : WAKE_UP_MINUTES,
    energy: MAX_ENERGY,
    dayStats: emptyDayStats(),
    dayEvents: [],
    foraged: [], // HU-50: los puntos del bosque vuelven a aparecer
    fishingContest: null, // HU-60: un concurso que no ha terminado antes de dormir se pierde
    zone: 'casa',
    position: pointTile(findMapPoint(scene, 'casa', 'despertar')),
  };
  // HU-43 y HU-44: los cultivos regados crecen y las parcelas quedan sin regar.
  growOvernight(morning);
  return morning;
}

// HU-24: dormir en la cama. El día siguiente empieza con el estado actual.
export function stateAfterSleeping(scene: Phaser.Scene): GameState {
  const current = getGameState();
  return wakeUp(scene, current, current.day + 1);
}

// HU-22 (escenario 4) y HU-24 (escenario 3): dormirse automáticamente a medianoche.
// Decisión del autor: el progreso no guardado se pierde, es decir, dinero, inventario, encargos, cofres...
// vuelven a como estaban en la última partida guardada (o a los de una partida nueva si no hay ninguna),
// pero el reloj pasa al día siguiente. No se guarda (HU-25).
export function stateAfterMidnight(scene: Phaser.Scene): GameState {
  const base = readSave() ?? createNewGameState(scene);
  return wakeUp(scene, base, getGameState().day + 1);
}
