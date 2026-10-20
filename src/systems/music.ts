const OVERLAP = 2; // segundos de solapamiento

// Con la pestaña en segundo plano, el navegador puede retrasar los setTimeout hasta un minuto.
// Programar con este margen evita cortes en la música mientras tanto.
const LOOKAHEAD = 70; // segundos

// Reproduce una pista en bucle, solapando el final de cada vuelta con el principio de la siguiente.
export class LoopingTrack {
  private ctx: AudioContext;
  private buffer: AudioBuffer;
  private output: AudioNode;
  private nextStart = 0;
  private timer: ReturnType<typeof setTimeout> | undefined;
  private instances: { src: AudioBufferSourceNode; gain: GainNode }[] = [];

  constructor(ctx: AudioContext, buffer: AudioBuffer, output: AudioNode) {
    if (buffer.duration <= OVERLAP * 2) {
      throw new Error(`La pista dura ${buffer.duration} s; necesita más de ${OVERLAP * 2} s para el solapamiento.`);
    }
    this.ctx = ctx;
    this.buffer = buffer;
    this.output = output;
  }

  play() {
    this.nextStart = this.ctx.currentTime + 0.05;
    this.schedule();
  }

  // Baja el volumen hasta cero en `fade` segundos y detiene la pista.
  stop(fade = OVERLAP) {
    clearTimeout(this.timer);
    const now = this.ctx.currentTime;
    for (const { src, gain } of this.instances) {
      gain.gain.cancelScheduledValues(now);
      gain.gain.setValueAtTime(gain.gain.value, now);
      gain.gain.linearRampToValueAtTime(0, now + fade);
      src.stop(now + fade);
    }
    this.instances = [];
  }

  private schedule() {
    // Programa las instancias por adelantado, para no depender del hilo principal.
    while (this.nextStart < this.ctx.currentTime + LOOKAHEAD) {
      this.startInstance(this.nextStart);
      this.nextStart += this.buffer.duration - OVERLAP;
    }
    this.timer = setTimeout(() => this.schedule(), 1000);
  }

  private startInstance(at: number) {
    const src = this.ctx.createBufferSource();
    const gain = this.ctx.createGain();
    src.buffer = this.buffer;
    src.connect(gain).connect(this.output);

    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(1, at + OVERLAP);
    gain.gain.setValueAtTime(1, at + this.buffer.duration - OVERLAP);
    gain.gain.linearRampToValueAtTime(0, at + this.buffer.duration);

    const instance = { src, gain };
    this.instances.push(instance);
    src.onended = () => {
      this.instances = this.instances.filter((other) => other !== instance);
    };

    src.start(at);
  }
}
