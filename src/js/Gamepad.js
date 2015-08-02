'use strict';

import { EventEmitter } from 'events';

const THRESHOLD = -0.3;

class Gamepad extends EventEmitter {

  constructor (simulate) {
    super();

    this.timer     = null;
    this.isPlaying = false;

    this.buttons = new Array(12);

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
      }
      if (e.keyCode === 40 && !this.isPlaying) {
        this.emit('noteOn');
        this.isPlaying = true;
      }
    });
    window.addEventListener('keyup', (e) => {
      if (49 <= e.keyCode && e.keyCode <= 54) {
        this.buttons[e.keyCode - 49] = { pressed: false };
      }
      if (e.keyCode === 40 && this.isPlaying) {
        this.emit('noteOff');
        this.isPlaying = false;
        this.buttons = new Array(12);
      }
    });
  }

}

export default Gamepad;
