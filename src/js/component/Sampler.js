'use strict';

import m from 'mithril';

import Sample from './Sample';

class SamplerVM {
  constructor (sampler) {
    this.sampler = sampler;
  }

  getKitName () {
    return 'AMEN';
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
        m.component(Sample, {
          sample : vm.sampler.samples[0],
          color  : 'Red',
          index  : 0,
        }),
        m.component(Sample, {
          sample : vm.sampler.samples[1],
          color  : 'Green',
          index  : 1,
        }),
        m.component(Sample, {
          sample : vm.sampler.samples[2],
          color  : 'Blue',
          index  : 2,
        }),
      ]),
    ]);
  }
};
