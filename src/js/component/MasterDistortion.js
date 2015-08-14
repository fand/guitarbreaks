'use strict';

import m from 'mithril';

class MasterDistortionVM {

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

export default {

  controller : function (args) {
    return new MasterDistortionVM(args.distortionNode);
  },

  view : function (vm) {
    return m('.MasterDistortion', [
      m('.MasterDistortion__Toggle', {
        class : vm.node.isOn ? 'on' :'off',
        onclick : :: vm.toggle,
      }),
      m('.MasterDistortion__Label', 'MasterFX'),
      m('.MasterDistortion__FXs', [
        m('.MasterDistortion__FXs__FX', [
          m('.MasterDistortion__FXs__FX__Label', 'distortion'),
          m('input.MasterDistortion__FXs__FX__Input', {
            type     : 'range',
            min      : 10000,
            max      : 30000,
            onchange : ::vm.onChangeDistortion,
            value    : vm.distortion()
          }),
        ]),
        m('.MasterDistortion__FXs__FX', [
          m('.MasterDistortion__FXs__FX__Label', 'volume'),
          m('input.MasterDistortion__FXs__FX__Input', {
            type     : 'range',
            min      : 0,
            max      : 10000,
            onchange : ::vm.onChangeVolume,
            value    : vm.volume()
          }),
        ]),
      ]),
    ]);
  }

};
