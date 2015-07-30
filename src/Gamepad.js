'use strict';

import { EventEmitter } from 'events';

const THRESHOLD = -0.3;

class Gamepad extends EventEmitter {

  constructor () {
    super();

    this.timer     = null;
    this.isPlaying = false;

    this.startPolling();
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

      let notes = [];
      pad.buttons.forEach(function (b, i) {
        if (!b.pressed) { return; }
        notes.push(i);
      });

      if (pad.axes[1] < THRESHOLD && !this.isPlaying) {
        this.emit('note', notes);
        this.isPlaying = true;
      }

      if (pad.axes[1] >= THRESHOLD) {
        this.isPlaying = false;
      }
    });
  }

}

export default Gamepad;
