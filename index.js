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
    _classCallCheck(this, Guitar);

    this.samples = [new _Sample2['default'](), new _Sample2['default'](), new _Sample2['default']()];
  }

  _createClass(Guitar, [{
    key: 'playNotes',
    value: function playNotes(notes) {
      notes.forEach(this.playNote.bind(this));
    }
  }, {
    key: 'playNote',
    value: function playNote(note) {
      switch (note) {
        case 5:
          this.samples[0].play();
        case 1:
          this.samples[1].play();
        case 0:
          this.samples[2].play();
        case 9:
          this.goLeft();
        case 8:
          this.goRight();
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
  function Sample() {
    _classCallCheck(this, Sample);
  }

  _createClass(Sample, [{
    key: 'play',
    value: function play() {}
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

    if (pad.axes[1] < 0.5) {
      guitar.playNotes(notes);
    }
  });
}, 1000);

},{"./Guitar":1}]},{},[3]);
