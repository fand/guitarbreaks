'use strict';

class Node {

  constructor (ctx) {
    this.ctx = ctx;

    this.input = this.ctx.createGain();
    this.output = this.ctx.createGain();
  }

  connect (dst) {
    this.output.connect(dst);
  }

  disconnect (dst) {
    this.output.disconnect(dst);
  }

}

export default Node;
