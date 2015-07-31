(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
// Copyright Joyent, Inc. and other Node contributors.
//
// Permission is hereby granted, free of charge, to any person obtaining a
// copy of this software and associated documentation files (the
// "Software"), to deal in the Software without restriction, including
// without limitation the rights to use, copy, modify, merge, publish,
// distribute, sublicense, and/or sell copies of the Software, and to permit
// persons to whom the Software is furnished to do so, subject to the
// following conditions:
//
// The above copyright notice and this permission notice shall be included
// in all copies or substantial portions of the Software.
//
// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
// OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
// MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
// NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
// DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
// OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
// USE OR OTHER DEALINGS IN THE SOFTWARE.

function EventEmitter() {
  this._events = this._events || {};
  this._maxListeners = this._maxListeners || undefined;
}
module.exports = EventEmitter;

// Backwards-compat with node 0.10.x
EventEmitter.EventEmitter = EventEmitter;

EventEmitter.prototype._events = undefined;
EventEmitter.prototype._maxListeners = undefined;

// By default EventEmitters will print a warning if more than 10 listeners are
// added to it. This is a useful default which helps finding memory leaks.
EventEmitter.defaultMaxListeners = 10;

// Obviously not all Emitters should be limited to 10. This function allows
// that to be increased. Set to zero for unlimited.
EventEmitter.prototype.setMaxListeners = function(n) {
  if (!isNumber(n) || n < 0 || isNaN(n))
    throw TypeError('n must be a positive number');
  this._maxListeners = n;
  return this;
};

EventEmitter.prototype.emit = function(type) {
  var er, handler, len, args, i, listeners;

  if (!this._events)
    this._events = {};

  // If there is no 'error' event listener then throw.
  if (type === 'error') {
    if (!this._events.error ||
        (isObject(this._events.error) && !this._events.error.length)) {
      er = arguments[1];
      if (er instanceof Error) {
        throw er; // Unhandled 'error' event
      }
      throw TypeError('Uncaught, unspecified "error" event.');
    }
  }

  handler = this._events[type];

  if (isUndefined(handler))
    return false;

  if (isFunction(handler)) {
    switch (arguments.length) {
      // fast cases
      case 1:
        handler.call(this);
        break;
      case 2:
        handler.call(this, arguments[1]);
        break;
      case 3:
        handler.call(this, arguments[1], arguments[2]);
        break;
      // slower
      default:
        len = arguments.length;
        args = new Array(len - 1);
        for (i = 1; i < len; i++)
          args[i - 1] = arguments[i];
        handler.apply(this, args);
    }
  } else if (isObject(handler)) {
    len = arguments.length;
    args = new Array(len - 1);
    for (i = 1; i < len; i++)
      args[i - 1] = arguments[i];

    listeners = handler.slice();
    len = listeners.length;
    for (i = 0; i < len; i++)
      listeners[i].apply(this, args);
  }

  return true;
};

EventEmitter.prototype.addListener = function(type, listener) {
  var m;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events)
    this._events = {};

  // To avoid recursion in the case that type === "newListener"! Before
  // adding it to the listeners, first emit "newListener".
  if (this._events.newListener)
    this.emit('newListener', type,
              isFunction(listener.listener) ?
              listener.listener : listener);

  if (!this._events[type])
    // Optimize the case of one listener. Don't need the extra array object.
    this._events[type] = listener;
  else if (isObject(this._events[type]))
    // If we've already got an array, just append.
    this._events[type].push(listener);
  else
    // Adding the second element, need to change to array.
    this._events[type] = [this._events[type], listener];

  // Check for listener leak
  if (isObject(this._events[type]) && !this._events[type].warned) {
    var m;
    if (!isUndefined(this._maxListeners)) {
      m = this._maxListeners;
    } else {
      m = EventEmitter.defaultMaxListeners;
    }

    if (m && m > 0 && this._events[type].length > m) {
      this._events[type].warned = true;
      console.error('(node) warning: possible EventEmitter memory ' +
                    'leak detected. %d listeners added. ' +
                    'Use emitter.setMaxListeners() to increase limit.',
                    this._events[type].length);
      if (typeof console.trace === 'function') {
        // not supported in IE 10
        console.trace();
      }
    }
  }

  return this;
};

EventEmitter.prototype.on = EventEmitter.prototype.addListener;

EventEmitter.prototype.once = function(type, listener) {
  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  var fired = false;

  function g() {
    this.removeListener(type, g);

    if (!fired) {
      fired = true;
      listener.apply(this, arguments);
    }
  }

  g.listener = listener;
  this.on(type, g);

  return this;
};

// emits a 'removeListener' event iff the listener was removed
EventEmitter.prototype.removeListener = function(type, listener) {
  var list, position, length, i;

  if (!isFunction(listener))
    throw TypeError('listener must be a function');

  if (!this._events || !this._events[type])
    return this;

  list = this._events[type];
  length = list.length;
  position = -1;

  if (list === listener ||
      (isFunction(list.listener) && list.listener === listener)) {
    delete this._events[type];
    if (this._events.removeListener)
      this.emit('removeListener', type, listener);

  } else if (isObject(list)) {
    for (i = length; i-- > 0;) {
      if (list[i] === listener ||
          (list[i].listener && list[i].listener === listener)) {
        position = i;
        break;
      }
    }

    if (position < 0)
      return this;

    if (list.length === 1) {
      list.length = 0;
      delete this._events[type];
    } else {
      list.splice(position, 1);
    }

    if (this._events.removeListener)
      this.emit('removeListener', type, listener);
  }

  return this;
};

