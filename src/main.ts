import Phaser from 'phaser';
import { COLORS, GAME_HEIGHT, GAME_WIDTH } from './config';
import { BootScene } from './scenes/BootScene';
import { CreditsScene } from './scenes/CreditsScene';
import { DaySummaryScene } from './scenes/DaySummaryScene';
import { DialogScene } from './scenes/DialogScene';
import { GameScene } from './scenes/GameScene';
import { HudScene } from './scenes/HudScene';
import { IntroScene } from './scenes/IntroScene';
import { NameScene } from './scenes/NameScene';
import { AppearanceScene } from './scenes/AppearanceScene';
import { InventoryScene } from './scenes/InventoryScene';
import { MenuScene } from './scenes/MenuScene';
import { NightScene } from './scenes/NightScene';
import { ObjectivesScene } from './scenes/ObjectivesScene';
import { OptionsScene } from './scenes/OptionsScene';
import { ShopScene } from './scenes/ShopScene';
import { MechanismScene } from './scenes/MechanismScene';
import { PauseScene } from './scenes/PauseScene';
import { PracticeScene } from './scenes/PracticeScene';
import { ItemChoiceScene } from './scenes/ItemChoiceScene';
import { CookScene } from './scenes/CookScene';
import { FishingScene } from './scenes/FishingScene';
import { getAudioState } from './systems/audio';
import { getGameState, isGameInProgress } from './systems/gameState';
import { setRandomValues } from './systems/random';
import { toggleFullscreen } from './systems/fullscreen';
import type { ItemId } from './systems/inventory';

// HU-30: Tab no es un control del juego. Por defecto el navegador mueve el foco a su barra; el juego lo pierde,
// Phaser suspende todo el sonido y el teclado deja de llegar al juego hasta hacer clic en él.
window.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') event.preventDefault();
});

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
  // encima, la interfaz fija (el dinero sigue visible en la pausa, HU-16) y el resumen del día (HU-39);
  // y sobre todo, las opciones.
  scene: [
    BootScene,
    MenuScene,
    PracticeScene,
    IntroScene,
    NameScene,
    AppearanceScene,
    GameScene,
    NightScene,
    FishingScene,
    DialogScene,
    InventoryScene,
    ObjectivesScene,
    ShopScene,
    ItemChoiceScene,
    MechanismScene,
    CookScene,
    PauseScene,
    HudScene,
    DaySummaryScene,
    OptionsScene,
    CreditsScene,
  ],
});

// HU-83: F activa y desactiva la pantalla completa en cualquier momento, salvo en la pantalla del nombre, donde la F
// es una letra. Se escucha en la página y no en Phaser para que la petición salga de la propia pulsación, como
// exigen los navegadores.
window.addEventListener('keydown', (event) => {
  if ((event.key === 'f' || event.key === 'F') && !event.repeat && !game.scene.isActive('NameScene')) {
    toggleFullscreen(game);
  }
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
    // Fija los valores al azar (pesca, HU-48 y HU-49) para que los tests den siempre lo mismo.
    setRandom: (values: number[]) => setRandomValues(values),
  });
}
