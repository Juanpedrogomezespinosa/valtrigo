// Genera los gráficos que no están en los paquetes de Kenney ni de Ninja Adventure. Siguen la paleta y el
// contorno oscuro de Kenney:
// - El huerto (HU-41 a HU-44): public/assets/sprites/cultivos.png y los iconos del Nabo, la Zanahoria y la
//   Calabaza en public/assets/sprites/objetos/.
// - El icono de las Moras del bosque (HU-50).
// - El mecanismo del reloj de la torre (HU-56): public/assets/sprites/mecanismo.png.
// - La feria (HU-58): guirnalda.png, poste-guirnalda.png (16×32, los postes de los extremos) y los puestos de la cosecha y de pesca (16×32, el de abajo es el mostrador).
// - La ceremonia (HU-66): escenario.png y podio.png (48×32).
// - Los iconos de la interfaz (HU-80): sol, luna, moneda y rayo (energía), en public/assets/sprites/iconos/.
// - Los puzles: losas.png (HU-77, apagada y encendida), campanas.png (HU-78, grande, mediana y pequeña), caja.png y
//   marca.png (HU-79).
// Uso: node tools/generar-sprites.mjs
//
// cultivos.png: casillas de 16×16, de izquierda a derecha:
// 0 tierra cavada · 1 recién sembrado · 2 brote · 3 creciendo · 4 nabo listo · 5 zanahoria lista · 6 calabaza lista

import { mkdirSync, writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const SPRITES_DIR = 'public/assets/sprites';

// Paleta: cada letra de los dibujos es un color. "." es transparente.
const PALETTE = {
  o: [63, 38, 49], // contorno de Kenney
  d: [168, 106, 62], // tierra cavada
  f: [126, 76, 48], // surco
  h: [196, 132, 82], // borde claro del surco
  s: [236, 206, 128], // semilla
  g: [116, 182, 64], // hoja
  G: [62, 128, 72], // hoja oscura
  w: [240, 234, 222], // nabo
  p: [150, 74, 128], // nabo morado
  r: [236, 128, 44], // zanahoria
  R: [190, 88, 34], // zanahoria oscura
  k: [244, 156, 52], // calabaza
  K: [198, 106, 36], // calabaza oscura
  b: [112, 72, 42], // tallo
  m: [92, 44, 110], // mora
  M: [58, 26, 74], // mora oscura
  l: [190, 140, 210], // brillo de la mora
  W: [146, 96, 58], // madera
  B: [98, 62, 40], // madera oscura
  y: [236, 190, 72], // latón
  Y: [184, 132, 44], // latón oscuro
  x: [214, 72, 64], // toldo y banderín rojos
  u: [72, 132, 214], // toldo y banderín azules
  c: [178, 184, 204], // sombra de la luna
  q: [150, 150, 162], // piedra
  Q: [112, 112, 126], // piedra oscura
  z: [255, 236, 140], // brillo de las losas
};

const SOIL = [
  'dddddddddddddddd',
  'hhhhhhhhhhhhhhhh',
  'ffffffffffffffff',
  'dddddddddddddddd',
  'dddddddddddddddd',
  'hhhhhhhhhhhhhhhh',
  'ffffffffffffffff',
  'dddddddddddddddd',
  'dddddddddddddddd',
  'hhhhhhhhhhhhhhhh',
  'ffffffffffffffff',
  'dddddddddddddddd',
  'dddddddddddddddd',
  'hhhhhhhhhhhhhhhh',
  'ffffffffffffffff',
  'dddddddddddddddd',
];

const SEEDS = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.....os.....os..',
  '................',
  '................',
  '.........os.....',
  '................',
  '...os...........',
  '................',
  '................',
  '................',
  '................',
];

const SPROUT = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '.....oo..oo.....',
  '....oggooggo....',
  '....ogGggGgo....',
  '.....ooGGoo.....',
  '.......oGo......',
  '.......oGo......',
  '........o.......',
  '................',
  '................',
  '................',
];

const GROWING = [
  '................',
  '................',
  '................',
  '....oo....oo....',
  '...oggo..oggo...',
  '...ogggooggGo...',
  '..ooGgggggGo....',
  '.oggoGgGGgGoo...',
  '.ogggoGGGGoggo..',
  '..oGggoGGogggo..',
  '...ooGGGGGGGo...',
  '.....ooGGGoo....',
  '.......oGo......',
  '........o.......',
  '................',
  '................',
];

