'use strict';

import path from 'path';

const BASE_DIR = __dirname + '/../';
const BASE = (p) => path.join(BASE_DIR, p);

export default {

  browserify : {
    src  : BASE('src/js/index.js'),
    dst  : BASE('docs/js'),
    name : 'index.js',
  },

  sass : {
    src : BASE('src/scss/**/*.scss'),
    dst : BASE('docs/css'),
  },

  watch : {
    js   : BASE('src/js/**/*.js'),
    sass : BASE('src/scss/**/*.scss'),
  },

  browserSync : {
    server : {
      baseDir : BASE('docs'),
    },
    files : [BASE('docs/**/*')],
  },

};
