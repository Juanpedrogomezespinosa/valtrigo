import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from './config';
import { BootScene } from './scenes/BootScene';
import { CreditsScene } from './scenes/CreditsScene';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import { OptionsScene } from './scenes/OptionsScene';
import { PauseScene } from './scenes/PauseScene';
import { getGameState, isGameInProgress } from './systems/gameState';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.background,
  pixelArt: true,
  physics: {
    default: 'arcade',
    arcade: { debug: false },
  },
  // Sin suavizado del paso de tiempo: si el equipo va lento, Phaser no "frena" su reloj,
  // y las duraciones de las historias (fundidos, reloj del juego) siguen el tiempo real.
  fps: { smoothStep: false },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  // El orden marca qué escena se dibuja encima: la pausa sobre la partida y las opciones sobre la pausa.
  scene: [BootScene, MenuScene, GameScene, PauseScene, OptionsScene, CreditsScene],
});

// Expone el juego y el estado de la partida en desarrollo para que los tests de Playwright
// puedan consultarlos. En la build de producción no se expone nada.
if (import.meta.env.DEV) {
  Object.assign(window, {
    game,
    gameState: () => (isGameInProgress() ? getGameState() : null),
  });
}
