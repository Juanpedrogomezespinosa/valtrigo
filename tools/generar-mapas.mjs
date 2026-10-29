// Genera la versión inicial de los mapas de las zonas en formato Tiled (JSON).
// Uso: node tools/generar-mapas.mjs
// Los mapas se escriben en public/assets/maps/. Una vez generados, se pueden retocar en Tiled;
// volver a ejecutar este script sobrescribe esos cambios.

import { mkdirSync, writeFileSync } from 'node:fs';

const OUTPUT_DIR = 'public/assets/maps';
const TILE_SIZE = 16;

// Los mapas usan tres hojas: Tiny Town (exteriores), Tiny Dungeon (interiores) y agua (generada por
// tools/generar-agua.mjs). En los mapas, las casillas de cada hoja van después de las de la anterior.
const TOWN_TILE_COUNT = 132;
const DUNGEON_TILE_COUNT = 132;
const WATER_TILE_COUNT = 10;
const dungeon = (index) => TOWN_TILE_COUNT + index;
const water = (index) => TOWN_TILE_COUNT + DUNGEON_TILE_COUNT + index;

// Casillas de agua: centro y orillas (ver tools/generar-agua.mjs).
const WATER = {
  center: water(0),
  sparkle: water(1),
  top: water(2),
  bottom: water(3),
  left: water(4),
  right: water(5),
  topLeft: water(6),
  topRight: water(7),
  bottomLeft: water(8),
  bottomRight: water(9),
};

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
  // Árboles. Los altos ocupan dos casillas: la copa arriba y el resto de la copa con el tronco abajo.
  tallTreeTop: 4,
  tallTreeBottom: 16,
  tallAutumnTreeTop: 3,
  tallAutumnTreeBottom: 15,
  smallTree: 28,
  smallAutumnTree: 27,
  bush: 5,
  well: 104,
  sign: 83,
  noticeBoard: 57,
  // Cercado de piedra clara (granero): esquinas, bordes y suelo.
  penTopLeft: 96,
  penTop: 97,
  penTopRight: 98,
  penLeft: 108,
  penFloor: 109,
  penRight: 110,
  penBottomLeft: 120,
  penBottom: 121,
  penBottomRight: 122,
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
  shopFloor: dungeon(0),
  shelfWide: dungeon(75),
  towerFloor: dungeon(42),
  workbench: dungeon(74),
};

// Edificios: filas de casillas, de arriba abajo. La puerta forma parte de la fila inferior.
const BUILDINGS = {
  casa: [
    [52, 53, 53, 54],
    [64, 65, 65, 66],
    [84, 85, 73, 84],
  ],
  // Granero: no se puede entrar, así que no tiene puerta.
  granero: [
    [52, 53, 53, 53, 54],
    [64, 65, 65, 65, 66],
    [72, 73, 84, 73, 75],
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
    water: new Set(),
    // Casillas con árbol. Cuáles son altos y cuáles pequeños se decide al final (shapeTrees).
    trees: new Set(),
    // Puntos con nombre (inicio y llegadas) y puertas, en casillas.
    points: [],
    doors: [],
  };
}

// Puerta o salida hacia otra zona (HU-08). Se cruza caminando hacia `direction` sobre ella.
function addDoor(map, { x, y, width = 1, height = 1, zone, direction }) {
  map.doors.push({ x, y, width, height, zone, direction });
}

// Puerta de una casa en la que no se puede entrar (HU-70). `house` es su identificador en
// src/data/houses.json. Al caminar hacia ella aparece "La puerta está cerrada".
function addClosedDoor(map, { x, y, house }) {
  map.doors.push({ x, y, width: 1, height: 1, closed: house, direction: 'up' });
}

// Punto donde aparece el personaje al llegar desde otra zona, mirando hacia `facing`.
function addArrival(map, { from, x, y, facing }) {
  map.points.push({ name: `llegada-${from}`, x, y, properties: { mirando: facing } });
}

// Cofre (HU-12). `id` es su identificador en src/data/chests.json.
function addChest(map, { id, x, y }) {
  map.points.push({ name: 'cofre', x, y, properties: { id } });
}

// Cartel (HU-12): casilla sólida en la capa de obstáculos y punto con su `id` en src/data/signs.json.
function addSign(map, { id, x, y }) {
  setTile(map.obstacles, map, x, y, TILE.sign);
  map.points.push({ name: 'cartel', x, y, properties: { id } });
}

