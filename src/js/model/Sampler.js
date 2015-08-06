'use strict';

import Sample from './Sample';
import Node from './Node';

class Sampler extends Node {

  constructor () {
    super();

    this.samples = [
      new Sample('./wav/kick_ride.wav'),
      new Sample('./wav/snare.wav'),
      new Sample('./wav/kick_crash.wav'),
    ];

    this.samples.forEach(s => s.connect(this.wet));
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
