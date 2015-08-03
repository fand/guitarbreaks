'use strict';

import notifier from 'gulp-notify';

const error = function (title) {
  return (...args) => {
    notifier.onError({
      title   : 'Gulp : ' + title,
      message : '<%= error.message %>',
    })
    .apply(this, args);
    this.emit('end');
  };
};

const ok = function (title, message) {
  let n = notifier.notify({
    title   : title,
    message : message,
  });
  n.apply(this);
  this.emit('end');
};

export default { error, ok };
