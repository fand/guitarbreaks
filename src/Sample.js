'use strict';

import Node from './Node';

class Sample extends Node {

  constructor (url) {
    super();
    this.loadSample(url).then(buffer => this.buffer = buffer);
  }

  play () {
    if (this.node) { this.node.stop(0); }
    this.node = this.ctx.createBufferSource();
    this.node.buffer = this.buffer;
    this.node.connect(this.output);
    this.node.start(0);
  }

  loadSample (url) {
    return new Promise((resolve, reject) => {
      var req = new XMLHttpRequest();
      req.open('GET', url, true);
      req.responseType = 'arraybuffer';

      req.onload = () => {
        if (!req.response) { reject(new Error('no response')); }
        this.ctx.decodeAudioData(req.response, function (buffer) {
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
