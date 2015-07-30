(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _Sample = require('./Sample');

var _Sample2 = _interopRequireDefault(_Sample);

var Guitar = (function () {
  function Guitar() {
    var _this = this;

    _classCallCheck(this, Guitar);

    this.ctx = new AudioContext();

    this.samples = [new _Sample2['default'](this.ctx, './wav/kick_ride.wav'), new _Sample2['default'](this.ctx, './wav/snare.wav'), new _Sample2['default'](this.ctx, './wav/kick_crash.wav')];

    this.waveshaper = this.ctx.createWaveShaper();
    this.distortion = 0.0;

    this.samples.forEach(function (s) {
      return s.connect(_this.waveshaper);
    });
    this.waveshaper.connect(this.ctx.destination);

    this.updateTable();
  }

  _createClass(Guitar, [{
    key: 'setDistortion',
    value: function setDistortion(distortion) {
      this.distortion = distortion;
    }
  }, {
    key: 'updateTable',
    value: function updateTable() {
      if (this.distortion >= 0 && this.distortion < 1) {
        var FINE = 4096;
        var table = [];

        var k = 2 * this.distortion / (1 - this.distortion);

        for (var i = 0; i < FINE; i++) {
          // LINEAR INTERPOLATION: x := (c - a) * (z - y) / (b - a) + y
          // a = 0, b = 2048, z = 1, y = -1, c = i
          var x = (i - 0) * (1 - -1) / (FINE - 0) + -1;
          table[i] = (1 + k) * x / (1 + k * Math.abs(x));
        }

        this.waveshaper.curve = table;
      }
    }
  }, {
    key: 'playNotes',
    value: function playNotes(notes) {
      console.log(notes);
      notes.forEach(this.playNote.bind(this));
    }
  }, {
    key: 'playNote',
    value: function playNote(note) {
      switch (note) {
        case 5:
          this.samples[0].play();return;
        case 1:
          this.samples[1].play();return;
        case 0:
          this.samples[2].play();return;
        case 9:
          this.goLeft();return;
        case 8:
          this.goRight();return;
        default:
          return;
      }
    }
  }, {
    key: 'goLeft',
    value: function goLeft() {}
  }, {
    key: 'goRight',
    value: function goRight() {}
  }]);

  return Guitar;
})();

exports['default'] = Guitar;
module.exports = exports['default'];

},{"./Sample":2}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Sample = (function () {
  function Sample(ctx, url) {
    var _this = this;

    _classCallCheck(this, Sample);

    this.ctx = ctx;
    this.loadSample(url).then(function (buffer) {
      return _this.buffer = buffer;
    });
    this.output = this.ctx.createGain();
  }

  _createClass(Sample, [{
    key: 'play',
    value: function play() {
      if (this.node) {
        this.node.stop(0);
      }
      this.node = this.ctx.createBufferSource();
      this.node.buffer = this.buffer;
      this.node.connect(this.output);
      this.node.start(0);
    }
  }, {
    key: 'connect',
    value: function connect(dst) {
      this.output.connect(dst);
    }
  }, {
    key: 'loadSample',
    value: function loadSample(url) {
      var _this2 = this;

      return new Promise(function (resolve, reject) {
        var req = new XMLHttpRequest();
        req.open('GET', url, true);
        req.responseType = 'arraybuffer';

        req.onload = function () {
          if (!req.response) {
            reject(new Error('no response'));
          }
          _this2.ctx.decodeAudioData(req.response, function (buffer) {
            resolve(buffer);
          }, function (err) {
            reject(err);
          });
        };

        req.send();
      });
    }
  }]);

  return Sample;
})();

exports['default'] = Sample;
module.exports = exports['default'];

},{}],3:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _Guitar = require('./Guitar');

var _Guitar2 = _interopRequireDefault(_Guitar);

var guitar = new _Guitar2['default']();

var isPlaying = false;

setInterval(function () {
  var candidates = navigator.getGamepads();
  var pads = Object.keys(candidates).map(function (k) {
    return candidates[k];
  }).filter(function (p) {
    return p;
  });
  pads.forEach(function (pad) {

    var notes = [];
    pad.buttons.forEach(function (b, i) {
      if (!b.pressed) {
        return;
      }
      notes.push(i);
    });

    if (pad.axes[1] < -0.5 && !isPlaying) {
      guitar.playNotes(notes);
      isPlaying = true;
    }
    if (pad.axes[1] >= -0.5) {
      isPlaying = false;
    }
  });
}, 10);

},{"./Guitar":1}]},{},[3]);
