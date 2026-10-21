import fish from '../data/fish.json';
import { ITEMS, type ItemId } from './inventory';
import { randomInt } from './random';
import { toMinutes } from './time';

// Pesca (HU-48 y HU-49). Datos en src/data/fish.json: qué pez pica a cada hora (desde `from` hasta antes
// de `to`) y su rango de tamaños en cm.

export interface Catch {
  item: ItemId;
  size: number;
}

// HU-49: el pez depende de la hora a la que pica. El tamaño sale al azar dentro del rango de su especie.
export function catchAt(minutes: number): Catch {
  const species = fish.species.find((entry) => minutes >= toMinutes(entry.from) && minutes < toMinutes(entry.to)) ?? fish.species[0];
  return { item: species.item as ItemId, size: randomInt(species.minSize, species.maxSize) };
}

// "Has pescado una Trucha de 34 cm" ("un Siluro" para el Siluro).
export function caughtMessage({ item, size }: Catch): string {
  const species = fish.species.find((entry) => entry.item === item)!;
  return fish.caught
    .replace('{articulo}', species.article)
    .replace('{pez}', ITEMS[item].name)
    .replace('{tamaño}', String(size));
}
