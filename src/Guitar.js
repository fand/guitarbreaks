'use strict';

import Sample from './Sample';
import Node from './Node';

class Guitar extends Node {

  constructor () {
    super();

    this.samples = [
      new Sample(this.ctx, './wav/kick_ride.wav'),
      new Sample(this.ctx, './wav/snare.wav'),
      new Sample(this.ctx, './wav/kick_crash.wav'),
    ];

    this.samples.forEach(s => s.connect(this.output));

    this.updateTable();
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
    case 9:
      this.goLeft(); return;
    case 8:
      this.goRight(); return;
    default:
      return;
    }
  }

  goLeft () {

  }

  goRight () {

  }

}

export default Guitar;
