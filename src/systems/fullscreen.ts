import Phaser from 'phaser';

// Pantalla completa (HU-83): el juego ocupa toda la pantalla, sin nada del navegador, escalado sin deformarse
// (Scale.FIT). Se activa y se desactiva con F o desde las opciones; Escape también sale (lo hace el navegador).
// No se guarda: los navegadores solo dejan entrar en pantalla completa después de una pulsación del jugador.
export function toggleFullscreen(game: Phaser.Game): void {
  if (game.scale.isFullscreen) {
    game.scale.stopFullscreen();
  } else {
    game.scale.startFullscreen();
  }
}
