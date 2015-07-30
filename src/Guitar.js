'use strict';

import Sample from './Sample';

class Guitar {

  constructor () {
    this.ctx = new AudioContext();

    this.samples = [
      new Sample(this.ctx, './wav/kick_ride.wav'),
      new Sample(this.ctx, './wav/snare.wav'),
      new Sample(this.ctx, './wav/kick_crash.wav'),
    ];

    this.waveshaper = this.ctx.createWaveShaper();
    this.distortion = 0.0;

    this.samples.forEach(s => s.connect(this.waveshaper));
    this.waveshaper.connect(this.ctx.destination);

    this.updateTable();
  }

  setDistortion (distortion) {
    this.distortion = distortion;
  }

  updateTable () {
    if ((this.distortion >= 0) && (this.distortion < 1)) {
      const FINE = 4096;
      let table  = [];

      let k = 2 * this.distortion / (1 - this.distortion);
       
      for (var i = 0; i < FINE; i++) {
        // LINEAR INTERPOLATION: x := (c - a) * (z - y) / (b - a) + y
        // a = 0, b = 2048, z = 1, y = -1, c = i
        var x = (i - 0) * (1 - (-1)) / (FINE - 0) + (-1);
        table[i] = (1 + k) * x / (1+ k * Math.abs(x));
      }

      this.waveshaper.curve = table;
    }
  }

  playNotes (notes) {
    console.log(notes);
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
