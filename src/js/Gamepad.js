'use strict';

import { EventEmitter } from 'events';

const THRESHOLD = -0.3;
const gen = (n, e) => {let g_; return (g_ = (n, acc) => n <= 0 ? acc : g_(n-1, [...acc, e]))(n, [])};
const BUTTONS = gen(12, {pressed: false});

class Gamepad extends EventEmitter {

  constructor (simulate) {
    super();

    this.timer     = null;
    this.isPlaying = false;

    this.buttons = BUTTONS;

    if (simulate) {
      this.simulate()
    }
    else {
      this.startPolling();
    }
  }

  startPolling () {
    this.timer = setInterval(::this.poll, 1);
  }

  stopPolling () {
    clearInterval(this.timer);
  }

  poll () {
    const candidates = navigator.getGamepads();
    const pads = Object.keys(candidates).map(k => candidates[k]).filter(p => p);
    // const pad = pads.filter()  // TODO :filter only GuitarFreak Controller
    const pad = pads[0];

    this.buttons = pad.buttons;

    this.emit('buttons', this.buttons);

    if (pad.axes[1] < THRESHOLD && !this.isPlaying) {
      this.emit('noteOn');
      this.isPlaying = true;
    }
    if (pad.axes[1] >= THRESHOLD && this.isPlaying) {
      this.emit('noteOff');
      this.isPlaying = false;
    }

  }

  simulate () {
    window.addEventListener('keydown', (e) => {
      if (49 <= e.keyCode && e.keyCode <= 54) {
        this.buttons[e.keyCode - 49] = { pressed: true };
        this.emit('buttons', this.buttons);
      }
      if (e.keyCode === 40 && !this.isPlaying) {
        this.emit('noteOn');
        this.isPlaying = true;
      }
    });
    window.addEventListener('keyup', (e) => {
      if (49 <= e.keyCode && e.keyCode <= 54) {
        this.buttons[e.keyCode - 49] = { pressed: false };
        this.emit('buttons', this.buttons);
      }
      if (e.keyCode === 40 && this.isPlaying) {
        this.emit('noteOff');
        this.isPlaying = false;
        this.buttons = BUTTONS;
      }
    });
  }

}

export default Gamepad;
