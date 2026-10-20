import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from './config';
import { BootScene } from './scenes/BootScene';
import { CreditsScene } from './scenes/CreditsScene';
import { GameScene } from './scenes/GameScene';
import { MenuScene } from './scenes/MenuScene';
import { OptionsScene } from './scenes/OptionsScene';
import { getGameState, isGameInProgress } from './systems/gameState';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: COLORS.background,
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [BootScene, MenuScene, OptionsScene, CreditsScene, GameScene],
});

// Expone el juego y el estado de la partida en desarrollo para que los tests de Playwright
// puedan consultarlos. En la build de producción no se expone nada.
if (import.meta.env.DEV) {
  Object.assign(window, {
    game,
    gameState: () => (isGameInProgress() ? getGameState() : null),
  });
}
