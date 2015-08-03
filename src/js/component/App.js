'use strict';

import m from 'mithril';

import Gamepad from '../model/Gamepad';
import Guitar from '../model/Guitar';
import Distortion from '../model/Distortion';

import ctx from '../Ctx';

import TimerComponent from './Timer';
import GamepadComponent from './Gamepad';
import DistortionComponent from './Distortion';

var App = {};

class VM {
  constructor () {
    this.interval   = m.prop(500);

    // models
    this.pad    = new Gamepad(false);
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
  return [
    m.component(TimerComponent, { pad: vm.pad, callback: ::vm.playNotes }),
    m.component(GamepadComponent, { gamepad: vm.pad }),
    m.component(DistortionComponent, { distortionNode: vm.dist }),
  ];
};

export default App;
