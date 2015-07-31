'use strict';

import ctx from './Ctx';

class Node {

  constructor () {
    this.input  = ctx.createGain();
    this.output = ctx.createGain();
  }

  connect (dst) {
    this.output.connect(dst);
  }

  disconnect (dst) {
    this.output.disconnect(dst);
  }

}

export default Node;
