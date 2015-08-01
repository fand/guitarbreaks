'use strict';

import pm2 from 'pm2';
import { pm2 as config } from '../config';

const p = function (method, arg) {
  return new Promise((resolve, reject) => {
    const resolver = (err, res) => {
      if (err) { reject(err); }
      else { resolve(res); }
    };

    let args = arg ? [arg, resolver] : [resolver];
    pm2[method].apply(pm2, args);
  });
};

const connect        = ()    => p('connect');
const list           = ()    => p('list');
const start          = (app) => p('start', app);
const gracefulReload = (app) => p('gracefulReload', app);

export function serve () {
  connect().then(list).then((list) => {
    if (list && list.length > 0) {
      return gracefulReload(config.app);
    }
    else {
      return start(config.app);
    }
  }).catch((err) => {
    throw err;
  });
}
