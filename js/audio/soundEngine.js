export class SoundEngine {
  constructor() {
    this.synth = null;
    this.metroSynth = null;
    this.isReady = false;
    this.isMetroRunning = false;
  }

  async init() {
    if (!this.isReady) {
      await Tone.start();

      // Synthé pour les notes
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.005, decay: 0.2, sustain: 0.1, release: 0.6 }
      }).toDestination();

      // Percussion métronome
      this.metroSynth = new Tone.MembraneSynth({
        pitchDecay: 0.01,
        octaves: 2,
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0.05 }
      }).toDestination();
      this.metroSynth.volume.value = -6;

      this.isReady = true;
    }
  }

  async playNote(vexKey, duration = "8n") {
    await this.init();
    // Transforme 'c/4' en 'C4'
    const tonePitch = vexKey.replace('/', '').toUpperCase();
    this.synth.triggerAttackRelease(tonePitch, duration);
  }

  async setMetronomeBpm(bpm) {
    Tone.Transport.bpm.value = bpm;
  }

  async toggleMetronome(bpm, onTick) {
    await this.init();

    if (this.isMetroRunning) {
      Tone.Transport.stop();
      Tone.Transport.cancel();
      this.isMetroRunning = false;
      return false;
    } else {
      Tone.Transport.bpm.value = bpm;
      let beatCount = 0;

      Tone.Transport.scheduleRepeat((time) => {
        const isDownbeat = (beatCount % 4 === 0);
        this.metroSynth.triggerAttackRelease(isDownbeat ? "C5" : "G4", "16n", time);
        if (onTick) onTick(isDownbeat);
        beatCount++;
      }, "4n");

      Tone.Transport.start();
      this.isMetroRunning = true;
      return true;
    }
  }
}