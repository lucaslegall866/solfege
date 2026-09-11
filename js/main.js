import { SoundEngine } from './audio/soundEngine.js';
import { ScoreRenderer } from './score/scoreRenderer.js';
import { NoteReadingExercise, NOTE_NAMES_FR, NOTE_NAMES_EN } from './exercises/noteReading.js';

const audio = new SoundEngine();
const renderer = new ScoreRenderer('score-container');
const exercise = new NoteReadingExercise();

// DOM
const targetSubtextEl = document.getElementById('target-note-subtext');
const scoreEl = document.getElementById('score-indicator');
const keyboardEl = document.getElementById('keyboard');
const scoreWrapper = document.getElementById('score-wrapper');
const resetBtn = document.getElementById('reset-score-btn');

// Métronome DOM
const metroToggleBtn = document.getElementById('metro-toggle-btn');
const metroBpmInput = document.getElementById('metro-bpm');

// Clavier de 7 touches
NOTE_NAMES_FR.forEach((nom) => {
  const btn = document.createElement('button');
  btn.className = 'key-btn';
  btn.textContent = nom;
  btn.onclick = () => submitAnswer(nom);
  keyboardEl.appendChild(btn);
});

// Écoute clavier physique
window.addEventListener('keydown', (e) => {
  const key = e.key.toLowerCase();
  const idx = NOTE_NAMES_EN.indexOf(key);
  if (idx !== -1) submitAnswer(NOTE_NAMES_FR[idx]);
});

function getParams() {
  return {
    clef: document.getElementById('clef-select').value,
    measures: parseInt(document.getElementById('measures-count').value),
    timeSignature: document.getElementById('time-signature').value,
    chordsMode: document.getElementById('chords-mode').value
  };
}

function startNewSession() {
  const params = getParams();
  const measuresData = exercise.generate(params);

  renderer.render(measuresData, params.clef, params.timeSignature);
  renderer.highlightElement(exercise.currentFigureIdx, exercise.noteMeasureMap);
  updateHUD();
}

async function submitAnswer(noteName) {
  const result = exercise.validate(noteName);

  if (result.success) {
    // Joue le son de la note validée
    audio.playNote(result.key);

    if (exercise.isFinished()) {
      updateHUD();
      setTimeout(startNewSession, 250);
      return;
    }

    if (result.completedFigure) {
      renderer.highlightElement(exercise.currentFigureIdx, exercise.noteMeasureMap);
    }
  } else {
    scoreWrapper.classList.add('flash-error');
    setTimeout(() => scoreWrapper.classList.remove('flash-error'), 300);
  }

  updateHUD();
}

function updateHUD() {
  const currentFig = exercise.figures[exercise.currentFigureIdx];
  if (currentFig) {
    const total = currentFig.noteNames.length;
    const current = exercise.currentChordNoteIdx + 1;
    targetSubtextEl.textContent = total > 1 ? `Accord : note ${current}/${total} (du bas)` : `Note seule`;
  }
  scoreEl.textContent = `${exercise.getScore()}%`;
}

// Reset Score
resetBtn.onclick = () => {
  exercise.resetStats();
  updateHUD();
};

// Gestion Métronome Indépendant
metroToggleBtn.onclick = async () => {
  const bpm = parseInt(metroBpmInput.value) || 90;
  const isRunning = await audio.toggleMetronome(bpm);
  metroToggleBtn.textContent = isRunning ? "■" : "▶";
  metroToggleBtn.classList.toggle('active', isRunning);
};

metroBpmInput.addEventListener('change', () => {
  const bpm = parseInt(metroBpmInput.value) || 90;
  audio.setMetronomeBpm(bpm);
});

// Écoute automatique des paramètres de génération (sans le métronome)
['clef-select', 'measures-count', 'time-signature', 'chords-mode'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => startNewSession());
});

window.addEventListener('resize', () => {
  if (exercise.figures.length > 0) {
    const params = getParams();
    renderer.render(exercise.generate(params), params.clef, params.timeSignature);
    renderer.highlightElement(exercise.currentFigureIdx, exercise.noteMeasureMap);
  }
});

// Lancement au chargement
window.onload = startNewSession;