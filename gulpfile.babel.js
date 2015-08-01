'use strict';

import gulp from 'gulp';
import * as tasks from './gulp/tasks';

for (let [k, v]  of Object.entries(tasks)) {
  gulp.task(k, v);
}

gulp.task('dev', () => {
  process.env.NODE_ENV = 'development';
  gulp.start(['build', 'watch', 'serve']);
});

gulp.task('pro', () => {
  process.env.NODE_ENV = 'production';
  gulp.start(['build', 'pm2']);
});

gulp.task('default', ['dev']);
