import { BaseExercise } from './baseExercise.js';

export const NOTE_NAMES_FR = ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
export const NOTE_NAMES_EN = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];

const POOLS = {
  treble: ['c/4', 'd/4', 'e/4', 'f/4', 'g/4', 'a/4', 'b/4', 'c/5', 'd/5', 'e/5'],
  bass: ['c/3', 'd/3', 'e/3', 'f/3', 'g/3', 'a/3', 'b/3', 'c/4']
};

export class NoteReadingExercise extends BaseExercise {
  generate({ clef, measures, timeSignature, allowChords }) {
    this.sequence = [];
    this.currentIndex = 0;
    this.attempts = 0;
    this.mistakes = 0;

    const beatsPerMeasure = parseInt(timeSignature.split('/')[0]);
    const measuresData = [];

    for (let m = 0; m < measures; m++) {
      const measureGroup = { treble: [], bass: [] };

      for (let b = 0; b < beatsPerMeasure; b++) {
        const activeClef = (clef === 'both') ? (Math.random() > 0.5 ? 'treble' : 'bass') : clef;
        const pool = POOLS[activeClef];
        let keys = [];

        if (allowChords) {
          const idx = Math.floor(Math.random() * (pool.length - 2));
          keys = [pool[idx], pool[idx + 2]];
        } else {
          const idx = Math.floor(Math.random() * pool.length);
          keys = [pool[idx]];
        }

        const noteNames = keys.map(k => {
          const letter = k.split('/')[0];
          return NOTE_NAMES_FR[NOTE_NAMES_EN.indexOf(letter)];
        });

        this.sequence.push({ keys, noteNames, clef: activeClef });

        measureGroup[activeClef].push({ keys, duration: 'q', clef: activeClef });

        if (clef === 'both') {
          const inactiveClef = activeClef === 'treble' ? 'bass' : 'treble';
          measureGroup[inactiveClef].push({
            keys: [inactiveClef === 'treble' ? 'b/4' : 'd/3'],
            duration: 'qr',
            clef: inactiveClef
          });
        }
      }
      measuresData.push(measureGroup);
    }

    return measuresData;
  }

  validate(noteName) {
    this.attempts++;
    const currentTarget = this.sequence[this.currentIndex];

    // Valide si la note fait partie du groupe (simple ou accord)
    if (currentTarget.noteNames.includes(noteName)) {
      const playedKeys = currentTarget.keys;
      this.currentIndex++;
      return { success: true, keys: playedKeys };
    } else {
      this.mistakes++;
      return { success: false };
    }
  }
}