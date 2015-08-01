'use strict';

import { EventEmitter } from 'events';

const THRESHOLD = -0.3;

class Gamepad extends EventEmitter {

  constructor (simulate) {
    super();

    this.timer     = null;
    this.isPlaying = false;

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
    pads.forEach(pad => {

      pad.buttons.forEach((b, i) => {
        if (!b.pressed) { return; }
        this.emit('key', i);
      });

      if (pad.axes[1] < THRESHOLD && !this.isPlaying) {
        this.emit('noteOn');
        this.isPlaying = true;
      }

      if (pad.axes[1] >= THRESHOLD && this.isPlaying) {
        this.emit('noteOff');
        this.isPlaying = false;
      }
    });
  }

  simulate () {
    window.addEventListener('keydown', (e) => {
      if (49 <= e.keyCode && e.keyCode <= 53) {
        this.emit('key', e.keyCode - 48);
      }
      if (e.keyCode === 40 && !this.isPlaying) {
        this.emit('noteOn');
        this.isPlaying = true;
      }
    });
    window.addEventListener('keyup', (e) => {
      if (e.keyCode === 40 && this.isPlaying) {
        this.emit('noteOff');
        this.isPlaying = false;
      }
    });
  }

}

export default Gamepad;
