// Genera la hoja de casillas de agua del lago (public/assets/tilesets/agua.png).
// Uso: node tools/generar-agua.mjs
// Kenney Tiny Town no tiene agua; estas casillas siguen su paleta y su contorno oscuro.
//
// Casillas (16×16), de izquierda a derecha:
// 0 centro · 1 centro con brillo · 2 orilla arriba · 3 orilla abajo · 4 orilla izquierda · 5 orilla derecha
// 6 esquina arriba-izquierda · 7 esquina arriba-derecha · 8 esquina abajo-izquierda · 9 esquina abajo-derecha

import { writeFileSync } from 'node:fs';
import { deflateSync } from 'node:zlib';

const TILE = 16;
const WATER = [76, 151, 214];
const WATER_DARK = [61, 128, 191];
const HIGHLIGHT = [173, 216, 240];
const OUTLINE = [63, 38, 49]; // contorno de Kenney
const FOAM = [214, 236, 245];

// Qué bordes tiene cada casilla: arriba, abajo, izquierda, derecha.
const TILES = [
  { edges: [], sparkle: false },
  { edges: [], sparkle: true },
  { edges: ['top'] },
  { edges: ['bottom'] },
  { edges: ['left'] },
  { edges: ['right'] },
  { edges: ['top', 'left'] },
  { edges: ['top', 'right'] },
  { edges: ['bottom', 'left'] },
  { edges: ['bottom', 'right'] },
];

function renderTile({ edges, sparkle }) {
  const pixels = [];
  for (let y = 0; y < TILE; y++) {
    for (let x = 0; x < TILE; x++) {
      const distance = {
        top: y,
        bottom: TILE - 1 - y,
        left: x,
        right: TILE - 1 - x,
      };
      const nearest = Math.min(...edges.map((edge) => distance[edge]), Infinity);
      let color = (x * 7 + y * 13) % 23 === 0 ? WATER_DARK : WATER;
      // Ondas sencillas: dos trazos horizontales cortos.
      if ((y === 5 && x >= 3 && x <= 6) || (y === 11 && x >= 9 && x <= 12)) color = WATER_DARK;
      if (sparkle && ((y === 4 && x >= 9 && x <= 11) || (y === 10 && x >= 3 && x <= 4))) color = HIGHLIGHT;
      if (nearest === 0) color = OUTLINE;
      else if (nearest === 1) color = FOAM;
      pixels.push(color);
    }
  }
  return pixels;
}

// --- PNG mínimo (RGB, 8 bits) ---

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

function encodePng(width, height, rgbRows) {
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bits por canal
  header[9] = 2; // RGB
  const raw = Buffer.concat(rgbRows.map((row) => Buffer.from([0, ...row.flat()])));
  return Buffer.concat([
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]),
    chunk('IHDR', header),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const tiles = TILES.map(renderTile);
const rows = Array.from({ length: TILE }, (_, y) => tiles.flatMap((pixels) => pixels.slice(y * TILE, (y + 1) * TILE)));
writeFileSync('public/assets/tilesets/agua.png', encodePng(TILE * TILES.length, TILE, rows));
console.log('public/assets/tilesets/agua.png');
