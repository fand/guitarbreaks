'use strict';

import m from 'mithril';

import Gamepad from './Gamepad';
import Guitar from './Guitar';
import Distortion from './Distortion';

import ctx from './Ctx';

const pad    = new Gamepad(true);
const guitar = new Guitar();
const dist   = new Distortion();

import DistortionComponent from './DistortionComponent';


var App = {};

class VM {
  constructor () {
    this.interval   = m.prop(500);

    guitar.connect(dist.input);
    dist.connect(ctx.destination);

    let buffer = [];
    let isPlaying = false;

    const play = () => {
      const bbb = buffer.map((b, i) => {
        b = false;
        return i;
      });
      guitar.playNotes(bbb);
    };
    const poll = () => {
      if (!isPlaying) { return; }
      play();
      setTimeout(poll, this.interval());
    };

    pad.on('noteOn', () => {
      isPlaying = true;
      poll();
    });
    pad.on('noteOff', () => {
      isPlaying = false;
      buffer = [];
    });

    pad.on('key', function (key) {
      buffer[key] = true;
    });

  }

  onChangeInterval (e) {
    this.interval(e.target.value);
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
      m.component(DistortionComponent, { distortionNode: dist }),
    ])
  ]);
};

export default App;
