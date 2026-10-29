import Phaser from 'phaser';
import { NEW_GAME } from '../config';
import { defaultAppearance, type Appearance } from './appearance';
import { resetClock } from './time';
import { findMapPoint, pointTile, type TilePosition, type ZoneId } from './zones';

export interface InventoryItem {
  item: string;
  quantity: number;
}

// Lo conseguido en el día en curso, para el resumen al dormir (HU-39): monedas ganadas con ventas y
// recompensas, cosechas recogidas y peces pescados. Se pone a cero al empezar cada día.
export interface DayStats {
  moneyEarned: number;
  harvests: number;
  fish: number;
}

export function emptyDayStats(): DayStats {
  return { moneyEarned: 0, harvests: 0, fish: 0 };
}

// Una parcela del huerto (HU-41 a HU-44): si está cavada, qué semilla tiene, cuántos días ha crecido
// y si se ha regado hoy.
export interface PlotState {
  dug: boolean;
  seed: string | null;
  grown: number;
  watered: boolean;
}

// Todo lo que forma parte de una partida y se guarda (HU-03).
export interface GameState {
  // Nombre del jugador (HU-67). Se elige al empezar una partida nueva.
  playerName: string;
  // Aspecto del personaje (HU-68). Se elige después del nombre.
  appearance: Appearance;
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
  dayStats: DayStats;
  // Lo que el jugador ha hecho hoy para las tareas del día (HU-63): "talk:<npc>", "visit:<zona>"...
  dayEvents: string[];
  // Zonas en las que se ha entrado alguna vez por su puerta (HU-64: aviso de la primera visita).
  visitedZones: string[];
  // Parcelas del huerto que no están sin cavar, por su casilla en la granja ("x,y").
  plots: Record<string, PlotState>;
  // Día en que se recogió por última vez la Manzana del manzano, o null si no se ha recogido nunca (HU-45).
  applePickedDay: number | null;
  // Puntos de Setas y Moras y troncos del bosque recogidos o talados hoy (HU-50). Vuelven al empezar el día.
  foraged: string[];
  // Pedidos del tablón (HU-52 a HU-54), identificados por el día en que se ofrecieron: los aceptados que aún
  // no se han entregado y todos los días cuyo pedido se aceptó.
  activeOrders: number[];
  acceptedOrderDays: number[];
  // Páginas del diario de la relojera encontradas (HU-55). No ocupan sitio en el inventario.
  diaryPages: string[];
  // Feria (HU-59, HU-60 y HU-66):
  // - la cosecha presentada al concurso y su peso en kg (null si no se ha participado);
  // - si el jugador se ha inscrito alguna vez en el concurso de pesca;
  // - el concurso de pesca en curso: la hora de fin (null hasta que se lanza la caña en el lago) y el mayor
  //   pez pescado, en cm;
  // - el mayor pez del concurso ya terminado (0 si no pescó nada, null si no llegó a pescar en él);
  // - si ya se ha celebrado la ceremonia.
  harvestEntry: { item: string; weight: number } | null;
  fishingContestDone: boolean;
  fishingContest: { endsAt: number | null; best: number } | null;
  fishingResult: number | null;
  ceremonyDone: boolean;
  // Misiones secundarias (HU-72 a HU-74): las activas con el día en que se aceptaron, las completadas y las
  // activas en las que ya se ha dado el paso intermedio (encontrar a Bigotes).
  activeMissions: { id: string; day: number }[];
  completedMissions: string[];
  missionProgress: string[];
  // Día en que se bebió por última vez de la fuente de la plaza, o null si nunca (HU-75).
  fountainDay: number | null;
  // Puzles resueltos (HU-77 a HU-79): "losas", "campanas" y "cajas".
  solvedPuzzles: string[];
}

let current: GameState | null = null;

// Estado de una partida nueva: zona inicial, posición de inicio del mapa y valores de config.ts.
export function createNewGameState(scene: Phaser.Scene): GameState {
  return {
    playerName: '',
    appearance: defaultAppearance(),
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
    dayStats: emptyDayStats(),
    dayEvents: [],
    visitedZones: [],
    plots: {},
    applePickedDay: null,
    foraged: [],
    activeOrders: [],
    acceptedOrderDays: [],
    diaryPages: [],
    harvestEntry: null,
    fishingContestDone: false,
    fishingContest: null,
    fishingResult: null,
    ceremonyDone: false,
    activeMissions: [],
    completedMissions: [],
    missionProgress: [],
    fountainDay: null,
    solvedPuzzles: [],
  };
}

export function startGame(state: GameState): void {
  current = state;
  running = false;
  resetClock();
}

// Termina la partida en curso sin guardarla (al salir al menú principal).
export function endGame(): void {
  current = null;
  running = false;
}

// HU-81: si el personaje corre. Mayús lo activa y lo desactiva. No forma parte de la partida guardada: al
// empezar o cargar una partida se anda, y al cambiar de zona se sigue como se iba.
let running = false;

export function isRunning(): boolean {
  return running;
}

export function setRunning(value: boolean): void {
  running = value;
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
