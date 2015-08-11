'use strict';

import m from 'mithril';
import Distortion from './Distortion';

const CANVAS_WIDTH  = 512;
const CANVAS_HEIGHT = 256;

class SampleVM {
  constructor (args) {
    this.sample     = args.sample;
    this.distortion = args.distortion;
    this.index      = args.index;
    this.callback   = args.callback;
    this.colorLabel = args.colorLabel;
    this.color      = args.color;
  }

  onClickPlayButton () {
    this.sample.play();
  }

  getSampleName () {
    return this.sample.basename;
  }

  drawWave (element, isInitialized, context) {
    if (isInitialized) { return; }

    this.sample.getWaveData().then((wave) => {
      var ctx = element.getContext("2d");
      const rect = element.getBoundingClientRect();
      const [w, h] = [rect.width, rect.height];
      // const [w, h] = [CANVAS_WIDTH, CANVAS_HEIGHT];
      console.log([w, h]);

      ctx.lineWidth = 2

      // Draw waveform
      ctx.translate(0, h);
      ctx.beginPath();

      const d = wave.length / w
      for (let x = 0; x < w; x++) {
        ctx.lineTo(x, wave[Math.floor(x * d)] * h * 1.2);
      }

      ctx.closePath();
      ctx.strokeStyle = '#FFF';
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
    return m('.Sampler__Sample', {
      class : vm.colorLabel,
    }, [
      m('.Sampler__Sample__NameLabel', vm.colorLabel),
      m('.Sampler__Sample__Name', vm.getSampleName()),
      m('.Sampler__Sample__Play', {
        onclick : ::vm.onClickPlayButton,
      }, '➤'),
      m('canvas.Sampler__Sample__Wave', {
        config: ::vm.drawWave,
      }),
      m.component(Distortion, {
        distortionNode : vm.distortion,
      }),
    ]);
  },

};
