'use strict';

import { EventEmitter } from 'events';

const THRESHOLD = -0.3;
const gen = (n, e) => {let g_; return (g_ = (n, acc) => n <= 0 ? acc : g_(n-1, [...acc, e]))(n, [])};
const BUTTONS = gen(12, {pressed: false});

const KEYS = {
  49 : 5,
  50 : 1,
  51 : 0,
  17 : 9,
  16 : 8,
};

class Gamepad extends EventEmitter {

  constructor () {
    super();

    this.timer     = null;
    this.isPlaying = false;

    this.buttons = BUTTONS;

    this.isSimulating = false;

    this.simulate()
    this.startPolling();
  }

  toggleSimulate () {
    this.isSimulating = !this.isSimulating;
  }

  startPolling () {
    this.timer = setInterval(::this.poll, 10);
  }

  stopPolling () {
    clearInterval(this.timer);
  }

  poll () {
    if (this.isSimulating) { return; }
    const candidates = navigator.getGamepads();
    if (!candidates || candidates.length === 0) { return; }
    const pads = Object.keys(candidates).map(k => candidates[k]).filter(p => p);
    if (!pads || pads.length === 0) { return; }
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
      if (!this.isSimulating) { return false; }
      if (KEYS[e.keyCode] != null) {
        this.buttons[KEYS[e.keyCode]] = { pressed: true };
        this.emit('buttons', this.buttons);
      }
      if (e.keyCode === 40 && !this.isPlaying) {
        this.emit('noteOn');
        this.isPlaying = true;
      }
    });
    window.addEventListener('keyup', (e) => {
      if (!this.isSimulating) { return false; }
      if (KEYS[e.keyCode] != null) {
        this.buttons[KEYS[e.keyCode]] = { pressed: false };
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
