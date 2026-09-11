import { SoundEngine } from './audio/soundEngine.js';
import { ScoreRenderer } from './score/scoreRenderer.js';
import { NoteReadingExercise, NOTE_NAMES_FR, NOTE_NAMES_EN } from './exercises/noteReading.js';

// Instances
const audio = new SoundEngine();
const renderer = new ScoreRenderer('score-container');
const exercise = new NoteReadingExercise();

// Éléments DOM
const progressEl = document.getElementById('progress-indicator');
const scoreEl = document.getElementById('score-indicator');
const keyboardEl = document.getElementById('keyboard');
const scoreWrapper = document.getElementById('score-wrapper');

// Génération dynamique des touches de réponse
NOTE_NAMES_FR.forEach((nom) => {
  const btn = document.createElement('button');
  btn.className = 'key-btn';
  btn.textContent = nom;
  btn.onclick = () => submitAnswer(nom);
  keyboardEl.appendChild(btn);
});

// Écoute des touches physiques (C, D, E, F, G, A, B)
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
    allowChords: document.getElementById('chords-mode').value === 'chords',
    tempo: parseInt(document.getElementById('tempo-input').value)
  };
}

function startNewSession() {
  const params = getParams();
  const measuresData = exercise.generate(params);
  const beatsPerMeasure = parseInt(params.timeSignature.split('/')[0]);

  renderer.render(measuresData, params.clef, params.timeSignature);
  renderer.highlightNote(exercise.currentIndex, beatsPerMeasure);
  updateHUD();
}

async function submitAnswer(noteName) {
  const result = exercise.validate(noteName);

  if (result.success) {
    audio.playNotes(result.keys);

    if (exercise.isFinished()) {
      updateHUD();
      setTimeout(startNewSession, 300);
      return;
    }

    const params = getParams();
    const beatsPerMeasure = parseInt(params.timeSignature.split('/')[0]);
    renderer.highlightNote(exercise.currentIndex, beatsPerMeasure);
  } else {
    scoreWrapper.classList.add('flash-error');
    setTimeout(() => scoreWrapper.classList.remove('flash-error'), 300);
  }

  updateHUD();
}

// Recalcule la partition si l'écran pivote (Portrait <-> Paysage)
window.addEventListener('resize', () => {
  // Optionnel : redessine avec la nouvelle géométrie d'écran
  const params = getParams();
  if (exercise.sequence.length > 0) {
    const beatsPerMeasure = parseInt(params.timeSignature.split('/')[0]);
    renderer.highlightNote(exercise.currentIndex, beatsPerMeasure);
  }
});

function updateHUD() {
  progressEl.textContent = `${exercise.currentIndex} / ${exercise.sequence.length}`;
  scoreEl.textContent = `${exercise.getScore()}%`;
}

// Initialisation au clic et au chargement
document.getElementById('start-btn').onclick = startNewSession;
window.onload = startNewSession;