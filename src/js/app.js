'use strict';

import Gamepad from './Gamepad';
import Guitar from './Guitar';
import Distortion from './Distortion';

import ctx from './Ctx';

const pad    = new Gamepad();
const guitar = new Guitar();
const dist   = new Distortion();

guitar.connect(dist.input);
dist.connect(ctx.destination);

pad.on('note', function (notes) {
  guitar.playNotes(notes);
});
