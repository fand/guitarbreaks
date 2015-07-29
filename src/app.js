'use strict';

class Sample {

  constructor () {

  }

  play () {

  }

}

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

const guitar = new Guitar();

setInterval(function () {
  const candidates = navigator.getGamepads();
  const pads = Object.keys(candidates).map(k => candidates[k]).filter(p => p);
  pads.forEach(pad => {

    let notes = [];
    pad.buttons.forEach(function (b, i) {
      if (!b.pressed) { return; }
      notes.push(i);
    });

    if (pad.axes[1] < 0.5) {
      guitar.playNotes(notes);
    }
  });
}, 1000);
