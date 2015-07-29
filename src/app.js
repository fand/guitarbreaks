'use strict';

setInterval(function () {
  const candidates = navigator.getGamepads();
  const pads = Object.values(candidates).filter(p => p);
  pads.forEach(pad => console.log(pad));
}, 1000);
