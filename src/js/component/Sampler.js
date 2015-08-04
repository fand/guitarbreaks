'use strict';

import m from 'mithril';

class SamplerVM {
  constructor (sampler) {
    this.sampler = sampler;
  }
}

export default {
  controller : function (args) {
    return new SamplerVM(args.sampler);
  },

  view : function (vm) {
    return m('.Sampler', [
      m('.Sampler__Header', [
        m('.Sampler__KitName', 'mykit'),
        m('select.Sampler__KitSelector', [
          m('option', { value: 'AMEN', selected: 'selected' }, 'Amen')
        ]),
      ]),
      m('.Sampler__Body', [
        m('.Sampler__Red', [
          m('.Sampler__SampleName', 'Kick'),
          m('.Sampler__Play', {}),
        ]),
        m('.Sampler__Green', [
          m('.Sampler__SampleName', 'Snare'),
          m('.Sampler__Play', {}),
        ]),
        m('.Sampler__Blue', [
          m('.Sampler__SampleName', 'Crash'),
          m('.Sampler__Play', {}),
        ]),
      ]),
    ]);
  }
};
