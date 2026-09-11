import { BaseExercise } from './baseExercise.js';

export const NOTE_NAMES_FR = ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
export const NOTE_NAMES_EN = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];

// Ambitus réaliste
const PITCH_POOLS = {
  treble: [
    'g/3', 'a/3', 'b/3',
    'c/4', 'd/4', 'e/4', 'f/4', 'g/4', 'a/4', 'b/4',
    'c/5', 'd/5', 'e/5', 'f/5', 'g/5', 'a/5'
  ],
  bass: [
    'e/2', 'f/2', 'g/2', 'a/2', 'b/2',
    'c/3', 'd/3', 'e/3', 'f/3', 'g/3', 'a/3', 'b/3',
    'c/4', 'd/4', 'e/4'
  ]
};

// Calcule la valeur absolue d'une note pour garantir un tri strict de bas en haut
function getAbsolutePitchValue(keyStr) {
  const [pitch, octave] = keyStr.split('/');
  const baseOrder = { c: 0, d: 1, e: 2, f: 3, g: 4, a: 5, b: 6 };
  return parseInt(octave) * 7 + baseOrder[pitch];
}

export class NoteReadingExercise extends BaseExercise {
  constructor() {
    super();
    this.figures = [];       // Les figures musicales (accords ou notes uniques)
    this.currentFigureIdx = 0; 
    this.currentChordNoteIdx = 0; // Index de la note en cours DANS l'accord actif
    this.noteMeasureMap = [];
  }

  generate({ clef, measures, timeSignature, chordsMode }) {
    this.figures = [];
    this.currentFigureIdx = 0;
    this.currentChordNoteIdx = 0;
    this.noteMeasureMap = [];

    const beatsPerMeasure = parseInt(timeSignature.split('/')[0]);
    const measuresData = [];

    for (let m = 0; m < measures; m++) {
      const measureGroup = { treble: [], bass: [] };
      const rhythmPattern = this._getRandomRhythmPattern(beatsPerMeasure);

      rhythmPattern.forEach(durObj => {
        const activeClef = (clef === 'both') ? (Math.random() > 0.5 ? 'treble' : 'bass') : clef;
        const elem = this._buildFigure(activeClef, durObj, chordsMode);

        measureGroup[activeClef].push(elem);
        this.figures.push(elem.logicalData);
        this.noteMeasureMap.push(m);
      });

      measuresData.push(measureGroup);
    }

    return measuresData;
  }

  _getRandomRhythmPattern(beats) {
    if (beats === 4) {
      const patterns = [
        [{ dur: 'w', val: 4 }],
        [{ dur: 'h', val: 2 }, { dur: 'h', val: 2 }],
        [{ dur: 'hd', val: 3 }, { dur: 'q', val: 1 }],
        [{ dur: 'q', val: 1 }, { dur: 'q', val: 1 }, { dur: 'q', val: 1 }, { dur: 'q', val: 1 }],
        // Avec ligatures de croches
        [{ dur: '8', val: 0.5 }, { dur: '8', val: 0.5 }, { dur: 'q', val: 1 }, { dur: 'h', val: 2 }]
      ];
      return patterns[Math.floor(Math.random() * patterns.length)];
    } else {
      const patterns = [
        [{ dur: 'hd', val: 3 }],
        [{ dur: 'h', val: 2 }, { dur: 'q', val: 1 }],
        [{ dur: 'q', val: 1 }, { dur: 'q', val: 1 }, { dur: 'q', val: 1 }],
        [{ dur: 'q', val: 1 }, { dur: '8', val: 0.5 }, { dur: '8', val: 0.5 }]
      ];
      return patterns[Math.floor(Math.random() * patterns.length)];
    }
  }

  _buildFigure(clef, durObj, chordsMode) {
    const pool = PITCH_POOLS[clef];
    let isChord = (chordsMode === 'chords') || (chordsMode === 'mixed' && Math.random() > 0.55);

    let rawKeys = [];
    if (isChord) {
      const chordSize = Math.floor(Math.random() * 3) + 2; // 2, 3 ou 4 sons
      const startIdx = Math.floor(Math.random() * (pool.length - 8));
      rawKeys.push(pool[startIdx]);

      let offset = startIdx;
      for (let i = 1; i < chordSize; i++) {
        offset += (Math.random() > 0.5 ? 2 : 3);
        if (offset < pool.length) rawKeys.push(pool[offset]);
      }
    } else {
      rawKeys.push(pool[Math.floor(Math.random() * pool.length)]);
    }

    // TRI OBLIGATOIRE DU BAS VERS LE HAUT
    rawKeys.sort((a, b) => getAbsolutePitchValue(a) - getAbsolutePitchValue(b));

    const noteNames = rawKeys.map(k => {
      const pitchLetter = k.split('/')[0];
      return NOTE_NAMES_FR[NOTE_NAMES_EN.indexOf(pitchLetter)];
    });

    return {
      keys: rawKeys,
      duration: durObj.dur,
      clef: clef,
      logicalData: { keys: rawKeys, noteNames, clef }
    };
  }

  validate(noteName) {
    this.attempts++;
    const currentFig = this.figures[this.currentFigureIdx];
    if (!currentFig) return { success: false, completedFigure: false };

    const expectedNoteName = currentFig.noteNames[this.currentChordNoteIdx];
    const currentKey = currentFig.keys[this.currentChordNoteIdx];

    if (noteName === expectedNoteName) {
      this.currentChordNoteIdx++;
      let figureFinished = false;

      // Si toutes les notes de l'accord ont été validées dans l'ordre
      if (this.currentChordNoteIdx >= currentFig.noteNames.length) {
        this.currentFigureIdx++;
        this.currentChordNoteIdx = 0;
        figureFinished = true;
      }

      return { 
        success: true, 
        key: currentKey, 
        completedFigure: figureFinished,
        totalNotesInChord: currentFig.noteNames.length,
        currentSubIndex: this.currentChordNoteIdx
      };
    } else {
      this.mistakes++;
      return { success: false };
    }
  }

  isFinished() {
    return this.currentFigureIdx >= this.figures.length;
  }
}