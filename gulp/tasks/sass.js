'use strict';

import gulp        from 'gulp';
import gulpSass    from 'gulp-sass';
import gulpPlumber from 'gulp-plumber';
import gulpIf      from 'gulp-if';

import { reload } from 'browser-sync';
import { sass as config } from '../config';

let isWatching = false;

export function sass () {
  return gulp.src(config.src)
    .pipe(gulpSass())
    .pipe(gulpPlumber())
    .pipe(gulp.dest(config.dst))
    .pipe(gulpIf(isWatching, reload({stream: true})));
}

export function sassWatch () {
  isWatching = true;
  gulp.start('sass');
}
