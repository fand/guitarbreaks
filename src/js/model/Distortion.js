'use strict';

import Node from './Node';

class Distortion extends Node {

  constructor () {
    super();

    this.waveshaper = this.ctx.createWaveShaper();
    this.distortion = 0.0;

    this.limiter                 = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.value = 0;
    this.limiter.ratio.value     = 20;
    this.limiter.attack.value    = 0;

    this.input.connect(this.waveshaper);
    this.waveshaper.connect(this.limiter);
    this.limiter.connect(this.wet);

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
      const HALF = FINE / 2;
      let table  = new Float32Array(FINE);

      const biased = Math.pow(this.distortion, 5);
      for (var i = 0; i < FINE; i++) {
        let x = i - HALF;
        let y = biased * x / HALF;
        table[i] = Math.max(Math.min(y, 1.0), -1.0);
      }

      this.waveshaper.curve = table;
    }
  }

}

export default Distortion;
