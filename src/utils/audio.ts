// Web Audio API Micro-Synthesizer for high-fidelity tactile UX sounds
// Zero external network dependencies, crystal clear, rich acoustic harmonics, ultra-low latency

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  public enabled: boolean = true;
  private isUnlocked: boolean = false;

  constructor() {
    if (typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem('stock_jahani_sound_enabled');
        if (saved !== null) {
          this.enabled = saved === 'true';
        }
      } catch (e) {}

      // Auto-unlock on first user interaction anywhere on the page
      const unlock = () => {
        this.unlockContext();
        window.removeEventListener('pointerdown', unlock);
        window.removeEventListener('touchstart', unlock);
        window.removeEventListener('keydown', unlock);
      };
      window.addEventListener('pointerdown', unlock, { passive: true });
      window.addEventListener('touchstart', unlock, { passive: true });
      window.addEventListener('keydown', unlock, { passive: true });
    }
  }

  public unlockContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    try {
      if (!this.ctx) {
        const AudioCtx =
          window.AudioContext ||
          (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx) {
        if (this.ctx.state === 'suspended') {
          this.ctx.resume().catch(() => {});
        }
        if (!this.masterGain) {
          this.masterGain = this.ctx.createGain();
          this.masterGain.gain.setValueAtTime(0.35, this.ctx.currentTime);
          this.masterGain.connect(this.ctx.destination);
        }
        this.isUnlocked = true;
      }
    } catch (e) {
      console.warn('AudioContext init notice:', e);
    }
    return this.ctx;
  }

  public setEnabled(val: boolean) {
    this.enabled = val;
    try {
      localStorage.setItem('stock_jahani_sound_enabled', String(val));
    } catch (e) {}
    if (val) {
      this.unlockContext();
    }
  }

  private getContext(): AudioContext | null {
    const ctx = this.unlockContext();
    return ctx;
  }

  // Crisp, tactile mechanical click/pop for buttons & tabs
  public playPop() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx || !this.masterGain) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(580, now);
      osc.frequency.exponentialRampToValueAtTime(180, now + 0.06);

      gain.gain.setValueAtTime(0.3, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.06);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.06);
    } catch (e) {}
  }

  // Clear melodic chime when sound is turned ON or test is run
  public playTestChime() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx || !this.masterGain) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.3, now + i * 0.08 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.35);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.35);
      });
    } catch (e) {}
  }

  // Melodic luxurious chime for adding to cart
  public playCartAdd() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx || !this.masterGain) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const notes = [587.33, 739.99, 880.0, 1174.66]; // D5 -> F#5 -> A5 -> D6
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = i % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.06);

        gain.gain.setValueAtTime(0, now + i * 0.06);
        gain.gain.linearRampToValueAtTime(0.28, now + i * 0.06 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.06 + 0.4);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now + i * 0.06);
        osc.stop(now + i * 0.06 + 0.4);
      });
    } catch (e) {}
  }

  // Sweet upward sparkle sound for wishlist toggle
  public playWishlist() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx || !this.masterGain) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(659.25, now);
      osc.frequency.exponentialRampToValueAtTime(1318.51, now + 0.16);

      gain.gain.setValueAtTime(0.28, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.16);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.16);
    } catch (e) {}
  }

  // Triumphant luxury harp chords for successful purchase
  public playSuccess() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx || !this.masterGain) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.51];
      notes.forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.08);

        gain.gain.setValueAtTime(0, now + i * 0.08);
        gain.gain.linearRampToValueAtTime(0.3, now + i * 0.08 + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.7);

        osc.connect(gain);
        gain.connect(this.masterGain!);

        osc.start(now + i * 0.08);
        osc.stop(now + i * 0.08 + 0.7);
      });
    } catch (e) {}
  }

  // Soft low thud for removing from cart or deletion
  public playRemove() {
    if (!this.enabled) return;
    try {
      const ctx = this.getContext();
      if (!ctx || !this.masterGain) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now);
      osc.frequency.exponentialRampToValueAtTime(70, now + 0.12);

      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

      osc.connect(gain);
      gain.connect(this.masterGain);

      osc.start(now);
      osc.stop(now + 0.12);
    } catch (e) {}
  }

  public playCartRemove() {
    this.playRemove();
  }

  // Loud attention-grabbing store bell/chime for incoming orders
  public playOrderAlert() {
    try {
      const ctx = this.getContext();
      if (!ctx || !this.masterGain) return;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      const now = ctx.currentTime;
      // High-pitch dual chime repeats twice
      const chimeChords = [
        { timeOffset: 0.0, freq1: 659.25, freq2: 987.77 }, // E5 + B5
        { timeOffset: 0.18, freq1: 783.99, freq2: 1318.51 }, // G5 + E6
        { timeOffset: 0.55, freq1: 659.25, freq2: 987.77 }, // Repeat chime
        { timeOffset: 0.73, freq1: 880.0, freq2: 1567.98 }, // A5 + G6
      ];

      chimeChords.forEach(({ timeOffset, freq1, freq2 }) => {
        [freq1, freq2].forEach((freq) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + timeOffset);

          gain.gain.setValueAtTime(0, now + timeOffset);
          gain.gain.linearRampToValueAtTime(0.4, now + timeOffset + 0.02);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + timeOffset + 0.45);

          osc.connect(gain);
          gain.connect(this.masterGain!);

          osc.start(now + timeOffset);
          osc.stop(now + timeOffset + 0.45);
        });
      });
    } catch (e) {
      console.warn('Audio alert error:', e);
    }
  }
}

export const sound = new SoundEngine();
