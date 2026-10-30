import Phaser from 'phaser';
import fish from '../data/fish.json';
import type { ItemId } from './inventory';

// Minijuego de pesca (HU-87). Una barra vertical de 0 (abajo) a 100 (arriba) con el pez y la zona verde.
// - Manteniendo E la zona sube y al soltarla baja, siempre a la misma velocidad (`zoneSpeed`).
// - El medidor de captura empieza en `startProgress`. Sube mientras el pez está dentro de la zona y baja
//   mientras está fuera. Lleno (100), el pez se pesca; vacío (0), se escapa.
// - Cada especie se mueve con su patrón (src/data/fish.json, `movement`), siempre igual, sin azar:
//   - "wave": sube y baja alrededor del centro (la carpa, despacio; la trucha, deprisa y con un temblor encima);
//   - "jumps": se queda quieto en cada posición de la lista y salta a la siguiente (el siluro).
// Todo se calcula con el tiempo que pasa la escena, así que con la pausa abierta el minijuego se detiene.

const SETTINGS = fish.minigame;
const TOP = 100;

interface WaveMovement {
  type: 'wave';
  amplitude: number;
  period: number;
  tremorAmplitude?: number;
  tremorPeriod?: number;
}

interface JumpsMovement {
  type: 'jumps';
  positions: number[];
  holdSeconds: number;
  jumpSeconds: number;
}

type Movement = WaveMovement | JumpsMovement;

export interface FishingGame {
  item: ItemId;
  seconds: number;
  zoneSize: number;
  // Borde de abajo de la zona verde.
  zoneBottom: number;
  progress: number;
  fishY: number;
}

export type FishingResult = 'playing' | 'caught' | 'escaped';

function movementOf(item: ItemId): Movement {
  return fish.species.find((species) => species.item === item)!.movement as Movement;
}

// Posición del pez a los `seconds` segundos de empezar el minijuego.
export function fishPosition(item: ItemId, seconds: number): number {
  const movement = movementOf(item);
  if (movement.type === 'wave') {
    const wave = movement.amplitude * Math.sin((2 * Math.PI * seconds) / movement.period);
    const tremor = movement.tremorAmplitude ? movement.tremorAmplitude * Math.sin((2 * Math.PI * seconds) / movement.tremorPeriod!) : 0;
    return Phaser.Math.Clamp(TOP / 2 + wave + tremor, 0, TOP);
  }
  const { positions, holdSeconds, jumpSeconds } = movement;
  const cycle = holdSeconds + jumpSeconds;
  const step = Math.floor(seconds / cycle);
  const from = positions[step % positions.length];
  const to = positions[(step + 1) % positions.length];
  const jump = (seconds - step * cycle - holdSeconds) / jumpSeconds;
  return jump <= 0 ? from : from + (to - from) * jump;
}

// Empieza el minijuego con la zona centrada en el pez.
export function startFishingGame(item: ItemId, zoneSize: number): FishingGame {
  const fishY = fishPosition(item, 0);
  return { item, seconds: 0, zoneSize, zoneBottom: Phaser.Math.Clamp(fishY - zoneSize / 2, 0, TOP - zoneSize), progress: SETTINGS.startProgress, fishY };
}

export function isFishInZone(game: FishingGame): boolean {
  return game.fishY >= game.zoneBottom && game.fishY <= game.zoneBottom + game.zoneSize;
}

// Avanza el minijuego `deltaMs` milisegundos, con E pulsada (`holding`) o no.
export function stepFishingGame(game: FishingGame, deltaMs: number, holding: boolean): FishingResult {
  const seconds = deltaMs / 1000;
  game.seconds += seconds;
  game.zoneBottom = Phaser.Math.Clamp(game.zoneBottom + (holding ? 1 : -1) * SETTINGS.zoneSpeed * seconds, 0, TOP - game.zoneSize);
  game.fishY = fishPosition(game.item, game.seconds);
  const change = isFishInZone(game) ? SETTINGS.gainPerSecond : -SETTINGS.lossPerSecond;
  game.progress = Phaser.Math.Clamp(game.progress + change * seconds, 0, 100);
  if (game.progress >= 100) return 'caught';
  if (game.progress <= 0) return 'escaped';
  return 'playing';
}

export const REEL_SOUND_MS = SETTINGS.reelSoundMs;
export const ESCAPED_MESSAGE = fish.escaped;
