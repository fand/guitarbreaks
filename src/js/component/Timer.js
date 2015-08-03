'use strict';

import m from 'mithril';

const MINUTE = 60.0 * 1000;
const SELECT = 9;
const START  = 8;

class VM {

  constructor (args) {
    this.pad      = args.pad;
    this.callback = args.callback;

    this.beat = 4;
    this.interval = m.prop(100);
    this.bpm = m.prop(MINUTE / (this.interval() * this.beat));

    this.lastClickTime = Date.now();

    // Listen to gamepad
    this.pollTimer = null;
    this.pad.on('noteOn', ::this.poll);
    this.pad.on('noteOff', () => {
      clearTimeout(this.pollTimer);
    });


    this.buttons = this.pad.buttons.map(b => b.pressed);

    this.pad.on('buttons', (buttons) => {
      const isChanged = this.buttons.some((p, i) => {
        return p !== buttons[i].pressed;
      });
      if (isChanged) {
        this.buttons = buttons.map(b => b.pressed);
        this.beat = 4 * (this.buttons[9] ? 2 : 1) * (this.buttons[8] ? 4 : 1) ;
        this.interval(MINUTE / (this.bpm() * this.beat));
        m.redraw();
      }
    });

  }

  onClick () {
    const now = Date.now();
    if (now - this.lastClickTime < 1000) {
      this.interval((now - this.lastClickTime) / this.beat);
      this.bpm(MINUTE / (this.interval() * this.beat));
    }
    this.lastClickTime = now;
  }

  poll () {
    this.callback();
    this.pollTimer = setTimeout(::this.poll, this.interval());
  }

}

export default {
  controller : (args) => new VM(args),

  view : function (vm) {
    return m('.Timer', [
      m('.Timer__BPM', vm.bpm()),
      m('.Timer__Interval', vm.interval()),
      m('.Timer__TapButton', {
        onclick: ::vm.onClick
      }),
    ]);
  }
};