const TURNIP = [
  '................',
  '.....oo...oo....',
  '....oggo.oggo...',
  '....ogGgoggGo...',
  '.....oGGgGGo....',
  '......oGGGo.....',
  '.....oowwwoo....',
  '....owwwwwwwo...',
  '...owwwwwwwwwo..',
  '...owwwwwwwwwo..',
  '...oppwwwwwwpo..',
  '...opppppppppo..',
  '....opppppppo...',
  '.....oopppoo....',
  '.......opo......',
  '........o.......',
];

const CARROT = [
  '.....oo..oo.....',
  '....oggooggo....',
  '...ogGgggGggo...',
  '...oggGggGgGo...',
  '....ooGGGGoo....',
  '..oo.oGGGGo.oo..',
  '.oggooGGGGooggo.',
  '.ogGGgGGGGgGGgo.',
  '..ooGGGGGGGGoo..',
  '....oorrrrroo...',
  '....orrRrrrro...',
  '....orrrrRrro...',
  '.....orRrrro....',
  '.....orrrrro....',
  '......orRro.....',
  '.......ooo......',
];

const PUMPKIN = [
  '................',
  '................',
  '.......obo......',
  '...oo..obo..oo..',
  '..oggo.obo.oggo.',
  '..ogGooobooGgo..',
  '...ookKkkKkoo...',
  '..okkKkkkkKkko..',
  '.okkkKkkkkKkkko.',
  '.okkkKkkkkKkkko.',
  '.okkkKkkkkKkkko.',
  '.okkkKkkkkKkkko.',
  '.oKkkKkkkkKkkKo.',
  '..oKKKkkkkKKKo..',
  '...ooKKKKKKoo...',
  '.....oooooo.....',
];

// Iconos del inventario y de la tienda.
const TURNIP_ICON = [
  '................',
  '....oo....oo....',
  '...oggo..oggo...',
  '...ogGgooggGo...',
  '....oGGgGGGo....',
  '.....ooGGoo.....',
  '....oowwwwoo....',
  '...owwwwwwwwo...',
  '..owwwwwwwwwwo..',
  '..owwwwwwwwwwo..',
  '..oppwwwwwwwpo..',
  '..opppppppppppo.',
  '...opppppppppo..',
  '....oopppppoo...',
  '......oppo......',
  '.......oo.......',
];

const CARROT_ICON = [
  '..........oo.oo.',
  '.........oggoggo',
  '........oogGgGo.',
  '.......orroGGo..',
  '......orrRroo...',
  '.....orrrrRro...',
  '....orRrrrrro...',
  '....orrrRrro....',
  '...orrrrrrro....',
  '...orrRrrro.....',
  '..orrrrrRo......',
  '..orRrrro.......',
  '.orrrrro........',
  '.orrRoo.........',
  '.oroo...........',
  '..o.............',
];

const PUMPKIN_ICON = [
  '................',
  '.......obo......',
  '.......obo..oo..',
  '...oo..obo.oggo.',
  '..oggooobooGgo..',
  '...ookKkkKkoo...',
  '..okkKkkkkKkko..',
  '.okkkKkkkkKkkko.',
  '.okkkKkkkkKkkko.',
  '.okkkKkkkkKkkko.',
  '.okkkKkkkkKkkko.',
  '.oKkkKkkkkKkkKo.',
  '..oKKKkkkkKKKo..',
  '...ooKKKKKKoo...',
  '.....oooooo.....',
  '................',
];

const BERRIES_ICON = [
  '................',
  '.........oo.....',
  '........oggo....',
  '.......ogGGo....',
  '.....oooGoo.....',
  '....ommMoooo....',
  '...omlmMommmo...',
  '...ommmMomlmMo..',
  '...oMmmoommmMo..',
  '..oommmoMmmMo...',
  '.omlmMMoooooo...',
  '.ommmMo.omlmo...',
  '.oMmmMo.ommMo...',
  '..oMMo..oMMo....',
  '...oo....oo.....',
  '................',
];

// Caja de madera con el engranaje del reloj a la vista.
const MECHANISM = [
  'oooooooooooooooo',
  'oBWWWWWWWWWWWWBo',
  'oWBBBBBBBBBBBBWo',
  'oWBBBBoyyoBBBBWo',
  'oWBBoooyyoooBBWo',
  'oWBByyyYYyyyBBWo',
  'oWBoyYYooYYyoBWo',
  'oWoyyYoBBoYyyoWo',
  'oWoyyYoBBoYyyoWo',
  'oWBoyYYooYYyoBWo',
  'oWBByyyYYyyyBBWo',
  'oWBBoooyyoooBBWo',
  'oWBBBBoyyoBBBBWo',
  'oWBBBBBBBBBBBBWo',
  'oBWWWWWWWWWWWWBo',
  'oooooooooooooooo',
];

