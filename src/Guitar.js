'use strict';

import Sample from './Sample';

class Guitar {

  constructor () {
    this.samples = [new Sample(), new Sample(), new Sample()];
  }

  playNotes (notes) {
    notes.forEach(::this.playNote);
  }

  playNote (note) {
    switch (note) {
    case 5:
      this.samples[0].play();
    case 1:
      this.samples[1].play();
    case 0:
      this.samples[2].play();
    case 9:
      this.goLeft();
    case 8:
      this.goRight();
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
