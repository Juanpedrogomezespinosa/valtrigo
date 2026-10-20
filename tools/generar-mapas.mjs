// Genera la versión inicial de los mapas de las zonas en formato Tiled (JSON).
// Uso: node tools/generar-mapas.mjs
// Los mapas se escriben en public/assets/maps/. Una vez generados, se pueden retocar en Tiled;
// volver a ejecutar este script sobrescribe esos cambios.

import { mkdirSync, writeFileSync } from 'node:fs';

const OUTPUT_DIR = 'public/assets/maps';
const TILE_SIZE = 16;

// Los mapas usan dos hojas: Tiny Town (exteriores) y Tiny Dungeon (interiores).
// En los mapas, las casillas de Tiny Dungeon van después de las 132 de Tiny Town.
const TOWN_TILE_COUNT = 132;
const dungeon = (index) => TOWN_TILE_COUNT + index;

// Casillas de Tiny Town (índice en la hoja, empezando en 0).
const TILE = {
  grass: 0,
  grassDetail: 1,
  grassFlowers: 2,
  // Camino de tierra: centro y bordes con césped.
  dirt: 25,
  dirtTop: 13,
  dirtBottom: 37,
  dirtLeft: 24,
  dirtRight: 26,
  dirtTopLeft: 12,
  dirtTopRight: 14,
  dirtBottomLeft: 36,
  dirtBottomRight: 38,
  // Los pinos claros (4, 28) se confunden con el césped; se usan el árbol oscuro y los otoñales.
  tree: 16,
  autumnTree: 3,
  smallAutumnTree: 27,
  bush: 5,
  well: 104,
  sign: 83,
};

// Casillas de Tiny Dungeon para interiores.
const INTERIOR = {
  floor: dungeon(48),
  floorDetail: dungeon(49),
  wall: dungeon(40),
  wallTop: dungeon(37),
  door: dungeon(45),
  shelf: dungeon(63),
  table: dungeon(72),
  chair: dungeon(73),
  barrel: dungeon(82),
};

// Edificios: filas de casillas, de arriba abajo. La puerta forma parte de la fila inferior.
const BUILDINGS = {
  casa: [
    [52, 53, 53, 54],
    [64, 65, 65, 66],
    [84, 85, 73, 84],
  ],
  tienda: [
    [48, 49, 49, 49, 50],
    [60, 61, 61, 61, 62],
    [84, 73, 85, 73, 84],
  ],
  torre: [
    [48, 49, 50],
    [60, 61, 62],
    [76, 88, 79],
    [76, 77, 79],
    [76, 89, 79],
  ],
};

// Valor pseudoaleatorio fijo para cada casilla, para que el mapa salga siempre igual.
function hash(x, y) {
  let h = (x * 374761393 + y * 668265263) ^ 0x5bd1e995;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return (h ^ (h >>> 16)) >>> 0;
}

function createMap(width, height) {
  return {
    width,
    height,
    ground: new Array(width * height).fill(-1),
    obstacles: new Array(width * height).fill(-1),
    dirt: new Set(),
    points: [],
  };
}

const key = (x, y) => `${x},${y}`;
const inside = (map, x, y) => x >= 0 && y >= 0 && x < map.width && y < map.height;

function setTile(layer, map, x, y, tile) {
  if (inside(map, x, y)) layer[y * map.width + x] = tile;
}

function getTile(layer, map, x, y) {
  return layer[y * map.width + x];
}

function addDirt(map, x1, y1, x2, y2) {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      if (inside(map, x, y)) map.dirt.add(key(x, y));
    }
  }
}

function placeBuilding(map, rows, x, y) {
  rows.forEach((row, dy) => row.forEach((tile, dx) => setTile(map.obstacles, map, x + dx, y + dy, tile)));
}

