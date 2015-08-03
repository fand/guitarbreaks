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
        console.log(this.buttons);
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
      m('img.Gamepad__Guitar', { src : './image/guitar_plain.png' }),
      m('img.Gamepad__Blue', {
        src : './image/blue_off.png',
        class : vm.pad.buttons[0].pressed ? 'on' : 'off',
      }),
      m('img.Gamepad__Red', {
        src : './image/red_off.png',
        class : vm.pad.buttons[5].pressed ? 'on' : 'off',
      }),
      m('img.Gamepad__Green', {
        src : './image/green_off.png',
        class : vm.pad.buttons[1].pressed ? 'on' : 'off',
      }),
      m('img.Gamepad__Select', {
        src : './image/button_off.png',
        class : vm.pad.buttons[9].pressed ? 'on' : 'off',
      }),
      m('img.Gamepad__Start', {
        src : './image/button_off.png',
        class : vm.pad.buttons[8].pressed ? 'on' : 'off',
      }),
    ]);
  }
};
