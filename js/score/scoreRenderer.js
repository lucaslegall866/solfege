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
    let figureCounter = 0;

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

        figureCounter = this._drawVoice(context, staveTreble, measure.treble, 'treble', timeSig, figureCounter);
        figureCounter = this._drawVoice(context, staveBass, measure.bass, 'bass', timeSig, figureCounter);
      } else {
        const stave = new Stave(xOffset, 35, widthPerMeasure);
        if (idx === 0) {
          stave.addClef(clefMode).addTimeSignature(timeSig);
        }
        stave.setContext(context).draw();
        figureCounter = this._drawVoice(context, stave, measure[clefMode], clefMode, timeSig, figureCounter);
      }

      xOffset += widthPerMeasure;
    });

    this.container.scrollLeft = 0;
  }

  _drawVoice(context, stave, notes, clef, timeSig, figureCounter) {
    if (!notes || notes.length === 0) return figureCounter;

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

      // On associe un ID unique à l'objet logique pour faire le pont avec le SVG
      n.figureId = `vf-fig-${figureCounter++}`;
      n.staveNoteRef = sn;

      return sn;
    });

    const beams = Beam.generateBeams(staveNotes);
    const voice = new Voice({ num_beats: beats, beat_value: 4 }).setMode(Voice.Mode.SOFT);
    voice.addTickables(staveNotes);

    new Formatter().joinVoices([voice]).formatToStave([voice], stave);
    voice.draw(context, stave);
    beams.forEach(b => b.setContext(context).draw());

    // Injection de l'identifiant sur les éléments du DOM SVG générés par VexFlow
    staveNotes.forEach((sn, i) => {
      const elem = sn.getSVGElement ? sn.getSVGElement() : null;
      if (elem) {
        elem.setAttribute('data-figure-id', notes[i].figureId);
      }
    });

    return figureCounter;
  }

  // Coloration chirurgicale de la note active (noire, blanche, croche, ronde)
  highlightTargetNote(currentTarget) {
    if (!currentTarget) return;

    // 1. Réinitialise toutes les têtes de notes en noir
    const allHeads = this.container.querySelectorAll('.vf-stavenote .vf-notehead');
    allHeads.forEach(headGroup => {
      headGroup.querySelectorAll('path, ellipse').forEach(shape => {
        shape.style.fill = '#000000';
        shape.style.stroke = '#000000';
      });
    });

    // 2. Recherche du groupe SVG de la figure concernée
    const figId = currentTarget.figureId;
    let targetGroup = this.container.querySelector(`[data-figure-id="${figId}"]`);

    // Fallback de sécurité si l'attribut direct a sauté
    if (!targetGroup && currentTarget.staveNoteRef) {
      targetGroup = currentTarget.staveNoteRef.getSVGElement ? currentTarget.staveNoteRef.getSVGElement() : null;
    }

    if (targetGroup) {
      // Les têtes de notes d'un accord sont ordonnées de bas en haut dans VexFlow
      const headNodes = targetGroup.querySelectorAll('.vf-notehead');
      const targetHead = headNodes[currentTarget.headIndex];

      if (targetHead) {
        targetHead.querySelectorAll('path, ellipse').forEach(shape => {
          shape.style.fill = '#0284c7';
          shape.style.stroke = '#0284c7';
        });
      }
    }

    // 3. Défilement fluide vers la mesure en cours
    const measureIdx = currentTarget.measureIndex;
    const targetX = this.measurePositions[measureIdx] || 0;
    this.container.scrollTo({
      left: Math.max(0, targetX - 20),
      behavior: 'smooth'
    });
  }
}