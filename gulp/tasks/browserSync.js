'use strict';

import bs from 'browser-sync';

export function browserSync () {
  bs({
    proxy : 'localhost:8080',
    open  : false,
  });
}
