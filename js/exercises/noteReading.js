import { BaseExercise } from './baseExercise.js';

export const NOTE_NAMES_FR = ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si'];
export const NOTE_NAMES_EN = ['c', 'd', 'e', 'f', 'g', 'a', 'b'];

// Ambitus étendu avec lignes supplémentaires (ledger lines)
const EXTENDED_POOLS = {
  // Clé de Sol : de Sol 2 (2 lignes en dessous) à La 4 (2 lignes au-dessus)
  treble: [
    'g/3', 'a/3', 'b/3',
    'c/4', 'd/4', 'e/4', 'f/4', 'g/4', 'a/4', 'b/4',
    'c/5', 'd/5', 'e/5', 'f/5', 'g/5', 'a/5'
  ],
  // Clé de Fa : de Mi 1 (2 lignes en dessous) à Sol 3 (au-dessus)
  bass: [
    'e/2', 'f/2', 'g/2', 'a/2', 'b/2',
    'c/3', 'd/3', 'e/3', 'f/3', 'g/3', 'a/3', 'b/3',
    'c/4', 'd/4', 'e/4'
  ]
};

export class NoteReadingExercise extends BaseExercise {
  constructor() {
    super();
    this.noteMeasureMap = []; // Associe chaque note à l'index de sa mesure
  }

  generate({ clef, measures, timeSignature, chordsMode }) {
    this.sequence = [];
    this.currentIndex = 0;
    this.noteMeasureMap = [];

    const beatsPerMeasure = parseInt(timeSignature.split('/')[0]);
    const measuresData = [];

    for (let m = 0; m < measures; m++) {
      const measureGroup = { treble: [], bass: [] };

      if (clef === 'both') {
        // En double portée : on partage équitablement les temps entre Sol et Fa sans silences
        const rhythmPattern = this._getRandomRhythmPattern(beatsPerMeasure);
        rhythmPattern.forEach(durObj => {
          const activeClef = Math.random() > 0.5 ? 'treble' : 'bass';
          const element = this._createMusicalElement(activeClef, durObj, chordsMode);

          measureGroup[activeClef].push(element);
          this.sequence.push(element.logicalData);
          this.noteMeasureMap.push(m);
        });
      } else {
        const rhythmPattern = this._getRandomRhythmPattern(beatsPerMeasure);
        rhythmPattern.forEach(durObj => {
          const element = this._createMusicalElement(clef, durObj, chordsMode);
          measureGroup[clef].push(element);
          this.sequence.push(element.logicalData);
          this.noteMeasureMap.push(m);
        });
      }

      measuresData.push(measureGroup);
    }

    return measuresData;
  }

  // Découpe une mesure selon des figures de notes variées
  _getRandomRhythmPattern(beats) {
    if (beats === 4) {
      const patterns = [
        [{ dur: 'w', val: 4 }],                                  // Ronde
        [{ dur: 'h', val: 2 }, { dur: 'h', val: 2 }],           // 2 Blanches
        [{ dur: 'hd', val: 3 }, { dur: 'q', val: 1 }],          // Blanche pointée + Noire
        [{ dur: 'q', val: 1 }, { dur: 'h', val: 2 }, { dur: 'q', val: 1 }],
        [{ dur: 'q', val: 1 }, { dur: 'q', val: 1 }, { dur: 'q', val: 1 }, { dur: 'q', val: 1 }], // 4 Noires
        [{ dur: 'h', val: 2 }, { dur: '8', val: 0.5 }, { dur: '8', val: 0.5 }, { dur: 'q', val: 1 }] // Blanche + 2 Croches + Noire
      ];
      return patterns[Math.floor(Math.random() * patterns.length)];
    } else { // 3/4
      const patterns = [
        [{ dur: 'hd', val: 3 }],                                 // Blanche pointée
        [{ dur: 'h', val: 2 }, { dur: 'q', val: 1 }],           // Blanche + Noire
        [{ dur: 'q', val: 1 }, { dur: 'q', val: 1 }, { dur: 'q', val: 1 }], // 3 Noires
        [{ dur: 'q', val: 1 }, { dur: '8', val: 0.5 }, { dur: '8', val: 0.5 }, { dur: 'q', val: 1 }]
      ];
      return patterns[Math.floor(Math.random() * patterns.length)];
    }
  }

  // Crée soit une note isolée, soit un accord (2, 3 ou 4 sons espacés)
  _createMusicalElement(clef, durObj, chordsMode) {
    const pool = EXTENDED_POOLS[clef];
    let isChord = false;

    if (chordsMode === 'chords') isChord = true;
    else if (chordsMode === 'mixed') isChord = Math.random() > 0.6; // 40% de chances d'accord

    let keys = [];
    if (isChord) {
      // Taille de l'accord : 2, 3 ou 4 sons
      const chordSize = Math.floor(Math.random() * 3) + 2; 
      const startIdx = Math.floor(Math.random() * (pool.length - 8));
      keys.push(pool[startIdx]);

      // Espacements réalistes (tierces, quintes, octaves) pour ne pas coller les têtes de notes
      let currentOffset = startIdx;
      for (let i = 1; i < chordSize; i++) {
        currentOffset += (Math.random() > 0.5 ? 2 : 3); // tierce ou quarte
        if (currentOffset < pool.length) {
          keys.push(pool[currentOffset]);
        }
      }
    } else {
      const idx = Math.floor(Math.random() * pool.length);
      keys = [pool[idx]];
    }

    const noteNames = keys.map(k => {
      const letter = k.split('/')[0];
      return NOTE_NAMES_FR[NOTE_NAMES_EN.indexOf(letter)];
    });

    return {
      keys: keys,
      duration: durObj.dur,
      clef: clef,
      logicalData: { keys, noteNames, clef }
    };
  }

  validate(noteName) {
    this.attempts++;
    const currentTarget = this.sequence[this.currentIndex];

    // Valide si la note appartient au groupe
    if (currentTarget && currentTarget.noteNames.includes(noteName)) {
      const playedKeys = currentTarget.keys;
      this.currentIndex++;
      return { success: true, keys: playedKeys };
    } else {
      this.mistakes++;
      return { success: false };
    }
  }

  resetStats() {
    this.attempts = 0;
    this.mistakes = 0;
  }
}