'use strict';

import gulp        from 'gulp';
import gulpSass    from 'gulp-sass';
import gulpPlumber from 'gulp-plumber';

import { sass as config } from '../config';

export function sass () {
   gulp.src(config.src)
    .pipe(gulpPlumber())
    .pipe(gulpSass())
    .pipe(gulp.dest(config.dst));
}
