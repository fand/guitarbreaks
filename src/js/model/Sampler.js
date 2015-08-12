'use strict';

import Sample from './Sample';
import Distortion from './Distortion';
import Node from './Node';

class Sampler extends Node {

  constructor () {
    super();

    this.samples = [
      new Sample('./wav/kick_ride.wav'),
      new Sample('./wav/snare.wav'),
      new Sample('./wav/kick_crash.wav'),
    ];

    this.distortions = [
      new Distortion(),
      new Distortion(),
      new Distortion(),
    ];

    this.samples.forEach((s, i) => s.connect(this.distortions[i].input));
    this.distortions.forEach(d => d.connect(this.wet));
  }

  playNotes (notes) {
    notes.forEach(::this.playNote);
  }

  playNote (note) {
    if (!this.samples[note]) { return; }
    this.samples[note].play();
  }

}

export default Sampler;
