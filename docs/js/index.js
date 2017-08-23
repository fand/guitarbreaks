(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/node_modules/events/events.js":[function(require,module,exports){
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

},{}],"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/node_modules/mithril/mithril.js":[function(require,module,exports){
/* global Promise */

;(function (global, factory) { // eslint-disable-line
	"use strict"
	/* eslint-disable no-undef */
	var m = factory(global)
	/*	Set dependencies when no window for isomorphic compatibility */
	if(typeof window === "undefined") {
		m.deps({
			document: typeof document !== "undefined" ? document : {},
			location: typeof location !== "undefined" ? location : {},
			clearTimeout: clearTimeout,
			setTimeout: setTimeout
		})
	}
	if (typeof module === "object" && module != null && module.exports) {
		module.exports = m
	} else if (typeof define === "function" && define.amd) {
		define(function () { return m })
	} else {
		global.m = m
	}
	/* eslint-enable no-undef */
})(typeof window !== "undefined" ? window : this, function factory(global, undefined) { // eslint-disable-line
	"use strict"

	m.version = function () {
		return "v0.2.8"
	}

	var hasOwn = {}.hasOwnProperty
	var type = {}.toString

	function isFunction(object) {
		return typeof object === "function"
	}

	function isObject(object) {
		return type.call(object) === "[object Object]"
	}

	function isString(object) {
		return type.call(object) === "[object String]"
	}

	var isArray = Array.isArray || function (object) {
		return type.call(object) === "[object Array]"
	}

	function noop() {}

	var voidElements = {
		AREA: 1,
		BASE: 1,
		BR: 1,
		COL: 1,
		COMMAND: 1,
		EMBED: 1,
		HR: 1,
		IMG: 1,
		INPUT: 1,
		KEYGEN: 1,
		LINK: 1,
		META: 1,
		PARAM: 1,
		SOURCE: 1,
		TRACK: 1,
		WBR: 1
	}

	// caching commonly used variables
	var $document, $location, $requestAnimationFrame, $cancelAnimationFrame

	// self invoking function needed because of the way mocks work
	function initialize(mock) {
		$document = mock.document
		$location = mock.location
		$cancelAnimationFrame = mock.cancelAnimationFrame || mock.clearTimeout
		$requestAnimationFrame = mock.requestAnimationFrame || mock.setTimeout
	}

	// testing API
	m.deps = function (mock) {
		initialize(global = mock || window)
		return global
	}

	m.deps.factory = m.factory = factory

	m.deps(global)

	/**
	 * @typedef {String} Tag
	 * A string that looks like -> div.classname#id[param=one][param2=two]
	 * Which describes a DOM node
	 */

	function parseTagAttrs(cell, tag) {
		var classes = []
		/* eslint-disable max-len */
		var parser = /(?:(^|#|\.)([^#\.\[\]]+))|(\[(.+?)(?:\s*=\s*("|'|)((?:\\["'\]]|.)*?)\5)?\])/g
		/* eslint-enable max-len */
		var match

		while ((match = parser.exec(tag))) {
			if (match[1] === "" && match[2]) {
				cell.tag = match[2]
			} else if (match[1] === "#") {
				cell.attrs.id = match[2]
			} else if (match[1] === ".") {
				classes.push(match[2])
			} else if (match[3].charAt(0) === "[") { // #1195
				var attrValue = match[6]
				if (attrValue) attrValue = attrValue.replace(/\\(["'])/g, "$1")
				if (match[4] === "class") classes.push(attrValue)
				else cell.attrs[match[4]] = attrValue || true
			}
		}

		return classes
	}

	function getVirtualChildren(args, hasAttrs) {
		var children = hasAttrs ? args.slice(1) : args

		if (children.length === 1 && isArray(children[0])) {
			return children[0]
		} else {
			return children
		}
	}

	function assignAttrs(target, attrs, classes) {
		var classAttr = "class" in attrs ? "class" : "className"

		for (var attrName in attrs) {
			if (hasOwn.call(attrs, attrName)) {
				if (attrName === classAttr &&
						attrs[attrName] != null &&
						attrs[attrName] !== "") {
					classes.push(attrs[attrName])
					// create key in correct iteration order
					target[attrName] = ""
				} else {
					target[attrName] = attrs[attrName]
				}
			}
		}

		if (classes.length) target[classAttr] = classes.join(" ")
	}

	/**
	 *
	 * @param {Tag} The DOM node tag
	 * @param {Object=[]} optional key-value pairs to be mapped to DOM attrs
	 * @param {...mNode=[]} Zero or more Mithril child nodes. Can be an array,
	 *                      or splat (optional)
	 */
	function m(tag, pairs) {
		var args = []

		for (var i = 1, length = arguments.length; i < length; i++) {
			args[i - 1] = arguments[i]
		}

		if (tag && isFunction(tag.view)) return parameterize(tag, args)

		if (!isString(tag)) {
			throw new Error("selector in m(selector, attrs, children) should " +
				"be a string")
		}

		var hasAttrs = pairs != null && isObject(pairs) &&
			!("tag" in pairs || "view" in pairs || "subtree" in pairs)

		var attrs = hasAttrs ? pairs : {}
		var cell = {
			tag: "div",
			attrs: {},
			children: getVirtualChildren(args, hasAttrs)
		}

		assignAttrs(cell.attrs, attrs, parseTagAttrs(cell, tag))
		return cell
	}

	function forEach(list, f) {
		for (var i = 0; i < list.length && !f(list[i], i++);) {
			// function called in condition
		}
	}

	function forKeys(list, f) {
		forEach(list, function (attrs, i) {
			return (attrs = attrs && attrs.attrs) &&
				attrs.key != null &&
				f(attrs, i)
		})
	}
	// This function was causing deopts in Chrome.
	function dataToString(data) {
		// data.toString() might throw or return null if data is the return
		// value of Console.log in some versions of Firefox (behavior depends on
		// version)
		try {
			if (typeof data !== "boolean" &&
					data != null &&
					data.toString() != null) return data
		} catch (e) {
			// silently ignore errors
		}
		return ""
	}

	// This function was causing deopts in Chrome.
	function injectTextNode(parentElement, first, index, data) {
		try {
			insertNode(parentElement, first, index)
			first.nodeValue = data
		} catch (e) {
			// IE erroneously throws error when appending an empty text node
			// after a null
		}
	}

	function flatten(list) {
		// recursively flatten array
		for (var i = 0; i < list.length; i++) {
			if (isArray(list[i])) {
				list = list.concat.apply([], list)
				// check current index again and flatten until there are no more
				// nested arrays at that index
				i--
			}
		}
		return list
	}

	function insertNode(parentElement, node, index) {
		parentElement.insertBefore(node,
			parentElement.childNodes[index] || null)
	}

	var DELETION = 1
	var INSERTION = 2
	var MOVE = 3

	function handleKeysDiffer(data, existing, cached, parentElement) {
		forKeys(data, function (key, i) {
			existing[key = key.key] = existing[key] ? {
				action: MOVE,
				index: i,
				from: existing[key].index,
				element: cached.nodes[existing[key].index] ||
					$document.createElement("div")
			} : {action: INSERTION, index: i}
		})

		var actions = []
		for (var prop in existing) {
			if (hasOwn.call(existing, prop)) {
				actions.push(existing[prop])
			}
		}

		var changes = actions.sort(sortChanges)
		var newCached = new Array(cached.length)

		newCached.nodes = cached.nodes.slice()

		forEach(changes, function (change) {
			var index = change.index
			if (change.action === DELETION) {
				clear(cached[index].nodes, cached[index])
				newCached.splice(index, 1)
			}
			if (change.action === INSERTION) {
				var dummy = $document.createElement("div")
				dummy.key = data[index].attrs.key
				insertNode(parentElement, dummy, index)
				newCached.splice(index, 0, {
					attrs: {key: data[index].attrs.key},
					nodes: [dummy]
				})
				newCached.nodes[index] = dummy
			}

			if (change.action === MOVE) {
				var changeElement = change.element
				var maybeChanged = parentElement.childNodes[index]
				if (maybeChanged !== changeElement && changeElement !== null) {
					parentElement.insertBefore(changeElement,
						maybeChanged || null)
				}
				newCached[index] = cached[change.from]
				newCached.nodes[index] = changeElement
			}
		})

		return newCached
	}

	function diffKeys(data, cached, existing, parentElement) {
		var keysDiffer = data.length !== cached.length

		if (!keysDiffer) {
			forKeys(data, function (attrs, i) {
				var cachedCell = cached[i]
				return keysDiffer = cachedCell &&
					cachedCell.attrs &&
					cachedCell.attrs.key !== attrs.key
			})
		}

		if (keysDiffer) {
			return handleKeysDiffer(data, existing, cached, parentElement)
		} else {
			return cached
		}
	}

	function diffArray(data, cached, nodes) {
		// diff the array itself

		// update the list of DOM nodes by collecting the nodes from each item
		forEach(data, function (_, i) {
			if (cached[i] != null) nodes.push.apply(nodes, cached[i].nodes)
		})
		// remove items from the end of the array if the new array is shorter
		// than the old one. if errors ever happen here, the issue is most
		// likely a bug in the construction of the `cached` data structure
		// somewhere earlier in the program
		forEach(cached.nodes, function (node, i) {
			if (node.parentNode != null && nodes.indexOf(node) < 0) {
				clear([node], [cached[i]])
			}
		})

		if (data.length < cached.length) cached.length = data.length
		cached.nodes = nodes
	}

	function buildArrayKeys(data) {
		var guid = 0
		forKeys(data, function () {
			forEach(data, function (attrs) {
				if ((attrs = attrs && attrs.attrs) && attrs.key == null) {
					attrs.key = "__mithril__" + guid++
				}
			})
			return 1
		})
	}

	function isDifferentEnough(data, cached, dataAttrKeys) {
		if (data.tag !== cached.tag) return true

		if (dataAttrKeys.sort().join() !==
				Object.keys(cached.attrs).sort().join()) {
			return true
		}

		if (data.attrs.id !== cached.attrs.id) {
			return true
		}

		if (data.attrs.key !== cached.attrs.key) {
			return true
		}

		if (m.redraw.strategy() === "all") {
			return !cached.configContext || cached.configContext.retain !== true
		}

		if (m.redraw.strategy() === "diff") {
			return cached.configContext && cached.configContext.retain === false
		}

		return false
	}

	function maybeRecreateObject(data, cached, dataAttrKeys) {
		// if an element is different enough from the one in cache, recreate it
		if (isDifferentEnough(data, cached, dataAttrKeys)) {
			if (cached.nodes.length) clear(cached.nodes)

			if (cached.configContext &&
					isFunction(cached.configContext.onunload)) {
				cached.configContext.onunload()
			}

			if (cached.controllers) {
				forEach(cached.controllers, function (controller) {
					if (controller.onunload) {
						controller.onunload({preventDefault: noop})
					}
				})
			}
		}
	}

	function getObjectNamespace(data, namespace) {
		if (data.attrs.xmlns) return data.attrs.xmlns
		if (data.tag === "svg") return "http://www.w3.org/2000/svg"
		if (data.tag === "math") return "http://www.w3.org/1998/Math/MathML"
		return namespace
	}

	var pendingRequests = 0
	m.startComputation = function () { pendingRequests++ }
	m.endComputation = function () {
		if (pendingRequests > 1) {
			pendingRequests--
		} else {
			pendingRequests = 0
			m.redraw()
		}
	}

	function unloadCachedControllers(cached, views, controllers) {
		if (controllers.length) {
			cached.views = views
			cached.controllers = controllers
			forEach(controllers, function (controller) {
				if (controller.onunload && controller.onunload.$old) {
					controller.onunload = controller.onunload.$old
				}

				if (pendingRequests && controller.onunload) {
					var onunload = controller.onunload
					controller.onunload = function (){}
					controller.onunload.$old = onunload
				}
			})
		}
	}

	function scheduleConfigsToBeCalled(configs, data, node, isNew, cached) {
		// schedule configs to be called. They are called after `build` finishes
		// running
		if (isFunction(data.attrs.config)) {
			var context = cached.configContext = cached.configContext || {}

			// bind
			configs.push(function () {
				return data.attrs.config.call(data, node, !isNew, context,
					cached)
			})
		}
	}

	function buildUpdatedNode(
		cached,
		data,
		editable,
		hasKeys,
		namespace,
		views,
		configs,
		controllers
	) {
		var node = cached.nodes[0]

		if (hasKeys) {
			setAttributes(node, data.tag, data.attrs, cached.attrs, namespace)
		}

		cached.children = build(
			node,
			data.tag,
			undefined,
			undefined,
			data.children,
			cached.children,
			false,
			0,
			data.attrs.contenteditable ? node : editable,
			namespace,
			configs
		)

		cached.nodes.intact = true

		if (controllers.length) {
			cached.views = views
			cached.controllers = controllers
		}

		return node
	}

	function handleNonexistentNodes(data, parentElement, index) {
		var nodes
		if (data.$trusted) {
			nodes = injectHTML(parentElement, index, data)
		} else {
			nodes = [$document.createTextNode(data)]
			if (!(parentElement.nodeName in voidElements)) {
				insertNode(parentElement, nodes[0], index)
			}
		}

		var cached

		if (typeof data === "string" ||
				typeof data === "number" ||
				typeof data === "boolean") {
			cached = new data.constructor(data)
		} else {
			cached = data
		}

		cached.nodes = nodes
		return cached
	}

	function reattachNodes(
		data,
		cached,
		parentElement,
		editable,
		index,
		parentTag
	) {
		var nodes = cached.nodes
		if (!editable || editable !== $document.activeElement ||
				data !== cached) {
			if (data.$trusted) {
				clear(nodes, cached)
				nodes = injectHTML(parentElement, index, data)
			} else if (parentTag === "textarea") {
				// <textarea> uses `value` instead of `nodeValue`.
				parentElement.value = data
			} else if (editable) {
				// contenteditable nodes use `innerHTML` instead of `nodeValue`.
				editable.innerHTML = data
				nodes = [].slice.call(editable.childNodes)
			} else {
				// was a trusted string
				if (nodes[0].nodeType === 1 || nodes.length > 1 ||
						(nodes[0].nodeValue.trim &&
							!nodes[0].nodeValue.trim())) {
					clear(cached.nodes, cached)
					nodes = [$document.createTextNode(data)]
				}

				injectTextNode(parentElement, nodes[0], index, data)
			}
		}
		cached = new data.constructor(data)
		cached.nodes = nodes
		cached.$trusted = data.$trusted
		return cached
	}

	function handleTextNode(
		cached,
		data,
		index,
		parentElement,
		shouldReattach,
		editable,
		parentTag
	) {
		if (!cached.nodes.length) {
			return handleNonexistentNodes(data, parentElement, index)
		} else if (cached.valueOf() !== data.valueOf() || shouldReattach) {
			return reattachNodes(data, cached, parentElement, editable, index,
				parentTag)
		} else {
			return (cached.nodes.intact = true, cached)
		}
	}

	function getSubArrayCount(item) {
		if (item.$trusted) {
			// fix offset of next element if item was a trusted string w/ more
			// than one html element
			return item.nodes.length
		} else if (isArray(item)) {
			return item.length
		}
		return 1
	}

	function buildArray(
		data,
		cached,
		parentElement,
		index,
		parentTag,
		shouldReattach,
		editable,
		namespace,
		configs
	) {
		data = flatten(data)
		var nodes = []
		var intact = cached.length === data.length
		var subArrayCount = 0

		// keys algorithm: sort elements without recreating them if keys are
		// present
		//
		// 1) create a map of all existing keys, and mark all for deletion
		// 2) add new keys to map and mark them for addition
		// 3) if key exists in new list, change action from deletion to a move
		// 4) for each key, handle its corresponding action as marked in
		//    previous steps

		var existing = {}
		var shouldMaintainIdentities = false

		forKeys(cached, function (attrs, i) {
			shouldMaintainIdentities = true
			existing[cached[i].attrs.key] = {action: DELETION, index: i}
		})

		buildArrayKeys(data)
		if (shouldMaintainIdentities) {
			cached = diffKeys(data, cached, existing, parentElement)
		}
		// end key algorithm

		var cacheCount = 0
		// faster explicitly written
		for (var i = 0, len = data.length; i < len; i++) {
			// diff each item in the array
			var item = build(
				parentElement,
				parentTag,
				cached,
				index,
				data[i],
				cached[cacheCount],
				shouldReattach,
				index + subArrayCount || subArrayCount,
				editable,
				namespace,
				configs)

			if (item !== undefined) {
				intact = intact && item.nodes.intact
				subArrayCount += getSubArrayCount(item)
				cached[cacheCount++] = item
			}
		}

		if (!intact) diffArray(data, cached, nodes)
		return cached
	}

	function makeCache(data, cached, index, parentIndex, parentCache) {
		if (cached != null) {
			if (type.call(cached) === type.call(data)) return cached

			if (parentCache && parentCache.nodes) {
				var offset = index - parentIndex
				var end = offset + (isArray(data) ? data : cached.nodes).length
				clear(
					parentCache.nodes.slice(offset, end),
					parentCache.slice(offset, end))
			} else if (cached.nodes) {
				clear(cached.nodes, cached)
			}
		}

		cached = new data.constructor()
		// if constructor creates a virtual dom element, use a blank object as
		// the base cached node instead of copying the virtual el (#277)
		if (cached.tag) cached = {}
		cached.nodes = []
		return cached
	}

	function constructNode(data, namespace) {
		if (data.attrs.is) {
			if (namespace == null) {
				return $document.createElement(data.tag, data.attrs.is)
			} else {
				return $document.createElementNS(namespace, data.tag,
					data.attrs.is)
			}
		} else if (namespace == null) {
			return $document.createElement(data.tag)
		} else {
			return $document.createElementNS(namespace, data.tag)
		}
	}

	function constructAttrs(data, node, namespace, hasKeys) {
		if (hasKeys) {
			return setAttributes(node, data.tag, data.attrs, {}, namespace)
		} else {
			return data.attrs
		}
	}

	function constructChildren(
		data,
		node,
		cached,
		editable,
		namespace,
		configs
	) {
		if (data.children != null && data.children.length > 0) {
			return build(
				node,
				data.tag,
				undefined,
				undefined,
				data.children,
				cached.children,
				true,
				0,
				data.attrs.contenteditable ? node : editable,
				namespace,
				configs)
		} else {
			return data.children
		}
	}

	function reconstructCached(
		data,
		attrs,
		children,
		node,
		namespace,
		views,
		controllers
	) {
		var cached = {
			tag: data.tag,
			attrs: attrs,
			children: children,
			nodes: [node]
		}

		unloadCachedControllers(cached, views, controllers)

		if (cached.children && !cached.children.nodes) {
			cached.children.nodes = []
		}

		return cached
	}

	function getController(views, view, cachedControllers, controller) {
		var controllerIndex

		if (m.redraw.strategy() === "diff" && views) {
			controllerIndex = views.indexOf(view)
		} else {
			controllerIndex = -1
		}

		if (controllerIndex > -1) {
			return cachedControllers[controllerIndex]
		} else if (isFunction(controller)) {
			return new controller()
		} else {
			return {}
		}
	}

	var unloaders = []

	function updateLists(views, controllers, view, controller) {
		if (controller.onunload != null &&
				unloaders.map(function (u) { return u.handler })
					.indexOf(controller.onunload) < 0) {
			unloaders.push({
				controller: controller,
				handler: controller.onunload
			})
		}

		views.push(view)
		controllers.push(controller)
	}

	var forcing = false
	function checkView(
		data,
		view,
		cached,
		cachedControllers,
		controllers,
		views
	) {
		var controller = getController(
			cached.views,
			view,
			cachedControllers,
			data.controller)

		var key = data && data.attrs && data.attrs.key

		if (pendingRequests === 0 ||
				forcing ||
				cachedControllers &&
					cachedControllers.indexOf(controller) > -1) {
			data = data.view(controller)
		} else {
			data = {tag: "placeholder"}
		}

		if (data.subtree === "retain") return data
		data.attrs = data.attrs || {}
		data.attrs.key = key
		updateLists(views, controllers, view, controller)
		return data
	}

	function markViews(data, cached, views, controllers) {
		var cachedControllers = cached && cached.controllers

		while (data.view != null) {
			data = checkView(
				data,
				data.view.$original || data.view,
				cached,
				cachedControllers,
				controllers,
				views)
		}

		return data
	}

	function buildObject( // eslint-disable-line max-statements
		data,
		cached,
		editable,
		parentElement,
		index,
		shouldReattach,
		namespace,
		configs
	) {
		var views = []
		var controllers = []

		data = markViews(data, cached, views, controllers)

		if (data.subtree === "retain") return cached

		if (!data.tag && controllers.length) {
			throw new Error("Component template must return a virtual " +
				"element, not an array, string, etc.")
		}

		data.attrs = data.attrs || {}
		cached.attrs = cached.attrs || {}

		var dataAttrKeys = Object.keys(data.attrs)
		var hasKeys = dataAttrKeys.length > ("key" in data.attrs ? 1 : 0)

		maybeRecreateObject(data, cached, dataAttrKeys)

		if (!isString(data.tag)) return

		var isNew = cached.nodes.length === 0

		namespace = getObjectNamespace(data, namespace)

		var node
		if (isNew) {
			node = constructNode(data, namespace)
			// set attributes first, then create children
			var attrs = constructAttrs(data, node, namespace, hasKeys)

			// add the node to its parent before attaching children to it
			insertNode(parentElement, node, index)

			var children = constructChildren(data, node, cached, editable,
				namespace, configs)

			cached = reconstructCached(
				data,
				attrs,
				children,
				node,
				namespace,
				views,
				controllers)
		} else {
			node = buildUpdatedNode(
				cached,
				data,
				editable,
				hasKeys,
				namespace,
				views,
				configs,
				controllers)
		}

		// edge case: setting value on <select> doesn't work before children
		// exist, so set it again after children have been created/updated
		if (data.tag === "select" && "value" in data.attrs) {
			setAttributes(node, data.tag, {value: data.attrs.value}, {},
				namespace)
		}

		if (!isNew && shouldReattach === true && node != null) {
			insertNode(parentElement, node, index)
		}

		// The configs are called after `build` finishes running
		scheduleConfigsToBeCalled(configs, data, node, isNew, cached)

		return cached
	}

	function build(
		parentElement,
		parentTag,
		parentCache,
		parentIndex,
		data,
		cached,
		shouldReattach,
		index,
		editable,
		namespace,
		configs
	) {
		/*
		 * `build` is a recursive function that manages creation/diffing/removal
		 * of DOM elements based on comparison between `data` and `cached` the
		 * diff algorithm can be summarized as this:
		 *
		 * 1 - compare `data` and `cached`
		 * 2 - if they are different, copy `data` to `cached` and update the DOM
		 *     based on what the difference is
		 * 3 - recursively apply this algorithm for every array and for the
		 *     children of every virtual element
		 *
		 * The `cached` data structure is essentially the same as the previous
		 * redraw's `data` data structure, with a few additions:
		 * - `cached` always has a property called `nodes`, which is a list of
		 *    DOM elements that correspond to the data represented by the
		 *    respective virtual element
		 * - in order to support attaching `nodes` as a property of `cached`,
		 *    `cached` is *always* a non-primitive object, i.e. if the data was
		 *    a string, then cached is a String instance. If data was `null` or
		 *    `undefined`, cached is `new String("")`
		 * - `cached also has a `configContext` property, which is the state
		 *    storage object exposed by config(element, isInitialized, context)
		 * - when `cached` is an Object, it represents a virtual element; when
		 *    it's an Array, it represents a list of elements; when it's a
		 *    String, Number or Boolean, it represents a text node
		 *
		 * `parentElement` is a DOM element used for W3C DOM API calls
		 * `parentTag` is only used for handling a corner case for textarea
		 * values
		 * `parentCache` is used to remove nodes in some multi-node cases
		 * `parentIndex` and `index` are used to figure out the offset of nodes.
		 * They're artifacts from before arrays started being flattened and are
		 * likely refactorable
		 * `data` and `cached` are, respectively, the new and old nodes being
		 * diffed
		 * `shouldReattach` is a flag indicating whether a parent node was
		 * recreated (if so, and if this node is reused, then this node must
		 * reattach itself to the new parent)
		 * `editable` is a flag that indicates whether an ancestor is
		 * contenteditable
		 * `namespace` indicates the closest HTML namespace as it cascades down
		 * from an ancestor
		 * `configs` is a list of config functions to run after the topmost
		 * `build` call finishes running
		 *
		 * there's logic that relies on the assumption that null and undefined
		 * data are equivalent to empty strings
		 * - this prevents lifecycle surprises from procedural helpers that mix
		 *   implicit and explicit return statements (e.g.
		 *   function foo() {if (cond) return m("div")}
		 * - it simplifies diffing code
		 */
		data = dataToString(data)
		if (data.subtree === "retain") return cached
		cached = makeCache(data, cached, index, parentIndex, parentCache)

		if (isArray(data)) {
			return buildArray(
				data,
				cached,
				parentElement,
				index,
				parentTag,
				shouldReattach,
				editable,
				namespace,
				configs)
		} else if (data != null && isObject(data)) {
			return buildObject(
				data,
				cached,
				editable,
				parentElement,
				index,
				shouldReattach,
				namespace,
				configs)
		} else if (!isFunction(data)) {
			return handleTextNode(
				cached,
				data,
				index,
				parentElement,
				shouldReattach,
				editable,
				parentTag)
		} else {
			return cached
		}
	}

	function sortChanges(a, b) {
		return a.action - b.action || a.index - b.index
	}

	function copyStyleAttrs(node, dataAttr, cachedAttr) {
		if (cachedAttr === dataAttr) {
			node.style = ""
			cachedAttr = {}
		}
		for (var rule in dataAttr) {
			if (hasOwn.call(dataAttr, rule)) {
				if (cachedAttr == null || cachedAttr[rule] !== dataAttr[rule]) {
					node.style[rule] = dataAttr[rule]
				}
			}
		}

		for (rule in cachedAttr) {
			if (hasOwn.call(cachedAttr, rule)) {
				if (!hasOwn.call(dataAttr, rule)) node.style[rule] = ""
			}
		}
	}

	var shouldUseSetAttribute = {
		list: 1,
		style: 1,
		form: 1,
		type: 1,
		width: 1,
		height: 1
	}

	function setSingleAttr(
		node,
		attrName,
		dataAttr,
		cachedAttr,
		tag,
		namespace
	) {
		if (attrName === "config" || attrName === "key") {
			// `config` isn't a real attribute, so ignore it
			return true
		} else if (isFunction(dataAttr) && attrName.slice(0, 2) === "on") {
			// hook event handlers to the auto-redrawing system
			node[attrName] = autoredraw(dataAttr, node)
		} else if (attrName === "style" && dataAttr != null &&
				isObject(dataAttr)) {
			// handle `style: {...}`
			copyStyleAttrs(node, dataAttr, cachedAttr)
		} else if (namespace != null) {
			// handle SVG
			if (attrName === "href") {
				node.setAttributeNS("http://www.w3.org/1999/xlink",
					"href", dataAttr)
			} else {
				node.setAttribute(
					attrName === "className" ? "class" : attrName,
					dataAttr)
			}
		} else if (attrName in node && !shouldUseSetAttribute[attrName]) {
			// handle cases that are properties (but ignore cases where we
			// should use setAttribute instead)
			//
			// - list and form are typically used as strings, but are DOM
			//   element references in js
			//
			// - when using CSS selectors (e.g. `m("[style='']")`), style is
			//   used as a string, but it's an object in js
			//
			// #348 don't set the value if not needed - otherwise, cursor
			// placement breaks in Chrome
			// #1252 likewise when `contenteditable` is set on an element.
			try {
				if (
					tag !== "input" && !node.isContentEditable ||
					node[attrName] != dataAttr // eslint-disable-line eqeqeq
				) {
					node[attrName] = dataAttr
				}
			} catch (e) {
				node.setAttribute(attrName, dataAttr)
			}
		} else {
			try {
				node.setAttribute(attrName, dataAttr)
			} catch (e) {
				// IE8 doesn't allow change input attributes and throws
				// an exception. Unfortunately it cannot be handled, because
				// error code is not informative.
			}
		}
	}

	function trySetAttr(
		node,
		attrName,
		dataAttr,
		cachedAttr,
		cachedAttrs,
		tag,
		namespace
	) {
		if (!(attrName in cachedAttrs) ||
				(cachedAttr !== dataAttr) ||
				typeof dataAttr === "object" ||
				($document.activeElement === node)) {
			cachedAttrs[attrName] = dataAttr
			try {
				return setSingleAttr(
					node,
					attrName,
					dataAttr,
					cachedAttr,
					tag,
					namespace)
			} catch (e) {
				// swallow IE's invalid argument errors to mimic HTML's
				// fallback-to-doing-nothing-on-invalid-attributes behavior
				if (e.message.indexOf("Invalid argument") < 0) throw e
			}
		} else if (attrName === "value" && tag === "input" &&
								/* eslint-disable eqeqeq */
								node.value != dataAttr) {
								// #348 dataAttr may not be a string,
								// so use loose comparison
								/* eslint-enable eqeqeq */
			node.value = dataAttr
		}
	}

	function setAttributes(node, tag, dataAttrs, cachedAttrs, namespace) {
		for (var attrName in dataAttrs) {
			if (hasOwn.call(dataAttrs, attrName)) {
				if (trySetAttr(
						node,
						attrName,
						dataAttrs[attrName],
						cachedAttrs[attrName],
						cachedAttrs,
						tag,
						namespace)) {
					continue
				}
			}
		}
		return cachedAttrs
	}

	function clear(nodes, cached) {
		for (var i = nodes.length - 1; i > -1; i--) {
			if (nodes[i] && nodes[i].parentNode) {
				try {
					nodes[i].parentNode.removeChild(nodes[i])
				} catch (e) {
					/* eslint-disable max-len */
					// ignore if this fails due to order of events (see
					// http://stackoverflow.com/questions/21926083/failed-to-execute-removechild-on-node)
					/* eslint-enable max-len */
				}
				cached = [].concat(cached)
				if (cached[i]) unload(cached[i])
			}
		}
		// release memory if nodes is an array. This check should fail if nodes
		// is a NodeList (see loop above)
		if (nodes.length) {
			nodes.length = 0
		}
	}

	function unload(cached) {
		if (cached.configContext && isFunction(cached.configContext.onunload)) {
			cached.configContext.onunload()
			cached.configContext.onunload = null
		}
		if (cached.controllers) {
			forEach(cached.controllers, function (controller) {
				if (isFunction(controller.onunload)) {
					controller.onunload({preventDefault: noop})
				}
			})
		}
		if (cached.children) {
			if (isArray(cached.children)) forEach(cached.children, unload)
			else if (cached.children.tag) unload(cached.children)
		}
	}

	function appendTextFragment(parentElement, data) {
		try {
			parentElement.appendChild(
				$document.createRange().createContextualFragment(data))
		} catch (e) {
			parentElement.insertAdjacentHTML("beforeend", data)
			replaceScriptNodes(parentElement)
		}
	}

	// Replace script tags inside given DOM element with executable ones.
	// Will also check children recursively and replace any found script
	// tags in same manner.
	function replaceScriptNodes(node) {
		if (node.tagName === "SCRIPT") {
			node.parentNode.replaceChild(buildExecutableNode(node), node)
		} else {
			var children = node.childNodes
			if (children && children.length) {
				for (var i = 0; i < children.length; i++) {
					replaceScriptNodes(children[i])
				}
			}
		}

		return node
	}

	// Replace script element with one whose contents are executable.
	function buildExecutableNode(node){
		var scriptEl = document.createElement("script")
		var attrs = node.attributes

		for (var i = 0; i < attrs.length; i++) {
			scriptEl.setAttribute(attrs[i].name, attrs[i].value)
		}

		scriptEl.text = node.innerHTML
		return scriptEl
	}

	function injectHTML(parentElement, index, data) {
		var nextSibling = parentElement.childNodes[index]
		if (nextSibling) {
			var isElement = nextSibling.nodeType !== 1
			var placeholder = $document.createElement("span")
			if (isElement) {
				parentElement.insertBefore(placeholder, nextSibling || null)
				placeholder.insertAdjacentHTML("beforebegin", data)
				parentElement.removeChild(placeholder)
			} else {
				nextSibling.insertAdjacentHTML("beforebegin", data)
			}
		} else {
			appendTextFragment(parentElement, data)
		}

		var nodes = []

		while (parentElement.childNodes[index] !== nextSibling) {
			nodes.push(parentElement.childNodes[index])
			index++
		}

		return nodes
	}

	function autoredraw(callback, object) {
		return function (e) {
			e = e || event
			m.redraw.strategy("diff")
			m.startComputation()
			try {
				return callback.call(object, e)
			} finally {
				endFirstComputation()
			}
		}
	}

	var html
	var documentNode = {
		appendChild: function (node) {
			if (html === undefined) html = $document.createElement("html")
			if ($document.documentElement &&
					$document.documentElement !== node) {
				$document.replaceChild(node, $document.documentElement)
			} else {
				$document.appendChild(node)
			}

			this.childNodes = $document.childNodes
		},

		insertBefore: function (node) {
			this.appendChild(node)
		},

		childNodes: []
	}

	var nodeCache = []
	var cellCache = {}

	m.render = function (root, cell, forceRecreation) {
		if (!root) {
			throw new Error("Ensure the DOM element being passed to " +
				"m.route/m.mount/m.render is not undefined.")
		}
		var configs = []
		var id = getCellCacheKey(root)
		var isDocumentRoot = root === $document
		var node

		if (isDocumentRoot || root === $document.documentElement) {
			node = documentNode
		} else {
			node = root
		}

		if (isDocumentRoot && cell.tag !== "html") {
			cell = {tag: "html", attrs: {}, children: cell}
		}

		if (cellCache[id] === undefined) clear(node.childNodes)
		if (forceRecreation === true) reset(root)

		cellCache[id] = build(
			node,
			null,
			undefined,
			undefined,
			cell,
			cellCache[id],
			false,
			0,
			null,
			undefined,
			configs)

		forEach(configs, function (config) { config() })
	}

	function getCellCacheKey(element) {
		var index = nodeCache.indexOf(element)
		return index < 0 ? nodeCache.push(element) - 1 : index
	}

	m.trust = function (value) {
		value = new String(value) // eslint-disable-line no-new-wrappers
		value.$trusted = true
		return value
	}

	function gettersetter(store) {
		function prop() {
			if (arguments.length) store = arguments[0]
			return store
		}

		prop.toJSON = function () {
			if (store && isFunction(store.toJSON)) return store.toJSON()
			return store
		}

		return prop
	}

	m.prop = function (store) {
		if ((store != null && (isObject(store) || isFunction(store)) ||
					((typeof Promise !== "undefined") &&
						(store instanceof Promise))) &&
				isFunction(store.then)) {
			return propify(store)
		}

		return gettersetter(store)
	}

	var roots = []
	var components = []
	var controllers = []
	var lastRedrawId = null
	var lastRedrawCallTime = 0
	var computePreRedrawHook = null
	var computePostRedrawHook = null
	var topComponent
	var FRAME_BUDGET = 16 // 60 frames per second = 1 call per 16 ms

	function parameterize(component, args) {
		function controller() {
			/* eslint-disable no-invalid-this */
			return (component.controller || noop).apply(this, args) || this
			/* eslint-enable no-invalid-this */
		}

		if (component.controller) {
			controller.prototype = component.controller.prototype
		}

		function view(ctrl) {
			var currentArgs = [ctrl].concat(args)
			for (var i = 1; i < arguments.length; i++) {
				currentArgs.push(arguments[i])
			}

			return component.view.apply(component, currentArgs)
		}

		view.$original = component.view
		var output = {controller: controller, view: view}
		if (args[0] && args[0].key != null) output.attrs = {key: args[0].key}
		return output
	}

	m.component = function (component) {
		var args = new Array(arguments.length - 1)

		for (var i = 1; i < arguments.length; i++) {
			args[i - 1] = arguments[i]
		}

		return parameterize(component, args)
	}

	var currentRoute, previousRoute

	function checkPrevented(component, root, index, isPrevented) {
		if (!isPrevented) {
			m.redraw.strategy("all")
			m.startComputation()
			roots[index] = root
			var currentComponent

			if (component) {
				currentComponent = topComponent = component
			} else {
				currentComponent = topComponent = component = {controller: noop}
			}

			var controller = new (component.controller || noop)()

			// controllers may call m.mount recursively (via m.route redirects,
			// for example)
			// this conditional ensures only the last recursive m.mount call is
			// applied
			if (currentComponent === topComponent) {
				controllers[index] = controller
				components[index] = component
			}
			endFirstComputation()
			if (component === null) {
				removeRootElement(root, index)
			}
			return controllers[index]
		} else {
			if (component == null) {
				removeRootElement(root, index)
			}

			if (previousRoute) {
				currentRoute = previousRoute
			}
		}
	}

	m.mount = m.module = function (root, component) {
		if (!root) {
			throw new Error("Ensure the DOM element being passed to " +
				"m.route/m.mount/m.render is not undefined.")
		}

		var index = roots.indexOf(root)
		if (index < 0) index = roots.length

		var isPrevented = false
		var event = {
			preventDefault: function () {
				isPrevented = true
				computePreRedrawHook = computePostRedrawHook = null
			}
		}

		forEach(unloaders, function (unloader) {
			unloader.handler.call(unloader.controller, event)
			unloader.controller.onunload = null
		})

		if (isPrevented) {
			forEach(unloaders, function (unloader) {
				unloader.controller.onunload = unloader.handler
			})
		} else {
			unloaders = []
		}

		if (controllers[index] && isFunction(controllers[index].onunload)) {
			controllers[index].onunload(event)
		}

		return checkPrevented(component, root, index, isPrevented)
	}

	function removeRootElement(root, index) {
		roots.splice(index, 1)
		controllers.splice(index, 1)
		components.splice(index, 1)
		reset(root)
		nodeCache.splice(getCellCacheKey(root), 1)
		unloaders = []
	}

	var redrawing = false
	m.redraw = function (force) {
		if (redrawing) return
		redrawing = true
		if (force) forcing = true

		try {
			// lastRedrawId is a positive number if a second redraw is requested
			// before the next animation frame
			// lastRedrawId is null if it's the first redraw and not an event
			// handler
			if (lastRedrawId && !force) {
				// when setTimeout: only reschedule redraw if time between now
				// and previous redraw is bigger than a frame, otherwise keep
				// currently scheduled timeout
				// when rAF: always reschedule redraw
				if ($requestAnimationFrame === global.requestAnimationFrame ||
						new Date() - lastRedrawCallTime > FRAME_BUDGET) {
					if (lastRedrawId > 0) $cancelAnimationFrame(lastRedrawId)
					lastRedrawId = $requestAnimationFrame(redraw, FRAME_BUDGET)
				}
			} else {
				redraw()
				lastRedrawId = $requestAnimationFrame(function () {
					lastRedrawId = null
				}, FRAME_BUDGET)
			}
		} finally {
			redrawing = forcing = false
		}
	}

	m.redraw.strategy = m.prop()
	function redraw() {
		if (computePreRedrawHook) {
			computePreRedrawHook()
			computePreRedrawHook = null
		}
		forEach(roots, function (root, i) {
			var component = components[i]
			if (controllers[i]) {
				var args = [controllers[i]]
				m.render(root,
					component.view ? component.view(controllers[i], args) : "")
			}
		})
		// after rendering within a routed context, we need to scroll back to
		// the top, and fetch the document title for history.pushState
		if (computePostRedrawHook) {
			computePostRedrawHook()
			computePostRedrawHook = null
		}
		lastRedrawId = null
		lastRedrawCallTime = new Date()
		m.redraw.strategy("diff")
	}

	function endFirstComputation() {
		if (m.redraw.strategy() === "none") {
			pendingRequests--
			m.redraw.strategy("diff")
		} else {
			m.endComputation()
		}
	}

	m.withAttr = function (prop, withAttrCallback, callbackThis) {
		return function (e) {
			e = e || window.event
			/* eslint-disable no-invalid-this */
			var currentTarget = e.currentTarget || this
			var _this = callbackThis || this
			/* eslint-enable no-invalid-this */
			var target = prop in currentTarget ?
				currentTarget[prop] :
				currentTarget.getAttribute(prop)
			withAttrCallback.call(_this, target)
		}
	}

	// routing
	var modes = {pathname: "", hash: "#", search: "?"}
	var redirect = noop
	var isDefaultRoute = false
	var routeParams

	m.route = function (root, arg1, arg2, vdom) { // eslint-disable-line
		// m.route()
		if (arguments.length === 0) return currentRoute
		// m.route(el, defaultRoute, routes)
		if (arguments.length === 3 && isString(arg1)) {
			redirect = function (source) {
				var path = currentRoute = normalizeRoute(source)
				if (!routeByValue(root, arg2, path)) {
					if (isDefaultRoute) {
						throw new Error("Ensure the default route matches " +
							"one of the routes defined in m.route")
					}

					isDefaultRoute = true
					m.route(arg1, true)
					isDefaultRoute = false
				}
			}

			var listener = m.route.mode === "hash" ?
				"onhashchange" :
				"onpopstate"

			global[listener] = function () {
				var path = $location[m.route.mode]
				if (m.route.mode === "pathname") path += $location.search
				if (currentRoute !== normalizeRoute(path)) redirect(path)
			}

			computePreRedrawHook = setScroll
			global[listener]()

			return
		}

		// config: m.route
		if (root.addEventListener || root.attachEvent) {
			var base = m.route.mode !== "pathname" ? $location.pathname : ""
			root.href = base + modes[m.route.mode] + vdom.attrs.href
			if (root.addEventListener) {
				root.removeEventListener("click", routeUnobtrusive)
				root.addEventListener("click", routeUnobtrusive)
			} else {
				root.detachEvent("onclick", routeUnobtrusive)
				root.attachEvent("onclick", routeUnobtrusive)
			}

			return
		}
		// m.route(route, params, shouldReplaceHistoryEntry)
		if (isString(root)) {
			previousRoute = currentRoute
			currentRoute = root

			var args = arg1 || {}
			var queryIndex = currentRoute.indexOf("?")
			var params

			if (queryIndex > -1) {
				params = parseQueryString(currentRoute.slice(queryIndex + 1))
			} else {
				params = {}
			}

			for (var i in args) {
				if (hasOwn.call(args, i)) {
					params[i] = args[i]
				}
			}

			var querystring = buildQueryString(params)
			var currentPath

			if (queryIndex > -1) {
				currentPath = currentRoute.slice(0, queryIndex)
			} else {
				currentPath = currentRoute
			}

			if (querystring) {
				currentRoute = currentPath +
					(currentPath.indexOf("?") === -1 ? "?" : "&") +
					querystring
			}

			var replaceHistory =
				(arguments.length === 3 ? arg2 : arg1) === true ||
				previousRoute === currentRoute

			if (global.history.pushState) {
				var method = replaceHistory ? "replaceState" : "pushState"
				computePreRedrawHook = setScroll
				computePostRedrawHook = function () {
					try {
						global.history[method](null, $document.title,
							modes[m.route.mode] + currentRoute)
					} catch (err) {
						// In the event of a pushState or replaceState failure,
						// fallback to a standard redirect. This is specifically
						// to address a Safari security error when attempting to
						// call pushState more than 100 times.
						$location[m.route.mode] = currentRoute
					}
				}
				redirect(modes[m.route.mode] + currentRoute)
			} else {
				$location[m.route.mode] = currentRoute
				redirect(modes[m.route.mode] + currentRoute)
			}

			previousRoute = null
		}
	}

	m.route.param = function (key) {
		if (!routeParams) {
			throw new Error("You must call m.route(element, defaultRoute, " +
				"routes) before calling m.route.param()")
		}

		if (!key) {
			return routeParams
		}

		return routeParams[key]
	}

	m.route.mode = "search"

	function normalizeRoute(route) {
		return route.slice(modes[m.route.mode].length)
	}

	function routeByValue(root, router, path) {
		routeParams = {}

		var queryStart = path.indexOf("?")
		if (queryStart !== -1) {
			routeParams = parseQueryString(
				path.substr(queryStart + 1, path.length))
			path = path.substr(0, queryStart)
		}

		// Get all routes and check if there's
		// an exact match for the current path
		var keys = Object.keys(router)
		var index = keys.indexOf(path)

		if (index !== -1){
			m.mount(root, router[keys [index]])
			return true
		}

		for (var route in router) {
			if (hasOwn.call(router, route)) {
				if (route === path) {
					m.mount(root, router[route])
					return true
				}

				var matcher = new RegExp("^" + route
					.replace(/:[^\/]+?\.{3}/g, "(.*?)")
					.replace(/:[^\/]+/g, "([^\\/]+)") + "\/?$")

				if (matcher.test(path)) {
					/* eslint-disable no-loop-func */
					path.replace(matcher, function () {
						var keys = route.match(/:[^\/]+/g) || []
						var values = [].slice.call(arguments, 1, -2)
						forEach(keys, function (key, i) {
							routeParams[key.replace(/:|\./g, "")] =
								decodeURIComponent(values[i])
						})
						m.mount(root, router[route])
					})
					/* eslint-enable no-loop-func */
					return true
				}
			}
		}
	}

	function routeUnobtrusive(e) {
		e = e || event
		if (e.ctrlKey || e.metaKey || e.shiftKey || e.which === 2) return

		if (e.preventDefault) {
			e.preventDefault()
		} else {
			e.returnValue = false
		}

		var currentTarget = e.currentTarget || e.srcElement
		var args

		if (m.route.mode === "pathname" && currentTarget.search) {
			args = parseQueryString(currentTarget.search.slice(1))
		} else {
			args = {}
		}

		while (currentTarget && !/a/i.test(currentTarget.nodeName)) {
			currentTarget = currentTarget.parentNode
		}

		// clear pendingRequests because we want an immediate route change
		pendingRequests = 0
		m.route(currentTarget[m.route.mode]
			.slice(modes[m.route.mode].length), args)
	}

	function setScroll() {
		if (m.route.mode !== "hash" && $location.hash) {
			$location.hash = $location.hash
		} else {
			global.scrollTo(0, 0)
		}
	}

	function buildQueryString(object, prefix) {
		var duplicates = {}
		var str = []

		for (var prop in object) {
			if (hasOwn.call(object, prop)) {
				var key = prefix ? prefix + "[" + prop + "]" : prop
				var value = object[prop]

				if (value === null) {
					str.push(encodeURIComponent(key))
				} else if (isObject(value)) {
					str.push(buildQueryString(value, key))
				} else if (isArray(value)) {
					var keys = []
					duplicates[key] = duplicates[key] || {}
					/* eslint-disable no-loop-func */
					forEach(value, function (item) {
						/* eslint-enable no-loop-func */
						if (!duplicates[key][item]) {
							duplicates[key][item] = true
							keys.push(encodeURIComponent(key) + "=" +
								encodeURIComponent(item))
						}
					})
					str.push(keys.join("&"))
				} else if (value !== undefined) {
					str.push(encodeURIComponent(key) + "=" +
						encodeURIComponent(value))
				}
			}
		}

		return str.join("&")
	}

	function parseQueryString(str) {
		if (str === "" || str == null) return {}
		if (str.charAt(0) === "?") str = str.slice(1)

		var pairs = str.split("&")
		var params = {}

		forEach(pairs, function (string) {
			var pair = string.split("=")
			var key = decodeURIComponent(pair[0])
			var value = pair.length === 2 ? decodeURIComponent(pair[1]) : null
			if (params[key] != null) {
				if (!isArray(params[key])) params[key] = [params[key]]
				params[key].push(value)
			} else params[key] = value
		})

		return params
	}

	m.route.buildQueryString = buildQueryString
	m.route.parseQueryString = parseQueryString

	function reset(root) {
		var cacheKey = getCellCacheKey(root)
		clear(root.childNodes, cellCache[cacheKey])
		cellCache[cacheKey] = undefined
	}

	m.deferred = function () {
		var deferred = new Deferred()
		deferred.promise = propify(deferred.promise)
		return deferred
	}

	function propify(promise, initialValue) {
		var prop = m.prop(initialValue)
		promise.then(prop)
		prop.then = function (resolve, reject) {
			return propify(promise.then(resolve, reject), initialValue)
		}

		prop["catch"] = prop.then.bind(null, null)
		return prop
	}
	// Promiz.mithril.js | Zolmeister | MIT
	// a modified version of Promiz.js, which does not conform to Promises/A+
	// for two reasons:
	//
	// 1) `then` callbacks are called synchronously (because setTimeout is too
	//    slow, and the setImmediate polyfill is too big
	//
	// 2) throwing subclasses of Error cause the error to be bubbled up instead
	//    of triggering rejection (because the spec does not account for the
	//    important use case of default browser error handling, i.e. message w/
	//    line number)

	var RESOLVING = 1
	var REJECTING = 2
	var RESOLVED = 3
	var REJECTED = 4

	function Deferred(onSuccess, onFailure) {
		var self = this
		var state = 0
		var promiseValue = 0
		var next = []

		self.promise = {}

		self.resolve = function (value) {
			if (!state) {
				promiseValue = value
				state = RESOLVING

				fire()
			}

			return self
		}

		self.reject = function (value) {
			if (!state) {
				promiseValue = value
				state = REJECTING

				fire()
			}

			return self
		}

		self.promise.then = function (onSuccess, onFailure) {
			var deferred = new Deferred(onSuccess, onFailure)

			if (state === RESOLVED) {
				deferred.resolve(promiseValue)
			} else if (state === REJECTED) {
				deferred.reject(promiseValue)
			} else {
				next.push(deferred)
			}

			return deferred.promise
		}

		function finish(type) {
			state = type || REJECTED
			next.map(function (deferred) {
				if (state === RESOLVED) {
					deferred.resolve(promiseValue)
				} else {
					deferred.reject(promiseValue)
				}
			})
		}

		function thennable(then, success, failure, notThennable) {
			if (((promiseValue != null && isObject(promiseValue)) ||
					isFunction(promiseValue)) && isFunction(then)) {
				try {
					// count protects against abuse calls from spec checker
					var count = 0
					then.call(promiseValue, function (value) {
						if (count++) return
						promiseValue = value
						success()
					}, function (value) {
						if (count++) return
						promiseValue = value
						failure()
					})
				} catch (e) {
					m.deferred.onerror(e)
					promiseValue = e
					failure()
				}
			} else {
				notThennable()
			}
		}

		function fire() {
			// check if it's a thenable
			var then
			try {
				then = promiseValue && promiseValue.then
			} catch (e) {
				m.deferred.onerror(e)
				promiseValue = e
				state = REJECTING
				return fire()
			}

			if (state === REJECTING) {
				m.deferred.onerror(promiseValue)
			}

			thennable(then, function () {
				state = RESOLVING
				fire()
			}, function () {
				state = REJECTING
				fire()
			}, function () {
				try {
					if (state === RESOLVING && isFunction(onSuccess)) {
						promiseValue = onSuccess(promiseValue)
					} else if (state === REJECTING && isFunction(onFailure)) {
						promiseValue = onFailure(promiseValue)
						state = RESOLVING
					}
				} catch (e) {
					m.deferred.onerror(e)
					promiseValue = e
					return finish()
				}

				if (promiseValue === self) {
					promiseValue = TypeError()
					finish()
				} else {
					thennable(then, function () {
						finish(RESOLVED)
					}, finish, function () {
						finish(state === RESOLVING && RESOLVED)
					})
				}
			})
		}
	}

	m.deferred.onerror = function (e) {
		if (type.call(e) === "[object Error]" &&
				!/ Error/.test(e.constructor.toString())) {
			pendingRequests = 0
			throw e
		}
	}

	m.sync = function (args) {
		var deferred = m.deferred()
		var outstanding = args.length
		var results = []
		var method = "resolve"

		function synchronizer(pos, resolved) {
			return function (value) {
				results[pos] = value
				if (!resolved) method = "reject"
				if (--outstanding === 0) {
					deferred.promise(results)
					deferred[method](results)
				}
				return value
			}
		}

		if (args.length > 0) {
			forEach(args, function (arg, i) {
				arg.then(synchronizer(i, true), synchronizer(i, false))
			})
		} else {
			deferred.resolve([])
		}

		return deferred.promise
	}

	function identity(value) { return value }

	function handleJsonp(options) {
		var callbackKey = options.callbackName || "mithril_callback_" +
			new Date().getTime() + "_" +
			(Math.round(Math.random() * 1e16)).toString(36)

		var script = $document.createElement("script")

		global[callbackKey] = function (resp) {
			script.parentNode.removeChild(script)
			options.onload({
				type: "load",
				target: {
					responseText: resp
				}
			})
			global[callbackKey] = undefined
		}

		script.onerror = function () {
			script.parentNode.removeChild(script)

			options.onerror({
				type: "error",
				target: {
					status: 500,
					responseText: JSON.stringify({
						error: "Error making jsonp request"
					})
				}
			})
			global[callbackKey] = undefined

			return false
		}

		script.onload = function () {
			return false
		}

		script.src = options.url +
			(options.url.indexOf("?") > 0 ? "&" : "?") +
			(options.callbackKey ? options.callbackKey : "callback") +
			"=" + callbackKey +
			"&" + buildQueryString(options.data || {})

		$document.body.appendChild(script)
	}

	function createXhr(options) {
		var xhr = new global.XMLHttpRequest()
		xhr.open(options.method, options.url, true, options.user,
			options.password)

		xhr.onreadystatechange = function () {
			if (xhr.readyState === 4) {
				if (xhr.status >= 200 && xhr.status < 300) {
					options.onload({type: "load", target: xhr})
				} else {
					options.onerror({type: "error", target: xhr})
				}
			}
		}

		if (options.serialize === JSON.stringify &&
				options.data &&
				options.method !== "GET") {
			xhr.setRequestHeader("Content-Type",
				"application/json; charset=utf-8")
		}

		if (options.deserialize === JSON.parse) {
			xhr.setRequestHeader("Accept", "application/json, text/*")
		}

		if (isObject(options.headers)) {
			for (var header in options.headers) {
				if (hasOwn.call(options.headers, header)) {
					xhr.setRequestHeader(header, options.headers[header])
				}
			}
		}

		if (isFunction(options.config)) {
			var maybeXhr = options.config(xhr, options)
			if (maybeXhr != null) xhr = maybeXhr
		}

		var data = options.method === "GET" || !options.data ? "" : options.data

		if (data && !isString(data) && data.constructor !== global.FormData) {
			throw new Error("Request data should be either be a string or " +
				"FormData. Check the `serialize` option in `m.request`")
		}

		xhr.send(data)
		return xhr
	}

	function ajax(options) {
		if (options.dataType && options.dataType.toLowerCase() === "jsonp") {
			return handleJsonp(options)
		} else {
			return createXhr(options)
		}
	}

	function bindData(options, data, serialize) {
		if (options.method === "GET" && options.dataType !== "jsonp") {
			var prefix = options.url.indexOf("?") < 0 ? "?" : "&"
			var querystring = buildQueryString(data)
			options.url += (querystring ? prefix + querystring : "")
		} else {
			options.data = serialize(data)
		}
	}

	function parameterizeUrl(url, data) {
		if (data) {
			url = url.replace(/:[a-z]\w+/gi, function (token){
				var key = token.slice(1)
				var value = data[key] || token
				delete data[key]
				return value
			})
		}
		return url
	}

	m.request = function (options) {
		if (options.background !== true) m.startComputation()
		var deferred = new Deferred()
		var isJSONP = options.dataType &&
			options.dataType.toLowerCase() === "jsonp"

		var serialize, deserialize, extract

		if (isJSONP) {
			serialize = options.serialize =
			deserialize = options.deserialize = identity

			extract = function (jsonp) { return jsonp.responseText }
		} else {
			serialize = options.serialize = options.serialize || JSON.stringify

			deserialize = options.deserialize =
				options.deserialize || JSON.parse
			extract = options.extract || function (xhr) {
				if (xhr.responseText.length || deserialize !== JSON.parse) {
					return xhr.responseText
				} else {
					return null
				}
			}
		}

		options.method = (options.method || "GET").toUpperCase()
		options.url = parameterizeUrl(options.url, options.data)
		bindData(options, options.data, serialize)
		options.onload = options.onerror = function (ev) {
			try {
				ev = ev || event
				var response = deserialize(extract(ev.target, options))
				if (ev.type === "load") {
					if (options.unwrapSuccess) {
						response = options.unwrapSuccess(response, ev.target)
					}

					if (isArray(response) && options.type) {
						forEach(response, function (res, i) {
							response[i] = new options.type(res)
						})
					} else if (options.type) {
						response = new options.type(response)
					}

					deferred.resolve(response)
				} else {
					if (options.unwrapError) {
						response = options.unwrapError(response, ev.target)
					}

					deferred.reject(response)
				}
			} catch (e) {
				deferred.reject(e)
				m.deferred.onerror(e)
			} finally {
				if (options.background !== true) m.endComputation()
			}
		}

		ajax(options)
		deferred.promise = propify(deferred.promise, options.initialValue)
		return deferred.promise
	}

	return m
}); // eslint-disable-line

},{}],"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/Ctx.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});
exports['default'] = new AudioContext();
module.exports = exports['default'];

},{}],"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/component/App.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _mithril = require('mithril');

var _mithril2 = _interopRequireDefault(_mithril);

var _modelGamepad = require('../model/Gamepad');

var _modelGamepad2 = _interopRequireDefault(_modelGamepad);

var _modelSampler = require('../model/Sampler');

var _modelSampler2 = _interopRequireDefault(_modelSampler);

var _modelDistortion = require('../model/Distortion');

var _modelDistortion2 = _interopRequireDefault(_modelDistortion);

var _Ctx = require('../Ctx');

var _Ctx2 = _interopRequireDefault(_Ctx);

var _Timer = require('./Timer');

var _Timer2 = _interopRequireDefault(_Timer);

var _Gamepad = require('./Gamepad');

var _Gamepad2 = _interopRequireDefault(_Gamepad);

var _Sampler = require('./Sampler');

var _Sampler2 = _interopRequireDefault(_Sampler);

var _MasterDistortion = require('./MasterDistortion');

var _MasterDistortion2 = _interopRequireDefault(_MasterDistortion);

var BUTTON2NUM = {
  5: 0,
  1: 1,
  0: 2
};

var App = {};

var VM = (function () {
  function VM() {
    _classCallCheck(this, VM);

    this.interval = _mithril2['default'].prop(500);

    // models
    this.pad = new _modelGamepad2['default'](false);
    this.sampler = new _modelSampler2['default']();
    this.dist = new _modelDistortion2['default']();
    this.sampler.connect(this.dist.input);
    this.dist.connect(_Ctx2['default'].destination);
  }

  _createClass(VM, [{
    key: 'playNotes',
    value: function playNotes() {
      var buffer = [];

      this.sampler.bend(this.pad.buttons[4].pressed);

      this.pad.buttons.forEach(function (b, i) {
        if (b.pressed) {
          buffer.push(BUTTON2NUM[i]);
        }
      });
      this.sampler.playNotes(buffer);
    }
  }]);

  return VM;
})();

App.controller = function () {
  return new VM();
};

App.view = function (vm) {
  return [(0, _mithril2['default'])('.Wrapper', [(0, _mithril2['default'])('.LeftColumn', [_mithril2['default'].component(_Gamepad2['default'], { gamepad: vm.pad })]), (0, _mithril2['default'])('.RightColumn', [(0, _mithril2['default'])('.Title', 'GuitarBreaks'), _mithril2['default'].component(_Sampler2['default'], { sampler: vm.sampler }), _mithril2['default'].component(_MasterDistortion2['default'], { distortionNode: vm.dist }), _mithril2['default'].component(_Timer2['default'], {
    pad: vm.pad, callback: vm.playNotes.bind(vm)
  })])])];
};

exports['default'] = App;
module.exports = exports['default'];

},{"../Ctx":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/Ctx.js","../model/Distortion":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/model/Distortion.js","../model/Gamepad":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/model/Gamepad.js","../model/Sampler":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/model/Sampler.js","./Gamepad":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/component/Gamepad.js","./MasterDistortion":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/component/MasterDistortion.js","./Sampler":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/component/Sampler.js","./Timer":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/component/Timer.js","mithril":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/node_modules/mithril/mithril.js"}],"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/component/Gamepad.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _mithril = require('mithril');

var _mithril2 = _interopRequireDefault(_mithril);

var VM = (function () {
  function VM(pad) {
    var _this = this;

    _classCallCheck(this, VM);

    this.pad = pad;
    this.buttons = this.pad.buttons.map(function (b) {
      return b.pressed;
    });

    this.pad.on('buttons', function (buttons) {
      var isChanged = _this.buttons.some(function (p, i) {
        return p !== buttons[i].pressed;
      });
      if (isChanged) {
        _this.buttons = buttons.map(function (b) {
          return b.pressed;
        });
        _mithril2['default'].redraw();
      }
    });
  }

  _createClass(VM, [{
    key: 'toggleSimulate',
    value: function toggleSimulate() {
      this.pad.toggleSimulate();
      console.log(this.pad.isSimulating);
    }
  }]);

  return VM;
})();

exports['default'] = {
  controller: function controller(args) {
    return new VM(args.gamepad);
  },

  view: function view(vm) {
    return (0, _mithril2['default'])('.Gamepad', [(0, _mithril2['default'])('img.Gamepad__Guitar', { src: './image/guitar.png' }), (0, _mithril2['default'])('img.Gamepad__Red', {
      src: './image/red.png',
      'class': vm.pad.buttons[5].pressed ? 'on' : 'off'
    }), (0, _mithril2['default'])('img.Gamepad__Green', {
      src: './image/green.png',
      'class': vm.pad.buttons[1].pressed ? 'on' : 'off'
    }), (0, _mithril2['default'])('img.Gamepad__Blue', {
      src: './image/blue.png',
      'class': vm.pad.buttons[0].pressed ? 'on' : 'off'
    }), (0, _mithril2['default'])('img.Gamepad__Select', {
      src: './image/select.png',
      'class': vm.pad.buttons[9].pressed ? 'on' : 'off'
    }), (0, _mithril2['default'])('img.Gamepad__Start', {
      src: './image/start.png',
      'class': vm.pad.buttons[8].pressed ? 'on' : 'off'
    }), (0, _mithril2['default'])('.Gamepad__SimulateButton', {
      'class': vm.pad.isSimulating ? '.Gamepad__SimulateButton--on' : '',
      onclick: vm.toggleSimulate.bind(vm)
    }, 'Simulation : ' + (vm.pad.isSimulating ? 'ON' : 'OFF'))]);
  }
};
module.exports = exports['default'];

},{"mithril":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/node_modules/mithril/mithril.js"}],"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/component/MasterDistortion.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _mithril = require('mithril');

var _mithril2 = _interopRequireDefault(_mithril);

var MasterDistortionVM = (function () {
  function MasterDistortionVM(node) {
    _classCallCheck(this, MasterDistortionVM);

    this.node = node;

    this.distortion = _mithril2['default'].prop(10000);
    this.volume = _mithril2['default'].prop(3000);
  }

  _createClass(MasterDistortionVM, [{
    key: 'onChangeDistortion',
    value: function onChangeDistortion(e) {
      this.distortion(e.target.value);
      this.node.setDistortion(e.target.value / 10000.0);
    }
  }, {
    key: 'onChangeVolume',
    value: function onChangeVolume(e) {
      this.volume(e.target.value);
      this.node.setVolume(e.target.value / 10000.0);
    }
  }, {
    key: 'toggle',
    value: function toggle() {
      this.node.toggle();
    }
  }]);

  return MasterDistortionVM;
})();

exports['default'] = {

  controller: function controller(args) {
    return new MasterDistortionVM(args.distortionNode);
  },

  view: function view(vm) {
    return (0, _mithril2['default'])('.MasterDistortion', [(0, _mithril2['default'])('.MasterDistortion__Toggle', {
      'class': vm.node.isOn ? 'on' : 'off',
      onclick: vm.toggle.bind(vm)
    }), (0, _mithril2['default'])('.MasterDistortion__Label', 'MasterFX'), (0, _mithril2['default'])('.MasterDistortion__FXs', [(0, _mithril2['default'])('.MasterDistortion__FXs__FX', [(0, _mithril2['default'])('.MasterDistortion__FXs__FX__Label', 'distortion'), (0, _mithril2['default'])('input.MasterDistortion__FXs__FX__Input', {
      type: 'range',
      min: 10000,
      max: 30000,
      onchange: vm.onChangeDistortion.bind(vm),
      value: vm.distortion()
    })]), (0, _mithril2['default'])('.MasterDistortion__FXs__FX', [(0, _mithril2['default'])('.MasterDistortion__FXs__FX__Label', 'volume'), (0, _mithril2['default'])('input.MasterDistortion__FXs__FX__Input', {
      type: 'range',
      min: 0,
      max: 10000,
      onchange: vm.onChangeVolume.bind(vm),
      value: vm.volume()
    })])])]);
  }

};
module.exports = exports['default'];

},{"mithril":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/node_modules/mithril/mithril.js"}],"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/component/Sample.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _mithril = require('mithril');

var _mithril2 = _interopRequireDefault(_mithril);

var CANVAS_WIDTH = 512;
var CANVAS_HEIGHT = 256;

var SampleVM = (function () {
  function SampleVM(args) {
    _classCallCheck(this, SampleVM);

    this.sampleNode = args.sample;
    this.distortionNode = args.distortion;
    this.index = args.index;
    this.callback = args.callback;
    this.colorLabel = args.colorLabel;
    this.color = args.color;

    this.distortion = _mithril2['default'].prop(10000);
    this.volume = _mithril2['default'].prop(3000);
    this.pitch = _mithril2['default'].prop(10000);
  }

  _createClass(SampleVM, [{
    key: 'onClickPlayButton',
    value: function onClickPlayButton() {
      this.sampleNode.play();
    }
  }, {
    key: 'getSampleName',
    value: function getSampleName() {
      return this.sampleNode.basename;
    }
  }, {
    key: 'onChangeDistortion',
    value: function onChangeDistortion(e) {
      this.distortion(e.target.value);
      this.distortionNode.setDistortion(e.target.value / 10000.0);
    }
  }, {
    key: 'onChangeVolume',
    value: function onChangeVolume(e) {
      this.volume(e.target.value);
      this.distortionNode.setVolume(e.target.value / 10000.0);
    }
  }, {
    key: 'onChangePitch',
    value: function onChangePitch(e) {
      this.pitch(e.target.value);
      this.sampleNode.setPlaybackRate(e.target.value / 10000.0);
    }
  }, {
    key: 'drawWave',
    value: function drawWave(element, isInitialized, context) {
      if (isInitialized) {
        return;
      }

      this.sampleNode.on('waveLoaded', function (wave) {
        var ctx = element.getContext("2d");
        var rect = element.getBoundingClientRect();
        var w = rect.width;
        var h = rect.height;

        ctx.clearRect(0, 0, w, h);

        ctx.lineWidth = 0.3;
        ctx.strokeStyle = '#FFF';

        // Draw waveform
        ctx.translate(0, h * 0.5);
        ctx.beginPath();

        var d = w / wave.length;
        for (var i = 0; i < wave.length; i++) {
          ctx.lineTo(i * d, wave[i] * h * 0.8);
        }

        ctx.stroke();
        ctx.translate(0, -h * 0.5);
      });
    }
  }]);

  return SampleVM;
})();

exports['default'] = {
  controller: function controller(args) {
    return new SampleVM(args);
  },

  view: function view(vm) {
    return (0, _mithril2['default'])('.Sample', {
      'class': vm.colorLabel
    }, [(0, _mithril2['default'])('.Sample__NameLabel', vm.colorLabel), (0, _mithril2['default'])('.Sample__Name', vm.getSampleName()), (0, _mithril2['default'])('.Sample__Play', {
      onclick: vm.onClickPlayButton.bind(vm)
    }, [(0, _mithril2['default'])('.fa.fa-play')]), (0, _mithril2['default'])('canvas.Sample__Wave', {
      config: vm.drawWave.bind(vm)
    }), (0, _mithril2['default'])('.Sample__FXs', [(0, _mithril2['default'])('.Sample__FXs__FX', [(0, _mithril2['default'])('.Sample__FXs__FX__Label', 'gain'), (0, _mithril2['default'])('.Sample__FXs__FX__Value', (vm.distortion() / 10000).toFixed(2)), (0, _mithril2['default'])('input.Sample__FXs__FX__Input', {
      type: 'range',
      min: 10000,
      max: 30000,
      onchange: vm.onChangeDistortion.bind(vm),
      value: vm.distortion()
    })]), (0, _mithril2['default'])('.Sample__FXs__FX', [(0, _mithril2['default'])('.Sample__FXs__FX__Label', 'volume'), (0, _mithril2['default'])('.Sample__FXs__FX__Value', (vm.volume() / 10000).toFixed(2)), (0, _mithril2['default'])('input.Sample__FXs__FX__Input', {
      type: 'range',
      min: 0,
      max: 10000,
      onchange: vm.onChangeVolume.bind(vm),
      value: vm.volume()
    })]), (0, _mithril2['default'])('.Sample__FXs__FX', [(0, _mithril2['default'])('.Sample__FXs__FX__Label', 'pitch'), (0, _mithril2['default'])('.Sample__FXs__FX__Value', (vm.pitch() / 10000).toFixed(2)), (0, _mithril2['default'])('input.Sample__FXs__FX__Input', {
      type: 'range',
      min: 0,
      max: 20000,
      onchange: vm.onChangePitch.bind(vm),
      value: vm.pitch()
    })])])]);
  }

};
module.exports = exports['default'];

},{"mithril":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/node_modules/mithril/mithril.js"}],"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/component/Sampler.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _mithril = require('mithril');

var _mithril2 = _interopRequireDefault(_mithril);

var _Sample = require('./Sample');

var _Sample2 = _interopRequireDefault(_Sample);

var SamplerVM = (function () {
  function SamplerVM(sampler) {
    _classCallCheck(this, SamplerVM);

    this.sampler = sampler;
  }

  _createClass(SamplerVM, [{
    key: 'getKitName',
    value: function getKitName() {
      return 'AMEN';
    }
  }, {
    key: 'changeKit',
    value: function changeKit(e) {
      this.sampler.changeKit(e.target.value);
    }
  }]);

  return SamplerVM;
})();

exports['default'] = {
  controller: function controller(args) {
    return new SamplerVM(args.sampler);
  },

  view: function view(vm) {
    return (0, _mithril2['default'])('.Sampler', [(0, _mithril2['default'])('.Sampler__Header', [(0, _mithril2['default'])('.Sampler__KitName', 'Drumkit'), (0, _mithril2['default'])('select.Sampler__KitSelector', {
      onchange: vm.changeKit.bind(vm)
    }, [(0, _mithril2['default'])('option', { value: 'AMEN', selected: 'selected' }, 'AMEN'), (0, _mithril2['default'])('option', { value: 'GABBA' }, 'GABBA')])]), (0, _mithril2['default'])('.Sampler__Body', [_mithril2['default'].component(_Sample2['default'], {
      sample: vm.sampler.samples[0],
      distortion: vm.sampler.distortions[0],
      colorLabel: 'Red',
      color: '#F88',
      index: 0
    }), _mithril2['default'].component(_Sample2['default'], {
      sample: vm.sampler.samples[1],
      distortion: vm.sampler.distortions[1],
      colorLabel: 'Green',
      color: '#8F8',
      index: 1
    }), _mithril2['default'].component(_Sample2['default'], {
      sample: vm.sampler.samples[2],
      distortion: vm.sampler.distortions[2],
      colorLabel: 'Blue',
      color: '#88F',
      index: 2
    })])]);
  }
};
module.exports = exports['default'];

},{"./Sample":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/component/Sample.js","mithril":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/node_modules/mithril/mithril.js"}],"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/component/Timer.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _mithril = require('mithril');

var _mithril2 = _interopRequireDefault(_mithril);

var MINUTE = 60.0 * 1000;
var SELECT = 9;
var START = 8;

var VM = (function () {
  function VM(args) {
    var _this = this;

    _classCallCheck(this, VM);

    this.pad = args.pad;
    this.callback = args.callback;

    this.beat = 4;
    this.interval = _mithril2['default'].prop(100);
    this.bpm = _mithril2['default'].prop(MINUTE / (this.interval() * this.beat));

    this.lastClickTime = Date.now();

    // Listen to gamepad
    this.pollTimer = null;
    this.pad.on('noteOn', this.poll.bind(this));
    this.pad.on('noteOff', function () {
      clearTimeout(_this.pollTimer);
    });

    this.buttons = this.pad.buttons.map(function (b) {
      return b.pressed;
    });

    this.pad.on('buttons', function (buttons) {
      var isChanged = _this.buttons.some(function (p, i) {
        return p !== buttons[i].pressed;
      });
      if (isChanged) {
        _this.buttons = buttons.map(function (b) {
          return b.pressed;
        });
        _this.beat = 4 * (_this.buttons[9] ? 2 : 1) * (_this.buttons[8] ? 4 : 1);
        _this.interval(MINUTE / (_this.bpm() * _this.beat));
        _mithril2['default'].redraw();
      }
    });
  }

  _createClass(VM, [{
    key: 'onClick',
    value: function onClick() {
      var now = Date.now();
      if (now - this.lastClickTime < 2000) {
        this.interval((now - this.lastClickTime) / this.beat);
        this.bpm(MINUTE / (this.interval() * this.beat));
      }
      this.lastClickTime = now;
    }
  }, {
    key: 'poll',
    value: function poll() {
      this.callback();
      this.pollTimer = setTimeout(this.poll.bind(this), this.interval());
    }
  }]);

  return VM;
})();

exports['default'] = {
  controller: function controller(args) {
    return new VM(args);
  },

  view: function view(vm) {
    return (0, _mithril2['default'])('.Timer', [(0, _mithril2['default'])('.Timer__Row', [(0, _mithril2['default'])('.Timer__Row__Label', 'BPM'), (0, _mithril2['default'])('.Timer__Row__Value', vm.bpm() | 0)]), (0, _mithril2['default'])('.Timer__Row', [(0, _mithril2['default'])('.Timer__Row__Label', 'Interval'), (0, _mithril2['default'])('.Timer__Row__Value', vm.interval() + ' msec')]), (0, _mithril2['default'])('.Timer__TapButton', {
      onclick: vm.onClick.bind(vm)
    }, 'TAP')]);
  }
};
module.exports = exports['default'];

},{"mithril":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/node_modules/mithril/mithril.js"}],"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/index.js":[function(require,module,exports){
'use strict';

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

var _mithril = require('mithril');

var _mithril2 = _interopRequireDefault(_mithril);

var _componentApp = require('./component/App');

var _componentApp2 = _interopRequireDefault(_componentApp);

_mithril2['default'].mount(document.getElementById('App'), _componentApp2['default']);

},{"./component/App":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/component/App.js","mithril":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/node_modules/mithril/mithril.js"}],"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/model/Distortion.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _Node2 = require('./Node');

var _Node3 = _interopRequireDefault(_Node2);

var Distortion = (function (_Node) {
  _inherits(Distortion, _Node);

  function Distortion() {
    _classCallCheck(this, Distortion);

    _get(Object.getPrototypeOf(Distortion.prototype), 'constructor', this).call(this);

    this.waveshaper = this.ctx.createWaveShaper();
    this.distortion = 0.0;

    this.limiter = this.ctx.createDynamicsCompressor();
    this.limiter.threshold.value = 0;
    this.limiter.ratio.value = 20;
    this.limiter.attack.value = 0;

    this.input.connect(this.waveshaper);
    this.waveshaper.connect(this.limiter);
    this.limiter.connect(this.wet);

    this.updateTable();
  }

  _createClass(Distortion, [{
    key: 'setDistortion',
    value: function setDistortion(distortion) {
      this.distortion = distortion;
      this.updateTable();
    }
  }, {
    key: 'setVolume',
    value: function setVolume(volume) {
      this.output.gain.value = volume;
    }
  }, {
    key: 'updateTable',
    value: function updateTable() {
      if (this.distortion >= 1 && this.distortion < 3) {
        var FINE = 2048;
        var HALF = FINE / 2;
        var table = new Float32Array(FINE);

        var biased = Math.pow(this.distortion, 5);
        for (var i = 0; i < FINE; i++) {
          var x = i - HALF;
          var y = biased * x / HALF;
          table[i] = Math.max(Math.min(y, 1.0), -1.0);
        }

        this.waveshaper.curve = table;
      }
    }
  }]);

  return Distortion;
})(_Node3['default']);

exports['default'] = Distortion;
module.exports = exports['default'];

},{"./Node":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/model/Node.js"}],"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/model/Gamepad.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _events = require('events');

var THRESHOLD = -0.3;
var gen = function gen(n, e) {
  var g_ = undefined;return (g_ = function (n, acc) {
    return n <= 0 ? acc : g_(n - 1, [].concat(_toConsumableArray(acc), [e]));
  })(n, []);
};
var BUTTONS = gen(12, { pressed: false });

var KEYS = {
  49: 5,
  50: 1,
  51: 0,
  17: 9,
  16: 8
};

var Gamepad = (function (_EventEmitter) {
  _inherits(Gamepad, _EventEmitter);

  function Gamepad() {
    var _this = this;

    _classCallCheck(this, Gamepad);

    _get(Object.getPrototypeOf(Gamepad.prototype), 'constructor', this).call(this);

    this.timer = null;
    this.isPlaying = false;

    this.buttons = BUTTONS;

    this.isSimulating = true;
    window.addEventListener('gamepadconnected', function () {
      return _this.isSimulating = false;
    });

    this.simulate();
    this.startPolling();
  }

  _createClass(Gamepad, [{
    key: 'toggleSimulate',
    value: function toggleSimulate() {
      this.isSimulating = !this.isSimulating;
    }
  }, {
    key: 'startPolling',
    value: function startPolling() {
      this.timer = setInterval(this.poll.bind(this), 10);
    }
  }, {
    key: 'stopPolling',
    value: function stopPolling() {
      clearInterval(this.timer);
    }
  }, {
    key: 'poll',
    value: function poll() {
      if (this.isSimulating) {
        return;
      }
      var candidates = navigator.getGamepads();
      if (!candidates || candidates.length === 0) {
        return;
      }
      var pads = Object.keys(candidates).map(function (k) {
        return candidates[k];
      }).filter(function (p) {
        return p;
      });
      if (!pads || pads.length === 0) {
        return;
      }
      // const pad = pads.filter()  // TODO :filter only GuitarFreak Controller
      var pad = pads[0];

      this.buttons = pad.buttons;

      this.emit('buttons', this.buttons);

      if (pad.axes[1] < THRESHOLD && !this.isPlaying) {
        this.emit('noteOn');
        this.isPlaying = true;
      }
      if (pad.axes[1] >= THRESHOLD && this.isPlaying) {
        this.emit('noteOff');
        this.isPlaying = false;
      }
    }
  }, {
    key: 'simulate',
    value: function simulate() {
      var _this2 = this;

      window.addEventListener('keydown', function (e) {
        if (!_this2.isSimulating) {
          return false;
        }
        if (KEYS[e.keyCode] != null) {
          _this2.buttons[KEYS[e.keyCode]] = { pressed: true };
          _this2.emit('buttons', _this2.buttons);
        }
        if (e.keyCode === 40 && !_this2.isPlaying) {
          _this2.emit('noteOn');
          _this2.isPlaying = true;
        }
      });
      window.addEventListener('keyup', function (e) {
        if (!_this2.isSimulating) {
          return false;
        }
        if (KEYS[e.keyCode] != null) {
          _this2.buttons[KEYS[e.keyCode]] = { pressed: false };
          _this2.emit('buttons', _this2.buttons);
        }
        if (e.keyCode === 40 && _this2.isPlaying) {
          _this2.emit('noteOff');
          _this2.isPlaying = false;
          _this2.buttons = BUTTONS;
        }
      });
    }
  }]);

  return Gamepad;
})(_events.EventEmitter);

exports['default'] = Gamepad;
module.exports = exports['default'];

},{"events":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/node_modules/events/events.js"}],"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/model/Node.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _Ctx = require('../Ctx');

var _Ctx2 = _interopRequireDefault(_Ctx);

var Node = (function () {
  function Node() {
    _classCallCheck(this, Node);

    this.ctx = _Ctx2['default'];
    this.input = this.ctx.createGain();
    this.output = this.ctx.createGain();
    this.dry = this.ctx.createGain();
    this.wet = this.ctx.createGain();

    this.input.connect(this.dry);
    this.dry.connect(this.output);
    this.wet.connect(this.output);

    this.dryGain = 0.0;
    this.wetGain = 1.0;
    this.updateMix(this.dryGain, this.wetGain);

    this.isOn = true;
  }

  _createClass(Node, [{
    key: 'connect',
    value: function connect(dst) {
      this.output.connect(dst);
    }
  }, {
    key: 'disconnect',
    value: function disconnect(dst) {
      this.output.disconnect(dst);
    }
  }, {
    key: 'setMix',
    value: function setMix(wet) {
      if (wet < 0 || 1.0 < wet) {
        throw new RangeError('setMix : wet must be 0.0 to 1.0');
      }
      this.wetGain = wet;
      this.dryGain = 1.0 - wet;
      this.updateMix(this.wetGain, this.dryGain);
    }
  }, {
    key: 'updateMix',
    value: function updateMix(dry, wet) {
      this.dry.gain.value = dry;
      this.wet.gain.value = wet;
    }
  }, {
    key: 'toggle',
    value: function toggle() {
      this.isOn = !this.isOn;
      if (this.isOn) {
        this.updateMix(this.dryGain, this.wetGain);
      } else {
        this.updateMix(1.0, 0.0);
      }
    }
  }]);

  return Node;
})();

exports['default'] = Node;
module.exports = exports['default'];

},{"../Ctx":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/Ctx.js"}],"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/model/Sample.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _Node2 = require('./Node');

var _Node3 = _interopRequireDefault(_Node2);

var _events = require('events');

var Sample = (function (_Node) {
  _inherits(Sample, _Node);

  function Sample(url) {
    var _this = this;

    _classCallCheck(this, Sample);

    _get(Object.getPrototypeOf(Sample.prototype), 'constructor', this).call(this);
    this.playbackRate = 1.0;
    this.bendRate = 1.0;

    this.eventEmitter = new _events.EventEmitter();

    this.on('sampleLoadSucceeded', function (buffer) {
      _this.buffer = buffer;
      _this.emit('waveLoaded', _this.buffer.getChannelData(0));
    });
  }

  _createClass(Sample, [{
    key: 'on',
    value: function on() {
      this.eventEmitter.on.apply(this.eventEmitter, arguments);
    }
  }, {
    key: 'emit',
    value: function emit() {
      this.eventEmitter.emit.apply(this.eventEmitter, arguments);
    }
  }, {
    key: 'play',
    value: function play() {
      if (this.node) {
        this.node.stop(0);
      }
      this.node = this.ctx.createBufferSource();
      this.node.buffer = this.buffer;
      this.node.playbackRate.value = this.playbackRate * this.bendRate;
      this.node.connect(this.wet);
      this.node.start(0);
    }
  }, {
    key: 'loadSample',
    value: function loadSample(url) {
      var _this2 = this;

      this.basename = url.split('/').pop();

      var req = new XMLHttpRequest();
      req.open('GET', url, true);
      req.responseType = 'arraybuffer';

      req.onload = function () {
        if (!req.response) {
          _this2.emit('sampleLoadFailed', new Error('no response'));
        }
        _this2.ctx.decodeAudioData(req.response, function (buffer) {
          _this2.emit('sampleLoadSucceeded', buffer);
        }, function (err) {
          _this2.emit('sampleLoadFailed', err);
        });
      };

      req.send();
    }
  }, {
    key: 'setPlaybackRate',
    value: function setPlaybackRate(playbackRate) {
      this.playbackRate = playbackRate;
    }
  }, {
    key: 'bend',
    value: function bend(isBending) {
      if (isBending) {
        this.bendRate += (5.0 - this.bendRate) * 0.1;
      } else {
        this.bendRate -= (this.bendRate - 1.0) * 0.6;
      }
    }
  }]);

  return Sample;
})(_Node3['default']);

exports['default'] = Sample;
module.exports = exports['default'];

},{"./Node":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/model/Node.js","events":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/node_modules/events/events.js"}],"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/model/Sampler.js":[function(require,module,exports){
'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _Sample = require('./Sample');

var _Sample2 = _interopRequireDefault(_Sample);

var _Distortion = require('./Distortion');

var _Distortion2 = _interopRequireDefault(_Distortion);

var _Node2 = require('./Node');

var _Node3 = _interopRequireDefault(_Node2);

var KITS = {
  'AMEN': ['./wav/amen/kick_ride.wav', './wav/amen/snare.wav', './wav/amen/kick_crash.wav'],
  'GABBA': ['./wav/gabba/bd.wav', './wav/gabba/clap.wav', './wav/gabba/hat_open.wav']
};

var Sampler = (function (_Node) {
  _inherits(Sampler, _Node);

  function Sampler() {
    var _this = this;

    _classCallCheck(this, Sampler);

    _get(Object.getPrototypeOf(Sampler.prototype), 'constructor', this).call(this);

    this.samples = [new _Sample2['default'](), new _Sample2['default'](), new _Sample2['default']()];

    this.kit = 'AMEN';
    KITS[this.kit].map(function (url, i) {
      _this.samples[i].loadSample(url);
    });

    this.distortions = [new _Distortion2['default'](), new _Distortion2['default'](), new _Distortion2['default']()];

    this.samples.forEach(function (s, i) {
      return s.connect(_this.distortions[i].input);
    });
    this.distortions.forEach(function (d) {
      return d.connect(_this.wet);
    });
  }

  _createClass(Sampler, [{
    key: 'changeKit',
    value: function changeKit(kit) {
      var _this2 = this;

      this.kit = kit;
      KITS[this.kit].forEach(function (url, i) {
        _this2.samples[i].loadSample(url);
      });
    }
  }, {
    key: 'playNotes',
    value: function playNotes(notes) {
      notes.forEach(this.playNote.bind(this));
    }
  }, {
    key: 'playNote',
    value: function playNote(note) {
      if (!this.samples[note]) {
        return;
      }
      this.samples[note].play();
    }
  }, {
    key: 'bend',
    value: function bend(isBending) {
      this.samples.map(function (s) {
        return s.bend(isBending);
      });
    }
  }]);

  return Sampler;
})(_Node3['default']);

exports['default'] = Sampler;
module.exports = exports['default'];

},{"./Distortion":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/model/Distortion.js","./Node":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/model/Node.js","./Sample":"/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/model/Sample.js"}]},{},["/Users/amagitakayosi/src/github.com/fand/GuitarBreak/src/js/index.js"])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJub2RlX21vZHVsZXMvZXZlbnRzL2V2ZW50cy5qcyIsIm5vZGVfbW9kdWxlcy9taXRocmlsL21pdGhyaWwuanMiLCIvVXNlcnMvYW1hZ2l0YWtheW9zaS9zcmMvZ2l0aHViLmNvbS9mYW5kL0d1aXRhckJyZWFrL3NyYy9qcy9DdHguanMiLCIvVXNlcnMvYW1hZ2l0YWtheW9zaS9zcmMvZ2l0aHViLmNvbS9mYW5kL0d1aXRhckJyZWFrL3NyYy9qcy9jb21wb25lbnQvQXBwLmpzIiwiL1VzZXJzL2FtYWdpdGFrYXlvc2kvc3JjL2dpdGh1Yi5jb20vZmFuZC9HdWl0YXJCcmVhay9zcmMvanMvY29tcG9uZW50L0dhbWVwYWQuanMiLCIvVXNlcnMvYW1hZ2l0YWtheW9zaS9zcmMvZ2l0aHViLmNvbS9mYW5kL0d1aXRhckJyZWFrL3NyYy9qcy9jb21wb25lbnQvTWFzdGVyRGlzdG9ydGlvbi5qcyIsIi9Vc2Vycy9hbWFnaXRha2F5b3NpL3NyYy9naXRodWIuY29tL2ZhbmQvR3VpdGFyQnJlYWsvc3JjL2pzL2NvbXBvbmVudC9TYW1wbGUuanMiLCIvVXNlcnMvYW1hZ2l0YWtheW9zaS9zcmMvZ2l0aHViLmNvbS9mYW5kL0d1aXRhckJyZWFrL3NyYy9qcy9jb21wb25lbnQvU2FtcGxlci5qcyIsIi9Vc2Vycy9hbWFnaXRha2F5b3NpL3NyYy9naXRodWIuY29tL2ZhbmQvR3VpdGFyQnJlYWsvc3JjL2pzL2NvbXBvbmVudC9UaW1lci5qcyIsIi9Vc2Vycy9hbWFnaXRha2F5b3NpL3NyYy9naXRodWIuY29tL2ZhbmQvR3VpdGFyQnJlYWsvc3JjL2pzL2luZGV4LmpzIiwiL1VzZXJzL2FtYWdpdGFrYXlvc2kvc3JjL2dpdGh1Yi5jb20vZmFuZC9HdWl0YXJCcmVhay9zcmMvanMvbW9kZWwvRGlzdG9ydGlvbi5qcyIsIi9Vc2Vycy9hbWFnaXRha2F5b3NpL3NyYy9naXRodWIuY29tL2ZhbmQvR3VpdGFyQnJlYWsvc3JjL2pzL21vZGVsL0dhbWVwYWQuanMiLCIvVXNlcnMvYW1hZ2l0YWtheW9zaS9zcmMvZ2l0aHViLmNvbS9mYW5kL0d1aXRhckJyZWFrL3NyYy9qcy9tb2RlbC9Ob2RlLmpzIiwiL1VzZXJzL2FtYWdpdGFrYXlvc2kvc3JjL2dpdGh1Yi5jb20vZmFuZC9HdWl0YXJCcmVhay9zcmMvanMvbW9kZWwvU2FtcGxlLmpzIiwiL1VzZXJzL2FtYWdpdGFrYXlvc2kvc3JjL2dpdGh1Yi5jb20vZmFuZC9HdWl0YXJCcmVhay9zcmMvanMvbW9kZWwvU2FtcGxlci5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQ0FBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDN1NBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7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Q0FBQyxPQUFPLENBQUMsTUFBSyxXQUFXLENBQUMsQ0FBQyxDQUFDLENBQUMsS0FBSyxDQUFDO0tBQUEsQ0FBQyxDQUFDO0FBQ3JFLFFBQUksQ0FBQyxXQUFXLENBQUMsT0FBTyxDQUFDLFVBQUEsQ0FBQzthQUFJLENBQUMsQ0FBQyxPQUFPLENBQUMsTUFBSyxHQUFHLENBQUM7S0FBQSxDQUFDLENBQUM7R0FDcEQ7O2VBcEJHLE9BQU87O1dBc0JELG1CQUFDLEdBQUcsRUFBRTs7O0FBQ2QsVUFBSSxDQUFDLEdBQUcsR0FBRyxHQUFHLENBQUM7QUFDZixVQUFJLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDLE9BQU8sQ0FBQyxVQUFDLEdBQUcsRUFBRSxDQUFDLEVBQUs7QUFDakMsZUFBSyxPQUFPLENBQUMsQ0FBQyxDQUFDLENBQUMsVUFBVSxDQUFDLEdBQUcsQ0FBQyxDQUFDO09BQ2pDLENBQUMsQ0FBQztLQUNKOzs7V0FFUyxtQkFBQyxLQUFLLEVBQUU7QUFDaEIsV0FBSyxDQUFDLE9BQU8sQ0FBRyxJQUFJLENBQUMsUUFBUSxNQUFiLElBQUksRUFBVSxDQUFDO0tBQ2hDOzs7V0FFUSxrQkFBQyxJQUFJLEVBQUU7QUFDZCxVQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsRUFBRTtBQUFFLGVBQU87T0FBRTtBQUNwQyxVQUFJLENBQUMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLElBQUksRUFBRSxDQUFDO0tBQzNCOzs7V0FFSSxjQUFDLFNBQVMsRUFBRTtBQUNmLFVBQUksQ0FBQyxPQUFPLENBQUMsR0FBRyxDQUFDLFVBQUEsQ0FBQztlQUFJLENBQUMsQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDO09BQUEsQ0FBQyxDQUFDO0tBQzFDOzs7U0F4Q0csT0FBTzs7O3FCQTRDRSxPQUFPIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIi8vIENvcHlyaWdodCBKb3llbnQsIEluYy4gYW5kIG90aGVyIE5vZGUgY29udHJpYnV0b3JzLlxuLy9cbi8vIFBlcm1pc3Npb24gaXMgaGVyZWJ5IGdyYW50ZWQsIGZyZWUgb2YgY2hhcmdlLCB0byBhbnkgcGVyc29uIG9idGFpbmluZyBhXG4vLyBjb3B5IG9mIHRoaXMgc29mdHdhcmUgYW5kIGFzc29jaWF0ZWQgZG9jdW1lbnRhdGlvbiBmaWxlcyAodGhlXG4vLyBcIlNvZnR3YXJlXCIpLCB0byBkZWFsIGluIHRoZSBTb2Z0d2FyZSB3aXRob3V0IHJlc3RyaWN0aW9uLCBpbmNsdWRpbmdcbi8vIHdpdGhvdXQgbGltaXRhdGlvbiB0aGUgcmlnaHRzIHRvIHVzZSwgY29weSwgbW9kaWZ5LCBtZXJnZSwgcHVibGlzaCxcbi8vIGRpc3RyaWJ1dGUsIHN1YmxpY2Vuc2UsIGFuZC9vciBzZWxsIGNvcGllcyBvZiB0aGUgU29mdHdhcmUsIGFuZCB0byBwZXJtaXRcbi8vIHBlcnNvbnMgdG8gd2hvbSB0aGUgU29mdHdhcmUgaXMgZnVybmlzaGVkIHRvIGRvIHNvLCBzdWJqZWN0IHRvIHRoZVxuLy8gZm9sbG93aW5nIGNvbmRpdGlvbnM6XG4vL1xuLy8gVGhlIGFib3ZlIGNvcHlyaWdodCBub3RpY2UgYW5kIHRoaXMgcGVybWlzc2lvbiBub3RpY2Ugc2hhbGwgYmUgaW5jbHVkZWRcbi8vIGluIGFsbCBjb3BpZXMgb3Igc3Vic3RhbnRpYWwgcG9ydGlvbnMgb2YgdGhlIFNvZnR3YXJlLlxuLy9cbi8vIFRIRSBTT0ZUV0FSRSBJUyBQUk9WSURFRCBcIkFTIElTXCIsIFdJVEhPVVQgV0FSUkFOVFkgT0YgQU5ZIEtJTkQsIEVYUFJFU1Ncbi8vIE9SIElNUExJRUQsIElOQ0xVRElORyBCVVQgTk9UIExJTUlURUQgVE8gVEhFIFdBUlJBTlRJRVMgT0Zcbi8vIE1FUkNIQU5UQUJJTElUWSwgRklUTkVTUyBGT1IgQSBQQVJUSUNVTEFSIFBVUlBPU0UgQU5EIE5PTklORlJJTkdFTUVOVC4gSU5cbi8vIE5PIEVWRU5UIFNIQUxMIFRIRSBBVVRIT1JTIE9SIENPUFlSSUdIVCBIT0xERVJTIEJFIExJQUJMRSBGT1IgQU5ZIENMQUlNLFxuLy8gREFNQUdFUyBPUiBPVEhFUiBMSUFCSUxJVFksIFdIRVRIRVIgSU4gQU4gQUNUSU9OIE9GIENPTlRSQUNULCBUT1JUIE9SXG4vLyBPVEhFUldJU0UsIEFSSVNJTkcgRlJPTSwgT1VUIE9GIE9SIElOIENPTk5FQ1RJT04gV0lUSCBUSEUgU09GVFdBUkUgT1IgVEhFXG4vLyBVU0UgT1IgT1RIRVIgREVBTElOR1MgSU4gVEhFIFNPRlRXQVJFLlxuXG5mdW5jdGlvbiBFdmVudEVtaXR0ZXIoKSB7XG4gIHRoaXMuX2V2ZW50cyA9IHRoaXMuX2V2ZW50cyB8fCB7fTtcbiAgdGhpcy5fbWF4TGlzdGVuZXJzID0gdGhpcy5fbWF4TGlzdGVuZXJzIHx8IHVuZGVmaW5lZDtcbn1cbm1vZHVsZS5leHBvcnRzID0gRXZlbnRFbWl0dGVyO1xuXG4vLyBCYWNrd2FyZHMtY29tcGF0IHdpdGggbm9kZSAwLjEwLnhcbkV2ZW50RW1pdHRlci5FdmVudEVtaXR0ZXIgPSBFdmVudEVtaXR0ZXI7XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX2V2ZW50cyA9IHVuZGVmaW5lZDtcbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuX21heExpc3RlbmVycyA9IHVuZGVmaW5lZDtcblxuLy8gQnkgZGVmYXVsdCBFdmVudEVtaXR0ZXJzIHdpbGwgcHJpbnQgYSB3YXJuaW5nIGlmIG1vcmUgdGhhbiAxMCBsaXN0ZW5lcnMgYXJlXG4vLyBhZGRlZCB0byBpdC4gVGhpcyBpcyBhIHVzZWZ1bCBkZWZhdWx0IHdoaWNoIGhlbHBzIGZpbmRpbmcgbWVtb3J5IGxlYWtzLlxuRXZlbnRFbWl0dGVyLmRlZmF1bHRNYXhMaXN0ZW5lcnMgPSAxMDtcblxuLy8gT2J2aW91c2x5IG5vdCBhbGwgRW1pdHRlcnMgc2hvdWxkIGJlIGxpbWl0ZWQgdG8gMTAuIFRoaXMgZnVuY3Rpb24gYWxsb3dzXG4vLyB0aGF0IHRvIGJlIGluY3JlYXNlZC4gU2V0IHRvIHplcm8gZm9yIHVubGltaXRlZC5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuc2V0TWF4TGlzdGVuZXJzID0gZnVuY3Rpb24obikge1xuICBpZiAoIWlzTnVtYmVyKG4pIHx8IG4gPCAwIHx8IGlzTmFOKG4pKVxuICAgIHRocm93IFR5cGVFcnJvcignbiBtdXN0IGJlIGEgcG9zaXRpdmUgbnVtYmVyJyk7XG4gIHRoaXMuX21heExpc3RlbmVycyA9IG47XG4gIHJldHVybiB0aGlzO1xufTtcblxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5lbWl0ID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgZXIsIGhhbmRsZXIsIGxlbiwgYXJncywgaSwgbGlzdGVuZXJzO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzKVxuICAgIHRoaXMuX2V2ZW50cyA9IHt9O1xuXG4gIC8vIElmIHRoZXJlIGlzIG5vICdlcnJvcicgZXZlbnQgbGlzdGVuZXIgdGhlbiB0aHJvdy5cbiAgaWYgKHR5cGUgPT09ICdlcnJvcicpIHtcbiAgICBpZiAoIXRoaXMuX2V2ZW50cy5lcnJvciB8fFxuICAgICAgICAoaXNPYmplY3QodGhpcy5fZXZlbnRzLmVycm9yKSAmJiAhdGhpcy5fZXZlbnRzLmVycm9yLmxlbmd0aCkpIHtcbiAgICAgIGVyID0gYXJndW1lbnRzWzFdO1xuICAgICAgaWYgKGVyIGluc3RhbmNlb2YgRXJyb3IpIHtcbiAgICAgICAgdGhyb3cgZXI7IC8vIFVuaGFuZGxlZCAnZXJyb3InIGV2ZW50XG4gICAgICB9XG4gICAgICB0aHJvdyBUeXBlRXJyb3IoJ1VuY2F1Z2h0LCB1bnNwZWNpZmllZCBcImVycm9yXCIgZXZlbnQuJyk7XG4gICAgfVxuICB9XG5cbiAgaGFuZGxlciA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNVbmRlZmluZWQoaGFuZGxlcikpXG4gICAgcmV0dXJuIGZhbHNlO1xuXG4gIGlmIChpc0Z1bmN0aW9uKGhhbmRsZXIpKSB7XG4gICAgc3dpdGNoIChhcmd1bWVudHMubGVuZ3RoKSB7XG4gICAgICAvLyBmYXN0IGNhc2VzXG4gICAgICBjYXNlIDE6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICBjYXNlIDI6XG4gICAgICAgIGhhbmRsZXIuY2FsbCh0aGlzLCBhcmd1bWVudHNbMV0pO1xuICAgICAgICBicmVhaztcbiAgICAgIGNhc2UgMzpcbiAgICAgICAgaGFuZGxlci5jYWxsKHRoaXMsIGFyZ3VtZW50c1sxXSwgYXJndW1lbnRzWzJdKTtcbiAgICAgICAgYnJlYWs7XG4gICAgICAvLyBzbG93ZXJcbiAgICAgIGRlZmF1bHQ6XG4gICAgICAgIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG4gICAgICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgICAgIGZvciAoaSA9IDE7IGkgPCBsZW47IGkrKylcbiAgICAgICAgICBhcmdzW2kgLSAxXSA9IGFyZ3VtZW50c1tpXTtcbiAgICAgICAgaGFuZGxlci5hcHBseSh0aGlzLCBhcmdzKTtcbiAgICB9XG4gIH0gZWxzZSBpZiAoaXNPYmplY3QoaGFuZGxlcikpIHtcbiAgICBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuICAgIGFyZ3MgPSBuZXcgQXJyYXkobGVuIC0gMSk7XG4gICAgZm9yIChpID0gMTsgaSA8IGxlbjsgaSsrKVxuICAgICAgYXJnc1tpIC0gMV0gPSBhcmd1bWVudHNbaV07XG5cbiAgICBsaXN0ZW5lcnMgPSBoYW5kbGVyLnNsaWNlKCk7XG4gICAgbGVuID0gbGlzdGVuZXJzLmxlbmd0aDtcbiAgICBmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspXG4gICAgICBsaXN0ZW5lcnNbaV0uYXBwbHkodGhpcywgYXJncyk7XG4gIH1cblxuICByZXR1cm4gdHJ1ZTtcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUuYWRkTGlzdGVuZXIgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICB2YXIgbTtcblxuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgdGhpcy5fZXZlbnRzID0ge307XG5cbiAgLy8gVG8gYXZvaWQgcmVjdXJzaW9uIGluIHRoZSBjYXNlIHRoYXQgdHlwZSA9PT0gXCJuZXdMaXN0ZW5lclwiISBCZWZvcmVcbiAgLy8gYWRkaW5nIGl0IHRvIHRoZSBsaXN0ZW5lcnMsIGZpcnN0IGVtaXQgXCJuZXdMaXN0ZW5lclwiLlxuICBpZiAodGhpcy5fZXZlbnRzLm5ld0xpc3RlbmVyKVxuICAgIHRoaXMuZW1pdCgnbmV3TGlzdGVuZXInLCB0eXBlLFxuICAgICAgICAgICAgICBpc0Z1bmN0aW9uKGxpc3RlbmVyLmxpc3RlbmVyKSA/XG4gICAgICAgICAgICAgIGxpc3RlbmVyLmxpc3RlbmVyIDogbGlzdGVuZXIpO1xuXG4gIGlmICghdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIC8vIE9wdGltaXplIHRoZSBjYXNlIG9mIG9uZSBsaXN0ZW5lci4gRG9uJ3QgbmVlZCB0aGUgZXh0cmEgYXJyYXkgb2JqZWN0LlxuICAgIHRoaXMuX2V2ZW50c1t0eXBlXSA9IGxpc3RlbmVyO1xuICBlbHNlIGlmIChpc09iamVjdCh0aGlzLl9ldmVudHNbdHlwZV0pKVxuICAgIC8vIElmIHdlJ3ZlIGFscmVhZHkgZ290IGFuIGFycmF5LCBqdXN0IGFwcGVuZC5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0ucHVzaChsaXN0ZW5lcik7XG4gIGVsc2VcbiAgICAvLyBBZGRpbmcgdGhlIHNlY29uZCBlbGVtZW50LCBuZWVkIHRvIGNoYW5nZSB0byBhcnJheS5cbiAgICB0aGlzLl9ldmVudHNbdHlwZV0gPSBbdGhpcy5fZXZlbnRzW3R5cGVdLCBsaXN0ZW5lcl07XG5cbiAgLy8gQ2hlY2sgZm9yIGxpc3RlbmVyIGxlYWtcbiAgaWYgKGlzT2JqZWN0KHRoaXMuX2V2ZW50c1t0eXBlXSkgJiYgIXRoaXMuX2V2ZW50c1t0eXBlXS53YXJuZWQpIHtcbiAgICB2YXIgbTtcbiAgICBpZiAoIWlzVW5kZWZpbmVkKHRoaXMuX21heExpc3RlbmVycykpIHtcbiAgICAgIG0gPSB0aGlzLl9tYXhMaXN0ZW5lcnM7XG4gICAgfSBlbHNlIHtcbiAgICAgIG0gPSBFdmVudEVtaXR0ZXIuZGVmYXVsdE1heExpc3RlbmVycztcbiAgICB9XG5cbiAgICBpZiAobSAmJiBtID4gMCAmJiB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoID4gbSkge1xuICAgICAgdGhpcy5fZXZlbnRzW3R5cGVdLndhcm5lZCA9IHRydWU7XG4gICAgICBjb25zb2xlLmVycm9yKCcobm9kZSkgd2FybmluZzogcG9zc2libGUgRXZlbnRFbWl0dGVyIG1lbW9yeSAnICtcbiAgICAgICAgICAgICAgICAgICAgJ2xlYWsgZGV0ZWN0ZWQuICVkIGxpc3RlbmVycyBhZGRlZC4gJyArXG4gICAgICAgICAgICAgICAgICAgICdVc2UgZW1pdHRlci5zZXRNYXhMaXN0ZW5lcnMoKSB0byBpbmNyZWFzZSBsaW1pdC4nLFxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9ldmVudHNbdHlwZV0ubGVuZ3RoKTtcbiAgICAgIGlmICh0eXBlb2YgY29uc29sZS50cmFjZSA9PT0gJ2Z1bmN0aW9uJykge1xuICAgICAgICAvLyBub3Qgc3VwcG9ydGVkIGluIElFIDEwXG4gICAgICAgIGNvbnNvbGUudHJhY2UoKTtcbiAgICAgIH1cbiAgICB9XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUub24gPSBFdmVudEVtaXR0ZXIucHJvdG90eXBlLmFkZExpc3RlbmVyO1xuXG5FdmVudEVtaXR0ZXIucHJvdG90eXBlLm9uY2UgPSBmdW5jdGlvbih0eXBlLCBsaXN0ZW5lcikge1xuICBpZiAoIWlzRnVuY3Rpb24obGlzdGVuZXIpKVxuICAgIHRocm93IFR5cGVFcnJvcignbGlzdGVuZXIgbXVzdCBiZSBhIGZ1bmN0aW9uJyk7XG5cbiAgdmFyIGZpcmVkID0gZmFsc2U7XG5cbiAgZnVuY3Rpb24gZygpIHtcbiAgICB0aGlzLnJlbW92ZUxpc3RlbmVyKHR5cGUsIGcpO1xuXG4gICAgaWYgKCFmaXJlZCkge1xuICAgICAgZmlyZWQgPSB0cnVlO1xuICAgICAgbGlzdGVuZXIuYXBwbHkodGhpcywgYXJndW1lbnRzKTtcbiAgICB9XG4gIH1cblxuICBnLmxpc3RlbmVyID0gbGlzdGVuZXI7XG4gIHRoaXMub24odHlwZSwgZyk7XG5cbiAgcmV0dXJuIHRoaXM7XG59O1xuXG4vLyBlbWl0cyBhICdyZW1vdmVMaXN0ZW5lcicgZXZlbnQgaWZmIHRoZSBsaXN0ZW5lciB3YXMgcmVtb3ZlZFxuRXZlbnRFbWl0dGVyLnByb3RvdHlwZS5yZW1vdmVMaXN0ZW5lciA9IGZ1bmN0aW9uKHR5cGUsIGxpc3RlbmVyKSB7XG4gIHZhciBsaXN0LCBwb3NpdGlvbiwgbGVuZ3RoLCBpO1xuXG4gIGlmICghaXNGdW5jdGlvbihsaXN0ZW5lcikpXG4gICAgdGhyb3cgVHlwZUVycm9yKCdsaXN0ZW5lciBtdXN0IGJlIGEgZnVuY3Rpb24nKTtcblxuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldHVybiB0aGlzO1xuXG4gIGxpc3QgPSB0aGlzLl9ldmVudHNbdHlwZV07XG4gIGxlbmd0aCA9IGxpc3QubGVuZ3RoO1xuICBwb3NpdGlvbiA9IC0xO1xuXG4gIGlmIChsaXN0ID09PSBsaXN0ZW5lciB8fFxuICAgICAgKGlzRnVuY3Rpb24obGlzdC5saXN0ZW5lcikgJiYgbGlzdC5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICBpZiAodGhpcy5fZXZlbnRzLnJlbW92ZUxpc3RlbmVyKVxuICAgICAgdGhpcy5lbWl0KCdyZW1vdmVMaXN0ZW5lcicsIHR5cGUsIGxpc3RlbmVyKTtcblxuICB9IGVsc2UgaWYgKGlzT2JqZWN0KGxpc3QpKSB7XG4gICAgZm9yIChpID0gbGVuZ3RoOyBpLS0gPiAwOykge1xuICAgICAgaWYgKGxpc3RbaV0gPT09IGxpc3RlbmVyIHx8XG4gICAgICAgICAgKGxpc3RbaV0ubGlzdGVuZXIgJiYgbGlzdFtpXS5saXN0ZW5lciA9PT0gbGlzdGVuZXIpKSB7XG4gICAgICAgIHBvc2l0aW9uID0gaTtcbiAgICAgICAgYnJlYWs7XG4gICAgICB9XG4gICAgfVxuXG4gICAgaWYgKHBvc2l0aW9uIDwgMClcbiAgICAgIHJldHVybiB0aGlzO1xuXG4gICAgaWYgKGxpc3QubGVuZ3RoID09PSAxKSB7XG4gICAgICBsaXN0Lmxlbmd0aCA9IDA7XG4gICAgICBkZWxldGUgdGhpcy5fZXZlbnRzW3R5cGVdO1xuICAgIH0gZWxzZSB7XG4gICAgICBsaXN0LnNwbGljZShwb3NpdGlvbiwgMSk7XG4gICAgfVxuXG4gICAgaWYgKHRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcilcbiAgICAgIHRoaXMuZW1pdCgncmVtb3ZlTGlzdGVuZXInLCB0eXBlLCBsaXN0ZW5lcik7XG4gIH1cblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUucmVtb3ZlQWxsTGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIga2V5LCBsaXN0ZW5lcnM7XG5cbiAgaWYgKCF0aGlzLl9ldmVudHMpXG4gICAgcmV0dXJuIHRoaXM7XG5cbiAgLy8gbm90IGxpc3RlbmluZyBmb3IgcmVtb3ZlTGlzdGVuZXIsIG5vIG5lZWQgdG8gZW1pdFxuICBpZiAoIXRoaXMuX2V2ZW50cy5yZW1vdmVMaXN0ZW5lcikge1xuICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKVxuICAgICAgdGhpcy5fZXZlbnRzID0ge307XG4gICAgZWxzZSBpZiAodGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgICAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIC8vIGVtaXQgcmVtb3ZlTGlzdGVuZXIgZm9yIGFsbCBsaXN0ZW5lcnMgb24gYWxsIGV2ZW50c1xuICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMCkge1xuICAgIGZvciAoa2V5IGluIHRoaXMuX2V2ZW50cykge1xuICAgICAgaWYgKGtleSA9PT0gJ3JlbW92ZUxpc3RlbmVyJykgY29udGludWU7XG4gICAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycyhrZXkpO1xuICAgIH1cbiAgICB0aGlzLnJlbW92ZUFsbExpc3RlbmVycygncmVtb3ZlTGlzdGVuZXInKTtcbiAgICB0aGlzLl9ldmVudHMgPSB7fTtcbiAgICByZXR1cm4gdGhpcztcbiAgfVxuXG4gIGxpc3RlbmVycyA9IHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICBpZiAoaXNGdW5jdGlvbihsaXN0ZW5lcnMpKSB7XG4gICAgdGhpcy5yZW1vdmVMaXN0ZW5lcih0eXBlLCBsaXN0ZW5lcnMpO1xuICB9IGVsc2Uge1xuICAgIC8vIExJRk8gb3JkZXJcbiAgICB3aGlsZSAobGlzdGVuZXJzLmxlbmd0aClcbiAgICAgIHRoaXMucmVtb3ZlTGlzdGVuZXIodHlwZSwgbGlzdGVuZXJzW2xpc3RlbmVycy5sZW5ndGggLSAxXSk7XG4gIH1cbiAgZGVsZXRlIHRoaXMuX2V2ZW50c1t0eXBlXTtcblxuICByZXR1cm4gdGhpcztcbn07XG5cbkV2ZW50RW1pdHRlci5wcm90b3R5cGUubGlzdGVuZXJzID0gZnVuY3Rpb24odHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIXRoaXMuX2V2ZW50cyB8fCAhdGhpcy5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IFtdO1xuICBlbHNlIGlmIChpc0Z1bmN0aW9uKHRoaXMuX2V2ZW50c1t0eXBlXSkpXG4gICAgcmV0ID0gW3RoaXMuX2V2ZW50c1t0eXBlXV07XG4gIGVsc2VcbiAgICByZXQgPSB0aGlzLl9ldmVudHNbdHlwZV0uc2xpY2UoKTtcbiAgcmV0dXJuIHJldDtcbn07XG5cbkV2ZW50RW1pdHRlci5saXN0ZW5lckNvdW50ID0gZnVuY3Rpb24oZW1pdHRlciwgdHlwZSkge1xuICB2YXIgcmV0O1xuICBpZiAoIWVtaXR0ZXIuX2V2ZW50cyB8fCAhZW1pdHRlci5fZXZlbnRzW3R5cGVdKVxuICAgIHJldCA9IDA7XG4gIGVsc2UgaWYgKGlzRnVuY3Rpb24oZW1pdHRlci5fZXZlbnRzW3R5cGVdKSlcbiAgICByZXQgPSAxO1xuICBlbHNlXG4gICAgcmV0ID0gZW1pdHRlci5fZXZlbnRzW3R5cGVdLmxlbmd0aDtcbiAgcmV0dXJuIHJldDtcbn07XG5cbmZ1bmN0aW9uIGlzRnVuY3Rpb24oYXJnKSB7XG4gIHJldHVybiB0eXBlb2YgYXJnID09PSAnZnVuY3Rpb24nO1xufVxuXG5mdW5jdGlvbiBpc051bWJlcihhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdudW1iZXInO1xufVxuXG5mdW5jdGlvbiBpc09iamVjdChhcmcpIHtcbiAgcmV0dXJuIHR5cGVvZiBhcmcgPT09ICdvYmplY3QnICYmIGFyZyAhPT0gbnVsbDtcbn1cblxuZnVuY3Rpb24gaXNVbmRlZmluZWQoYXJnKSB7XG4gIHJldHVybiBhcmcgPT09IHZvaWQgMDtcbn1cbiIsIi8qIGdsb2JhbCBQcm9taXNlICovXHJcblxyXG47KGZ1bmN0aW9uIChnbG9iYWwsIGZhY3RvcnkpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxyXG5cdFwidXNlIHN0cmljdFwiXHJcblx0LyogZXNsaW50LWRpc2FibGUgbm8tdW5kZWYgKi9cclxuXHR2YXIgbSA9IGZhY3RvcnkoZ2xvYmFsKVxyXG5cdC8qXHRTZXQgZGVwZW5kZW5jaWVzIHdoZW4gbm8gd2luZG93IGZvciBpc29tb3JwaGljIGNvbXBhdGliaWxpdHkgKi9cclxuXHRpZih0eXBlb2Ygd2luZG93ID09PSBcInVuZGVmaW5lZFwiKSB7XHJcblx0XHRtLmRlcHMoe1xyXG5cdFx0XHRkb2N1bWVudDogdHlwZW9mIGRvY3VtZW50ICE9PSBcInVuZGVmaW5lZFwiID8gZG9jdW1lbnQgOiB7fSxcclxuXHRcdFx0bG9jYXRpb246IHR5cGVvZiBsb2NhdGlvbiAhPT0gXCJ1bmRlZmluZWRcIiA/IGxvY2F0aW9uIDoge30sXHJcblx0XHRcdGNsZWFyVGltZW91dDogY2xlYXJUaW1lb3V0LFxyXG5cdFx0XHRzZXRUaW1lb3V0OiBzZXRUaW1lb3V0XHJcblx0XHR9KVxyXG5cdH1cclxuXHRpZiAodHlwZW9mIG1vZHVsZSA9PT0gXCJvYmplY3RcIiAmJiBtb2R1bGUgIT0gbnVsbCAmJiBtb2R1bGUuZXhwb3J0cykge1xyXG5cdFx0bW9kdWxlLmV4cG9ydHMgPSBtXHJcblx0fSBlbHNlIGlmICh0eXBlb2YgZGVmaW5lID09PSBcImZ1bmN0aW9uXCIgJiYgZGVmaW5lLmFtZCkge1xyXG5cdFx0ZGVmaW5lKGZ1bmN0aW9uICgpIHsgcmV0dXJuIG0gfSlcclxuXHR9IGVsc2Uge1xyXG5cdFx0Z2xvYmFsLm0gPSBtXHJcblx0fVxyXG5cdC8qIGVzbGludC1lbmFibGUgbm8tdW5kZWYgKi9cclxufSkodHlwZW9mIHdpbmRvdyAhPT0gXCJ1bmRlZmluZWRcIiA/IHdpbmRvdyA6IHRoaXMsIGZ1bmN0aW9uIGZhY3RvcnkoZ2xvYmFsLCB1bmRlZmluZWQpIHsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxyXG5cdFwidXNlIHN0cmljdFwiXHJcblxyXG5cdG0udmVyc2lvbiA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHJldHVybiBcInYwLjIuOFwiXHJcblx0fVxyXG5cclxuXHR2YXIgaGFzT3duID0ge30uaGFzT3duUHJvcGVydHlcclxuXHR2YXIgdHlwZSA9IHt9LnRvU3RyaW5nXHJcblxyXG5cdGZ1bmN0aW9uIGlzRnVuY3Rpb24ob2JqZWN0KSB7XHJcblx0XHRyZXR1cm4gdHlwZW9mIG9iamVjdCA9PT0gXCJmdW5jdGlvblwiXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBpc09iamVjdChvYmplY3QpIHtcclxuXHRcdHJldHVybiB0eXBlLmNhbGwob2JqZWN0KSA9PT0gXCJbb2JqZWN0IE9iamVjdF1cIlxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gaXNTdHJpbmcob2JqZWN0KSB7XHJcblx0XHRyZXR1cm4gdHlwZS5jYWxsKG9iamVjdCkgPT09IFwiW29iamVjdCBTdHJpbmddXCJcclxuXHR9XHJcblxyXG5cdHZhciBpc0FycmF5ID0gQXJyYXkuaXNBcnJheSB8fCBmdW5jdGlvbiAob2JqZWN0KSB7XHJcblx0XHRyZXR1cm4gdHlwZS5jYWxsKG9iamVjdCkgPT09IFwiW29iamVjdCBBcnJheV1cIlxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gbm9vcCgpIHt9XHJcblxyXG5cdHZhciB2b2lkRWxlbWVudHMgPSB7XHJcblx0XHRBUkVBOiAxLFxyXG5cdFx0QkFTRTogMSxcclxuXHRcdEJSOiAxLFxyXG5cdFx0Q09MOiAxLFxyXG5cdFx0Q09NTUFORDogMSxcclxuXHRcdEVNQkVEOiAxLFxyXG5cdFx0SFI6IDEsXHJcblx0XHRJTUc6IDEsXHJcblx0XHRJTlBVVDogMSxcclxuXHRcdEtFWUdFTjogMSxcclxuXHRcdExJTks6IDEsXHJcblx0XHRNRVRBOiAxLFxyXG5cdFx0UEFSQU06IDEsXHJcblx0XHRTT1VSQ0U6IDEsXHJcblx0XHRUUkFDSzogMSxcclxuXHRcdFdCUjogMVxyXG5cdH1cclxuXHJcblx0Ly8gY2FjaGluZyBjb21tb25seSB1c2VkIHZhcmlhYmxlc1xyXG5cdHZhciAkZG9jdW1lbnQsICRsb2NhdGlvbiwgJHJlcXVlc3RBbmltYXRpb25GcmFtZSwgJGNhbmNlbEFuaW1hdGlvbkZyYW1lXHJcblxyXG5cdC8vIHNlbGYgaW52b2tpbmcgZnVuY3Rpb24gbmVlZGVkIGJlY2F1c2Ugb2YgdGhlIHdheSBtb2NrcyB3b3JrXHJcblx0ZnVuY3Rpb24gaW5pdGlhbGl6ZShtb2NrKSB7XHJcblx0XHQkZG9jdW1lbnQgPSBtb2NrLmRvY3VtZW50XHJcblx0XHQkbG9jYXRpb24gPSBtb2NrLmxvY2F0aW9uXHJcblx0XHQkY2FuY2VsQW5pbWF0aW9uRnJhbWUgPSBtb2NrLmNhbmNlbEFuaW1hdGlvbkZyYW1lIHx8IG1vY2suY2xlYXJUaW1lb3V0XHJcblx0XHQkcmVxdWVzdEFuaW1hdGlvbkZyYW1lID0gbW9jay5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUgfHwgbW9jay5zZXRUaW1lb3V0XHJcblx0fVxyXG5cclxuXHQvLyB0ZXN0aW5nIEFQSVxyXG5cdG0uZGVwcyA9IGZ1bmN0aW9uIChtb2NrKSB7XHJcblx0XHRpbml0aWFsaXplKGdsb2JhbCA9IG1vY2sgfHwgd2luZG93KVxyXG5cdFx0cmV0dXJuIGdsb2JhbFxyXG5cdH1cclxuXHJcblx0bS5kZXBzLmZhY3RvcnkgPSBtLmZhY3RvcnkgPSBmYWN0b3J5XHJcblxyXG5cdG0uZGVwcyhnbG9iYWwpXHJcblxyXG5cdC8qKlxyXG5cdCAqIEB0eXBlZGVmIHtTdHJpbmd9IFRhZ1xyXG5cdCAqIEEgc3RyaW5nIHRoYXQgbG9va3MgbGlrZSAtPiBkaXYuY2xhc3NuYW1lI2lkW3BhcmFtPW9uZV1bcGFyYW0yPXR3b11cclxuXHQgKiBXaGljaCBkZXNjcmliZXMgYSBET00gbm9kZVxyXG5cdCAqL1xyXG5cclxuXHRmdW5jdGlvbiBwYXJzZVRhZ0F0dHJzKGNlbGwsIHRhZykge1xyXG5cdFx0dmFyIGNsYXNzZXMgPSBbXVxyXG5cdFx0LyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xyXG5cdFx0dmFyIHBhcnNlciA9IC8oPzooXnwjfFxcLikoW14jXFwuXFxbXFxdXSspKXwoXFxbKC4rPykoPzpcXHMqPVxccyooXCJ8J3wpKCg/OlxcXFxbXCInXFxdXXwuKSo/KVxcNSk/XFxdKS9nXHJcblx0XHQvKiBlc2xpbnQtZW5hYmxlIG1heC1sZW4gKi9cclxuXHRcdHZhciBtYXRjaFxyXG5cclxuXHRcdHdoaWxlICgobWF0Y2ggPSBwYXJzZXIuZXhlYyh0YWcpKSkge1xyXG5cdFx0XHRpZiAobWF0Y2hbMV0gPT09IFwiXCIgJiYgbWF0Y2hbMl0pIHtcclxuXHRcdFx0XHRjZWxsLnRhZyA9IG1hdGNoWzJdXHJcblx0XHRcdH0gZWxzZSBpZiAobWF0Y2hbMV0gPT09IFwiI1wiKSB7XHJcblx0XHRcdFx0Y2VsbC5hdHRycy5pZCA9IG1hdGNoWzJdXHJcblx0XHRcdH0gZWxzZSBpZiAobWF0Y2hbMV0gPT09IFwiLlwiKSB7XHJcblx0XHRcdFx0Y2xhc3Nlcy5wdXNoKG1hdGNoWzJdKVxyXG5cdFx0XHR9IGVsc2UgaWYgKG1hdGNoWzNdLmNoYXJBdCgwKSA9PT0gXCJbXCIpIHsgLy8gIzExOTVcclxuXHRcdFx0XHR2YXIgYXR0clZhbHVlID0gbWF0Y2hbNl1cclxuXHRcdFx0XHRpZiAoYXR0clZhbHVlKSBhdHRyVmFsdWUgPSBhdHRyVmFsdWUucmVwbGFjZSgvXFxcXChbXCInXSkvZywgXCIkMVwiKVxyXG5cdFx0XHRcdGlmIChtYXRjaFs0XSA9PT0gXCJjbGFzc1wiKSBjbGFzc2VzLnB1c2goYXR0clZhbHVlKVxyXG5cdFx0XHRcdGVsc2UgY2VsbC5hdHRyc1ttYXRjaFs0XV0gPSBhdHRyVmFsdWUgfHwgdHJ1ZVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGNsYXNzZXNcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldFZpcnR1YWxDaGlsZHJlbihhcmdzLCBoYXNBdHRycykge1xyXG5cdFx0dmFyIGNoaWxkcmVuID0gaGFzQXR0cnMgPyBhcmdzLnNsaWNlKDEpIDogYXJnc1xyXG5cclxuXHRcdGlmIChjaGlsZHJlbi5sZW5ndGggPT09IDEgJiYgaXNBcnJheShjaGlsZHJlblswXSkpIHtcclxuXHRcdFx0cmV0dXJuIGNoaWxkcmVuWzBdXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4gY2hpbGRyZW5cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGFzc2lnbkF0dHJzKHRhcmdldCwgYXR0cnMsIGNsYXNzZXMpIHtcclxuXHRcdHZhciBjbGFzc0F0dHIgPSBcImNsYXNzXCIgaW4gYXR0cnMgPyBcImNsYXNzXCIgOiBcImNsYXNzTmFtZVwiXHJcblxyXG5cdFx0Zm9yICh2YXIgYXR0ck5hbWUgaW4gYXR0cnMpIHtcclxuXHRcdFx0aWYgKGhhc093bi5jYWxsKGF0dHJzLCBhdHRyTmFtZSkpIHtcclxuXHRcdFx0XHRpZiAoYXR0ck5hbWUgPT09IGNsYXNzQXR0ciAmJlxyXG5cdFx0XHRcdFx0XHRhdHRyc1thdHRyTmFtZV0gIT0gbnVsbCAmJlxyXG5cdFx0XHRcdFx0XHRhdHRyc1thdHRyTmFtZV0gIT09IFwiXCIpIHtcclxuXHRcdFx0XHRcdGNsYXNzZXMucHVzaChhdHRyc1thdHRyTmFtZV0pXHJcblx0XHRcdFx0XHQvLyBjcmVhdGUga2V5IGluIGNvcnJlY3QgaXRlcmF0aW9uIG9yZGVyXHJcblx0XHRcdFx0XHR0YXJnZXRbYXR0ck5hbWVdID0gXCJcIlxyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHR0YXJnZXRbYXR0ck5hbWVdID0gYXR0cnNbYXR0ck5hbWVdXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGNsYXNzZXMubGVuZ3RoKSB0YXJnZXRbY2xhc3NBdHRyXSA9IGNsYXNzZXMuam9pbihcIiBcIilcclxuXHR9XHJcblxyXG5cdC8qKlxyXG5cdCAqXHJcblx0ICogQHBhcmFtIHtUYWd9IFRoZSBET00gbm9kZSB0YWdcclxuXHQgKiBAcGFyYW0ge09iamVjdD1bXX0gb3B0aW9uYWwga2V5LXZhbHVlIHBhaXJzIHRvIGJlIG1hcHBlZCB0byBET00gYXR0cnNcclxuXHQgKiBAcGFyYW0gey4uLm1Ob2RlPVtdfSBaZXJvIG9yIG1vcmUgTWl0aHJpbCBjaGlsZCBub2Rlcy4gQ2FuIGJlIGFuIGFycmF5LFxyXG5cdCAqICAgICAgICAgICAgICAgICAgICAgIG9yIHNwbGF0IChvcHRpb25hbClcclxuXHQgKi9cclxuXHRmdW5jdGlvbiBtKHRhZywgcGFpcnMpIHtcclxuXHRcdHZhciBhcmdzID0gW11cclxuXHJcblx0XHRmb3IgKHZhciBpID0gMSwgbGVuZ3RoID0gYXJndW1lbnRzLmxlbmd0aDsgaSA8IGxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKHRhZyAmJiBpc0Z1bmN0aW9uKHRhZy52aWV3KSkgcmV0dXJuIHBhcmFtZXRlcml6ZSh0YWcsIGFyZ3MpXHJcblxyXG5cdFx0aWYgKCFpc1N0cmluZyh0YWcpKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcihcInNlbGVjdG9yIGluIG0oc2VsZWN0b3IsIGF0dHJzLCBjaGlsZHJlbikgc2hvdWxkIFwiICtcclxuXHRcdFx0XHRcImJlIGEgc3RyaW5nXCIpXHJcblx0XHR9XHJcblxyXG5cdFx0dmFyIGhhc0F0dHJzID0gcGFpcnMgIT0gbnVsbCAmJiBpc09iamVjdChwYWlycykgJiZcclxuXHRcdFx0IShcInRhZ1wiIGluIHBhaXJzIHx8IFwidmlld1wiIGluIHBhaXJzIHx8IFwic3VidHJlZVwiIGluIHBhaXJzKVxyXG5cclxuXHRcdHZhciBhdHRycyA9IGhhc0F0dHJzID8gcGFpcnMgOiB7fVxyXG5cdFx0dmFyIGNlbGwgPSB7XHJcblx0XHRcdHRhZzogXCJkaXZcIixcclxuXHRcdFx0YXR0cnM6IHt9LFxyXG5cdFx0XHRjaGlsZHJlbjogZ2V0VmlydHVhbENoaWxkcmVuKGFyZ3MsIGhhc0F0dHJzKVxyXG5cdFx0fVxyXG5cclxuXHRcdGFzc2lnbkF0dHJzKGNlbGwuYXR0cnMsIGF0dHJzLCBwYXJzZVRhZ0F0dHJzKGNlbGwsIHRhZykpXHJcblx0XHRyZXR1cm4gY2VsbFxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZm9yRWFjaChsaXN0LCBmKSB7XHJcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGxpc3QubGVuZ3RoICYmICFmKGxpc3RbaV0sIGkrKyk7KSB7XHJcblx0XHRcdC8vIGZ1bmN0aW9uIGNhbGxlZCBpbiBjb25kaXRpb25cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGZvcktleXMobGlzdCwgZikge1xyXG5cdFx0Zm9yRWFjaChsaXN0LCBmdW5jdGlvbiAoYXR0cnMsIGkpIHtcclxuXHRcdFx0cmV0dXJuIChhdHRycyA9IGF0dHJzICYmIGF0dHJzLmF0dHJzKSAmJlxyXG5cdFx0XHRcdGF0dHJzLmtleSAhPSBudWxsICYmXHJcblx0XHRcdFx0ZihhdHRycywgaSlcclxuXHRcdH0pXHJcblx0fVxyXG5cdC8vIFRoaXMgZnVuY3Rpb24gd2FzIGNhdXNpbmcgZGVvcHRzIGluIENocm9tZS5cclxuXHRmdW5jdGlvbiBkYXRhVG9TdHJpbmcoZGF0YSkge1xyXG5cdFx0Ly8gZGF0YS50b1N0cmluZygpIG1pZ2h0IHRocm93IG9yIHJldHVybiBudWxsIGlmIGRhdGEgaXMgdGhlIHJldHVyblxyXG5cdFx0Ly8gdmFsdWUgb2YgQ29uc29sZS5sb2cgaW4gc29tZSB2ZXJzaW9ucyBvZiBGaXJlZm94IChiZWhhdmlvciBkZXBlbmRzIG9uXHJcblx0XHQvLyB2ZXJzaW9uKVxyXG5cdFx0dHJ5IHtcclxuXHRcdFx0aWYgKHR5cGVvZiBkYXRhICE9PSBcImJvb2xlYW5cIiAmJlxyXG5cdFx0XHRcdFx0ZGF0YSAhPSBudWxsICYmXHJcblx0XHRcdFx0XHRkYXRhLnRvU3RyaW5nKCkgIT0gbnVsbCkgcmV0dXJuIGRhdGFcclxuXHRcdH0gY2F0Y2ggKGUpIHtcclxuXHRcdFx0Ly8gc2lsZW50bHkgaWdub3JlIGVycm9yc1xyXG5cdFx0fVxyXG5cdFx0cmV0dXJuIFwiXCJcclxuXHR9XHJcblxyXG5cdC8vIFRoaXMgZnVuY3Rpb24gd2FzIGNhdXNpbmcgZGVvcHRzIGluIENocm9tZS5cclxuXHRmdW5jdGlvbiBpbmplY3RUZXh0Tm9kZShwYXJlbnRFbGVtZW50LCBmaXJzdCwgaW5kZXgsIGRhdGEpIHtcclxuXHRcdHRyeSB7XHJcblx0XHRcdGluc2VydE5vZGUocGFyZW50RWxlbWVudCwgZmlyc3QsIGluZGV4KVxyXG5cdFx0XHRmaXJzdC5ub2RlVmFsdWUgPSBkYXRhXHJcblx0XHR9IGNhdGNoIChlKSB7XHJcblx0XHRcdC8vIElFIGVycm9uZW91c2x5IHRocm93cyBlcnJvciB3aGVuIGFwcGVuZGluZyBhbiBlbXB0eSB0ZXh0IG5vZGVcclxuXHRcdFx0Ly8gYWZ0ZXIgYSBudWxsXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBmbGF0dGVuKGxpc3QpIHtcclxuXHRcdC8vIHJlY3Vyc2l2ZWx5IGZsYXR0ZW4gYXJyYXlcclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbGlzdC5sZW5ndGg7IGkrKykge1xyXG5cdFx0XHRpZiAoaXNBcnJheShsaXN0W2ldKSkge1xyXG5cdFx0XHRcdGxpc3QgPSBsaXN0LmNvbmNhdC5hcHBseShbXSwgbGlzdClcclxuXHRcdFx0XHQvLyBjaGVjayBjdXJyZW50IGluZGV4IGFnYWluIGFuZCBmbGF0dGVuIHVudGlsIHRoZXJlIGFyZSBubyBtb3JlXHJcblx0XHRcdFx0Ly8gbmVzdGVkIGFycmF5cyBhdCB0aGF0IGluZGV4XHJcblx0XHRcdFx0aS0tXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiBsaXN0XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBpbnNlcnROb2RlKHBhcmVudEVsZW1lbnQsIG5vZGUsIGluZGV4KSB7XHJcblx0XHRwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShub2RlLFxyXG5cdFx0XHRwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdIHx8IG51bGwpXHJcblx0fVxyXG5cclxuXHR2YXIgREVMRVRJT04gPSAxXHJcblx0dmFyIElOU0VSVElPTiA9IDJcclxuXHR2YXIgTU9WRSA9IDNcclxuXHJcblx0ZnVuY3Rpb24gaGFuZGxlS2V5c0RpZmZlcihkYXRhLCBleGlzdGluZywgY2FjaGVkLCBwYXJlbnRFbGVtZW50KSB7XHJcblx0XHRmb3JLZXlzKGRhdGEsIGZ1bmN0aW9uIChrZXksIGkpIHtcclxuXHRcdFx0ZXhpc3Rpbmdba2V5ID0ga2V5LmtleV0gPSBleGlzdGluZ1trZXldID8ge1xyXG5cdFx0XHRcdGFjdGlvbjogTU9WRSxcclxuXHRcdFx0XHRpbmRleDogaSxcclxuXHRcdFx0XHRmcm9tOiBleGlzdGluZ1trZXldLmluZGV4LFxyXG5cdFx0XHRcdGVsZW1lbnQ6IGNhY2hlZC5ub2Rlc1tleGlzdGluZ1trZXldLmluZGV4XSB8fFxyXG5cdFx0XHRcdFx0JGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJkaXZcIilcclxuXHRcdFx0fSA6IHthY3Rpb246IElOU0VSVElPTiwgaW5kZXg6IGl9XHJcblx0XHR9KVxyXG5cclxuXHRcdHZhciBhY3Rpb25zID0gW11cclxuXHRcdGZvciAodmFyIHByb3AgaW4gZXhpc3RpbmcpIHtcclxuXHRcdFx0aWYgKGhhc093bi5jYWxsKGV4aXN0aW5nLCBwcm9wKSkge1xyXG5cdFx0XHRcdGFjdGlvbnMucHVzaChleGlzdGluZ1twcm9wXSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBjaGFuZ2VzID0gYWN0aW9ucy5zb3J0KHNvcnRDaGFuZ2VzKVxyXG5cdFx0dmFyIG5ld0NhY2hlZCA9IG5ldyBBcnJheShjYWNoZWQubGVuZ3RoKVxyXG5cclxuXHRcdG5ld0NhY2hlZC5ub2RlcyA9IGNhY2hlZC5ub2Rlcy5zbGljZSgpXHJcblxyXG5cdFx0Zm9yRWFjaChjaGFuZ2VzLCBmdW5jdGlvbiAoY2hhbmdlKSB7XHJcblx0XHRcdHZhciBpbmRleCA9IGNoYW5nZS5pbmRleFxyXG5cdFx0XHRpZiAoY2hhbmdlLmFjdGlvbiA9PT0gREVMRVRJT04pIHtcclxuXHRcdFx0XHRjbGVhcihjYWNoZWRbaW5kZXhdLm5vZGVzLCBjYWNoZWRbaW5kZXhdKVxyXG5cdFx0XHRcdG5ld0NhY2hlZC5zcGxpY2UoaW5kZXgsIDEpXHJcblx0XHRcdH1cclxuXHRcdFx0aWYgKGNoYW5nZS5hY3Rpb24gPT09IElOU0VSVElPTikge1xyXG5cdFx0XHRcdHZhciBkdW1teSA9ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiZGl2XCIpXHJcblx0XHRcdFx0ZHVtbXkua2V5ID0gZGF0YVtpbmRleF0uYXR0cnMua2V5XHJcblx0XHRcdFx0aW5zZXJ0Tm9kZShwYXJlbnRFbGVtZW50LCBkdW1teSwgaW5kZXgpXHJcblx0XHRcdFx0bmV3Q2FjaGVkLnNwbGljZShpbmRleCwgMCwge1xyXG5cdFx0XHRcdFx0YXR0cnM6IHtrZXk6IGRhdGFbaW5kZXhdLmF0dHJzLmtleX0sXHJcblx0XHRcdFx0XHRub2RlczogW2R1bW15XVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdFx0bmV3Q2FjaGVkLm5vZGVzW2luZGV4XSA9IGR1bW15XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGlmIChjaGFuZ2UuYWN0aW9uID09PSBNT1ZFKSB7XHJcblx0XHRcdFx0dmFyIGNoYW5nZUVsZW1lbnQgPSBjaGFuZ2UuZWxlbWVudFxyXG5cdFx0XHRcdHZhciBtYXliZUNoYW5nZWQgPSBwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdXHJcblx0XHRcdFx0aWYgKG1heWJlQ2hhbmdlZCAhPT0gY2hhbmdlRWxlbWVudCAmJiBjaGFuZ2VFbGVtZW50ICE9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRwYXJlbnRFbGVtZW50Lmluc2VydEJlZm9yZShjaGFuZ2VFbGVtZW50LFxyXG5cdFx0XHRcdFx0XHRtYXliZUNoYW5nZWQgfHwgbnVsbClcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0bmV3Q2FjaGVkW2luZGV4XSA9IGNhY2hlZFtjaGFuZ2UuZnJvbV1cclxuXHRcdFx0XHRuZXdDYWNoZWQubm9kZXNbaW5kZXhdID0gY2hhbmdlRWxlbWVudFxyXG5cdFx0XHR9XHJcblx0XHR9KVxyXG5cclxuXHRcdHJldHVybiBuZXdDYWNoZWRcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGRpZmZLZXlzKGRhdGEsIGNhY2hlZCwgZXhpc3RpbmcsIHBhcmVudEVsZW1lbnQpIHtcclxuXHRcdHZhciBrZXlzRGlmZmVyID0gZGF0YS5sZW5ndGggIT09IGNhY2hlZC5sZW5ndGhcclxuXHJcblx0XHRpZiAoIWtleXNEaWZmZXIpIHtcclxuXHRcdFx0Zm9yS2V5cyhkYXRhLCBmdW5jdGlvbiAoYXR0cnMsIGkpIHtcclxuXHRcdFx0XHR2YXIgY2FjaGVkQ2VsbCA9IGNhY2hlZFtpXVxyXG5cdFx0XHRcdHJldHVybiBrZXlzRGlmZmVyID0gY2FjaGVkQ2VsbCAmJlxyXG5cdFx0XHRcdFx0Y2FjaGVkQ2VsbC5hdHRycyAmJlxyXG5cdFx0XHRcdFx0Y2FjaGVkQ2VsbC5hdHRycy5rZXkgIT09IGF0dHJzLmtleVxyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChrZXlzRGlmZmVyKSB7XHJcblx0XHRcdHJldHVybiBoYW5kbGVLZXlzRGlmZmVyKGRhdGEsIGV4aXN0aW5nLCBjYWNoZWQsIHBhcmVudEVsZW1lbnQpXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4gY2FjaGVkXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBkaWZmQXJyYXkoZGF0YSwgY2FjaGVkLCBub2Rlcykge1xyXG5cdFx0Ly8gZGlmZiB0aGUgYXJyYXkgaXRzZWxmXHJcblxyXG5cdFx0Ly8gdXBkYXRlIHRoZSBsaXN0IG9mIERPTSBub2RlcyBieSBjb2xsZWN0aW5nIHRoZSBub2RlcyBmcm9tIGVhY2ggaXRlbVxyXG5cdFx0Zm9yRWFjaChkYXRhLCBmdW5jdGlvbiAoXywgaSkge1xyXG5cdFx0XHRpZiAoY2FjaGVkW2ldICE9IG51bGwpIG5vZGVzLnB1c2guYXBwbHkobm9kZXMsIGNhY2hlZFtpXS5ub2RlcylcclxuXHRcdH0pXHJcblx0XHQvLyByZW1vdmUgaXRlbXMgZnJvbSB0aGUgZW5kIG9mIHRoZSBhcnJheSBpZiB0aGUgbmV3IGFycmF5IGlzIHNob3J0ZXJcclxuXHRcdC8vIHRoYW4gdGhlIG9sZCBvbmUuIGlmIGVycm9ycyBldmVyIGhhcHBlbiBoZXJlLCB0aGUgaXNzdWUgaXMgbW9zdFxyXG5cdFx0Ly8gbGlrZWx5IGEgYnVnIGluIHRoZSBjb25zdHJ1Y3Rpb24gb2YgdGhlIGBjYWNoZWRgIGRhdGEgc3RydWN0dXJlXHJcblx0XHQvLyBzb21ld2hlcmUgZWFybGllciBpbiB0aGUgcHJvZ3JhbVxyXG5cdFx0Zm9yRWFjaChjYWNoZWQubm9kZXMsIGZ1bmN0aW9uIChub2RlLCBpKSB7XHJcblx0XHRcdGlmIChub2RlLnBhcmVudE5vZGUgIT0gbnVsbCAmJiBub2Rlcy5pbmRleE9mKG5vZGUpIDwgMCkge1xyXG5cdFx0XHRcdGNsZWFyKFtub2RlXSwgW2NhY2hlZFtpXV0pXHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblxyXG5cdFx0aWYgKGRhdGEubGVuZ3RoIDwgY2FjaGVkLmxlbmd0aCkgY2FjaGVkLmxlbmd0aCA9IGRhdGEubGVuZ3RoXHJcblx0XHRjYWNoZWQubm9kZXMgPSBub2Rlc1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYnVpbGRBcnJheUtleXMoZGF0YSkge1xyXG5cdFx0dmFyIGd1aWQgPSAwXHJcblx0XHRmb3JLZXlzKGRhdGEsIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0Zm9yRWFjaChkYXRhLCBmdW5jdGlvbiAoYXR0cnMpIHtcclxuXHRcdFx0XHRpZiAoKGF0dHJzID0gYXR0cnMgJiYgYXR0cnMuYXR0cnMpICYmIGF0dHJzLmtleSA9PSBudWxsKSB7XHJcblx0XHRcdFx0XHRhdHRycy5rZXkgPSBcIl9fbWl0aHJpbF9fXCIgKyBndWlkKytcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblx0XHRcdHJldHVybiAxXHJcblx0XHR9KVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gaXNEaWZmZXJlbnRFbm91Z2goZGF0YSwgY2FjaGVkLCBkYXRhQXR0cktleXMpIHtcclxuXHRcdGlmIChkYXRhLnRhZyAhPT0gY2FjaGVkLnRhZykgcmV0dXJuIHRydWVcclxuXHJcblx0XHRpZiAoZGF0YUF0dHJLZXlzLnNvcnQoKS5qb2luKCkgIT09XHJcblx0XHRcdFx0T2JqZWN0LmtleXMoY2FjaGVkLmF0dHJzKS5zb3J0KCkuam9pbigpKSB7XHJcblx0XHRcdHJldHVybiB0cnVlXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGRhdGEuYXR0cnMuaWQgIT09IGNhY2hlZC5hdHRycy5pZCkge1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChkYXRhLmF0dHJzLmtleSAhPT0gY2FjaGVkLmF0dHJzLmtleSkge1xyXG5cdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChtLnJlZHJhdy5zdHJhdGVneSgpID09PSBcImFsbFwiKSB7XHJcblx0XHRcdHJldHVybiAhY2FjaGVkLmNvbmZpZ0NvbnRleHQgfHwgY2FjaGVkLmNvbmZpZ0NvbnRleHQucmV0YWluICE9PSB0cnVlXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKG0ucmVkcmF3LnN0cmF0ZWd5KCkgPT09IFwiZGlmZlwiKSB7XHJcblx0XHRcdHJldHVybiBjYWNoZWQuY29uZmlnQ29udGV4dCAmJiBjYWNoZWQuY29uZmlnQ29udGV4dC5yZXRhaW4gPT09IGZhbHNlXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGZhbHNlXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBtYXliZVJlY3JlYXRlT2JqZWN0KGRhdGEsIGNhY2hlZCwgZGF0YUF0dHJLZXlzKSB7XHJcblx0XHQvLyBpZiBhbiBlbGVtZW50IGlzIGRpZmZlcmVudCBlbm91Z2ggZnJvbSB0aGUgb25lIGluIGNhY2hlLCByZWNyZWF0ZSBpdFxyXG5cdFx0aWYgKGlzRGlmZmVyZW50RW5vdWdoKGRhdGEsIGNhY2hlZCwgZGF0YUF0dHJLZXlzKSkge1xyXG5cdFx0XHRpZiAoY2FjaGVkLm5vZGVzLmxlbmd0aCkgY2xlYXIoY2FjaGVkLm5vZGVzKVxyXG5cclxuXHRcdFx0aWYgKGNhY2hlZC5jb25maWdDb250ZXh0ICYmXHJcblx0XHRcdFx0XHRpc0Z1bmN0aW9uKGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkKSkge1xyXG5cdFx0XHRcdGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkKClcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKGNhY2hlZC5jb250cm9sbGVycykge1xyXG5cdFx0XHRcdGZvckVhY2goY2FjaGVkLmNvbnRyb2xsZXJzLCBmdW5jdGlvbiAoY29udHJvbGxlcikge1xyXG5cdFx0XHRcdFx0aWYgKGNvbnRyb2xsZXIub251bmxvYWQpIHtcclxuXHRcdFx0XHRcdFx0Y29udHJvbGxlci5vbnVubG9hZCh7cHJldmVudERlZmF1bHQ6IG5vb3B9KVxyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0pXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldE9iamVjdE5hbWVzcGFjZShkYXRhLCBuYW1lc3BhY2UpIHtcclxuXHRcdGlmIChkYXRhLmF0dHJzLnhtbG5zKSByZXR1cm4gZGF0YS5hdHRycy54bWxuc1xyXG5cdFx0aWYgKGRhdGEudGFnID09PSBcInN2Z1wiKSByZXR1cm4gXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiXHJcblx0XHRpZiAoZGF0YS50YWcgPT09IFwibWF0aFwiKSByZXR1cm4gXCJodHRwOi8vd3d3LnczLm9yZy8xOTk4L01hdGgvTWF0aE1MXCJcclxuXHRcdHJldHVybiBuYW1lc3BhY2VcclxuXHR9XHJcblxyXG5cdHZhciBwZW5kaW5nUmVxdWVzdHMgPSAwXHJcblx0bS5zdGFydENvbXB1dGF0aW9uID0gZnVuY3Rpb24gKCkgeyBwZW5kaW5nUmVxdWVzdHMrKyB9XHJcblx0bS5lbmRDb21wdXRhdGlvbiA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdGlmIChwZW5kaW5nUmVxdWVzdHMgPiAxKSB7XHJcblx0XHRcdHBlbmRpbmdSZXF1ZXN0cy0tXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRwZW5kaW5nUmVxdWVzdHMgPSAwXHJcblx0XHRcdG0ucmVkcmF3KClcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHVubG9hZENhY2hlZENvbnRyb2xsZXJzKGNhY2hlZCwgdmlld3MsIGNvbnRyb2xsZXJzKSB7XHJcblx0XHRpZiAoY29udHJvbGxlcnMubGVuZ3RoKSB7XHJcblx0XHRcdGNhY2hlZC52aWV3cyA9IHZpZXdzXHJcblx0XHRcdGNhY2hlZC5jb250cm9sbGVycyA9IGNvbnRyb2xsZXJzXHJcblx0XHRcdGZvckVhY2goY29udHJvbGxlcnMsIGZ1bmN0aW9uIChjb250cm9sbGVyKSB7XHJcblx0XHRcdFx0aWYgKGNvbnRyb2xsZXIub251bmxvYWQgJiYgY29udHJvbGxlci5vbnVubG9hZC4kb2xkKSB7XHJcblx0XHRcdFx0XHRjb250cm9sbGVyLm9udW5sb2FkID0gY29udHJvbGxlci5vbnVubG9hZC4kb2xkXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRpZiAocGVuZGluZ1JlcXVlc3RzICYmIGNvbnRyb2xsZXIub251bmxvYWQpIHtcclxuXHRcdFx0XHRcdHZhciBvbnVubG9hZCA9IGNvbnRyb2xsZXIub251bmxvYWRcclxuXHRcdFx0XHRcdGNvbnRyb2xsZXIub251bmxvYWQgPSBmdW5jdGlvbiAoKXt9XHJcblx0XHRcdFx0XHRjb250cm9sbGVyLm9udW5sb2FkLiRvbGQgPSBvbnVubG9hZFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHNjaGVkdWxlQ29uZmlnc1RvQmVDYWxsZWQoY29uZmlncywgZGF0YSwgbm9kZSwgaXNOZXcsIGNhY2hlZCkge1xyXG5cdFx0Ly8gc2NoZWR1bGUgY29uZmlncyB0byBiZSBjYWxsZWQuIFRoZXkgYXJlIGNhbGxlZCBhZnRlciBgYnVpbGRgIGZpbmlzaGVzXHJcblx0XHQvLyBydW5uaW5nXHJcblx0XHRpZiAoaXNGdW5jdGlvbihkYXRhLmF0dHJzLmNvbmZpZykpIHtcclxuXHRcdFx0dmFyIGNvbnRleHQgPSBjYWNoZWQuY29uZmlnQ29udGV4dCA9IGNhY2hlZC5jb25maWdDb250ZXh0IHx8IHt9XHJcblxyXG5cdFx0XHQvLyBiaW5kXHJcblx0XHRcdGNvbmZpZ3MucHVzaChmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0cmV0dXJuIGRhdGEuYXR0cnMuY29uZmlnLmNhbGwoZGF0YSwgbm9kZSwgIWlzTmV3LCBjb250ZXh0LFxyXG5cdFx0XHRcdFx0Y2FjaGVkKVxyXG5cdFx0XHR9KVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYnVpbGRVcGRhdGVkTm9kZShcclxuXHRcdGNhY2hlZCxcclxuXHRcdGRhdGEsXHJcblx0XHRlZGl0YWJsZSxcclxuXHRcdGhhc0tleXMsXHJcblx0XHRuYW1lc3BhY2UsXHJcblx0XHR2aWV3cyxcclxuXHRcdGNvbmZpZ3MsXHJcblx0XHRjb250cm9sbGVyc1xyXG5cdCkge1xyXG5cdFx0dmFyIG5vZGUgPSBjYWNoZWQubm9kZXNbMF1cclxuXHJcblx0XHRpZiAoaGFzS2V5cykge1xyXG5cdFx0XHRzZXRBdHRyaWJ1dGVzKG5vZGUsIGRhdGEudGFnLCBkYXRhLmF0dHJzLCBjYWNoZWQuYXR0cnMsIG5hbWVzcGFjZSlcclxuXHRcdH1cclxuXHJcblx0XHRjYWNoZWQuY2hpbGRyZW4gPSBidWlsZChcclxuXHRcdFx0bm9kZSxcclxuXHRcdFx0ZGF0YS50YWcsXHJcblx0XHRcdHVuZGVmaW5lZCxcclxuXHRcdFx0dW5kZWZpbmVkLFxyXG5cdFx0XHRkYXRhLmNoaWxkcmVuLFxyXG5cdFx0XHRjYWNoZWQuY2hpbGRyZW4sXHJcblx0XHRcdGZhbHNlLFxyXG5cdFx0XHQwLFxyXG5cdFx0XHRkYXRhLmF0dHJzLmNvbnRlbnRlZGl0YWJsZSA/IG5vZGUgOiBlZGl0YWJsZSxcclxuXHRcdFx0bmFtZXNwYWNlLFxyXG5cdFx0XHRjb25maWdzXHJcblx0XHQpXHJcblxyXG5cdFx0Y2FjaGVkLm5vZGVzLmludGFjdCA9IHRydWVcclxuXHJcblx0XHRpZiAoY29udHJvbGxlcnMubGVuZ3RoKSB7XHJcblx0XHRcdGNhY2hlZC52aWV3cyA9IHZpZXdzXHJcblx0XHRcdGNhY2hlZC5jb250cm9sbGVycyA9IGNvbnRyb2xsZXJzXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIG5vZGVcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGhhbmRsZU5vbmV4aXN0ZW50Tm9kZXMoZGF0YSwgcGFyZW50RWxlbWVudCwgaW5kZXgpIHtcclxuXHRcdHZhciBub2Rlc1xyXG5cdFx0aWYgKGRhdGEuJHRydXN0ZWQpIHtcclxuXHRcdFx0bm9kZXMgPSBpbmplY3RIVE1MKHBhcmVudEVsZW1lbnQsIGluZGV4LCBkYXRhKVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0bm9kZXMgPSBbJGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGRhdGEpXVxyXG5cdFx0XHRpZiAoIShwYXJlbnRFbGVtZW50Lm5vZGVOYW1lIGluIHZvaWRFbGVtZW50cykpIHtcclxuXHRcdFx0XHRpbnNlcnROb2RlKHBhcmVudEVsZW1lbnQsIG5vZGVzWzBdLCBpbmRleClcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBjYWNoZWRcclxuXHJcblx0XHRpZiAodHlwZW9mIGRhdGEgPT09IFwic3RyaW5nXCIgfHxcclxuXHRcdFx0XHR0eXBlb2YgZGF0YSA9PT0gXCJudW1iZXJcIiB8fFxyXG5cdFx0XHRcdHR5cGVvZiBkYXRhID09PSBcImJvb2xlYW5cIikge1xyXG5cdFx0XHRjYWNoZWQgPSBuZXcgZGF0YS5jb25zdHJ1Y3RvcihkYXRhKVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0Y2FjaGVkID0gZGF0YVxyXG5cdFx0fVxyXG5cclxuXHRcdGNhY2hlZC5ub2RlcyA9IG5vZGVzXHJcblx0XHRyZXR1cm4gY2FjaGVkXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiByZWF0dGFjaE5vZGVzKFxyXG5cdFx0ZGF0YSxcclxuXHRcdGNhY2hlZCxcclxuXHRcdHBhcmVudEVsZW1lbnQsXHJcblx0XHRlZGl0YWJsZSxcclxuXHRcdGluZGV4LFxyXG5cdFx0cGFyZW50VGFnXHJcblx0KSB7XHJcblx0XHR2YXIgbm9kZXMgPSBjYWNoZWQubm9kZXNcclxuXHRcdGlmICghZWRpdGFibGUgfHwgZWRpdGFibGUgIT09ICRkb2N1bWVudC5hY3RpdmVFbGVtZW50IHx8XHJcblx0XHRcdFx0ZGF0YSAhPT0gY2FjaGVkKSB7XHJcblx0XHRcdGlmIChkYXRhLiR0cnVzdGVkKSB7XHJcblx0XHRcdFx0Y2xlYXIobm9kZXMsIGNhY2hlZClcclxuXHRcdFx0XHRub2RlcyA9IGluamVjdEhUTUwocGFyZW50RWxlbWVudCwgaW5kZXgsIGRhdGEpXHJcblx0XHRcdH0gZWxzZSBpZiAocGFyZW50VGFnID09PSBcInRleHRhcmVhXCIpIHtcclxuXHRcdFx0XHQvLyA8dGV4dGFyZWE+IHVzZXMgYHZhbHVlYCBpbnN0ZWFkIG9mIGBub2RlVmFsdWVgLlxyXG5cdFx0XHRcdHBhcmVudEVsZW1lbnQudmFsdWUgPSBkYXRhXHJcblx0XHRcdH0gZWxzZSBpZiAoZWRpdGFibGUpIHtcclxuXHRcdFx0XHQvLyBjb250ZW50ZWRpdGFibGUgbm9kZXMgdXNlIGBpbm5lckhUTUxgIGluc3RlYWQgb2YgYG5vZGVWYWx1ZWAuXHJcblx0XHRcdFx0ZWRpdGFibGUuaW5uZXJIVE1MID0gZGF0YVxyXG5cdFx0XHRcdG5vZGVzID0gW10uc2xpY2UuY2FsbChlZGl0YWJsZS5jaGlsZE5vZGVzKVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdC8vIHdhcyBhIHRydXN0ZWQgc3RyaW5nXHJcblx0XHRcdFx0aWYgKG5vZGVzWzBdLm5vZGVUeXBlID09PSAxIHx8IG5vZGVzLmxlbmd0aCA+IDEgfHxcclxuXHRcdFx0XHRcdFx0KG5vZGVzWzBdLm5vZGVWYWx1ZS50cmltICYmXHJcblx0XHRcdFx0XHRcdFx0IW5vZGVzWzBdLm5vZGVWYWx1ZS50cmltKCkpKSB7XHJcblx0XHRcdFx0XHRjbGVhcihjYWNoZWQubm9kZXMsIGNhY2hlZClcclxuXHRcdFx0XHRcdG5vZGVzID0gWyRkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShkYXRhKV1cclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdGluamVjdFRleHROb2RlKHBhcmVudEVsZW1lbnQsIG5vZGVzWzBdLCBpbmRleCwgZGF0YSlcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdFx0Y2FjaGVkID0gbmV3IGRhdGEuY29uc3RydWN0b3IoZGF0YSlcclxuXHRcdGNhY2hlZC5ub2RlcyA9IG5vZGVzXHJcblx0XHRjYWNoZWQuJHRydXN0ZWQgPSBkYXRhLiR0cnVzdGVkXHJcblx0XHRyZXR1cm4gY2FjaGVkXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBoYW5kbGVUZXh0Tm9kZShcclxuXHRcdGNhY2hlZCxcclxuXHRcdGRhdGEsXHJcblx0XHRpbmRleCxcclxuXHRcdHBhcmVudEVsZW1lbnQsXHJcblx0XHRzaG91bGRSZWF0dGFjaCxcclxuXHRcdGVkaXRhYmxlLFxyXG5cdFx0cGFyZW50VGFnXHJcblx0KSB7XHJcblx0XHRpZiAoIWNhY2hlZC5ub2Rlcy5sZW5ndGgpIHtcclxuXHRcdFx0cmV0dXJuIGhhbmRsZU5vbmV4aXN0ZW50Tm9kZXMoZGF0YSwgcGFyZW50RWxlbWVudCwgaW5kZXgpXHJcblx0XHR9IGVsc2UgaWYgKGNhY2hlZC52YWx1ZU9mKCkgIT09IGRhdGEudmFsdWVPZigpIHx8IHNob3VsZFJlYXR0YWNoKSB7XHJcblx0XHRcdHJldHVybiByZWF0dGFjaE5vZGVzKGRhdGEsIGNhY2hlZCwgcGFyZW50RWxlbWVudCwgZWRpdGFibGUsIGluZGV4LFxyXG5cdFx0XHRcdHBhcmVudFRhZylcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJldHVybiAoY2FjaGVkLm5vZGVzLmludGFjdCA9IHRydWUsIGNhY2hlZClcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldFN1YkFycmF5Q291bnQoaXRlbSkge1xyXG5cdFx0aWYgKGl0ZW0uJHRydXN0ZWQpIHtcclxuXHRcdFx0Ly8gZml4IG9mZnNldCBvZiBuZXh0IGVsZW1lbnQgaWYgaXRlbSB3YXMgYSB0cnVzdGVkIHN0cmluZyB3LyBtb3JlXHJcblx0XHRcdC8vIHRoYW4gb25lIGh0bWwgZWxlbWVudFxyXG5cdFx0XHRyZXR1cm4gaXRlbS5ub2Rlcy5sZW5ndGhcclxuXHRcdH0gZWxzZSBpZiAoaXNBcnJheShpdGVtKSkge1xyXG5cdFx0XHRyZXR1cm4gaXRlbS5sZW5ndGhcclxuXHRcdH1cclxuXHRcdHJldHVybiAxXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBidWlsZEFycmF5KFxyXG5cdFx0ZGF0YSxcclxuXHRcdGNhY2hlZCxcclxuXHRcdHBhcmVudEVsZW1lbnQsXHJcblx0XHRpbmRleCxcclxuXHRcdHBhcmVudFRhZyxcclxuXHRcdHNob3VsZFJlYXR0YWNoLFxyXG5cdFx0ZWRpdGFibGUsXHJcblx0XHRuYW1lc3BhY2UsXHJcblx0XHRjb25maWdzXHJcblx0KSB7XHJcblx0XHRkYXRhID0gZmxhdHRlbihkYXRhKVxyXG5cdFx0dmFyIG5vZGVzID0gW11cclxuXHRcdHZhciBpbnRhY3QgPSBjYWNoZWQubGVuZ3RoID09PSBkYXRhLmxlbmd0aFxyXG5cdFx0dmFyIHN1YkFycmF5Q291bnQgPSAwXHJcblxyXG5cdFx0Ly8ga2V5cyBhbGdvcml0aG06IHNvcnQgZWxlbWVudHMgd2l0aG91dCByZWNyZWF0aW5nIHRoZW0gaWYga2V5cyBhcmVcclxuXHRcdC8vIHByZXNlbnRcclxuXHRcdC8vXHJcblx0XHQvLyAxKSBjcmVhdGUgYSBtYXAgb2YgYWxsIGV4aXN0aW5nIGtleXMsIGFuZCBtYXJrIGFsbCBmb3IgZGVsZXRpb25cclxuXHRcdC8vIDIpIGFkZCBuZXcga2V5cyB0byBtYXAgYW5kIG1hcmsgdGhlbSBmb3IgYWRkaXRpb25cclxuXHRcdC8vIDMpIGlmIGtleSBleGlzdHMgaW4gbmV3IGxpc3QsIGNoYW5nZSBhY3Rpb24gZnJvbSBkZWxldGlvbiB0byBhIG1vdmVcclxuXHRcdC8vIDQpIGZvciBlYWNoIGtleSwgaGFuZGxlIGl0cyBjb3JyZXNwb25kaW5nIGFjdGlvbiBhcyBtYXJrZWQgaW5cclxuXHRcdC8vICAgIHByZXZpb3VzIHN0ZXBzXHJcblxyXG5cdFx0dmFyIGV4aXN0aW5nID0ge31cclxuXHRcdHZhciBzaG91bGRNYWludGFpbklkZW50aXRpZXMgPSBmYWxzZVxyXG5cclxuXHRcdGZvcktleXMoY2FjaGVkLCBmdW5jdGlvbiAoYXR0cnMsIGkpIHtcclxuXHRcdFx0c2hvdWxkTWFpbnRhaW5JZGVudGl0aWVzID0gdHJ1ZVxyXG5cdFx0XHRleGlzdGluZ1tjYWNoZWRbaV0uYXR0cnMua2V5XSA9IHthY3Rpb246IERFTEVUSU9OLCBpbmRleDogaX1cclxuXHRcdH0pXHJcblxyXG5cdFx0YnVpbGRBcnJheUtleXMoZGF0YSlcclxuXHRcdGlmIChzaG91bGRNYWludGFpbklkZW50aXRpZXMpIHtcclxuXHRcdFx0Y2FjaGVkID0gZGlmZktleXMoZGF0YSwgY2FjaGVkLCBleGlzdGluZywgcGFyZW50RWxlbWVudClcclxuXHRcdH1cclxuXHRcdC8vIGVuZCBrZXkgYWxnb3JpdGhtXHJcblxyXG5cdFx0dmFyIGNhY2hlQ291bnQgPSAwXHJcblx0XHQvLyBmYXN0ZXIgZXhwbGljaXRseSB3cml0dGVuXHJcblx0XHRmb3IgKHZhciBpID0gMCwgbGVuID0gZGF0YS5sZW5ndGg7IGkgPCBsZW47IGkrKykge1xyXG5cdFx0XHQvLyBkaWZmIGVhY2ggaXRlbSBpbiB0aGUgYXJyYXlcclxuXHRcdFx0dmFyIGl0ZW0gPSBidWlsZChcclxuXHRcdFx0XHRwYXJlbnRFbGVtZW50LFxyXG5cdFx0XHRcdHBhcmVudFRhZyxcclxuXHRcdFx0XHRjYWNoZWQsXHJcblx0XHRcdFx0aW5kZXgsXHJcblx0XHRcdFx0ZGF0YVtpXSxcclxuXHRcdFx0XHRjYWNoZWRbY2FjaGVDb3VudF0sXHJcblx0XHRcdFx0c2hvdWxkUmVhdHRhY2gsXHJcblx0XHRcdFx0aW5kZXggKyBzdWJBcnJheUNvdW50IHx8IHN1YkFycmF5Q291bnQsXHJcblx0XHRcdFx0ZWRpdGFibGUsXHJcblx0XHRcdFx0bmFtZXNwYWNlLFxyXG5cdFx0XHRcdGNvbmZpZ3MpXHJcblxyXG5cdFx0XHRpZiAoaXRlbSAhPT0gdW5kZWZpbmVkKSB7XHJcblx0XHRcdFx0aW50YWN0ID0gaW50YWN0ICYmIGl0ZW0ubm9kZXMuaW50YWN0XHJcblx0XHRcdFx0c3ViQXJyYXlDb3VudCArPSBnZXRTdWJBcnJheUNvdW50KGl0ZW0pXHJcblx0XHRcdFx0Y2FjaGVkW2NhY2hlQ291bnQrK10gPSBpdGVtXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAoIWludGFjdCkgZGlmZkFycmF5KGRhdGEsIGNhY2hlZCwgbm9kZXMpXHJcblx0XHRyZXR1cm4gY2FjaGVkXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBtYWtlQ2FjaGUoZGF0YSwgY2FjaGVkLCBpbmRleCwgcGFyZW50SW5kZXgsIHBhcmVudENhY2hlKSB7XHJcblx0XHRpZiAoY2FjaGVkICE9IG51bGwpIHtcclxuXHRcdFx0aWYgKHR5cGUuY2FsbChjYWNoZWQpID09PSB0eXBlLmNhbGwoZGF0YSkpIHJldHVybiBjYWNoZWRcclxuXHJcblx0XHRcdGlmIChwYXJlbnRDYWNoZSAmJiBwYXJlbnRDYWNoZS5ub2Rlcykge1xyXG5cdFx0XHRcdHZhciBvZmZzZXQgPSBpbmRleCAtIHBhcmVudEluZGV4XHJcblx0XHRcdFx0dmFyIGVuZCA9IG9mZnNldCArIChpc0FycmF5KGRhdGEpID8gZGF0YSA6IGNhY2hlZC5ub2RlcykubGVuZ3RoXHJcblx0XHRcdFx0Y2xlYXIoXHJcblx0XHRcdFx0XHRwYXJlbnRDYWNoZS5ub2Rlcy5zbGljZShvZmZzZXQsIGVuZCksXHJcblx0XHRcdFx0XHRwYXJlbnRDYWNoZS5zbGljZShvZmZzZXQsIGVuZCkpXHJcblx0XHRcdH0gZWxzZSBpZiAoY2FjaGVkLm5vZGVzKSB7XHJcblx0XHRcdFx0Y2xlYXIoY2FjaGVkLm5vZGVzLCBjYWNoZWQpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRjYWNoZWQgPSBuZXcgZGF0YS5jb25zdHJ1Y3RvcigpXHJcblx0XHQvLyBpZiBjb25zdHJ1Y3RvciBjcmVhdGVzIGEgdmlydHVhbCBkb20gZWxlbWVudCwgdXNlIGEgYmxhbmsgb2JqZWN0IGFzXHJcblx0XHQvLyB0aGUgYmFzZSBjYWNoZWQgbm9kZSBpbnN0ZWFkIG9mIGNvcHlpbmcgdGhlIHZpcnR1YWwgZWwgKCMyNzcpXHJcblx0XHRpZiAoY2FjaGVkLnRhZykgY2FjaGVkID0ge31cclxuXHRcdGNhY2hlZC5ub2RlcyA9IFtdXHJcblx0XHRyZXR1cm4gY2FjaGVkXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBjb25zdHJ1Y3ROb2RlKGRhdGEsIG5hbWVzcGFjZSkge1xyXG5cdFx0aWYgKGRhdGEuYXR0cnMuaXMpIHtcclxuXHRcdFx0aWYgKG5hbWVzcGFjZSA9PSBudWxsKSB7XHJcblx0XHRcdFx0cmV0dXJuICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KGRhdGEudGFnLCBkYXRhLmF0dHJzLmlzKVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJldHVybiAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgZGF0YS50YWcsXHJcblx0XHRcdFx0XHRkYXRhLmF0dHJzLmlzKVxyXG5cdFx0XHR9XHJcblx0XHR9IGVsc2UgaWYgKG5hbWVzcGFjZSA9PSBudWxsKSB7XHJcblx0XHRcdHJldHVybiAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChkYXRhLnRhZylcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHJldHVybiAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKG5hbWVzcGFjZSwgZGF0YS50YWcpXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBjb25zdHJ1Y3RBdHRycyhkYXRhLCBub2RlLCBuYW1lc3BhY2UsIGhhc0tleXMpIHtcclxuXHRcdGlmIChoYXNLZXlzKSB7XHJcblx0XHRcdHJldHVybiBzZXRBdHRyaWJ1dGVzKG5vZGUsIGRhdGEudGFnLCBkYXRhLmF0dHJzLCB7fSwgbmFtZXNwYWNlKVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIGRhdGEuYXR0cnNcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGNvbnN0cnVjdENoaWxkcmVuKFxyXG5cdFx0ZGF0YSxcclxuXHRcdG5vZGUsXHJcblx0XHRjYWNoZWQsXHJcblx0XHRlZGl0YWJsZSxcclxuXHRcdG5hbWVzcGFjZSxcclxuXHRcdGNvbmZpZ3NcclxuXHQpIHtcclxuXHRcdGlmIChkYXRhLmNoaWxkcmVuICE9IG51bGwgJiYgZGF0YS5jaGlsZHJlbi5sZW5ndGggPiAwKSB7XHJcblx0XHRcdHJldHVybiBidWlsZChcclxuXHRcdFx0XHRub2RlLFxyXG5cdFx0XHRcdGRhdGEudGFnLFxyXG5cdFx0XHRcdHVuZGVmaW5lZCxcclxuXHRcdFx0XHR1bmRlZmluZWQsXHJcblx0XHRcdFx0ZGF0YS5jaGlsZHJlbixcclxuXHRcdFx0XHRjYWNoZWQuY2hpbGRyZW4sXHJcblx0XHRcdFx0dHJ1ZSxcclxuXHRcdFx0XHQwLFxyXG5cdFx0XHRcdGRhdGEuYXR0cnMuY29udGVudGVkaXRhYmxlID8gbm9kZSA6IGVkaXRhYmxlLFxyXG5cdFx0XHRcdG5hbWVzcGFjZSxcclxuXHRcdFx0XHRjb25maWdzKVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0cmV0dXJuIGRhdGEuY2hpbGRyZW5cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHJlY29uc3RydWN0Q2FjaGVkKFxyXG5cdFx0ZGF0YSxcclxuXHRcdGF0dHJzLFxyXG5cdFx0Y2hpbGRyZW4sXHJcblx0XHRub2RlLFxyXG5cdFx0bmFtZXNwYWNlLFxyXG5cdFx0dmlld3MsXHJcblx0XHRjb250cm9sbGVyc1xyXG5cdCkge1xyXG5cdFx0dmFyIGNhY2hlZCA9IHtcclxuXHRcdFx0dGFnOiBkYXRhLnRhZyxcclxuXHRcdFx0YXR0cnM6IGF0dHJzLFxyXG5cdFx0XHRjaGlsZHJlbjogY2hpbGRyZW4sXHJcblx0XHRcdG5vZGVzOiBbbm9kZV1cclxuXHRcdH1cclxuXHJcblx0XHR1bmxvYWRDYWNoZWRDb250cm9sbGVycyhjYWNoZWQsIHZpZXdzLCBjb250cm9sbGVycylcclxuXHJcblx0XHRpZiAoY2FjaGVkLmNoaWxkcmVuICYmICFjYWNoZWQuY2hpbGRyZW4ubm9kZXMpIHtcclxuXHRcdFx0Y2FjaGVkLmNoaWxkcmVuLm5vZGVzID0gW11cclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gY2FjaGVkXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBnZXRDb250cm9sbGVyKHZpZXdzLCB2aWV3LCBjYWNoZWRDb250cm9sbGVycywgY29udHJvbGxlcikge1xyXG5cdFx0dmFyIGNvbnRyb2xsZXJJbmRleFxyXG5cclxuXHRcdGlmIChtLnJlZHJhdy5zdHJhdGVneSgpID09PSBcImRpZmZcIiAmJiB2aWV3cykge1xyXG5cdFx0XHRjb250cm9sbGVySW5kZXggPSB2aWV3cy5pbmRleE9mKHZpZXcpXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRjb250cm9sbGVySW5kZXggPSAtMVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChjb250cm9sbGVySW5kZXggPiAtMSkge1xyXG5cdFx0XHRyZXR1cm4gY2FjaGVkQ29udHJvbGxlcnNbY29udHJvbGxlckluZGV4XVxyXG5cdFx0fSBlbHNlIGlmIChpc0Z1bmN0aW9uKGNvbnRyb2xsZXIpKSB7XHJcblx0XHRcdHJldHVybiBuZXcgY29udHJvbGxlcigpXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4ge31cclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdHZhciB1bmxvYWRlcnMgPSBbXVxyXG5cclxuXHRmdW5jdGlvbiB1cGRhdGVMaXN0cyh2aWV3cywgY29udHJvbGxlcnMsIHZpZXcsIGNvbnRyb2xsZXIpIHtcclxuXHRcdGlmIChjb250cm9sbGVyLm9udW5sb2FkICE9IG51bGwgJiZcclxuXHRcdFx0XHR1bmxvYWRlcnMubWFwKGZ1bmN0aW9uICh1KSB7IHJldHVybiB1LmhhbmRsZXIgfSlcclxuXHRcdFx0XHRcdC5pbmRleE9mKGNvbnRyb2xsZXIub251bmxvYWQpIDwgMCkge1xyXG5cdFx0XHR1bmxvYWRlcnMucHVzaCh7XHJcblx0XHRcdFx0Y29udHJvbGxlcjogY29udHJvbGxlcixcclxuXHRcdFx0XHRoYW5kbGVyOiBjb250cm9sbGVyLm9udW5sb2FkXHJcblx0XHRcdH0pXHJcblx0XHR9XHJcblxyXG5cdFx0dmlld3MucHVzaCh2aWV3KVxyXG5cdFx0Y29udHJvbGxlcnMucHVzaChjb250cm9sbGVyKVxyXG5cdH1cclxuXHJcblx0dmFyIGZvcmNpbmcgPSBmYWxzZVxyXG5cdGZ1bmN0aW9uIGNoZWNrVmlldyhcclxuXHRcdGRhdGEsXHJcblx0XHR2aWV3LFxyXG5cdFx0Y2FjaGVkLFxyXG5cdFx0Y2FjaGVkQ29udHJvbGxlcnMsXHJcblx0XHRjb250cm9sbGVycyxcclxuXHRcdHZpZXdzXHJcblx0KSB7XHJcblx0XHR2YXIgY29udHJvbGxlciA9IGdldENvbnRyb2xsZXIoXHJcblx0XHRcdGNhY2hlZC52aWV3cyxcclxuXHRcdFx0dmlldyxcclxuXHRcdFx0Y2FjaGVkQ29udHJvbGxlcnMsXHJcblx0XHRcdGRhdGEuY29udHJvbGxlcilcclxuXHJcblx0XHR2YXIga2V5ID0gZGF0YSAmJiBkYXRhLmF0dHJzICYmIGRhdGEuYXR0cnMua2V5XHJcblxyXG5cdFx0aWYgKHBlbmRpbmdSZXF1ZXN0cyA9PT0gMCB8fFxyXG5cdFx0XHRcdGZvcmNpbmcgfHxcclxuXHRcdFx0XHRjYWNoZWRDb250cm9sbGVycyAmJlxyXG5cdFx0XHRcdFx0Y2FjaGVkQ29udHJvbGxlcnMuaW5kZXhPZihjb250cm9sbGVyKSA+IC0xKSB7XHJcblx0XHRcdGRhdGEgPSBkYXRhLnZpZXcoY29udHJvbGxlcilcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGRhdGEgPSB7dGFnOiBcInBsYWNlaG9sZGVyXCJ9XHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGRhdGEuc3VidHJlZSA9PT0gXCJyZXRhaW5cIikgcmV0dXJuIGRhdGFcclxuXHRcdGRhdGEuYXR0cnMgPSBkYXRhLmF0dHJzIHx8IHt9XHJcblx0XHRkYXRhLmF0dHJzLmtleSA9IGtleVxyXG5cdFx0dXBkYXRlTGlzdHModmlld3MsIGNvbnRyb2xsZXJzLCB2aWV3LCBjb250cm9sbGVyKVxyXG5cdFx0cmV0dXJuIGRhdGFcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIG1hcmtWaWV3cyhkYXRhLCBjYWNoZWQsIHZpZXdzLCBjb250cm9sbGVycykge1xyXG5cdFx0dmFyIGNhY2hlZENvbnRyb2xsZXJzID0gY2FjaGVkICYmIGNhY2hlZC5jb250cm9sbGVyc1xyXG5cclxuXHRcdHdoaWxlIChkYXRhLnZpZXcgIT0gbnVsbCkge1xyXG5cdFx0XHRkYXRhID0gY2hlY2tWaWV3KFxyXG5cdFx0XHRcdGRhdGEsXHJcblx0XHRcdFx0ZGF0YS52aWV3LiRvcmlnaW5hbCB8fCBkYXRhLnZpZXcsXHJcblx0XHRcdFx0Y2FjaGVkLFxyXG5cdFx0XHRcdGNhY2hlZENvbnRyb2xsZXJzLFxyXG5cdFx0XHRcdGNvbnRyb2xsZXJzLFxyXG5cdFx0XHRcdHZpZXdzKVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBkYXRhXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBidWlsZE9iamVjdCggLy8gZXNsaW50LWRpc2FibGUtbGluZSBtYXgtc3RhdGVtZW50c1xyXG5cdFx0ZGF0YSxcclxuXHRcdGNhY2hlZCxcclxuXHRcdGVkaXRhYmxlLFxyXG5cdFx0cGFyZW50RWxlbWVudCxcclxuXHRcdGluZGV4LFxyXG5cdFx0c2hvdWxkUmVhdHRhY2gsXHJcblx0XHRuYW1lc3BhY2UsXHJcblx0XHRjb25maWdzXHJcblx0KSB7XHJcblx0XHR2YXIgdmlld3MgPSBbXVxyXG5cdFx0dmFyIGNvbnRyb2xsZXJzID0gW11cclxuXHJcblx0XHRkYXRhID0gbWFya1ZpZXdzKGRhdGEsIGNhY2hlZCwgdmlld3MsIGNvbnRyb2xsZXJzKVxyXG5cclxuXHRcdGlmIChkYXRhLnN1YnRyZWUgPT09IFwicmV0YWluXCIpIHJldHVybiBjYWNoZWRcclxuXHJcblx0XHRpZiAoIWRhdGEudGFnICYmIGNvbnRyb2xsZXJzLmxlbmd0aCkge1xyXG5cdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJDb21wb25lbnQgdGVtcGxhdGUgbXVzdCByZXR1cm4gYSB2aXJ0dWFsIFwiICtcclxuXHRcdFx0XHRcImVsZW1lbnQsIG5vdCBhbiBhcnJheSwgc3RyaW5nLCBldGMuXCIpXHJcblx0XHR9XHJcblxyXG5cdFx0ZGF0YS5hdHRycyA9IGRhdGEuYXR0cnMgfHwge31cclxuXHRcdGNhY2hlZC5hdHRycyA9IGNhY2hlZC5hdHRycyB8fCB7fVxyXG5cclxuXHRcdHZhciBkYXRhQXR0cktleXMgPSBPYmplY3Qua2V5cyhkYXRhLmF0dHJzKVxyXG5cdFx0dmFyIGhhc0tleXMgPSBkYXRhQXR0cktleXMubGVuZ3RoID4gKFwia2V5XCIgaW4gZGF0YS5hdHRycyA/IDEgOiAwKVxyXG5cclxuXHRcdG1heWJlUmVjcmVhdGVPYmplY3QoZGF0YSwgY2FjaGVkLCBkYXRhQXR0cktleXMpXHJcblxyXG5cdFx0aWYgKCFpc1N0cmluZyhkYXRhLnRhZykpIHJldHVyblxyXG5cclxuXHRcdHZhciBpc05ldyA9IGNhY2hlZC5ub2Rlcy5sZW5ndGggPT09IDBcclxuXHJcblx0XHRuYW1lc3BhY2UgPSBnZXRPYmplY3ROYW1lc3BhY2UoZGF0YSwgbmFtZXNwYWNlKVxyXG5cclxuXHRcdHZhciBub2RlXHJcblx0XHRpZiAoaXNOZXcpIHtcclxuXHRcdFx0bm9kZSA9IGNvbnN0cnVjdE5vZGUoZGF0YSwgbmFtZXNwYWNlKVxyXG5cdFx0XHQvLyBzZXQgYXR0cmlidXRlcyBmaXJzdCwgdGhlbiBjcmVhdGUgY2hpbGRyZW5cclxuXHRcdFx0dmFyIGF0dHJzID0gY29uc3RydWN0QXR0cnMoZGF0YSwgbm9kZSwgbmFtZXNwYWNlLCBoYXNLZXlzKVxyXG5cclxuXHRcdFx0Ly8gYWRkIHRoZSBub2RlIHRvIGl0cyBwYXJlbnQgYmVmb3JlIGF0dGFjaGluZyBjaGlsZHJlbiB0byBpdFxyXG5cdFx0XHRpbnNlcnROb2RlKHBhcmVudEVsZW1lbnQsIG5vZGUsIGluZGV4KVxyXG5cclxuXHRcdFx0dmFyIGNoaWxkcmVuID0gY29uc3RydWN0Q2hpbGRyZW4oZGF0YSwgbm9kZSwgY2FjaGVkLCBlZGl0YWJsZSxcclxuXHRcdFx0XHRuYW1lc3BhY2UsIGNvbmZpZ3MpXHJcblxyXG5cdFx0XHRjYWNoZWQgPSByZWNvbnN0cnVjdENhY2hlZChcclxuXHRcdFx0XHRkYXRhLFxyXG5cdFx0XHRcdGF0dHJzLFxyXG5cdFx0XHRcdGNoaWxkcmVuLFxyXG5cdFx0XHRcdG5vZGUsXHJcblx0XHRcdFx0bmFtZXNwYWNlLFxyXG5cdFx0XHRcdHZpZXdzLFxyXG5cdFx0XHRcdGNvbnRyb2xsZXJzKVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0bm9kZSA9IGJ1aWxkVXBkYXRlZE5vZGUoXHJcblx0XHRcdFx0Y2FjaGVkLFxyXG5cdFx0XHRcdGRhdGEsXHJcblx0XHRcdFx0ZWRpdGFibGUsXHJcblx0XHRcdFx0aGFzS2V5cyxcclxuXHRcdFx0XHRuYW1lc3BhY2UsXHJcblx0XHRcdFx0dmlld3MsXHJcblx0XHRcdFx0Y29uZmlncyxcclxuXHRcdFx0XHRjb250cm9sbGVycylcclxuXHRcdH1cclxuXHJcblx0XHQvLyBlZGdlIGNhc2U6IHNldHRpbmcgdmFsdWUgb24gPHNlbGVjdD4gZG9lc24ndCB3b3JrIGJlZm9yZSBjaGlsZHJlblxyXG5cdFx0Ly8gZXhpc3QsIHNvIHNldCBpdCBhZ2FpbiBhZnRlciBjaGlsZHJlbiBoYXZlIGJlZW4gY3JlYXRlZC91cGRhdGVkXHJcblx0XHRpZiAoZGF0YS50YWcgPT09IFwic2VsZWN0XCIgJiYgXCJ2YWx1ZVwiIGluIGRhdGEuYXR0cnMpIHtcclxuXHRcdFx0c2V0QXR0cmlidXRlcyhub2RlLCBkYXRhLnRhZywge3ZhbHVlOiBkYXRhLmF0dHJzLnZhbHVlfSwge30sXHJcblx0XHRcdFx0bmFtZXNwYWNlKVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmICghaXNOZXcgJiYgc2hvdWxkUmVhdHRhY2ggPT09IHRydWUgJiYgbm9kZSAhPSBudWxsKSB7XHJcblx0XHRcdGluc2VydE5vZGUocGFyZW50RWxlbWVudCwgbm9kZSwgaW5kZXgpXHJcblx0XHR9XHJcblxyXG5cdFx0Ly8gVGhlIGNvbmZpZ3MgYXJlIGNhbGxlZCBhZnRlciBgYnVpbGRgIGZpbmlzaGVzIHJ1bm5pbmdcclxuXHRcdHNjaGVkdWxlQ29uZmlnc1RvQmVDYWxsZWQoY29uZmlncywgZGF0YSwgbm9kZSwgaXNOZXcsIGNhY2hlZClcclxuXHJcblx0XHRyZXR1cm4gY2FjaGVkXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBidWlsZChcclxuXHRcdHBhcmVudEVsZW1lbnQsXHJcblx0XHRwYXJlbnRUYWcsXHJcblx0XHRwYXJlbnRDYWNoZSxcclxuXHRcdHBhcmVudEluZGV4LFxyXG5cdFx0ZGF0YSxcclxuXHRcdGNhY2hlZCxcclxuXHRcdHNob3VsZFJlYXR0YWNoLFxyXG5cdFx0aW5kZXgsXHJcblx0XHRlZGl0YWJsZSxcclxuXHRcdG5hbWVzcGFjZSxcclxuXHRcdGNvbmZpZ3NcclxuXHQpIHtcclxuXHRcdC8qXHJcblx0XHQgKiBgYnVpbGRgIGlzIGEgcmVjdXJzaXZlIGZ1bmN0aW9uIHRoYXQgbWFuYWdlcyBjcmVhdGlvbi9kaWZmaW5nL3JlbW92YWxcclxuXHRcdCAqIG9mIERPTSBlbGVtZW50cyBiYXNlZCBvbiBjb21wYXJpc29uIGJldHdlZW4gYGRhdGFgIGFuZCBgY2FjaGVkYCB0aGVcclxuXHRcdCAqIGRpZmYgYWxnb3JpdGhtIGNhbiBiZSBzdW1tYXJpemVkIGFzIHRoaXM6XHJcblx0XHQgKlxyXG5cdFx0ICogMSAtIGNvbXBhcmUgYGRhdGFgIGFuZCBgY2FjaGVkYFxyXG5cdFx0ICogMiAtIGlmIHRoZXkgYXJlIGRpZmZlcmVudCwgY29weSBgZGF0YWAgdG8gYGNhY2hlZGAgYW5kIHVwZGF0ZSB0aGUgRE9NXHJcblx0XHQgKiAgICAgYmFzZWQgb24gd2hhdCB0aGUgZGlmZmVyZW5jZSBpc1xyXG5cdFx0ICogMyAtIHJlY3Vyc2l2ZWx5IGFwcGx5IHRoaXMgYWxnb3JpdGhtIGZvciBldmVyeSBhcnJheSBhbmQgZm9yIHRoZVxyXG5cdFx0ICogICAgIGNoaWxkcmVuIG9mIGV2ZXJ5IHZpcnR1YWwgZWxlbWVudFxyXG5cdFx0ICpcclxuXHRcdCAqIFRoZSBgY2FjaGVkYCBkYXRhIHN0cnVjdHVyZSBpcyBlc3NlbnRpYWxseSB0aGUgc2FtZSBhcyB0aGUgcHJldmlvdXNcclxuXHRcdCAqIHJlZHJhdydzIGBkYXRhYCBkYXRhIHN0cnVjdHVyZSwgd2l0aCBhIGZldyBhZGRpdGlvbnM6XHJcblx0XHQgKiAtIGBjYWNoZWRgIGFsd2F5cyBoYXMgYSBwcm9wZXJ0eSBjYWxsZWQgYG5vZGVzYCwgd2hpY2ggaXMgYSBsaXN0IG9mXHJcblx0XHQgKiAgICBET00gZWxlbWVudHMgdGhhdCBjb3JyZXNwb25kIHRvIHRoZSBkYXRhIHJlcHJlc2VudGVkIGJ5IHRoZVxyXG5cdFx0ICogICAgcmVzcGVjdGl2ZSB2aXJ0dWFsIGVsZW1lbnRcclxuXHRcdCAqIC0gaW4gb3JkZXIgdG8gc3VwcG9ydCBhdHRhY2hpbmcgYG5vZGVzYCBhcyBhIHByb3BlcnR5IG9mIGBjYWNoZWRgLFxyXG5cdFx0ICogICAgYGNhY2hlZGAgaXMgKmFsd2F5cyogYSBub24tcHJpbWl0aXZlIG9iamVjdCwgaS5lLiBpZiB0aGUgZGF0YSB3YXNcclxuXHRcdCAqICAgIGEgc3RyaW5nLCB0aGVuIGNhY2hlZCBpcyBhIFN0cmluZyBpbnN0YW5jZS4gSWYgZGF0YSB3YXMgYG51bGxgIG9yXHJcblx0XHQgKiAgICBgdW5kZWZpbmVkYCwgY2FjaGVkIGlzIGBuZXcgU3RyaW5nKFwiXCIpYFxyXG5cdFx0ICogLSBgY2FjaGVkIGFsc28gaGFzIGEgYGNvbmZpZ0NvbnRleHRgIHByb3BlcnR5LCB3aGljaCBpcyB0aGUgc3RhdGVcclxuXHRcdCAqICAgIHN0b3JhZ2Ugb2JqZWN0IGV4cG9zZWQgYnkgY29uZmlnKGVsZW1lbnQsIGlzSW5pdGlhbGl6ZWQsIGNvbnRleHQpXHJcblx0XHQgKiAtIHdoZW4gYGNhY2hlZGAgaXMgYW4gT2JqZWN0LCBpdCByZXByZXNlbnRzIGEgdmlydHVhbCBlbGVtZW50OyB3aGVuXHJcblx0XHQgKiAgICBpdCdzIGFuIEFycmF5LCBpdCByZXByZXNlbnRzIGEgbGlzdCBvZiBlbGVtZW50czsgd2hlbiBpdCdzIGFcclxuXHRcdCAqICAgIFN0cmluZywgTnVtYmVyIG9yIEJvb2xlYW4sIGl0IHJlcHJlc2VudHMgYSB0ZXh0IG5vZGVcclxuXHRcdCAqXHJcblx0XHQgKiBgcGFyZW50RWxlbWVudGAgaXMgYSBET00gZWxlbWVudCB1c2VkIGZvciBXM0MgRE9NIEFQSSBjYWxsc1xyXG5cdFx0ICogYHBhcmVudFRhZ2AgaXMgb25seSB1c2VkIGZvciBoYW5kbGluZyBhIGNvcm5lciBjYXNlIGZvciB0ZXh0YXJlYVxyXG5cdFx0ICogdmFsdWVzXHJcblx0XHQgKiBgcGFyZW50Q2FjaGVgIGlzIHVzZWQgdG8gcmVtb3ZlIG5vZGVzIGluIHNvbWUgbXVsdGktbm9kZSBjYXNlc1xyXG5cdFx0ICogYHBhcmVudEluZGV4YCBhbmQgYGluZGV4YCBhcmUgdXNlZCB0byBmaWd1cmUgb3V0IHRoZSBvZmZzZXQgb2Ygbm9kZXMuXHJcblx0XHQgKiBUaGV5J3JlIGFydGlmYWN0cyBmcm9tIGJlZm9yZSBhcnJheXMgc3RhcnRlZCBiZWluZyBmbGF0dGVuZWQgYW5kIGFyZVxyXG5cdFx0ICogbGlrZWx5IHJlZmFjdG9yYWJsZVxyXG5cdFx0ICogYGRhdGFgIGFuZCBgY2FjaGVkYCBhcmUsIHJlc3BlY3RpdmVseSwgdGhlIG5ldyBhbmQgb2xkIG5vZGVzIGJlaW5nXHJcblx0XHQgKiBkaWZmZWRcclxuXHRcdCAqIGBzaG91bGRSZWF0dGFjaGAgaXMgYSBmbGFnIGluZGljYXRpbmcgd2hldGhlciBhIHBhcmVudCBub2RlIHdhc1xyXG5cdFx0ICogcmVjcmVhdGVkIChpZiBzbywgYW5kIGlmIHRoaXMgbm9kZSBpcyByZXVzZWQsIHRoZW4gdGhpcyBub2RlIG11c3RcclxuXHRcdCAqIHJlYXR0YWNoIGl0c2VsZiB0byB0aGUgbmV3IHBhcmVudClcclxuXHRcdCAqIGBlZGl0YWJsZWAgaXMgYSBmbGFnIHRoYXQgaW5kaWNhdGVzIHdoZXRoZXIgYW4gYW5jZXN0b3IgaXNcclxuXHRcdCAqIGNvbnRlbnRlZGl0YWJsZVxyXG5cdFx0ICogYG5hbWVzcGFjZWAgaW5kaWNhdGVzIHRoZSBjbG9zZXN0IEhUTUwgbmFtZXNwYWNlIGFzIGl0IGNhc2NhZGVzIGRvd25cclxuXHRcdCAqIGZyb20gYW4gYW5jZXN0b3JcclxuXHRcdCAqIGBjb25maWdzYCBpcyBhIGxpc3Qgb2YgY29uZmlnIGZ1bmN0aW9ucyB0byBydW4gYWZ0ZXIgdGhlIHRvcG1vc3RcclxuXHRcdCAqIGBidWlsZGAgY2FsbCBmaW5pc2hlcyBydW5uaW5nXHJcblx0XHQgKlxyXG5cdFx0ICogdGhlcmUncyBsb2dpYyB0aGF0IHJlbGllcyBvbiB0aGUgYXNzdW1wdGlvbiB0aGF0IG51bGwgYW5kIHVuZGVmaW5lZFxyXG5cdFx0ICogZGF0YSBhcmUgZXF1aXZhbGVudCB0byBlbXB0eSBzdHJpbmdzXHJcblx0XHQgKiAtIHRoaXMgcHJldmVudHMgbGlmZWN5Y2xlIHN1cnByaXNlcyBmcm9tIHByb2NlZHVyYWwgaGVscGVycyB0aGF0IG1peFxyXG5cdFx0ICogICBpbXBsaWNpdCBhbmQgZXhwbGljaXQgcmV0dXJuIHN0YXRlbWVudHMgKGUuZy5cclxuXHRcdCAqICAgZnVuY3Rpb24gZm9vKCkge2lmIChjb25kKSByZXR1cm4gbShcImRpdlwiKX1cclxuXHRcdCAqIC0gaXQgc2ltcGxpZmllcyBkaWZmaW5nIGNvZGVcclxuXHRcdCAqL1xyXG5cdFx0ZGF0YSA9IGRhdGFUb1N0cmluZyhkYXRhKVxyXG5cdFx0aWYgKGRhdGEuc3VidHJlZSA9PT0gXCJyZXRhaW5cIikgcmV0dXJuIGNhY2hlZFxyXG5cdFx0Y2FjaGVkID0gbWFrZUNhY2hlKGRhdGEsIGNhY2hlZCwgaW5kZXgsIHBhcmVudEluZGV4LCBwYXJlbnRDYWNoZSlcclxuXHJcblx0XHRpZiAoaXNBcnJheShkYXRhKSkge1xyXG5cdFx0XHRyZXR1cm4gYnVpbGRBcnJheShcclxuXHRcdFx0XHRkYXRhLFxyXG5cdFx0XHRcdGNhY2hlZCxcclxuXHRcdFx0XHRwYXJlbnRFbGVtZW50LFxyXG5cdFx0XHRcdGluZGV4LFxyXG5cdFx0XHRcdHBhcmVudFRhZyxcclxuXHRcdFx0XHRzaG91bGRSZWF0dGFjaCxcclxuXHRcdFx0XHRlZGl0YWJsZSxcclxuXHRcdFx0XHRuYW1lc3BhY2UsXHJcblx0XHRcdFx0Y29uZmlncylcclxuXHRcdH0gZWxzZSBpZiAoZGF0YSAhPSBudWxsICYmIGlzT2JqZWN0KGRhdGEpKSB7XHJcblx0XHRcdHJldHVybiBidWlsZE9iamVjdChcclxuXHRcdFx0XHRkYXRhLFxyXG5cdFx0XHRcdGNhY2hlZCxcclxuXHRcdFx0XHRlZGl0YWJsZSxcclxuXHRcdFx0XHRwYXJlbnRFbGVtZW50LFxyXG5cdFx0XHRcdGluZGV4LFxyXG5cdFx0XHRcdHNob3VsZFJlYXR0YWNoLFxyXG5cdFx0XHRcdG5hbWVzcGFjZSxcclxuXHRcdFx0XHRjb25maWdzKVxyXG5cdFx0fSBlbHNlIGlmICghaXNGdW5jdGlvbihkYXRhKSkge1xyXG5cdFx0XHRyZXR1cm4gaGFuZGxlVGV4dE5vZGUoXHJcblx0XHRcdFx0Y2FjaGVkLFxyXG5cdFx0XHRcdGRhdGEsXHJcblx0XHRcdFx0aW5kZXgsXHJcblx0XHRcdFx0cGFyZW50RWxlbWVudCxcclxuXHRcdFx0XHRzaG91bGRSZWF0dGFjaCxcclxuXHRcdFx0XHRlZGl0YWJsZSxcclxuXHRcdFx0XHRwYXJlbnRUYWcpXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4gY2FjaGVkXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBzb3J0Q2hhbmdlcyhhLCBiKSB7XHJcblx0XHRyZXR1cm4gYS5hY3Rpb24gLSBiLmFjdGlvbiB8fCBhLmluZGV4IC0gYi5pbmRleFxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gY29weVN0eWxlQXR0cnMobm9kZSwgZGF0YUF0dHIsIGNhY2hlZEF0dHIpIHtcclxuXHRcdGlmIChjYWNoZWRBdHRyID09PSBkYXRhQXR0cikge1xyXG5cdFx0XHRub2RlLnN0eWxlID0gXCJcIlxyXG5cdFx0XHRjYWNoZWRBdHRyID0ge31cclxuXHRcdH1cclxuXHRcdGZvciAodmFyIHJ1bGUgaW4gZGF0YUF0dHIpIHtcclxuXHRcdFx0aWYgKGhhc093bi5jYWxsKGRhdGFBdHRyLCBydWxlKSkge1xyXG5cdFx0XHRcdGlmIChjYWNoZWRBdHRyID09IG51bGwgfHwgY2FjaGVkQXR0cltydWxlXSAhPT0gZGF0YUF0dHJbcnVsZV0pIHtcclxuXHRcdFx0XHRcdG5vZGUuc3R5bGVbcnVsZV0gPSBkYXRhQXR0cltydWxlXVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGZvciAocnVsZSBpbiBjYWNoZWRBdHRyKSB7XHJcblx0XHRcdGlmIChoYXNPd24uY2FsbChjYWNoZWRBdHRyLCBydWxlKSkge1xyXG5cdFx0XHRcdGlmICghaGFzT3duLmNhbGwoZGF0YUF0dHIsIHJ1bGUpKSBub2RlLnN0eWxlW3J1bGVdID0gXCJcIlxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHR2YXIgc2hvdWxkVXNlU2V0QXR0cmlidXRlID0ge1xyXG5cdFx0bGlzdDogMSxcclxuXHRcdHN0eWxlOiAxLFxyXG5cdFx0Zm9ybTogMSxcclxuXHRcdHR5cGU6IDEsXHJcblx0XHR3aWR0aDogMSxcclxuXHRcdGhlaWdodDogMVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gc2V0U2luZ2xlQXR0cihcclxuXHRcdG5vZGUsXHJcblx0XHRhdHRyTmFtZSxcclxuXHRcdGRhdGFBdHRyLFxyXG5cdFx0Y2FjaGVkQXR0cixcclxuXHRcdHRhZyxcclxuXHRcdG5hbWVzcGFjZVxyXG5cdCkge1xyXG5cdFx0aWYgKGF0dHJOYW1lID09PSBcImNvbmZpZ1wiIHx8IGF0dHJOYW1lID09PSBcImtleVwiKSB7XHJcblx0XHRcdC8vIGBjb25maWdgIGlzbid0IGEgcmVhbCBhdHRyaWJ1dGUsIHNvIGlnbm9yZSBpdFxyXG5cdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0fSBlbHNlIGlmIChpc0Z1bmN0aW9uKGRhdGFBdHRyKSAmJiBhdHRyTmFtZS5zbGljZSgwLCAyKSA9PT0gXCJvblwiKSB7XHJcblx0XHRcdC8vIGhvb2sgZXZlbnQgaGFuZGxlcnMgdG8gdGhlIGF1dG8tcmVkcmF3aW5nIHN5c3RlbVxyXG5cdFx0XHRub2RlW2F0dHJOYW1lXSA9IGF1dG9yZWRyYXcoZGF0YUF0dHIsIG5vZGUpXHJcblx0XHR9IGVsc2UgaWYgKGF0dHJOYW1lID09PSBcInN0eWxlXCIgJiYgZGF0YUF0dHIgIT0gbnVsbCAmJlxyXG5cdFx0XHRcdGlzT2JqZWN0KGRhdGFBdHRyKSkge1xyXG5cdFx0XHQvLyBoYW5kbGUgYHN0eWxlOiB7Li4ufWBcclxuXHRcdFx0Y29weVN0eWxlQXR0cnMobm9kZSwgZGF0YUF0dHIsIGNhY2hlZEF0dHIpXHJcblx0XHR9IGVsc2UgaWYgKG5hbWVzcGFjZSAhPSBudWxsKSB7XHJcblx0XHRcdC8vIGhhbmRsZSBTVkdcclxuXHRcdFx0aWYgKGF0dHJOYW1lID09PSBcImhyZWZcIikge1xyXG5cdFx0XHRcdG5vZGUuc2V0QXR0cmlidXRlTlMoXCJodHRwOi8vd3d3LnczLm9yZy8xOTk5L3hsaW5rXCIsXHJcblx0XHRcdFx0XHRcImhyZWZcIiwgZGF0YUF0dHIpXHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0bm9kZS5zZXRBdHRyaWJ1dGUoXHJcblx0XHRcdFx0XHRhdHRyTmFtZSA9PT0gXCJjbGFzc05hbWVcIiA/IFwiY2xhc3NcIiA6IGF0dHJOYW1lLFxyXG5cdFx0XHRcdFx0ZGF0YUF0dHIpXHJcblx0XHRcdH1cclxuXHRcdH0gZWxzZSBpZiAoYXR0ck5hbWUgaW4gbm9kZSAmJiAhc2hvdWxkVXNlU2V0QXR0cmlidXRlW2F0dHJOYW1lXSkge1xyXG5cdFx0XHQvLyBoYW5kbGUgY2FzZXMgdGhhdCBhcmUgcHJvcGVydGllcyAoYnV0IGlnbm9yZSBjYXNlcyB3aGVyZSB3ZVxyXG5cdFx0XHQvLyBzaG91bGQgdXNlIHNldEF0dHJpYnV0ZSBpbnN0ZWFkKVxyXG5cdFx0XHQvL1xyXG5cdFx0XHQvLyAtIGxpc3QgYW5kIGZvcm0gYXJlIHR5cGljYWxseSB1c2VkIGFzIHN0cmluZ3MsIGJ1dCBhcmUgRE9NXHJcblx0XHRcdC8vICAgZWxlbWVudCByZWZlcmVuY2VzIGluIGpzXHJcblx0XHRcdC8vXHJcblx0XHRcdC8vIC0gd2hlbiB1c2luZyBDU1Mgc2VsZWN0b3JzIChlLmcuIGBtKFwiW3N0eWxlPScnXVwiKWApLCBzdHlsZSBpc1xyXG5cdFx0XHQvLyAgIHVzZWQgYXMgYSBzdHJpbmcsIGJ1dCBpdCdzIGFuIG9iamVjdCBpbiBqc1xyXG5cdFx0XHQvL1xyXG5cdFx0XHQvLyAjMzQ4IGRvbid0IHNldCB0aGUgdmFsdWUgaWYgbm90IG5lZWRlZCAtIG90aGVyd2lzZSwgY3Vyc29yXHJcblx0XHRcdC8vIHBsYWNlbWVudCBicmVha3MgaW4gQ2hyb21lXHJcblx0XHRcdC8vICMxMjUyIGxpa2V3aXNlIHdoZW4gYGNvbnRlbnRlZGl0YWJsZWAgaXMgc2V0IG9uIGFuIGVsZW1lbnQuXHJcblx0XHRcdHRyeSB7XHJcblx0XHRcdFx0aWYgKFxyXG5cdFx0XHRcdFx0dGFnICE9PSBcImlucHV0XCIgJiYgIW5vZGUuaXNDb250ZW50RWRpdGFibGUgfHxcclxuXHRcdFx0XHRcdG5vZGVbYXR0ck5hbWVdICE9IGRhdGFBdHRyIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgZXFlcWVxXHJcblx0XHRcdFx0KSB7XHJcblx0XHRcdFx0XHRub2RlW2F0dHJOYW1lXSA9IGRhdGFBdHRyXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGNhdGNoIChlKSB7XHJcblx0XHRcdFx0bm9kZS5zZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIGRhdGFBdHRyKVxyXG5cdFx0XHR9XHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR0cnkge1xyXG5cdFx0XHRcdG5vZGUuc2V0QXR0cmlidXRlKGF0dHJOYW1lLCBkYXRhQXR0cilcclxuXHRcdFx0fSBjYXRjaCAoZSkge1xyXG5cdFx0XHRcdC8vIElFOCBkb2Vzbid0IGFsbG93IGNoYW5nZSBpbnB1dCBhdHRyaWJ1dGVzIGFuZCB0aHJvd3NcclxuXHRcdFx0XHQvLyBhbiBleGNlcHRpb24uIFVuZm9ydHVuYXRlbHkgaXQgY2Fubm90IGJlIGhhbmRsZWQsIGJlY2F1c2VcclxuXHRcdFx0XHQvLyBlcnJvciBjb2RlIGlzIG5vdCBpbmZvcm1hdGl2ZS5cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gdHJ5U2V0QXR0cihcclxuXHRcdG5vZGUsXHJcblx0XHRhdHRyTmFtZSxcclxuXHRcdGRhdGFBdHRyLFxyXG5cdFx0Y2FjaGVkQXR0cixcclxuXHRcdGNhY2hlZEF0dHJzLFxyXG5cdFx0dGFnLFxyXG5cdFx0bmFtZXNwYWNlXHJcblx0KSB7XHJcblx0XHRpZiAoIShhdHRyTmFtZSBpbiBjYWNoZWRBdHRycykgfHxcclxuXHRcdFx0XHQoY2FjaGVkQXR0ciAhPT0gZGF0YUF0dHIpIHx8XHJcblx0XHRcdFx0dHlwZW9mIGRhdGFBdHRyID09PSBcIm9iamVjdFwiIHx8XHJcblx0XHRcdFx0KCRkb2N1bWVudC5hY3RpdmVFbGVtZW50ID09PSBub2RlKSkge1xyXG5cdFx0XHRjYWNoZWRBdHRyc1thdHRyTmFtZV0gPSBkYXRhQXR0clxyXG5cdFx0XHR0cnkge1xyXG5cdFx0XHRcdHJldHVybiBzZXRTaW5nbGVBdHRyKFxyXG5cdFx0XHRcdFx0bm9kZSxcclxuXHRcdFx0XHRcdGF0dHJOYW1lLFxyXG5cdFx0XHRcdFx0ZGF0YUF0dHIsXHJcblx0XHRcdFx0XHRjYWNoZWRBdHRyLFxyXG5cdFx0XHRcdFx0dGFnLFxyXG5cdFx0XHRcdFx0bmFtZXNwYWNlKVxyXG5cdFx0XHR9IGNhdGNoIChlKSB7XHJcblx0XHRcdFx0Ly8gc3dhbGxvdyBJRSdzIGludmFsaWQgYXJndW1lbnQgZXJyb3JzIHRvIG1pbWljIEhUTUwnc1xyXG5cdFx0XHRcdC8vIGZhbGxiYWNrLXRvLWRvaW5nLW5vdGhpbmctb24taW52YWxpZC1hdHRyaWJ1dGVzIGJlaGF2aW9yXHJcblx0XHRcdFx0aWYgKGUubWVzc2FnZS5pbmRleE9mKFwiSW52YWxpZCBhcmd1bWVudFwiKSA8IDApIHRocm93IGVcclxuXHRcdFx0fVxyXG5cdFx0fSBlbHNlIGlmIChhdHRyTmFtZSA9PT0gXCJ2YWx1ZVwiICYmIHRhZyA9PT0gXCJpbnB1dFwiICYmXHJcblx0XHRcdFx0XHRcdFx0XHQvKiBlc2xpbnQtZGlzYWJsZSBlcWVxZXEgKi9cclxuXHRcdFx0XHRcdFx0XHRcdG5vZGUudmFsdWUgIT0gZGF0YUF0dHIpIHtcclxuXHRcdFx0XHRcdFx0XHRcdC8vICMzNDggZGF0YUF0dHIgbWF5IG5vdCBiZSBhIHN0cmluZyxcclxuXHRcdFx0XHRcdFx0XHRcdC8vIHNvIHVzZSBsb29zZSBjb21wYXJpc29uXHJcblx0XHRcdFx0XHRcdFx0XHQvKiBlc2xpbnQtZW5hYmxlIGVxZXFlcSAqL1xyXG5cdFx0XHRub2RlLnZhbHVlID0gZGF0YUF0dHJcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHNldEF0dHJpYnV0ZXMobm9kZSwgdGFnLCBkYXRhQXR0cnMsIGNhY2hlZEF0dHJzLCBuYW1lc3BhY2UpIHtcclxuXHRcdGZvciAodmFyIGF0dHJOYW1lIGluIGRhdGFBdHRycykge1xyXG5cdFx0XHRpZiAoaGFzT3duLmNhbGwoZGF0YUF0dHJzLCBhdHRyTmFtZSkpIHtcclxuXHRcdFx0XHRpZiAodHJ5U2V0QXR0cihcclxuXHRcdFx0XHRcdFx0bm9kZSxcclxuXHRcdFx0XHRcdFx0YXR0ck5hbWUsXHJcblx0XHRcdFx0XHRcdGRhdGFBdHRyc1thdHRyTmFtZV0sXHJcblx0XHRcdFx0XHRcdGNhY2hlZEF0dHJzW2F0dHJOYW1lXSxcclxuXHRcdFx0XHRcdFx0Y2FjaGVkQXR0cnMsXHJcblx0XHRcdFx0XHRcdHRhZyxcclxuXHRcdFx0XHRcdFx0bmFtZXNwYWNlKSkge1xyXG5cdFx0XHRcdFx0Y29udGludWVcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHRcdHJldHVybiBjYWNoZWRBdHRyc1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gY2xlYXIobm9kZXMsIGNhY2hlZCkge1xyXG5cdFx0Zm9yICh2YXIgaSA9IG5vZGVzLmxlbmd0aCAtIDE7IGkgPiAtMTsgaS0tKSB7XHJcblx0XHRcdGlmIChub2Rlc1tpXSAmJiBub2Rlc1tpXS5wYXJlbnROb2RlKSB7XHJcblx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdG5vZGVzW2ldLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQobm9kZXNbaV0pXHJcblx0XHRcdFx0fSBjYXRjaCAoZSkge1xyXG5cdFx0XHRcdFx0LyogZXNsaW50LWRpc2FibGUgbWF4LWxlbiAqL1xyXG5cdFx0XHRcdFx0Ly8gaWdub3JlIGlmIHRoaXMgZmFpbHMgZHVlIHRvIG9yZGVyIG9mIGV2ZW50cyAoc2VlXHJcblx0XHRcdFx0XHQvLyBodHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzIxOTI2MDgzL2ZhaWxlZC10by1leGVjdXRlLXJlbW92ZWNoaWxkLW9uLW5vZGUpXHJcblx0XHRcdFx0XHQvKiBlc2xpbnQtZW5hYmxlIG1heC1sZW4gKi9cclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0Y2FjaGVkID0gW10uY29uY2F0KGNhY2hlZClcclxuXHRcdFx0XHRpZiAoY2FjaGVkW2ldKSB1bmxvYWQoY2FjaGVkW2ldKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0XHQvLyByZWxlYXNlIG1lbW9yeSBpZiBub2RlcyBpcyBhbiBhcnJheS4gVGhpcyBjaGVjayBzaG91bGQgZmFpbCBpZiBub2Rlc1xyXG5cdFx0Ly8gaXMgYSBOb2RlTGlzdCAoc2VlIGxvb3AgYWJvdmUpXHJcblx0XHRpZiAobm9kZXMubGVuZ3RoKSB7XHJcblx0XHRcdG5vZGVzLmxlbmd0aCA9IDBcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHVubG9hZChjYWNoZWQpIHtcclxuXHRcdGlmIChjYWNoZWQuY29uZmlnQ29udGV4dCAmJiBpc0Z1bmN0aW9uKGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkKSkge1xyXG5cdFx0XHRjYWNoZWQuY29uZmlnQ29udGV4dC5vbnVubG9hZCgpXHJcblx0XHRcdGNhY2hlZC5jb25maWdDb250ZXh0Lm9udW5sb2FkID0gbnVsbFxyXG5cdFx0fVxyXG5cdFx0aWYgKGNhY2hlZC5jb250cm9sbGVycykge1xyXG5cdFx0XHRmb3JFYWNoKGNhY2hlZC5jb250cm9sbGVycywgZnVuY3Rpb24gKGNvbnRyb2xsZXIpIHtcclxuXHRcdFx0XHRpZiAoaXNGdW5jdGlvbihjb250cm9sbGVyLm9udW5sb2FkKSkge1xyXG5cdFx0XHRcdFx0Y29udHJvbGxlci5vbnVubG9hZCh7cHJldmVudERlZmF1bHQ6IG5vb3B9KVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHRcdGlmIChjYWNoZWQuY2hpbGRyZW4pIHtcclxuXHRcdFx0aWYgKGlzQXJyYXkoY2FjaGVkLmNoaWxkcmVuKSkgZm9yRWFjaChjYWNoZWQuY2hpbGRyZW4sIHVubG9hZClcclxuXHRcdFx0ZWxzZSBpZiAoY2FjaGVkLmNoaWxkcmVuLnRhZykgdW5sb2FkKGNhY2hlZC5jaGlsZHJlbilcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGFwcGVuZFRleHRGcmFnbWVudChwYXJlbnRFbGVtZW50LCBkYXRhKSB7XHJcblx0XHR0cnkge1xyXG5cdFx0XHRwYXJlbnRFbGVtZW50LmFwcGVuZENoaWxkKFxyXG5cdFx0XHRcdCRkb2N1bWVudC5jcmVhdGVSYW5nZSgpLmNyZWF0ZUNvbnRleHR1YWxGcmFnbWVudChkYXRhKSlcclxuXHRcdH0gY2F0Y2ggKGUpIHtcclxuXHRcdFx0cGFyZW50RWxlbWVudC5pbnNlcnRBZGphY2VudEhUTUwoXCJiZWZvcmVlbmRcIiwgZGF0YSlcclxuXHRcdFx0cmVwbGFjZVNjcmlwdE5vZGVzKHBhcmVudEVsZW1lbnQpXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvLyBSZXBsYWNlIHNjcmlwdCB0YWdzIGluc2lkZSBnaXZlbiBET00gZWxlbWVudCB3aXRoIGV4ZWN1dGFibGUgb25lcy5cclxuXHQvLyBXaWxsIGFsc28gY2hlY2sgY2hpbGRyZW4gcmVjdXJzaXZlbHkgYW5kIHJlcGxhY2UgYW55IGZvdW5kIHNjcmlwdFxyXG5cdC8vIHRhZ3MgaW4gc2FtZSBtYW5uZXIuXHJcblx0ZnVuY3Rpb24gcmVwbGFjZVNjcmlwdE5vZGVzKG5vZGUpIHtcclxuXHRcdGlmIChub2RlLnRhZ05hbWUgPT09IFwiU0NSSVBUXCIpIHtcclxuXHRcdFx0bm9kZS5wYXJlbnROb2RlLnJlcGxhY2VDaGlsZChidWlsZEV4ZWN1dGFibGVOb2RlKG5vZGUpLCBub2RlKVxyXG5cdFx0fSBlbHNlIHtcclxuXHRcdFx0dmFyIGNoaWxkcmVuID0gbm9kZS5jaGlsZE5vZGVzXHJcblx0XHRcdGlmIChjaGlsZHJlbiAmJiBjaGlsZHJlbi5sZW5ndGgpIHtcclxuXHRcdFx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGNoaWxkcmVuLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdFx0XHRyZXBsYWNlU2NyaXB0Tm9kZXMoY2hpbGRyZW5baV0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIG5vZGVcclxuXHR9XHJcblxyXG5cdC8vIFJlcGxhY2Ugc2NyaXB0IGVsZW1lbnQgd2l0aCBvbmUgd2hvc2UgY29udGVudHMgYXJlIGV4ZWN1dGFibGUuXHJcblx0ZnVuY3Rpb24gYnVpbGRFeGVjdXRhYmxlTm9kZShub2RlKXtcclxuXHRcdHZhciBzY3JpcHRFbCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJzY3JpcHRcIilcclxuXHRcdHZhciBhdHRycyA9IG5vZGUuYXR0cmlidXRlc1xyXG5cclxuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgYXR0cnMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0c2NyaXB0RWwuc2V0QXR0cmlidXRlKGF0dHJzW2ldLm5hbWUsIGF0dHJzW2ldLnZhbHVlKVxyXG5cdFx0fVxyXG5cclxuXHRcdHNjcmlwdEVsLnRleHQgPSBub2RlLmlubmVySFRNTFxyXG5cdFx0cmV0dXJuIHNjcmlwdEVsXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBpbmplY3RIVE1MKHBhcmVudEVsZW1lbnQsIGluZGV4LCBkYXRhKSB7XHJcblx0XHR2YXIgbmV4dFNpYmxpbmcgPSBwYXJlbnRFbGVtZW50LmNoaWxkTm9kZXNbaW5kZXhdXHJcblx0XHRpZiAobmV4dFNpYmxpbmcpIHtcclxuXHRcdFx0dmFyIGlzRWxlbWVudCA9IG5leHRTaWJsaW5nLm5vZGVUeXBlICE9PSAxXHJcblx0XHRcdHZhciBwbGFjZWhvbGRlciA9ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwic3BhblwiKVxyXG5cdFx0XHRpZiAoaXNFbGVtZW50KSB7XHJcblx0XHRcdFx0cGFyZW50RWxlbWVudC5pbnNlcnRCZWZvcmUocGxhY2Vob2xkZXIsIG5leHRTaWJsaW5nIHx8IG51bGwpXHJcblx0XHRcdFx0cGxhY2Vob2xkZXIuaW5zZXJ0QWRqYWNlbnRIVE1MKFwiYmVmb3JlYmVnaW5cIiwgZGF0YSlcclxuXHRcdFx0XHRwYXJlbnRFbGVtZW50LnJlbW92ZUNoaWxkKHBsYWNlaG9sZGVyKVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdG5leHRTaWJsaW5nLmluc2VydEFkamFjZW50SFRNTChcImJlZm9yZWJlZ2luXCIsIGRhdGEpXHJcblx0XHRcdH1cclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGFwcGVuZFRleHRGcmFnbWVudChwYXJlbnRFbGVtZW50LCBkYXRhKVxyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBub2RlcyA9IFtdXHJcblxyXG5cdFx0d2hpbGUgKHBhcmVudEVsZW1lbnQuY2hpbGROb2Rlc1tpbmRleF0gIT09IG5leHRTaWJsaW5nKSB7XHJcblx0XHRcdG5vZGVzLnB1c2gocGFyZW50RWxlbWVudC5jaGlsZE5vZGVzW2luZGV4XSlcclxuXHRcdFx0aW5kZXgrK1xyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBub2Rlc1xyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gYXV0b3JlZHJhdyhjYWxsYmFjaywgb2JqZWN0KSB7XHJcblx0XHRyZXR1cm4gZnVuY3Rpb24gKGUpIHtcclxuXHRcdFx0ZSA9IGUgfHwgZXZlbnRcclxuXHRcdFx0bS5yZWRyYXcuc3RyYXRlZ3koXCJkaWZmXCIpXHJcblx0XHRcdG0uc3RhcnRDb21wdXRhdGlvbigpXHJcblx0XHRcdHRyeSB7XHJcblx0XHRcdFx0cmV0dXJuIGNhbGxiYWNrLmNhbGwob2JqZWN0LCBlKVxyXG5cdFx0XHR9IGZpbmFsbHkge1xyXG5cdFx0XHRcdGVuZEZpcnN0Q29tcHV0YXRpb24oKVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHR2YXIgaHRtbFxyXG5cdHZhciBkb2N1bWVudE5vZGUgPSB7XHJcblx0XHRhcHBlbmRDaGlsZDogZnVuY3Rpb24gKG5vZGUpIHtcclxuXHRcdFx0aWYgKGh0bWwgPT09IHVuZGVmaW5lZCkgaHRtbCA9ICRkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiaHRtbFwiKVxyXG5cdFx0XHRpZiAoJGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAmJlxyXG5cdFx0XHRcdFx0JGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCAhPT0gbm9kZSkge1xyXG5cdFx0XHRcdCRkb2N1bWVudC5yZXBsYWNlQ2hpbGQobm9kZSwgJGRvY3VtZW50LmRvY3VtZW50RWxlbWVudClcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHQkZG9jdW1lbnQuYXBwZW5kQ2hpbGQobm9kZSlcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dGhpcy5jaGlsZE5vZGVzID0gJGRvY3VtZW50LmNoaWxkTm9kZXNcclxuXHRcdH0sXHJcblxyXG5cdFx0aW5zZXJ0QmVmb3JlOiBmdW5jdGlvbiAobm9kZSkge1xyXG5cdFx0XHR0aGlzLmFwcGVuZENoaWxkKG5vZGUpXHJcblx0XHR9LFxyXG5cclxuXHRcdGNoaWxkTm9kZXM6IFtdXHJcblx0fVxyXG5cclxuXHR2YXIgbm9kZUNhY2hlID0gW11cclxuXHR2YXIgY2VsbENhY2hlID0ge31cclxuXHJcblx0bS5yZW5kZXIgPSBmdW5jdGlvbiAocm9vdCwgY2VsbCwgZm9yY2VSZWNyZWF0aW9uKSB7XHJcblx0XHRpZiAoIXJvb3QpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiRW5zdXJlIHRoZSBET00gZWxlbWVudCBiZWluZyBwYXNzZWQgdG8gXCIgK1xyXG5cdFx0XHRcdFwibS5yb3V0ZS9tLm1vdW50L20ucmVuZGVyIGlzIG5vdCB1bmRlZmluZWQuXCIpXHJcblx0XHR9XHJcblx0XHR2YXIgY29uZmlncyA9IFtdXHJcblx0XHR2YXIgaWQgPSBnZXRDZWxsQ2FjaGVLZXkocm9vdClcclxuXHRcdHZhciBpc0RvY3VtZW50Um9vdCA9IHJvb3QgPT09ICRkb2N1bWVudFxyXG5cdFx0dmFyIG5vZGVcclxuXHJcblx0XHRpZiAoaXNEb2N1bWVudFJvb3QgfHwgcm9vdCA9PT0gJGRvY3VtZW50LmRvY3VtZW50RWxlbWVudCkge1xyXG5cdFx0XHRub2RlID0gZG9jdW1lbnROb2RlXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRub2RlID0gcm9vdFxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChpc0RvY3VtZW50Um9vdCAmJiBjZWxsLnRhZyAhPT0gXCJodG1sXCIpIHtcclxuXHRcdFx0Y2VsbCA9IHt0YWc6IFwiaHRtbFwiLCBhdHRyczoge30sIGNoaWxkcmVuOiBjZWxsfVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChjZWxsQ2FjaGVbaWRdID09PSB1bmRlZmluZWQpIGNsZWFyKG5vZGUuY2hpbGROb2RlcylcclxuXHRcdGlmIChmb3JjZVJlY3JlYXRpb24gPT09IHRydWUpIHJlc2V0KHJvb3QpXHJcblxyXG5cdFx0Y2VsbENhY2hlW2lkXSA9IGJ1aWxkKFxyXG5cdFx0XHRub2RlLFxyXG5cdFx0XHRudWxsLFxyXG5cdFx0XHR1bmRlZmluZWQsXHJcblx0XHRcdHVuZGVmaW5lZCxcclxuXHRcdFx0Y2VsbCxcclxuXHRcdFx0Y2VsbENhY2hlW2lkXSxcclxuXHRcdFx0ZmFsc2UsXHJcblx0XHRcdDAsXHJcblx0XHRcdG51bGwsXHJcblx0XHRcdHVuZGVmaW5lZCxcclxuXHRcdFx0Y29uZmlncylcclxuXHJcblx0XHRmb3JFYWNoKGNvbmZpZ3MsIGZ1bmN0aW9uIChjb25maWcpIHsgY29uZmlnKCkgfSlcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGdldENlbGxDYWNoZUtleShlbGVtZW50KSB7XHJcblx0XHR2YXIgaW5kZXggPSBub2RlQ2FjaGUuaW5kZXhPZihlbGVtZW50KVxyXG5cdFx0cmV0dXJuIGluZGV4IDwgMCA/IG5vZGVDYWNoZS5wdXNoKGVsZW1lbnQpIC0gMSA6IGluZGV4XHJcblx0fVxyXG5cclxuXHRtLnRydXN0ID0gZnVuY3Rpb24gKHZhbHVlKSB7XHJcblx0XHR2YWx1ZSA9IG5ldyBTdHJpbmcodmFsdWUpIC8vIGVzbGludC1kaXNhYmxlLWxpbmUgbm8tbmV3LXdyYXBwZXJzXHJcblx0XHR2YWx1ZS4kdHJ1c3RlZCA9IHRydWVcclxuXHRcdHJldHVybiB2YWx1ZVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZ2V0dGVyc2V0dGVyKHN0b3JlKSB7XHJcblx0XHRmdW5jdGlvbiBwcm9wKCkge1xyXG5cdFx0XHRpZiAoYXJndW1lbnRzLmxlbmd0aCkgc3RvcmUgPSBhcmd1bWVudHNbMF1cclxuXHRcdFx0cmV0dXJuIHN0b3JlXHJcblx0XHR9XHJcblxyXG5cdFx0cHJvcC50b0pTT04gPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdGlmIChzdG9yZSAmJiBpc0Z1bmN0aW9uKHN0b3JlLnRvSlNPTikpIHJldHVybiBzdG9yZS50b0pTT04oKVxyXG5cdFx0XHRyZXR1cm4gc3RvcmVcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gcHJvcFxyXG5cdH1cclxuXHJcblx0bS5wcm9wID0gZnVuY3Rpb24gKHN0b3JlKSB7XHJcblx0XHRpZiAoKHN0b3JlICE9IG51bGwgJiYgKGlzT2JqZWN0KHN0b3JlKSB8fCBpc0Z1bmN0aW9uKHN0b3JlKSkgfHxcclxuXHRcdFx0XHRcdCgodHlwZW9mIFByb21pc2UgIT09IFwidW5kZWZpbmVkXCIpICYmXHJcblx0XHRcdFx0XHRcdChzdG9yZSBpbnN0YW5jZW9mIFByb21pc2UpKSkgJiZcclxuXHRcdFx0XHRpc0Z1bmN0aW9uKHN0b3JlLnRoZW4pKSB7XHJcblx0XHRcdHJldHVybiBwcm9waWZ5KHN0b3JlKVxyXG5cdFx0fVxyXG5cclxuXHRcdHJldHVybiBnZXR0ZXJzZXR0ZXIoc3RvcmUpXHJcblx0fVxyXG5cclxuXHR2YXIgcm9vdHMgPSBbXVxyXG5cdHZhciBjb21wb25lbnRzID0gW11cclxuXHR2YXIgY29udHJvbGxlcnMgPSBbXVxyXG5cdHZhciBsYXN0UmVkcmF3SWQgPSBudWxsXHJcblx0dmFyIGxhc3RSZWRyYXdDYWxsVGltZSA9IDBcclxuXHR2YXIgY29tcHV0ZVByZVJlZHJhd0hvb2sgPSBudWxsXHJcblx0dmFyIGNvbXB1dGVQb3N0UmVkcmF3SG9vayA9IG51bGxcclxuXHR2YXIgdG9wQ29tcG9uZW50XHJcblx0dmFyIEZSQU1FX0JVREdFVCA9IDE2IC8vIDYwIGZyYW1lcyBwZXIgc2Vjb25kID0gMSBjYWxsIHBlciAxNiBtc1xyXG5cclxuXHRmdW5jdGlvbiBwYXJhbWV0ZXJpemUoY29tcG9uZW50LCBhcmdzKSB7XHJcblx0XHRmdW5jdGlvbiBjb250cm9sbGVyKCkge1xyXG5cdFx0XHQvKiBlc2xpbnQtZGlzYWJsZSBuby1pbnZhbGlkLXRoaXMgKi9cclxuXHRcdFx0cmV0dXJuIChjb21wb25lbnQuY29udHJvbGxlciB8fCBub29wKS5hcHBseSh0aGlzLCBhcmdzKSB8fCB0aGlzXHJcblx0XHRcdC8qIGVzbGludC1lbmFibGUgbm8taW52YWxpZC10aGlzICovXHJcblx0XHR9XHJcblxyXG5cdFx0aWYgKGNvbXBvbmVudC5jb250cm9sbGVyKSB7XHJcblx0XHRcdGNvbnRyb2xsZXIucHJvdG90eXBlID0gY29tcG9uZW50LmNvbnRyb2xsZXIucHJvdG90eXBlXHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gdmlldyhjdHJsKSB7XHJcblx0XHRcdHZhciBjdXJyZW50QXJncyA9IFtjdHJsXS5jb25jYXQoYXJncylcclxuXHRcdFx0Zm9yICh2YXIgaSA9IDE7IGkgPCBhcmd1bWVudHMubGVuZ3RoOyBpKyspIHtcclxuXHRcdFx0XHRjdXJyZW50QXJncy5wdXNoKGFyZ3VtZW50c1tpXSlcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIGNvbXBvbmVudC52aWV3LmFwcGx5KGNvbXBvbmVudCwgY3VycmVudEFyZ3MpXHJcblx0XHR9XHJcblxyXG5cdFx0dmlldy4kb3JpZ2luYWwgPSBjb21wb25lbnQudmlld1xyXG5cdFx0dmFyIG91dHB1dCA9IHtjb250cm9sbGVyOiBjb250cm9sbGVyLCB2aWV3OiB2aWV3fVxyXG5cdFx0aWYgKGFyZ3NbMF0gJiYgYXJnc1swXS5rZXkgIT0gbnVsbCkgb3V0cHV0LmF0dHJzID0ge2tleTogYXJnc1swXS5rZXl9XHJcblx0XHRyZXR1cm4gb3V0cHV0XHJcblx0fVxyXG5cclxuXHRtLmNvbXBvbmVudCA9IGZ1bmN0aW9uIChjb21wb25lbnQpIHtcclxuXHRcdHZhciBhcmdzID0gbmV3IEFycmF5KGFyZ3VtZW50cy5sZW5ndGggLSAxKVxyXG5cclxuXHRcdGZvciAodmFyIGkgPSAxOyBpIDwgYXJndW1lbnRzLmxlbmd0aDsgaSsrKSB7XHJcblx0XHRcdGFyZ3NbaSAtIDFdID0gYXJndW1lbnRzW2ldXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHBhcmFtZXRlcml6ZShjb21wb25lbnQsIGFyZ3MpXHJcblx0fVxyXG5cclxuXHR2YXIgY3VycmVudFJvdXRlLCBwcmV2aW91c1JvdXRlXHJcblxyXG5cdGZ1bmN0aW9uIGNoZWNrUHJldmVudGVkKGNvbXBvbmVudCwgcm9vdCwgaW5kZXgsIGlzUHJldmVudGVkKSB7XHJcblx0XHRpZiAoIWlzUHJldmVudGVkKSB7XHJcblx0XHRcdG0ucmVkcmF3LnN0cmF0ZWd5KFwiYWxsXCIpXHJcblx0XHRcdG0uc3RhcnRDb21wdXRhdGlvbigpXHJcblx0XHRcdHJvb3RzW2luZGV4XSA9IHJvb3RcclxuXHRcdFx0dmFyIGN1cnJlbnRDb21wb25lbnRcclxuXHJcblx0XHRcdGlmIChjb21wb25lbnQpIHtcclxuXHRcdFx0XHRjdXJyZW50Q29tcG9uZW50ID0gdG9wQ29tcG9uZW50ID0gY29tcG9uZW50XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0Y3VycmVudENvbXBvbmVudCA9IHRvcENvbXBvbmVudCA9IGNvbXBvbmVudCA9IHtjb250cm9sbGVyOiBub29wfVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR2YXIgY29udHJvbGxlciA9IG5ldyAoY29tcG9uZW50LmNvbnRyb2xsZXIgfHwgbm9vcCkoKVxyXG5cclxuXHRcdFx0Ly8gY29udHJvbGxlcnMgbWF5IGNhbGwgbS5tb3VudCByZWN1cnNpdmVseSAodmlhIG0ucm91dGUgcmVkaXJlY3RzLFxyXG5cdFx0XHQvLyBmb3IgZXhhbXBsZSlcclxuXHRcdFx0Ly8gdGhpcyBjb25kaXRpb25hbCBlbnN1cmVzIG9ubHkgdGhlIGxhc3QgcmVjdXJzaXZlIG0ubW91bnQgY2FsbCBpc1xyXG5cdFx0XHQvLyBhcHBsaWVkXHJcblx0XHRcdGlmIChjdXJyZW50Q29tcG9uZW50ID09PSB0b3BDb21wb25lbnQpIHtcclxuXHRcdFx0XHRjb250cm9sbGVyc1tpbmRleF0gPSBjb250cm9sbGVyXHJcblx0XHRcdFx0Y29tcG9uZW50c1tpbmRleF0gPSBjb21wb25lbnRcclxuXHRcdFx0fVxyXG5cdFx0XHRlbmRGaXJzdENvbXB1dGF0aW9uKClcclxuXHRcdFx0aWYgKGNvbXBvbmVudCA9PT0gbnVsbCkge1xyXG5cdFx0XHRcdHJlbW92ZVJvb3RFbGVtZW50KHJvb3QsIGluZGV4KVxyXG5cdFx0XHR9XHJcblx0XHRcdHJldHVybiBjb250cm9sbGVyc1tpbmRleF1cclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGlmIChjb21wb25lbnQgPT0gbnVsbCkge1xyXG5cdFx0XHRcdHJlbW92ZVJvb3RFbGVtZW50KHJvb3QsIGluZGV4KVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRpZiAocHJldmlvdXNSb3V0ZSkge1xyXG5cdFx0XHRcdGN1cnJlbnRSb3V0ZSA9IHByZXZpb3VzUm91dGVcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0bS5tb3VudCA9IG0ubW9kdWxlID0gZnVuY3Rpb24gKHJvb3QsIGNvbXBvbmVudCkge1xyXG5cdFx0aWYgKCFyb290KSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIkVuc3VyZSB0aGUgRE9NIGVsZW1lbnQgYmVpbmcgcGFzc2VkIHRvIFwiICtcclxuXHRcdFx0XHRcIm0ucm91dGUvbS5tb3VudC9tLnJlbmRlciBpcyBub3QgdW5kZWZpbmVkLlwiKVxyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBpbmRleCA9IHJvb3RzLmluZGV4T2Yocm9vdClcclxuXHRcdGlmIChpbmRleCA8IDApIGluZGV4ID0gcm9vdHMubGVuZ3RoXHJcblxyXG5cdFx0dmFyIGlzUHJldmVudGVkID0gZmFsc2VcclxuXHRcdHZhciBldmVudCA9IHtcclxuXHRcdFx0cHJldmVudERlZmF1bHQ6IGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRpc1ByZXZlbnRlZCA9IHRydWVcclxuXHRcdFx0XHRjb21wdXRlUHJlUmVkcmF3SG9vayA9IGNvbXB1dGVQb3N0UmVkcmF3SG9vayA9IG51bGxcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGZvckVhY2godW5sb2FkZXJzLCBmdW5jdGlvbiAodW5sb2FkZXIpIHtcclxuXHRcdFx0dW5sb2FkZXIuaGFuZGxlci5jYWxsKHVubG9hZGVyLmNvbnRyb2xsZXIsIGV2ZW50KVxyXG5cdFx0XHR1bmxvYWRlci5jb250cm9sbGVyLm9udW5sb2FkID0gbnVsbFxyXG5cdFx0fSlcclxuXHJcblx0XHRpZiAoaXNQcmV2ZW50ZWQpIHtcclxuXHRcdFx0Zm9yRWFjaCh1bmxvYWRlcnMsIGZ1bmN0aW9uICh1bmxvYWRlcikge1xyXG5cdFx0XHRcdHVubG9hZGVyLmNvbnRyb2xsZXIub251bmxvYWQgPSB1bmxvYWRlci5oYW5kbGVyXHJcblx0XHRcdH0pXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHR1bmxvYWRlcnMgPSBbXVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChjb250cm9sbGVyc1tpbmRleF0gJiYgaXNGdW5jdGlvbihjb250cm9sbGVyc1tpbmRleF0ub251bmxvYWQpKSB7XHJcblx0XHRcdGNvbnRyb2xsZXJzW2luZGV4XS5vbnVubG9hZChldmVudClcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gY2hlY2tQcmV2ZW50ZWQoY29tcG9uZW50LCByb290LCBpbmRleCwgaXNQcmV2ZW50ZWQpXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiByZW1vdmVSb290RWxlbWVudChyb290LCBpbmRleCkge1xyXG5cdFx0cm9vdHMuc3BsaWNlKGluZGV4LCAxKVxyXG5cdFx0Y29udHJvbGxlcnMuc3BsaWNlKGluZGV4LCAxKVxyXG5cdFx0Y29tcG9uZW50cy5zcGxpY2UoaW5kZXgsIDEpXHJcblx0XHRyZXNldChyb290KVxyXG5cdFx0bm9kZUNhY2hlLnNwbGljZShnZXRDZWxsQ2FjaGVLZXkocm9vdCksIDEpXHJcblx0XHR1bmxvYWRlcnMgPSBbXVxyXG5cdH1cclxuXHJcblx0dmFyIHJlZHJhd2luZyA9IGZhbHNlXHJcblx0bS5yZWRyYXcgPSBmdW5jdGlvbiAoZm9yY2UpIHtcclxuXHRcdGlmIChyZWRyYXdpbmcpIHJldHVyblxyXG5cdFx0cmVkcmF3aW5nID0gdHJ1ZVxyXG5cdFx0aWYgKGZvcmNlKSBmb3JjaW5nID0gdHJ1ZVxyXG5cclxuXHRcdHRyeSB7XHJcblx0XHRcdC8vIGxhc3RSZWRyYXdJZCBpcyBhIHBvc2l0aXZlIG51bWJlciBpZiBhIHNlY29uZCByZWRyYXcgaXMgcmVxdWVzdGVkXHJcblx0XHRcdC8vIGJlZm9yZSB0aGUgbmV4dCBhbmltYXRpb24gZnJhbWVcclxuXHRcdFx0Ly8gbGFzdFJlZHJhd0lkIGlzIG51bGwgaWYgaXQncyB0aGUgZmlyc3QgcmVkcmF3IGFuZCBub3QgYW4gZXZlbnRcclxuXHRcdFx0Ly8gaGFuZGxlclxyXG5cdFx0XHRpZiAobGFzdFJlZHJhd0lkICYmICFmb3JjZSkge1xyXG5cdFx0XHRcdC8vIHdoZW4gc2V0VGltZW91dDogb25seSByZXNjaGVkdWxlIHJlZHJhdyBpZiB0aW1lIGJldHdlZW4gbm93XHJcblx0XHRcdFx0Ly8gYW5kIHByZXZpb3VzIHJlZHJhdyBpcyBiaWdnZXIgdGhhbiBhIGZyYW1lLCBvdGhlcndpc2Uga2VlcFxyXG5cdFx0XHRcdC8vIGN1cnJlbnRseSBzY2hlZHVsZWQgdGltZW91dFxyXG5cdFx0XHRcdC8vIHdoZW4gckFGOiBhbHdheXMgcmVzY2hlZHVsZSByZWRyYXdcclxuXHRcdFx0XHRpZiAoJHJlcXVlc3RBbmltYXRpb25GcmFtZSA9PT0gZ2xvYmFsLnJlcXVlc3RBbmltYXRpb25GcmFtZSB8fFxyXG5cdFx0XHRcdFx0XHRuZXcgRGF0ZSgpIC0gbGFzdFJlZHJhd0NhbGxUaW1lID4gRlJBTUVfQlVER0VUKSB7XHJcblx0XHRcdFx0XHRpZiAobGFzdFJlZHJhd0lkID4gMCkgJGNhbmNlbEFuaW1hdGlvbkZyYW1lKGxhc3RSZWRyYXdJZClcclxuXHRcdFx0XHRcdGxhc3RSZWRyYXdJZCA9ICRyZXF1ZXN0QW5pbWF0aW9uRnJhbWUocmVkcmF3LCBGUkFNRV9CVURHRVQpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHJlZHJhdygpXHJcblx0XHRcdFx0bGFzdFJlZHJhd0lkID0gJHJlcXVlc3RBbmltYXRpb25GcmFtZShmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRsYXN0UmVkcmF3SWQgPSBudWxsXHJcblx0XHRcdFx0fSwgRlJBTUVfQlVER0VUKVxyXG5cdFx0XHR9XHJcblx0XHR9IGZpbmFsbHkge1xyXG5cdFx0XHRyZWRyYXdpbmcgPSBmb3JjaW5nID0gZmFsc2VcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdG0ucmVkcmF3LnN0cmF0ZWd5ID0gbS5wcm9wKClcclxuXHRmdW5jdGlvbiByZWRyYXcoKSB7XHJcblx0XHRpZiAoY29tcHV0ZVByZVJlZHJhd0hvb2spIHtcclxuXHRcdFx0Y29tcHV0ZVByZVJlZHJhd0hvb2soKVxyXG5cdFx0XHRjb21wdXRlUHJlUmVkcmF3SG9vayA9IG51bGxcclxuXHRcdH1cclxuXHRcdGZvckVhY2gocm9vdHMsIGZ1bmN0aW9uIChyb290LCBpKSB7XHJcblx0XHRcdHZhciBjb21wb25lbnQgPSBjb21wb25lbnRzW2ldXHJcblx0XHRcdGlmIChjb250cm9sbGVyc1tpXSkge1xyXG5cdFx0XHRcdHZhciBhcmdzID0gW2NvbnRyb2xsZXJzW2ldXVxyXG5cdFx0XHRcdG0ucmVuZGVyKHJvb3QsXHJcblx0XHRcdFx0XHRjb21wb25lbnQudmlldyA/IGNvbXBvbmVudC52aWV3KGNvbnRyb2xsZXJzW2ldLCBhcmdzKSA6IFwiXCIpXHJcblx0XHRcdH1cclxuXHRcdH0pXHJcblx0XHQvLyBhZnRlciByZW5kZXJpbmcgd2l0aGluIGEgcm91dGVkIGNvbnRleHQsIHdlIG5lZWQgdG8gc2Nyb2xsIGJhY2sgdG9cclxuXHRcdC8vIHRoZSB0b3AsIGFuZCBmZXRjaCB0aGUgZG9jdW1lbnQgdGl0bGUgZm9yIGhpc3RvcnkucHVzaFN0YXRlXHJcblx0XHRpZiAoY29tcHV0ZVBvc3RSZWRyYXdIb29rKSB7XHJcblx0XHRcdGNvbXB1dGVQb3N0UmVkcmF3SG9vaygpXHJcblx0XHRcdGNvbXB1dGVQb3N0UmVkcmF3SG9vayA9IG51bGxcclxuXHRcdH1cclxuXHRcdGxhc3RSZWRyYXdJZCA9IG51bGxcclxuXHRcdGxhc3RSZWRyYXdDYWxsVGltZSA9IG5ldyBEYXRlKClcclxuXHRcdG0ucmVkcmF3LnN0cmF0ZWd5KFwiZGlmZlwiKVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gZW5kRmlyc3RDb21wdXRhdGlvbigpIHtcclxuXHRcdGlmIChtLnJlZHJhdy5zdHJhdGVneSgpID09PSBcIm5vbmVcIikge1xyXG5cdFx0XHRwZW5kaW5nUmVxdWVzdHMtLVxyXG5cdFx0XHRtLnJlZHJhdy5zdHJhdGVneShcImRpZmZcIilcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdG0uZW5kQ29tcHV0YXRpb24oKVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0bS53aXRoQXR0ciA9IGZ1bmN0aW9uIChwcm9wLCB3aXRoQXR0ckNhbGxiYWNrLCBjYWxsYmFja1RoaXMpIHtcclxuXHRcdHJldHVybiBmdW5jdGlvbiAoZSkge1xyXG5cdFx0XHRlID0gZSB8fCB3aW5kb3cuZXZlbnRcclxuXHRcdFx0LyogZXNsaW50LWRpc2FibGUgbm8taW52YWxpZC10aGlzICovXHJcblx0XHRcdHZhciBjdXJyZW50VGFyZ2V0ID0gZS5jdXJyZW50VGFyZ2V0IHx8IHRoaXNcclxuXHRcdFx0dmFyIF90aGlzID0gY2FsbGJhY2tUaGlzIHx8IHRoaXNcclxuXHRcdFx0LyogZXNsaW50LWVuYWJsZSBuby1pbnZhbGlkLXRoaXMgKi9cclxuXHRcdFx0dmFyIHRhcmdldCA9IHByb3AgaW4gY3VycmVudFRhcmdldCA/XHJcblx0XHRcdFx0Y3VycmVudFRhcmdldFtwcm9wXSA6XHJcblx0XHRcdFx0Y3VycmVudFRhcmdldC5nZXRBdHRyaWJ1dGUocHJvcClcclxuXHRcdFx0d2l0aEF0dHJDYWxsYmFjay5jYWxsKF90aGlzLCB0YXJnZXQpXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHQvLyByb3V0aW5nXHJcblx0dmFyIG1vZGVzID0ge3BhdGhuYW1lOiBcIlwiLCBoYXNoOiBcIiNcIiwgc2VhcmNoOiBcIj9cIn1cclxuXHR2YXIgcmVkaXJlY3QgPSBub29wXHJcblx0dmFyIGlzRGVmYXVsdFJvdXRlID0gZmFsc2VcclxuXHR2YXIgcm91dGVQYXJhbXNcclxuXHJcblx0bS5yb3V0ZSA9IGZ1bmN0aW9uIChyb290LCBhcmcxLCBhcmcyLCB2ZG9tKSB7IC8vIGVzbGludC1kaXNhYmxlLWxpbmVcclxuXHRcdC8vIG0ucm91dGUoKVxyXG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDApIHJldHVybiBjdXJyZW50Um91dGVcclxuXHRcdC8vIG0ucm91dGUoZWwsIGRlZmF1bHRSb3V0ZSwgcm91dGVzKVxyXG5cdFx0aWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDMgJiYgaXNTdHJpbmcoYXJnMSkpIHtcclxuXHRcdFx0cmVkaXJlY3QgPSBmdW5jdGlvbiAoc291cmNlKSB7XHJcblx0XHRcdFx0dmFyIHBhdGggPSBjdXJyZW50Um91dGUgPSBub3JtYWxpemVSb3V0ZShzb3VyY2UpXHJcblx0XHRcdFx0aWYgKCFyb3V0ZUJ5VmFsdWUocm9vdCwgYXJnMiwgcGF0aCkpIHtcclxuXHRcdFx0XHRcdGlmIChpc0RlZmF1bHRSb3V0ZSkge1xyXG5cdFx0XHRcdFx0XHR0aHJvdyBuZXcgRXJyb3IoXCJFbnN1cmUgdGhlIGRlZmF1bHQgcm91dGUgbWF0Y2hlcyBcIiArXHJcblx0XHRcdFx0XHRcdFx0XCJvbmUgb2YgdGhlIHJvdXRlcyBkZWZpbmVkIGluIG0ucm91dGVcIilcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRpc0RlZmF1bHRSb3V0ZSA9IHRydWVcclxuXHRcdFx0XHRcdG0ucm91dGUoYXJnMSwgdHJ1ZSlcclxuXHRcdFx0XHRcdGlzRGVmYXVsdFJvdXRlID0gZmFsc2VcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHZhciBsaXN0ZW5lciA9IG0ucm91dGUubW9kZSA9PT0gXCJoYXNoXCIgP1xyXG5cdFx0XHRcdFwib25oYXNoY2hhbmdlXCIgOlxyXG5cdFx0XHRcdFwib25wb3BzdGF0ZVwiXHJcblxyXG5cdFx0XHRnbG9iYWxbbGlzdGVuZXJdID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdHZhciBwYXRoID0gJGxvY2F0aW9uW20ucm91dGUubW9kZV1cclxuXHRcdFx0XHRpZiAobS5yb3V0ZS5tb2RlID09PSBcInBhdGhuYW1lXCIpIHBhdGggKz0gJGxvY2F0aW9uLnNlYXJjaFxyXG5cdFx0XHRcdGlmIChjdXJyZW50Um91dGUgIT09IG5vcm1hbGl6ZVJvdXRlKHBhdGgpKSByZWRpcmVjdChwYXRoKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRjb21wdXRlUHJlUmVkcmF3SG9vayA9IHNldFNjcm9sbFxyXG5cdFx0XHRnbG9iYWxbbGlzdGVuZXJdKClcclxuXHJcblx0XHRcdHJldHVyblxyXG5cdFx0fVxyXG5cclxuXHRcdC8vIGNvbmZpZzogbS5yb3V0ZVxyXG5cdFx0aWYgKHJvb3QuYWRkRXZlbnRMaXN0ZW5lciB8fCByb290LmF0dGFjaEV2ZW50KSB7XHJcblx0XHRcdHZhciBiYXNlID0gbS5yb3V0ZS5tb2RlICE9PSBcInBhdGhuYW1lXCIgPyAkbG9jYXRpb24ucGF0aG5hbWUgOiBcIlwiXHJcblx0XHRcdHJvb3QuaHJlZiA9IGJhc2UgKyBtb2Rlc1ttLnJvdXRlLm1vZGVdICsgdmRvbS5hdHRycy5ocmVmXHJcblx0XHRcdGlmIChyb290LmFkZEV2ZW50TGlzdGVuZXIpIHtcclxuXHRcdFx0XHRyb290LnJlbW92ZUV2ZW50TGlzdGVuZXIoXCJjbGlja1wiLCByb3V0ZVVub2J0cnVzaXZlKVxyXG5cdFx0XHRcdHJvb3QuYWRkRXZlbnRMaXN0ZW5lcihcImNsaWNrXCIsIHJvdXRlVW5vYnRydXNpdmUpXHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0cm9vdC5kZXRhY2hFdmVudChcIm9uY2xpY2tcIiwgcm91dGVVbm9idHJ1c2l2ZSlcclxuXHRcdFx0XHRyb290LmF0dGFjaEV2ZW50KFwib25jbGlja1wiLCByb3V0ZVVub2J0cnVzaXZlKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRyZXR1cm5cclxuXHRcdH1cclxuXHRcdC8vIG0ucm91dGUocm91dGUsIHBhcmFtcywgc2hvdWxkUmVwbGFjZUhpc3RvcnlFbnRyeSlcclxuXHRcdGlmIChpc1N0cmluZyhyb290KSkge1xyXG5cdFx0XHRwcmV2aW91c1JvdXRlID0gY3VycmVudFJvdXRlXHJcblx0XHRcdGN1cnJlbnRSb3V0ZSA9IHJvb3RcclxuXHJcblx0XHRcdHZhciBhcmdzID0gYXJnMSB8fCB7fVxyXG5cdFx0XHR2YXIgcXVlcnlJbmRleCA9IGN1cnJlbnRSb3V0ZS5pbmRleE9mKFwiP1wiKVxyXG5cdFx0XHR2YXIgcGFyYW1zXHJcblxyXG5cdFx0XHRpZiAocXVlcnlJbmRleCA+IC0xKSB7XHJcblx0XHRcdFx0cGFyYW1zID0gcGFyc2VRdWVyeVN0cmluZyhjdXJyZW50Um91dGUuc2xpY2UocXVlcnlJbmRleCArIDEpKVxyXG5cdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdHBhcmFtcyA9IHt9XHJcblx0XHRcdH1cclxuXHJcblx0XHRcdGZvciAodmFyIGkgaW4gYXJncykge1xyXG5cdFx0XHRcdGlmIChoYXNPd24uY2FsbChhcmdzLCBpKSkge1xyXG5cdFx0XHRcdFx0cGFyYW1zW2ldID0gYXJnc1tpXVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dmFyIHF1ZXJ5c3RyaW5nID0gYnVpbGRRdWVyeVN0cmluZyhwYXJhbXMpXHJcblx0XHRcdHZhciBjdXJyZW50UGF0aFxyXG5cclxuXHRcdFx0aWYgKHF1ZXJ5SW5kZXggPiAtMSkge1xyXG5cdFx0XHRcdGN1cnJlbnRQYXRoID0gY3VycmVudFJvdXRlLnNsaWNlKDAsIHF1ZXJ5SW5kZXgpXHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0Y3VycmVudFBhdGggPSBjdXJyZW50Um91dGVcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKHF1ZXJ5c3RyaW5nKSB7XHJcblx0XHRcdFx0Y3VycmVudFJvdXRlID0gY3VycmVudFBhdGggK1xyXG5cdFx0XHRcdFx0KGN1cnJlbnRQYXRoLmluZGV4T2YoXCI/XCIpID09PSAtMSA/IFwiP1wiIDogXCImXCIpICtcclxuXHRcdFx0XHRcdHF1ZXJ5c3RyaW5nXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHZhciByZXBsYWNlSGlzdG9yeSA9XHJcblx0XHRcdFx0KGFyZ3VtZW50cy5sZW5ndGggPT09IDMgPyBhcmcyIDogYXJnMSkgPT09IHRydWUgfHxcclxuXHRcdFx0XHRwcmV2aW91c1JvdXRlID09PSBjdXJyZW50Um91dGVcclxuXHJcblx0XHRcdGlmIChnbG9iYWwuaGlzdG9yeS5wdXNoU3RhdGUpIHtcclxuXHRcdFx0XHR2YXIgbWV0aG9kID0gcmVwbGFjZUhpc3RvcnkgPyBcInJlcGxhY2VTdGF0ZVwiIDogXCJwdXNoU3RhdGVcIlxyXG5cdFx0XHRcdGNvbXB1dGVQcmVSZWRyYXdIb29rID0gc2V0U2Nyb2xsXHJcblx0XHRcdFx0Y29tcHV0ZVBvc3RSZWRyYXdIb29rID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdFx0Z2xvYmFsLmhpc3RvcnlbbWV0aG9kXShudWxsLCAkZG9jdW1lbnQudGl0bGUsXHJcblx0XHRcdFx0XHRcdFx0bW9kZXNbbS5yb3V0ZS5tb2RlXSArIGN1cnJlbnRSb3V0ZSlcclxuXHRcdFx0XHRcdH0gY2F0Y2ggKGVycikge1xyXG5cdFx0XHRcdFx0XHQvLyBJbiB0aGUgZXZlbnQgb2YgYSBwdXNoU3RhdGUgb3IgcmVwbGFjZVN0YXRlIGZhaWx1cmUsXHJcblx0XHRcdFx0XHRcdC8vIGZhbGxiYWNrIHRvIGEgc3RhbmRhcmQgcmVkaXJlY3QuIFRoaXMgaXMgc3BlY2lmaWNhbGx5XHJcblx0XHRcdFx0XHRcdC8vIHRvIGFkZHJlc3MgYSBTYWZhcmkgc2VjdXJpdHkgZXJyb3Igd2hlbiBhdHRlbXB0aW5nIHRvXHJcblx0XHRcdFx0XHRcdC8vIGNhbGwgcHVzaFN0YXRlIG1vcmUgdGhhbiAxMDAgdGltZXMuXHJcblx0XHRcdFx0XHRcdCRsb2NhdGlvblttLnJvdXRlLm1vZGVdID0gY3VycmVudFJvdXRlXHJcblx0XHRcdFx0XHR9XHJcblx0XHRcdFx0fVxyXG5cdFx0XHRcdHJlZGlyZWN0KG1vZGVzW20ucm91dGUubW9kZV0gKyBjdXJyZW50Um91dGUpXHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0JGxvY2F0aW9uW20ucm91dGUubW9kZV0gPSBjdXJyZW50Um91dGVcclxuXHRcdFx0XHRyZWRpcmVjdChtb2Rlc1ttLnJvdXRlLm1vZGVdICsgY3VycmVudFJvdXRlKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHRwcmV2aW91c1JvdXRlID0gbnVsbFxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0bS5yb3V0ZS5wYXJhbSA9IGZ1bmN0aW9uIChrZXkpIHtcclxuXHRcdGlmICghcm91dGVQYXJhbXMpIHtcclxuXHRcdFx0dGhyb3cgbmV3IEVycm9yKFwiWW91IG11c3QgY2FsbCBtLnJvdXRlKGVsZW1lbnQsIGRlZmF1bHRSb3V0ZSwgXCIgK1xyXG5cdFx0XHRcdFwicm91dGVzKSBiZWZvcmUgY2FsbGluZyBtLnJvdXRlLnBhcmFtKClcIilcclxuXHRcdH1cclxuXHJcblx0XHRpZiAoIWtleSkge1xyXG5cdFx0XHRyZXR1cm4gcm91dGVQYXJhbXNcclxuXHRcdH1cclxuXHJcblx0XHRyZXR1cm4gcm91dGVQYXJhbXNba2V5XVxyXG5cdH1cclxuXHJcblx0bS5yb3V0ZS5tb2RlID0gXCJzZWFyY2hcIlxyXG5cclxuXHRmdW5jdGlvbiBub3JtYWxpemVSb3V0ZShyb3V0ZSkge1xyXG5cdFx0cmV0dXJuIHJvdXRlLnNsaWNlKG1vZGVzW20ucm91dGUubW9kZV0ubGVuZ3RoKVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gcm91dGVCeVZhbHVlKHJvb3QsIHJvdXRlciwgcGF0aCkge1xyXG5cdFx0cm91dGVQYXJhbXMgPSB7fVxyXG5cclxuXHRcdHZhciBxdWVyeVN0YXJ0ID0gcGF0aC5pbmRleE9mKFwiP1wiKVxyXG5cdFx0aWYgKHF1ZXJ5U3RhcnQgIT09IC0xKSB7XHJcblx0XHRcdHJvdXRlUGFyYW1zID0gcGFyc2VRdWVyeVN0cmluZyhcclxuXHRcdFx0XHRwYXRoLnN1YnN0cihxdWVyeVN0YXJ0ICsgMSwgcGF0aC5sZW5ndGgpKVxyXG5cdFx0XHRwYXRoID0gcGF0aC5zdWJzdHIoMCwgcXVlcnlTdGFydClcclxuXHRcdH1cclxuXHJcblx0XHQvLyBHZXQgYWxsIHJvdXRlcyBhbmQgY2hlY2sgaWYgdGhlcmUnc1xyXG5cdFx0Ly8gYW4gZXhhY3QgbWF0Y2ggZm9yIHRoZSBjdXJyZW50IHBhdGhcclxuXHRcdHZhciBrZXlzID0gT2JqZWN0LmtleXMocm91dGVyKVxyXG5cdFx0dmFyIGluZGV4ID0ga2V5cy5pbmRleE9mKHBhdGgpXHJcblxyXG5cdFx0aWYgKGluZGV4ICE9PSAtMSl7XHJcblx0XHRcdG0ubW91bnQocm9vdCwgcm91dGVyW2tleXMgW2luZGV4XV0pXHJcblx0XHRcdHJldHVybiB0cnVlXHJcblx0XHR9XHJcblxyXG5cdFx0Zm9yICh2YXIgcm91dGUgaW4gcm91dGVyKSB7XHJcblx0XHRcdGlmIChoYXNPd24uY2FsbChyb3V0ZXIsIHJvdXRlKSkge1xyXG5cdFx0XHRcdGlmIChyb3V0ZSA9PT0gcGF0aCkge1xyXG5cdFx0XHRcdFx0bS5tb3VudChyb290LCByb3V0ZXJbcm91dGVdKVxyXG5cdFx0XHRcdFx0cmV0dXJuIHRydWVcclxuXHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdHZhciBtYXRjaGVyID0gbmV3IFJlZ0V4cChcIl5cIiArIHJvdXRlXHJcblx0XHRcdFx0XHQucmVwbGFjZSgvOlteXFwvXSs/XFwuezN9L2csIFwiKC4qPylcIilcclxuXHRcdFx0XHRcdC5yZXBsYWNlKC86W15cXC9dKy9nLCBcIihbXlxcXFwvXSspXCIpICsgXCJcXC8/JFwiKVxyXG5cclxuXHRcdFx0XHRpZiAobWF0Y2hlci50ZXN0KHBhdGgpKSB7XHJcblx0XHRcdFx0XHQvKiBlc2xpbnQtZGlzYWJsZSBuby1sb29wLWZ1bmMgKi9cclxuXHRcdFx0XHRcdHBhdGgucmVwbGFjZShtYXRjaGVyLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdHZhciBrZXlzID0gcm91dGUubWF0Y2goLzpbXlxcL10rL2cpIHx8IFtdXHJcblx0XHRcdFx0XHRcdHZhciB2YWx1ZXMgPSBbXS5zbGljZS5jYWxsKGFyZ3VtZW50cywgMSwgLTIpXHJcblx0XHRcdFx0XHRcdGZvckVhY2goa2V5cywgZnVuY3Rpb24gKGtleSwgaSkge1xyXG5cdFx0XHRcdFx0XHRcdHJvdXRlUGFyYW1zW2tleS5yZXBsYWNlKC86fFxcLi9nLCBcIlwiKV0gPVxyXG5cdFx0XHRcdFx0XHRcdFx0ZGVjb2RlVVJJQ29tcG9uZW50KHZhbHVlc1tpXSlcclxuXHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdFx0bS5tb3VudChyb290LCByb3V0ZXJbcm91dGVdKVxyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdC8qIGVzbGludC1lbmFibGUgbm8tbG9vcC1mdW5jICovXHJcblx0XHRcdFx0XHRyZXR1cm4gdHJ1ZVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gcm91dGVVbm9idHJ1c2l2ZShlKSB7XHJcblx0XHRlID0gZSB8fCBldmVudFxyXG5cdFx0aWYgKGUuY3RybEtleSB8fCBlLm1ldGFLZXkgfHwgZS5zaGlmdEtleSB8fCBlLndoaWNoID09PSAyKSByZXR1cm5cclxuXHJcblx0XHRpZiAoZS5wcmV2ZW50RGVmYXVsdCkge1xyXG5cdFx0XHRlLnByZXZlbnREZWZhdWx0KClcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGUucmV0dXJuVmFsdWUgPSBmYWxzZVxyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBjdXJyZW50VGFyZ2V0ID0gZS5jdXJyZW50VGFyZ2V0IHx8IGUuc3JjRWxlbWVudFxyXG5cdFx0dmFyIGFyZ3NcclxuXHJcblx0XHRpZiAobS5yb3V0ZS5tb2RlID09PSBcInBhdGhuYW1lXCIgJiYgY3VycmVudFRhcmdldC5zZWFyY2gpIHtcclxuXHRcdFx0YXJncyA9IHBhcnNlUXVlcnlTdHJpbmcoY3VycmVudFRhcmdldC5zZWFyY2guc2xpY2UoMSkpXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRhcmdzID0ge31cclxuXHRcdH1cclxuXHJcblx0XHR3aGlsZSAoY3VycmVudFRhcmdldCAmJiAhL2EvaS50ZXN0KGN1cnJlbnRUYXJnZXQubm9kZU5hbWUpKSB7XHJcblx0XHRcdGN1cnJlbnRUYXJnZXQgPSBjdXJyZW50VGFyZ2V0LnBhcmVudE5vZGVcclxuXHRcdH1cclxuXHJcblx0XHQvLyBjbGVhciBwZW5kaW5nUmVxdWVzdHMgYmVjYXVzZSB3ZSB3YW50IGFuIGltbWVkaWF0ZSByb3V0ZSBjaGFuZ2VcclxuXHRcdHBlbmRpbmdSZXF1ZXN0cyA9IDBcclxuXHRcdG0ucm91dGUoY3VycmVudFRhcmdldFttLnJvdXRlLm1vZGVdXHJcblx0XHRcdC5zbGljZShtb2Rlc1ttLnJvdXRlLm1vZGVdLmxlbmd0aCksIGFyZ3MpXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBzZXRTY3JvbGwoKSB7XHJcblx0XHRpZiAobS5yb3V0ZS5tb2RlICE9PSBcImhhc2hcIiAmJiAkbG9jYXRpb24uaGFzaCkge1xyXG5cdFx0XHQkbG9jYXRpb24uaGFzaCA9ICRsb2NhdGlvbi5oYXNoXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRnbG9iYWwuc2Nyb2xsVG8oMCwgMClcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGJ1aWxkUXVlcnlTdHJpbmcob2JqZWN0LCBwcmVmaXgpIHtcclxuXHRcdHZhciBkdXBsaWNhdGVzID0ge31cclxuXHRcdHZhciBzdHIgPSBbXVxyXG5cclxuXHRcdGZvciAodmFyIHByb3AgaW4gb2JqZWN0KSB7XHJcblx0XHRcdGlmIChoYXNPd24uY2FsbChvYmplY3QsIHByb3ApKSB7XHJcblx0XHRcdFx0dmFyIGtleSA9IHByZWZpeCA/IHByZWZpeCArIFwiW1wiICsgcHJvcCArIFwiXVwiIDogcHJvcFxyXG5cdFx0XHRcdHZhciB2YWx1ZSA9IG9iamVjdFtwcm9wXVxyXG5cclxuXHRcdFx0XHRpZiAodmFsdWUgPT09IG51bGwpIHtcclxuXHRcdFx0XHRcdHN0ci5wdXNoKGVuY29kZVVSSUNvbXBvbmVudChrZXkpKVxyXG5cdFx0XHRcdH0gZWxzZSBpZiAoaXNPYmplY3QodmFsdWUpKSB7XHJcblx0XHRcdFx0XHRzdHIucHVzaChidWlsZFF1ZXJ5U3RyaW5nKHZhbHVlLCBrZXkpKVxyXG5cdFx0XHRcdH0gZWxzZSBpZiAoaXNBcnJheSh2YWx1ZSkpIHtcclxuXHRcdFx0XHRcdHZhciBrZXlzID0gW11cclxuXHRcdFx0XHRcdGR1cGxpY2F0ZXNba2V5XSA9IGR1cGxpY2F0ZXNba2V5XSB8fCB7fVxyXG5cdFx0XHRcdFx0LyogZXNsaW50LWRpc2FibGUgbm8tbG9vcC1mdW5jICovXHJcblx0XHRcdFx0XHRmb3JFYWNoKHZhbHVlLCBmdW5jdGlvbiAoaXRlbSkge1xyXG5cdFx0XHRcdFx0XHQvKiBlc2xpbnQtZW5hYmxlIG5vLWxvb3AtZnVuYyAqL1xyXG5cdFx0XHRcdFx0XHRpZiAoIWR1cGxpY2F0ZXNba2V5XVtpdGVtXSkge1xyXG5cdFx0XHRcdFx0XHRcdGR1cGxpY2F0ZXNba2V5XVtpdGVtXSA9IHRydWVcclxuXHRcdFx0XHRcdFx0XHRrZXlzLnB1c2goZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgKyBcIj1cIiArXHJcblx0XHRcdFx0XHRcdFx0XHRlbmNvZGVVUklDb21wb25lbnQoaXRlbSkpXHJcblx0XHRcdFx0XHRcdH1cclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0XHRzdHIucHVzaChrZXlzLmpvaW4oXCImXCIpKVxyXG5cdFx0XHRcdH0gZWxzZSBpZiAodmFsdWUgIT09IHVuZGVmaW5lZCkge1xyXG5cdFx0XHRcdFx0c3RyLnB1c2goZW5jb2RlVVJJQ29tcG9uZW50KGtleSkgKyBcIj1cIiArXHJcblx0XHRcdFx0XHRcdGVuY29kZVVSSUNvbXBvbmVudCh2YWx1ZSkpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9XHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIHN0ci5qb2luKFwiJlwiKVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gcGFyc2VRdWVyeVN0cmluZyhzdHIpIHtcclxuXHRcdGlmIChzdHIgPT09IFwiXCIgfHwgc3RyID09IG51bGwpIHJldHVybiB7fVxyXG5cdFx0aWYgKHN0ci5jaGFyQXQoMCkgPT09IFwiP1wiKSBzdHIgPSBzdHIuc2xpY2UoMSlcclxuXHJcblx0XHR2YXIgcGFpcnMgPSBzdHIuc3BsaXQoXCImXCIpXHJcblx0XHR2YXIgcGFyYW1zID0ge31cclxuXHJcblx0XHRmb3JFYWNoKHBhaXJzLCBmdW5jdGlvbiAoc3RyaW5nKSB7XHJcblx0XHRcdHZhciBwYWlyID0gc3RyaW5nLnNwbGl0KFwiPVwiKVxyXG5cdFx0XHR2YXIga2V5ID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhaXJbMF0pXHJcblx0XHRcdHZhciB2YWx1ZSA9IHBhaXIubGVuZ3RoID09PSAyID8gZGVjb2RlVVJJQ29tcG9uZW50KHBhaXJbMV0pIDogbnVsbFxyXG5cdFx0XHRpZiAocGFyYW1zW2tleV0gIT0gbnVsbCkge1xyXG5cdFx0XHRcdGlmICghaXNBcnJheShwYXJhbXNba2V5XSkpIHBhcmFtc1trZXldID0gW3BhcmFtc1trZXldXVxyXG5cdFx0XHRcdHBhcmFtc1trZXldLnB1c2godmFsdWUpXHJcblx0XHRcdH0gZWxzZSBwYXJhbXNba2V5XSA9IHZhbHVlXHJcblx0XHR9KVxyXG5cclxuXHRcdHJldHVybiBwYXJhbXNcclxuXHR9XHJcblxyXG5cdG0ucm91dGUuYnVpbGRRdWVyeVN0cmluZyA9IGJ1aWxkUXVlcnlTdHJpbmdcclxuXHRtLnJvdXRlLnBhcnNlUXVlcnlTdHJpbmcgPSBwYXJzZVF1ZXJ5U3RyaW5nXHJcblxyXG5cdGZ1bmN0aW9uIHJlc2V0KHJvb3QpIHtcclxuXHRcdHZhciBjYWNoZUtleSA9IGdldENlbGxDYWNoZUtleShyb290KVxyXG5cdFx0Y2xlYXIocm9vdC5jaGlsZE5vZGVzLCBjZWxsQ2FjaGVbY2FjaGVLZXldKVxyXG5cdFx0Y2VsbENhY2hlW2NhY2hlS2V5XSA9IHVuZGVmaW5lZFxyXG5cdH1cclxuXHJcblx0bS5kZWZlcnJlZCA9IGZ1bmN0aW9uICgpIHtcclxuXHRcdHZhciBkZWZlcnJlZCA9IG5ldyBEZWZlcnJlZCgpXHJcblx0XHRkZWZlcnJlZC5wcm9taXNlID0gcHJvcGlmeShkZWZlcnJlZC5wcm9taXNlKVxyXG5cdFx0cmV0dXJuIGRlZmVycmVkXHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBwcm9waWZ5KHByb21pc2UsIGluaXRpYWxWYWx1ZSkge1xyXG5cdFx0dmFyIHByb3AgPSBtLnByb3AoaW5pdGlhbFZhbHVlKVxyXG5cdFx0cHJvbWlzZS50aGVuKHByb3ApXHJcblx0XHRwcm9wLnRoZW4gPSBmdW5jdGlvbiAocmVzb2x2ZSwgcmVqZWN0KSB7XHJcblx0XHRcdHJldHVybiBwcm9waWZ5KHByb21pc2UudGhlbihyZXNvbHZlLCByZWplY3QpLCBpbml0aWFsVmFsdWUpXHJcblx0XHR9XHJcblxyXG5cdFx0cHJvcFtcImNhdGNoXCJdID0gcHJvcC50aGVuLmJpbmQobnVsbCwgbnVsbClcclxuXHRcdHJldHVybiBwcm9wXHJcblx0fVxyXG5cdC8vIFByb21pei5taXRocmlsLmpzIHwgWm9sbWVpc3RlciB8IE1JVFxyXG5cdC8vIGEgbW9kaWZpZWQgdmVyc2lvbiBvZiBQcm9taXouanMsIHdoaWNoIGRvZXMgbm90IGNvbmZvcm0gdG8gUHJvbWlzZXMvQStcclxuXHQvLyBmb3IgdHdvIHJlYXNvbnM6XHJcblx0Ly9cclxuXHQvLyAxKSBgdGhlbmAgY2FsbGJhY2tzIGFyZSBjYWxsZWQgc3luY2hyb25vdXNseSAoYmVjYXVzZSBzZXRUaW1lb3V0IGlzIHRvb1xyXG5cdC8vICAgIHNsb3csIGFuZCB0aGUgc2V0SW1tZWRpYXRlIHBvbHlmaWxsIGlzIHRvbyBiaWdcclxuXHQvL1xyXG5cdC8vIDIpIHRocm93aW5nIHN1YmNsYXNzZXMgb2YgRXJyb3IgY2F1c2UgdGhlIGVycm9yIHRvIGJlIGJ1YmJsZWQgdXAgaW5zdGVhZFxyXG5cdC8vICAgIG9mIHRyaWdnZXJpbmcgcmVqZWN0aW9uIChiZWNhdXNlIHRoZSBzcGVjIGRvZXMgbm90IGFjY291bnQgZm9yIHRoZVxyXG5cdC8vICAgIGltcG9ydGFudCB1c2UgY2FzZSBvZiBkZWZhdWx0IGJyb3dzZXIgZXJyb3IgaGFuZGxpbmcsIGkuZS4gbWVzc2FnZSB3L1xyXG5cdC8vICAgIGxpbmUgbnVtYmVyKVxyXG5cclxuXHR2YXIgUkVTT0xWSU5HID0gMVxyXG5cdHZhciBSRUpFQ1RJTkcgPSAyXHJcblx0dmFyIFJFU09MVkVEID0gM1xyXG5cdHZhciBSRUpFQ1RFRCA9IDRcclxuXHJcblx0ZnVuY3Rpb24gRGVmZXJyZWQob25TdWNjZXNzLCBvbkZhaWx1cmUpIHtcclxuXHRcdHZhciBzZWxmID0gdGhpc1xyXG5cdFx0dmFyIHN0YXRlID0gMFxyXG5cdFx0dmFyIHByb21pc2VWYWx1ZSA9IDBcclxuXHRcdHZhciBuZXh0ID0gW11cclxuXHJcblx0XHRzZWxmLnByb21pc2UgPSB7fVxyXG5cclxuXHRcdHNlbGYucmVzb2x2ZSA9IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG5cdFx0XHRpZiAoIXN0YXRlKSB7XHJcblx0XHRcdFx0cHJvbWlzZVZhbHVlID0gdmFsdWVcclxuXHRcdFx0XHRzdGF0ZSA9IFJFU09MVklOR1xyXG5cclxuXHRcdFx0XHRmaXJlKClcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIHNlbGZcclxuXHRcdH1cclxuXHJcblx0XHRzZWxmLnJlamVjdCA9IGZ1bmN0aW9uICh2YWx1ZSkge1xyXG5cdFx0XHRpZiAoIXN0YXRlKSB7XHJcblx0XHRcdFx0cHJvbWlzZVZhbHVlID0gdmFsdWVcclxuXHRcdFx0XHRzdGF0ZSA9IFJFSkVDVElOR1xyXG5cclxuXHRcdFx0XHRmaXJlKClcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0cmV0dXJuIHNlbGZcclxuXHRcdH1cclxuXHJcblx0XHRzZWxmLnByb21pc2UudGhlbiA9IGZ1bmN0aW9uIChvblN1Y2Nlc3MsIG9uRmFpbHVyZSkge1xyXG5cdFx0XHR2YXIgZGVmZXJyZWQgPSBuZXcgRGVmZXJyZWQob25TdWNjZXNzLCBvbkZhaWx1cmUpXHJcblxyXG5cdFx0XHRpZiAoc3RhdGUgPT09IFJFU09MVkVEKSB7XHJcblx0XHRcdFx0ZGVmZXJyZWQucmVzb2x2ZShwcm9taXNlVmFsdWUpXHJcblx0XHRcdH0gZWxzZSBpZiAoc3RhdGUgPT09IFJFSkVDVEVEKSB7XHJcblx0XHRcdFx0ZGVmZXJyZWQucmVqZWN0KHByb21pc2VWYWx1ZSlcclxuXHRcdFx0fSBlbHNlIHtcclxuXHRcdFx0XHRuZXh0LnB1c2goZGVmZXJyZWQpXHJcblx0XHRcdH1cclxuXHJcblx0XHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlXHJcblx0XHR9XHJcblxyXG5cdFx0ZnVuY3Rpb24gZmluaXNoKHR5cGUpIHtcclxuXHRcdFx0c3RhdGUgPSB0eXBlIHx8IFJFSkVDVEVEXHJcblx0XHRcdG5leHQubWFwKGZ1bmN0aW9uIChkZWZlcnJlZCkge1xyXG5cdFx0XHRcdGlmIChzdGF0ZSA9PT0gUkVTT0xWRUQpIHtcclxuXHRcdFx0XHRcdGRlZmVycmVkLnJlc29sdmUocHJvbWlzZVZhbHVlKVxyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRkZWZlcnJlZC5yZWplY3QocHJvbWlzZVZhbHVlKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHJcblx0XHRmdW5jdGlvbiB0aGVubmFibGUodGhlbiwgc3VjY2VzcywgZmFpbHVyZSwgbm90VGhlbm5hYmxlKSB7XHJcblx0XHRcdGlmICgoKHByb21pc2VWYWx1ZSAhPSBudWxsICYmIGlzT2JqZWN0KHByb21pc2VWYWx1ZSkpIHx8XHJcblx0XHRcdFx0XHRpc0Z1bmN0aW9uKHByb21pc2VWYWx1ZSkpICYmIGlzRnVuY3Rpb24odGhlbikpIHtcclxuXHRcdFx0XHR0cnkge1xyXG5cdFx0XHRcdFx0Ly8gY291bnQgcHJvdGVjdHMgYWdhaW5zdCBhYnVzZSBjYWxscyBmcm9tIHNwZWMgY2hlY2tlclxyXG5cdFx0XHRcdFx0dmFyIGNvdW50ID0gMFxyXG5cdFx0XHRcdFx0dGhlbi5jYWxsKHByb21pc2VWYWx1ZSwgZnVuY3Rpb24gKHZhbHVlKSB7XHJcblx0XHRcdFx0XHRcdGlmIChjb3VudCsrKSByZXR1cm5cclxuXHRcdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gdmFsdWVcclxuXHRcdFx0XHRcdFx0c3VjY2VzcygpXHJcblx0XHRcdFx0XHR9LCBmdW5jdGlvbiAodmFsdWUpIHtcclxuXHRcdFx0XHRcdFx0aWYgKGNvdW50KyspIHJldHVyblxyXG5cdFx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSB2YWx1ZVxyXG5cdFx0XHRcdFx0XHRmYWlsdXJlKClcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fSBjYXRjaCAoZSkge1xyXG5cdFx0XHRcdFx0bS5kZWZlcnJlZC5vbmVycm9yKGUpXHJcblx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSBlXHJcblx0XHRcdFx0XHRmYWlsdXJlKClcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0bm90VGhlbm5hYmxlKClcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGZ1bmN0aW9uIGZpcmUoKSB7XHJcblx0XHRcdC8vIGNoZWNrIGlmIGl0J3MgYSB0aGVuYWJsZVxyXG5cdFx0XHR2YXIgdGhlblxyXG5cdFx0XHR0cnkge1xyXG5cdFx0XHRcdHRoZW4gPSBwcm9taXNlVmFsdWUgJiYgcHJvbWlzZVZhbHVlLnRoZW5cclxuXHRcdFx0fSBjYXRjaCAoZSkge1xyXG5cdFx0XHRcdG0uZGVmZXJyZWQub25lcnJvcihlKVxyXG5cdFx0XHRcdHByb21pc2VWYWx1ZSA9IGVcclxuXHRcdFx0XHRzdGF0ZSA9IFJFSkVDVElOR1xyXG5cdFx0XHRcdHJldHVybiBmaXJlKClcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0aWYgKHN0YXRlID09PSBSRUpFQ1RJTkcpIHtcclxuXHRcdFx0XHRtLmRlZmVycmVkLm9uZXJyb3IocHJvbWlzZVZhbHVlKVxyXG5cdFx0XHR9XHJcblxyXG5cdFx0XHR0aGVubmFibGUodGhlbiwgZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRcdHN0YXRlID0gUkVTT0xWSU5HXHJcblx0XHRcdFx0ZmlyZSgpXHJcblx0XHRcdH0sIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRzdGF0ZSA9IFJFSkVDVElOR1xyXG5cdFx0XHRcdGZpcmUoKVxyXG5cdFx0XHR9LCBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0dHJ5IHtcclxuXHRcdFx0XHRcdGlmIChzdGF0ZSA9PT0gUkVTT0xWSU5HICYmIGlzRnVuY3Rpb24ob25TdWNjZXNzKSkge1xyXG5cdFx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSBvblN1Y2Nlc3MocHJvbWlzZVZhbHVlKVxyXG5cdFx0XHRcdFx0fSBlbHNlIGlmIChzdGF0ZSA9PT0gUkVKRUNUSU5HICYmIGlzRnVuY3Rpb24ob25GYWlsdXJlKSkge1xyXG5cdFx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSBvbkZhaWx1cmUocHJvbWlzZVZhbHVlKVxyXG5cdFx0XHRcdFx0XHRzdGF0ZSA9IFJFU09MVklOR1xyXG5cdFx0XHRcdFx0fVxyXG5cdFx0XHRcdH0gY2F0Y2ggKGUpIHtcclxuXHRcdFx0XHRcdG0uZGVmZXJyZWQub25lcnJvcihlKVxyXG5cdFx0XHRcdFx0cHJvbWlzZVZhbHVlID0gZVxyXG5cdFx0XHRcdFx0cmV0dXJuIGZpbmlzaCgpXHJcblx0XHRcdFx0fVxyXG5cclxuXHRcdFx0XHRpZiAocHJvbWlzZVZhbHVlID09PSBzZWxmKSB7XHJcblx0XHRcdFx0XHRwcm9taXNlVmFsdWUgPSBUeXBlRXJyb3IoKVxyXG5cdFx0XHRcdFx0ZmluaXNoKClcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0dGhlbm5hYmxlKHRoZW4sIGZ1bmN0aW9uICgpIHtcclxuXHRcdFx0XHRcdFx0ZmluaXNoKFJFU09MVkVEKVxyXG5cdFx0XHRcdFx0fSwgZmluaXNoLCBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdFx0XHRcdGZpbmlzaChzdGF0ZSA9PT0gUkVTT0xWSU5HICYmIFJFU09MVkVEKVxyXG5cdFx0XHRcdFx0fSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH0pXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRtLmRlZmVycmVkLm9uZXJyb3IgPSBmdW5jdGlvbiAoZSkge1xyXG5cdFx0aWYgKHR5cGUuY2FsbChlKSA9PT0gXCJbb2JqZWN0IEVycm9yXVwiICYmXHJcblx0XHRcdFx0IS8gRXJyb3IvLnRlc3QoZS5jb25zdHJ1Y3Rvci50b1N0cmluZygpKSkge1xyXG5cdFx0XHRwZW5kaW5nUmVxdWVzdHMgPSAwXHJcblx0XHRcdHRocm93IGVcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdG0uc3luYyA9IGZ1bmN0aW9uIChhcmdzKSB7XHJcblx0XHR2YXIgZGVmZXJyZWQgPSBtLmRlZmVycmVkKClcclxuXHRcdHZhciBvdXRzdGFuZGluZyA9IGFyZ3MubGVuZ3RoXHJcblx0XHR2YXIgcmVzdWx0cyA9IFtdXHJcblx0XHR2YXIgbWV0aG9kID0gXCJyZXNvbHZlXCJcclxuXHJcblx0XHRmdW5jdGlvbiBzeW5jaHJvbml6ZXIocG9zLCByZXNvbHZlZCkge1xyXG5cdFx0XHRyZXR1cm4gZnVuY3Rpb24gKHZhbHVlKSB7XHJcblx0XHRcdFx0cmVzdWx0c1twb3NdID0gdmFsdWVcclxuXHRcdFx0XHRpZiAoIXJlc29sdmVkKSBtZXRob2QgPSBcInJlamVjdFwiXHJcblx0XHRcdFx0aWYgKC0tb3V0c3RhbmRpbmcgPT09IDApIHtcclxuXHRcdFx0XHRcdGRlZmVycmVkLnByb21pc2UocmVzdWx0cylcclxuXHRcdFx0XHRcdGRlZmVycmVkW21ldGhvZF0ocmVzdWx0cylcclxuXHRcdFx0XHR9XHJcblx0XHRcdFx0cmV0dXJuIHZhbHVlXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAoYXJncy5sZW5ndGggPiAwKSB7XHJcblx0XHRcdGZvckVhY2goYXJncywgZnVuY3Rpb24gKGFyZywgaSkge1xyXG5cdFx0XHRcdGFyZy50aGVuKHN5bmNocm9uaXplcihpLCB0cnVlKSwgc3luY2hyb25pemVyKGksIGZhbHNlKSlcclxuXHRcdFx0fSlcclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdGRlZmVycmVkLnJlc29sdmUoW10pXHJcblx0XHR9XHJcblxyXG5cdFx0cmV0dXJuIGRlZmVycmVkLnByb21pc2VcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGlkZW50aXR5KHZhbHVlKSB7IHJldHVybiB2YWx1ZSB9XHJcblxyXG5cdGZ1bmN0aW9uIGhhbmRsZUpzb25wKG9wdGlvbnMpIHtcclxuXHRcdHZhciBjYWxsYmFja0tleSA9IG9wdGlvbnMuY2FsbGJhY2tOYW1lIHx8IFwibWl0aHJpbF9jYWxsYmFja19cIiArXHJcblx0XHRcdG5ldyBEYXRlKCkuZ2V0VGltZSgpICsgXCJfXCIgK1xyXG5cdFx0XHQoTWF0aC5yb3VuZChNYXRoLnJhbmRvbSgpICogMWUxNikpLnRvU3RyaW5nKDM2KVxyXG5cclxuXHRcdHZhciBzY3JpcHQgPSAkZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKVxyXG5cclxuXHRcdGdsb2JhbFtjYWxsYmFja0tleV0gPSBmdW5jdGlvbiAocmVzcCkge1xyXG5cdFx0XHRzY3JpcHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3JpcHQpXHJcblx0XHRcdG9wdGlvbnMub25sb2FkKHtcclxuXHRcdFx0XHR0eXBlOiBcImxvYWRcIixcclxuXHRcdFx0XHR0YXJnZXQ6IHtcclxuXHRcdFx0XHRcdHJlc3BvbnNlVGV4dDogcmVzcFxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fSlcclxuXHRcdFx0Z2xvYmFsW2NhbGxiYWNrS2V5XSA9IHVuZGVmaW5lZFxyXG5cdFx0fVxyXG5cclxuXHRcdHNjcmlwdC5vbmVycm9yID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRzY3JpcHQucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChzY3JpcHQpXHJcblxyXG5cdFx0XHRvcHRpb25zLm9uZXJyb3Ioe1xyXG5cdFx0XHRcdHR5cGU6IFwiZXJyb3JcIixcclxuXHRcdFx0XHR0YXJnZXQ6IHtcclxuXHRcdFx0XHRcdHN0YXR1czogNTAwLFxyXG5cdFx0XHRcdFx0cmVzcG9uc2VUZXh0OiBKU09OLnN0cmluZ2lmeSh7XHJcblx0XHRcdFx0XHRcdGVycm9yOiBcIkVycm9yIG1ha2luZyBqc29ucCByZXF1ZXN0XCJcclxuXHRcdFx0XHRcdH0pXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9KVxyXG5cdFx0XHRnbG9iYWxbY2FsbGJhY2tLZXldID0gdW5kZWZpbmVkXHJcblxyXG5cdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdH1cclxuXHJcblx0XHRzY3JpcHQub25sb2FkID0gZnVuY3Rpb24gKCkge1xyXG5cdFx0XHRyZXR1cm4gZmFsc2VcclxuXHRcdH1cclxuXHJcblx0XHRzY3JpcHQuc3JjID0gb3B0aW9ucy51cmwgK1xyXG5cdFx0XHQob3B0aW9ucy51cmwuaW5kZXhPZihcIj9cIikgPiAwID8gXCImXCIgOiBcIj9cIikgK1xyXG5cdFx0XHQob3B0aW9ucy5jYWxsYmFja0tleSA/IG9wdGlvbnMuY2FsbGJhY2tLZXkgOiBcImNhbGxiYWNrXCIpICtcclxuXHRcdFx0XCI9XCIgKyBjYWxsYmFja0tleSArXHJcblx0XHRcdFwiJlwiICsgYnVpbGRRdWVyeVN0cmluZyhvcHRpb25zLmRhdGEgfHwge30pXHJcblxyXG5cdFx0JGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoc2NyaXB0KVxyXG5cdH1cclxuXHJcblx0ZnVuY3Rpb24gY3JlYXRlWGhyKG9wdGlvbnMpIHtcclxuXHRcdHZhciB4aHIgPSBuZXcgZ2xvYmFsLlhNTEh0dHBSZXF1ZXN0KClcclxuXHRcdHhoci5vcGVuKG9wdGlvbnMubWV0aG9kLCBvcHRpb25zLnVybCwgdHJ1ZSwgb3B0aW9ucy51c2VyLFxyXG5cdFx0XHRvcHRpb25zLnBhc3N3b3JkKVxyXG5cclxuXHRcdHhoci5vbnJlYWR5c3RhdGVjaGFuZ2UgPSBmdW5jdGlvbiAoKSB7XHJcblx0XHRcdGlmICh4aHIucmVhZHlTdGF0ZSA9PT0gNCkge1xyXG5cdFx0XHRcdGlmICh4aHIuc3RhdHVzID49IDIwMCAmJiB4aHIuc3RhdHVzIDwgMzAwKSB7XHJcblx0XHRcdFx0XHRvcHRpb25zLm9ubG9hZCh7dHlwZTogXCJsb2FkXCIsIHRhcmdldDogeGhyfSlcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0b3B0aW9ucy5vbmVycm9yKHt0eXBlOiBcImVycm9yXCIsIHRhcmdldDogeGhyfSlcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRpZiAob3B0aW9ucy5zZXJpYWxpemUgPT09IEpTT04uc3RyaW5naWZ5ICYmXHJcblx0XHRcdFx0b3B0aW9ucy5kYXRhICYmXHJcblx0XHRcdFx0b3B0aW9ucy5tZXRob2QgIT09IFwiR0VUXCIpIHtcclxuXHRcdFx0eGhyLnNldFJlcXVlc3RIZWFkZXIoXCJDb250ZW50LVR5cGVcIixcclxuXHRcdFx0XHRcImFwcGxpY2F0aW9uL2pzb247IGNoYXJzZXQ9dXRmLThcIilcclxuXHRcdH1cclxuXHJcblx0XHRpZiAob3B0aW9ucy5kZXNlcmlhbGl6ZSA9PT0gSlNPTi5wYXJzZSkge1xyXG5cdFx0XHR4aHIuc2V0UmVxdWVzdEhlYWRlcihcIkFjY2VwdFwiLCBcImFwcGxpY2F0aW9uL2pzb24sIHRleHQvKlwiKVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChpc09iamVjdChvcHRpb25zLmhlYWRlcnMpKSB7XHJcblx0XHRcdGZvciAodmFyIGhlYWRlciBpbiBvcHRpb25zLmhlYWRlcnMpIHtcclxuXHRcdFx0XHRpZiAoaGFzT3duLmNhbGwob3B0aW9ucy5oZWFkZXJzLCBoZWFkZXIpKSB7XHJcblx0XHRcdFx0XHR4aHIuc2V0UmVxdWVzdEhlYWRlcihoZWFkZXIsIG9wdGlvbnMuaGVhZGVyc1toZWFkZXJdKVxyXG5cdFx0XHRcdH1cclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cclxuXHRcdGlmIChpc0Z1bmN0aW9uKG9wdGlvbnMuY29uZmlnKSkge1xyXG5cdFx0XHR2YXIgbWF5YmVYaHIgPSBvcHRpb25zLmNvbmZpZyh4aHIsIG9wdGlvbnMpXHJcblx0XHRcdGlmIChtYXliZVhociAhPSBudWxsKSB4aHIgPSBtYXliZVhoclxyXG5cdFx0fVxyXG5cclxuXHRcdHZhciBkYXRhID0gb3B0aW9ucy5tZXRob2QgPT09IFwiR0VUXCIgfHwgIW9wdGlvbnMuZGF0YSA/IFwiXCIgOiBvcHRpb25zLmRhdGFcclxuXHJcblx0XHRpZiAoZGF0YSAmJiAhaXNTdHJpbmcoZGF0YSkgJiYgZGF0YS5jb25zdHJ1Y3RvciAhPT0gZ2xvYmFsLkZvcm1EYXRhKSB7XHJcblx0XHRcdHRocm93IG5ldyBFcnJvcihcIlJlcXVlc3QgZGF0YSBzaG91bGQgYmUgZWl0aGVyIGJlIGEgc3RyaW5nIG9yIFwiICtcclxuXHRcdFx0XHRcIkZvcm1EYXRhLiBDaGVjayB0aGUgYHNlcmlhbGl6ZWAgb3B0aW9uIGluIGBtLnJlcXVlc3RgXCIpXHJcblx0XHR9XHJcblxyXG5cdFx0eGhyLnNlbmQoZGF0YSlcclxuXHRcdHJldHVybiB4aHJcclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIGFqYXgob3B0aW9ucykge1xyXG5cdFx0aWYgKG9wdGlvbnMuZGF0YVR5cGUgJiYgb3B0aW9ucy5kYXRhVHlwZS50b0xvd2VyQ2FzZSgpID09PSBcImpzb25wXCIpIHtcclxuXHRcdFx0cmV0dXJuIGhhbmRsZUpzb25wKG9wdGlvbnMpXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRyZXR1cm4gY3JlYXRlWGhyKG9wdGlvbnMpXHJcblx0XHR9XHJcblx0fVxyXG5cclxuXHRmdW5jdGlvbiBiaW5kRGF0YShvcHRpb25zLCBkYXRhLCBzZXJpYWxpemUpIHtcclxuXHRcdGlmIChvcHRpb25zLm1ldGhvZCA9PT0gXCJHRVRcIiAmJiBvcHRpb25zLmRhdGFUeXBlICE9PSBcImpzb25wXCIpIHtcclxuXHRcdFx0dmFyIHByZWZpeCA9IG9wdGlvbnMudXJsLmluZGV4T2YoXCI/XCIpIDwgMCA/IFwiP1wiIDogXCImXCJcclxuXHRcdFx0dmFyIHF1ZXJ5c3RyaW5nID0gYnVpbGRRdWVyeVN0cmluZyhkYXRhKVxyXG5cdFx0XHRvcHRpb25zLnVybCArPSAocXVlcnlzdHJpbmcgPyBwcmVmaXggKyBxdWVyeXN0cmluZyA6IFwiXCIpXHJcblx0XHR9IGVsc2Uge1xyXG5cdFx0XHRvcHRpb25zLmRhdGEgPSBzZXJpYWxpemUoZGF0YSlcclxuXHRcdH1cclxuXHR9XHJcblxyXG5cdGZ1bmN0aW9uIHBhcmFtZXRlcml6ZVVybCh1cmwsIGRhdGEpIHtcclxuXHRcdGlmIChkYXRhKSB7XHJcblx0XHRcdHVybCA9IHVybC5yZXBsYWNlKC86W2Etel1cXHcrL2dpLCBmdW5jdGlvbiAodG9rZW4pe1xyXG5cdFx0XHRcdHZhciBrZXkgPSB0b2tlbi5zbGljZSgxKVxyXG5cdFx0XHRcdHZhciB2YWx1ZSA9IGRhdGFba2V5XSB8fCB0b2tlblxyXG5cdFx0XHRcdGRlbGV0ZSBkYXRhW2tleV1cclxuXHRcdFx0XHRyZXR1cm4gdmFsdWVcclxuXHRcdFx0fSlcclxuXHRcdH1cclxuXHRcdHJldHVybiB1cmxcclxuXHR9XHJcblxyXG5cdG0ucmVxdWVzdCA9IGZ1bmN0aW9uIChvcHRpb25zKSB7XHJcblx0XHRpZiAob3B0aW9ucy5iYWNrZ3JvdW5kICE9PSB0cnVlKSBtLnN0YXJ0Q29tcHV0YXRpb24oKVxyXG5cdFx0dmFyIGRlZmVycmVkID0gbmV3IERlZmVycmVkKClcclxuXHRcdHZhciBpc0pTT05QID0gb3B0aW9ucy5kYXRhVHlwZSAmJlxyXG5cdFx0XHRvcHRpb25zLmRhdGFUeXBlLnRvTG93ZXJDYXNlKCkgPT09IFwianNvbnBcIlxyXG5cclxuXHRcdHZhciBzZXJpYWxpemUsIGRlc2VyaWFsaXplLCBleHRyYWN0XHJcblxyXG5cdFx0aWYgKGlzSlNPTlApIHtcclxuXHRcdFx0c2VyaWFsaXplID0gb3B0aW9ucy5zZXJpYWxpemUgPVxyXG5cdFx0XHRkZXNlcmlhbGl6ZSA9IG9wdGlvbnMuZGVzZXJpYWxpemUgPSBpZGVudGl0eVxyXG5cclxuXHRcdFx0ZXh0cmFjdCA9IGZ1bmN0aW9uIChqc29ucCkgeyByZXR1cm4ganNvbnAucmVzcG9uc2VUZXh0IH1cclxuXHRcdH0gZWxzZSB7XHJcblx0XHRcdHNlcmlhbGl6ZSA9IG9wdGlvbnMuc2VyaWFsaXplID0gb3B0aW9ucy5zZXJpYWxpemUgfHwgSlNPTi5zdHJpbmdpZnlcclxuXHJcblx0XHRcdGRlc2VyaWFsaXplID0gb3B0aW9ucy5kZXNlcmlhbGl6ZSA9XHJcblx0XHRcdFx0b3B0aW9ucy5kZXNlcmlhbGl6ZSB8fCBKU09OLnBhcnNlXHJcblx0XHRcdGV4dHJhY3QgPSBvcHRpb25zLmV4dHJhY3QgfHwgZnVuY3Rpb24gKHhocikge1xyXG5cdFx0XHRcdGlmICh4aHIucmVzcG9uc2VUZXh0Lmxlbmd0aCB8fCBkZXNlcmlhbGl6ZSAhPT0gSlNPTi5wYXJzZSkge1xyXG5cdFx0XHRcdFx0cmV0dXJuIHhoci5yZXNwb25zZVRleHRcclxuXHRcdFx0XHR9IGVsc2Uge1xyXG5cdFx0XHRcdFx0cmV0dXJuIG51bGxcclxuXHRcdFx0XHR9XHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRvcHRpb25zLm1ldGhvZCA9IChvcHRpb25zLm1ldGhvZCB8fCBcIkdFVFwiKS50b1VwcGVyQ2FzZSgpXHJcblx0XHRvcHRpb25zLnVybCA9IHBhcmFtZXRlcml6ZVVybChvcHRpb25zLnVybCwgb3B0aW9ucy5kYXRhKVxyXG5cdFx0YmluZERhdGEob3B0aW9ucywgb3B0aW9ucy5kYXRhLCBzZXJpYWxpemUpXHJcblx0XHRvcHRpb25zLm9ubG9hZCA9IG9wdGlvbnMub25lcnJvciA9IGZ1bmN0aW9uIChldikge1xyXG5cdFx0XHR0cnkge1xyXG5cdFx0XHRcdGV2ID0gZXYgfHwgZXZlbnRcclxuXHRcdFx0XHR2YXIgcmVzcG9uc2UgPSBkZXNlcmlhbGl6ZShleHRyYWN0KGV2LnRhcmdldCwgb3B0aW9ucykpXHJcblx0XHRcdFx0aWYgKGV2LnR5cGUgPT09IFwibG9hZFwiKSB7XHJcblx0XHRcdFx0XHRpZiAob3B0aW9ucy51bndyYXBTdWNjZXNzKSB7XHJcblx0XHRcdFx0XHRcdHJlc3BvbnNlID0gb3B0aW9ucy51bndyYXBTdWNjZXNzKHJlc3BvbnNlLCBldi50YXJnZXQpXHJcblx0XHRcdFx0XHR9XHJcblxyXG5cdFx0XHRcdFx0aWYgKGlzQXJyYXkocmVzcG9uc2UpICYmIG9wdGlvbnMudHlwZSkge1xyXG5cdFx0XHRcdFx0XHRmb3JFYWNoKHJlc3BvbnNlLCBmdW5jdGlvbiAocmVzLCBpKSB7XHJcblx0XHRcdFx0XHRcdFx0cmVzcG9uc2VbaV0gPSBuZXcgb3B0aW9ucy50eXBlKHJlcylcclxuXHRcdFx0XHRcdFx0fSlcclxuXHRcdFx0XHRcdH0gZWxzZSBpZiAob3B0aW9ucy50eXBlKSB7XHJcblx0XHRcdFx0XHRcdHJlc3BvbnNlID0gbmV3IG9wdGlvbnMudHlwZShyZXNwb25zZSlcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRkZWZlcnJlZC5yZXNvbHZlKHJlc3BvbnNlKVxyXG5cdFx0XHRcdH0gZWxzZSB7XHJcblx0XHRcdFx0XHRpZiAob3B0aW9ucy51bndyYXBFcnJvcikge1xyXG5cdFx0XHRcdFx0XHRyZXNwb25zZSA9IG9wdGlvbnMudW53cmFwRXJyb3IocmVzcG9uc2UsIGV2LnRhcmdldClcclxuXHRcdFx0XHRcdH1cclxuXHJcblx0XHRcdFx0XHRkZWZlcnJlZC5yZWplY3QocmVzcG9uc2UpXHJcblx0XHRcdFx0fVxyXG5cdFx0XHR9IGNhdGNoIChlKSB7XHJcblx0XHRcdFx0ZGVmZXJyZWQucmVqZWN0KGUpXHJcblx0XHRcdFx0bS5kZWZlcnJlZC5vbmVycm9yKGUpXHJcblx0XHRcdH0gZmluYWxseSB7XHJcblx0XHRcdFx0aWYgKG9wdGlvbnMuYmFja2dyb3VuZCAhPT0gdHJ1ZSkgbS5lbmRDb21wdXRhdGlvbigpXHJcblx0XHRcdH1cclxuXHRcdH1cclxuXHJcblx0XHRhamF4KG9wdGlvbnMpXHJcblx0XHRkZWZlcnJlZC5wcm9taXNlID0gcHJvcGlmeShkZWZlcnJlZC5wcm9taXNlLCBvcHRpb25zLmluaXRpYWxWYWx1ZSlcclxuXHRcdHJldHVybiBkZWZlcnJlZC5wcm9taXNlXHJcblx0fVxyXG5cclxuXHRyZXR1cm4gbVxyXG59KTsgLy8gZXNsaW50LWRpc2FibGUtbGluZVxyXG4iLCIndXNlIHN0cmljdCc7XG5cbmV4cG9ydCBkZWZhdWx0IG5ldyBBdWRpb0NvbnRleHQoKTtcbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IG0gZnJvbSAnbWl0aHJpbCc7XG5cbmltcG9ydCBHYW1lcGFkIGZyb20gJy4uL21vZGVsL0dhbWVwYWQnO1xuaW1wb3J0IFNhbXBsZXIgZnJvbSAnLi4vbW9kZWwvU2FtcGxlcic7XG5pbXBvcnQgRGlzdG9ydGlvbiBmcm9tICcuLi9tb2RlbC9EaXN0b3J0aW9uJztcblxuaW1wb3J0IGN0eCBmcm9tICcuLi9DdHgnO1xuXG5pbXBvcnQgVGltZXJDb21wb25lbnQgZnJvbSAnLi9UaW1lcic7XG5pbXBvcnQgR2FtZXBhZENvbXBvbmVudCBmcm9tICcuL0dhbWVwYWQnO1xuaW1wb3J0IFNhbXBsZXJDb21wb25lbnQgZnJvbSAnLi9TYW1wbGVyJztcbmltcG9ydCBNYXN0ZXJEaXN0b3J0aW9uQ29tcG9uZW50IGZyb20gJy4vTWFzdGVyRGlzdG9ydGlvbic7XG5cbmNvbnN0IEJVVFRPTjJOVU0gPSB7XG4gIDUgOiAwLFxuICAxIDogMSxcbiAgMCA6IDIsXG59O1xuXG52YXIgQXBwID0ge307XG5cbmNsYXNzIFZNIHtcbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHRoaXMuaW50ZXJ2YWwgICA9IG0ucHJvcCg1MDApO1xuXG4gICAgLy8gbW9kZWxzXG4gICAgdGhpcy5wYWQgICAgID0gbmV3IEdhbWVwYWQoZmFsc2UpO1xuICAgIHRoaXMuc2FtcGxlciA9IG5ldyBTYW1wbGVyKCk7XG4gICAgdGhpcy5kaXN0ICAgID0gbmV3IERpc3RvcnRpb24oKTtcbiAgICB0aGlzLnNhbXBsZXIuY29ubmVjdCh0aGlzLmRpc3QuaW5wdXQpO1xuICAgIHRoaXMuZGlzdC5jb25uZWN0KGN0eC5kZXN0aW5hdGlvbik7XG4gIH1cblxuICBwbGF5Tm90ZXMgKCkge1xuICAgIGxldCBidWZmZXIgPSBbXTtcblxuICAgIHRoaXMuc2FtcGxlci5iZW5kKHRoaXMucGFkLmJ1dHRvbnNbNF0ucHJlc3NlZCk7XG5cbiAgICB0aGlzLnBhZC5idXR0b25zLmZvckVhY2goKGIsIGkpID0+IHtcbiAgICAgIGlmIChiLnByZXNzZWQpIHtcbiAgICAgICAgYnVmZmVyLnB1c2goQlVUVE9OMk5VTVtpXSk7XG4gICAgICB9XG4gICAgfSk7XG4gICAgdGhpcy5zYW1wbGVyLnBsYXlOb3RlcyhidWZmZXIpO1xuICB9XG59XG5cbkFwcC5jb250cm9sbGVyID0gZnVuY3Rpb24oKSB7XG4gIHJldHVybiBuZXcgVk0oKTtcbn07XG5cbkFwcC52aWV3ID0gZnVuY3Rpb24gKHZtKSB7XG4gIHJldHVybiBbXG4gICAgbSgnLldyYXBwZXInLCBbXG4gICAgICBtKCcuTGVmdENvbHVtbicsIFtcbiAgICAgICAgbS5jb21wb25lbnQoR2FtZXBhZENvbXBvbmVudCwgeyBnYW1lcGFkOiB2bS5wYWQgfSksXG4gICAgICBdKSxcbiAgICAgIG0oJy5SaWdodENvbHVtbicsIFtcbiAgICAgICAgbSgnLlRpdGxlJywgJ0d1aXRhckJyZWFrcycpLFxuICAgICAgICBtLmNvbXBvbmVudChTYW1wbGVyQ29tcG9uZW50LCB7IHNhbXBsZXI6IHZtLnNhbXBsZXIgfSksXG4gICAgICAgIG0uY29tcG9uZW50KE1hc3RlckRpc3RvcnRpb25Db21wb25lbnQsIHsgZGlzdG9ydGlvbk5vZGU6IHZtLmRpc3QgfSksXG4gICAgICAgIG0uY29tcG9uZW50KFRpbWVyQ29tcG9uZW50LCB7XG4gICAgICAgICAgcGFkOiB2bS5wYWQsIGNhbGxiYWNrOiA6OnZtLnBsYXlOb3RlcyxcbiAgICAgICAgfSksXG4gICAgICBdKSxcbiAgICBdKSxcbiAgXTtcbn07XG5cbmV4cG9ydCBkZWZhdWx0IEFwcDtcbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IG0gZnJvbSAnbWl0aHJpbCc7XG5cbmNsYXNzIFZNIHtcbiAgY29uc3RydWN0b3IgKHBhZCkge1xuICAgIHRoaXMucGFkID0gcGFkO1xuICAgIHRoaXMuYnV0dG9ucyA9IHRoaXMucGFkLmJ1dHRvbnMubWFwKGIgPT4gYi5wcmVzc2VkKTtcblxuICAgIHRoaXMucGFkLm9uKCdidXR0b25zJywgKGJ1dHRvbnMpID0+IHtcbiAgICAgIGNvbnN0IGlzQ2hhbmdlZCA9IHRoaXMuYnV0dG9ucy5zb21lKChwLCBpKSA9PiB7XG4gICAgICAgIHJldHVybiBwICE9PSBidXR0b25zW2ldLnByZXNzZWQ7XG4gICAgICB9KTtcbiAgICAgIGlmIChpc0NoYW5nZWQpIHtcbiAgICAgICAgdGhpcy5idXR0b25zID0gYnV0dG9ucy5tYXAoYiA9PiBiLnByZXNzZWQpO1xuICAgICAgICBtLnJlZHJhdygpO1xuICAgICAgfVxuICAgIH0pO1xuICB9XG5cbiAgdG9nZ2xlU2ltdWxhdGUgKCkge1xuICAgIHRoaXMucGFkLnRvZ2dsZVNpbXVsYXRlKCk7XG4gICAgY29uc29sZS5sb2codGhpcy5wYWQuaXNTaW11bGF0aW5nKTtcbiAgfVxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGNvbnRyb2xsZXIgOiBmdW5jdGlvbiAoYXJncykge1xuICAgIHJldHVybiBuZXcgVk0oYXJncy5nYW1lcGFkKTtcbiAgfSxcblxuICB2aWV3IDogZnVuY3Rpb24gKHZtKSB7XG4gICAgcmV0dXJuIG0oJy5HYW1lcGFkJywgW1xuICAgICAgbSgnaW1nLkdhbWVwYWRfX0d1aXRhcicsIHsgc3JjIDogJy4vaW1hZ2UvZ3VpdGFyLnBuZycgfSksXG4gICAgICBtKCdpbWcuR2FtZXBhZF9fUmVkJywge1xuICAgICAgICBzcmMgOiAnLi9pbWFnZS9yZWQucG5nJyxcbiAgICAgICAgY2xhc3MgOiB2bS5wYWQuYnV0dG9uc1s1XS5wcmVzc2VkID8gJ29uJyA6ICdvZmYnLFxuICAgICAgfSksXG4gICAgICBtKCdpbWcuR2FtZXBhZF9fR3JlZW4nLCB7XG4gICAgICAgIHNyYyA6ICcuL2ltYWdlL2dyZWVuLnBuZycsXG4gICAgICAgIGNsYXNzIDogdm0ucGFkLmJ1dHRvbnNbMV0ucHJlc3NlZCA/ICdvbicgOiAnb2ZmJyxcbiAgICAgIH0pLFxuICAgICAgbSgnaW1nLkdhbWVwYWRfX0JsdWUnLCB7XG4gICAgICAgIHNyYyA6ICcuL2ltYWdlL2JsdWUucG5nJyxcbiAgICAgICAgY2xhc3MgOiB2bS5wYWQuYnV0dG9uc1swXS5wcmVzc2VkID8gJ29uJyA6ICdvZmYnLFxuICAgICAgfSksXG4gICAgICBtKCdpbWcuR2FtZXBhZF9fU2VsZWN0Jywge1xuICAgICAgICBzcmMgOiAnLi9pbWFnZS9zZWxlY3QucG5nJyxcbiAgICAgICAgY2xhc3MgOiB2bS5wYWQuYnV0dG9uc1s5XS5wcmVzc2VkID8gJ29uJyA6ICdvZmYnLFxuICAgICAgfSksXG4gICAgICBtKCdpbWcuR2FtZXBhZF9fU3RhcnQnLCB7XG4gICAgICAgIHNyYyA6ICcuL2ltYWdlL3N0YXJ0LnBuZycsXG4gICAgICAgIGNsYXNzIDogdm0ucGFkLmJ1dHRvbnNbOF0ucHJlc3NlZCA/ICdvbicgOiAnb2ZmJyxcbiAgICAgIH0pLFxuICAgICAgbSgnLkdhbWVwYWRfX1NpbXVsYXRlQnV0dG9uJywge1xuICAgICAgICBjbGFzcyA6ICB2bS5wYWQuaXNTaW11bGF0aW5nID8gJy5HYW1lcGFkX19TaW11bGF0ZUJ1dHRvbi0tb24nIDogJycsXG4gICAgICAgIG9uY2xpY2s6IDo6dm0udG9nZ2xlU2ltdWxhdGUsXG4gICAgICB9LCAnU2ltdWxhdGlvbiA6ICcgKyAodm0ucGFkLmlzU2ltdWxhdGluZyA/ICdPTicgOiAnT0ZGJykpLFxuICAgIF0pO1xuICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgbSBmcm9tICdtaXRocmlsJztcblxuY2xhc3MgTWFzdGVyRGlzdG9ydGlvblZNIHtcblxuICBjb25zdHJ1Y3RvciAobm9kZSkge1xuICAgIHRoaXMubm9kZSA9IG5vZGU7XG5cbiAgICB0aGlzLmRpc3RvcnRpb24gPSBtLnByb3AoMTAwMDApO1xuICAgIHRoaXMudm9sdW1lICAgICA9IG0ucHJvcCgzMDAwKTtcbiAgfVxuXG4gIG9uQ2hhbmdlRGlzdG9ydGlvbiAoZSkge1xuICAgIHRoaXMuZGlzdG9ydGlvbihlLnRhcmdldC52YWx1ZSk7XG4gICAgdGhpcy5ub2RlLnNldERpc3RvcnRpb24oZS50YXJnZXQudmFsdWUgLyAxMDAwMC4wKTtcbiAgfVxuXG4gIG9uQ2hhbmdlVm9sdW1lIChlKSB7XG4gICAgdGhpcy52b2x1bWUoZS50YXJnZXQudmFsdWUpO1xuICAgIHRoaXMubm9kZS5zZXRWb2x1bWUoZS50YXJnZXQudmFsdWUgLyAxMDAwMC4wKTtcbiAgfVxuXG4gIHRvZ2dsZSAoKSB7XG4gICAgdGhpcy5ub2RlLnRvZ2dsZSgpO1xuICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQge1xuXG4gIGNvbnRyb2xsZXIgOiBmdW5jdGlvbiAoYXJncykge1xuICAgIHJldHVybiBuZXcgTWFzdGVyRGlzdG9ydGlvblZNKGFyZ3MuZGlzdG9ydGlvbk5vZGUpO1xuICB9LFxuXG4gIHZpZXcgOiBmdW5jdGlvbiAodm0pIHtcbiAgICByZXR1cm4gbSgnLk1hc3RlckRpc3RvcnRpb24nLCBbXG4gICAgICBtKCcuTWFzdGVyRGlzdG9ydGlvbl9fVG9nZ2xlJywge1xuICAgICAgICBjbGFzcyA6IHZtLm5vZGUuaXNPbiA/ICdvbicgOidvZmYnLFxuICAgICAgICBvbmNsaWNrIDogOjogdm0udG9nZ2xlLFxuICAgICAgfSksXG4gICAgICBtKCcuTWFzdGVyRGlzdG9ydGlvbl9fTGFiZWwnLCAnTWFzdGVyRlgnKSxcbiAgICAgIG0oJy5NYXN0ZXJEaXN0b3J0aW9uX19GWHMnLCBbXG4gICAgICAgIG0oJy5NYXN0ZXJEaXN0b3J0aW9uX19GWHNfX0ZYJywgW1xuICAgICAgICAgIG0oJy5NYXN0ZXJEaXN0b3J0aW9uX19GWHNfX0ZYX19MYWJlbCcsICdkaXN0b3J0aW9uJyksXG4gICAgICAgICAgbSgnaW5wdXQuTWFzdGVyRGlzdG9ydGlvbl9fRlhzX19GWF9fSW5wdXQnLCB7XG4gICAgICAgICAgICB0eXBlICAgICA6ICdyYW5nZScsXG4gICAgICAgICAgICBtaW4gICAgICA6IDEwMDAwLFxuICAgICAgICAgICAgbWF4ICAgICAgOiAzMDAwMCxcbiAgICAgICAgICAgIG9uY2hhbmdlIDogOjp2bS5vbkNoYW5nZURpc3RvcnRpb24sXG4gICAgICAgICAgICB2YWx1ZSAgICA6IHZtLmRpc3RvcnRpb24oKVxuICAgICAgICAgIH0pLFxuICAgICAgICBdKSxcbiAgICAgICAgbSgnLk1hc3RlckRpc3RvcnRpb25fX0ZYc19fRlgnLCBbXG4gICAgICAgICAgbSgnLk1hc3RlckRpc3RvcnRpb25fX0ZYc19fRlhfX0xhYmVsJywgJ3ZvbHVtZScpLFxuICAgICAgICAgIG0oJ2lucHV0Lk1hc3RlckRpc3RvcnRpb25fX0ZYc19fRlhfX0lucHV0Jywge1xuICAgICAgICAgICAgdHlwZSAgICAgOiAncmFuZ2UnLFxuICAgICAgICAgICAgbWluICAgICAgOiAwLFxuICAgICAgICAgICAgbWF4ICAgICAgOiAxMDAwMCxcbiAgICAgICAgICAgIG9uY2hhbmdlIDogOjp2bS5vbkNoYW5nZVZvbHVtZSxcbiAgICAgICAgICAgIHZhbHVlICAgIDogdm0udm9sdW1lKClcbiAgICAgICAgICB9KSxcbiAgICAgICAgXSksXG4gICAgICBdKSxcbiAgICBdKTtcbiAgfVxuXG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgbSBmcm9tICdtaXRocmlsJztcblxuY29uc3QgQ0FOVkFTX1dJRFRIICA9IDUxMjtcbmNvbnN0IENBTlZBU19IRUlHSFQgPSAyNTY7XG5cbmNsYXNzIFNhbXBsZVZNIHtcbiAgY29uc3RydWN0b3IgKGFyZ3MpIHtcbiAgICB0aGlzLnNhbXBsZU5vZGUgICAgID0gYXJncy5zYW1wbGU7XG4gICAgdGhpcy5kaXN0b3J0aW9uTm9kZSA9IGFyZ3MuZGlzdG9ydGlvbjtcbiAgICB0aGlzLmluZGV4ICAgICAgICAgID0gYXJncy5pbmRleDtcbiAgICB0aGlzLmNhbGxiYWNrICAgICAgID0gYXJncy5jYWxsYmFjaztcbiAgICB0aGlzLmNvbG9yTGFiZWwgICAgID0gYXJncy5jb2xvckxhYmVsO1xuICAgIHRoaXMuY29sb3IgICAgICAgICAgPSBhcmdzLmNvbG9yO1xuXG4gICAgdGhpcy5kaXN0b3J0aW9uID0gbS5wcm9wKDEwMDAwKTtcbiAgICB0aGlzLnZvbHVtZSAgICAgPSBtLnByb3AoMzAwMCk7XG4gICAgdGhpcy5waXRjaCAgICAgID0gbS5wcm9wKDEwMDAwKTtcbiAgfVxuXG4gIG9uQ2xpY2tQbGF5QnV0dG9uICgpIHtcbiAgICB0aGlzLnNhbXBsZU5vZGUucGxheSgpO1xuICB9XG5cbiAgZ2V0U2FtcGxlTmFtZSAoKSB7XG4gICAgcmV0dXJuIHRoaXMuc2FtcGxlTm9kZS5iYXNlbmFtZTtcbiAgfVxuXG4gIG9uQ2hhbmdlRGlzdG9ydGlvbiAoZSkge1xuICAgIHRoaXMuZGlzdG9ydGlvbihlLnRhcmdldC52YWx1ZSk7XG4gICAgdGhpcy5kaXN0b3J0aW9uTm9kZS5zZXREaXN0b3J0aW9uKGUudGFyZ2V0LnZhbHVlIC8gMTAwMDAuMCk7XG4gIH1cblxuICBvbkNoYW5nZVZvbHVtZSAoZSkge1xuICAgIHRoaXMudm9sdW1lKGUudGFyZ2V0LnZhbHVlKTtcbiAgICB0aGlzLmRpc3RvcnRpb25Ob2RlLnNldFZvbHVtZShlLnRhcmdldC52YWx1ZSAvIDEwMDAwLjApO1xuICB9XG5cbiAgb25DaGFuZ2VQaXRjaCAoZSkge1xuICAgIHRoaXMucGl0Y2goZS50YXJnZXQudmFsdWUpO1xuICAgIHRoaXMuc2FtcGxlTm9kZS5zZXRQbGF5YmFja1JhdGUoZS50YXJnZXQudmFsdWUgLyAxMDAwMC4wKTtcbiAgfVxuXG4gIGRyYXdXYXZlIChlbGVtZW50LCBpc0luaXRpYWxpemVkLCBjb250ZXh0KSB7XG4gICAgaWYgKGlzSW5pdGlhbGl6ZWQpIHsgcmV0dXJuOyB9XG5cbiAgICB0aGlzLnNhbXBsZU5vZGUub24oJ3dhdmVMb2FkZWQnLCAod2F2ZSkgPT4ge1xuICAgICAgdmFyIGN0eCA9IGVsZW1lbnQuZ2V0Q29udGV4dChcIjJkXCIpO1xuICAgICAgY29uc3QgcmVjdCA9IGVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICBjb25zdCBbdywgaF0gPSBbcmVjdC53aWR0aCwgcmVjdC5oZWlnaHRdO1xuXG4gICAgICBjdHguY2xlYXJSZWN0KDAsIDAsIHcsIGgpO1xuXG4gICAgICBjdHgubGluZVdpZHRoID0gMC4zO1xuICAgICAgY3R4LnN0cm9rZVN0eWxlID0gJyNGRkYnO1xuXG4gICAgICAvLyBEcmF3IHdhdmVmb3JtXG4gICAgICBjdHgudHJhbnNsYXRlKDAsIGggKiAwLjUpO1xuICAgICAgY3R4LmJlZ2luUGF0aCgpO1xuXG4gICAgICBjb25zdCBkID0gdyAvIHdhdmUubGVuZ3RoO1xuICAgICAgZm9yIChsZXQgaSA9IDA7IGkgPCB3YXZlLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgIGN0eC5saW5lVG8oaSAqIGQsIHdhdmVbaV0gKiBoICogMC44KTtcbiAgICAgIH1cblxuICAgICAgY3R4LnN0cm9rZSgpO1xuICAgICAgY3R4LnRyYW5zbGF0ZSgwLCAtaCAqIDAuNSk7XG4gICAgfSk7XG4gIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCB7XG4gIGNvbnRyb2xsZXIgOiBmdW5jdGlvbiAoYXJncykge1xuICAgIHJldHVybiBuZXcgU2FtcGxlVk0oYXJncyk7XG4gIH0sXG5cbiAgdmlldyA6IGZ1bmN0aW9uICh2bSkge1xuICAgIHJldHVybiBtKCcuU2FtcGxlJywge1xuICAgICAgY2xhc3MgOiB2bS5jb2xvckxhYmVsLFxuICAgIH0sIFtcbiAgICAgIG0oJy5TYW1wbGVfX05hbWVMYWJlbCcsIHZtLmNvbG9yTGFiZWwpLFxuICAgICAgbSgnLlNhbXBsZV9fTmFtZScsIHZtLmdldFNhbXBsZU5hbWUoKSksXG4gICAgICBtKCcuU2FtcGxlX19QbGF5Jywge1xuICAgICAgICBvbmNsaWNrIDogOjp2bS5vbkNsaWNrUGxheUJ1dHRvbixcbiAgICAgIH0sIFtcbiAgICAgICAgbSgnLmZhLmZhLXBsYXknKSxcbiAgICAgIF0pLFxuICAgICAgbSgnY2FudmFzLlNhbXBsZV9fV2F2ZScsIHtcbiAgICAgICAgY29uZmlnOiA6OnZtLmRyYXdXYXZlLFxuICAgICAgfSksXG4gICAgICBtKCcuU2FtcGxlX19GWHMnLCBbXG4gICAgICAgIG0oJy5TYW1wbGVfX0ZYc19fRlgnLCBbXG4gICAgICAgICAgbSgnLlNhbXBsZV9fRlhzX19GWF9fTGFiZWwnLCAnZ2FpbicpLFxuICAgICAgICAgIG0oJy5TYW1wbGVfX0ZYc19fRlhfX1ZhbHVlJywgKHZtLmRpc3RvcnRpb24oKSAvIDEwMDAwKS50b0ZpeGVkKDIpKSxcbiAgICAgICAgICBtKCdpbnB1dC5TYW1wbGVfX0ZYc19fRlhfX0lucHV0Jywge1xuICAgICAgICAgICAgdHlwZSAgICAgOiAncmFuZ2UnLFxuICAgICAgICAgICAgbWluICAgICAgOiAxMDAwMCxcbiAgICAgICAgICAgIG1heCAgICAgIDogMzAwMDAsXG4gICAgICAgICAgICBvbmNoYW5nZSA6IDo6dm0ub25DaGFuZ2VEaXN0b3J0aW9uLFxuICAgICAgICAgICAgdmFsdWUgICAgOiB2bS5kaXN0b3J0aW9uKClcbiAgICAgICAgICB9KSxcbiAgICAgICAgXSksXG4gICAgICAgIG0oJy5TYW1wbGVfX0ZYc19fRlgnLCBbXG4gICAgICAgICAgbSgnLlNhbXBsZV9fRlhzX19GWF9fTGFiZWwnLCAndm9sdW1lJyksXG4gICAgICAgICAgbSgnLlNhbXBsZV9fRlhzX19GWF9fVmFsdWUnLCAodm0udm9sdW1lKCkgLyAxMDAwMCkudG9GaXhlZCgyKSksXG4gICAgICAgICAgbSgnaW5wdXQuU2FtcGxlX19GWHNfX0ZYX19JbnB1dCcsIHtcbiAgICAgICAgICAgIHR5cGUgICAgIDogJ3JhbmdlJyxcbiAgICAgICAgICAgIG1pbiAgICAgIDogMCxcbiAgICAgICAgICAgIG1heCAgICAgIDogMTAwMDAsXG4gICAgICAgICAgICBvbmNoYW5nZSA6IDo6dm0ub25DaGFuZ2VWb2x1bWUsXG4gICAgICAgICAgICB2YWx1ZSAgICA6IHZtLnZvbHVtZSgpXG4gICAgICAgICAgfSksXG4gICAgICAgIF0pLFxuICAgICAgICBtKCcuU2FtcGxlX19GWHNfX0ZYJywgW1xuICAgICAgICAgIG0oJy5TYW1wbGVfX0ZYc19fRlhfX0xhYmVsJywgJ3BpdGNoJyksXG4gICAgICAgICAgbSgnLlNhbXBsZV9fRlhzX19GWF9fVmFsdWUnLCAodm0ucGl0Y2goKSAvIDEwMDAwKS50b0ZpeGVkKDIpKSxcbiAgICAgICAgICBtKCdpbnB1dC5TYW1wbGVfX0ZYc19fRlhfX0lucHV0Jywge1xuICAgICAgICAgICAgdHlwZSAgICAgOiAncmFuZ2UnLFxuICAgICAgICAgICAgbWluICAgICAgOiAwLFxuICAgICAgICAgICAgbWF4ICAgICAgOiAyMDAwMCxcbiAgICAgICAgICAgIG9uY2hhbmdlIDogOjp2bS5vbkNoYW5nZVBpdGNoLFxuICAgICAgICAgICAgdmFsdWUgICAgOiB2bS5waXRjaCgpXG4gICAgICAgICAgfSksXG4gICAgICAgIF0pLFxuICAgICAgXSksXG4gICAgXSk7XG4gIH0sXG5cbn07XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBtIGZyb20gJ21pdGhyaWwnO1xuXG5pbXBvcnQgU2FtcGxlIGZyb20gJy4vU2FtcGxlJztcblxuY2xhc3MgU2FtcGxlclZNIHtcbiAgY29uc3RydWN0b3IgKHNhbXBsZXIpIHtcbiAgICB0aGlzLnNhbXBsZXIgPSBzYW1wbGVyO1xuICB9XG5cbiAgZ2V0S2l0TmFtZSAoKSB7XG4gICAgcmV0dXJuICdBTUVOJztcbiAgfVxuXG4gIGNoYW5nZUtpdCAoZSkge1xuICAgIHRoaXMuc2FtcGxlci5jaGFuZ2VLaXQoZS50YXJnZXQudmFsdWUpO1xuICB9XG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgY29udHJvbGxlciA6IGZ1bmN0aW9uIChhcmdzKSB7XG4gICAgcmV0dXJuIG5ldyBTYW1wbGVyVk0oYXJncy5zYW1wbGVyKTtcbiAgfSxcblxuICB2aWV3IDogZnVuY3Rpb24gKHZtKSB7XG4gICAgcmV0dXJuIG0oJy5TYW1wbGVyJywgW1xuICAgICAgbSgnLlNhbXBsZXJfX0hlYWRlcicsIFtcbiAgICAgICAgbSgnLlNhbXBsZXJfX0tpdE5hbWUnLCAnRHJ1bWtpdCcpLFxuICAgICAgICBtKCdzZWxlY3QuU2FtcGxlcl9fS2l0U2VsZWN0b3InLCB7XG4gICAgICAgICAgb25jaGFuZ2UgOiA6OnZtLmNoYW5nZUtpdCxcbiAgICAgICAgfSwgW1xuICAgICAgICAgIG0oJ29wdGlvbicsIHsgdmFsdWU6ICdBTUVOJywgc2VsZWN0ZWQ6ICdzZWxlY3RlZCcgfSwgJ0FNRU4nKSxcbiAgICAgICAgICBtKCdvcHRpb24nLCB7IHZhbHVlOiAnR0FCQkEnIH0sICdHQUJCQScpXG4gICAgICAgIF0pLFxuICAgICAgXSksXG4gICAgICBtKCcuU2FtcGxlcl9fQm9keScsIFtcbiAgICAgICAgbS5jb21wb25lbnQoU2FtcGxlLCB7XG4gICAgICAgICAgc2FtcGxlICAgICA6IHZtLnNhbXBsZXIuc2FtcGxlc1swXSxcbiAgICAgICAgICBkaXN0b3J0aW9uIDogdm0uc2FtcGxlci5kaXN0b3J0aW9uc1swXSxcbiAgICAgICAgICBjb2xvckxhYmVsIDogJ1JlZCcsXG4gICAgICAgICAgY29sb3IgICAgICA6ICcjRjg4JyxcbiAgICAgICAgICBpbmRleCAgICAgIDogMCxcbiAgICAgICAgfSksXG4gICAgICAgIG0uY29tcG9uZW50KFNhbXBsZSwge1xuICAgICAgICAgIHNhbXBsZSAgICAgOiB2bS5zYW1wbGVyLnNhbXBsZXNbMV0sXG4gICAgICAgICAgZGlzdG9ydGlvbiA6IHZtLnNhbXBsZXIuZGlzdG9ydGlvbnNbMV0sXG4gICAgICAgICAgY29sb3JMYWJlbCA6ICdHcmVlbicsXG4gICAgICAgICAgY29sb3IgICAgICA6ICcjOEY4JyxcbiAgICAgICAgICBpbmRleCAgICAgIDogMSxcbiAgICAgICAgfSksXG4gICAgICAgIG0uY29tcG9uZW50KFNhbXBsZSwge1xuICAgICAgICAgIHNhbXBsZSAgICAgOiB2bS5zYW1wbGVyLnNhbXBsZXNbMl0sXG4gICAgICAgICAgZGlzdG9ydGlvbiA6IHZtLnNhbXBsZXIuZGlzdG9ydGlvbnNbMl0sXG4gICAgICAgICAgY29sb3JMYWJlbCA6ICdCbHVlJyxcbiAgICAgICAgICBjb2xvciAgICAgIDogJyM4OEYnLFxuICAgICAgICAgIGluZGV4ICAgICAgOiAyLFxuICAgICAgICB9KSxcbiAgICAgIF0pLFxuICAgIF0pO1xuICB9XG59O1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgbSBmcm9tICdtaXRocmlsJztcblxuY29uc3QgTUlOVVRFID0gNjAuMCAqIDEwMDA7XG5jb25zdCBTRUxFQ1QgPSA5O1xuY29uc3QgU1RBUlQgID0gODtcblxuY2xhc3MgVk0ge1xuXG4gIGNvbnN0cnVjdG9yIChhcmdzKSB7XG4gICAgdGhpcy5wYWQgICAgICA9IGFyZ3MucGFkO1xuICAgIHRoaXMuY2FsbGJhY2sgPSBhcmdzLmNhbGxiYWNrO1xuXG4gICAgdGhpcy5iZWF0ID0gNDtcbiAgICB0aGlzLmludGVydmFsID0gbS5wcm9wKDEwMCk7XG4gICAgdGhpcy5icG0gPSBtLnByb3AoTUlOVVRFIC8gKHRoaXMuaW50ZXJ2YWwoKSAqIHRoaXMuYmVhdCkpO1xuXG4gICAgdGhpcy5sYXN0Q2xpY2tUaW1lID0gRGF0ZS5ub3coKTtcblxuICAgIC8vIExpc3RlbiB0byBnYW1lcGFkXG4gICAgdGhpcy5wb2xsVGltZXIgPSBudWxsO1xuICAgIHRoaXMucGFkLm9uKCdub3RlT24nLCA6OnRoaXMucG9sbCk7XG4gICAgdGhpcy5wYWQub24oJ25vdGVPZmYnLCAoKSA9PiB7XG4gICAgICBjbGVhclRpbWVvdXQodGhpcy5wb2xsVGltZXIpO1xuICAgIH0pO1xuXG5cbiAgICB0aGlzLmJ1dHRvbnMgPSB0aGlzLnBhZC5idXR0b25zLm1hcChiID0+IGIucHJlc3NlZCk7XG5cbiAgICB0aGlzLnBhZC5vbignYnV0dG9ucycsIChidXR0b25zKSA9PiB7XG4gICAgICBjb25zdCBpc0NoYW5nZWQgPSB0aGlzLmJ1dHRvbnMuc29tZSgocCwgaSkgPT4ge1xuICAgICAgICByZXR1cm4gcCAhPT0gYnV0dG9uc1tpXS5wcmVzc2VkO1xuICAgICAgfSk7XG4gICAgICBpZiAoaXNDaGFuZ2VkKSB7XG4gICAgICAgIHRoaXMuYnV0dG9ucyA9IGJ1dHRvbnMubWFwKGIgPT4gYi5wcmVzc2VkKTtcbiAgICAgICAgdGhpcy5iZWF0ID0gNCAqICh0aGlzLmJ1dHRvbnNbOV0gPyAyIDogMSkgKiAodGhpcy5idXR0b25zWzhdID8gNCA6IDEpIDtcbiAgICAgICAgdGhpcy5pbnRlcnZhbChNSU5VVEUgLyAodGhpcy5icG0oKSAqIHRoaXMuYmVhdCkpO1xuICAgICAgICBtLnJlZHJhdygpO1xuICAgICAgfVxuICAgIH0pO1xuXG4gIH1cblxuICBvbkNsaWNrICgpIHtcbiAgICBjb25zdCBub3cgPSBEYXRlLm5vdygpO1xuICAgIGlmIChub3cgLSB0aGlzLmxhc3RDbGlja1RpbWUgPCAyMDAwKSB7XG4gICAgICB0aGlzLmludGVydmFsKChub3cgLSB0aGlzLmxhc3RDbGlja1RpbWUpIC8gdGhpcy5iZWF0KTtcbiAgICAgIHRoaXMuYnBtKE1JTlVURSAvICh0aGlzLmludGVydmFsKCkgKiB0aGlzLmJlYXQpKTtcbiAgICB9XG4gICAgdGhpcy5sYXN0Q2xpY2tUaW1lID0gbm93O1xuICB9XG5cbiAgcG9sbCAoKSB7XG4gICAgdGhpcy5jYWxsYmFjaygpO1xuICAgIHRoaXMucG9sbFRpbWVyID0gc2V0VGltZW91dCg6OnRoaXMucG9sbCwgdGhpcy5pbnRlcnZhbCgpKTtcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IHtcbiAgY29udHJvbGxlciA6IChhcmdzKSA9PiBuZXcgVk0oYXJncyksXG5cbiAgdmlldyA6IGZ1bmN0aW9uICh2bSkge1xuICAgIHJldHVybiBtKCcuVGltZXInLCBbXG4gICAgICBtKCcuVGltZXJfX1JvdycsIFtcbiAgICAgICAgbSgnLlRpbWVyX19Sb3dfX0xhYmVsJywgJ0JQTScpLFxuICAgICAgICBtKCcuVGltZXJfX1Jvd19fVmFsdWUnLCB2bS5icG0oKXwwKSxcbiAgICAgIF0pLFxuICAgICAgbSgnLlRpbWVyX19Sb3cnLCBbXG4gICAgICAgIG0oJy5UaW1lcl9fUm93X19MYWJlbCcsICdJbnRlcnZhbCcpLFxuICAgICAgICBtKCcuVGltZXJfX1Jvd19fVmFsdWUnLCB2bS5pbnRlcnZhbCgpICsgJyBtc2VjJyksXG4gICAgICBdKSxcbiAgICAgIG0oJy5UaW1lcl9fVGFwQnV0dG9uJywge1xuICAgICAgICBvbmNsaWNrOiA6OnZtLm9uQ2xpY2tcbiAgICAgIH0sICdUQVAnKSxcbiAgICBdKTtcbiAgfVxufTtcbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IG0gZnJvbSAnbWl0aHJpbCc7XG5pbXBvcnQgQXBwIGZyb20gJy4vY29tcG9uZW50L0FwcCc7XG5cbm0ubW91bnQoZG9jdW1lbnQuZ2V0RWxlbWVudEJ5SWQoJ0FwcCcpLCBBcHApO1xuIiwiJ3VzZSBzdHJpY3QnO1xuXG5pbXBvcnQgTm9kZSBmcm9tICcuL05vZGUnO1xuXG5jbGFzcyBEaXN0b3J0aW9uIGV4dGVuZHMgTm9kZSB7XG5cbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLndhdmVzaGFwZXIgPSB0aGlzLmN0eC5jcmVhdGVXYXZlU2hhcGVyKCk7XG4gICAgdGhpcy5kaXN0b3J0aW9uID0gMC4wO1xuXG4gICAgdGhpcy5saW1pdGVyICAgICAgICAgICAgICAgICA9IHRoaXMuY3R4LmNyZWF0ZUR5bmFtaWNzQ29tcHJlc3NvcigpO1xuICAgIHRoaXMubGltaXRlci50aHJlc2hvbGQudmFsdWUgPSAwO1xuICAgIHRoaXMubGltaXRlci5yYXRpby52YWx1ZSAgICAgPSAyMDtcbiAgICB0aGlzLmxpbWl0ZXIuYXR0YWNrLnZhbHVlICAgID0gMDtcblxuICAgIHRoaXMuaW5wdXQuY29ubmVjdCh0aGlzLndhdmVzaGFwZXIpO1xuICAgIHRoaXMud2F2ZXNoYXBlci5jb25uZWN0KHRoaXMubGltaXRlcik7XG4gICAgdGhpcy5saW1pdGVyLmNvbm5lY3QodGhpcy53ZXQpO1xuXG4gICAgdGhpcy51cGRhdGVUYWJsZSgpO1xuICB9XG5cbiAgc2V0RGlzdG9ydGlvbiAoZGlzdG9ydGlvbikge1xuICAgIHRoaXMuZGlzdG9ydGlvbiA9IGRpc3RvcnRpb247XG4gICAgdGhpcy51cGRhdGVUYWJsZSgpO1xuICB9XG5cbiAgc2V0Vm9sdW1lICh2b2x1bWUpIHtcbiAgICB0aGlzLm91dHB1dC5nYWluLnZhbHVlID0gdm9sdW1lO1xuICB9XG5cbiAgdXBkYXRlVGFibGUgKCkge1xuICAgIGlmICgodGhpcy5kaXN0b3J0aW9uID49IDEpICYmICh0aGlzLmRpc3RvcnRpb24gPCAzKSkge1xuICAgICAgY29uc3QgRklORSA9IDIwNDg7XG4gICAgICBjb25zdCBIQUxGID0gRklORSAvIDI7XG4gICAgICBsZXQgdGFibGUgID0gbmV3IEZsb2F0MzJBcnJheShGSU5FKTtcblxuICAgICAgY29uc3QgYmlhc2VkID0gTWF0aC5wb3codGhpcy5kaXN0b3J0aW9uLCA1KTtcbiAgICAgIGZvciAodmFyIGkgPSAwOyBpIDwgRklORTsgaSsrKSB7XG4gICAgICAgIGxldCB4ID0gaSAtIEhBTEY7XG4gICAgICAgIGxldCB5ID0gYmlhc2VkICogeCAvIEhBTEY7XG4gICAgICAgIHRhYmxlW2ldID0gTWF0aC5tYXgoTWF0aC5taW4oeSwgMS4wKSwgLTEuMCk7XG4gICAgICB9XG5cbiAgICAgIHRoaXMud2F2ZXNoYXBlci5jdXJ2ZSA9IHRhYmxlO1xuICAgIH1cbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IERpc3RvcnRpb247XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCB7IEV2ZW50RW1pdHRlciB9IGZyb20gJ2V2ZW50cyc7XG5cbmNvbnN0IFRIUkVTSE9MRCA9IC0wLjM7XG5jb25zdCBnZW4gPSAobiwgZSkgPT4ge2xldCBnXzsgcmV0dXJuIChnXyA9IChuLCBhY2MpID0+IG4gPD0gMCA/IGFjYyA6IGdfKG4tMSwgWy4uLmFjYywgZV0pKShuLCBbXSl9O1xuY29uc3QgQlVUVE9OUyA9IGdlbigxMiwge3ByZXNzZWQ6IGZhbHNlfSk7XG5cbmNvbnN0IEtFWVMgPSB7XG4gIDQ5IDogNSxcbiAgNTAgOiAxLFxuICA1MSA6IDAsXG4gIDE3IDogOSxcbiAgMTYgOiA4LFxufTtcblxuY2xhc3MgR2FtZXBhZCBleHRlbmRzIEV2ZW50RW1pdHRlciB7XG5cbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHN1cGVyKCk7XG5cbiAgICB0aGlzLnRpbWVyICAgICA9IG51bGw7XG4gICAgdGhpcy5pc1BsYXlpbmcgPSBmYWxzZTtcblxuICAgIHRoaXMuYnV0dG9ucyA9IEJVVFRPTlM7XG5cbiAgICB0aGlzLmlzU2ltdWxhdGluZyA9IHRydWU7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2dhbWVwYWRjb25uZWN0ZWQnLCAoKSA9PiB0aGlzLmlzU2ltdWxhdGluZyA9IGZhbHNlKTtcblxuICAgIHRoaXMuc2ltdWxhdGUoKVxuICAgIHRoaXMuc3RhcnRQb2xsaW5nKCk7XG4gIH1cblxuICB0b2dnbGVTaW11bGF0ZSAoKSB7XG4gICAgdGhpcy5pc1NpbXVsYXRpbmcgPSAhdGhpcy5pc1NpbXVsYXRpbmc7XG4gIH1cblxuICBzdGFydFBvbGxpbmcgKCkge1xuICAgIHRoaXMudGltZXIgPSBzZXRJbnRlcnZhbCg6OnRoaXMucG9sbCwgMTApO1xuICB9XG5cbiAgc3RvcFBvbGxpbmcgKCkge1xuICAgIGNsZWFySW50ZXJ2YWwodGhpcy50aW1lcik7XG4gIH1cblxuICBwb2xsICgpIHtcbiAgICBpZiAodGhpcy5pc1NpbXVsYXRpbmcpIHsgcmV0dXJuOyB9XG4gICAgY29uc3QgY2FuZGlkYXRlcyA9IG5hdmlnYXRvci5nZXRHYW1lcGFkcygpO1xuICAgIGlmICghY2FuZGlkYXRlcyB8fCBjYW5kaWRhdGVzLmxlbmd0aCA9PT0gMCkgeyByZXR1cm47IH1cbiAgICBjb25zdCBwYWRzID0gT2JqZWN0LmtleXMoY2FuZGlkYXRlcykubWFwKGsgPT4gY2FuZGlkYXRlc1trXSkuZmlsdGVyKHAgPT4gcCk7XG4gICAgaWYgKCFwYWRzIHx8IHBhZHMubGVuZ3RoID09PSAwKSB7IHJldHVybjsgfVxuICAgIC8vIGNvbnN0IHBhZCA9IHBhZHMuZmlsdGVyKCkgIC8vIFRPRE8gOmZpbHRlciBvbmx5IEd1aXRhckZyZWFrIENvbnRyb2xsZXJcbiAgICBjb25zdCBwYWQgPSBwYWRzWzBdO1xuXG4gICAgdGhpcy5idXR0b25zID0gcGFkLmJ1dHRvbnM7XG5cbiAgICB0aGlzLmVtaXQoJ2J1dHRvbnMnLCB0aGlzLmJ1dHRvbnMpO1xuXG4gICAgaWYgKHBhZC5heGVzWzFdIDwgVEhSRVNIT0xEICYmICF0aGlzLmlzUGxheWluZykge1xuICAgICAgdGhpcy5lbWl0KCdub3RlT24nKTtcbiAgICAgIHRoaXMuaXNQbGF5aW5nID0gdHJ1ZTtcbiAgICB9XG4gICAgaWYgKHBhZC5heGVzWzFdID49IFRIUkVTSE9MRCAmJiB0aGlzLmlzUGxheWluZykge1xuICAgICAgdGhpcy5lbWl0KCdub3RlT2ZmJyk7XG4gICAgICB0aGlzLmlzUGxheWluZyA9IGZhbHNlO1xuICAgIH1cblxuICB9XG5cbiAgc2ltdWxhdGUgKCkge1xuICAgIHdpbmRvdy5hZGRFdmVudExpc3RlbmVyKCdrZXlkb3duJywgKGUpID0+IHtcbiAgICAgIGlmICghdGhpcy5pc1NpbXVsYXRpbmcpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgICBpZiAoS0VZU1tlLmtleUNvZGVdICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5idXR0b25zW0tFWVNbZS5rZXlDb2RlXV0gPSB7IHByZXNzZWQ6IHRydWUgfTtcbiAgICAgICAgdGhpcy5lbWl0KCdidXR0b25zJywgdGhpcy5idXR0b25zKTtcbiAgICAgIH1cbiAgICAgIGlmIChlLmtleUNvZGUgPT09IDQwICYmICF0aGlzLmlzUGxheWluZykge1xuICAgICAgICB0aGlzLmVtaXQoJ25vdGVPbicpO1xuICAgICAgICB0aGlzLmlzUGxheWluZyA9IHRydWU7XG4gICAgICB9XG4gICAgfSk7XG4gICAgd2luZG93LmFkZEV2ZW50TGlzdGVuZXIoJ2tleXVwJywgKGUpID0+IHtcbiAgICAgIGlmICghdGhpcy5pc1NpbXVsYXRpbmcpIHsgcmV0dXJuIGZhbHNlOyB9XG4gICAgICBpZiAoS0VZU1tlLmtleUNvZGVdICE9IG51bGwpIHtcbiAgICAgICAgdGhpcy5idXR0b25zW0tFWVNbZS5rZXlDb2RlXV0gPSB7IHByZXNzZWQ6IGZhbHNlIH07XG4gICAgICAgIHRoaXMuZW1pdCgnYnV0dG9ucycsIHRoaXMuYnV0dG9ucyk7XG4gICAgICB9XG4gICAgICBpZiAoZS5rZXlDb2RlID09PSA0MCAmJiB0aGlzLmlzUGxheWluZykge1xuICAgICAgICB0aGlzLmVtaXQoJ25vdGVPZmYnKTtcbiAgICAgICAgdGhpcy5pc1BsYXlpbmcgPSBmYWxzZTtcbiAgICAgICAgdGhpcy5idXR0b25zID0gQlVUVE9OUztcbiAgICAgIH1cbiAgICB9KTtcbiAgfVxuXG59XG5cbmV4cG9ydCBkZWZhdWx0IEdhbWVwYWQ7XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBjdHggZnJvbSAnLi4vQ3R4JztcblxuY2xhc3MgTm9kZSB7XG5cbiAgY29uc3RydWN0b3IgKCkge1xuICAgIHRoaXMuY3R4ID0gY3R4O1xuICAgIHRoaXMuaW5wdXQgID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgIHRoaXMub3V0cHV0ID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgIHRoaXMuZHJ5ICAgID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuICAgIHRoaXMud2V0ICAgID0gdGhpcy5jdHguY3JlYXRlR2FpbigpO1xuXG4gICAgdGhpcy5pbnB1dC5jb25uZWN0KHRoaXMuZHJ5KTtcbiAgICB0aGlzLmRyeS5jb25uZWN0KHRoaXMub3V0cHV0KTtcbiAgICB0aGlzLndldC5jb25uZWN0KHRoaXMub3V0cHV0KTtcblxuICAgIHRoaXMuZHJ5R2FpbiA9IDAuMDtcbiAgICB0aGlzLndldEdhaW4gPSAxLjA7XG4gICAgdGhpcy51cGRhdGVNaXgodGhpcy5kcnlHYWluLCB0aGlzLndldEdhaW4pO1xuXG4gICAgdGhpcy5pc09uID0gdHJ1ZTtcbiAgfVxuXG4gIGNvbm5lY3QgKGRzdCkge1xuICAgIHRoaXMub3V0cHV0LmNvbm5lY3QoZHN0KTtcbiAgfVxuXG4gIGRpc2Nvbm5lY3QgKGRzdCkge1xuICAgIHRoaXMub3V0cHV0LmRpc2Nvbm5lY3QoZHN0KTtcbiAgfVxuXG4gIHNldE1peCAod2V0KSB7XG4gICAgaWYgKHdldCA8IDAgfHwgMS4wIDwgd2V0KSB7XG4gICAgICB0aHJvdyBuZXcgUmFuZ2VFcnJvcignc2V0TWl4IDogd2V0IG11c3QgYmUgMC4wIHRvIDEuMCcpO1xuICAgIH1cbiAgICB0aGlzLndldEdhaW4gPSB3ZXQ7XG4gICAgdGhpcy5kcnlHYWluID0gMS4wIC0gd2V0O1xuICAgIHRoaXMudXBkYXRlTWl4KHRoaXMud2V0R2FpbiwgdGhpcy5kcnlHYWluKTtcbiAgfVxuXG4gIHVwZGF0ZU1peCAoZHJ5LCB3ZXQpIHtcbiAgICB0aGlzLmRyeS5nYWluLnZhbHVlID0gZHJ5O1xuICAgIHRoaXMud2V0LmdhaW4udmFsdWUgPSB3ZXQ7XG4gIH1cblxuICB0b2dnbGUgKCkge1xuICAgIHRoaXMuaXNPbiA9ICF0aGlzLmlzT247XG4gICAgaWYgKHRoaXMuaXNPbikge1xuICAgICAgdGhpcy51cGRhdGVNaXgodGhpcy5kcnlHYWluLCB0aGlzLndldEdhaW4pO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgIHRoaXMudXBkYXRlTWl4KDEuMCwgMC4wKTtcbiAgICB9XG4gIH1cbn1cblxuZXhwb3J0IGRlZmF1bHQgTm9kZTtcbiIsIid1c2Ugc3RyaWN0JztcblxuaW1wb3J0IE5vZGUgZnJvbSAnLi9Ob2RlJztcbmltcG9ydCB7RXZlbnRFbWl0dGVyfSBmcm9tICdldmVudHMnO1xuXG5jbGFzcyBTYW1wbGUgZXh0ZW5kcyBOb2RlIHtcblxuICBjb25zdHJ1Y3RvciAodXJsKSB7XG4gICAgc3VwZXIoKTtcbiAgICB0aGlzLnBsYXliYWNrUmF0ZSA9IDEuMDtcbiAgICB0aGlzLmJlbmRSYXRlICAgICA9IDEuMDtcblxuICAgIHRoaXMuZXZlbnRFbWl0dGVyID0gbmV3IEV2ZW50RW1pdHRlcigpO1xuXG4gICAgdGhpcy5vbignc2FtcGxlTG9hZFN1Y2NlZWRlZCcsIChidWZmZXIpID0+IHtcbiAgICAgIHRoaXMuYnVmZmVyID0gYnVmZmVyO1xuICAgICAgdGhpcy5lbWl0KCd3YXZlTG9hZGVkJywgdGhpcy5idWZmZXIuZ2V0Q2hhbm5lbERhdGEoMCkpO1xuICAgIH0pO1xuICB9XG5cbiAgb24gKCkge1xuICAgIHRoaXMuZXZlbnRFbWl0dGVyLm9uLmFwcGx5KHRoaXMuZXZlbnRFbWl0dGVyLCBhcmd1bWVudHMpO1xuICB9XG5cbiAgZW1pdCAoKSB7XG4gICAgdGhpcy5ldmVudEVtaXR0ZXIuZW1pdC5hcHBseSh0aGlzLmV2ZW50RW1pdHRlciwgYXJndW1lbnRzKTtcbiAgfVxuXG4gIHBsYXkgKCkge1xuICAgIGlmICh0aGlzLm5vZGUpIHsgdGhpcy5ub2RlLnN0b3AoMCk7IH1cbiAgICB0aGlzLm5vZGUgPSB0aGlzLmN0eC5jcmVhdGVCdWZmZXJTb3VyY2UoKTtcbiAgICB0aGlzLm5vZGUuYnVmZmVyID0gdGhpcy5idWZmZXI7XG4gICAgdGhpcy5ub2RlLnBsYXliYWNrUmF0ZS52YWx1ZSA9IHRoaXMucGxheWJhY2tSYXRlICogdGhpcy5iZW5kUmF0ZTtcbiAgICB0aGlzLm5vZGUuY29ubmVjdCh0aGlzLndldCk7XG4gICAgdGhpcy5ub2RlLnN0YXJ0KDApO1xuICB9XG5cbiAgbG9hZFNhbXBsZSAodXJsKSB7XG4gICAgdGhpcy5iYXNlbmFtZSA9IHVybC5zcGxpdCgnLycpLnBvcCgpO1xuXG4gICAgdmFyIHJlcSA9IG5ldyBYTUxIdHRwUmVxdWVzdCgpO1xuICAgIHJlcS5vcGVuKCdHRVQnLCB1cmwsIHRydWUpO1xuICAgIHJlcS5yZXNwb25zZVR5cGUgPSAnYXJyYXlidWZmZXInO1xuXG4gICAgcmVxLm9ubG9hZCA9ICgpID0+IHtcbiAgICAgIGlmICghcmVxLnJlc3BvbnNlKSB7XG4gICAgICAgIHRoaXMuZW1pdCgnc2FtcGxlTG9hZEZhaWxlZCcsIG5ldyBFcnJvcignbm8gcmVzcG9uc2UnKSk7XG4gICAgICB9XG4gICAgICB0aGlzLmN0eC5kZWNvZGVBdWRpb0RhdGEocmVxLnJlc3BvbnNlLCAoYnVmZmVyKSA9PiB7XG4gICAgICAgIHRoaXMuZW1pdCgnc2FtcGxlTG9hZFN1Y2NlZWRlZCcsIGJ1ZmZlcik7XG4gICAgICB9LCAoZXJyKSA9PiB7XG4gICAgICAgIHRoaXMuZW1pdCgnc2FtcGxlTG9hZEZhaWxlZCcsIGVycik7XG4gICAgICB9KTtcbiAgICB9O1xuXG4gICAgcmVxLnNlbmQoKTtcbiAgfVxuXG4gIHNldFBsYXliYWNrUmF0ZSAocGxheWJhY2tSYXRlKSB7XG4gICAgdGhpcy5wbGF5YmFja1JhdGUgPSBwbGF5YmFja1JhdGU7XG4gIH1cblxuICBiZW5kIChpc0JlbmRpbmcpIHtcbiAgICBpZiAoaXNCZW5kaW5nKSB7XG4gICAgICB0aGlzLmJlbmRSYXRlICs9ICg1LjAgLSB0aGlzLmJlbmRSYXRlKSAqIDAuMTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICB0aGlzLmJlbmRSYXRlIC09ICh0aGlzLmJlbmRSYXRlIC0gMS4wKSAqIDAuNjtcbiAgICB9XG4gIH1cblxufVxuXG5leHBvcnQgZGVmYXVsdCBTYW1wbGU7XG4iLCIndXNlIHN0cmljdCc7XG5cbmltcG9ydCBTYW1wbGUgZnJvbSAnLi9TYW1wbGUnO1xuaW1wb3J0IERpc3RvcnRpb24gZnJvbSAnLi9EaXN0b3J0aW9uJztcbmltcG9ydCBOb2RlIGZyb20gJy4vTm9kZSc7XG5cbmNvbnN0IEtJVFMgPSB7XG4gICdBTUVOJyAgOiBbXG4gICAgJy4vd2F2L2FtZW4va2lja19yaWRlLndhdicsXG4gICAgJy4vd2F2L2FtZW4vc25hcmUud2F2JyxcbiAgICAnLi93YXYvYW1lbi9raWNrX2NyYXNoLndhdicsXG4gIF0sXG4gICdHQUJCQScgOiBbXG4gICAgJy4vd2F2L2dhYmJhL2JkLndhdicsXG4gICAgJy4vd2F2L2dhYmJhL2NsYXAud2F2JyxcbiAgICAnLi93YXYvZ2FiYmEvaGF0X29wZW4ud2F2JyxcbiAgXSxcbn07XG5cbmNsYXNzIFNhbXBsZXIgZXh0ZW5kcyBOb2RlIHtcblxuICBjb25zdHJ1Y3RvciAoKSB7XG4gICAgc3VwZXIoKTtcblxuICAgIHRoaXMuc2FtcGxlcyA9IFtuZXcgU2FtcGxlKCksIG5ldyBTYW1wbGUoKSwgbmV3IFNhbXBsZSgpXTtcblxuICAgIHRoaXMua2l0ID0gJ0FNRU4nO1xuICAgIEtJVFNbdGhpcy5raXRdLm1hcCgodXJsLCBpKSA9PiB7XG4gICAgICB0aGlzLnNhbXBsZXNbaV0ubG9hZFNhbXBsZSh1cmwpO1xuICAgIH0pO1xuXG4gICAgdGhpcy5kaXN0b3J0aW9ucyA9IFtcbiAgICAgIG5ldyBEaXN0b3J0aW9uKCksXG4gICAgICBuZXcgRGlzdG9ydGlvbigpLFxuICAgICAgbmV3IERpc3RvcnRpb24oKSxcbiAgICBdO1xuXG4gICAgdGhpcy5zYW1wbGVzLmZvckVhY2goKHMsIGkpID0+IHMuY29ubmVjdCh0aGlzLmRpc3RvcnRpb25zW2ldLmlucHV0KSk7XG4gICAgdGhpcy5kaXN0b3J0aW9ucy5mb3JFYWNoKGQgPT4gZC5jb25uZWN0KHRoaXMud2V0KSk7XG4gIH1cblxuICBjaGFuZ2VLaXQgKGtpdCkge1xuICAgIHRoaXMua2l0ID0ga2l0O1xuICAgIEtJVFNbdGhpcy5raXRdLmZvckVhY2goKHVybCwgaSkgPT4ge1xuICAgICAgdGhpcy5zYW1wbGVzW2ldLmxvYWRTYW1wbGUodXJsKTtcbiAgICB9KTtcbiAgfVxuXG4gIHBsYXlOb3RlcyAobm90ZXMpIHtcbiAgICBub3Rlcy5mb3JFYWNoKDo6dGhpcy5wbGF5Tm90ZSk7XG4gIH1cblxuICBwbGF5Tm90ZSAobm90ZSkge1xuICAgIGlmICghdGhpcy5zYW1wbGVzW25vdGVdKSB7IHJldHVybjsgfVxuICAgIHRoaXMuc2FtcGxlc1tub3RlXS5wbGF5KCk7XG4gIH1cblxuICBiZW5kIChpc0JlbmRpbmcpIHtcbiAgICB0aGlzLnNhbXBsZXMubWFwKHMgPT4gcy5iZW5kKGlzQmVuZGluZykpO1xuICB9XG5cbn1cblxuZXhwb3J0IGRlZmF1bHQgU2FtcGxlcjtcbiJdfQ==
