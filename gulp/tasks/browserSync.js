'use strict';

import bs_ from 'browser-sync';
const bs = bs_.create('GuitarBreak');

import { browserSync as config } from '../config';

export function browserSync () {
  bs.init(config);
}
