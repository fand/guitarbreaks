'use strict';

import Gamepad from './Gamepad';
import Guitar from './Guitar';

const pad = new Gamepad();
const guitar = new Guitar();

pad.on('note', function (notes) {
  guitar.playNotes(notes);
});
