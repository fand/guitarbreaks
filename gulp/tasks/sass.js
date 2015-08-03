'use strict';

import gulp        from 'gulp';
import gulpSass    from 'gulp-sass';
import gulpPlumber from 'gulp-plumber';

import { sass as config } from '../config';

export function sass () {
  return gulp.src(config.src)
    .pipe(gulpSass())
    .pipe(gulpPlumber())
    .pipe(gulp.dest(config.dst));
}
