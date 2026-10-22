import Phaser from 'phaser';
import data from '../data/appearance.json';

// Aspecto del personaje (HU-68): género, piel y pelo.
export type Gender = 'hombre' | 'mujer';
export interface Appearance {
  gender: Gender;
  skin: string;
  hair: string;
}

export const GENDERS = data.genders as { id: Gender; name: string; sheet: string; skinColors: string[]; hairColors: string[] }[];
export const SKINS = data.skins;
export const HAIRS = data.hairs;

// Aspecto al abrir la pantalla "¿Cómo eres?", de las partidas guardadas antes de HU-68 y de las partidas de
// práctica (HU-61). Es la hoja del jugador tal cual, sin recolorear.
export function defaultAppearance(): Appearance {
  return { ...(data.default as Appearance) };
}

// Elige el texto según el género del personaje (HU-68), por ejemplo "cansado" o "cansada".
export function byGender(appearance: Appearance, male: string, female: string): string {
  return appearance.gender === 'mujer' ? female : male;
}

// Sustituye en un texto los marcadores "{masculino|femenino}" por la forma que corresponde al género.
export function genderText(appearance: Appearance, text: string): string {
  return text.replace(/\{([^{}|]*)\|([^{}|]*)\}/g, (_, male: string, female: string) => byGender(appearance, male, female));
}

// Clave de la hoja del personaje con ese aspecto. La primera vez se crea a partir de la hoja base del género
// (cargada en BootScene), cambiando los colores de piel y pelo: el color claro y el de sombra de cada uno.
export function playerTexture(scene: Phaser.Scene, appearance: Appearance): string {
  const key = `jugador-${appearance.gender}-${appearance.skin}-${appearance.hair}`;
  if (scene.textures.exists(key)) return key;

  const gender = GENDERS.find(({ id }) => id === appearance.gender) ?? GENDERS[0];
  const skin = SKINS.find(({ id }) => id === appearance.skin) ?? SKINS[0];
  const hair = HAIRS.find(({ id }) => id === appearance.hair) ?? HAIRS[0];
  const swaps = new Map<number, number>();
  gender.skinColors.forEach((color, index) => swaps.set(rgb(color), rgb(skin.colors[index])));
  gender.hairColors.forEach((color, index) => swaps.set(rgb(color), rgb(hair.colors[index])));

  const source = scene.textures.get(gender.sheet).getSourceImage() as HTMLImageElement;
  const canvas = document.createElement('canvas');
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext('2d')!;
  context.drawImage(source, 0, 0);
  const image = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = image.data;
  for (let index = 0; index < pixels.length; index += 4) {
    if (pixels[index + 3] === 0) continue;
    const swapped = swaps.get((pixels[index] << 16) | (pixels[index + 1] << 8) | pixels[index + 2]);
    if (swapped === undefined) continue;
    pixels[index] = (swapped >> 16) & 0xff;
    pixels[index + 1] = (swapped >> 8) & 0xff;
    pixels[index + 2] = swapped & 0xff;
  }
  context.putImageData(image, 0, 0);
  scene.textures.addSpriteSheet(key, canvas as unknown as HTMLImageElement, { frameWidth: 16, frameHeight: 16 });
  return key;
}

function rgb(hex: string): number {
  return parseInt(hex.slice(1), 16);
}
