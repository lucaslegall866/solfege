export class SoundEngine {
  constructor() {
    this.synth = null;
    this.isReady = false;
  }

  async init() {
    if (!this.isReady) {
      await Tone.start();
      this.synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: "triangle" },
        envelope: { attack: 0.005, decay: 0.25, sustain: 0.1, release: 0.8 }
      }).toDestination();
      this.isReady = true;
    }
  }

  // Joue une note ou un accord au format scientifique ['C4', 'E4']
  async playNotes(notesArray, duration = "8n") {
    await this.init();
    const formattedNotes = notesArray.map(n => n.replace('/', '').toUpperCase());
    this.synth.triggerAttackRelease(formattedNotes, duration);
  }
}