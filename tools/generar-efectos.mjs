// Genera los efectos de sonido provisionales del juego como archivos WAV.
// Uso: node tools/generar-efectos.mjs
// Los archivos se escriben en public/assets/audio/sfx/.

import { mkdirSync, writeFileSync } from 'node:fs';

const SAMPLE_RATE = 22050;
const OUTPUT_DIR = 'public/assets/audio/sfx';

// Cada efecto es una lista de notas: frecuencia en Hz y duración en segundos.
const EFFECTS = {
  // Pitido corto y agudo al moverse entre opciones.
  'menu-navegar': [{ frequency: 880, duration: 0.06 }],
  // Dos notas ascendentes al activar una opción.
  'menu-confirmar': [
    { frequency: 660, duration: 0.07 },
    { frequency: 990, duration: 0.1 },
  ],
  // Campanas de la torre (HU-78): la grande es la más grave y la pequeña, la más aguda.
  'campana-grande': [{ frequency: 262, duration: 1.2, wave: 'bell' }],
  'campana-mediana': [{ frequency: 392, duration: 1.0, wave: 'bell' }],
  'campana-pequena': [{ frequency: 523, duration: 0.9, wave: 'bell' }],
};

// Onda cuadrada suavizada, con un ataque breve y caída exponencial para evitar chasquidos. Las campanas (`bell`)
// son una onda senoidal con armónicos que se apagan despacio.
function renderNote({ frequency, duration, wave }) {
  const length = Math.round(duration * SAMPLE_RATE);
  const samples = new Float32Array(length);
  for (let i = 0; i < length; i++) {
    const t = i / SAMPLE_RATE;
    const attack = Math.min(1, t / 0.005);
    const decay = Math.exp((-4 * t) / duration);
    if (wave === 'bell') {
      const tone = [1, 2.0, 2.76].reduce((sum, ratio, k) => sum + Math.sin(2 * Math.PI * frequency * ratio * t) / (k + 1), 0);
      samples[i] = 0.25 * tone * attack * Math.exp((-3 * t) / duration);
      continue;
    }
    const square = Math.sin(2 * Math.PI * frequency * t) >= 0 ? 1 : -1;
    samples[i] = 0.3 * square * attack * decay;
  }
  return samples;
}

function toWav(samples) {
  const buffer = Buffer.alloc(44 + samples.length * 2);
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + samples.length * 2, 4);
  buffer.write('WAVE', 8);
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // tamaño del bloque fmt
  buffer.writeUInt16LE(1, 20); // PCM
  buffer.writeUInt16LE(1, 22); // mono
  buffer.writeUInt32LE(SAMPLE_RATE, 24);
  buffer.writeUInt32LE(SAMPLE_RATE * 2, 28);
  buffer.writeUInt16LE(2, 32);
  buffer.writeUInt16LE(16, 34);
  buffer.write('data', 36);
  buffer.writeUInt32LE(samples.length * 2, 40);
  samples.forEach((sample, i) => buffer.writeInt16LE(Math.round(sample * 32767), 44 + i * 2));
  return buffer;
}

mkdirSync(OUTPUT_DIR, { recursive: true });
for (const [name, notes] of Object.entries(EFFECTS)) {
  const parts = notes.map(renderNote);
  const samples = new Float32Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  for (const part of parts) {
    samples.set(part, offset);
    offset += part.length;
  }
  writeFileSync(`${OUTPUT_DIR}/${name}.wav`, toWav(samples));
  console.log(`${OUTPUT_DIR}/${name}.wav`);
}