// Objeto suelto en el suelo (HU-12). `id` es su identificador en src/data/worldItems.json.
function addWorldItem(map, { id, x, y }) {
  map.points.push({ name: 'objeto', x, y, properties: { id } });
}

// Cama de la casa del jugador (HU-24): ocupa dos casillas de alto a partir de (x, y).
// `despertar` es la casilla junto a la cama donde aparece el personaje al empezar un nuevo día.
function addBed(map, { x, y, wakeX, wakeY }) {
  map.points.push({ name: 'cama', x, y });
  map.points.push({ name: 'despertar', x: wakeX, y: wakeY, properties: { mirando: 'down' } });
}

// Posición de un NPC (HU-10). `character` es su identificador en src/data/dialogues.json.
function addNpc(map, { character, x, y }) {
  map.points.push({ name: 'npc', x, y, properties: { personaje: character } });
}

function addWater(map, x1, y1, x2, y2) {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      if (inside(map, x, y)) map.water.add(key(x, y));
    }
  }
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

// Elige la casilla de agua según qué vecinos son tierra firme, para dibujar la orilla.
function waterTile(map, x, y) {
  const isWater = (nx, ny) => map.water.has(key(nx, ny));
  const top = !isWater(x, y - 1);
  const bottom = !isWater(x, y + 1);
  const left = !isWater(x - 1, y);
  const right = !isWater(x + 1, y);
  if (top && left) return WATER.topLeft;
  if (top && right) return WATER.topRight;
  if (bottom && left) return WATER.bottomLeft;
  if (bottom && right) return WATER.bottomRight;
  if (top) return WATER.top;
  if (bottom) return WATER.bottom;
  if (left) return WATER.left;
  if (right) return WATER.right;
  return hash(x, y) % 6 === 0 ? WATER.sparkle : WATER.center;
}

function paintGround(map) {
  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      // El agua es un obstáculo (HU-07): va en la capa de obstáculos.
      if (map.water.has(key(x, y))) setTile(map.obstacles, map, x, y, waterTile(map, x, y));
      if (map.dirt.has(key(x, y))) {
        setTile(map.ground, map, x, y, dirtTile(map, x, y));
        continue;
      }
      const h = hash(x, y) % 100;
      setTile(map.ground, map, x, y, h < 4 ? TILE.grassFlowers : h < 18 ? TILE.grassDetail : TILE.grass);
    }
  }
}

// Página del diario de la relojera (HU-55). `id` es su identificador en src/data/diary.json.
function addDiaryPage(map, { id, x, y }) {
  map.points.push({ name: 'pagina', x, y, properties: { id } });
}

// Tablón de anuncios (HU-52): casilla sólida en la capa de obstáculos y punto "tablon".
function addNoticeBoard(map, { x, y }) {
  setTile(map.obstacles, map, x, y, TILE.noticeBoard);
  map.points.push({ name: 'tablon', x, y });
}

// Coloca árboles en un rectángulo, sin tapar caminos, edificios ni las casillas reservadas.
function addTrees(map, x1, y1, x2, y2, density, reserved = new Set()) {
  for (let y = y1; y <= y2; y++) {
    for (let x = x1; x <= x2; x++) {
      if (!inside(map, x, y) || map.dirt.has(key(x, y)) || map.water.has(key(x, y)) || reserved.has(key(x, y))) continue;
      if (getTile(map.obstacles, map, x, y) !== -1) continue;
      const h = hash(x + 101, y + 211) % 100;
      if (h < density) {
        setTile(map.obstacles, map, x, y, TILE.smallTree);
        map.trees.add(key(x, y));
      }
    }
  }
}

