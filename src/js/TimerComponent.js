'use strict';

import m from 'mithril';

const MINUTE = 60.0 * 1000;

class VM {

  constructor () {
    this.beat = 4;
    this.interval = m.prop(100);
    this.bpm = m.prop(MINUTE / (this.interval() * this.beat));

    this.lastClickTime = Date.now();
  }

  onClick () {
    const now = Date.now();
    if (now - this.lastClickTime < 1000) {
      this.interval((now - this.lastClickTime) / this.beat);
      this.bpm(MINUTE / (this.interval() * this.beat));
    }
    this.lastClickTime = now;
  }

}

export default {
  controller : function (args) {
    return new VM(args);
  },

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
