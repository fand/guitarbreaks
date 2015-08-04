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
    switch (note) {
    case 5:
      this.samples[0].play(); return;
    case 1:
      this.samples[1].play(); return;
    case 0:
      this.samples[2].play(); return;
    default:
      return;
    }
  }

}

export default Sampler;
