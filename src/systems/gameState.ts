import Phaser from 'phaser';
import { NEW_GAME } from '../config';
import { findMapPoint, pointTile, type TilePosition, type ZoneId } from './zones';

export interface InventoryItem {
  item: string;
  quantity: number;
}

// Todo lo que forma parte de una partida y se guarda (HU-03).
export interface GameState {
  zone: ZoneId;
  position: TilePosition;
  day: number;
  minutes: number; // minutos desde las 00:00
  money: number;
  energy: number;
  inventory: InventoryItem[];
  // Encargo activo (como mucho uno, HU-19), encargos completados y progreso de los que lo necesitan
  // (por ejemplo, semillas vendidas desde que se aceptó "Día de mercado").
  activeQuests: string[];
  completedQuests: string[];
  questProgress: Record<string, number>;
  openedChests: string[];
  // Objetos sueltos del mundo que ya se han recogido (HU-12), como la Pala de la granja.
  pickedUpItems: string[];
}

let current: GameState | null = null;

// Estado de una partida nueva: zona inicial, posición de inicio del mapa y valores de config.ts.
export function createNewGameState(scene: Phaser.Scene): GameState {
  return {
    zone: NEW_GAME.zone,
    position: pointTile(findMapPoint(scene, NEW_GAME.zone, 'inicio')),
    day: NEW_GAME.day,
    minutes: NEW_GAME.minutes,
    money: NEW_GAME.money,
    energy: NEW_GAME.energy,
    inventory: [],
    activeQuests: [],
    completedQuests: [],
    questProgress: {},
    openedChests: [],
    pickedUpItems: [],
  };
}

export function startGame(state: GameState): void {
  current = state;
}

// Termina la partida en curso sin guardarla (al salir al menú principal).
export function endGame(): void {
  current = null;
}

export function isGameInProgress(): boolean {
  return current !== null;
}

export function getGameState(): GameState {
  if (!current) {
    throw new Error('No hay ninguna partida en curso.');
  }
  return current;
}
