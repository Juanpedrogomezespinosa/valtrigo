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

// Volumen de la música mientras no existan las opciones de sonido (HU-28).
export const DEFAULT_MUSIC_VOLUME = 0.6;

// Volumen de los efectos mientras no existan las opciones de sonido (HU-29).
export const DEFAULT_SFX_VOLUME = 0.5;

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
