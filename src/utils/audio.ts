/**
 * MR LEGEND 302 - Central Sound Effects and Voice Synthesizer
 * Built entirely with Web Audio API and Web Speech API for guaranteed zero-404 performance.
 */

class SoundSystem {
  private ctx: AudioContext | null = null;
  private masterEnabled: boolean = true;
  private voiceEnabled: boolean = true;
  private uiSoundEnabled: boolean = true;
  private callSoundEnabled: boolean = true;
  private ringtoneInterval: any = null;

  constructor() {
    if (typeof window !== 'undefined') {
      const savedMaster = localStorage.getItem('mrl_sound_master');
      this.masterEnabled = savedMaster !== 'false';

      const savedVoice = localStorage.getItem('mrl_sound_voice');
      this.voiceEnabled = savedVoice !== 'false';

      const savedUi = localStorage.getItem('mrl_sound_ui');
      this.uiSoundEnabled = savedUi !== 'false';

      const savedCall = localStorage.getItem('mrl_sound_call');
      this.callSoundEnabled = savedCall !== 'false';
    }
  }

  private initContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public unlockAudio() {
    const ctx = this.initContext();
    if (ctx && ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    // Play an inaudible subtle pulse to warm up audio pipeline
    if (ctx) {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      gain.gain.value = 0.001;
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    }
  }

  public setMaster(enabled: boolean) {
    this.masterEnabled = enabled;
    localStorage.setItem('mrl_sound_master', String(enabled));
    if (!enabled) this.stopRingtone();
  }

  public setVoice(enabled: boolean) {
    this.voiceEnabled = enabled;
    localStorage.setItem('mrl_sound_voice', String(enabled));
  }

  public setUiSound(enabled: boolean) {
    this.uiSoundEnabled = enabled;
    localStorage.setItem('mrl_sound_ui', String(enabled));
  }

  public setCallSound(enabled: boolean) {
    this.callSoundEnabled = enabled;
    localStorage.setItem('mrl_sound_call', String(enabled));
    if (!enabled) this.stopRingtone();
  }

  public getSettings() {
    return {
      master: this.masterEnabled,
      voice: this.voiceEnabled,
      ui: this.uiSoundEnabled,
      call: this.callSoundEnabled,
    };
  }

  // --- Voice Synthesis ---

  /**
   * Speaks the official welcoming message:
   * "Welcome to MR Legend 302 Website"
   * where 302 is pronounced in Urdu as "تین سو دو" (Teen Sau Do).
   */
  public playWelcomeVoice() {
    if (!this.masterEnabled || !this.voiceEnabled || typeof window === 'undefined') return;

    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();

    // 1. First speak English introductory phrase
    const engUtterance = new SpeechSynthesisUtterance('Welcome to MR Legend');
    engUtterance.rate = 0.95;
    engUtterance.pitch = 1.05;

    // 2. Speak Urdu "تین سو دو" (Teen Sau Do)
    const urduUtterance = new SpeechSynthesisUtterance('تین سو دو ویب سائٹ');
    urduUtterance.lang = 'ur-PK';
    urduUtterance.rate = 0.9;
    urduUtterance.pitch = 1.0;

    // 3. Fallback or complementary English "Website"
    const endUtterance = new SpeechSynthesisUtterance('Website');
    endUtterance.rate = 1.0;

    // Also play luxury arrival chime
    this.playLuxuryFanfare();

    window.speechSynthesis.speak(engUtterance);
    window.speechSynthesis.speak(urduUtterance);
    window.speechSynthesis.speak(endUtterance);
  }

  public playVoiceAnnouncement(text: string, lang = 'en-US') {
    if (!this.masterEnabled || !this.voiceEnabled || typeof window === 'undefined') return;
    if (!('speechSynthesis' in window)) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang;
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  }

  // --- Synthesized Sound Effects ---

  /**
   * Luxury "Ting Ting" Chime (for message send, platform select, action confirmation)
   */
  public playTingTing() {
    if (!this.masterEnabled || !this.uiSoundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Chime 1 (High bell)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(880, now); // A5
    gain1.gain.setValueAtTime(0.25, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.25);

    // Chime 2 (Brighter high chime 70ms later)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(1318.51, now + 0.08); // E6
    gain2.gain.setValueAtTime(0.28, now + 0.08);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.08);
    osc2.stop(now + 0.4);
  }

  /**
   * Subtle glass tactile button click
   */
  public playButtonClick() {
    if (!this.masterEnabled || !this.uiSoundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(150, now + 0.04);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  }

  /**
   * Error Sound 1: "User ID or username not found"
   * Double warning buzzer
   */
  public playUserNotFoundError() {
    if (!this.masterEnabled || !this.uiSoundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    [0, 0.12].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(220, now + offset);
      osc.frequency.exponentialRampToValueAtTime(160, now + offset + 0.08);
      gain.gain.setValueAtTime(0.18, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.08);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + 0.08);
    });

    if (this.voiceEnabled) {
      setTimeout(() => {
        this.playVoiceAnnouncement('User ID or username not found');
      }, 150);
    }
  }

