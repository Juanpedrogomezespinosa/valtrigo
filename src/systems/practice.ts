import Phaser from 'phaser';
import practice from '../data/practice.json';
import { NEW_GAME, WAKE_UP_MINUTES } from '../config';
import { FAIR_WAKE_UP_MINUTES, isFairDay } from './fair';
import { createNewGameState, type GameState, type PlotState } from './gameState';
import { findMapPoint, getProperty, pointTile, type ZoneId } from './zones';

// Partidas de práctica (HU-61). Datos en src/data/practice.json: cada partida es una partida nueva con los
// cambios indicados (día, zona y punto del mapa donde empieza, encargos, inventario, cofres, huerto...).
// Empieza a la hora a la que empieza su día en el juego y no toca la partida guardada.

type PracticeGame = (typeof practice.games)[number] & {
  activeQuests?: string[];
  openedChests?: string[];
  pickedUpItems?: string[];
  visitedZones?: string[];
  plots?: Record<string, PlotState>;
};

const GAMES: PracticeGame[] = practice.games;

export const PRACTICE_TITLES = GAMES.map((game) => game.title);

// Hora a la que empieza cada día: el 1 a las 08:00 (HU-62), el de la feria a las 12:00 (HU-58) y el resto a las 06:00.
function startOfDay(day: number): number {
  if (day === NEW_GAME.day) return NEW_GAME.minutes;
  return isFairDay(day) ? FAIR_WAKE_UP_MINUTES : WAKE_UP_MINUTES;
}

// Estado de la partida de práctica y hacia dónde mira el personaje al empezar.
export function createPracticeState(scene: Phaser.Scene, title: string): { state: GameState; facing?: string } {
  const game = GAMES.find((candidate) => candidate.title === title)!;
  const point = findMapPoint(scene, game.zone as ZoneId, game.point);
  const state: GameState = {
    ...createNewGameState(scene),
    playerName: practice.name,
    money: practice.money,
    day: game.day,
    minutes: startOfDay(game.day),
    zone: game.zone as ZoneId,
    position: pointTile(point),
    completedQuests: [...game.completedQuests],
    activeQuests: [...(game.activeQuests ?? [])],
    inventory: game.inventory.map((slot) => ({ ...slot })),
    openedChests: [...(game.openedChests ?? [])],
    pickedUpItems: [...(game.pickedUpItems ?? [])],
    visitedZones: [...(game.visitedZones ?? [])],
    plots: structuredClone(game.plots ?? {}),
  };
  return { state, facing: getProperty(point, 'mirando') };
}
