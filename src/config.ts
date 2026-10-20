// Resolución interna del juego. Phaser la escala para ocupar la ventana sin deformarla.
export const GAME_WIDTH = 960;
export const GAME_HEIGHT = 540;

// Colores de la interfaz. Todos cumplen un contraste de al menos 4,5:1 sobre el fondo (HU-36).
export const COLORS = {
  background: '#1d2b1f',
  text: '#f2f2f2', // 13,2:1
  selected: '#ffd75e', // 10,7:1
  disabled: '#8c978e', // 4,9:1
};

export const FONT_FAMILY = 'sans-serif';

// Opciones de sonido (HU-28 a HU-30): volúmenes en barras, de 0 a 10. Valores la primera vez que
// se abre el juego, sin ajustes guardados (decisión del autor).
export const VOLUME_BARS = 10;
export const DEFAULT_MUSIC_BARS = 6;
export const DEFAULT_EFFECT_BARS = 5;

// Mundo
export const TILE_SIZE = 16;
// Zoom de la cámara en las zonas: con 960×540 se ven 20×11 casillas.
export const WORLD_ZOOM = 3;

// Valores de una partida nueva (HU-02).
export const NEW_GAME = {
  zone: 'plaza',
  day: 1,
  minutes: 6 * 60, // 06:00
  money: 100,
  energy: 100,
} as const;

export const MAX_ENERGY = 100;

// Velocidad del personaje en píxeles por segundo: 4 casillas por segundo (HU-06).
export const PLAYER_SPEED = 64;

// Duración del fundido a negro al cruzar una puerta (HU-08).
export const ZONE_FADE_MS = 500;

// Diálogos (HU-10): distancia máxima entre el personaje y un NPC para hablar con él
// ("a menos de una casilla") y velocidad de escritura del texto, letra a letra.
export const TALK_DISTANCE = TILE_SIZE;
export const DIALOG_MS_PER_LETTER = 30;

// Inventario (HU-13 y HU-15).
export const INVENTORY_SLOTS = 20;
export const MAX_STACK = 99;

// Duración de los mensajes breves sin duración indicada en las historias ("Inventario lleno", "No se puede usar").
export const MESSAGE_MS = 2000;

// Reloj (HU-22): minutos de juego por cada segundo real.
export const GAME_MINUTES_PER_SECOND = 1;
// Hora a la que empieza cada día al despertar (HU-22 y HU-24).
export const WAKE_UP_MINUTES = 6 * 60;
export const MINUTES_PER_DAY = 24 * 60;
// Fundido a negro al dormir (HU-24).
export const SLEEP_FADE_MS = 500;

// Ciclo día y noche (HU-23): color y opacidad de la oscuridad completa. No es negro total
// para que de noche se pueda seguir jugando.
export const NIGHT_COLOR = 0x0a1030;
export const NIGHT_MAX_ALPHA = 0.65;

// Cada cuánto suena un paso mientras el personaje anda (HU-32): dos pasos por ciclo de la animación.
export const STEP_SOUND_MS = 250;
