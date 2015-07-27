'use strict';

let getGamepad = function () {
  return new Promise(function (resolve) {
    let pol = function () {
      const candidates = navigator.getGamepads();
      const pads = Object.values(candidates).filter(p => p);
      if (pads.length > 0) {
        resolve(pads[0]);
      }
      else {
        setTimeout(pol, 1000);
      }
    };

    pol();
  });
};

getGamepad().then(function () {
  ;
});
