'use strict';

import Guitar from './Guitar';

const guitar = new Guitar();

setInterval(function () {
  const candidates = navigator.getGamepads();
  const pads = Object.keys(candidates).map(k => candidates[k]).filter(p => p);
  pads.forEach(pad => {

    let notes = [];
    pad.buttons.forEach(function (b, i) {
      if (!b.pressed) { return; }
      notes.push(i);
    });

    if (pad.axes[1] < 0.5) {
      guitar.playNotes(notes);
    }
  });
}, 1000);
