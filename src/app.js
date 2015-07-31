'use strict';

import Gamepad from './Gamepad';
import Guitar from './Guitar';
import Distortion from './Distortion';

const ctx = new AudioContext();

const pad    = new Gamepad();
const guitar = new Guitar(ctx);
const dist   = new Distortion(ctx);

guitar.connect(dist);
dist.connect(ctx.destination);

pad.on('note', function (notes) {
  guitar.playNotes(notes);
});
