export class ScoreRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.measurePositions = [];
    this.currentRenderedNotes = []; // Toutes les StaveNotes affichées
  }

  getMeasureWidth(numMeasures) {
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    const clientWidth = this.container.clientWidth || window.innerWidth - 30;

    if (window.innerWidth >= 1024) {
      return Math.max(260, Math.floor((clientWidth - 40) / Math.min(numMeasures, 4)));
    } else if (window.innerWidth >= 768 || (!isPortrait && window.innerWidth < 768)) {
      return Math.max(240, Math.floor((clientWidth - 20) / 2.5));
    } else {
      return Math.max(220, Math.floor(clientWidth - 25));
    }
  }

  render(measuresData, clefMode, timeSig) {
    this.container.innerHTML = '';
    this.measurePositions = [];
    this.currentRenderedNotes = [];

    const { Renderer, Stave } = Vex.Flow;
    const widthPerMeasure = this.getMeasureWidth(measuresData.length);
    const totalWidth = measuresData.length * widthPerMeasure + 50;
    const height = clefMode === 'both' ? 300 : 190;

    const renderer = new Renderer(this.container, Renderer.Backends.SVG);
    renderer.resize(totalWidth, height);
    const context = renderer.getContext();

    let xOffset = 15;

    measuresData.forEach((measure, idx) => {
      this.measurePositions.push(xOffset);

      if (clefMode === 'both') {
        const staveTreble = new Stave(xOffset, 25, widthPerMeasure);
        const staveBass = new Stave(xOffset, 155, widthPerMeasure);

        if (idx === 0) {
          staveTreble.addClef('treble').addTimeSignature(timeSig);
          staveBass.addClef('bass').addTimeSignature(timeSig);
        }

        staveTreble.setContext(context).draw();
        staveBass.setContext(context).draw();

        this._drawVoice(context, staveTreble, measure.treble, 'treble', timeSig);
        this._drawVoice(context, staveBass, measure.bass, 'bass', timeSig);
      } else {
        const stave = new Stave(xOffset, 35, widthPerMeasure);
        if (idx === 0) {
          stave.addClef(clefMode).addTimeSignature(timeSig);
        }
        stave.setContext(context).draw();
        this._drawVoice(context, stave, measure[clefMode], clefMode, timeSig);
      }

      xOffset += widthPerMeasure;
    });

    this.container.scrollLeft = 0;
  }

  _drawVoice(context, stave, notes, clef, timeSig) {
    if (!notes || notes.length === 0) return;

    const { StaveNote, Dot, Voice, Formatter, Beam } = Vex.Flow;
    const beats = parseInt(timeSig.split('/')[0]);

    const staveNotes = notes.map(n => {
      const isDotted = n.duration.includes('d');
      const cleanDuration = n.duration.replace('d', '');

      const sn = new StaveNote({
        keys: n.keys,
        duration: cleanDuration,
        clef: clef
      });

      if (isDotted) Dot.buildAndAttach([sn], { all: true });
      n.staveNoteRef = sn; // Référence conservée
      this.currentRenderedNotes.push(sn);
      return sn;
    });

    const beams = Beam.generateBeams(staveNotes);
    const voice = new Voice({ num_beats: beats, beat_value: 4 }).setMode(Voice.Mode.SOFT);
    voice.addTickables(staveNotes);

    new Formatter().joinVoices([voice]).formatToStave([voice], stave);
    voice.draw(context, stave);
    beams.forEach(b => b.setContext(context).draw());
  }

  // Coloration chirurgicale de la seule tête de note ciblée dans le SVG
  highlightTargetNote(currentTarget) {
    if (!currentTarget) return;

    // 1. Réinitialiser toutes les têtes de notes en noir
    const allNoteHeads = this.container.querySelectorAll('.vf-notehead path');
    allNoteHeads.forEach(head => {
      head.style.fill = '#000000';
      head.style.stroke = '#000000';
    });

    // 2. Cibler la StaveNote active
    const sn = currentTarget.staveNoteRef;
    if (sn) {
      // VexFlow expose getSVGElement() ou stocke ses têtes dans sn.note_heads
      const noteSvg = sn.getSVGElement ? sn.getSVGElement() : null;
      if (noteSvg) {
        const headsInChord = noteSvg.querySelectorAll('.vf-notehead path');
        // VexFlow stocke les têtes de bas en haut (index 0 = note la plus basse)
        if (headsInChord && headsInChord[currentTarget.headIndex]) {
          const targetPath = headsInChord[currentTarget.headIndex];
          targetPath.style.fill = '#0284c7';
          targetPath.style.stroke = '#0284c7';
        }
      }
    }

    // 3. Défilement automatique vers la mesure correspondante
    const measureIdx = currentTarget.measureIndex;
    const targetX = this.measurePositions[measureIdx] || 0;
    this.container.scrollTo({
      left: Math.max(0, targetX - 20),
      behavior: 'smooth'
    });
  }
}