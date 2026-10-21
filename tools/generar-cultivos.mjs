// Genera los gráficos del huerto (HU-41 a HU-44): public/assets/sprites/cultivos.png y los iconos
// del Nabo, la Zanahoria y la Calabaza en public/assets/sprites/objetos/. También el icono de las Moras
// del bosque (HU-50), que tampoco está en los paquetes.
// Uso: node tools/generar-cultivos.mjs
// Ni Kenney ni Ninja Adventure tienen cultivos: estos dibujos siguen la paleta y el contorno oscuro de Kenney.
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

function pixels(drawing) {
  if (drawing.length !== 16 || drawing.some((row) => row.length !== 16)) {
    throw new Error('Cada dibujo debe medir 16×16');
  }
  return drawing.map((row) => [...row].map((char) => (char === '.' ? [0, 0, 0, 0] : [...PALETTE[char], 255])));
}

// Une varios dibujos de 16×16 en una tira horizontal.
function strip(drawings) {
  const all = drawings.map(pixels);
  return Array.from({ length: 16 }, (_, y) => all.flatMap((sprite) => sprite[y]));
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
const files = {
  [`${SPRITES_DIR}/cultivos.png`]: strip([SOIL, SEEDS, SPROUT, GROWING, TURNIP, CARROT, PUMPKIN]),
  [`${SPRITES_DIR}/objetos/nabo.png`]: strip([TURNIP_ICON]),
  [`${SPRITES_DIR}/objetos/zanahoria.png`]: strip([CARROT_ICON]),
  [`${SPRITES_DIR}/objetos/calabaza.png`]: strip([PUMPKIN_ICON]),
  [`${SPRITES_DIR}/objetos/mora.png`]: strip([BERRIES_ICON]),
};
for (const [path, rows] of Object.entries(files)) {
  writeFileSync(path, encodePng(rows));
  console.log(path);
}
