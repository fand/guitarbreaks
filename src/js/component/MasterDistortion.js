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
      m('ul', [
        m('li', [
          m('div', 'distortion'),
          m('input', {
            type     : 'range',
            min      : 10000,
            max      : 30000,
            onchange : ::vm.onChangeDistortion,
            value    : vm.distortion()
          }),
        ]),
        m('li', [
          m('div', 'volume'),
          m('input', {
            type     : 'range',
            min      : 0,
            max      : 10000,
            onchange : ::vm.onChangeVolume,
            value    : vm.volume()
          }),
        ]),
      ]),
      m('.indicator', {
        class : vm.node.isOn ? 'on' :'off'
      }),
      m('button', {
        onclick : :: vm.toggle,
      }, 'toggle')
    ]);
  }

};
