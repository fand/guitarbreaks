'use strict';

import Node from './Node';
import {EventEmitter} from 'events';

class Sample extends Node {

  constructor (url) {
    super();
    this.playbackRate = 1.0;

    this.eventEmitter = new EventEmitter();

    this.on('sampleLoadSucceeded', (buffer) => {
      this.buffer = buffer;
      this.emit('waveLoaded', this.buffer.getChannelData(0));
    });

    this.loadSample(url);
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
    this.node.playbackRate.value = this.playbackRate;
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

}

export default Sample;
