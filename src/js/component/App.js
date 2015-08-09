'use strict';

import m from 'mithril';

import Gamepad from '../model/Gamepad';
import Sampler from '../model/Sampler';
import Distortion from '../model/Distortion';

import ctx from '../Ctx';

import TimerComponent from './Timer';
import GamepadComponent from './Gamepad';
import SamplerComponent from './Sampler';
import DistortionComponent from './Distortion';

const BUTTON2NUM = {
  5 : 0,
  1 : 1,
  0 : 2,
};

var App = {};

class VM {
  constructor () {
    this.interval   = m.prop(500);

    // models
    this.pad     = new Gamepad(false);
    this.sampler = new Sampler();
    this.dist    = new Distortion();
    this.sampler.connect(this.dist.input);
    this.dist.connect(ctx.destination);
  }

  playNotes () {
    let buffer = [];
    this.pad.buttons.forEach((b, i) => {
      if (b.pressed) {
        buffer.push(BUTTON2NUM[i]);
      }
    });
    this.sampler.playNotes(buffer);
  }
}

App.controller = function() {
  return new VM();
};

App.view = function (vm) {
  return [
    m('LeftColumn', [
      m.component(GamepadComponent, { gamepad: vm.pad }),
    ]),
    m('RightColumn', [
      m('.Title', 'GuitarBreaks'),
      m.component(SamplerComponent, { sampler: vm.sampler }),
      m.component(DistortionComponent, { distortionNode: vm.dist }),
      m.component(TimerComponent, {
        pad: vm.pad, callback: ::vm.playNotes,
      }),
    ]),
  ];
};

export default App;
