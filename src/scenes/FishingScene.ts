import Phaser from 'phaser';
import { COLORS, ENERGY_COLORS, FONT_FAMILY, HUD_BORDER } from '../config';
import type { FishingGame } from '../systems/fishingGame';
import type { GameScene } from './GameScene';

const BAR_WIDTH = 40;
const BAR_HEIGHT = 220;
const METER_WIDTH = 10;
const GAP = 6;
// Distancia entre el personaje y la barra, a su derecha.
const OFFSET_X = 40;
const ZONE_COLOR = 0x6abe30;

// Minijuego de pesca (HU-87). Solo dibuja: la lógica está en src/systems/fishingGame.ts y la avanza GameScene,
// así que con la pausa abierta se queda quieto. Va por encima de la capa de noche (HU-23), para que se vea bien
// al pescar de noche.
// - A la derecha del personaje: la barra con la zona verde y el pez, y al lado el medidor de captura.
export class FishingScene extends Phaser.Scene {
  private frame!: Phaser.GameObjects.Rectangle;
  private zone!: Phaser.GameObjects.Rectangle;
  private fish!: Phaser.GameObjects.Image;
  private meterFrame!: Phaser.GameObjects.Rectangle;
  private meter!: Phaser.GameObjects.Rectangle;
  private hint!: Phaser.GameObjects.Text;

  constructor() {
    super('FishingScene');
  }

  create(): void {
    const background = Phaser.Display.Color.HexStringToColor(COLORS.background).color;
    this.frame = this.add.rectangle(0, 0, BAR_WIDTH, BAR_HEIGHT, background).setOrigin(0).setStrokeStyle(3, HUD_BORDER);
    this.zone = this.add.rectangle(0, 0, BAR_WIDTH - 6, 1, ZONE_COLOR, 0.7).setOrigin(0);
    this.fish = this.add.image(0, 0, '__DEFAULT').setScale(2);
    this.meterFrame = this.add.rectangle(0, 0, METER_WIDTH, BAR_HEIGHT, ENERGY_COLORS.empty).setOrigin(0).setStrokeStyle(2, HUD_BORDER);
    this.meter = this.add.rectangle(0, 0, METER_WIDTH - 4, 1, ENERGY_COLORS.high).setOrigin(0);
    this.hint = this.add
      .text(0, 0, 'Mantén E', { fontFamily: FONT_FAMILY, fontSize: '18px', color: COLORS.text, backgroundColor: COLORS.background, padding: { x: 6, y: 3 } })
      .setOrigin(0.5, 1);
  }

  update(): void {
    const game = this.scene.get('GameScene') as GameScene;
    const state = game.getFishingState()?.game;
    if (!state) return;
    this.draw(game, state);
  }

  private draw(game: GameScene, state: FishingGame): void {
    // Posición del personaje en la pantalla.
    const camera = game.cameras.main;
    const playerX = (game.player.x - camera.worldView.x) * camera.zoom;
    const playerY = (game.player.y - camera.worldView.y) * camera.zoom;
    const left = Phaser.Math.Clamp(playerX + OFFSET_X, 10, this.scale.width - BAR_WIDTH - METER_WIDTH - GAP - 10);
    const top = Phaser.Math.Clamp(playerY - BAR_HEIGHT / 2, 40, this.scale.height - BAR_HEIGHT - 10);
    const inner = BAR_HEIGHT - 6;
    // De 0 (abajo) a 100 (arriba) a píxeles de la pantalla.
    const toY = (value: number) => top + 3 + inner * (1 - value / 100);

    this.frame.setPosition(left, top);
    this.zone.setPosition(left + 3, toY(state.zoneBottom + state.zoneSize)).setSize(BAR_WIDTH - 6, (inner * state.zoneSize) / 100);
    this.fish.setTexture(`objeto-${state.item}`).setPosition(left + BAR_WIDTH / 2, toY(state.fishY));
    this.meterFrame.setPosition(left + BAR_WIDTH + GAP, top);
    const meterHeight = Math.max(1, ((BAR_HEIGHT - 4) * state.progress) / 100);
    this.meter.setPosition(left + BAR_WIDTH + GAP + 2, top + BAR_HEIGHT - 2 - meterHeight).setSize(METER_WIDTH - 4, meterHeight);
    this.hint.setPosition(left + (BAR_WIDTH + GAP + METER_WIDTH) / 2, top - 4);
  }
}
