'use strict';

import pm2 from 'pm2';
import { pm2 as config } from '../config';

const p = function (method, arg) {
  console.log(`## serve: gonna ${method}`);
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
  return connect().then(list).then((procs) => {
    if (!procs) { return false; }
    if (procs.length === 0) { return false; }
    return procs.some(proc => proc.pm2_env.pm_exec_path === config.app);
  }).then((isRunning) => {
    if (isRunning) {
      return gracefulReload(config.app);
    }
    else {
      return start(config.app);
    }
  }).catch((err) => {
    throw err;
  });
}
