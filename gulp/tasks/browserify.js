'use strict';

import gulp       from 'gulp';
import browserify from 'browserify';
import babelify   from 'babelify';
import source     from 'vinyl-source-stream';

import { browserify as config } from '../config';
import notify from '../utils/notify';

/**
 * Util
 */
const isDev = () => process.env.NODE_ENV !== 'production';

/**
 * Bundle each config
 */
const babel = function (c) {

  let bundler = browserify({
    entries      : c.src,
    debug        : isDev(),
    cache        : {},
    packageCache : {},
    fullPaths    : true,
  });

  bundler.transform('babelify', { stage: 0 });

  console.log('#### browserify: rebuild');

  bundler.bundle()
    .on('error', (err) => {
      console.error(err);
      notify.error('Compile error');
    })
    .pipe(source(c.name))
    .pipe(gulp.dest(c.dst));
};

/**
 * Tasks
 */

export default {
  browserify : function () {
    return babel(config);
  },
};