// Guirnalda de banderines para la feria (HU-58). Se repite casilla a casilla.
const GARLAND = [
  '................',
  'oo..............',
  '..oo..........oo',
  '....oooooooooo..',
  '....oxxo.ouuo...',
  '.....oxo..ouo...',
  '.....oo....oo...',
  '......o.....o...',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
];

// Poste de madera de la guirnalda (16×32). La casilla de abajo es la del poste; la cuerda de la guirnalda
// (filas 1 a 3 de su casilla) se ata en la parte de arriba, a la altura de la fila 17 del dibujo.
const POST = [
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '................',
  '......oooo......',
  '.....oWWWWo.....',
  '.....oWWWBo.....',
  '......oooo......',
  '......oWBo......',
  '......oWBo......',
  '......oWBo......',
  '......oWBo......',
  '......oWBo......',
  '......oWBo......',
  '......oWBo......',
  '......oWBo......',
  '......oWBo......',
  '......oWBo......',
  '......oWBo......',
  '......oWBo......',
  '.....ooWBoo.....',
  '....oWWWWBBo....',
  '....oooooooo....',
  '................',
];

// Puesto de la feria (16×32): toldo a rayas arriba y mostrador abajo. `a` es el color del toldo.
function stall(a) {
  return [
    '................',
    '................',
    '..oooooooooooo..',
    '.oaawwaawwaawwao',
    'oaawwaawwaawwaao',
    'oaawwaawwaawwaao',
    'oooooooooooooooo',
    '.oaoaoaoaoaoaoa.',
    '..o.o.o.o.o.o...',
    '..oB........Bo..',
    '..oB........Bo..',
    '..oB........Bo..',
    '..oB........Bo..',
    '..oB........Bo..',
    '..oB........Bo..',
    '..oB........Bo..',
    'oooooooooooooooo',
    'oWWWWWWWWWWWWWWo',
    'oBBBBBBBBBBBBBBo',
    'oWWWWWWWWWWWWWWo',
    'oWBWWWWWWWWWWBWo',
    'oWBWWWWWWWWWWBWo',
    'oWBWWWWWWWWWWBWo',
    'oWBWWWWWWWWWWBWo',
    'oWBWWWWWWWWWWBWo',
    'oWBWWWWWWWWWWBWo',
    'oWBWWWWWWWWWWBWo',
    'oWBWWWWWWWWWWBWo',
    'oWBBBBBBBBBBBBWo',
    'oWWWWWWWWWWWWWWo',
    'oooooooooooooooo',
    '................',
  ].map((row) => row.replaceAll('a', a));
}

// Escenario de la ceremonia (48×32): tarima de madera con faldón rojo. El alcalde se dibuja encima.
function stage() {
  const rows = [];
  for (let y = 0; y < 32; y++) {
    let row = '';
    for (let x = 0; x < 48; x++) {
      const edge = x === 0 || x === 47;
      if (y < 12) row += '.';
      else if (y === 12 || y === 31) row += 'o';
      else if (y <= 15) row += edge ? 'o' : x % 8 === 0 ? 'B' : 'W'; // tablas de la tarima
      else if (y === 16) row += 'o';
      else row += edge ? 'o' : x % 6 === 0 ? 'o' : 'x'; // faldón con pliegues
    }
    rows.push(row);
  }
  return rows;
}

// Cifras de 3×5 para el podio.
const DIGITS = {
  1: ['.w.', 'ww.', '.w.', '.w.', 'www'],
  2: ['ww.', '..w', '.w.', 'w..', 'www'],
  3: ['ww.', '..w', '.w.', '..w', 'ww.'],
};

// Podio de la ceremonia (48×32): tres bloques de 16 de ancho. En medio el 1.º (el más alto), a la izquierda
// el 2.º y a la derecha el 3.º. Los ganadores se dibujan encima de cada bloque (HU-66).
const PODIUM_TOPS = { 2: 14, 1: 8, 3: 18 };
function podium() {
  const blocks = [
    { place: 2, x0: 0 },
    { place: 1, x0: 16 },
    { place: 3, x0: 32 },
  ];
  const rows = Array.from({ length: 32 }, () => Array(48).fill('.'));
  for (const { place, x0 } of blocks) {
    const top = PODIUM_TOPS[place];
    for (let y = top; y < 32; y++) {
      for (let x = x0; x < x0 + 16; x++) {
        const edge = y === top || y === 31 || x === x0 || x === x0 + 15;
        rows[y][x] = edge ? 'o' : y < top + 3 ? 'y' : 'W';
      }
    }
    DIGITS[place].forEach((line, dy) => {
      [...line].forEach((char, dx) => {
        if (char !== '.') rows[top + 5 + dy][x0 + 7 + dx - 1] = char;
      });
    });
  }
  return rows.map((row) => row.join(''));
}

