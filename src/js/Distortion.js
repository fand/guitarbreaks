'use strict';

import Node from './Node';

class Distortion extends Node {

  constructor () {
    super();

    this.waveshaper = this.ctx.createWaveShaper();
    this.distortion = 0.0;

    this.input.connect(this.waveshaper);
    this.waveshaper.connect(this.output);

    this.updateTable();
  }

  setDistortion (distortion) {
    this.distortion = distortion;
    this.updateTable();
  }

  setVolume (volume) {
    this.output.gain.value = volume;
  }

  updateTable () {
    if ((this.distortion >= 1) && (this.distortion < 3)) {
      const FINE = 2048;
      let table  = new Float32Array(FINE);

      // let k = 2 * this.distortion / (1 - this.distortion);
      for (var i = 0; i < FINE; i++) {
        // LINEAR INTERPOLATION: x := (c - a) * (z - y) / (b - a) + y
        // a = 0, b = 2048, z = 1, y = -1, c = i
        // var x = (i - 0) * (1 - (-1)) / (FINE - 0) + (-1);
        // table[i] = (1 + k) * x / (1+ k * Math.abs(x));

        let x = i - FINE / 2;
        let y = this.distortion * x;
        table[i] = Math.max(Math.max(y, 1.0), -1.0);
      }

      this.waveshaper.curve = table;
    }
  }

}

export default Distortion;
