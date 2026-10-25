/**
 * Web Audio API based CPR Metronome, Rhythm Sounds, and Emergency Siren.
 * 100% offline, lightweight, and reliable.
 */

class SoundController {
  private audioCtx: AudioContext | null = null;
  private metronomeTimer: number | null = null;
  private sirenTimer: number | null = null;
  private isSirenActive = false;

  private getAudioContext(): AudioContext {
    if (!this.audioCtx || this.audioCtx.state === 'closed') {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.audioCtx = new AudioCtxClass();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
    return this.audioCtx;
  }

  /**
   * Play a single crisp metronome click
   */
  public playClick(isAccent = false) {
    try {
      const ctx = this.getAudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      const now = ctx.currentTime;
      // High pitch woodblock / electronic metronome sound
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(isAccent ? 1040 : 880, now);
      osc.frequency.exponentialRampToValueAtTime(isAccent ? 220 : 180, now + 0.05);

      gain.gain.setValueAtTime(isAccent ? 0.35 : 0.22, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch {
      // Audio context might fail if user has not interacted with document yet
    }
  }

  /**
   * Start the continuous CPR Metronome at specified BPM (standard 100-120 BPM)
   */
  public startMetronome(bpm: number, onTick?: (count: number) => void) {
    this.stopMetronome();
    let tickCount = 0;
    const intervalMs = (60 / bpm) * 1000;

    // Immediately play first tick
    tickCount++;
    this.playClick(tickCount % 30 === 1);
    onTick?.(tickCount);

    this.metronomeTimer = window.setInterval(() => {
      tickCount++;
      const isCycleStart = tickCount % 30 === 1;
      this.playClick(isCycleStart);
      onTick?.(tickCount);
    }, intervalMs);
  }

  /**
   * Stop the CPR Metronome
   */
  public stopMetronome() {
    if (this.metronomeTimer !== null) {
      clearInterval(this.metronomeTimer);
      this.metronomeTimer = null;
    }
  }

  /**
   * Play an emergency alert chime / siren
   */
  public startEmergencySiren() {
    if (this.isSirenActive) return;
    this.isSirenActive = true;

    try {
      const ctx = this.getAudioContext();
      let high = true;

      const playTone = () => {
        if (!this.isSirenActive) return;
        const now = ctx.currentTime;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(high ? 960 : 770, now);

        gain.gain.setValueAtTime(0.25, now);
        gain.gain.linearRampToValueAtTime(0.25, now + 0.25);
        gain.gain.linearRampToValueAtTime(0.01, now + 0.29);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.3);

        high = !high;
      };

      playTone();
      this.sirenTimer = window.setInterval(playTone, 320);
    } catch {
      this.isSirenActive = false;
    }
  }

  public stopEmergencySiren() {
    this.isSirenActive = false;
    if (this.sirenTimer !== null) {
      clearInterval(this.sirenTimer);
      this.sirenTimer = null;
    }
  }

  public isSirenRunning() {
    return this.isSirenActive;
  }
}

export const soundService = new SoundController();
