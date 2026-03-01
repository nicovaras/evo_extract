export class AudioManager {
  private ctx: AudioContext;

  constructor() {
    this.ctx = new AudioContext();
  }

  // Sonido corto de pickup ADN: beep agudo corto
  playPickup(): void { this._beep(880, 0.1, 0.08); }

  // Sonido de crafteo exitoso: dos tonos ascendentes
  playCraft(): void {
    this._beep(440, 0.15, 0.1);
    setTimeout(() => this._beep(660, 0.15, 0.1), 120);
  }

  // Daño recibido: ruido corto grave
  playHurt(): void { this._beep(120, 0.3, 0.15, 'sawtooth'); }

  // Countdown activado: tono de alerta
  playCountdownStart(): void {
    this._beep(550, 0.4, 0.2);
    setTimeout(() => this._beep(550, 0.4, 0.2), 300);
    setTimeout(() => this._beep(770, 0.5, 0.3), 600);
  }

  // Disparo: click corto
  playShoot(): void { this._beep(200, 0.05, 0.05, 'square'); }

  // Muerte enemigo: ruido descendente
  playEnemyDeath(): void { this._sweep(300, 100, 0.2, 0.15); }

  private _beep(freq: number, vol: number, dur: number, type: OscillatorType = 'sine'): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = type;
    osc.frequency.value = freq;
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }

  private _sweep(freqStart: number, freqEnd: number, vol: number, dur: number): void {
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freqStart, this.ctx.currentTime);
    osc.frequency.linearRampToValueAtTime(freqEnd, this.ctx.currentTime + dur);
    gain.gain.setValueAtTime(vol, this.ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + dur);
    osc.start();
    osc.stop(this.ctx.currentTime + dur);
  }
}
