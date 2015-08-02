'use strict';

import m from 'mithril';

class VM {

  constructor (node) {
    this.node = node;

    this.isOn = true;
    this.distortion = m.prop(10000);
    this.volume     = m.prop(3000);
  }

  onChangeDistortion (e) {
    this.distortion(e.target.value);
    if (this.isOn) {
      this.node.setDistortion(e.target.value / 10000.0);
    }
  }

  onChangeVolume (e) {
    this.volume(e.target.value);
    if (this.isOn) {
      this.node.setVolume(e.target.value / 10000.0);
    }
  }

  toggle () {
    this.isOn = !this.isOn;
    if (this.isOn) {
      this.node.setDistortion(e.target.value / 10000.0);
      this.node.setVolume(e.target.value / 10000.0);
    }
  }
}

export default {
  controller : function (args) {
    return new VM(args.distortionNode);
  },

  view : function (vm) {
    return m('.Distortion', [
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
        class : vm.isOn ? 'on' :'off'
      }),
      m('button', {
        onclick : :: vm.toggle,
      }, 'toggle')
    ]);
  }
};
