'use strict';

import m from 'mithril';

class VM {
  constructor (pad) {
    this.pad = pad;
    this.buttons = this.pad.buttons.map(b => b.pressed);

    this.pad.on('buttons', (buttons) => {
      const isChanged = this.buttons.some((p, i) => {
        return p !== buttons[i].pressed;
      });
      if (isChanged) {
        this.buttons = buttons.map(b => b.pressed);
        m.redraw();
      }
    });
  }
}

export default {
  controller : function (args) {
    return new VM(args.gamepad);
  },

  view : function (vm) {
    return m('.Gamepad', [
      m('img.Gamepad__Guitar', { src : '../image/guitar_plain.png' }),
      m('img.Gamepad__Button.blue', {
        src : '../image/blue_off.png',
        class : vm.pad.buttons[0].pressed ? 'on' : 'off',
      }),
      m('img.Gamepad__Button.red', {
        src : '../image/red_off.png',
        class : vm.pad.buttons[1].pressed ? 'on' : 'off',
      }),
      m('img.Gamepad__Button.green', {
        src : '../image/green_off.png',
        class : vm.pad.buttons[5].pressed ? 'on' : 'off',
      }),
    ]);
  }
};
