'use strict';

import ctx from './Ctx';

class Node {

  constructor () {
    this.ctx = ctx;
    this.input  = this.ctx.createGain();
    this.output = this.ctx.createGain();
    this.dry    = this.ctx.createGain();
    this.wet    = this.ctx.createGain();

    this.input.connect(this.dry);
    this.dry.connect(this.output);
    this.wet.connect(this.output);

    this.dryGain = 0.0;
    this.wetGain = 1.0;
    this.updateMix(this.dryGain, this.wetGain);

    this.isOn = true;
  }

  connect (dst) {
    this.output.connect(dst);
  }

  disconnect (dst) {
    this.output.disconnect(dst);
  }

  setMix (wet) {
    if (wet < 0 || 1.0 < wet) {
      throw new RangeError('setMix : wet must be 0.0 to 1.0');
    }
    this.wetGain = wet;
    this.dryGain = 1.0 - wet;
    this.updateMix(this.wetGain, this.dryGain);
  }

  updateMix (dry, wet) {
    this.dry.gain.value = dry;
    this.wet.gain.value = wet;
  }

  toggle () {
    this.isOn = !this.isOn;
    if (this.isOn) {
      this.updateMix(this.dryGain, this.wetGain);
    }
    else {
      this.updateMix(1.0, 0.0);
    }
  }
}

export default Node;