// Dibuja los árboles: dos casillas de árbol una encima de otra forman un árbol alto (verde u otoñal) y una
// casilla suelta, un árbol pequeño. Solo cambia el dibujo: las casillas con árbol son las mismas.
function shapeTrees(map) {
  for (let x = 0; x < map.width; x++) {
    for (let y = 0; y < map.height; y++) {
      if (!map.trees.has(key(x, y))) continue;
      const autumn = hash(x + 7, y + 13) % 3 === 0;
      if (map.trees.has(key(x, y + 1))) {
        setTile(map.obstacles, map, x, y, autumn ? TILE.tallAutumnTreeTop : TILE.tallTreeTop);
        setTile(map.obstacles, map, x, y + 1, autumn ? TILE.tallAutumnTreeBottom : TILE.tallTreeBottom);
        y++;
      } else {
        setTile(map.obstacles, map, x, y, autumn ? TILE.smallAutumnTree : TILE.smallTree);
      }
    }
  }
  return map;
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
    nextobjectid: map.points.length + map.doors.length + 1,
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
        objects: [
          ...map.points.map((point) => ({
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
            ...(point.properties && {
              properties: Object.entries(point.properties).map(([name, value]) => ({ name, type: 'string', value })),
            }),
          })),
          ...map.doors.map((door) => ({
            name: 'puerta',
            type: '',
            x: door.x * TILE_SIZE,
            y: door.y * TILE_SIZE,
            width: door.width * TILE_SIZE,
            height: door.height * TILE_SIZE,
            rotation: 0,
            visible: true,
            properties: [
              door.closed
                ? { name: 'cerrada', type: 'string', value: door.closed }
                : { name: 'zona', type: 'string', value: door.zone },
              { name: 'direccion', type: 'string', value: door.direction },
            ],
          })),
        ].map((object, index) => ({ id: index + 1, ...object })),
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
        tilecount: DUNGEON_TILE_COUNT,
        columns: 12,
        margin: 0,
        spacing: 0,
      },
      {
        firstgid: TOWN_TILE_COUNT + DUNGEON_TILE_COUNT + 1,
        name: 'agua',
        image: '../tilesets/agua.png',
        imagewidth: WATER_TILE_COUNT * TILE_SIZE,
        imageheight: TILE_SIZE,
        tilewidth: TILE_SIZE,
        tileheight: TILE_SIZE,
        tilecount: WATER_TILE_COUNT,
        columns: WATER_TILE_COUNT,
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
// Salidas: camino al este (granja), camino al sur (lago) y camino al oeste (barrio, HU-70).
function plaza() {
  const map = createMap(40, 30);

  addDirt(map, 13, 12, 26, 18); // plaza central
  addDirt(map, 0, 13, 39, 15); // camino principal, sale por el este hacia la granja y por el oeste hacia el barrio
  addDirt(map, 19, 19, 21, 29); // camino al sur, hacia el lago
  addDirt(map, 5, 11, 7, 12); // entrada de la casa del jugador
  addDirt(map, 18, 7, 20, 11); // entrada de la torre
  addDirt(map, 30, 11, 32, 12); // entrada de la tienda

  placeBuilding(map, BUILDINGS.casa, 5, 8);
  placeBuilding(map, BUILDINGS.torre, 18, 2);
  placeBuilding(map, BUILDINGS.tienda, 29, 8);
  setTile(map.obstacles, map, 17, 16, TILE.well);
  addSign(map, { id: 'plaza', x: 23, y: 11 });
  addSign(map, { id: 'camino-del-lago', x: 18, y: 22 });
  addNoticeBoard(map, { x: 17, y: 11 });
  addDiaryPage(map, { id: 'pagina-1', x: 2, y: 3 }); // en la esquina del noroeste, entre los árboles
  // Feria del día 7 (HU-58): los dos puestos (la casilla es la del mostrador; el toldo queda encima) y una
  // guirnalda a lo largo de la fila 12, sujeta por un poste en cada extremo (casillas 8 y 29; la 29 deja libre
  // la entrada de la tienda). Solo se ven y solo son obstáculos el día de la feria.
  map.points.push({ name: 'puesto', x: 15, y: 14, properties: { tipo: 'cosecha' } });
  map.points.push({ name: 'puesto', x: 19, y: 14, properties: { tipo: 'pesca' } });
  map.points.push({ name: 'guirnalda', x: 8, y: 12, properties: { casillas: '22' } });
  // Ceremonia (HU-66): escenario y podio de 3×2 casillas (el punto es la casilla central de abajo). Los dos son
  // obstáculos. El alcalde sube al escenario.
  map.points.push({ name: 'escenario', x: 22, y: 9 });
  map.points.push({ name: 'podio', x: 27, y: 9 });
  // Visitantes de la feria (HU-58): dónde pasean durante el día y dónde se colocan como público en la ceremonia.
  const strollers = [['rosa', 21, 15], ['lucia', 13, 15], ['tomas', 11, 13], ['pablo', 26, 16], ['fran', 9, 15], ['elena', 24, 16]];
  for (const [character, x, y] of strollers) {
    map.points.push({ name: 'visitante', x, y, properties: { personaje: character } });
  }
  const audience = [['rosa', 20, 11], ['lucia', 21, 11], ['tomas', 25, 11], ['pablo', 26, 11], ['fran', 19, 11], ['elena', 27, 11], ['jugador', 22, 11]];
  for (const [character, x, y] of audience) {
    map.points.push({ name: 'publico', x, y, properties: { personaje: character } });
  }

  map.points.push({ name: 'inicio', x: 20, y: 17 });

  // Puertas de los edificios (se cruzan caminando hacia arriba) y salidas por los caminos.
  addDoor(map, { x: 6, y: 10, zone: 'casa', direction: 'up' });
  addArrival(map, { from: 'casa', x: 6, y: 11, facing: 'down' });
  addDoor(map, { x: 19, y: 6, zone: 'torre', direction: 'up' });
  addArrival(map, { from: 'torre', x: 19, y: 7, facing: 'down' });
  addDoor(map, { x: 31, y: 10, zone: 'tienda', direction: 'up' });
  addArrival(map, { from: 'tienda', x: 31, y: 11, facing: 'down' });
  addDoor(map, { x: 39, y: 13, height: 3, zone: 'granja', direction: 'right' });
  addArrival(map, { from: 'granja', x: 38, y: 14, facing: 'left' });
  addDoor(map, { x: 19, y: 29, width: 3, zone: 'lago', direction: 'down' });
  addArrival(map, { from: 'lago', x: 20, y: 28, facing: 'up' });
  addDoor(map, { x: 0, y: 13, height: 3, zone: 'barrio', direction: 'left' });
  addArrival(map, { from: 'barrio', x: 1, y: 14, facing: 'right' });

  addNpc(map, { character: 'alcalde', x: 24, y: 13 });
  // Vecinos (HU-71). Los de la feria usan los puntos de los visitantes.
  addNpc(map, { character: 'marta', x: 28, y: 14 });

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

// Interior: muros alrededor y la puerta de salida (a la plaza, salvo que se indique otra zona) en el centro del
// muro inferior. Los interiores son más pequeños que la pantalla (HU-09).
function interior(width, height, floor, floorDetail, exitZone = 'plaza') {
  const map = createMap(width, height);

  for (let y = 0; y < map.height; y++) {
    for (let x = 0; x < map.width; x++) {
      const isWall = x === 0 || y === 0 || x === map.width - 1 || y === map.height - 1;
      if (y === 0) setTile(map.obstacles, map, x, y, INTERIOR.wallTop);
      else if (isWall || y === 1) setTile(map.obstacles, map, x, y, INTERIOR.wall);
      setTile(map.ground, map, x, y, hash(x, y) % 5 === 0 ? floorDetail : floor);
    }
  }

  const doorX = Math.floor(width / 2);
  setTile(map.obstacles, map, doorX, height - 1, INTERIOR.door);
  addDoor(map, { x: doorX, y: height - 1, zone: exitZone, direction: 'down' });
  addArrival(map, { from: exitZone, x: doorX, y: height - 2, facing: 'up' });

  return map;
}

// Casa del jugador.
function casa() {
  const map = interior(12, 9, INTERIOR.floor, INTERIOR.floorDetail);
  setTile(map.obstacles, map, 2, 1, INTERIOR.shelf);
  setTile(map.obstacles, map, 3, 1, INTERIOR.shelf);
  setTile(map.obstacles, map, 8, 4, INTERIOR.table);
  setTile(map.obstacles, map, 8, 5, INTERIOR.chair);
  setTile(map.obstacles, map, 10, 2, INTERIOR.barrel);
  addBed(map, { x: 1, y: 3, wakeX: 2, wakeY: 4 });
  return map;
}

// Tienda: estanterías en el muro del fondo y el mostrador en el centro.
function tienda() {
  const map = interior(12, 9, INTERIOR.shopFloor, INTERIOR.shopFloor);
  for (let x = 2; x <= 9; x++) setTile(map.obstacles, map, x, 1, x % 2 === 0 ? INTERIOR.shelf : INTERIOR.shelfWide);
  for (let x = 3; x <= 8; x++) setTile(map.obstacles, map, x, 4, INTERIOR.table);
  setTile(map.obstacles, map, 1, 2, INTERIOR.barrel);
  setTile(map.obstacles, map, 10, 2, INTERIOR.barrel);
  addNpc(map, { character: 'vendedora', x: 9, y: 4 });
  return map;
}

// Torre del reloj: taller de la relojera. En la esquina de abajo a la izquierda hay un pequeño almacén
// tabicado, con la entrada por la derecha, donde está escondido el cofre 2.
function torre() {
  const map = interior(10, 12, INTERIOR.towerFloor, INTERIOR.floor);
  setTile(map.obstacles, map, 2, 1, INTERIOR.shelf);
  setTile(map.obstacles, map, 7, 1, INTERIOR.shelf);
  setTile(map.obstacles, map, 3, 4, INTERIOR.workbench);
  setTile(map.obstacles, map, 8, 2, INTERIOR.barrel);
  addNpc(map, { character: 'relojera', x: 5, y: 5 });

  // Almacén: tabique en la fila 7 (casillas 1 a 3) y en la columna 3 (fila 10), con la entrada en (3, 8-9).
  for (let x = 1; x <= 3; x++) setTile(map.obstacles, map, x, 7, INTERIOR.wall);
  setTile(map.obstacles, map, 3, 10, INTERIOR.wall);
  setTile(map.obstacles, map, 1, 8, INTERIOR.barrel);
  addChest(map, { id: 'cofre-2', x: 1, y: 10 });
  // Mecanismo del reloj (HU-56): obstáculo arriba, en el centro de la sala.
  map.points.push({ name: 'mecanismo', x: 5, y: 2 });
  addDiaryPage(map, { id: 'pagina-5', x: 8, y: 9 });
  return map;
}

// Granja: se llega por el camino del oeste desde la plaza.
// Granero con un cercado delante, y campos de cultivo.
function granja() {
  const map = createMap(30, 22);

  addDirt(map, 0, 10, 14, 12); // camino desde la plaza
  addDirt(map, 5, 9, 7, 9); // entrada del cercado
  addDirt(map, 17, 4, 22, 7); // huerto (HU-41): 6×4 parcelas
  addDirt(map, 17, 14, 22, 17);
  addDirt(map, 24, 4, 27, 17);

  placeBuilding(map, BUILDINGS.granero, 4, 3);
  // Cercado del granero (casillas 4 a 8, filas 6 a 9), con la entrada abajo en el centro.
  const pen = [
    [TILE.penTopLeft, TILE.penTop, TILE.penTop, TILE.penTop, TILE.penTopRight],
    [TILE.penLeft, -1, -1, -1, TILE.penRight],
    [TILE.penLeft, -1, -1, -1, TILE.penRight],
    [TILE.penBottomLeft, TILE.penBottom, -1, TILE.penBottom, TILE.penBottomRight],
  ];
  placeBuilding(map, pen, 4, 6);

  addDoor(map, { x: 0, y: 10, height: 3, zone: 'plaza', direction: 'left' });
  addArrival(map, { from: 'plaza', x: 1, y: 11, facing: 'right' });
  addNpc(map, { character: 'granjero', x: 16, y: 9 });
  addNpc(map, { character: 'lucia', x: 24, y: 6 });
  addNpc(map, { character: 'marta', x: 11, y: 13 });
  addChest(map, { id: 'cofre-1', x: 7, y: 2 }); // detrás del granero, fuera del camino
  addWorldItem(map, { id: 'pala-de-la-granja', x: 10, y: 7 });
  addSign(map, { id: 'granja', x: 3, y: 9 });
  // Huerto (HU-41): punto en su casilla de arriba a la izquierda, con su tamaño en parcelas.
  map.points.push({ name: 'huerto', x: 17, y: 4, properties: { columnas: '6', filas: '4' } });
  // Manzano (HU-45): el punto es la casilla del tronco, que es un obstáculo.
  map.points.push({ name: 'manzano', x: 12, y: 5 });
  addDiaryPage(map, { id: 'pagina-2', x: 26, y: 18 }); // en la esquina del sureste

  const exits = new Set();
  for (let x = 0; x < 2; x++) for (let y = 10; y <= 12; y++) exits.add(key(x, y));
  addTrees(map, 0, 0, 29, 1, 100, exits);
  addTrees(map, 0, 20, 29, 21, 100, exits);
  addTrees(map, 0, 0, 1, 21, 100, exits);
  addTrees(map, 28, 0, 29, 21, 100, exits);
  addTrees(map, 2, 14, 14, 19, 30);

  paintGround(map);
  // Suelo del cercado (por debajo de la capa de obstáculos, que queda vacía en su interior).
  for (let y = 7; y <= 9; y++) for (let x = 5; x <= 7; x++) setTile(map.ground, map, x, y, TILE.penFloor);
  return map;
}

// Lago: se llega por el camino del norte desde la plaza. Bosque alrededor, un claro vacío al este
// y, al suroeste, un sendero estrecho entre los árboles que lleva al cofre 3.
function lago() {
  const map = createMap(30, 22);

  addDirt(map, 14, 0, 16, 6); // camino desde la plaza
  addWater(map, 6, 8, 23, 16);
  for (const [x, y] of [[6, 8], [7, 8], [6, 9], [23, 8], [22, 8], [23, 9], [6, 16], [7, 16], [23, 16], [22, 16]]) {
    map.water.delete(key(x, y));
  }

  addDoor(map, { x: 14, y: 0, width: 3, zone: 'plaza', direction: 'up' });
  addArrival(map, { from: 'plaza', x: 15, y: 1, facing: 'down' });
  // Camino del oeste hacia el bosque (HU-51), desde la orilla hasta el borde del mapa.
  addDirt(map, 0, 11, 4, 12);
  addDoor(map, { x: 0, y: 11, height: 2, zone: 'bosque', direction: 'left' });
  addArrival(map, { from: 'bosque', x: 1, y: 11, facing: 'right' });
  addSign(map, { id: 'lago', x: 13, y: 3 });
  // Por la tarde el granjero pesca en la orilla norte (HU-40). Se puede rodear por la fila de arriba.
  addNpc(map, { character: 'granjero', x: 17, y: 7 });
  addNpc(map, { character: 'pablo', x: 20, y: 17 });
  addNpc(map, { character: 'rosa', x: 25, y: 9 });
  addNpc(map, { character: 'marta', x: 15, y: 4 });

  // Sendero escondido: sale de la orilla en (5, 17) hacia el suroeste y acaba en el cofre (2, 18).
  const hiddenPath = [[4, 17], [3, 17], [3, 18]];
  addChest(map, { id: 'cofre-3', x: 2, y: 18 });
  addDiaryPage(map, { id: 'pagina-3', x: 27, y: 11 }); // en el claro del este, que ya no está vacío

  // Sin árboles: el camino, una franja de una casilla alrededor del lago y el claro del este.
  const reserved = new Set();
  for (let y = 7; y <= 17; y++) for (let x = 5; x <= 24; x++) reserved.add(key(x, y));
  for (let y = 9; y <= 14; y++) for (let x = 25; x <= 27; x++) reserved.add(key(x, y));
  for (let x = 14; x <= 16; x++) for (let y = 0; y < 2; y++) reserved.add(key(x, y));
  for (const [x, y] of [...hiddenPath, [2, 18]]) reserved.add(key(x, y));
  // Alrededor del sendero, bosque cerrado para que no se vea a simple vista. Los árboles bajo la entrada
  // (fila 18) hacen que, al bajar por la orilla, el personaje se pare alineado con el sendero.
  addTrees(map, 2, 15, 4, 19, 100, reserved);
  addTrees(map, 5, 18, 7, 18, 100, reserved);
  addTrees(map, 0, 0, 29, 1, 100, reserved);
  addTrees(map, 0, 20, 29, 21, 100, reserved);
  addTrees(map, 0, 0, 1, 21, 100, reserved);
  addTrees(map, 28, 0, 29, 21, 100, reserved);
  addTrees(map, 2, 2, 27, 19, 40, reserved);

  paintGround(map);
  return map;
}

// Bosque (HU-50 y HU-51): se llega desde el lago por el camino del este. Un camino principal de este a oeste,
// un ramal al norte que lleva a un claro y otro al sur que lleva a otro claro, y un claro pequeño al noreste.
// En los claros y junto a los caminos están los puntos de Setas y Moras y los troncos que se pueden talar.
function bosque() {
  const map = createMap(30, 22);

  addDirt(map, 2, 10, 29, 11); // camino principal
  addDirt(map, 8, 5, 9, 9); // ramal norte
  addDirt(map, 19, 12, 20, 15); // ramal sur
  addDirt(map, 24, 7, 25, 9); // ramal noreste

  addDoor(map, { x: 29, y: 10, height: 2, zone: 'lago', direction: 'right' });
  addArrival(map, { from: 'lago', x: 28, y: 10, facing: 'left' });
  addNpc(map, { character: 'bruno', x: 18, y: 17 });

  // Claros sin árboles.
  const reserved = new Set();
  const clear = (x1, y1, x2, y2) => {
    for (let y = y1; y <= y2; y++) for (let x = x1; x <= x2; x++) reserved.add(key(x, y));
  };
  clear(4, 2, 13, 4); // claro del norte
  clear(14, 16, 25, 18); // claro del sur
  clear(22, 4, 27, 6); // claro del noreste
  clear(3, 12, 5, 13); // junto al camino, al oeste
  clear(12, 12, 14, 12); // junto al camino, al centro
  clear(28, 9, 29, 12); // entrada

  const resources = [
    { id: 'setas-1', tipo: 'setas', x: 5, y: 3 },
    { id: 'setas-2', tipo: 'setas', x: 12, y: 4 },
    { id: 'setas-3', tipo: 'setas', x: 16, y: 17 },
    { id: 'setas-4', tipo: 'setas', x: 26, y: 5 },
    { id: 'moras-1', tipo: 'moras', x: 7, y: 2 },
    { id: 'moras-2', tipo: 'moras', x: 23, y: 17 },
    { id: 'moras-3', tipo: 'moras', x: 4, y: 12 },
    { id: 'tronco-1', tipo: 'tronco', x: 11, y: 2 },
    { id: 'tronco-2', tipo: 'tronco', x: 15, y: 16 },
    { id: 'tronco-3', tipo: 'tronco', x: 22, y: 16 },
    { id: 'tronco-4', tipo: 'tronco', x: 23, y: 5 },
    { id: 'tronco-5', tipo: 'tronco', x: 13, y: 12 },
  ];
  addDiaryPage(map, { id: 'pagina-4', x: 13, y: 2 }); // al fondo del claro del norte
  for (const resource of resources) {
    map.points.push({ name: 'recurso', x: resource.x, y: resource.y, properties: { id: resource.id, tipo: resource.tipo } });
  }

  addTrees(map, 0, 0, 29, 1, 100, reserved);
  addTrees(map, 0, 20, 29, 21, 100, reserved);
  addTrees(map, 0, 0, 1, 21, 100, reserved);
  addTrees(map, 28, 0, 29, 21, 100, reserved);
  addTrees(map, 2, 2, 27, 19, 55, reserved);

  paintGround(map);
  return map;
}

// Barrio (HU-70): se llega por el camino del oeste de la plaza. Cinco casas de vecinos: arriba, la de Tomás y
// Pablo y la de Lucía, en las que se puede entrar; abajo, la de Rosa, la de Fran y la de Elena, cerradas. Cada
// casa tiene un cartel a su izquierda.
function barrio() {
  const map = createMap(30, 22);

  addDirt(map, 2, 10, 29, 12); // calle principal, sale por el este hacia la plaza
  addDirt(map, 5, 8, 7, 9); // entrada de la casa de Tomás y Pablo
  addDirt(map, 15, 8, 17, 9); // entrada de la casa de Lucía
  addDirt(map, 10, 13, 12, 16); // bajada a la calle de abajo
  addDirt(map, 4, 17, 26, 18); // calle de las casas de abajo

  placeBuilding(map, BUILDINGS.casa, 5, 5);
  placeBuilding(map, BUILDINGS.casa, 15, 5);
  placeBuilding(map, BUILDINGS.casa, 5, 14);
  placeBuilding(map, BUILDINGS.casa, 15, 14);
  placeBuilding(map, BUILDINGS.casa, 22, 14);
  addSign(map, { id: 'casa-tomas', x: 4, y: 7 });
  addSign(map, { id: 'casa-lucia', x: 14, y: 7 });
  addSign(map, { id: 'casa-rosa', x: 4, y: 16 });
  addSign(map, { id: 'casa-fran', x: 14, y: 16 });
  addSign(map, { id: 'casa-elena', x: 21, y: 16 });

  addDoor(map, { x: 29, y: 10, height: 3, zone: 'plaza', direction: 'right' });
  addArrival(map, { from: 'plaza', x: 28, y: 11, facing: 'left' });
  addDoor(map, { x: 6, y: 7, zone: 'casa-tomas', direction: 'up' });
  addArrival(map, { from: 'casa-tomas', x: 6, y: 8, facing: 'down' });
  addDoor(map, { x: 16, y: 7, zone: 'casa-lucia', direction: 'up' });
  addArrival(map, { from: 'casa-lucia', x: 16, y: 8, facing: 'down' });
  addClosedDoor(map, { x: 6, y: 16, house: 'casa-rosa' });
  addClosedDoor(map, { x: 16, y: 16, house: 'casa-fran' });
  addClosedDoor(map, { x: 23, y: 16, house: 'casa-elena' });

  // Vecinos (HU-71).
  addNpc(map, { character: 'tomas', x: 9, y: 8 });
  addNpc(map, { character: 'bigotes', x: 9, y: 9 });
  addNpc(map, { character: 'pablo', x: 13, y: 11 });
  addNpc(map, { character: 'lucia', x: 19, y: 8 });
  addNpc(map, { character: 'fran', x: 11, y: 18 });
  addNpc(map, { character: 'elena', x: 20, y: 11 });
  addNpc(map, { character: 'marta', x: 24, y: 11 });

  // Borde de árboles, con el hueco de la salida, y arboledas de adorno.
  const exits = new Set();
  for (let x = 28; x < 30; x++) for (let y = 10; y <= 12; y++) exits.add(key(x, y));
  addTrees(map, 0, 0, 29, 1, 100, exits);
  addTrees(map, 0, 20, 29, 21, 100, exits);
  addTrees(map, 0, 0, 1, 21, 100, exits);
  addTrees(map, 28, 0, 29, 21, 100, exits);
  addTrees(map, 21, 2, 27, 8, 40);
  addTrees(map, 27, 13, 27, 19, 40);
  addTrees(map, 2, 2, 13, 3, 35);
  for (const [x, y] of [[8, 4], [18, 4], [3, 9], [9, 13]]) setTile(map.obstacles, map, x, y, TILE.bush);

  paintGround(map);
  return map;
}

// Casa de Tomás y Pablo (HU-70).
function casaTomas() {
  const map = interior(12, 9, INTERIOR.floor, INTERIOR.floorDetail, 'barrio');
  setTile(map.obstacles, map, 2, 1, INTERIOR.shelf);
  setTile(map.obstacles, map, 9, 1, INTERIOR.shelf);
  setTile(map.obstacles, map, 5, 4, INTERIOR.table);
  setTile(map.obstacles, map, 6, 4, INTERIOR.table);
  setTile(map.obstacles, map, 5, 5, INTERIOR.chair);
  setTile(map.obstacles, map, 1, 6, INTERIOR.barrel);
  addNpc(map, { character: 'tomas', x: 3, y: 3 });
  addNpc(map, { character: 'pablo', x: 8, y: 3 });
  addNpc(map, { character: 'bigotes', x: 9, y: 6 });
  return map;
}

// Casa de Lucía (HU-70).
function casaLucia() {
  const map = interior(10, 8, INTERIOR.floor, INTERIOR.floorDetail, 'barrio');
  setTile(map.obstacles, map, 2, 1, INTERIOR.shelf);
  setTile(map.obstacles, map, 6, 3, INTERIOR.table);
  setTile(map.obstacles, map, 7, 3, INTERIOR.chair);
  setTile(map.obstacles, map, 8, 1, INTERIOR.barrel);
  addNpc(map, { character: 'lucia', x: 3, y: 3 });
  return map;
}

mkdirSync(OUTPUT_DIR, { recursive: true });
for (const [name, build] of Object.entries({ plaza, casa, tienda, torre, granja, lago, bosque, barrio, 'casa-tomas': casaTomas, 'casa-lucia': casaLucia })) {
  writeFileSync(`${OUTPUT_DIR}/${name}.json`, JSON.stringify(toTiled(shapeTrees(build())), null, 1) + '\n');
  console.log(`${OUTPUT_DIR}/${name}.json`);
}
