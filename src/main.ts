import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from './config';
import { BootScene } from './scenes/BootScene';
import { CreditsScene } from './scenes/CreditsScene';
import { MenuScene } from './scenes/MenuScene';
import { OptionsScene } from './scenes/OptionsScene';

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
  scene: [BootScene, MenuScene, OptionsScene, CreditsScene],
});

// Expone el juego en desarrollo para que los tests de Playwright puedan consultar su estado.
if (import.meta.env.DEV) {
  (window as unknown as { game: Phaser.Game }).game = game;
}
