// Audio alert synthesizer using Web Audio API (zero external assets needed)

class SoundAlertManager {
  private ctx: AudioContext | null = null;
  private isEnabled: boolean = true;

  constructor() {
    // AudioContext will be initialized on first user interaction to comply with browser autoplay policy
  }

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioContextClass) {
          this.ctx = new AudioContextClass();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public setEnabled(enabled: boolean) {
    this.isEnabled = enabled;
  }

  public getEnabled(): boolean {
    return this.isEnabled;
  }

  /**
   * Melodic 2-tone chime when food/drink is marked ready to serve
   * Notes: C5 (523.25 Hz) -> G5 (783.99 Hz)
   */
  public playReadyChime() {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;

      // Note 1: C5
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, now);
      gain1.gain.setValueAtTime(0.001, now);
      gain1.gain.exponentialRampToValueAtTime(0.2, now + 0.04);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.35);

      // Note 2: G5 (Higher pitch)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, now + 0.16);
      gain2.gain.setValueAtTime(0.001, now + 0.16);
      gain2.gain.exponentialRampToValueAtTime(0.25, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.16);
      osc2.stop(now + 0.7);
    } catch (e) {
      console.warn('Audio alert error:', e);
    }
  }

  /**
   * Warning reminder chime for orders approaching 15 - 20 minutes delay
   * Subtle alert: E4 (329.6 Hz) -> A4 (440 Hz)
   */
  public playWarningReminder() {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [
        { freq: 440, start: now, dur: 0.15 },
        { freq: 440, start: now + 0.2, dur: 0.25 },
      ].forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.18, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
      });
    } catch (e) {
      console.warn('Warning chime error:', e);
    }
  }

  /**
   * Critical delay alert chime for orders exceeding 20 minutes
   */
  public playCriticalDelay() {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [
        { freq: 587.33, start: now, dur: 0.12 },
        { freq: 587.33, start: now + 0.18, dur: 0.12 },
        { freq: 880.00, start: now + 0.36, dur: 0.35 },
      ].forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'square';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(0.12, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
      });
    } catch (e) {
      console.warn('Critical chime error:', e);
    }
  }

  /**
   * Energetic triple-bell chime when extra/additional items are added to an existing order (Tambahan Pesanan)
   * Notes: F5 (698.46 Hz) -> A5 (880 Hz) -> C6 (1046.5 Hz)
   */
  public playAdditionalItemChime() {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [
        { freq: 698.46, start: now, dur: 0.2, gainPeak: 0.22 },
        { freq: 880.00, start: now + 0.12, dur: 0.22, gainPeak: 0.24 },
        { freq: 1046.50, start: now + 0.24, dur: 0.5, gainPeak: 0.28 },
      ].forEach(({ freq, start, dur, gainPeak }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
      });
    } catch (e) {
      console.warn('Additional item chime error:', e);
    }
  }

  /**
   * New order incoming chime
   * Notes: E5 (659.25 Hz) -> B5 (987.77 Hz)
   */
  public playNewOrderChime() {
    if (!this.isEnabled) return;
    const ctx = this.getAudioContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      [
        { freq: 659.25, start: now, dur: 0.25, gainPeak: 0.2 },
        { freq: 987.77, start: now + 0.15, dur: 0.45, gainPeak: 0.25 },
      ].forEach(({ freq, start, dur, gainPeak }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.001, start);
        gain.gain.exponentialRampToValueAtTime(gainPeak, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + dur);
      });
    } catch (e) {
      console.warn('New order chime error:', e);
    }
  }
}

export const soundAlerts = new SoundAlertManager();
