import Phaser from 'phaser';
import zonesData from '../data/zones.json';
import { TILE_SIZE } from '../config';

export type ZoneId = keyof typeof zonesData;

export interface TilePosition {
  x: number;
  y: number;
}

export const ZONES = zonesData;

// Clave con la que se carga el mapa de cada zona.
export function mapKey(zone: ZoneId): string {
  return `map-${zone}`;
}

// Busca un punto con nombre en la capa "puntos" del mapa de una zona (por ejemplo, "inicio")
// y devuelve la casilla en la que está.
export function findMapPoint(scene: Phaser.Scene, zone: ZoneId, name: string): TilePosition {
  const map = scene.cache.tilemap.get(mapKey(zone)).data as {
    layers: { name: string; objects?: { name: string; x: number; y: number }[] }[];
  };
  const point = map.layers.find((layer) => layer.name === 'puntos')?.objects?.find((object) => object.name === name);
  if (!point) {
    throw new Error(`El mapa de la zona "${zone}" no tiene el punto "${name}".`);
  }
  return { x: Math.floor(point.x / TILE_SIZE), y: Math.floor(point.y / TILE_SIZE) };
}
