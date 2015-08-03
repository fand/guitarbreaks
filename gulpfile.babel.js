'use strict';

import gulp from 'gulp';
import * as tasks from './gulp/tasks';

for (let [k, v]  of Object.entries(tasks)) {
  gulp.task(k, v);
}

gulp.task('default', ['watch']);
