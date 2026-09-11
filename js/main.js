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

function getCurrentTargetPayload() {
  const target = exercise.targets[exercise.currentTargetIndex];
  if (!target) return null;
  return {
    figureId: target.elemRef ? target.elemRef.figureId : null,
    staveNoteRef: target.elemRef ? target.elemRef.staveNoteRef : null,
    headIndex: target.headIndex,
    measureIndex: target.measureIndex
  };
}

function startNewSession() {
  const params = getParams();
  const measuresData = exercise.generate(params);

  renderer.render(measuresData, params.clef, params.timeSignature);
  renderer.highlightTargetNote(getCurrentTargetPayload());
  updateHUD();
}

async function submitAnswer(noteName) {
  const result = exercise.validate(noteName);

  if (result.success) {
    audio.playNote(result.key);

    if (exercise.isFinished()) {
      updateHUD();
      setTimeout(startNewSession, 250);
      return;
    }

    renderer.highlightTargetNote(getCurrentTargetPayload());
  } else {
    scoreWrapper.classList.add('flash-error');
    setTimeout(() => scoreWrapper.classList.remove('flash-error'), 300);
  }

  updateHUD();
}

function updateHUD() {
  progressEl.textContent = `${exercise.currentTargetIndex} / ${exercise.targets.length}`;
  scoreEl.textContent = `${exercise.getScore()}%`;
}

// Réinitialisation explicite du score
resetBtn.addEventListener('click', () => {
  exercise.resetStats();
  updateHUD();
});

// Métronome
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

// Écoute automatique des options
['clef-select', 'measures-count', 'time-signature', 'chords-mode'].forEach(id => {
  document.getElementById(id).addEventListener('change', () => startNewSession());
});

window.addEventListener('resize', () => {
  if (exercise.targets.length > 0) {
    const params = getParams();
    renderer.render(exercise.generate(params), params.clef, params.timeSignature);
    renderer.highlightTargetNote(getCurrentTargetPayload());
  }
});

window.onload = startNewSession;