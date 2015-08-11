'use strict';

import m from 'mithril';

class DistortionVM {

  constructor (node) {
    this.node = node;

    this.distortion = m.prop(10000);
    this.volume     = m.prop(3000);
  }

  onChangeDistortion (e) {
    this.distortion(e.target.value);
    this.node.setDistortion(e.target.value / 10000.0);
  }

  onChangeVolume (e) {
    this.volume(e.target.value);
    this.node.setVolume(e.target.value / 10000.0);
  }

  toggle () {
    this.node.toggle();
  }

}

export default DistortionVM;
