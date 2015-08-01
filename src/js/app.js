'use strict';

import Gamepad from './Gamepad';
import Guitar from './Guitar';
import Distortion from './Distortion';

import ctx from './Ctx';

const pad    = new Gamepad(true);
const guitar = new Guitar();
const dist   = new Distortion();

guitar.connect(dist.input);
dist.connect(ctx.destination);

let interval = 500;
const $interval = document.getElementById('interval');
$interval.addEventListener('change', () => {
  interval = $interval.value;
});

let buffer = [];
let isPlaying = false;

const play = () => {
  const bbb = buffer.map((b, i) => {
    b = false;
    return i;
  });
  guitar.playNotes(bbb);
};
const poll = () => {
  if (!isPlaying) { return; }
  play();
  setTimeout(poll, interval);
};

pad.on('noteOn', () => {
  isPlaying = true;
  poll();
});
pad.on('noteOff', () => {
  isPlaying = false;
  buffer = [];
});

pad.on('key', function (key) {
  buffer[key] = true;
});
