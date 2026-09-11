export class ScoreRenderer {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.measurePositions = []; // Coordonnées X de chaque mesure
  }

  // Calcule la largeur idéale d'une mesure selon l'écran disponible
  getVisibleMeasuresConfig() {
    const isPortrait = window.matchMedia("(orientation: portrait)").matches;
    const width = window.innerWidth;

    if (width >= 1024) {
      return { visibleCount: 4, widthPerMeasure: Math.floor((this.container.clientWidth - 40) / 4) };
    } else if (width >= 768 || (!isPortrait && width < 768)) {
      // Ordinateur portable ou Mobile Paysage -> 2 à 3 mesures
      return { visibleCount: 2.5, widthPerMeasure: Math.floor((this.container.clientWidth - 20) / 2.5) };
    } else {
      // Mobile Portrait -> ~1.2 mesure (pour voir le début de la suivante sans déborder)
      return { visibleCount: 1.2, widthPerMeasure: Math.max(200, Math.floor(this.container.clientWidth - 40)) };
    }
  }

  render(measuresData, clefMode, timeSig) {
    this.container.innerHTML = '';
    this.measurePositions = [];

    const { Renderer, Stave } = Vex.Flow;
    const { widthPerMeasure } = this.getVisibleMeasuresConfig();

    const totalWidth = measuresData.length * widthPerMeasure + 60;
    const height = clefMode === 'both' ? 250 : 155;

    const renderer = new Renderer(this.container, Renderer.Backends.SVG);
    renderer.resize(totalWidth, height);
    const context = renderer.getContext();

    let xOffset = 15;

    measuresData.forEach((measure, idx) => {
      this.measurePositions.push(xOffset);

      if (clefMode === 'both') {
        const staveTreble = new Stave(xOffset, 15, widthPerMeasure);
        const staveBass = new Stave(xOffset, 115, widthPerMeasure);

        if (idx === 0) {
          staveTreble.addClef('treble').addTimeSignature(timeSig);
          staveBass.addClef('bass').addTimeSignature(timeSig);
        }

        staveTreble.setContext(context).draw();
        staveBass.setContext(context).draw();

        this._drawVoice(context, staveTreble, measure.treble, 'treble', timeSig);
        this._drawVoice(context, staveBass, measure.bass, 'bass', timeSig);
      } else {
        const stave = new Stave(xOffset, 15, widthPerMeasure);
        if (idx === 0) {
          stave.addClef(clefMode).addTimeSignature(timeSig);
        }
        stave.setContext(context).draw();
        this._drawVoice(context, stave, measure[clefMode], clefMode, timeSig);
      }

      xOffset += widthPerMeasure;
    });

    // Remet le défilement au départ
    this.container.scrollLeft = 0;
  }

  _drawVoice(context, stave, notes, clef, timeSig) {
    const { StaveNote, Voice, Formatter } = Vex.Flow;
    const beats = parseInt(timeSig.split('/')[0]);

    const staveNotes = notes.map(n => new StaveNote({
      keys: n.keys,
      duration: n.duration,
      clef: clef
    }));

    const voice = new Voice({ num_beats: beats, beat_value: 4 }).setMode(Voice.Mode.SOFT);
    voice.addTickables(staveNotes);

    // Marge pour la barre de fin de mesure
    new Formatter().joinVoices([voice]).format([voice], stave.getWidth() - 30);
    voice.draw(context, stave);
  }

  highlightNote(index, beatsPerMeasure) {
    const svgNotes = this.container.querySelectorAll('.vf-stavenote');
    svgNotes.forEach((noteEl, i) => {
      noteEl.querySelectorAll('path').forEach(p => {
        p.style.fill = (i === index) ? '#0284c7' : '#000000';
      });
    });

    // Défilement automatique vers la mesure active
    if (beatsPerMeasure) {
      const currentMeasureIdx = Math.floor(index / beatsPerMeasure);
      const targetX = this.measurePositions[currentMeasureIdx] || 0;

      // Décale pour laisser une petite marge à gauche
      this.container.scrollTo({
        left: Math.max(0, targetX - 20),
        behavior: 'smooth'
      });
    }
  }
}