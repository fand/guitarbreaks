'use strict';

import ctx from './Ctx';

class Sample {

  constructor (url) {
    this.loadSample(url).then(buffer => this.buffer = buffer);
    this.output = ctx.createGain();
  }

  play () {
    if (this.node) { this.node.stop(0); }
    this.node = ctx.createBufferSource();
    this.node.buffer = this.buffer;
    this.node.connect(this.output);
    this.node.start(0);
  }

  connect (dst) {
    this.output.connect(dst);
  }

  loadSample (url) {
    return new Promise((resolve, reject) => {
      var req = new XMLHttpRequest();
      req.open('GET', url, true);
      req.responseType = 'arraybuffer';

      req.onload = () => {
        if (!req.response) { reject(new Error('no response')); }
        ctx.decodeAudioData(req.response, function (buffer) {
          resolve(buffer);
        }, function (err) {
          reject(err);
        });
      };

      req.send();
    });
  }

}


export default Sample;