// --- Iconos de la interfaz (HU-80) ---

// Dibuja un icono de 16×16 a partir de una función que da el color de cada píxel y le pone el contorno
// oscuro alrededor.
function outlined(color) {
  const rows = Array.from({ length: 16 }, (_, y) => Array.from({ length: 16 }, (_, x) => color(x, y)));
  const filled = (x, y) => rows[y]?.[x] !== undefined && rows[y][x] !== '.' && rows[y][x] !== 'o';
  return rows.map((row, y) =>
    row.map((char, x) => (char === '.' && (filled(x - 1, y) || filled(x + 1, y) || filled(x, y - 1) || filled(x, y + 1)) ? 'o' : char)).join(''),
  );
}
const distance = (x, y, cx, cy) => Math.hypot(x - cx, y - cy);

// Sol: un disco con ocho rayos, que no llevan contorno.
const SUN_RAYS = ['7,0', '8,0', '7,15', '8,15', '0,7', '0,8', '15,7', '15,8', '2,2', '3,3', '13,2', '12,3', '2,13', '3,12', '13,13', '12,12'];
function sun() {
  const disc = outlined((x, y) => (distance(x, y, 7.5, 7.5) <= 4 ? (x + y > 17 ? 'Y' : 'y') : '.'));
  return disc.map((row, y) => [...row].map((char, x) => (SUN_RAYS.includes(`${x},${y}`) ? 'Y' : char)).join(''));
}

// Luna creciente: un disco al que se le quita otro desplazado hacia arriba a la derecha.
function moon() {
  return outlined((x, y) => {
    if (distance(x, y, 7.5, 7.5) > 6 || distance(x, y, 10.5, 5) <= 5) return '.';
    return distance(x, y, 10.5, 5) <= 6.5 ? 'w' : 'c';
  });
}

// Moneda: borde oscuro, cara clara con una marca en el centro y un brillo arriba a la izquierda.
function coin() {
  return outlined((x, y) => {
    const d = distance(x, y, 7.5, 7.5);
    if (d > 6) return '.';
    if (d > 4.6) return 'Y';
    if ((x === 7 || x === 8) && y >= 5 && y <= 10) return 'Y';
    return x + y <= 9 ? 'w' : 'y';
  });
}

const BOLT = [
  '................',
  '.........oooo...',
  '........oyyo....',
  '.......oyyo.....',
  '......oyyo......',
  '.....oyyo.......',
  '....oyyyoooo....',
  '....oyyyyyyo....',
  '....ooooyyo.....',
  '.......oyyo.....',
  '......oyyo......',
  '.....oyyo.......',
  '....oyyo........',
  '...oyyo.........',
  '...ooo..........',
  '................',
];

// --- Puzles (HU-77 a HU-79) ---

// Losa de piedra: borde oscuro y, encendida, un círculo que brilla en el centro.
function slab(lit) {
  return Array.from({ length: 16 }, (_, y) =>
    Array.from({ length: 16 }, (_, x) => {
      if (x === 0 || y === 0 || x === 15 || y === 15) return 'o';
      if (x === 1 || y === 1 || x === 14 || y === 14) return 'Q';
      if (lit && distance(x, y, 7.5, 7.5) <= 3.5) return 'z';
      return (x * 7 + y * 3) % 11 === 0 ? 'Q' : 'q';
    }).join(''),
  );
}

// Campana colgada de una viga de madera. `width` es su anchura en la parte de abajo.
function bell(width) {
  const height = Math.round(width * 0.9);
  const bottom = 14;
  const top = bottom - height;
  return outlined((x, y) => {
    if (y === 1 && x >= 2 && x <= 13) return 'W';
    if (y > 1 && y < top && x >= 7 && x <= 8) return 'B';
    if (y < top || y > bottom) return '.';
    const progress = (y - top) / Math.max(1, height);
    // Copa redondeada arriba y boca ancha abajo.
    const half = progress < 0.5 ? 2 + (width / 2 - 3.5) * Math.sqrt(progress * 2) * 0.6 : 2 + (width / 2 - 2) * (0.3 + 0.7 * Math.pow((progress - 0.5) * 2, 1.6));
    if (Math.abs(x - 7.5) > half) return '.';
    return x < 7.5 ? 'y' : 'Y';
  });
}

