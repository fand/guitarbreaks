'use strict';

import m from 'mithril';

class SampleVM {
  constructor (args) {
    this.sample   = args.sample;
    this.index    = args.index;
    this.callback = args.callback;
  }

  onClickPlayButton () {
    this.sample.play();
  }
}

export default {
  controller : function (args) {
    return new SampleVM(args);
  },

  view : function (vm) {
    return m('.Sampler__Sample' , {
      class : this.color,
    }, [
      m('.Sampler__SampleNameLabel', 'Red'),
      m('.Sampler__SampleName', 'Kick.wav'),
      m('.Sampler__Sample__Play', {
        onclick : ::vm.onClickPlayButton,
      }, '>'),
    ]);
  },

};
