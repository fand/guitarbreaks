'use strict';

import m from 'mithril';

const CANVAS_WIDTH  = 512;
const CANVAS_HEIGHT = 256;

class SampleVM {
  constructor (args) {
    this.sampleNode     = args.sample;
    this.distortionNode = args.distortion;
    this.index          = args.index;
    this.callback       = args.callback;
    this.colorLabel     = args.colorLabel;
    this.color          = args.color;

    this.distortion = m.prop(10000);
    this.volume     = m.prop(3000);
  }

  onClickPlayButton () {
    this.sampleNode.play();
  }

  getSampleName () {
    return this.sampleNode.basename;
  }

  onChangeDistortion (e) {
    this.distortion(e.target.value);
    this.distortionNode.setDistortion(e.target.value / 10000.0);
  }

  onChangeVolume (e) {
    this.volume(e.target.value);
    this.distortionNode.setVolume(e.target.value / 10000.0);
  }

  drawWave (element, isInitialized, context) {
    if (isInitialized) { return; }

    this.sampleNode.getWaveData().then((wave) => {
      var ctx = element.getContext("2d");
      const rect = element.getBoundingClientRect();
      const [w, h] = [rect.width, rect.height];

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
    return m('.Sample', {
      class : vm.colorLabel,
    }, [
      m('.Sample__NameLabel', vm.colorLabel),
      m('.Sample__Name', vm.getSampleName()),
      m('.Sample__Play', {
        onclick : ::vm.onClickPlayButton,
      }, '➤'),
      m('canvas.Sample__Wave', {
        config: ::vm.drawWave,
      }),
      m('.Sample__FXs', [
        m('.Sample__FXs__FX', [
          m('.Sample__FXs__FX__Label', 'distortion'),
          m('input.Sample__FXs__FX__Input', {
            type     : 'range',
            min      : 10000,
            max      : 30000,
            onchange : ::vm.onChangeDistortion,
            value    : vm.distortion()
          }),
        ]),
        m('.Sample__FXs__FX', [
          m('.Sample__FXs__FX__Label', 'volume'),
          m('input.Sample__FXs__FX__Input', {
            type     : 'range',
            min      : 0,
            max      : 10000,
            onchange : ::vm.onChangeVolume,
            value    : vm.volume()
          }),
        ]),
      ]),
    ]);
  },

};
