import { BaseExercise } from './baseExercise.js';

export const NOTE_NAMES_FR = ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
export const NOTE_NAMES_EN = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];

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

function getPitchValue(keyStr) {
  const [p, oct] = keyStr.split('/');
  const order = { c: 0, d: 1, e: 2, f: 3, g: 4, a: 5, b: 6 };
  return parseInt(oct) * 7 + order[p];
}

export class NoteReadingExercise extends BaseExercise {
  constructor() {
    super();
    this.targets = []; // Liste ordonnée chronologiquement de chaque note cible individuelle
    this.currentTargetIndex = 0;
  }

  generate({ clef, measures, timeSignature, chordsMode }) {
    this.targets = [];
    this.currentTargetIndex = 0;

    const beatsPerMeasure = parseInt(timeSignature.split('/')[0]);
    const measuresData = [];

    for (let m = 0; m < measures; m++) {
      const measureGroup = { treble: [], bass: [] };
      const timeEvents = []; // Collecte des événements avec leur timestamp dans la mesure

      if (clef === 'both') {
        // Génération de motifs complets indépendants pour chaque portée
        const treblePattern = this._getFullMeasurePattern(beatsPerMeasure);
        const bassPattern = this._getFullMeasurePattern(beatsPerMeasure);

        let tOffset = 0;
        treblePattern.forEach(durObj => {
          const elem = this._buildFigure('treble', durObj, chordsMode, m);
          measureGroup.treble.push(elem);
          timeEvents.push({ time: tOffset, clef: 'treble', elem });
          tOffset += durObj.val;
        });

        tOffset = 0;
        bassPattern.forEach(durObj => {
          const elem = this._buildFigure('bass', durObj, chordsMode, m);
          measureGroup.bass.push(elem);
          timeEvents.push({ time: tOffset, clef: 'bass', elem });
          tOffset += durObj.val;
        });
      } else {
        const pattern = this._getFullMeasurePattern(beatsPerMeasure);
        let tOffset = 0;
        pattern.forEach(durObj => {
          const elem = this._buildFigure(clef, durObj, chordsMode, m);
          measureGroup[clef].push(elem);
          timeEvents.push({ time: tOffset, clef: clef, elem });
          tOffset += durObj.val;
        });
      }

      // TRI TEMPOREL STRICT :
      // 1. D'abord par le temps dans la mesure (temps 0, puis temps 1, etc.)
      // 2. À temps égal : priorité à la clé de Fa avant la clé de Sol
      timeEvents.sort((a, b) => {
        if (Math.abs(a.time - b.time) > 0.001) {
          return a.time - b.time;
        }
        if (a.clef === b.clef) return 0;
        return a.clef === 'bass' ? -1 : 1;
      });

      // Aplatissement en cibles individuelles (du bas vers le haut au sein de chaque accord)
      timeEvents.forEach(evt => {
        const { elem } = evt;
        elem.keys.forEach((key, headIdx) => {
          this.targets.push({
            measureIndex: m,
            clef: elem.clef,
            key: key,
            expectedNote: elem.noteNames[headIdx],
            staveNoteRef: elem.staveNoteRef,
            headIndex: headIdx
          });
        });
      });

      measuresData.push(measureGroup);
    }

    return measuresData;
  }

  // Motifs rythmiques garantissant une mesure 100% pleine sans silences
  _getFullMeasurePattern(beats) {
    if (beats === 4) {
      const patterns = [
        [{ dur: 'w', val: 4 }],
        [{ dur: 'h', val: 2 }, { dur: 'h', val: 2 }],
        [{ dur: 'hd', val: 3 }, { dur: 'q', val: 1 }],
        [{ dur: 'q', val: 1 }, { dur: 'h', val: 2 }, { dur: 'q', val: 1 }],
        [{ dur: 'q', val: 1 }, { dur: 'q', val: 1 }, { dur: 'q', val: 1 }, { dur: 'q', val: 1 }],
        [{ dur: '8', val: 0.5 }, { dur: '8', val: 0.5 }, { dur: 'q', val: 1 }, { dur: 'h', val: 2 }]
      ];
      return patterns[Math.floor(Math.random() * patterns.length)];
    } else { // 3/4
      const patterns = [
        [{ dur: 'hd', val: 3 }],
        [{ dur: 'h', val: 2 }, { dur: 'q', val: 1 }],
        [{ dur: 'q', val: 1 }, { dur: 'q', val: 1 }, { dur: 'q', val: 1 }],
        [{ dur: '8', val: 0.5 }, { dur: '8', val: 0.5 }, { dur: 'h', val: 2 }]
      ];
      return patterns[Math.floor(Math.random() * patterns.length)];
    }
  }

  _buildFigure(clef, durObj, chordsMode, measureIdx) {
    const pool = PITCH_POOLS[clef];
    let isChord = (chordsMode === 'chords') || (chordsMode === 'mixed' && Math.random() > 0.6);

    let rawKeys = [];
    if (isChord) {
      const chordSize = Math.floor(Math.random() * 3) + 2; // 2, 3 ou 4 sons
      const startIdx = Math.floor(Math.random() * (pool.length - 7));
      rawKeys.push(pool[startIdx]);

      let offset = startIdx;
      for (let i = 1; i < chordSize; i++) {
        offset += (Math.random() > 0.5 ? 2 : 3);
        if (offset < pool.length) rawKeys.push(pool[offset]);
      }
    } else {
      rawKeys.push(pool[Math.floor(Math.random() * pool.length)]);
    }

    // Tri ascendant strict des hauteurs
    rawKeys.sort((a, b) => getPitchValue(a) - getPitchValue(b));

    const noteNames = rawKeys.map(k => {
      const letter = k.split('/')[0];
      return NOTE_NAMES_FR[NOTE_NAMES_EN.indexOf(letter)];
    });

    const elemRef = {
      keys: rawKeys,
      duration: durObj.dur,
      clef: clef,
      noteNames: noteNames,
      measureIndex: measureIdx,
      staveNoteRef: null // Rempli lors du rendu VexFlow
    };

    return elemRef;
  }

  validate(noteName) {
    this.attempts++;
    const currentTarget = this.targets[this.currentTargetIndex];
    if (!currentTarget) return { success: false };

    if (noteName === currentTarget.expectedNote) {
      const playedKey = currentTarget.key;
      this.currentTargetIndex++;
      return { 
        success: true, 
        key: playedKey,
        isLast: this.currentTargetIndex >= this.targets.length
      };
    } else {
      this.mistakes++;
      return { success: false };
    }
  }

  isFinished() {
    return this.currentTargetIndex >= this.targets.length;
  }
}