// Elige la casilla de tierra según qué vecinos son césped, para que los bordes encajen.
function dirtTile(map, x, y) {
  const isDirt = (nx, ny) => !inside(map, nx, ny) || map.dirt.has(key(nx, ny));
  const top = !isDirt(x, y - 1);
  const bottom = !isDirt(x, y + 1);
  const left = !isDirt(x - 1, y);
  const right = !isDirt(x + 1, y);
  if (top && left) return TILE.dirtTopLeft;
  if (top && right) return TILE.dirtTopRight;
  if (bottom && left) return TILE.dirtBottomLeft;
  if (bottom && right) return TILE.dirtBottomRight;
  if (top) return TILE.dirtTop;
  if (bottom) return TILE.dirtBottom;
  if (left) return TILE.dirtLeft;
  if (right) return TILE.dirtRight;
  return TILE.dirt;
}

function paintGround(map) {
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      if (map.dirt.has(key(x, y))) {
        setTile(map.ground, map, x, y, dirtTile(map, x, y));
        continue;
      }
      const h = hash(x, y) % 100;
      setTile(map.ground, map, x, y, h < 4 ? TILE.grassFlowers : h < 18 ? TILE.grassDetail : TILE.grass);
    }
  }
}

// Coloca árboles en un rectángulo, sin tapar caminos, edificios ni las casillas reservadas.
function addTrees(map, x1, y1, x2, y2, density, reserved = new Set()) {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      if (!inside(map, x, y) || map.dirt.has(key(x, y)) || reserved.has(key(x, y))) continue;
      if (getTile(map.obstacles, map, x, y) !== -1) continue;
      const h = hash(x + 101, y + 211) % 100;
      if (h < density) setTile(map.obstacles, map, x, y, [TILE.tree, TILE.tree, TILE.autumnTree, TILE.smallAutumnTree][h % 4]);
    }
  }
}

function toTiled(map) {
  const gid = (tile) => (tile === -1 ? 0 : tile + 1);
  return {
    type: 'map',
    version: '1.10',
    tiledversion: '1.10.2',
    orientation: 'orthogonal',
    renderorder: 'right-down',
    infinite: false,
    width: map.width,
    height: map.height,
    tilewidth: TILE_SIZE,
    tileheight: TILE_SIZE,
    nextlayerid: 4,
    nextobjectid: map.points.length + 1,
    layers: [
      { id: 1, name: 'suelo', type: 'tilelayer', ...layerBase(map), data: map.ground.map(gid) },
      { id: 2, name: 'obstaculos', type: 'tilelayer', ...layerBase(map), data: map.obstacles.map(gid) },
      {
        id: 3,
        name: 'puntos',
        type: 'objectgroup',
        draworder: 'topdown',
        opacity: 1,
        visible: true,
        x: 0,
        y: 0,
        objects: map.points.map((point, index) => ({
          id: index + 1,
          name: point.name,
          type: '',
          point: true,
          // Centro de la casilla.
          x: point.x * TILE_SIZE + TILE_SIZE / 2,
          y: point.y * TILE_SIZE + TILE_SIZE / 2,
          width: 0,
          height: 0,
          rotation: 0,
          visible: true,
        })),
      },
    ],
    tilesets: [
      {
        firstgid: 1,
        name: 'kenney-tiny-town',
        image: '../tilesets/kenney-tiny-town.png',
        imagewidth: 192,
        imageheight: 176,
        tilewidth: TILE_SIZE,
        tileheight: TILE_SIZE,
        tilecount: TOWN_TILE_COUNT,
        columns: 12,
        margin: 0,
        spacing: 0,
      },
      {
        firstgid: TOWN_TILE_COUNT + 1,
        name: 'kenney-tiny-dungeon',
        image: '../sprites/kenney-tiny-dungeon.png',
        imagewidth: 192,
        imageheight: 176,
        tilewidth: TILE_SIZE,
        tileheight: TILE_SIZE,
        tilecount: 132,
        columns: 12,
        margin: 0,
        spacing: 0,
      },
    ],
  };
}

