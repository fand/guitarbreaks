'use strict';

import gulp from 'gulp';
import { watch as config } from '../config';

gulp.task('watch', ['browserSync'], () => {
  gulp.watch(config.js,     ['browserifyWatch']);
  gulp.watch(config.sass,   ['sassWatch']);
});
