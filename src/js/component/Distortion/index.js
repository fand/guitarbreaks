'use strict';

import m from 'mithril';
import DistortionVM from './VM.js';

export default {

  controller : function (args) {
    return new DistortionVM(args.distortionNode);
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
    ]);
  }

};