EventEmitter.prototype.removeAllListeners = function(type) {
  var key, listeners;

  if (!this._events)
    return this;

  // not listening for removeListener, no need to emit
  if (!this._events.removeListener) {
    if (arguments.length === 0)
      this._events = {};
    else if (this._events[type])
      delete this._events[type];
    return this;
  }

  // emit removeListener for all listeners on all events
  if (arguments.length === 0) {
    for (key in this._events) {
      if (key === 'removeListener') continue;
      this.removeAllListeners(key);
    }
    this.removeAllListeners('removeListener');
    this._events = {};
    return this;
  }

  listeners = this._events[type];

  if (isFunction(listeners)) {
    this.removeListener(type, listeners);
  } else {
    // LIFO order
    while (listeners.length)
      this.removeListener(type, listeners[listeners.length - 1]);
  }
  delete this._events[type];

  return this;
};

EventEmitter.prototype.listeners = function(type) {
  var ret;
  if (!this._events || !this._events[type])
    ret = [];
  else if (isFunction(this._events[type]))
    ret = [this._events[type]];
  else
    ret = this._events[type].slice();
  return ret;
};

EventEmitter.listenerCount = function(emitter, type) {
  var ret;
  if (!emitter._events || !emitter._events[type])
    ret = 0;
  else if (isFunction(emitter._events[type]))
    ret = 1;
  else
    ret = emitter._events[type].length;
  return ret;
};

function isFunction(arg) {
  return typeof arg === 'function';
}

function isNumber(arg) {
  return typeof arg === 'number';
}

function isObject(arg) {
  return typeof arg === 'object' && arg !== null;
}

function isUndefined(arg) {
  return arg === void 0;
}

},{}],2:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var Distortion = (function () {
  function Distortion(ctx) {
    _classCallCheck(this, Distortion);

    this.ctx = ctx;

    this.input = this.ctx.createGain();
    this.output = this.ctx.createGain();

    this.waveshaper = this.ctx.createWaveShaper();
    this.distortion = 0.0;

    this.input.conenct(this.waveshaper);
    this.waveshaper.connect(this.output);
  }

  _createClass(Distortion, [{
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
    key: 'connect',
    value: function connect(dst) {
      this.output.connect(dst);
    }
  }, {
    key: 'disconnect',
    value: function disconnect(dst) {
      this.output.disconnect(dst);
    }
  }]);

  return Distortion;
})();

exports['default'] = Distortion;
module.exports = exports['default'];

},{}],3:[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; desc = parent = getter = undefined; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _events = require('events');

var THRESHOLD = -0.3;

var Gamepad = (function (_EventEmitter) {
  _inherits(Gamepad, _EventEmitter);

  function Gamepad() {
    _classCallCheck(this, Gamepad);

    _get(Object.getPrototypeOf(Gamepad.prototype), 'constructor', this).call(this);

    this.timer = null;
    this.isPlaying = false;

    this.startPolling();
  }

  _createClass(Gamepad, [{
    key: 'startPolling',
    value: function startPolling() {
      this.timer = setInterval(this.poll.bind(this), 1);
    }
  }, {
    key: 'stopPolling',
    value: function stopPolling() {
      clearInterval(this.timer);
    }
  }, {
    key: 'poll',
    value: function poll() {
      var _this = this;

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

        if (pad.axes[1] < THRESHOLD && !_this.isPlaying) {
          _this.emit('note', notes);
          _this.isPlaying = true;
        }

        if (pad.axes[1] >= THRESHOLD) {
          _this.isPlaying = false;
        }
      });
    }
  }]);

  return Gamepad;
})(_events.EventEmitter);

exports['default'] = Gamepad;
module.exports = exports['default'];

},{"events":1}],4:[function(require,module,exports){
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
  function Guitar(ctx) {
    var _this = this;

    _classCallCheck(this, Guitar);

    this.ctx = ctx;

    this.samples = [new _Sample2['default'](this.ctx, './wav/kick_ride.wav'), new _Sample2['default'](this.ctx, './wav/snare.wav'), new _Sample2['default'](this.ctx, './wav/kick_crash.wav')];

    this.gain = this.ctx.createGain();
    this.samples.forEach(function (s) {
      return s.connect(_this.gain);
    });

    this.updateTable();
  }

  _createClass(Guitar, [{
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
    key: 'connect',
    value: function connect(dst) {
      this.gain.connect(dst);
    }
  }, {
    key: 'disconnect',
    value: function disconnect(dst) {
      this.gain.disconnect(dst);
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

},{"./Sample":5}],5:[function(require,module,exports){
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

},{}],6:[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _Gamepad = require('./Gamepad');

var _Gamepad2 = _interopRequireDefault(_Gamepad);

var _Guitar = require('./Guitar');

var _Guitar2 = _interopRequireDefault(_Guitar);

var _Distortion = require('./Distortion');

var _Distortion2 = _interopRequireDefault(_Distortion);

var ctx = new AudioContext();

var pad = new _Gamepad2['default']();
var guitar = new _Guitar2['default'](ctx);
var dist = new _Distortion2['default'](ctx);

guitar.connect(dist);
dist.connect(ctx.destination);

pad.on('note', function (notes) {
  guitar.playNotes(notes);
});

},{"./Distortion":2,"./Gamepad":3,"./Guitar":4}]},{},[6]);
