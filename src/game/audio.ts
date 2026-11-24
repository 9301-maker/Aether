import { AltitudeLayer, GameSettings, WeaponId } from './types';

export class AudioManager {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;

  private engineOsc: OscillatorNode | null = null;
  private engineGain: GainNode | null = null;
  private engineFilter: BiquadFilterNode | null = null;
  private musicTimer: number | null = null;
  private musicStep = 0;
  private ambientBaseFreq = 65;
  private isEngineRunning = false;

  private settings: GameSettings = {
    masterVolume: 0.75,
    musicVolume: 0.45,
    sfxVolume: 0.85,
    muted: false,
    graphicsQuality: 'AUTO',
    autoFire: false,
  };

  private hasUserGesture = false;
  private adMuted = false;

  unlock(): void {
    this.hasUserGesture = true;
    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        this.ctx = new AudioCtx();
        this.masterGain = this.ctx.createGain();
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();

        this.musicGain.connect(this.masterGain);
        this.sfxGain.connect(this.masterGain);
        this.masterGain.connect(this.ctx.destination);
        this.applyVolumes();
      }
      if (this.ctx.state === 'suspended') {
        void this.ctx.resume();
      }
    } catch {
      // Web Audio unavailable
    }
  }

  updateSettings(settings: GameSettings): void {
    this.settings = settings;
    this.applyVolumes();
  }

  setAdMuted(muted: boolean): void {
    this.adMuted = muted;
    this.applyVolumes();
  }

  private applyVolumes(): void {
    if (!this.ctx || !this.masterGain || !this.musicGain || !this.sfxGain) return;
    const now = this.ctx.currentTime;
    const master = this.settings.muted || this.adMuted ? 0 : this.settings.masterVolume;
    this.masterGain.gain.setTargetAtTime(master, now, 0.04);
    this.musicGain.gain.setTargetAtTime(this.settings.musicVolume, now, 0.04);
    this.sfxGain.gain.setTargetAtTime(this.settings.sfxVolume, now, 0.04);
  }

  setAmbientBaseFreq(freq: number): void {
    this.ambientBaseFreq = Math.max(40, Math.min(180, freq));
  }

  startMusic(): void {
    if (!this.hasUserGesture) return;
    if (!this.ctx || this.musicTimer !== null) return;

    const scale = [1, 1.189, 1.334, 1.498, 1.781, 2];
    this.musicTimer = window.setInterval(() => {
      if (!this.ctx || !this.musicGain || this.ctx.state !== 'running' || this.settings.muted) return;
      const now = this.ctx.currentTime;
      const step = this.musicStep++;

      // Bass pulse
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const filter = this.ctx.createBiquadFilter();
      osc.type = 'sawtooth';
      const noteMult = step % 8 < 4 ? 1 : step % 8 < 6 ? 1.189 : 1.334;
      osc.frequency.setValueAtTime(this.ambientBaseFreq * noteMult, now);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(340, now);
      filter.frequency.exponentialRampToValueAtTime(140, now + 0.22);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.linearRampToValueAtTime(0.11, now + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.24);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(this.musicGain);
      osc.start(now);
      osc.stop(now + 0.25);

      // Arpeggio shimmer every 2nd beat
      if (step % 2 === 0) {
        const arp = this.ctx.createOscillator();
        const arpGain = this.ctx.createGain();
        arp.type = 'triangle';
        const ratio = scale[(step >> 1) % scale.length];
        arp.frequency.setValueAtTime(this.ambientBaseFreq * 4 * ratio, now);

        arpGain.gain.setValueAtTime(0.001, now);
        arpGain.gain.linearRampToValueAtTime(0.05, now + 0.015);
        arpGain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

        arp.connect(arpGain);
        arpGain.connect(this.musicGain);
        arp.start(now);
        arp.stop(now + 0.24);
      }
    }, 240);
  }

  stopMusic(): void {
    if (this.musicTimer !== null) {
      clearInterval(this.musicTimer);
      this.musicTimer = null;
    }
  }

  startEngine(): void {
    if (!this.hasUserGesture) return;
    if (!this.ctx || !this.sfxGain || this.isEngineRunning) return;
    try {
      this.engineOsc = this.ctx.createOscillator();
      this.engineFilter = this.ctx.createBiquadFilter();
      this.engineGain = this.ctx.createGain();

      this.engineOsc.type = 'sawtooth';
      this.engineOsc.frequency.value = 65;

      this.engineFilter.type = 'lowpass';
      this.engineFilter.frequency.value = 260;

      this.engineGain.gain.value = 0.0;

      this.engineOsc.connect(this.engineFilter);
      this.engineFilter.connect(this.engineGain);
      this.engineGain.connect(this.sfxGain);
      this.engineOsc.start();
      this.isEngineRunning = true;
    } catch {
      // ignore
    }
  }

  updateEngine(speedRatio: number, altitude: AltitudeLayer, active: boolean): void {
    if (!this.ctx || !this.engineOsc || !this.engineGain || !this.engineFilter) return;
    const now = this.ctx.currentTime;
    if (!active || this.settings.muted) {
      this.engineGain.gain.setTargetAtTime(0, now, 0.06);
      return;
    }
    const basePitch = altitude === 'GROUND' ? 58 : altitude === 'SKY' ? 92 : 124;
    const targetFreq = basePitch + speedRatio * (altitude === 'GROUND' ? 95 : 140);
    this.engineOsc.frequency.setTargetAtTime(targetFreq, now, 0.08);
    this.engineFilter.frequency.setTargetAtTime(220 + speedRatio * 550, now, 0.08);
    this.engineGain.gain.setTargetAtTime(0.055, now, 0.08);
  }

  stopEngine(): void {
    if (!this.isEngineRunning) return;
    try {
      this.engineOsc?.stop();
      this.engineOsc?.disconnect();
      this.engineFilter?.disconnect();
      this.engineGain?.disconnect();
    } catch {
      // ignore
    }
    this.engineOsc = null;
    this.engineFilter = null;
    this.engineGain = null;
    this.isEngineRunning = false;
  }

  private playTone(
    freqStart: number,
    freqEnd: number,
    duration: number,
    type: OscillatorType,
    volume: number
  ): void {
    if (!this.ctx || !this.sfxGain || this.ctx.state !== 'running' || this.settings.muted) return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = type;
    const jitter = 0.94 + Math.random() * 0.12;
    osc.frequency.setValueAtTime(freqStart * jitter, now);
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, freqEnd * jitter), now + duration);

    gain.gain.setValueAtTime(volume, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + duration + 0.01);
  }

  playUiClick(): void {
    this.unlock();
    this.playTone(720, 480, 0.055, 'sine', 0.12);
  }

  playCoin(combo: number): void {
    const pitchBoost = Math.min(1.5, 1 + (combo - 1) * 0.1);
    this.playTone(880 * pitchBoost, 1320 * pitchBoost, 0.09, 'triangle', 0.14);
  }

  playJump(isDouble: boolean): void {
    this.playTone(isDouble ? 360 : 240, isDouble ? 740 : 520, 0.14, 'sine', 0.16);
  }

  playLand(): void {
    this.playTone(130, 52, 0.1, 'triangle', 0.14);
  }

  playWeapon(weapon: WeaponId): void {
    switch (weapon) {
      case 'PULSE_BLASTER':
        this.playTone(620, 220, 0.08, 'square', 0.09);
        break;
      case 'TWIN_GATLING':
        this.playTone(440, 140, 0.05, 'sawtooth', 0.08);
        break;
      case 'HEAVY_RAILGUN':
        this.playTone(920, 110, 0.18, 'sawtooth', 0.16);
        break;
      case 'SPREAD_SHOT':
      case 'QUAD_BARRAGE':
        this.playTone(540, 180, 0.09, 'triangle', 0.11);
        break;
      case 'HOMING_MISSILE':
        this.playTone(320, 680, 0.16, 'sawtooth', 0.12);
        break;
      case 'PLASMA_WAVE':
        this.playTone(780, 280, 0.13, 'sine', 0.13);
        break;
      case 'NOVA_CANNON':
        this.playTone(960, 95, 0.22, 'sawtooth', 0.16);
        break;
    }
  }

  playHit(): void {
    this.playTone(210, 85, 0.07, 'square', 0.11);
  }

  playCollision(): void {
    this.playTone(145, 38, 0.28, 'sawtooth', 0.26);
  }

  playExplosion(): void {
    this.playTone(180, 32, 0.34, 'sawtooth', 0.22);
  }

  playOverdrive(): void {
    this.playTone(260, 1080, 0.45, 'sawtooth', 0.2);
  }

  playDimensionalShift(): void {
    this.playTone(190, 960, 0.5, 'sine', 0.2);
  }

  playBossWarning(): void {
    this.playTone(220, 140, 0.32, 'sawtooth', 0.22);
  }

  playBossAttack(): void {
    this.playTone(480, 120, 0.22, 'square', 0.16);
  }

  playBossDefeat(): void {
    this.playTone(420, 60, 0.6, 'sawtooth', 0.26);
  }
}

export const audioManager = new AudioManager();
