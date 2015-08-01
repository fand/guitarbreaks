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

let buffer = [];
let interval = 500;
let isPlaying = false;

const play = () => {
  guitar.playNotes(buffer.map((b, i) => i));
  buffer = [];
};
const poll = () => {
  if (!isPlaying) { return; }
  play();
  setTimeout(poll, interval);
};

pad.on('noteOn', () => {
  console.log('on');
  isPlaying = true;
  poll();
});
pad.on('noteOff', () => {
  console.log('off');
  isPlaying = false;
  buffer = [];
});

pad.on('key', function (key) {
  buffer[key] = true;
});
