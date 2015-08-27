'use strict';

import Node from './Node';
import {EventEmitter} from 'events';

class Sample extends Node {

  constructor (url) {
    super();
    this.playbackRate = 1.0;
    this.bendRate     = 1.0;

    this.eventEmitter = new EventEmitter();

    this.on('sampleLoadSucceeded', (buffer) => {
      this.buffer = buffer;
      this.emit('waveLoaded', this.buffer.getChannelData(0));
    });
  }

  on () {
    this.eventEmitter.on.apply(this.eventEmitter, arguments);
  }

  emit () {
    this.eventEmitter.emit.apply(this.eventEmitter, arguments);
  }

  play () {
    if (this.node) { this.node.stop(0); }
    this.node = this.ctx.createBufferSource();
    this.node.buffer = this.buffer;
    this.node.playbackRate.value = this.playbackRate * this.bendRate;
    this.node.connect(this.wet);
    this.node.start(0);
  }

  loadSample (url) {
    this.basename = url.split('/').pop();

    var req = new XMLHttpRequest();
    req.open('GET', url, true);
    req.responseType = 'arraybuffer';

    req.onload = () => {
      if (!req.response) {
        this.emit('sampleLoadFailed', new Error('no response'));
      }
      this.ctx.decodeAudioData(req.response, (buffer) => {
        this.emit('sampleLoadSucceeded', buffer);
      }, (err) => {
        this.emit('sampleLoadFailed', err);
      });
    };

    req.send();
  }

  setPlaybackRate (playbackRate) {
    this.playbackRate = playbackRate;
  }

  bend (isBending) {
    if (isBending) {
      this.bendRate += (5.0 - this.bendRate) * 0.1;
    }
    else {
      this.bendRate -= (this.bendRate - 1.0) * 0.6;
    }
  }

}

export default Sample;
