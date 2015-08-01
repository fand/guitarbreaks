'use strict';

import gulp       from 'gulp';
import gulpIf     from 'gulp-if';
import browserify from 'browserify';
import babelify   from 'babelify';
import source     from 'vinyl-source-stream';
import { reload } from 'browser-sync';

import { browserify as config } from '../config';
import notify from '../utils/notify';

/**
 * util
 */

let isDev      = () => process.env.NODE_ENV !== 'production';
let isWatching = false;


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

  bundler.transform(
    babelify.configure({ stage: 0 })
  );

  console.log('#### browserify: rebuild');

  return bundler.bundle()
    .on('error', (err) => {
      console.error(err);
      notify.error('Compile error');
    })
    .pipe(source(c.name))
    .pipe(gulp.dest(c.dst))
    .pipe(gulpIf(isWatching, reload({ stream: true })));
};

/**
 * Tasks
 */

export default {

  browserify : function () {
    return babel(config);
  },

  browserifyWatch : function () {
    isWatching = true;
    return gulp.start('browserify');
  },

};
