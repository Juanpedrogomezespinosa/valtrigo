import Phaser from 'phaser';
import { COLORS, FONT_FAMILY } from '../config';
import { playEffect } from '../systems/audio';
import { onConfirmKeys } from './confirmKeys';

const WIDTH = 560;
const PADDING = 40;
// Espacio entre el mensaje y el centro de los botones, y entre los botones y el borde inferior.
const BUTTONS_GAP = 55;
const BOTTOM_GAP = 30;
const DEPTH = 100;

// Cuadro de confirmación con "Sí" y "No", centrado sobre la escena.
// Se maneja con las flechas izquierda y derecha, Enter, Escape (equivale a "No") o el ratón. Dentro de la partida
// (`withE`), también con E.
// Empieza con "No" seleccionado, para que pulsar Enter por error no tenga consecuencias.
export function showConfirmDialog(
  scene: Phaser.Scene,
  message: string,
  onAnswer: (yes: boolean) => void,
  withE = false,
): void {
  const { width, height } = scene.scale;
  const objects: Phaser.GameObjects.GameObject[] = [];

  // Capa que oscurece la escena y recoge los clics para que no lleguen a lo que hay debajo.
  const shade = scene.add
    .rectangle(0, 0, width, height, 0x000000, 0.6)
    .setOrigin(0)
    .setDepth(DEPTH)
    .setInteractive();
  // El mensaje se parte en varias líneas si no cabe, y el cuadro crece en altura.
  const text = scene.add
    .text(width / 2, 0, message, {
      fontFamily: FONT_FAMILY,
      fontSize: '26px',
      color: COLORS.text,
      align: 'center',
      wordWrap: { width: WIDTH - PADDING * 2 },
    })
    .setOrigin(0.5, 0)
    .setDepth(DEPTH + 1);
  const boxHeight = PADDING + text.height + BUTTONS_GAP + BOTTOM_GAP + PADDING / 2;
  const boxTop = height / 2 - boxHeight / 2;
  text.setY(boxTop + PADDING);
  const box = scene.add
    .rectangle(width / 2, height / 2, WIDTH, boxHeight, Phaser.Display.Color.HexStringToColor(COLORS.background).color)
    .setStrokeStyle(2, Phaser.Display.Color.HexStringToColor(COLORS.text).color)
    .setDepth(DEPTH);
  objects.push(shade, box, text);

  const buttons = (['Sí', 'No'] as const).map((label, index) => {
    const button = scene.add
      .text(width / 2 + (index === 0 ? -80 : 80), boxTop + PADDING + text.height + BUTTONS_GAP, label, {
        fontFamily: FONT_FAMILY,
        fontSize: '28px',
      })
      .setOrigin(0.5)
      .setDepth(DEPTH + 1)
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
  const onEscape = () => answer(false);
  keyboard.on('keydown-LEFT', onLeft);
  keyboard.on('keydown-RIGHT', onRight);
  const offConfirm = onConfirmKeys(keyboard, withE, () => answer(selected === 0));
  keyboard.on('keydown-ESC', onEscape);

  function answer(yes: boolean): void {
    keyboard.off('keydown-LEFT', onLeft);
    keyboard.off('keydown-RIGHT', onRight);
    offConfirm();
    keyboard.off('keydown-ESC', onEscape);
    objects.forEach((object) => object.destroy());
    playEffect(scene, 'menuConfirm');
    onAnswer(yes);
  }

  refresh();
}
