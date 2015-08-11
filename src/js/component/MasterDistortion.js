'use strict';

import m from 'mithril';
import DistortionVM from './Distortion/VM';

class MasterDistortionVM extends DistortionVM {
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