function layerBase(map) {
  return { width: map.width, height: map.height, x: 0, y: 0, opacity: 1, visible: true };
}

// Exterior del pueblo (plaza): zona inicial.
// Casa del jugador al oeste, torre del reloj al norte, tienda al este.
// Salidas: camino al este (granja) y camino al sur (lago).
function plaza() {
  const map = createMap(40, 30);

  addDirt(map, 13, 12, 26, 18); // plaza central
  addDirt(map, 3, 13, 39, 15); // camino principal, sale por el este hacia la granja
  addDirt(map, 19, 19, 21, 29); // camino al sur, hacia el lago
  addDirt(map, 5, 11, 7, 12); // entrada de la casa del jugador
  addDirt(map, 18, 7, 20, 11); // entrada de la torre
  addDirt(map, 30, 11, 32, 12); // entrada de la tienda

  placeBuilding(map, BUILDINGS.casa, 5, 8);
  placeBuilding(map, BUILDINGS.torre, 18, 2);
  placeBuilding(map, BUILDINGS.tienda, 29, 8);
  setTile(map.obstacles, map, 17, 16, TILE.well);
  setTile(map.obstacles, map, 23, 11, TILE.sign);

  map.points.push({ name: 'inicio', x: 20, y: 17 });

  // Borde de árboles, con huecos para las salidas.
  const exits = new Set();
  for (let x = 36; x < 40; x++) for (let y = 13; y <= 15; y++) exits.add(key(x, y));
  for (let y = 26; y < 30; y++) for (let x = 19; x <= 21; x++) exits.add(key(x, y));
  addTrees(map, 0, 0, 39, 1, 100, exits);
  addTrees(map, 0, 28, 39, 29, 100, exits);
  addTrees(map, 0, 0, 1, 29, 100, exits);
  addTrees(map, 38, 0, 39, 29, 100, exits);

  // Arboledas de adorno.
  addTrees(map, 2, 18, 11, 27, 45);
  addTrees(map, 25, 20, 37, 27, 45);
  addTrees(map, 9, 2, 16, 9, 35);
  addTrees(map, 23, 2, 36, 6, 35);
  for (const [x, y] of [[3, 3], [3, 4], [12, 11], [27, 18], [34, 17]]) setTile(map.obstacles, map, x, y, TILE.bush);

  paintGround(map);
  return map;
}

// Casa del jugador: interior más pequeño que la pantalla (HU-09).
// Muros alrededor y la puerta de salida en el muro inferior.
function casa() {
  const map = createMap(12, 9);

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const isWall = x === 0 || y === 0 || x === map.width - 1 || y === map.height - 1;
      if (y === 0) setTile(map.obstacles, map, x, y, INTERIOR.wallTop);
      else if (isWall || y === 1) setTile(map.obstacles, map, x, y, INTERIOR.wall);
      setTile(map.ground, map, x, y, hash(x, y) % 5 === 0 ? INTERIOR.floorDetail : INTERIOR.floor);
    }
  }

  setTile(map.obstacles, map, 6, 8, INTERIOR.door);
  setTile(map.obstacles, map, 2, 1, INTERIOR.shelf);
  setTile(map.obstacles, map, 3, 1, INTERIOR.shelf);
  setTile(map.obstacles, map, 8, 4, INTERIOR.table);
  setTile(map.obstacles, map, 8, 5, INTERIOR.chair);
  setTile(map.obstacles, map, 10, 2, INTERIOR.barrel);

  return map;
}

mkdirSync(OUTPUT_DIR, { recursive: true });
for (const [name, build] of Object.entries({ plaza, casa })) {
  writeFileSync(`${OUTPUT_DIR}/${name}.json`, JSON.stringify(toTiled(build()), null, 1) + '\n');
  console.log(`${OUTPUT_DIR}/${name}.json`);
}
