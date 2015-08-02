'use strict';

import m from 'mithril';

import Gamepad from './Gamepad';
import Guitar from './Guitar';
import Distortion from './Distortion';

import ctx from './Ctx';

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

    this.pollTimer = null;
    this.pad.on('noteOn', ::this.poll);
    this.pad.on('noteOff', () => {
      clearTimeout(this.pollTimer);
    });
  }

  onChangeInterval (e) {
    this.interval(e.target.value);
  }

  poll () {
    this.playNotes();
    this.pollTimer = setTimeout(::this.poll, this.interval());
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
      m('ul', [
        m('li', [
          m('span', 'interval'),
          m('input', {
            type     : 'range',
            min      : 100,
            max      : 5000,
            onchange : ::vm.onChangeInterval,
            value    : vm.interval()
          }),
        ]),
      ]),
      m.component(GamepadComponent, { gamepad: vm.pad }),
      m.component(DistortionComponent, { distortionNode: vm.dist }),
    ])
  ]);
};

export default App;
