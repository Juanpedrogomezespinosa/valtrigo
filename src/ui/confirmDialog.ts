import Phaser from 'phaser';
import { COLORS, FONT_FAMILY } from '../config';
import { playEffect } from '../systems/audio';

const WIDTH = 520;
const HEIGHT = 180;
const DEPTH = 100;

// Cuadro de confirmación con "Sí" y "No", centrado sobre la escena.
// Se maneja con las flechas izquierda y derecha, Enter, Escape (equivale a "No") o el ratón.
// Empieza con "No" seleccionado, para que pulsar Enter por error no tenga consecuencias.
export function showConfirmDialog(scene: Phaser.Scene, message: string, onAnswer: (yes: boolean) => void): void {
  const { width, height } = scene.scale;
  const objects: Phaser.GameObjects.GameObject[] = [];

  // Capa que oscurece la escena y recoge los clics para que no lleguen a lo que hay debajo.
  const shade = scene.add
    .rectangle(0, 0, width, height, 0x000000, 0.6)
    .setOrigin(0)
    .setDepth(DEPTH)
    .setInteractive();
  const box = scene.add
    .rectangle(width / 2, height / 2, WIDTH, HEIGHT, Phaser.Display.Color.HexStringToColor(COLORS.background).color)
    .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.text).color)
    .setDepth(DEPTH);
  const text = scene.add
    .text(width / 2, height / 2 - 35, message, { fontFamily: FONT_FAMILY, fontSize: '26px', color: COLORS.text })
    .setOrigin(0.5)
    .setDepth(DEPTH);
  objects.push(shade, box, text);

  const buttons = (['Sí', 'No'] as const).map((label, index) => {
    const button = scene.add
      .text(width / 2 + (index === 0 ? -80 : 80), height / 2 + 40, label, {
        fontFamily: FONT_FAMILY,
        fontSize: '28px',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH)
      .setInteractive({ useHandCursor: true });
    button.on('pointerdown', () => answer(index === 0));
    objects.push(button);
    return button;
  });

  let selected = 1;
  const refresh = () => {
    buttons.forEach((button, index) => {
      button.setText(index === selected ? `▶ ${['Sí', 'No'][index]}` : ['Sí', 'No'][index]);
      button.setColor(index === selected ? COLORS.selected : COLORS.text);
    });
  };

  const keyboard = scene.input.keyboard!;
  const select = (index: number) => {
    if (index !== selected) {
      selected = index;
      playEffect(scene, 'menuNavigate');
      refresh();
    }
  };
  const onLeft = () => select(0);
  const onRight = () => select(1);
  const onEnter = () => answer(selected === 0);
  const onEscape = () => answer(false);
  keyboard.on('keydown-LEFT', onLeft);
  keyboard.on('keydown-RIGHT', onRight);
  keyboard.on('keydown-ENTER', onEnter);
  keyboard.on('keydown-ESC', onEscape);

  function answer(yes: boolean): void {
    keyboard.off('keydown-LEFT', onLeft);
    keyboard.off('keydown-RIGHT', onRight);
    keyboard.off('keydown-ENTER', onEnter);
    keyboard.off('keydown-ESC', onEscape);
    objects.forEach((object) => object.destroy());
    playEffect(scene, 'menuConfirm');
    onAnswer(yes);
  }

  refresh();
}