  /**
   * Error Sound 2: "Incorrect password. Please try again."
   * Distinct low dissonant alert
   */
  public playIncorrectPasswordError() {
    if (!this.masterEnabled || !this.uiSoundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc1 = ctx.createOscillator();
    const osc2 = ctx.createOscillator();
    const gain = ctx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'sawtooth';
    osc1.frequency.setValueAtTime(130.81, now); // C3
    osc2.frequency.setValueAtTime(138.59, now); // C#3 (dissonance)

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.28);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(ctx.destination);

    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 0.28);
    osc2.stop(now + 0.28);

    if (this.voiceEnabled) {
      setTimeout(() => {
        this.playVoiceAnnouncement('Incorrect password. Please try again.');
      }, 150);
    }
  }

  /**
   * Registration Success Fanfare
   */
  public playSuccessSound() {
    if (!this.masterEnabled || !this.uiSoundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const notes = [440, 554.37, 659.25, 880]; // A major arpeggio
    notes.forEach((freq, idx) => {
      const start = ctx.currentTime + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.2, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.3);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.3);
    });
  }

  /**
   * Premium Activation Royal Fanfare
   */
  public playPremiumActivation() {
    if (!this.masterEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    // Grand luxury chord progression: C - E - G - B - C high
    const chords = [523.25, 659.25, 783.99, 987.77, 1046.5];
    chords.forEach((freq, idx) => {
      const start = ctx.currentTime + idx * 0.09;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.25, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.5);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.5);
    });

    if (this.voiceEnabled) {
      setTimeout(() => {
        this.playVoiceAnnouncement('Welcome to MR Legend 302 Premium Version!');
      }, 300);
    }
  }

  /**
   * Start Incoming Call Ringtone (Repeats melodic phone chime)
   */
  public startRingtone() {
    if (!this.masterEnabled || !this.callSoundEnabled) return;
    this.stopRingtone();

    const ring = () => {
      const ctx = this.initContext();
      if (!ctx) return;
      const now = ctx.currentTime;
      const notes = [587.33, 739.99, 880, 1174.66]; // D5, F#5, A5, D6
      notes.forEach((f, i) => {
        const start = now + i * 0.09;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(f, start);
        gain.gain.setValueAtTime(0.2, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.22);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.22);
      });
    };

    ring();
    this.ringtoneInterval = setInterval(ring, 2200);
  }

  /**
   * Stop Incoming Call Ringtone
   */
  public stopRingtone() {
    if (this.ringtoneInterval) {
      clearInterval(this.ringtoneInterval);
      this.ringtoneInterval = null;
    }
  }

  /**
   * Call Connected Audio
   */
  public playCallConnected() {
    this.stopRingtone();
    if (!this.masterEnabled || !this.callSoundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.exponentialRampToValueAtTime(880, now + 0.2);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.25);
  }

  /**
   * Call Ended Audio
   */
  public playCallEnded() {
    this.stopRingtone();
    if (!this.masterEnabled || !this.callSoundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.3);
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.35);
  }

  /**
   * Luxury fanfare
   */
  public playLuxuryFanfare() {
    if (!this.masterEnabled || !this.uiSoundEnabled) return;
    const ctx = this.initContext();
    if (!ctx) return;

    const notes = [392.0, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    notes.forEach((freq, idx) => {
      const start = ctx.currentTime + idx * 0.08;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, start);
      gain.gain.setValueAtTime(0.18, start);
      gain.gain.exponentialRampToValueAtTime(0.001, start + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(start);
      osc.stop(start + 0.4);
    });
  }
}

export const sound = new SoundSystem();
