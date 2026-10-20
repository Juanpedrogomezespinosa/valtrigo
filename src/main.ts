import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from './config';
import { BootScene } from './scenes/BootScene';
import { CreditsScene } from './scenes/CreditsScene';
import { DialogScene } from './scenes/DialogScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { InventoryScene } from './scenes/InventoryScene';
import { MenuScene } from './scenes/MenuScene';
import { NightScene } from './scenes/NightScene';
import { ObjectivesScene } from './scenes/ObjectivesScene';
import { OptionsScene } from './scenes/OptionsScene';
import { ShopScene } from './scenes/ShopScene';
import { PauseScene } from './scenes/PauseScene';
import { getAudioState } from './systems/audio';
import { getGameState, isGameInProgress } from './systems/gameState';
import type { ItemId } from './systems/inventory';

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
  // El orden marca qué escena se dibuja encima: sobre la partida, la capa de noche, el diálogo, el inventario,
  // los objetivos, la tienda y la pausa;
  // encima, la interfaz fija (el dinero sigue visible en la pausa, HU-16); y sobre todo, las opciones.
  scene: [
    BootScene,
    MenuScene,
    GameScene,
    NightScene,
    DialogScene,
    InventoryScene,
    ObjectivesScene,
    ShopScene,
    PauseScene,
    HudScene,
    OptionsScene,
    CreditsScene,
  ],
});

// Expone el juego y el estado de la partida en desarrollo para que los tests de Playwright
// puedan consultarlos. En la build de producción no se expone nada.
if (import.meta.env.DEV) {
  Object.assign(window, {
    game,
    gameState: () => (isGameInProgress() ? getGameState() : null),
    // Recoger objetos como lo hacen el juego (cofres, tienda): para probar HU-15 sin depender de otras historias.
    pickUp: (item: ItemId, quantity: number) => (game.scene.getScene('GameScene') as GameScene).pickUp(item, quantity),
    // Volumen aplicado a la música, silencio y música que suena (HU-28 a HU-31).
    audioState: () => getAudioState(game),
  });
}
