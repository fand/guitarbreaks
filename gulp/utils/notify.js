'use strict';

import gulp from 'gulp';
import notifier from 'gulp-notify';

export function error (title) {
  return (...args) => {
    notifier.onError({
      title   : 'Gulp : ' + title,
      message : '<%= error.message %>',
    })
    .apply(this, args);
    this.emit('end');
  };
}

export function ok (title, message) {
  let n = notifier.notify({
    title   : title,
    message : message,
  });
  n.apply(this);
  this.emit('end');
}
