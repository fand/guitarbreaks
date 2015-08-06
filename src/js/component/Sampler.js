'use strict';

import m from 'mithril';

class SamplerVM {
  constructor (sampler) {
    this.sampler = sampler;
  }

  getKitName () {
    return 'AMEN';
  }

  onClickPlayButton (index) {
    this.sampler.playNotes([index]);
  }
}

export default {
  controller : function (args) {
    return new SamplerVM(args.sampler);
  },

  view : function (vm) {
    return m('.Sampler', [
      m('.Sampler__Header', [
        m('.Sampler__KitName', 'Drumkit'),
        m('select.Sampler__KitSelector', [
          m('option', { value: 'AMEN', selected: 'selected' }, 'Amen')
        ]),
      ]),
      m('.Sampler__Body', [
        m('.Sampler__Red', [
          m('.Sampler__SampleNameLabel', 'Red'),
          m('.Sampler__SampleName', 'Kick.wav'),
          m('.Sampler__Play', {
            onclick : () => vm.onClickPlayButton(0),
          }, '>'),
        ]),
        m('.Sampler__Green', [
          m('.Sampler__SampleNameLabel', 'Green'),
          m('.Sampler__SampleName', 'Snare.wav'),
          m('.Sampler__Play', {
            onclick : () => vm.onClickPlayButton(1),
          }, '>'),
        ]),
        m('.Sampler__Blue', [
          m('.Sampler__SampleNameLabel', 'Blue'),
          m('.Sampler__SampleName', 'Crash.wav'),
          m('.Sampler__Play', {
            onclick : () => vm.onClickPlayButton(2),
          }, '>'),
        ]),
      ]),
    ]);
  }
};
