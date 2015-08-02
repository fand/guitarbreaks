'use strict';

import m from 'mithril';

import Gamepad from './Gamepad';
import Guitar from './Guitar';
import Distortion from './Distortion';

import ctx from './Ctx';

const pad    = new Gamepad(true);
const guitar = new Guitar();
const dist   = new Distortion();


var App = {};

class VM {
  constructor () {
    this.interval   = m.prop(500);
    this.distortion = m.prop(10000);
    this.volume     = m.prop(3000);

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

  onChangeDistortion (e) {
    this.distortion(e.target.value);
    dist.setDistortion(e.target.value / 10000.0);
  }
  onChangeInterval (e) {
    this.interval(e.target.value);
  }
  onChangeVolume (e) {
    this.volume(e.target.value);
    dist.setVolume(e.target.value / 10000.0);
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
          m('span', 'distortion'),
          m('input', {
            type     : 'range',
            min      : 10000,
            max      : 30000,
            onchange : ::vm.onChangeDistortion,
            value    : vm.distortion()
          }),
        ]),
        m('li', [
          m('span', 'volume'),
          m('input', {
            type     : 'range',
            min      : 0,
            max      : 10000,
            onchange : ::vm.onChangeVolume,
            value    : vm.volume()
          }),
        ]),
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
      ])
    ])
  ]);
};

export default App;
