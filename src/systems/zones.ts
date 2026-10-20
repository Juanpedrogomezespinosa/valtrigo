import Phaser from 'phaser';
import zonesData from '../data/zones.json';
import { TILE_SIZE } from '../config';

export type ZoneId = keyof typeof zonesData;

export interface TilePosition {
  x: number;
  y: number;
}

// Objeto de la capa "puntos" de un mapa de Tiled: un punto con nombre o una puerta.
export interface MapObject {
  name: string;
  x: number;
  y: number;
  width: number;
  height: number;
  properties?: { name: string; value: string }[];
}

export const ZONES = zonesData;

// Clave con la que se carga el mapa de cada zona.
export function mapKey(zone: ZoneId): string {
  return `map-${zone}`;
}

// Objetos de la capa "puntos" del mapa de una zona.
export function mapObjects(scene: Phaser.Scene, zone: ZoneId): MapObject[] {
  const map = scene.cache.tilemap.get(mapKey(zone)).data as { layers: { name: string; objects?: MapObject[] }[] };
  return map.layers.find((layer) => layer.name === 'puntos')?.objects ?? [];
}

export function getProperty(object: MapObject, name: string): string | undefined {
  return object.properties?.find((property) => property.name === name)?.value;
}

// Busca un punto con nombre en el mapa de una zona (por ejemplo, "inicio" o "llegada-plaza").
export function findMapPoint(scene: Phaser.Scene, zone: ZoneId, name: string): MapObject {
  const point = mapObjects(scene, zone).find((object) => object.name === name);
  if (!point) {
    throw new Error(`El mapa de la zona "${zone}" no tiene el punto "${name}".`);
  }
  return point;
}

// Casilla en la que está un punto del mapa.
export function pointTile(point: MapObject): TilePosition {
  return { x: Math.floor(point.x / TILE_SIZE), y: Math.floor(point.y / TILE_SIZE) };
}
