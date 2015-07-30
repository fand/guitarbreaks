'use strict';

import Guitar from './Guitar';

const guitar = new Guitar();

let isPlaying = false;


setInterval(function () {
  const candidates = navigator.getGamepads();
  const pads = Object.keys(candidates).map(k => candidates[k]).filter(p => p);
  pads.forEach(pad => {

    let notes = [];
    pad.buttons.forEach(function (b, i) {
      if (!b.pressed) { return; }
      notes.push(i);
    });

    if (pad.axes[1] < -0.5 && !isPlaying) {
      guitar.playNotes(notes);
      isPlaying = true;
    }
    if (pad.axes[1] >= -0.5) {
      isPlaying = false;
    }
  });
}, 10);
