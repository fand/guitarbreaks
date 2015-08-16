'use strict';

import Sample from './Sample';
import Distortion from './Distortion';
import Node from './Node';

const KITS = {
  'AMEN'  : [
    './wav/amen/kick_ride.wav',
    './wav/amen/snare.wav',
    './wav/amen/kick_crash.wav',
  ],
  'GABBA' : [
    './wav/gabba/bd.wav',
    './wav/gabba/snare.wav',
    './wav/gabba/kick_crash.wav',
  ],
};

class Sampler extends Node {

  constructor () {
    super();

    this.samples = [new Sample(), new Sample(), new Sample()];

    this.kit = 'AMEN';
    KITS[this.kit].map((url, i) => {
      this.samples[i].loadSample(url);
    });

    this.distortions = [
      new Distortion(),
      new Distortion(),
      new Distortion(),
    ];

    this.samples.forEach((s, i) => s.connect(this.distortions[i].input));
    this.distortions.forEach(d => d.connect(this.wet));
  }

  changeKit (kit) {
    this.kit = kit;
    KITS[this.kit].forEach((url, i) => {
      this.samples[i].loadSample(url);
    });
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
