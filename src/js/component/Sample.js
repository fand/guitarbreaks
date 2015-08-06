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

  drawWave (element, isInitialized, context) {
    if (isInitialized) { return; }

    this.sample.getWaveData().then((wave) => {
      var ctx = element.getContext("2d");
      const rect = element.getBoundingClientRect();
      const [w, h] = [rect.width, rect.height];

      // Draw waveform
      ctx.translate(0, h/2);
      ctx.beginPath();

      const d = wave.length / w
      for (let x = 0; x < w; x++) {
        ctx.lineTo(x, wave[Math.floor(x * d)] * h * 0.45);
      }

      ctx.closePath();
      ctx.strokeStyle = 'rgb(255, 0, 220)'
      ctx.stroke();
      ctx.translate(0, -h/2);
    });
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
      m('.Sampler__Sample__NameLabel', 'Red'),
      m('.Sampler__Sample__Name', 'Kick.wav'),
      m('.Sampler__Sample__Play', {
        onclick : ::vm.onClickPlayButton,
      }, '>'),
      m('canvas.Sampler__Sample__Wave', {config: ::vm.drawWave})
    ]);
  },

};
