'use strict';

import m from 'mithril';

import Gamepad from './Gamepad';
import Guitar from './Guitar';
import Distortion from './Distortion';

import ctx from './Ctx';

import TimerComponent from './TimerComponent';
import GamepadComponent from './GamepadComponent';
import DistortionComponent from './DistortionComponent';

var App = {};

class VM {
  constructor () {
    this.interval   = m.prop(500);

    // models
    this.pad    = new Gamepad(true);
    this.guitar = new Guitar();
    this.dist   = new Distortion();
    this.guitar.connect(this.dist.input);
    this.dist.connect(ctx.destination);
  }

  playNotes () {
    let buffer = [];
    this.pad.buttons.forEach((b, i) => {
      if (b.pressed) { buffer.push(i); }
    });
    this.guitar.playNotes(buffer);
  }
}

App.controller = function() {
  return new VM();
};

App.view = function (vm) {
  return m('html', [
    m('body', [
      m.component(TimerComponent, { pad: vm.pad, callback: ::vm.playNotes }),
      m.component(GamepadComponent, { gamepad: vm.pad }),
      m.component(DistortionComponent, { distortionNode: vm.dist }),
    ])
  ]);
};

export default App;
