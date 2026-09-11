import { SoundEngine } from './audio/soundEngine.js';
import { ScoreRenderer } from './score/scoreRenderer.js';
import { NoteReadingExercise, NOTE_NAMES_FR, NOTE_NAMES_EN } from './exercises/noteReading.js';

const audio = new SoundEngine();
const renderer = new ScoreRenderer('score-container');
const exercise = new NoteReadingExercise();

// DOM
const progressEl = document.getElementById('progress-indicator');
const scoreEl = document.getElementById('score-indicator');
const keyboardEl = document.getElementById('keyboard');
const scoreWrapper = document.getElementById('score-wrapper');
const resetBtn = document.getElementById('reset-score-btn');

// Initialisation des 7 touches
NOTE_NAMES_FR.forEach((nom) => {
  const btn = document.createElement('button');
  btn.className = 'key-btn';
  btn.textContent = nom;
  btn.onclick = () => submitAnswer(nom);
  keyboardEl.appendChild(btn);
});

// Écoute clavier AZERTY / QWERTY
window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  const idx = NOTE_NAMES_EN.indexOf(key);
  if (idx !== -1) {
    submitAnswer(NOTE_NAMES_FR[idx]);
  }
});

function getParams() {
  return {
    clef: document.getElementById('clef-select').value,
    measures: parseInt(document.getElementById('measures-count').value),
    timeSignature: document.getElementById('time-signature').value,
    chordsMode: document.getElementById('chords-mode').value,
    tempo: parseInt(document.getElementById('tempo-input').value)
  };
}

// Génération automatique
function startNewSession() {
  const params = getParams();
  const measuresData = exercise.generate(params);

  renderer.render(measuresData, params.clef, params.timeSignature);
  renderer.highlightNote(exercise.currentIndex, exercise.noteMeasureMap);
  updateHUD();
}

async function submitAnswer(noteName) {
  const result = exercise.validate(noteName);

  if (result.success) {
    audio.playNotes(result.keys);

    if (exercise.isFinished()) {
      updateHUD();
      setTimeout(startNewSession, 250);
      return;
    }

    renderer.highlightNote(exercise.currentIndex, exercise.noteMeasureMap);
  } else {
    scoreWrapper.classList.add('flash-error');
    setTimeout(() => scoreWrapper.classList.remove('flash-error'), 300);
  }

  updateHUD();
}

function updateHUD() {
  progressEl.textContent = `${exercise.currentIndex} / ${exercise.sequence.length}`;
  scoreEl.textContent = `${exercise.getScore()}%`;
}

// Réinitialisation du score
resetBtn.onclick = () => {
  exercise.resetStats();
  updateHUD();
};

// Écoute automatique de chaque changement de paramètre
['clef-select', 'measures-count', 'time-signature', 'chords-mode', 'tempo-input'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    startNewSession();
  });
});

window.addEventListener('resize', () => {
  if (exercise.sequence.length > 0) {
    const params = getParams();
    renderer.render(exercise.generate(params), params.clef, params.timeSignature);
    renderer.highlightNote(exercise.currentIndex, exercise.noteMeasureMap);
  }
});

// Lancement au chargement
window.onload = startNewSession;