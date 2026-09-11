export class ScoreRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.measurePositions = [];
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

        this._drawVoiceWithBeams(context, staveTreble, measure.treble, 'treble', timeSig);
        this._drawVoiceWithBeams(context, staveBass, measure.bass, 'bass', timeSig);
      } else {
        const stave = new Stave(xOffset, 35, widthPerMeasure);
        if (idx === 0) {
          stave.addClef(clefMode).addTimeSignature(timeSig);
        }
        stave.setContext(context).draw();
        this._drawVoiceWithBeams(context, stave, measure[clefMode], clefMode, timeSig);
      }

      xOffset += widthPerMeasure;
    });

    this.container.scrollLeft = 0;
  }

  _drawVoiceWithBeams(context, stave, notes, clef, timeSig) {
    if (!notes || notes.length === 0) return;

    const { StaveNote, Dot, Voice, Formatter, Beam } = Vex.Flow;
    const beats = parseInt(timeSig.split('/')[0]);

    const staveNotes = notes.map(n => {
      const isDotted = n.duration.includes('d');
      const cleanDuration = n.duration.replace('d', '');

      const sn = new StaveNote({
        keys: n.keys,
        duration: cleanDuration,
        clef: clef // Impératif pour placer correctement les têtes de notes
      });

      if (isDotted) Dot.buildAndAttach([sn], { all: true });
      return sn;
    });

    // Génération automatique des ligatures pour les croches
    const beams = Beam.generateBeams(staveNotes);

    const voice = new Voice({ num_beats: beats, beat_value: 4 }).setMode(Voice.Mode.SOFT);
    voice.addTickables(staveNotes);

    new Formatter().joinVoices([voice]).formatToStave([voice], stave);
    voice.draw(context, stave);
    beams.forEach(b => b.setContext(context).draw());
  }

  highlightElement(figureIndex, noteMeasureMap) {
    const svgNotes = this.container.querySelectorAll('.vf-stavenote');
    svgNotes.forEach((noteEl, i) => {
      noteEl.querySelectorAll('path').forEach(p => {
        p.style.fill = (i === figureIndex) ? '#0284c7' : '#000000';
      });
    });

    if (noteMeasureMap && noteMeasureMap[figureIndex] !== undefined) {
      const measureIdx = noteMeasureMap[figureIndex];
      const targetX = this.measurePositions[measureIdx] || 0;
      this.container.scrollTo({
        left: Math.max(0, targetX - 20),
        behavior: 'smooth'
      });
    }
  }
}