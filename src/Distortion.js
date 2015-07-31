'use strict';

import Node from './Node';

class Distortion extends Node {

  constructor () {
    super();

    this.waveshaper = this.ctx.createWaveShaper();
    this.distortion = 0.0;

    this.input.conenct(this.waveshaper);
    this.waveshaper.connect(this.output);
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

}

export default Distortion;