// Caja de madera con tablas y una cruz.
function crate() {
  return Array.from({ length: 16 }, (_, y) =>
    Array.from({ length: 16 }, (_, x) => {
      if (x === 0 || y === 0 || x === 15 || y === 15) return 'o';
      if (x === 1 || y === 1 || x === 14 || y === 14) return 'B';
      if (x === y || x === 15 - y) return 'B';
      return y % 5 === 0 ? 'B' : 'W';
    }).join(''),
  );
}

// Marca en el suelo: una cruz roja.
function mark() {
  return Array.from({ length: 16 }, (_, y) =>
    Array.from({ length: 16 }, (_, x) => {
      const onCross = (Math.abs(x - y) <= 1 || Math.abs(x - (15 - y)) <= 1) && x >= 3 && x <= 12 && y >= 3 && y <= 12;
      return onCross ? 'x' : '.';
    }).join(''),
  );
}

function pixels(drawing) {
  if (drawing.length % 16 !== 0 || drawing.some((row) => row.length % 16 !== 0 || row.length !== drawing[0].length)) {
    throw new Error('Cada dibujo debe medir un múltiplo de 16 de ancho y de alto');
  }
  return drawing.map((row) => [...row].map((char) => (char === '.' ? [0, 0, 0, 0] : [...PALETTE[char], 255])));
}

// Une varios dibujos de 16×16 en una tira horizontal.
function strip(drawings) {
  const all = drawings.map(pixels);
  return Array.from({ length: all[0].length }, (_, y) => all.flatMap((sprite) => sprite[y]));
}

// --- PNG mínimo (RGBA, 8 bits) ---

const CRC_TABLE = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = CRC_TABLE[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([length, body, crc]);
}

function encodePng(rows) {
  const width = rows[0].length;
  const height = rows.length;
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bits por canal
  header[9] = 6; // RGBA
  const raw = Buffer.concat(rows.map((row) => Buffer.from([0, ...row.flat()])));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

mkdirSync(`${SPRITES_DIR}/objetos`, { recursive: true });
mkdirSync(`${SPRITES_DIR}/iconos`, { recursive: true });
const files = {
  [`${SPRITES_DIR}/cultivos.png`]: strip([SOIL, SEEDS, SPROUT, GROWING, TURNIP, CARROT, PUMPKIN]),
  [`${SPRITES_DIR}/objetos/nabo.png`]: strip([TURNIP_ICON]),
  [`${SPRITES_DIR}/objetos/zanahoria.png`]: strip([CARROT_ICON]),
  [`${SPRITES_DIR}/objetos/calabaza.png`]: strip([PUMPKIN_ICON]),
  [`${SPRITES_DIR}/objetos/mora.png`]: strip([BERRIES_ICON]),
  [`${SPRITES_DIR}/mecanismo.png`]: strip([MECHANISM]),
  [`${SPRITES_DIR}/guirnalda.png`]: strip([GARLAND]),
  [`${SPRITES_DIR}/poste-guirnalda.png`]: strip([POST]),
  [`${SPRITES_DIR}/puesto-cosecha.png`]: strip([stall('x')]),
  [`${SPRITES_DIR}/puesto-pesca.png`]: strip([stall('u')]),
  [`${SPRITES_DIR}/escenario.png`]: strip([stage()]),
  [`${SPRITES_DIR}/podio.png`]: strip([podium()]),
  [`${SPRITES_DIR}/losas.png`]: strip([slab(false), slab(true)]),
  [`${SPRITES_DIR}/campanas.png`]: strip([bell(14), bell(10), bell(7)]),
  [`${SPRITES_DIR}/caja.png`]: strip([crate()]),
  [`${SPRITES_DIR}/marca.png`]: strip([mark()]),
  [`${SPRITES_DIR}/iconos/sol.png`]: strip([sun()]),
  [`${SPRITES_DIR}/iconos/luna.png`]: strip([moon()]),
  [`${SPRITES_DIR}/iconos/moneda.png`]: strip([coin()]),
  [`${SPRITES_DIR}/iconos/energia.png`]: strip([BOLT]),
};
for (const [path, rows] of Object.entries(files)) {
  writeFileSync(path, encodePng(rows));
  console.log(path);
}
