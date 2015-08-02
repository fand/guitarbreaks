'use strict';

import m from 'mithril';

class VM {
  constructor (pad) {
    this.pad = pad;
  }
}

export default {
  controller : function (args) {
    return new VM(args.gamepad);
  },

  view : function (vm) {
    return m('.Gamepad', [
      m('.Gamepad__Button.blue', {
        class : vm.pad.buttons[0].pressed ? 'on' : 'off',
      }),
      m('.Gamepad__Button.red', {
        class : vm.pad.buttons[1].pressed ? 'on' : 'off',
      }),
      m('.Gamepad__Button.green', {
        class : vm.pad.buttons[5].pressed ? 'on' : 'off',
      }),
    ]);
  }
};
