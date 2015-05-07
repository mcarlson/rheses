
/*
 * The MIT License (MIT)
#
 * Copyright ( c ) 2015 Teem2 LLC
#
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
#
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
#
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

(function() {
  var hackstyle, stylemap,
    slice = [].slice,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  stylemap = {
    bold: 'fontWeight',
    bordercolor: 'borderColor',
    borderstyle: 'borderStyle',
    bottomborder: 'borderBottomWidth',
    bottompadding: 'paddingBottom',
    boxshadow: 'boxShadow',
    bgcolor: 'backgroundColor',
    ellipsis: 'textOverflow',
    fontfamily: 'fontFamily',
    fontweight: 'fontWeight',
    texttransform: 'textTransform',
    fontsize: 'fontSize',
    italic: 'fontStyle',
    leftborder: 'borderLeftWidth',
    leftpadding: 'paddingLeft',
    rightborder: 'borderRightWidth',
    rightpadding: 'paddingRight',
    smallcaps: 'fontVariant',
    topborder: 'borderTopWidth',
    toppadding: 'paddingTop',
    visible: 'visibility',
    whitespace: 'whiteSpace',
    x: 'marginLeft',
    y: 'marginTop',
    z: 'z-index'
  };

  hackstyle = (function() {
  var monitoredJQueryStyleProps, origstyle, prop, styletap, value;

  monitoredJQueryStyleProps = {};

  for (prop in stylemap) {
    value = stylemap[prop];
    monitoredJQueryStyleProps[value] = prop;
  }

  origstyle = $.style;

  styletap = function(elem, name, value) {
    var attrName, view;
    attrName = monitoredJQueryStyleProps[name];
    if (attrName == null) {
      attrName = monitoredJQueryStyleProps[name.replace(/-([a-z])/i, function(m) {
        return m[1].toUpperCase();
      })];
      attrName = monitoredJQueryStyleProps[name] = attrName ? attrName : name;
    }
    if (attrName) {
      view = elem.$view;
      if (view[attrName] !== value) {
        view.setAttribute(attrName, value);
      }
    }
    return origstyle.apply(this, arguments);
  };

  return function(active) {
    if (active) {
      return $.style = styletap;
    } else {
      return $.style = origstyle;
    }
  };

}).call(this);
;

  window.dr = (function() {
    var ArtSprite, AutoPropertyLayout, BitmapSprite, COMMENT_NODE, Class, Eventable, Events, Idle, InputTextSprite, Keyboard, Layout, Module, Mouse, Node, Path, Sprite, StartEventable, State, TextSprite, View, Window, _initConstraints, _processAttrs, callOnIdle, capabilities, clone, closeTo, compiler, constraintScopes, debug, dom, eventq, exports, handlerq, idle, ignoredAttributes, instantiating, matchEvent, matchPercent, mixOf, mouseEvents, noop, querystring, reverseSort, showWarnings, specialtags, starttime, tagPackageSeparator, test, warnings;
    COMMENT_NODE = window.Node.COMMENT_NODE;
    noop = function() {};
    closeTo = function(a, b, epsilon) {
      epsilon || (epsilon = 0.01);
      return Math.abs(a - b) < epsilon;
    };
    mixOf = function() {
      var Mixed, base, i, j, method, mixin, mixins, name, ref;
      base = arguments[0], mixins = 2 <= arguments.length ? slice.call(arguments, 1) : [];
      Mixed = (function(superClass) {
        extend(Mixed, superClass);

        function Mixed() {
          return Mixed.__super__.constructor.apply(this, arguments);
        }

        return Mixed;

      })(base);
      for (i = j = mixins.length - 1; j >= 0; i = j += -1) {
        mixin = mixins[i];
        ref = mixin.prototype;
        for (name in ref) {
          method = ref[name];
          Mixed.prototype[name] = method;
        }
      }
      return Mixed;
    };
    reverseSort = function(a, b) {
      if (a < b) {
        return 1;
      }
      if (b < a) {
        return -1;
      }
      return 0;
    };
    matchPercent = /%$/;
    Events = 
/**
 * @class Events
 * @private
 * A lightweight event system, used internally.
 */

(function() {
  var Events,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Events = {
    triggerlock: null,

    /**
     * Registers one or more events with the current scope
     * @param {String} ev the name of the event, or event names if separated by spaces.
     * @param {Function} callback called when the event is fired
     */
    register: function(ev, callback) {
      var base, evs, j, len, name;
      evs = ev.split(' ');
      if (!(this.hasOwnProperty('events') && this.events)) {
        this.events = {};
      }
      for (j = 0, len = evs.length; j < len; j++) {
        name = evs[j];
        (base = this.events)[name] || (base[name] = []);
        this.events[name].push(callback);
      }
      return this;
    },

    /**
     * Registers an event with the current scope, automatically unregisters when the event fires
     * @param {String} ev the name of the event
     * @param {Function} callback called when the event is fired
     */
    one: function(ev, callback) {
      this.register(ev, function() {
        this.unregister(ev, arguments.callee);
        return callback.apply(this, arguments);
      });
      return this;
    },

    /**
     * Fires an event
     * @param {String} ev the name of the event to fire
     */
    trigger: function(ev, value, scope) {
      var callback, j, len, list, ref;
      list = this.hasOwnProperty('events') && ((ref = this.events) != null ? ref[ev] : void 0);
      if (!list) {
        return;
      }
      if (this.triggerlock) {
        if (indexOf.call(this.triggerlock, ev) >= 0) {
          return this;
        }
        this.triggerlock.push(ev);
      } else {
        this.triggerlock = [ev];
      }
      for (j = 0, len = list.length; j < len; j++) {
        callback = list[j];
        callback.call(this, value, scope);
      }
      this.triggerlock = null;
      return this;
    },

    /**
     * Listens for an event on a specific scope
     * @param {Object} obj scope to listen for events on
     * @param {String} ev the name of the event
     * @param {Function} callback called when the event is fired
     */
    listenTo: function(obj, ev, callback) {
      obj.register(ev, callback);
      this.listeningTo || (this.listeningTo = []);
      this.listeningTo.push({
        obj: obj,
        ev: ev,
        callback: callback
      });
      return this;
    },

    /**
     * Only listens for an event one time
     * @param {Object} obj scope to listen for events on
     * @param {String} ev the name of the event
     * @param {Function} callback called when the event is fired
     */
    listenToOnce: function(obj, ev, callback) {
      var listeningToOnce;
      listeningToOnce = this.listeningToOnce || (this.listeningToOnce = []);
      listeningToOnce.push(obj);
      obj.one(ev, function() {
        var idx;
        idx = listeningToOnce.indexOf(obj);
        if (idx !== -1) {
          listeningToOnce.splice(idx, 1);
        }
        return callback.apply(this, arguments);
      });
      return this;
    },

    /**
     * Stops listening for an event on a given scope
     * @param {Object} obj scope to listen for events on
     * @param {String} ev the name of the event
     * @param {Function} callback called when the event would have been fired
     */
    stopListening: function(obj, ev, callback) {
      var idx, index, j, k, l, len, len1, len2, listeningTo, ref, ref1, ref2, val;
      if (obj) {
        obj.unregister(ev, callback);
        ref = [this.listeningTo, this.listeningToOnce];
        for (j = 0, len = ref.length; j < len; j++) {
          listeningTo = ref[j];
          if (!listeningTo) {
            continue;
          }
          idx = listeningTo.indexOf(obj);
          if (idx > -1) {
            listeningTo.splice(idx, 1);
          } else {
            for (index = k = 0, len1 = listeningTo.length; k < len1; index = ++k) {
              val = listeningTo[index];
              if (obj === val.obj && ev === val.ev && callback === val.callback) {
                listeningTo.splice(index, 1);
                break;
              }
            }
          }
        }
      } else {
        ref1 = this.listeningTo;
        for (l = 0, len2 = ref1.length; l < len2; l++) {
          ref2 = ref1[l], obj = ref2.obj, ev = ref2.ev, callback = ref2.callback;
          obj.unregister(ev, callback);
        }
        this.listeningTo = void 0;
      }
      return this;
    },

    /**
     * Stops listening for an event on the current scope
     * @param {String} ev the name of the event
     * @param {Function} callback called when the event would have been fired
     */
    unregister: function(ev, callback) {
      var cb, evs, i, j, k, len, len1, list, name, ref;
      if (!ev) {
        this.events = {};
        return this;
      }
      evs = ev.split(' ');
      for (j = 0, len = evs.length; j < len; j++) {
        name = evs[j];
        list = (ref = this.events) != null ? ref[name] : void 0;
        if (!list) {
          continue;
        }
        if (!callback) {
          delete this.events[name];
          continue;
        }
        for (i = k = 0, len1 = list.length; k < len1; i = ++k) {
          cb = list[i];
          if (!(cb === callback)) {
            continue;
          }
          list = list.slice();
          list.splice(i, 1);
          this.events[name] = list;
          break;
        }
      }
      return this;
    }
  };

  return Events;

}).call(this);
;
    Module = 
/**
 * @class Module
 * @private
 * Adds basic mixin support.
 */

(function() {
  var Module, moduleKeywords,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  moduleKeywords = ['included', 'extended'];

  Module = (function() {
    function Module() {}


    /**
     * Includes a mixin in the current scope
     * @param {Object} obj the object to be mixed in
     */

    Module.include = function(obj) {
      var key, ref, value;
      if (!obj) {
        throw new Error('include(obj) requires obj');
      }
      for (key in obj) {
        value = obj[key];
        if (indexOf.call(moduleKeywords, key) < 0) {
          this.prototype[key] = value;
        }
      }
      if ((ref = obj.included) != null) {
        ref.call(this, obj);
      }
      return this;
    };

    return Module;

  })();

  return Module;

}).call(this);
;
    ignoredAttributes = {
      parent: true,
      id: true,
      name: true,
      "extends": true,
      type: true,
      scriptincludes: true
    };
    Eventable = 
/**
 * @class Eventable {Core Dreem}
 * @extends Module
 * The baseclass used by everything in dreem. Adds higher level event APIs.
 */

(function() {
  var Eventable,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Eventable = (function(superClass) {

    /**
     * @method include
     * @hide
     */
    var typemappings;

    extend(Eventable, superClass);

    function Eventable() {
      return Eventable.__super__.constructor.apply(this, arguments);
    }

    Eventable.include(Events);

    typemappings = {
      number: parseFloat,
      boolean: function(v) {
        if (typeof v === 'string') {
          return v === 'true';
        } else {
          return !!v;
        }
      },
      string: function(v) {
        return v + '';
      },
      json: function(v) {
        return JSON.parse(v);
      },
      expression: function(v) {
        if (typeof v !== 'string') {
          return v;
        } else {
          return compiler.compile("return " + v)();
        }
      },
      positivenumber: function(v) {
        v = parseFloat(v);
        if (isNaN(v)) {
          return 0;
        } else {
          return Math.max(0, v);
        }
      },
      emptynumber: function(v) {
        if ((v == null) || v === '') {
          return '';
        } else {
          return parseFloat(v);
        }
      },
      size: function(v) {
        if (matchPercent.test(v) || v === 'auto') {
          return v;
        } else {
          v = parseFloat(v);
          if (isNaN(v)) {
            return 0;
          } else {
            return Math.max(0, v);
          }
        }
      },
      x: function(v) {
        var normValue;
        if (matchPercent.test(v)) {
          return v;
        } else {
          if (typeof v === 'string') {
            normValue = v.toLowerCase();
            switch (normValue) {
              case 'begin':
              case 'middle':
              case 'end':
              case 'left':
              case 'right':
              case 'center':
              case 'none':
                return normValue;
              default:
                v = parseFloat(v);
            }
          }
          if (isNaN(v)) {
            v = this.x;
            if (isNaN(v)) {
              return 0;
            } else {
              return v;
            }
          } else {
            return v;
          }
        }
      },
      y: function(v) {
        var normValue;
        if (matchPercent.test(v)) {
          return v;
        } else {
          if (typeof v === 'string') {
            normValue = v.toLowerCase();
            switch (normValue) {
              case 'begin':
              case 'middle':
              case 'end':
              case 'top':
              case 'bottom':
              case 'center':
              case 'none':
                return normValue;
              default:
                v = parseFloat(v);
            }
          }
          if (isNaN(v)) {
            v = this.y;
            if (isNaN(v)) {
              return 0;
            } else {
              return v;
            }
          } else {
            return v;
          }
        }
      }
    };

    Eventable.prototype._coerceType = function(name, value, type) {
      var e;
      type || (type = this.types[name]);
      if (type) {
        if (debug || test) {
          if (!typemappings[type]) {
            showWarnings(["Invalid type '" + type + "' for attribute '" + name + "', must be one of: " + (Object.keys(typemappings).join(', '))]);
            return;
          }
          try {
            value = typemappings[type].call(this, value);
          } catch (_error) {
            e = _error;
            showWarnings(["error parsing " + type + " value '" + value + "' for attribute '" + name + "'"]);
          }
        } else {
          value = typemappings[type].call(this, value);
        }
        if (type === 'number' && isNaN(value)) {
          value = this[name];
          if (isNaN(value)) {
            value = 0;
          }
        }
      } else if (value == null) {
        value = '';
      }
      return value;
    };


    /**
     * Sets an attribute on this object, calls a setter function if it exists.
     * Also stores the attribute in a property on the object and sends an event
     * with the new value.
     * @param {String} name the name of the attribute to set
     * @param value the value to set to
     */

    Eventable.prototype.setAttribute = function(name, value, skipconstraintunregistration) {
      var setterName;
      value = this._coerceType(name, value);
      if (!skipconstraintunregistration) {
        this._unbindConstraint(name);
      }
      setterName = "set_" + name;
      if (typeof this[setterName] === 'function') {
        value = this[setterName](value);
        if (value === noop) {
          return this;
        }
      }
      if (name in ignoredAttributes) {
        this.setAndFire(name, value);
      } else {
        this.defaultSetAttributeBehavior(name, value);
      }
      return this;
    };


    /**
     * The default behavior to execute in setAttribute once setters have been
     * run. Stores the value on this object and fires an event.
     * @param {String} name the name of the attribute to set
     * @param value the value to set to
     */

    Eventable.prototype.defaultSetAttributeBehavior = function(name, value) {
      return this.setAndFire(name, value);
    };


    /**
     * Stores the value on this object and fires an event.
     * @param {String} name the name of the attribute to set
     * @param value the value to set to
     */

    Eventable.prototype.setAndFire = function(name, value) {
      return this.sendEvent(name, this[name] = value);
    };


    /**
     * Sends an event
     * @param {String} name the name of the event to send
     * @param value the value to send with the event
     */

    Eventable.prototype.sendEvent = function(name, value) {
      var ref;
      if (instantiating) {
        eventq.push({
          scope: this,
          name: name,
          value: value
        });
        return;
      }
      if ((ref = this.events) != null ? ref[name] : void 0) {
        this.trigger(name, value, this);
      }
      return this;
    };


    /**
     * Calls setAttribute for each name/value pair in the attributes object
     * @param {Object} attributes An object of name/value pairs to be set
     */

    Eventable.prototype.setAttributes = function(attributes) {
      var name, value;
      for (name in attributes) {
        value = attributes[name];
        this.setAttribute(name, value);
      }
      return this;
    };

    return Eventable;

  })(Module);

  return Eventable;

}).call(this);
;
    capabilities = (function() {
  return {
    localStorage: (function() {
      var e, mod;
      mod = 'dr';
      try {
        localStorage.setItem(mod, mod);
        localStorage.removeItem(mod);
        return true;
      } catch (_error) {
        e = _error;
        return false;
      }
    })(),
    touch: 'ontouchstart' in window || 'onmsgesturechange' in window,
    camelcss: navigator.userAgent.toLowerCase().indexOf('firefox') > -1,
    raf: window.requestAnimationFrame || window.webkitRequestAnimationFrame || window.mozRequestAnimationFrame || window.oRequestAnimationFrame || window.msRequestAnimationFrame,
    prefix: (function() {
      var dom, pre, styles;
      styles = window.getComputedStyle(document.documentElement, '');
      pre = (Array.prototype.slice.call(styles).join('').match(/-(moz|webkit|ms)-/) || (styles.OLink === '' && ['', 'o']))[1];
      dom = 'WebKit|Moz|MS|O'.match(new RegExp('(' + pre + ')', 'i'))[1];
      return {
        dom: dom,
        lowercase: pre,
        css: '-' + pre + '-',
        js: pre[0].toUpperCase() + pre.substr(1)
      };
    })()
  };

}).call(this);
;
    querystring = window.location.search;
    debug = querystring.indexOf('debug') > 0;
    test = querystring.indexOf('test') > 0;
    compiler = (function() {
  var cacheData, cacheKey, compile, compileCache, compiledebug, findBindings, nocache, scriptCache, strict, transform, usecache;

  nocache = querystring.indexOf('nocache') > 0;

  strict = querystring.indexOf('strict') > 0;

  if (!nocache) {
    usecache = capabilities.localStorage;
  }

  cacheKey = "dreemcache";

  cacheData = localStorage.getItem(cacheKey);

  if (usecache && cacheData && cacheData.length < 5000000) {
    compileCache = JSON.parse(cacheData);
  } else {
    localStorage.clear();
    compileCache = {
      bindings: {},
      script: {
        coffee: {}
      }
    };
    if (usecache) {
      localStorage[cacheKey] = JSON.stringify(compileCache);
    }
  }

  window.addEventListener('unload', function() {
    if (usecache) {
      return localStorage[cacheKey] = JSON.stringify(compileCache);
    }
  });

  findBindings = (function() {
    var bindingCache, propertyBindings, scopes;
    bindingCache = compileCache.bindings;
    scopes = null;
    propertyBindings = {
      MemberExpression: function(n, parent) {
        var name;
        if (parent.node.type === 'CallExpression' && parent.sub === 'callee') {
          return true;
        }
        name = n.property.name;
        n = n.object;
        scopes.push({
          binding: acorn.stringify(n),
          property: name
        });
        return true;
      }
    };
    return function(expression) {
      var ast;
      if (usecache && expression in bindingCache) {
        return bindingCache[expression];
      }
      ast = acorn.parse(expression);
      scopes = [];
      acorn.walkDown(ast, propertyBindings);
      return bindingCache[expression] = scopes;
    };
  })();

  transform = (function() {
    var coffeeCache, compilers;
    coffeeCache = compileCache.script.coffee;
    compilers = {
      coffee: function(script) {
        var error;
        if (usecache && script in coffeeCache) {
          return coffeeCache[script];
        }
        if (!window.CoffeeScript) {
          console.warn('missing coffee-script.js include');
          return;
        }
        try {
          if (script) {
            return coffeeCache[script] = CoffeeScript.compile(script, {
              bare: true
            });
          }
        } catch (_error) {
          error = _error;
          return showWarnings(["error " + error + " compiling script\r\n" + script]);
        }
      }
    };
    return function(script, name) {
      if (script == null) {
        script = '';
      }
      if (!(name in compilers)) {
        return script;
      }
      return compilers[name](script);
    };
  })();

  scriptCache = {};

  compiledebug = function(script, args, name) {
    var argstring, e, func, key;
    if (script == null) {
      script = '';
    }
    if (args == null) {
      args = [];
    }
    if (name == null) {
      name = '';
    }
    argstring = args.join();
    key = script + argstring + name;
    if (key in scriptCache) {
      return scriptCache[key];
    }
    try {
      if (strict) {
        script = "\"use strict\"\n" + script;
      }
      if (name) {
        func = new Function("return function " + (name.replace('-', '_')) + "(" + argstring + "){" + script + "}")();
      } else {
        func = new Function(args, script);
      }
      return scriptCache[key] = func;
    } catch (_error) {
      e = _error;
      return showWarnings(["Failed to compile " + (e.toString()) + " " + args + " " + script]);
    }
  };

  compile = function(script, args, name) {
    var argstring, key;
    if (script == null) {
      script = '';
    }
    if (args == null) {
      args = [];
    }
    if (name == null) {
      name = '';
    }
    argstring = args.join();
    key = script + argstring + name;
    if (key in scriptCache) {
      return scriptCache[key];
    }
    return scriptCache[key] = new Function(args, script);
  };

  return {
    compile: debug ? compiledebug : compile,
    transform: transform,
    findBindings: findBindings
  };

}).call(this);
;
    constraintScopes = [];
    instantiating = false;
    handlerq = [];
    eventq = [];
    _initConstraints = function() {
      var ev, j, k, l, len, len1, len2, name, scope, value;
      instantiating = false;
      for (j = 0, len = handlerq.length; j < len; j++) {
        scope = handlerq[j];
        scope._bindHandlers();
      }
      handlerq = [];
      for (k = 0, len1 = eventq.length; k < len1; k++) {
        ev = eventq[k];
        scope = ev.scope, name = ev.name, value = ev.value;
        if (name === 'init') {
          scope.inited = true;
        }
        scope.sendEvent(name, value);
      }
      eventq = [];
      for (l = 0, len2 = constraintScopes.length; l < len2; l++) {
        scope = constraintScopes[l];
        scope._bindConstraints();
      }
      return constraintScopes = [];
    };
    clone = function(obj) {
      var name, newobj, val;
      newobj = {};
      for (name in obj) {
        val = obj[name];
        newobj[name] = val;
      }
      return newobj;
    };
    _processAttrs = function(sourceAttrs, targetAttrs) {
      var j, key, len, mixin, mixinName, mixins, propname, results, val, value;
      if (sourceAttrs["with"] != null) {
        mixins = sourceAttrs["with"].split(',').reverse();
        for (j = 0, len = mixins.length; j < len; j++) {
          mixinName = mixins[j];
          mixin = dr[mixinName.trim()];
          if (mixin) {
            _processAttrs(mixin.classattributes, targetAttrs);
          }
        }
      }
      results = [];
      for (key in sourceAttrs) {
        value = sourceAttrs[key];
        if (key === 'with') {
          continue;
        } else if ((key === '$methods' || key === '$types') && key in targetAttrs) {
          targetAttrs[key] = clone(targetAttrs[key]);
          results.push((function() {
            var results1;
            results1 = [];
            for (propname in value) {
              val = value[propname];
              if (key === '$methods' && targetAttrs[key][propname]) {
                results1.push(targetAttrs[key][propname] = targetAttrs[key][propname].concat(val));
              } else {
                results1.push(targetAttrs[key][propname] = val);
              }
            }
            return results1;
          })());
        } else if (key === '$handlers' && key in targetAttrs) {
          results.push(targetAttrs[key] = targetAttrs[key].concat(value));
        } else {
          results.push(targetAttrs[key] = value);
        }
      }
      return results;
    };
    Node = 
/**
 * @class dr.node {Core Dreem}
 * @extends Eventable
 * The nonvisual base class for everything in dreem. Handles parent/child relationships between tags.
#
 * Nodes can contain methods, handlers, setters, [constraints](#!/guide/constraints), attributes and other node instances.
#
 * Here we define a data node that contains movie data.
#
 *     <node id="data">
 *       <node>
 *         <attribute name="title" type="string" value="Bill and Teds Excellent Adventure"></attribute>
 *         <attribute name="type" type="string" value="movie"></attribute>
 *         <attribute name="year" type="string" value="1989"></attribute>
 *         <attribute name="length" type="number" value="89"></attribute>
 *       </node>
 *       <node>
 *         <attribute name="title" type="string" value="Waynes World"></attribute>
 *         <attribute name="type" type="string" value="movie"></attribute>
 *         <attribute name="year" type="string" value="1992"></attribute>
 *         <attribute name="length" type="number" value="94"></attribute>
 *       </node>
 *     </node>
#
 * This node defines a set of math helper methods. The node provides a tidy container for these related utility functions.
#
 *     <node id="utils">
 *       <method name="add" args="a,b">
 *         return a+b;
 *       </method>
 *       <method name="subtract" args="a,b">
 *         return a-b;
 *       </method>
 *     </node>
#
 * You can also create a sub-class of node to contain non visual functionality. Here is an example of an inches to metric conversion class that is instantiated with the inches value and can convert it to either cm or m.
#
 *     @example
#
 *     <class name="inchesconverter" extends="node">
 *       <attribute name="inchesval" type="number" value="0"></attribute>
#
 *       <method name="centimetersval">
 *         return this.inchesval*2.54;
 *       </method>
#
 *       <method name="metersval">
 *         return (this.inchesval*2.54)/100;
 *       </method>
 *     </class>
#
 *     <inchesconverter id="conv" inchesval="2"></inchesconverter>
#
 *     <spacedlayout axis="y"></spacedlayout>
 *     <text text="${conv.inchesval + ' inches'}"></text>
 *     <text text="${conv.centimetersval() + ' cm'}"></text>
 *     <text text="${conv.metersval() + ' m'}"></text>
#
#
 */

(function() {
  var Node,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; },
    slice = [].slice;

  Node = (function(superClass) {

    /**
     * @attribute {String} name
     * Names this node in its parent scope so it can be referred to later.
     */

    /**
     * @attribute {String} id
     * Gives this node a global ID, which can be looked up in the global window object.
     * Take care to not override builtin globals, or override your own instances!
     */

    /**
     * @attribute {String} scriptincludes
     * A comma separated list of URLs to javascript includes required as dependencies. Useful if you need to ensure a third party library is available.
     */

    /**
     * @attribute {String} scriptincludeserror
     * An error to show if scriptincludes fail to load
     */
    var _eventCallback, _installMethod, beforeConstructMethods, earlyattributes, lateattributes, matchConstraint, matchSuper;

    extend(Node, superClass);

    earlyattributes = ['name', 'parent'];

    lateattributes = ['data'];

    beforeConstructMethods = ['construct', 'createSprite'];

    function Node(el, attributes) {
      var args, hassuper, j, k, len, len1, method, methodName, methodObj, methods, mixedAttributes, ref, supressTagname;
      if (attributes == null) {
        attributes = {};
      }
      if (attributes["with"] != null) {
        if (attributes.$tagname == null) {
          supressTagname = true;
        }
        mixedAttributes = {};
        _processAttrs(attributes, mixedAttributes);
        attributes = mixedAttributes;
        if (supressTagname) {
          delete attributes.$tagname;
        }
      }
      methods = attributes.$methods;
      if (methods) {
        for (j = 0, len = beforeConstructMethods.length; j < len; j++) {
          methodName = beforeConstructMethods[j];
          methodObj = methods[methodName];
          if (methodObj) {
            for (k = 0, len1 = methodObj.length; k < len1; k++) {
              ref = methodObj[k], method = ref.method, args = ref.args;
              hassuper = matchSuper.test(method);
              _installMethod(this, methodName, compiler.compile(method, args, attributes.$tagname + "$" + methodName).bind(this), hassuper);
            }
          }
        }
      }
      this.construct(el, attributes);
    }


    /**
     * Used to create child instances on a node.
     * @param Object options Should include a class attribute: 'class', e.g. {class: 'view'} unless a dr.node is desired.
     * @return {dr.node}
     */

    Node.prototype.createChild = function(attributes, async) {
      var classname, el, ref;
      if (attributes == null) {
        attributes = {};
      }
      if (async == null) {
        async = false;
      }
      classname = (ref = attributes["class"]) != null ? ref : 'node';
      delete attributes["class"];
      if (typeof dr[classname] !== 'function') {
        showWarnings(["Unrecognized class " + classname + " in createChild()"]);
        return;
      }
      el = attributes.element;
      delete attributes.element;
      if (attributes.parent == null) {
        attributes.parent = this;
      }
      return new dr[classname](el, attributes, async);
    };

    Node.prototype.construct = function(el, attributes) {

      /**
       * @attribute {dr.node[]} subnodes
       * @readonly
       * An array of this node's child nodes
       */
      var deferbindings, j, k, l, len, len1, len2, len3, m, name, parent, ref, ref1, ref2, ref3, ref4, skiponinit, tagname;
      this.subnodes = [];
      this.types = (ref = attributes.$types) != null ? ref : {};
      delete attributes.$types;
      skiponinit = attributes.$skiponinit;
      delete attributes.$skiponinit;
      deferbindings = attributes.$deferbindings;
      delete attributes.$deferbindings;

      /*
       * @attribute {String} $textcontent
       * @readonly
       * Contains the textual contents of this node, if any
       */
      if (el != null) {
        el.$view = this;
        attributes.$textcontent = el.textContent;
      }
      tagname = attributes.$tagname;
      if (attributes.$methods) {
        this.installMethods(attributes.$methods, tagname);
        delete attributes.$methods;
      }
      if (attributes.$handlers) {
        this.installHandlers(attributes.$handlers, tagname);
        if (attributes.clickable !== "false") {
          ref1 = (function() {
            var k, len, ref1, ref2, results;
            ref1 = attributes.$handlers;
            results = [];
            for (k = 0, len = ref1.length; k < len; k++) {
              name = ref1[k];
              if (ref2 = name.ev.substr(2), indexOf.call(mouseEvents, ref2) >= 0) {
                results.push(name);
              }
            }
            return results;
          })();
          for (j = 0, len = ref1.length; j < len; j++) {
            name = ref1[j];
            attributes.clickable = true;
            break;
          }
        }
        delete attributes.$handlers;
      }
      if (!deferbindings) {
        this._bindHandlers();
      }
      ref2 = (function() {
        var l, len1, results;
        results = [];
        for (l = 0, len1 = earlyattributes.length; l < len1; l++) {
          name = earlyattributes[l];
          if (name in attributes) {
            results.push(name);
          }
        }
        return results;
      })();
      for (k = 0, len1 = ref2.length; k < len1; k++) {
        name = ref2[k];
        this.setAttribute(name, attributes[name]);
      }
      ref3 = ((function() {
        var results;
        results = [];
        for (name in attributes) {
          if (!(indexOf.call(lateattributes, name) >= 0 || indexOf.call(earlyattributes, name) >= 0)) {
            results.push(name);
          }
        }
        return results;
      })()).sort(reverseSort);
      for (l = 0, len2 = ref3.length; l < len2; l++) {
        name = ref3[l];
        this.bindAttribute(name, attributes[name], tagname);
      }
      parent = this.parent;
      if (parent && parent instanceof Node) {
        parent.sendEvent('subnodes', this);
        parent.doSubnodeAdded(this);
      }
      ref4 = (function() {
        var len3, n, results;
        results = [];
        for (n = 0, len3 = lateattributes.length; n < len3; n++) {
          name = lateattributes[n];
          if (name in attributes) {
            results.push(name);
          }
        }
        return results;
      })();
      for (m = 0, len3 = ref4.length; m < len3; m++) {
        name = ref4[m];
        this.bindAttribute(name, attributes[name], tagname);
      }
      if (this.constraints) {
        constraintScopes.push(this);
      }

      /**
       * @event oninit
       * Fired when this node and all its children are completely initialized
       * @param {dr.node} node The dr.node that fired the event
       */

      /**
       * @attribute {Boolean} inited
       * @readonly
       * True when this node and all its children are completely initialized
       */
      if (!skiponinit) {
        if (!this.inited) {
          return this.initialize();
        }
      }
    };

    Node.prototype.initialize = function(skipevents) {
      if (!instantiating) {
        this.inited = true;
      }
      if (!skipevents) {
        return this.sendEvent('init', this);
      }
    };

    matchSuper = /this.super\(|this\["super"\]\(/;

    Node.prototype.installMethods = function(methods, tagname, scope, callbackscope) {
      var allocation, args, hassuper, j, len, method, methodlist, name, ref;
      if (scope == null) {
        scope = this;
      }
      if (callbackscope == null) {
        callbackscope = this;
      }
      for (name in methods) {
        methodlist = methods[name];
        for (j = 0, len = methodlist.length; j < len; j++) {
          ref = methodlist[j], method = ref.method, args = ref.args, allocation = ref.allocation;
          if (indexOf.call(beforeConstructMethods, name) >= 0) {
            continue;
          }
          hassuper = matchSuper.test(method);
          _installMethod(scope, name, compiler.compile(method, args, tagname + "$" + name).bind(callbackscope), hassuper, allocation);
        }
      }
    };

    Node.prototype.installHandlers = function(handlers, tagname, scope) {
      var args, ev, handler, handlerobj, j, len, method, name, reference, script;
      if (scope == null) {
        scope = this;
      }
      if (this.handlers == null) {
        this.handlers = [];
      }
      for (j = 0, len = handlers.length; j < len; j++) {
        handler = handlers[j];
        ev = handler.ev, name = handler.name, script = handler.script, args = handler.args, reference = handler.reference, method = handler.method;
        ev = ev.substr(2);
        if (method) {
          handler.callback = scope[method];
        } else {
          handler.callback = _eventCallback(ev, script, scope, tagname, args);
        }
        handlerobj = {
          scope: this,
          ev: ev,
          name: name,
          callback: handler.callback,
          reference: reference
        };
        this.handlers.push(handlerobj);
      }
    };

    Node.prototype.removeHandlers = function(handlers, tagname, scope) {
      var args, ev, handler, j, len, method, name, reference, refeval, script;
      if (scope == null) {
        scope = this;
      }
      for (j = 0, len = handlers.length; j < len; j++) {
        handler = handlers[j];
        ev = handler.ev, name = handler.name, script = handler.script, args = handler.args, reference = handler.reference, method = handler.method;
        ev = ev.substr(2);
        if (reference != null) {
          refeval = this._valueLookup(reference)();
          scope.stopListening(refeval, ev, handler.callback);
        } else {
          scope.unregister(ev, handler.callback);
        }
      }
    };

    matchConstraint = /\${(.+)}/;

    Node.prototype.bindAttribute = function(name, value, tagname) {
      var constraint, eventname, handler;
      if (typeof value === 'string' && (constraint = value.match(matchConstraint))) {
        return this.setConstraint(name, constraint[1], true);
      } else if (eventname = name.match(matchEvent)) {
        name = eventname[1];
        handler = {
          scope: this,
          ev: name,
          callback: _eventCallback(name, value, this, tagname)
        };
        return this.handlers.push(handler);
      } else {
        return this.setAttribute(name, value);
      }
    };

    _eventCallback = function(name, script, scope, tagname, fnargs) {
      var js;
      if (tagname == null) {
        tagname = '';
      }
      if (fnargs == null) {
        fnargs = ['value'];
      }
      js = compiler.compile(script, fnargs, tagname + "$on" + name);
      return function() {
        var args;
        if (arguments.length) {
          args = arguments;
        } else if (name in scope) {
          args = [scope[name]];
        } else {
          args = [];
        }
        return js.apply(scope, args);
      };
    };

    _installMethod = function(scope, methodname, method, hassuper, allocation) {
      var exists, supr;
      if (!hassuper) {
        return scope[methodname] = method;
      } else {
        if (methodname in scope && typeof scope[methodname] === 'function') {
          supr = scope[methodname];
          exists = true;
        }
        return scope[methodname] = function() {
          var args, prevOwn, prevValue, retval;
          args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
          prevOwn = scope.hasOwnProperty('super');
          if (prevOwn) {
            prevValue = scope['super'];
          }
          if (exists) {
            scope['super'] = function() {
              var i, params, superargs;
              superargs = 1 <= arguments.length ? slice.call(arguments, 0) : [];
              i = superargs.length;
              params = args.splice(0);
              while (i) {
                params[--i] = superargs[i];
              }
              return supr.apply(scope, params);
            };
          } else {
            scope['super'] = noop;
          }
          retval = method.apply(scope, args);
          if (prevOwn) {
            scope['super'] = prevValue;
          } else {
            delete scope['super'];
          }
          return retval;
        };
      }
    };

    Node.prototype.setConstraint = function(property, expression, skipbinding) {
      var bindexpression, bindings, j, len, scope, scopes;
      if (this.constraints != null) {
        this._unbindConstraint(property);
      } else {
        this.constraints = {};
      }
      this.constraints[property] = {
        expression: expression,
        bindings: {}
      };
      bindings = this.constraints[property].bindings;
      scopes = compiler.findBindings(expression);
      for (j = 0, len = scopes.length; j < len; j++) {
        scope = scopes[j];
        bindexpression = scope.binding;
        if (bindings[bindexpression] == null) {
          bindings[bindexpression] = [];
        }
        bindings[bindexpression].push(scope);
      }
      if (!skipbinding) {
        this._bindConstraints();
      }
    };

    Node.prototype._valueLookup = function(bindexpression) {
      return compiler.compile('return ' + bindexpression).bind(this);
    };

    Node.prototype._unbindConstraint = function(property) {
      var callback, callbackbindings, i, j, len, prop, ref, ref1, scope;
      if (!(this.constraints && ((ref = this.constraints[property]) != null ? ref.callback : void 0))) {
        return;
      }
      ref1 = this.constraints[property], callback = ref1.callback, callbackbindings = ref1.callbackbindings;
      for (i = j = 0, len = callbackbindings.length; j < len; i = j += 2) {
        prop = callbackbindings[i];
        scope = callbackbindings[i + 1];
        scope.unregister(prop, callback);
      }
      this.constraints[property] = null;
    };

    Node.prototype._bindConstraints = function() {
      var bindexpression, binding, bindinglist, bindings, boundref, constraint, expression, fn, j, len, name, property, ref;
      ref = this.constraints;
      for (name in ref) {
        constraint = ref[name];
        bindings = constraint.bindings, expression = constraint.expression;
        if (constraint.callbackbindings == null) {
          constraint.callbackbindings = [];
        }
        fn = this._valueLookup(expression);
        constraint.callback = this._constraintCallback(name, fn);
        for (bindexpression in bindings) {
          bindinglist = bindings[bindexpression];
          boundref = this._valueLookup(bindexpression)();
          if (!boundref) {
            showWarnings(["Could not bind to " + bindexpression + " of constraint " + expression + " for " + this.$tagname + (this.id ? '#' + this.id : this.name ? '.' + name : '')]);
            continue;
          }
          if (!(boundref instanceof Eventable)) {
            console.log("Binding to non-Eventable " + bindexpression + " of constraint " + expression + " for " + this.$tagname + (this.id ? '#' + this.id : this.name ? '.' + name : ''));
          }
          for (j = 0, len = bindinglist.length; j < len; j++) {
            binding = bindinglist[j];
            property = binding.property;
            if (boundref instanceof Eventable) {
              boundref.register(property, constraint.callback);
            }
            constraint.callbackbindings.push(property, boundref);
          }
        }
        this.setAttribute(name, fn(), true);
      }
    };

    Node.prototype._bindHandlers = function(send) {
      var binding, callback, ev, j, len, name, ref, reference, refeval, scope;
      if (!this.handlers) {
        return;
      }
      if (instantiating) {
        handlerq.push(this);
        return;
      }
      ref = this.handlers;
      for (j = 0, len = ref.length; j < len; j++) {
        binding = ref[j];
        scope = binding.scope, name = binding.name, ev = binding.ev, callback = binding.callback, reference = binding.reference;
        if (reference) {
          refeval = this._valueLookup(reference)();
          if (refeval instanceof Eventable) {
            scope.listenTo(refeval, ev, callback);
            if (send && ev in refeval) {
              callback(refeval[ev]);
            }
          }
        } else {
          scope.register(ev, callback);
          if (send && ev in scope) {
            callback(scope[ev]);
          }
        }
      }
      this.handlers = [];
    };

    Node.prototype._constraintCallback = function(name, fn) {
      return (function constraintCallback(){;
      this.setAttribute(name, fn(), true);
      return }).bind(this);
    };

    Node.prototype.set_parent = function(parent) {
      if (parent instanceof Node) {
        if (this.name) {
          parent[this.name] = this;
        }
        parent.subnodes.push(this);
      }
      return parent;
    };

    Node.prototype.set_name = function(name) {
      if (this.parent && name) {
        this.parent[name] = this;
      }
      return name;
    };

    Node.prototype.set_id = function(id) {
      window[id] = this;
      return id;
    };


    /**
     * Animates this node's attribute(s)
     * @param {Object} obj A hash of attribute names and values to animate to
     * @param Number duration The duration of the animation in milliseconds
     */

    Node.prototype.animate = function(attributes, time) {
      var anim, animTick, animators, first, name, track, value;
      if (time == null) {
        time = 600;
      }
      animators = {};
      for (name in attributes) {
        value = attributes[name];
        track = {
          motion: 'bret',
          control: [0.01]
        };
        track[0] = this[name] || 0;
        track[time] = value;
        anim = Animator.createAnimator();
        anim.playStateless(track);
        animators[name] = anim;
      }
      first = void 0;
      animTick = (function(_this) {
        return function(time) {
          var ended, local_time, myvalue;
          if (_this.destroyed) {
            return;
          }
          if (first == null) {
            first = time;
          }
          local_time = time - first;
          ended = false;
          for (name in animators) {
            anim = animators[name];
            myvalue = anim.timestep(local_time);
            _this.setAttribute(name, myvalue);
            if (anim.ended) {
              ended = true;
            }
          }
          if (!ended) {
            return dr.idle.callOnIdle(animTick);
          }
        };
      })(this);
      dr.idle.callOnIdle(animTick);
      return this;
    };

    Node.prototype._removeFromParent = function(name) {
      var arr, index, removedNode;
      if (!this.parent) {
        return;
      }
      arr = this.parent[name];
      index = arr.indexOf(this);
      if (index !== -1) {
        removedNode = arr[index];
        arr.splice(index, 1);
        this.parent.sendEvent(name, removedNode);
        if (name === 'subnodes') {
          this.parent.doSubnodeRemoved(removedNode);
        }
      }
    };

    Node.prototype._findParents = function(name, value) {
      var out, p;
      out = [];
      p = this;
      while (p) {
        if (name in p && p[name] === value) {
          out.push(p);
        }
        p = p.parent;
      }
      return out;
    };

    Node.prototype._findInParents = function(name) {
      var p;
      p = this.parent;
      while (p) {
        if (name in p) {
          return p[name];
        }
        p = p.parent;
      }
    };


    /**
     * Called when a subnode is added to this node. Provides a hook for
     * subclasses. No need for subclasses to call super. Do not call this
     * method to add a subnode. Instead call setParent.
     * @param {dr.node} node The subnode that was added.
     * @return {void}
     * @private
     */

    Node.prototype.doSubnodeAdded = function(node) {};


    /**
     * Called when a subnode is removed from this node. Provides a hook for
     * subclasses. No need for subclasses to call super. Do not call this
     * method to remove a subnode. Instead call _removeFromParent.
     * @param {dr.node} node The subnode that was removed.
     * @return {void}
     * @private
     */

    Node.prototype.doSubnodeRemoved = function(node) {};


    /**
     * @method destroy
     * Destroys this node
     */


    /**
     * @ignore
     */

    Node.prototype.destroy = function(skipevents) {
      var j, len, property, ref, ref1, subnode;
      this.destroyed = true;

      /**
       * @event ondestroy
       * Fired when this node and all its children are about to be destroyed
       * @param {dr.node} node The dr.node that fired the event
       */
      this.sendEvent('destroy', this);
      if (this.constraints) {
        for (property in this.constraints) {
          this._unbindConstraint(property);
        }
      }
      if (this.listeningTo) {
        this.stopListening();
      }
      this.unregister();
      if (((ref = this.parent) != null ? ref[this.name] : void 0) === this) {
        delete this.parent[this.name];
      }
      ref1 = this.subnodes;
      for (j = 0, len = ref1.length; j < len; j++) {
        subnode = ref1[j];
        if (subnode != null) {
          subnode.destroy(true);
        }
      }
      if (!skipevents) {
        return this._removeFromParent('subnodes');
      }
    };

    return Node;

  })(Eventable);

  return Node;

}).call(this);
;
    Sprite = 
/**
 * @class Sprite
 * @private
 * Abstracts the underlying visual primitives (currently HTML) from dreem's view system.
 */

(function() {
  var Sprite, fcamelCase, knownstyles, rdashAlpha, ss, ss2,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Sprite = (function() {
    function Sprite(view, jqel, attributes) {
      this._handleScroll = bind(this._handleScroll, this);
      var tagname;
      tagname = attributes.$tagname || 'div';
      if (jqel == null) {
        this.el = document.createElement(tagname);
        this.el.$init = true;
      } else if (jqel instanceof HTMLElement) {
        this.el = jqel;
      }
      this.el.$view = view;
      if (this.css_baseclass == null) {
        this.css_baseclass = 'sprite';
      }
      this._updateClass();
    }

    Sprite.prototype.setAttribute = function(name, value) {
      var types;
      switch (name) {
        case 'width':
        case 'height':
        case 'z':
        case 'opacity':
        case 'bgcolor':
        case 'color':
        case 'whitespace':
        case 'fontsize':
        case 'fontfamily':
        case 'texttransform':
        case 'fontweight':
        case 'text-transform':
        case 'boxshadow':
        case 'leftpadding':
        case 'rightpadding':
        case 'toppadding':
        case 'bottompadding':
        case 'leftborder':
        case 'rightborder':
        case 'topborder':
        case 'bottomborder':
        case 'bordercolor':
        case 'borderstyle':
          return this.setStyle(name, value);
        case 'bold':
          return this.setStyle(name, value ? 'bold' : 'normal');
        case 'italic':
          return this.setStyle(name, value ? 'italic' : 'normal');
        case 'smallcaps':
          return this.setStyle(name, value ? 'small-caps' : 'normal');
        case 'ellipsis':
          this.__ellipsis = value;
          this.setStyle(name, value ? 'ellipsis' : 'clip');
          return this.__updateOverflow();
        case 'perspective':
        case 'transform-style':
        case 'transform-origin':
        case 'transform':
          return this.setStyle(capabilities.prefix.css + name, value);
        default:
          types = this.el.$view._declaredTypes;
          if (types[name] == null) {
            return this.setStyle(name, value);
          }
      }
    };

    Sprite.prototype.setStyle = (function(isWebkit) {
      if (isWebkit) {
        return function(name, value, internal, el) {
          var perturb, v;
          if (el == null) {
            el = this.el;
          }
          if (value == null) {
            value = '';
          }
          if (name in stylemap) {
            name = stylemap[name];
          }
          el.style[name] = value;
          if (name === 'borderTopWidth' || name === 'paddingTop') {
            if (this.__BP_TOGGLE = !this.__BP_TOGGLE) {
              perturb = -0.001;
            } else {
              perturb = 0.001;
            }
            v = el.style.paddingLeft;
            return el.style.paddingLeft = Number(v.substring(0, v.length - 2)) + perturb + 'px';
          }
        };
      } else {
        return function(name, value, internal, el) {
          if (el == null) {
            el = this.el;
          }
          if (value == null) {
            value = '';
          }
          if (name in stylemap) {
            name = stylemap[name];
          }
          return el.style[name] = value;
        };
      }
    })(capabilities.prefix.dom === 'WebKit');

    Sprite.prototype.set_parent = function(parent) {
      if (parent instanceof Sprite) {
        parent = parent.el;
      }
      if (this.el.parentNode !== parent) {
        return parent.appendChild(this.el);
      }
    };

    Sprite.prototype.set_id = function(id) {
      return this.el.setAttribute('id', id);
    };

    Sprite.prototype._cursorVal = function() {
      if (this.__clickable) {
        return this.__cursor || 'pointer';
      } else {
        return '';
      }
    };

    Sprite.prototype.set_scrollx = function(v) {
      if (this.el.scrollLeft !== v) {
        return this.el.scrollLeft = v;
      }
    };

    Sprite.prototype.set_scrolly = function(v) {
      if (this.el.scrollTop !== v) {
        return this.el.scrollTop = v;
      }
    };

    Sprite.prototype.set_cursor = function(cursor) {
      this.__cursor = cursor;
      return this.setStyle('cursor', this._cursorVal(), true);
    };

    Sprite.prototype.set_visible = function(visible) {
      var value, view, x, y;
      if (visible) {
        value = null;
        view = this.el.$view;
        x = view.x;
        y = view.y;
      } else {
        value = 'hidden';
        x = y = -100000;
      }
      this.setStyle('visibility', value, true);
      this.setStyle('marginLeft', x, true);
      return this.setStyle('marginTop', y, true);
    };

    Sprite.prototype.set_x = function(x) {
      if (this.el.$view.visible) {
        return this.setStyle('marginLeft', x, true);
      }
    };

    Sprite.prototype.set_y = function(y) {
      if (this.el.$view.visible) {
        return this.setStyle('marginTop', y, true);
      }
    };

    Sprite.prototype.set_clickable = function(clickable) {
      this.__clickable = clickable;
      this.__updatePointerEvents();
      return this.setStyle('cursor', this._cursorVal(), true);
    };

    Sprite.prototype.set_clip = function(clip) {
      this.__clip = clip;
      return this.__updateOverflow();
    };

    Sprite.prototype.set_scrollable = function(scrollable) {
      this.__scrollable = scrollable;
      this.__updateOverflow();
      this.__updatePointerEvents();
      if (scrollable) {
        return $(this.el).on('scroll', this._handleScroll);
      } else {
        return $(this.el).off('scroll', this._handleScroll);
      }
    };

    Sprite.prototype.set_scrollbars = function(scrollbars) {
      this.__scrollbars = scrollbars;
      return this._updateClass();
    };

    Sprite.prototype._handleScroll = function(event) {
      var domElement, newEvt, oldEvt, target, x, y;
      domElement = event.target;
      target = domElement.$view;
      if (target) {
        x = domElement.scrollLeft;
        y = domElement.scrollTop;
        if (target.scrollx !== x) {
          target.setAttribute('scrollx', x);
        }
        if (target.scrolly !== y) {
          target.setAttribute('scrolly', y);
        }
        oldEvt = this._lastScrollEvent;
        newEvt = {
          scrollx: x,
          scrolly: y,
          scrollwidth: domElement.scrollWidth,
          scrollheight: domElement.scrollHeight
        };
        if (!oldEvt || oldEvt.scrollx !== newEvt.scrollx || oldEvt.scrolly !== newEvt.scrolly || oldEvt.scrollwidth !== newEvt.scrollwidth || oldEvt.scrollheight !== newEvt.scrollheight) {
          target.sendEvent('scroll', newEvt);
          return this._lastScrollEvent = newEvt;
        }
      }
    };

    Sprite.prototype.__updateOverflow = function() {
      return this.setStyle('overflow', this.__scrollable ? 'auto' : this.__clip || this.__ellipsis ? 'hidden' : '', true);
    };

    Sprite.prototype.__updatePointerEvents = function() {
      return this.setStyle('pointer-events', this.__clickable || this.__scrollable ? 'auto' : '', true);
    };

    Sprite.prototype.destroy = function() {
      this.el.parentNode.removeChild(this.el);
      return this.el = this.jqel = this.el.$view = null;
    };

    Sprite.prototype.setInnerHTML = function(html) {
      return this.el.innerHTML = html;
    };

    Sprite.prototype.getInnerHTML = function() {
      return this.el.innerHTML;
    };

    Sprite.prototype.getBounds = function() {
      return this.el.getBoundingClientRect();
    };

    Sprite.prototype.getAbsolute = function() {
      var bounds;
      bounds = this.getBounds();
      return {
        x: bounds.left + window.pageXOffset,
        y: bounds.top + window.pageYOffset
      };
    };

    Sprite.prototype.getScrollWidth = function() {
      return this.el.scrollWidth;
    };

    Sprite.prototype.getScrollHeight = function() {
      return this.el.scrollHeight;
    };

    Sprite.prototype.set_class = function(classname) {
      if (classname == null) {
        classname = '';
      }
      this.__classname = classname;
      return this._updateClass();
    };

    Sprite.prototype._updateClass = function() {
      var classes;
      classes = this.css_baseclass;
      if (this.__classname) {
        classes += ' ' + this.__classname;
      }
      if (!this.__scrollbars) {
        classes += ' ' + 'noscrollbar';
      }
      return this.el.setAttribute('class', classes);
    };

    return Sprite;

  })();

  if (capabilities.camelcss) {
    ss = Sprite.prototype.setStyle;
    fcamelCase = function(all, letter) {
      return letter.toUpperCase();
    };
    rdashAlpha = /-([\da-z])/gi;
    Sprite.prototype.setStyle = function(name, value, internal, el) {
      if (el == null) {
        el = this.el;
      }
      if (name.match(rdashAlpha)) {
        name = name.replace(rdashAlpha, fcamelCase);
      }
      return ss(name, value, internal, el);
    };
  }

  if (debug) {
    knownstyles = ['width', 'height', 'background-color', 'opacity', 'padding', 'transform', 'transform-style', 'transform-origin', 'z-index', 'perspective', 'cursor', capabilities.prefix.css + 'transform', capabilities.prefix.css + 'transform-style', capabilities.prefix.css + 'transform-origin'];
    ss2 = Sprite.prototype.setStyle;
    Sprite.prototype.setStyle = function(name, value, internal, el) {
      if (el == null) {
        el = this.el;
      }
      if (name === '$instanceattributes') {
        return;
      }
      if (!internal && !(name in stylemap) && !(indexOf.call(knownstyles, name) >= 0)) {
        console.warn("Setting unknown CSS property " + name + " = " + value + " on ", this.el.$view, stylemap, internal);
      }
      return ss2(name, value, internal, el);
    };
  }

  return Sprite;

}).call(this);
;
    TextSprite = 
/**
 * @class TextSprite
 * @private
 * Abstracts the underlying visual primitives for a text component
 */

(function() {
  var TextSprite,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  TextSprite = (function(superClass) {
    extend(TextSprite, superClass);

    function TextSprite(view, jqel, attributes) {
      if (this.css_baseclass == null) {
        this.css_baseclass = 'sprite sprite-text noselect';
      }
      TextSprite.__super__.constructor.apply(this, arguments);
      attributes.text || (attributes.text = this.getText());
    }

    TextSprite.prototype.setText = function(txt) {
      var cld, i, len, ref, tnode;
      if (txt != null) {
        ref = this.el.childNodes;
        for (i = 0, len = ref.length; i < len; i++) {
          cld = ref[i];
          if (cld && cld.nodeType === 3) {
            this.el.removeChild(cld);
          }
        }
        tnode = document.createTextNode(txt);
        return this.el.appendChild(tnode);
      }
    };

    TextSprite.prototype.getText = function() {
      var child, texts;
      child = this.el.firstChild;
      texts = [];
      while (child) {
        if (child.nodeType === 3) {
          texts.push(child.data.trim());
        }
        child = child.nextSibling;
      }
      return texts.join("");
    };

    return TextSprite;

  })(Sprite);

  return TextSprite;

}).call(this);
;
    InputTextSprite = 
/**
 * @class InputTextSprite
 * @private
 * Abstracts the underlying visual primitives for an input text component
 */

(function() {
  var InputTextSprite,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  InputTextSprite = (function(superClass) {
    extend(InputTextSprite, superClass);

    function InputTextSprite(view, jqel, attributes) {
      var input;
      if (this.css_baseclass == null) {
        this.css_baseclass = 'sprite noselect';
      }
      InputTextSprite.__super__.constructor.apply(this, arguments);
      attributes.text || (attributes.text = this.getText());
      input = null;
      if (attributes.multiline === 'true') {
        input = document.createElement('textarea');
      } else {
        input = document.createElement('input');
        input.setAttribute('type', 'text');
      }
      input.$init = true;
      input.setAttribute('class', 'sprite-inputtext');
      this.setStyle('color', 'inherit', false, input);
      this.setStyle('background', 'inherit', false, input);
      this.setStyle('font-variant', 'inherit', false, input);
      this.setStyle('font-style', 'inherit', false, input);
      this.setStyle('font-weight', 'inherit', false, input);
      this.setStyle('font-size', 'inherit', false, input);
      this.setStyle('font-family', 'inherit', false, input);
      this.setStyle('width', '100%', false, input);
      this.setStyle('height', '100%', false, input);
      this.el.appendChild(input);
      input.$view = view;
      $(input).on('focus blur', this.handle);
      this.input = input;
    }

    InputTextSprite.prototype.handle = function(event) {
      var view;
      view = event.target.$view;
      if (!view) {
        return;
      }
      return view.sendEvent(event.type, view);
    };

    InputTextSprite.prototype.destroy = function() {
      InputTextSprite.__super__.destroy.apply(this, arguments);
      if (this.input) {
        return this.input = this.input.$view = null;
      }
    };

    InputTextSprite.prototype.value = function(value) {
      if (value != null) {
        return this.input.value = value;
      } else {
        return this.input.value;
      }
    };

    return InputTextSprite;

  })(TextSprite);

  return InputTextSprite;

}).call(this);
;
    ArtSprite = 
/**
 * @class TextSprite
 * @private
 * Abstracts the underlying visual primitives for a text component
 */

(function() {
  var ArtSprite,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  ArtSprite = (function(superClass) {
    extend(ArtSprite, superClass);

    function ArtSprite() {
      return ArtSprite.__super__.constructor.apply(this, arguments);
    }

    ArtSprite.prototype.clearInline = function() {
      var cld, i, len, ref, results;
      ref = this.el.childNodes;
      results = [];
      for (i = 0, len = ref.length; i < len; i++) {
        cld = ref[i];
        if (cld && cld.nodeType === 3) {
          results.push(this.el.removeChild(cld));
        } else {
          results.push(void 0);
        }
      }
      return results;
    };

    return ArtSprite;

  })(Sprite);

  return ArtSprite;

}).call(this);
;
    BitmapSprite = 
/**
 * @class BitmapSprite
 * @private
 * Abstracts the underlying visual primitives for a bitmap component
 */

(function() {
  var BitmapSprite,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  BitmapSprite = (function(superClass) {
    extend(BitmapSprite, superClass);

    function BitmapSprite(view, jqel, attributes) {
      BitmapSprite.__super__.constructor.apply(this, arguments);
      this.el.style.backgroundSize = 'cover';
    }

    BitmapSprite.prototype.destroy = function() {
      BitmapSprite.__super__.destroy.apply(this, arguments);
      if (this._img) {
        this._img.$view = null;
        return this._img = null;
      }
    };

    BitmapSprite.prototype.setSrc = function(v) {
      var el, img, sprite, style, view;
      el = this.el;
      view = el.$view;
      style = el.style;
      if (!v) {
        style.backgroundImage = '';
        if (view.inited) {
          return view.sendEvent('load', {
            width: 0,
            height: 0
          });
        }
      } else {
        style.backgroundImage = 'url("' + v + '")';
        style.backgroundRepeat = 'no-repeat';
        img = this._img;
        if (!img) {
          img = this._img = new Image();
          img.$view = view;
        }
        img.src = v;
        sprite = this;
        img.onload = function() {
          view = this.$view;
          if (view) {
            sprite.naturalWidth = img.width;
            sprite.naturalHeight = img.height;
            if (sprite.naturalSize) {
              view.setAttribute('width', img.width);
              view.setAttribute('height', img.height);
            }
            return view.sendEvent('load', {
              width: img.width,
              height: img.height
            });
          }
        };
        return img.onerror = function() {
          view = this.$view;
          if (view) {
            sprite.naturalWidth = sprite.naturalHeight = void 0;
            return view.sendEvent('error', img);
          }
        };
      }
    };

    BitmapSprite.prototype.setWindow = function(w) {
      var args, style, view;
      args = w.split(',', 4);
      if (args.length !== 4) {
        return this.setStyle('background-position', '');
      } else {
        view = this.el.$view;
        view.setAttribute('width', args[2]);
        view.setAttribute('height', args[3]);
        style = this.el.style;
        style.backgroundSize = '';
        return style.backgroundPosition = -args[0] + 'px ' + -args[1] + 'px';
      }
    };

    BitmapSprite.prototype.setStretches = function(v) {
      if (v === 'scale') {
        v = 'contain';
      } else if (v === 'true') {
        v = '100% 100%';
      } else {
        v = 'cover';
      }
      return this.el.style.backgroundSize = v;
    };

    BitmapSprite.prototype.setNaturalSize = function(v) {
      var img, view;
      this.naturalSize = v;
      if (v) {
        img = this._img;
        if (img && (this.naturalWidth != null) && (this.naturalHeight != null)) {
          view = img.$view;
          view.setAttribute('width', this.naturalWidth);
          return view.setAttribute('height', this.naturalHeight);
        }
      }
    };

    return BitmapSprite;

  })(Sprite);

  return BitmapSprite;

}).call(this);
;
    View = 
/**
 * @aside guide constraints
 * @class dr.view {UI Components}
 * @extends dr.node
 * The visual base class for everything in dreem. Views extend dr.node to add the ability to set and animate visual attributes, and interact with the mouse.
#
 * Views are positioned inside their parent according to their x and y coordinates.
#
 * Views can contain methods, handlers, setters, constraints, attributes and other view, node or class instances.
#
 * Views can be easily converted to reusable classes/tags by changing their outermost &lt;view> tags to &lt;class> and adding a name attribute.
#
 * Views support a number of builtin attributes. Setting attributes that aren't listed explicitly will pass through to the underlying Sprite implementation.
#
 * Views currently integrate with jQuery, so any changes made to their CSS via jQuery will automatically cause them to update.
#
 * Note that dreem apps must be contained inside a top-level &lt;view>&lt;/view> tag.
#
 * The following example shows a pink view that contains a smaller blue view offset 10 pixels from the top and 10 from the left.
#
 *     @example
 *     <view width="200" height="100" bgcolor="lightpink">
#
 *       <view width="50" height="50" x="10" y="10" bgcolor="lightblue"></view>
#
 *     </view>
#
 * Here the blue view is wider than its parent pink view, and because the clip attribute of the parent is set to false it extends beyond the parents bounds.
#
 *     @example
 *     <view width="200" height="100" bgcolor="lightpink" clip="false">
#
 *       <view width="250" height="50" x="10" y="10" bgcolor="lightblue"></view>
#
 *     </view>
#
 * Now we set the clip attribute on the parent view to true, causing the overflowing child view to be clipped at its parent's boundary.
#
 *     @example
 *     <view width="200" height="100" bgcolor="lightpink" clip="true">
#
 *       <view width="250" height="50" x="10" y="10" bgcolor="lightblue"></view>
#
 *     </view>
#
 * Here we demonstrate how unsupported attributes are passed to the underlying sprite system. We make the child view semi-transparent by setting opacity. Although this is not in the list of supported attributes it is still applied.
#
 *     @example
 *     <view width="200" height="100" bgcolor="lightpink">
#
 *       <view width="250" height="50" x="10" y="10" bgcolor="lightblue" opacity=".5"></view>
#
 *     </view>
#
 * It is convenient to [constrain](#!/guide/constraints) a view's size and position to attributes of its parent view. Here we'll position the inner view so that its inset by 10 pixels in its parent.
#
 *     @example
 *     <view width="200" height="100" bgcolor="lightpink">
#
 *       <view width="${this.parent.width-this.inset*2}" height="${this.parent.height-this.inset*2}" x="${this.inset}" y="${this.inset}" bgcolor="lightblue">
 *         <attribute name="inset" type="number" value="10"></attribute>
 *       </view>
#
 *     </view>
 */

(function() {
  var View,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  View = (function(superClass) {
    extend(View, superClass);

    function View() {
      return View.__super__.constructor.apply(this, arguments);
    }


    /**
     * @attribute {Number} [x=0]
     * This view's x-position. There are several categories of allowed values.
     *   1) Fixed: If a number is provided the x-position will be a fixed
     *      pixel position relative to the parent view.
     *   2) Percentage: If a number followed by a '%' sign is provided the
     *      x-position will constrained to a percent of the parent views
     *      inner width.
     *   3) Aligned Left: If the string 'left' is provided the x-position will
     *      be constrained so that the view's left bound is aligned with the
     *      inner left edge of the parent view. To clarify, aligning left is
     *      different from a fixed x-position of 0 since it accounts for
     *      transformations applied to the view.
     *   4) Aligned Right: If the string 'right' is provided the x-position will
     *      be constrained so that the view's right bound is aligned with the
     *      inner right edge of the parent view. Like align left, this means
     *      transformations applied to the view are accounted for.
     *   5) Aligned Center: If the string 'center' or 'middle' is provided the 
     *      x-position will be constrained so that the midpoint of the width
     *      bound of the view is the same as the midpoint of the inner width of
     *      the parent view. Like align left, this means transformations applied
     *      to the view are accounted for.
     */


    /**
     * @attribute {Number} [y=0]
     * This view's y-position. There are several categories of allowed values.
     *   1) Fixed: If a number is provided the y-position will be a fixed
     *      pixel position relative to the parent view.
     *   2) Percentage: If a number followed by a '%' sign is provided the
     *      y-position will constrained to a percent of the parent views
     *      inner height.
     *   3) Aligned Top: If the string 'top' is provided the y-position will
     *      be constrained so that the view's top bound is aligned with the
     *      inner top edge of the parent view. To clarify, aligning top is
     *      different from a fixed y-position of 0 since it accounts for
     *      transformations applied to the view.
     *   4) Aligned Bottom: If the string 'bottom' is provided the y-position
     *      will be constrained so that the view's bottom bound is aligned with 
     *      the inner bottom edge of the parent view. Like align top, this means
     *      transformations applied to the view are accounted for.
     *   5) Aligned Middle: If the string 'middle' or 'center' is provided the 
     *      y-position will be constrained so that the midpoint of the height
     *      bound of the view is the same as the midpoint of the inner height of
     *      the parent view. Like align top, this means transformations applied
     *      to the view are accounted for.
     */


    /**
     * @attribute {Number} [width=0]
     * This view's width. There are several categories of allowed values.
     *   1) Fixed: If a number is provided the width will be a fixed
     *      pixel size.
     *   2) Percentage: If a number followed by a '%' sign is provided the
     *      width will constrained to a percent of the parent views
     *      inner width.
     *   3) Auto: If the string 'auto' is provided the width will be constrained
     *      to the maximum x bounds of the view children of this view. This
     *      feature is implemented like a Layout, so you can use ignorelayout
     *      on a child view to disregard them for auto sizing. Furthermore,
     *      views with a percentage width, percentage x, or an x-position of 
     *      'center' or 'right' will also be disregarded. Note that 'left' is 
     *      not ignored since it does not necessarily result in a circular
     *      constraint.
     */


    /**
     * @attribute {Number} [height=0]
     * This view's height. There are several categories of allowed values.
     *   1) Fixed: If a number is provided the height will be a fixed
     *      pixel size.
     *   2) Percentage: If a number followed by a '%' sign is provided the
     *      height will constrained to a percent of the parent views
     *      inner height.
     *   3) Auto: If the string 'auto' is provided the height will be constrained
     *      to the maximum y bounds of the view children of this view. This
     *      feature is implemented like a Layout, so you can use ignorelayout
     *      on a child view to disregard them for auto sizing. Furthermore,
     *      views with a percentage height, percentage y, or a y-position of 
     *      'center', 'middle' or 'bottom' will also be disregarded. Note that 
     *      'top' is not ignored since it does not necessarily result in a 
     *      circular constraint.
     */


    /**
     * @attribute {Boolean} isaligned Indicates that the x attribute is
     * set to one of the "special" alignment values.
     * @readonly
     */


    /**
     * @attribute {Boolean} isvaligned Indicates that the y attribute is
     * set to one of the "special" alignment values.
     * @readonly
     */


    /**
     * @attribute {Number} innerwidth The width of the view less padding and
     * border. This is the width child views should use if border or padding
     * is being used by the view.
     * @readonly
     */


    /**
     * @attribute {Number} innerheight The height of the view less padding and
     * border. This is the height child views should use if border or padding
     * is being used by the view.
     * @readonly
     */


    /**
     * @attribute {Number} boundsx The x position of the bounding box for the
     * view. This value accounts for rotation and scaling of the view.
     * @readonly
     */


    /**
     * @attribute {Number} boundsy The y position of the bounding box for the
     * view. This value accounts for rotation and scaling of the view.
     * @readonly
     */


    /**
     * @attribute {Number} boundsxdiff The difference between the x position
     * of the view and the boundsx of the view. Useful when you need to offset
     * a view to make it line up when it is scaled or rotated.
     * @readonly
     */


    /**
     * @attribute {Number} boundsydiff The difference between the y position
     * of the view and the boundsy of the view. Useful when you need to offset
     * a view to make it line up when it is scaled or rotated.
     * @readonly
     */


    /**
     * @attribute {Number} boundswidth The width of the bounding box for the
     * view. This value accounts for rotation and scaling of the view. This is
     * the width non-descendant views should use if the view is rotated or
     * scaled.
     * @readonly
     */


    /**
     * @attribute {Number} boundsheight The height of the bounding box for the
     * view. This value accounts for rotation and scaling of the view. This is
     * the height non-descendant views should use if the view is rotated or
     * scaled.
     * @readonly
     */


    /**
     * @attribute {Boolean} [clickable=false]
     * If true, this view recieves mouse events. Automatically set to true when an onclick/mouse* event is registered for this view.
     */


    /**
     * @attribute {Boolean} [clip=false]
     * If true, this view clips to its bounds
     */


    /**
     * @attribute {Boolean} [scrollable=false]
     * If true, this view clips to its bounds and provides scrolling to see content that overflows the bounds
     */


    /**
     * @attribute {Boolean} [scrollbars=false]
     * Controls the visibility of scrollbars if scrollable is true
     */


    /**
     * @attribute {Boolean} [visible=true]
     * If false, this view is invisible
     */


    /**
     * @attribute {String} bgcolor
     * Sets this view's background color
     */


    /**
     * @attribute {String} bordercolor
     * Sets this view's border color
     */


    /**
     * @attribute {String} borderstyle
     * Sets this view's border style (can be any css border-style value)
     */


    /**
     * @attribute {Number} border
     * Sets this view's border width
     */


    /**
     * @attribute {Number} padding
     * Sets this view's padding
     */


    /**
     * @attribute {Number} [xscale=1.0]
     * Sets this view's width scale
     */


    /**
     * @attribute {Number} [yscale=1.0]
     * Sets this view's height scale
     */


    /**
     * @attribute {Number} [z=0]
     * Sets this view's z position (higher values are on top of other views)
    #
     * *(note: setting a 'z' value for a view implicitly sets its parent's 'transform-style' to 'preserve-3d')*
     */


    /**
     * @attribute {Number} [rotation=0]
     * Sets this view's rotation in degrees.
     */


    /**
     * @attribute {String} [perspective=0]
     * Sets this view's perspective depth along the z access, values in pixels.
     * When this value is set, items further from the camera will appear smaller, and closer items will be larger.
     */


    /**
     * @attribute {Number} [opacity=1.0]
     * Sets this view's opacity, values can be a float from 0.0 to 1.0
     */


    /**
     * @attribute {Number} [scrollx=0]
     * Sets the horizontal scroll position of the view. Only relevant if
     * this.scrollable is true. Setting this value will generate both a
     * scrollx event and a scroll event.
     */


    /**
     * @attribute {Number} [scrolly=0]
     * Sets the vertical scroll position of the view. Only relevant if
     * this.scrollable is true. Setting this value will generate both a
     * scrolly event and a scroll event.
     */


    /**
     * @attribute {Number} [xanchor=0]
     * Sets the horizontal center of the view's transformations (such as 
     * rotation) There are several categories of allowed values:
     *   1) Fixed: If a number is provided the x anchor will be a fixed
     *      pixel position.
     *   2) Left: If the string 'left' is provided the left edge of the view
     *      will be used. This is equivalent to a fixed value of 0.
     *   3) Right: If the string 'right' is provided the right edge of the
     *      view will be used.
     *   4) Center: If the string 'center' is provided the midpoint of the
     *      width of the view will be used.
     */


    /**
     * @attribute {Number} [yanchor=0]
     * Sets the vertical center of the view's transformations (such as 
     * rotation) There are several categories of allowed values:
     *   1) Fixed: If a number is provided the y anchor will be a fixed
     *      pixel position.
     *   2) Top: If the string 'top' is provided the top edge of the view
     *      will be used. This is equivalent to a fixed value of 0.
     *   3) Bottom: If the string 'bottom' is provided the bottom edge of the
     *      view will be used.
     *   4) Center: If the string 'center' is provided the midpoint of the
     *      height of the view will be used.
     */


    /**
     * @attribute {Number} [zanchor=0]
     * Sets the z-axis center of the view's transformations (such as rotation)
     */


    /**
     * @attribute {String} [cursor='pointer']
     * Cursor that should be used when the mouse is over this view, can be any CSS cursor value. Only applies when clickable is true.
     */


    /**
     * @attribute {String} [boxshadow]
     * Drop shadow using standard CSS format (offset-x offset-y blur-radius spread-radius color). For example: "10px 10px 5px 0px #888888".
     */


    /**
     * @attribute {String} [ignorelayout='false']
     * Indicates if layouts should ignore this view or not. A variety of
     * configuration mechanisms are supported. Provided true or false will
     * cause the view to be ignored or not by all layouts. If instead a
     * serialized map is provided the keys of the map will target values
     * the layouts with matching names. A special key of '*' indicates a
     * default value for all layouts not specifically mentioned in the map.
     */


    /**
     * @attribute {String} [layouthint='']
     * Provides per view hinting to layouts. The specific hints supported
     * are layout specific. Hints are provided as a map. A map key may
     * be prefixied with the name of a layout followed by a '/'. This will
     * target that hint at a specific layout. If the prefix is ommitted or
     * a prefix of '*' is used the hint will be targeted to all layouts.
     */


    /**
     * @event onclick
     * Fired when this view is clicked
     * @param {dr.view} view The dr.view that fired the event
     */


    /**
     * @event onmouseover
     * Fired when the mouse moves over this view
     * @param {dr.view} view The dr.view that fired the event
     */


    /**
     * @event onmouseout
     * Fired when the mouse moves off this view
     * @param {dr.view} view The dr.view that fired the event
     */


    /**
     * @event onmousedown
     * Fired when the mouse goes down on this view
     * @param {dr.view} view The dr.view that fired the event
     */


    /**
     * @event onmouseup
     * Fired when the mouse goes up on this view
     * @param {dr.view} view The dr.view that fired the event
     */


    /**
     * @event onscroll
     * Fired when the scroll position changes. Also provides information about
     * the scroll width and scroll height though it does not refire when those
     * values change since the DOM does not generate an event when they do. This
     * event is typically delayed by a few millis after setting scrollx or
     * scrolly since the underlying DOM event fires during the next DOM refresh
     * performed by the browser.
     * @param {Object} scroll The following four properties are defined:
     *     scrollx:number The horizontal scroll position.
     *     scrolly:number The vertical scroll position.
     *     scrollwidth:number The width of the scrollable area. Note this is
     *       not the maximum value for scrollx since that depends on the bounds
     *       of the scrollable view. The maximum can be calculated using this
     *       formula: scrollwidth - view.width + 2*view.border
     *     scrollheight:number The height of the scrollable area. Note this is
     *       not the maximum value for scrolly since that depends on the bounds
     *       of the scrollable view. The maximum can be calculated using this
     *       formula: scrollheight - view.height + 2*view.border
     */

    View.prototype.construct = function(el, attributes) {

      /**
       * @attribute {dr.view[]} subviews
       * @readonly
       * An array of this views's child views
       */

      /**
       * @attribute {dr.layout[]} layouts
       * @readonly
       * An array of this views's layouts. Only defined when needed.
       */
      var key, ref, type, types;
      this.subviews = [];
      types = {
        border: 'positivenumber',
        borderstyle: 'string',
        bottomborder: 'positivenumber',
        bottompadding: 'positivenumber',
        "class": 'string',
        clickable: 'boolean',
        clip: 'boolean',
        cursor: 'string',
        height: 'size',
        ignorelayout: 'json',
        layouthint: 'json',
        leftborder: 'positivenumber',
        leftpadding: 'positivenumber',
        opacity: 'number',
        padding: 'positivenumber',
        rightborder: 'positivenumber',
        rightpadding: 'positivenumber',
        rotation: 'number',
        scrollable: 'boolean',
        scrollbars: 'boolean',
        scrollx: 'number',
        scrolly: 'number',
        skin: 'string',
        topborder: 'positivenumber',
        toppadding: 'positivenumber',
        visible: 'boolean',
        width: 'size',
        x: 'x',
        xanchor: 'string',
        xscale: 'number',
        y: 'y',
        yanchor: 'string',
        yscale: 'number',
        z: 'number',
        zanchor: 'number',
        $tagname: 'string',
        $textcontent: 'string'
      };
      ref = attributes.$types;
      for (key in ref) {
        type = ref[key];
        types[key] = type;
      }
      this._declaredTypes = attributes.$types = types;
      this.__fullBorderPaddingWidth = this.__fullBorderPaddingHeight = 0;
      this.xanchor = this.yanchor = 'center';
      this.cursor = 'pointer';
      this.bgcolor = this.bordercolor = 'transparent';
      this.borderstyle = 'solid';
      this.skin = '';
      this.leftborder = this.rightborder = this.topborder = this.bottomborder = this.border = this.leftpadding = this.rightpadding = this.toppadding = this.bottompadding = this.padding = this.x = this.y = this.width = this.height = this.innerwidth = this.innerheight = this.boundsxdiff = this.boundsydiff = this.boundsx = this.boundsy = this.boundswidth = this.boundsheight = this.zanchor = this.scrollx = this.scrolly = 0;
      this.opacity = 1;
      this.clip = this.scrollable = this.clickable = this.isaligned = this.isvaligned = this.ignorelayout = this.scrollbars = false;
      this.visible = true;
      this.createSprite(Sprite, el, attributes);
      return View.__super__.construct.apply(this, arguments);
    };

    View.prototype.initialize = function(skipevents) {
      if (this.__autoLayoutwidth) {
        this.__autoLayoutwidth.setAttribute('locked', false);
      }
      if (this.__autoLayoutheight) {
        this.__autoLayoutheight.setAttribute('locked', false);
      }
      this.__updateBounds();
      return View.__super__.initialize.apply(this, arguments);
    };

    View.prototype.createSprite = function(spriteClass, el, attributes) {
      if (spriteClass == null) {
        spriteClass = Sprite;
      }
      return this.sprite = new spriteClass(this, el, attributes);
    };

    View.prototype.destroy = function(skipevents) {
      View.__super__.destroy.apply(this, arguments);
      if (!skipevents) {
        this._removeFromParent('subviews');
      }
      this.sprite.destroy();
      return this.sprite = null;
    };

    View.prototype.defaultSetAttributeBehavior = function(name, value) {
      var existing;
      existing = this[name];
      View.__super__.defaultSetAttributeBehavior.apply(this, arguments);
      value = this[name];
      if (existing !== value) {
        return this.sprite.setAttribute(name, value);
      }
    };

    View.prototype.getBoundsRelativeToParent = function() {
      var h, w, x1, x2, xanchor, y1, y2, yanchor;
      xanchor = this.xanchor;
      yanchor = this.yanchor;
      w = this.width;
      h = this.height;
      if (xanchor === 'left') {
        xanchor = 0;
      } else if (xanchor === 'center') {
        xanchor = w / 2;
      } else if (xanchor === 'right') {
        xanchor = w;
      } else {
        xanchor = Number(xanchor);
      }
      if (yanchor === 'top') {
        yanchor = 0;
      } else if (yanchor === 'center') {
        yanchor = h / 2;
      } else if (yanchor === 'bottom') {
        yanchor = h;
      } else {
        yanchor = Number(yanchor);
      }
      x1 = this.x;
      x2 = x1 + w;
      y1 = this.y;
      y2 = y1 + h;
      return (new Path([x1, y1, x2, y1, x2, y2, x1, y2])).transformAroundOrigin(this.xscale, this.yscale, this.rotation, xanchor + x1, yanchor + y1).getBoundingBox();
    };

    View.prototype.__updateBounds = function() {
      var bounds, height, width, x, xdiff, y, ydiff;
      if (this.__boundsAreDifferent) {
        bounds = this.getBoundsRelativeToParent();
        width = bounds.width;
        height = bounds.height;
        x = bounds.x;
        y = bounds.y;
        xdiff = this.x - x;
        ydiff = this.y - y;
      } else {
        x = this.x;
        y = this.y;
        xdiff = ydiff = 0;
        width = this.width;
        height = this.height;
      }
      if (!closeTo(this.boundsx, x)) {
        this.setAndFire('boundsx', x);
      }
      if (!closeTo(this.boundsy, y)) {
        this.setAndFire('boundsy', y);
      }
      if (!closeTo(this.boundswidth, width)) {
        this.setAndFire('boundswidth', width);
      }
      if (!closeTo(this.boundsheight, height)) {
        this.setAndFire('boundsheight', height);
      }
      if (!closeTo(this.boundsxdiff, xdiff)) {
        this.setAndFire('boundsxdiff', xdiff);
      }
      if (!closeTo(this.boundsydiff, ydiff)) {
        return this.setAndFire('boundsydiff', ydiff);
      }
    };

    View.prototype.__setupAlignConstraint = function(name, value) {
      var alignattr, axis, boundsdiff, boundssize, func, funcKey, isX, normValue, oldFunc, parent, self;
      funcKey = '__alignFunc' + name;
      if (!(typeof value === 'string' || this[funcKey])) {
        return;
      }
      parent = this.parent;
      if (!(parent instanceof Node)) {
        return;
      }
      if (name === 'x') {
        isX = true;
        axis = 'innerwidth';
        boundsdiff = 'boundsxdiff';
        boundssize = 'boundswidth';
        alignattr = 'isaligned';
      } else {
        isX = false;
        axis = 'innerheight';
        boundsdiff = 'boundsydiff';
        boundssize = 'boundsheight';
        alignattr = 'isvaligned';
      }
      oldFunc = this[funcKey];
      if (oldFunc) {
        this.stopListening(parent, axis, oldFunc);
        this.stopListening(this, boundsdiff, oldFunc);
        this.stopListening(this, boundssize, oldFunc);
        delete this[funcKey];
        if (this[alignattr]) {
          this.setAndFire(alignattr, false);
        }
      }
      if (typeof value !== 'string') {
        return;
      }
      normValue = value.toLowerCase();
      self = this;
      if (normValue === 'begin' || (isX && normValue === 'left') || (!isX && normValue === 'top')) {
        func = this[funcKey] = function() {
          var val;
          val = self[boundsdiff];
          if (self[name] !== val) {
            self.__noSpecialValueHandling = true;
            return self.setAttribute(name, val);
          }
        };
        func.autoOk = true;
      } else if (normValue === 'middle' || normValue === 'center') {
        func = this[funcKey] = function() {
          self.__noSpecialValueHandling = true;
          return self.setAttribute(name, ((parent[axis] - self[boundssize]) / 2) + self[boundsdiff]);
        };
        this.listenTo(parent, axis, func);
        this.listenTo(this, boundssize, func);
      } else if (normValue === 'end' || (isX && normValue === 'right') || (!isX && normValue === 'bottom')) {
        func = this[funcKey] = function() {
          self.__noSpecialValueHandling = true;
          return self.setAttribute(name, parent[axis] - self[boundssize] + self[boundsdiff]);
        };
        this.listenTo(parent, axis, func);
        this.listenTo(this, boundssize, func);
      } else if (normValue === 'none') {
        return true;
      }
      if (func) {
        this.listenTo(this, boundsdiff, func);
        func.call();
        if (!this[alignattr]) {
          this.setAndFire(alignattr, true);
        }
        return true;
      }
    };

    View.prototype.__setupAutoConstraint = function(name, value, axis) {
      var layoutKey, oldLayout;
      layoutKey = '__autoLayout' + name;
      if (!(value === 'auto' || this[layoutKey])) {
        return;
      }
      oldLayout = this[layoutKey];
      if (oldLayout) {
        oldLayout.destroy();
        delete this[layoutKey];
      }
      if (value === 'auto') {
        this[layoutKey] = new AutoPropertyLayout(null, {
          parent: this,
          axis: axis,
          locked: this.inited ? 'false' : 'true'
        });
        if (!this.inited) {
          this.__noSpecialValueHandling = true;
          this.setAttribute(name, 0);
        }
        return true;
      }
    };

    View.prototype.__setupPercentConstraint = function(name, value, axis) {
      var func, funcKey, oldFunc, parent, scale, self;
      funcKey = '__percentFunc' + name;
      if (!(typeof value === 'string' || this[funcKey])) {
        return;
      }
      oldFunc = this[funcKey];
      parent = this.parent;
      if (!(parent instanceof Node)) {
        parent = dr.window;
        axis = axis.substring(5);
      }
      if (oldFunc) {
        this.stopListening(parent, axis, oldFunc);
        delete this[funcKey];
      }
      if (matchPercent.test(value)) {
        self = this;
        scale = parseInt(value) / 100;
        func = this[funcKey] = function() {
          self.__noSpecialValueHandling = true;
          return self.setAttribute(name, parent[axis] * scale);
        };
        this.listenTo(parent, axis, func);
        func.call();
        return true;
      }
    };

    View.prototype.set_parent = function(parent) {
      var retval;
      retval = View.__super__.set_parent.apply(this, arguments);
      if (parent instanceof View) {
        parent.subviews.push(this);
        parent.sendEvent('subviews', this);
        parent = parent.sprite;
      }
      this.sprite.set_parent(parent);
      return retval;
    };

    View.prototype.set_id = function(v) {
      var retval;
      retval = View.__super__.set_id.apply(this, arguments);
      this.sprite.set_id(v);
      return retval;
    };

    View.prototype.set_class = function(v) {
      if (this["class"] !== v) {
        this.sprite.set_class(v);
        this.setAndFire('class', v);
      }
      return noop;
    };

    View.prototype.set_clip = function(v) {
      if (this.clip !== v) {
        this.sprite.set_clip(v);
        this.setAndFire('clip', v);
      }
      return noop;
    };

    View.prototype.set_scrollable = function(v) {
      if (this.scrollable !== v) {
        this.sprite.set_scrollable(v);
        this.setAndFire('scrollable', v);
      }
      return noop;
    };

    View.prototype.set_scrollbars = function(v) {
      if (this.scrollbars !== v) {
        this.sprite.set_scrollbars(v);
        this.setAndFire('scrollbars', v);
      }
      return noop;
    };

    View.prototype.set_scrollx = function(v) {
      if (isNaN(v)) {
        v = 0;
      } else {
        v = Math.max(0, Math.min(this.sprite.getScrollWidth() - this.width + this.leftborder + this.rightborder, v));
      }
      if (this.scrollx !== v) {
        this.sprite.set_scrollx(v);
        this.setAndFire('scrollx', v);
      }
      return noop;
    };

    View.prototype.set_scrolly = function(v) {
      if (isNaN(v)) {
        v = 0;
      } else {
        v = Math.max(0, Math.min(this.sprite.getScrollHeight() - this.height + this.topborder + this.bottomborder, v));
      }
      if (this.scrolly !== v) {
        this.sprite.set_scrolly(v);
        this.setAndFire('scrolly', v);
      }
      return noop;
    };

    View.prototype.set_visible = function(v) {
      if (this.visible !== v) {
        this.sprite.set_visible(v);
        this.setAndFire('visible', v);
      }
      return noop;
    };

    View.prototype.set_bgcolor = function(v) {
      if (this.bgcolor !== v) {
        this.sprite.setAttribute('bgcolor', v);
        this.setAndFire('bgcolor', v);
      }
      return noop;
    };

    View.prototype.set_x = function(v) {
      if (!this.__noSpecialValueHandling) {
        if (this.__setupPercentConstraint('x', v, 'innerwidth')) {
          return noop;
        }
        if (this.__setupAlignConstraint('x', v)) {
          return noop;
        }
      } else {
        this.__noSpecialValueHandling = false;
      }
      if (this.x !== v) {
        this.sprite.set_x(v);
        if (this.__boundsAreDifferent && v - this.boundsxdiff !== this.boundsx) {
          this.sendEvent('boundsx', this.boundsx = v - this.boundsxdiff);
        }
        this.setAndFire('x', v);
        if (this.inited) {
          this.__updateBounds();
        }
      }
      return noop;
    };

    View.prototype.set_y = function(v) {
      if (!this.__noSpecialValueHandling) {
        if (this.__setupPercentConstraint('y', v, 'innerheight')) {
          return noop;
        }
        if (this.__setupAlignConstraint('y', v)) {
          return noop;
        }
      } else {
        this.__noSpecialValueHandling = false;
      }
      if (this.y !== v) {
        this.sprite.set_y(v);
        if (this.__boundsAreDifferent && v - this.boundsydiff !== this.boundsy) {
          this.sendEvent('boundsy', this.boundsy = v - this.boundsydiff);
        }
        this.setAndFire('y', v);
        if (this.inited) {
          this.__updateBounds();
        }
      }
      return noop;
    };

    View.prototype.set_width = function(v, noDomChange) {
      if (!this.__noSpecialValueHandling) {
        if (this.__setupPercentConstraint('width', v, 'innerwidth')) {
          return noop;
        }
        if (this.__setupAutoConstraint('width', v, 'x')) {
          return noop;
        }
      } else {
        this.__noSpecialValueHandling = false;
      }
      v = Math.max(v, this.__fullBorderPaddingWidth);
      if (this.width !== v) {
        if (!noDomChange) {
          this.sprite.setAttribute('width', v);
        }
        this.setAndFire('innerwidth', v - this.__fullBorderPaddingWidth);
        this.setAndFire('width', v);
        if (this.inited) {
          this.__updateBounds();
        }
      }
      return noop;
    };

    View.prototype.set_height = function(v, noDomChange) {
      if (!this.__noSpecialValueHandling) {
        if (this.__setupPercentConstraint('height', v, 'innerheight')) {
          return noop;
        }
        if (this.__setupAutoConstraint('height', v, 'y')) {
          return noop;
        }
      } else {
        this.__noSpecialValueHandling = false;
      }
      v = Math.max(v, this.__fullBorderPaddingHeight);
      if (this.height !== v) {
        if (!noDomChange) {
          this.sprite.setAttribute('height', v);
        }
        this.setAndFire('innerheight', v - this.__fullBorderPaddingHeight);
        this.setAndFire('height', v);
        if (this.inited) {
          this.__updateBounds();
        }
      }
      return noop;
    };

    View.prototype.set_border = function(v) {
      this.__lockBPRecalc = true;
      this.setAttribute('topborder', v);
      this.setAttribute('bottomborder', v);
      this.setAttribute('leftborder', v);
      this.setAttribute('rightborder', v);
      this.__lockBPRecalc = false;
      this.setAndFire('border', v);
      this.__updateInnerWidth();
      this.__updateInnerHeight();
      return noop;
    };

    View.prototype.set_topborder = function(v) {
      this.sprite.setAttribute('topborder', v);
      this.setAndFire('topborder', v);
      if (!this.__lockBPRecalc) {
        this.__updateBorder();
        this.__updateInnerHeight();
      }
      return noop;
    };

    View.prototype.set_bottomborder = function(v) {
      this.sprite.setAttribute('bottomborder', v);
      this.setAndFire('bottomborder', v);
      if (!this.__lockBPRecalc) {
        this.__updateBorder();
        this.__updateInnerHeight();
      }
      return noop;
    };

    View.prototype.set_leftborder = function(v) {
      this.sprite.setAttribute('leftborder', v);
      this.setAndFire('leftborder', v);
      if (!this.__lockBPRecalc) {
        this.__updateBorder();
        this.__updateInnerWidth();
      }
      return noop;
    };

    View.prototype.set_rightborder = function(v) {
      this.sprite.setAttribute('rightborder', v);
      this.setAndFire('rightborder', v);
      if (!this.__lockBPRecalc) {
        this.__updateBorder();
        this.__updateInnerWidth();
      }
      return noop;
    };

    View.prototype.__updateBorder = function() {
      var test;
      test = this.topborder;
      if (this.bottomborder === test && this.leftborder === test && this.rightborder === test) {
        return this.setAndFire('border', test);
      } else if (this.border != null) {
        return this.setAndFire('border', void 0);
      }
    };

    View.prototype.set_padding = function(v) {
      this.__lockBPRecalc = true;
      this.setAttribute('toppadding', v);
      this.setAttribute('bottompadding', v);
      this.setAttribute('leftpadding', v);
      this.setAttribute('rightpadding', v);
      this.__lockBPRecalc = false;
      this.setAndFire('padding', v);
      this.__updateInnerWidth();
      this.__updateInnerHeight();
      return noop;
    };

    View.prototype.set_toppadding = function(v) {
      this.sprite.setAttribute('toppadding', v);
      this.setAndFire('toppadding', v);
      if (!this.__lockBPRecalc) {
        this.__updatePadding();
        this.__updateInnerHeight();
      }
      return noop;
    };

    View.prototype.set_bottompadding = function(v) {
      this.sprite.setAttribute('bottompadding', v);
      this.setAndFire('bottompadding', v);
      if (!this.__lockBPRecalc) {
        this.__updatePadding();
        this.__updateInnerHeight();
      }
      return noop;
    };

    View.prototype.set_leftpadding = function(v) {
      this.sprite.setAttribute('leftpadding', v);
      this.setAndFire('leftpadding', v);
      if (!this.__lockBPRecalc) {
        this.__updatePadding();
        this.__updateInnerWidth();
      }
      return noop;
    };

    View.prototype.set_rightpadding = function(v) {
      this.sprite.setAttribute('rightpadding', v);
      this.setAndFire('rightpadding', v);
      if (!this.__lockBPRecalc) {
        this.__updatePadding();
        this.__updateInnerWidth();
      }
      return noop;
    };

    View.prototype.__updatePadding = function() {
      var test;
      test = this.toppadding;
      if (this.bottompadding === test && this.leftpadding === test && this.rightpadding === test) {
        return this.setAndFire('padding', test);
      } else if (this.padding != null) {
        return this.setAndFire('padding', void 0);
      }
    };

    View.prototype.__updateInnerWidth = function() {
      var inset;
      this.__fullBorderPaddingWidth = inset = this.leftborder + this.rightborder + this.leftpadding + this.rightpadding;
      if (inset > this.width) {
        this.__noSpecialValueHandling = true;
        this.setAttribute('width', inset, true);
      }
      return this.setAndFire('innerwidth', this.width - inset);
    };

    View.prototype.__updateInnerHeight = function() {
      var inset;
      this.__fullBorderPaddingHeight = inset = this.topborder + this.bottomborder + this.toppadding + this.bottompadding;
      if (inset > this.height) {
        this.__noSpecialValueHandling = true;
        this.setAttribute('height', inset, true);
      }
      return this.setAndFire('innerheight', this.height - inset);
    };

    View.prototype.set_clickable = function(v) {
      if (this.clickable !== v) {
        this.sprite.set_clickable(v);
        this.setAndFire('clickable', v);
      }
      return noop;
    };

    View.prototype.set_cursor = function(v) {
      if (this.cursor !== v) {
        this.sprite.set_cursor(v);
        this.setAndFire('cursor', v);
      }
      return noop;
    };

    View.prototype.__updateTransform = function() {
      var transform, xanchor, xscale, yanchor, yscale;
      transform = '';
      xscale = this.xscale;
      if (this.xscale == null) {
        xscale = this.xscale = 1;
      }
      yscale = this.yscale;
      if (this.yscale == null) {
        yscale = this.yscale = 1;
      }
      if (xscale !== 1 || yscale !== 1) {
        transform += 'scale3d(' + xscale + ',' + yscale + ',1.0)';
      }
      this.rotation || (this.rotation = 0);
      if (this.rotation % 360 !== 0) {
        transform += ' rotate3d(0,0,1.0,' + this.rotation + 'deg)';
      }
      this.__boundsAreDifferent = transform !== '';
      this.z || (this.z = 0);
      if (this.z !== 0) {
        transform += ' translate3d(0,0,' + this.z + 'px)';
        this.parent.sprite.setAttribute('transform-style', 'preserve-3d');
      }
      if (transform !== '') {
        xanchor = this.xanchor;
        if (xanchor !== 'left' && xanchor !== 'right' && xanchor !== 'center') {
          xanchor += 'px';
        }
        yanchor = this.yanchor;
        if (yanchor !== 'top' && yanchor !== 'bottom' && yanchor !== 'center') {
          yanchor += 'px';
        }
        this.sprite.setAttribute('transform-origin', xanchor + ' ' + yanchor + ' ' + this.zanchor + 'px');
      }
      return this.sprite.setAttribute('transform', transform);
    };

    View.prototype.set_perspective = function(v) {
      if (v === '0') {
        return 'none';
      } else {
        return v + 'px';
      }
    };

    View.prototype.set_xscale = function(v) {
      if (v !== this.xscale) {
        this.setAndFire('xscale', v);
        this.__updateTransform();
        if (this.inited) {
          this.__updateBounds();
        }
      }
      return noop;
    };

    View.prototype.set_yscale = function(v) {
      if (v !== this.yscale) {
        this.setAndFire('yscale', v);
        this.__updateTransform();
        if (this.inited) {
          this.__updateBounds();
        }
      }
      return noop;
    };

    View.prototype.set_rotation = function(v) {
      if (v !== this.rotation) {
        this.setAndFire('rotation', v);
        this.__updateTransform();
        if (this.inited) {
          this.__updateBounds();
        }
      }
      return noop;
    };

    View.prototype.set_z = function(v) {
      if (v !== this.z) {
        this.sprite.setAttribute('z', v);
        this.setAndFire('z', v);
        this.__updateTransform();
      }
      return noop;
    };

    View.prototype.set_xanchor = function(v) {
      if ((v == null) || v === '' || v === 'undefined') {
        v = 'center';
      }
      if (v !== this.xanchor) {
        this.setAndFire('xanchor', v);
        this.__updateTransform();
        if (this.inited) {
          this.__updateBounds();
        }
      }
      return noop;
    };

    View.prototype.set_yanchor = function(v) {
      if ((v == null) || v === '' || v === 'undefined') {
        v = 'center';
      }
      if (v !== this.yanchor) {
        this.setAndFire('yanchor', v);
        this.__updateTransform();
        if (this.inited) {
          this.__updateBounds();
        }
      }
      return noop;
    };

    View.prototype.set_zanchor = function(v) {
      if ((v == null) || v === '') {
        v = 0;
      }
      if (v !== this.zanchor) {
        this.setAndFire('zanchor', v);
        this.__updateTransform();
      }
      return noop;
    };

    View.prototype.set_skin = function(name) {
      if (this.inited && name !== this.skin) {
        this.skin = name;
        this.reskin();
        this.setAndFire('skin', name);
      } else if (!this.inited) {
        this.listenTo(this, 'init', function(sv) {
          return sv.set_skin(name);
        });
      }
      return noop;
    };

    View.prototype.attachSkinListener = function() {
      if (!this.$skinlistner) {
        this.$skinlistner = true;
        return this.listenTo(this, 'subviewAdded', function(sv) {
          sv.attachSkinListener();
          return sv.reskin();
        });
      }
    };

    View.prototype.reskin = function() {
      var i, len, results, sk, skinname, skins;
      this.attachSkinListener();
      if (!window.dr.skins) {
        console.log("<skin> hasn't been initialized yet", this);
        return;
      }
      if (this.skin) {
        skins = this.skin.split(/[^A-Za-z0-9_-]+/);
        results = [];
        for (i = 0, len = skins.length; i < len; i++) {
          skinname = skins[i];
          if (sk = window.dr.skins[skinname]) {
            results.push(sk.applyTo(this));
          } else {
            results.push(console.log('Cannot apply skin:', skinname));
          }
        }
        return results;
      } else if (this.parent && this.parent.reskin) {
        return this.parent.reskin();
      }
    };

    View.prototype.moveToFront = function() {
      var i, len, ref, subview;
      ref = this.parent.subviews;
      for (i = 0, len = ref.length; i < len; i++) {
        subview = ref[i];
        if (!subview.z) {
          subview.setAttribute('z', 0);
        }
        if (this.z <= subview.z) {
          this.z = subview.z + 1;
        }
      }
      return this.__updateTransform();
    };


    /**
     * @method moveToBack
     * Moves view behind all other sibling views
     */

    View.prototype.moveToBack = function() {
      var i, len, ref, subview;
      ref = this.parent.subviews;
      for (i = 0, len = ref.length; i < len; i++) {
        subview = ref[i];
        if (!subview.z) {
          subview.setAttribute('z', 0);
        }
        if (this.z >= subview.z) {
          this.z = subview.z - 1;
        }
      }
      return this.__updateTransform();
    };


    /**
     * @method moveInFrontOf
     * Moves view to the front of sibling view
     * @param {dr.view} View to move in front of
     */

    View.prototype.moveInFrontOf = function(otherView) {
      if (otherView) {
        if (!otherView.z) {
          otherView.setAttribute('z', 0);
        }
        this.z = otherView.z + 1;
        return this.__updateTransform();
      }
    };


    /**
     * @method moveBehind
     * Moves view to the behind sibling view
     * @param {dr.view} View to move behind
     */

    View.prototype.moveBehind = function(otherView) {
      if (otherView) {
        if (!otherView.z) {
          otherView.setAttribute('z', 0);
        }
        this.z = otherView.z - 1;
        return this.__updateTransform();
      }
    };


    /**
     * Calls doSubviewAdded/doLayoutAdded if the added subnode is a view or
     * layout respectively. Subclasses should call super.
     * @private
     */

    View.prototype.doSubnodeAdded = function(node) {
      if (node instanceof View) {
        node.__updateBounds();

        /**
         * @event subviewAdded
         * Fired when a subview is added to this view.
         * @param {dr.view} view The dr.view that was added
         */
        this.sendEvent('subviewAdded', node);
        return this.doSubviewAdded(node);
      } else if (node instanceof Layout) {
        return this.doLayoutAdded(node);
      }
    };


    /**
     * Calls doSubviewRemoved/doLayoutRemoved if the removed subnode is a view or
     * layout respectively. Subclasses should call super.
     * @private
     */

    View.prototype.doSubnodeRemoved = function(node) {
      if (node instanceof View) {

        /**
         * @event subviewRemoved
         * Fired when a subview is removed from this view.
         * @param {dr.view} view The dr.view that was removed
         */
        this.sendEvent('subviewRemoved', node);
        return this.doSubviewRemoved(node);
      } else if (node instanceof Layout) {
        return this.doLayoutRemoved(node);
      }
    };


    /**
     * Called when a subview is added to this view. Provides a hook for
     * subclasses. No need for subclasses to call super. Do not call this
     * method to add a subview. Instead call setParent.
     * @param {dr.view} sv The subview that was added.
     * @return {void}
     */

    View.prototype.doSubviewAdded = function(sv) {};


    /**
     * Called when a subview is removed from this view. Provides a hook for
     * subclasses. No need for subclasses to call super. Do not call this
     * method to remove a subview. Instead call _removeFromParent.
     * @param {dr.view} sv The subview that was removed.
     * @return {void}
     */

    View.prototype.doSubviewRemoved = function(sv) {};


    /**
     * Called when a layout is added to this view. Provides a hook for
     * subclasses. No need for subclasses to call super. Do not call this
     * method to add a layout. Instead call setParent.
     * @param {dr.layout} layout The layout that was added.
     * @return {void}
     */

    View.prototype.doLayoutAdded = function(layout) {};


    /**
     * Called when a layout is removed from this view. Provides a hook for
     * subclasses. No need for subclasses to call super. Do not call this
     * method to remove a layout. Instead call _removeFromParent.
     * @param {dr.layout} layout The layout that was removed.
     * @return {void}
     */

    View.prototype.doLayoutRemoved = function(layout) {};


    /**
     * Gets the value of a named layout hint.
     * @param {String} layoutName The name of the layout to match.
     * @param {String} key The name of the hint to match.
     * @return {*} The value of the hint or undefined if not found.
     */

    View.prototype.getLayoutHint = function(layoutName, hintName) {
      var hint, hints;
      hints = this.layouthint;
      if (hints) {
        hint = hints[layoutName + '/' + hintName];
        if (hint != null) {
          return hint;
        }
        hint = hints[hintName];
        if (hint != null) {
          return hint;
        }
        hint = hints['*/' + hintName];
        if (hint != null) {
          return hint;
        }
      } else {

      }
    };

    View.prototype.getAbsolute = function() {
      return this.sprite.getAbsolute();
    };

    return View;

  })(Node);

  return View;

}).call(this);
;
    warnings = [];
    showWarnings = function(data) {
      var out, pre;
      warnings = warnings.concat(data);
      out = data.join('\n');
      pre = document.createElement('pre');
      pre.setAttribute('class', 'warnings');
      pre.textContent = out;
      document.body.insertBefore(pre, document.body.firstChild);
      return console.error(out);
    };
    specialtags = ['handler', 'method', 'attribute', 'setter', 'include'];
    matchEvent = /^on(.+)/;
    tagPackageSeparator = '-';
    dom = (function() {
      var builtinTags, checkRequiredAttributes, exports, findAutoIncludes, flattenattributes, getChildElements, htmlDecode, initAllElements, initElement, initFromElement, processSpecialTags, requiredAttributes, sendInit, writeCSS;
      flattenattributes = function(namednodemap) {
        var attributes, i, j, len;
        attributes = {};
        for (j = 0, len = namednodemap.length; j < len; j++) {
          i = namednodemap[j];
          attributes[i.name] = i.value;
        }
        return attributes;
      };
      sendInit = function(el) {
        var event;
        event = document.createEvent('Event');
        event.initEvent('dreeminit', true, true);
        window.dispatchEvent(event);
        return $(el).addClass('dreeminited');
      };
      initFromElement = function(el) {
        instantiating = true;
        el.style.visibility = 'hidden';
        return findAutoIncludes(el, function() {
          el.style.visibility = null;
          initElement(el);
          _initConstraints();
          return sendInit(el);
        });
      };
      getChildElements = function(el) {
        var child, j, len, ref, results;
        ref = el.childNodes;
        results = [];
        for (j = 0, len = ref.length; j < len; j++) {
          child = ref[j];
          if (child.nodeType === 1) {
            results.push(child);
          }
        }
        return results;
      };
      findAutoIncludes = function(parentel, finalcallback) {
        var blacklist, dependencies, fileloaded, filereloader, filerequests, findIncludeURLs, findMissingClasses, includedScripts, inlineclasses, jqel, loadInclude, loadIncludes, loadMixins, loadScript, loadqueue, scriptloading, validator;
        jqel = $(parentel);
        includedScripts = {};
        loadqueue = [];
        scriptloading = false;
        dependencies = [];
        loadScript = function(url, cb, error) {
          var appendScript, appendcallback;
          if (url in includedScripts) {
            return;
          }
          includedScripts[url] = true;
          dependencies.push(url);
          if (scriptloading) {
            loadqueue.push(url, error);
            return url;
          }
          appendScript = function(url, cb, error) {
            var script;
            if (error == null) {
              error = 'failed to load scriptinclude ' + url;
            }
            scriptloading = url;
            script = document.createElement('script');
            script.type = 'text/javascript';
            $('head').append(script);
            script.onload = cb;
            script.onerror = function(err) {
              console.error(error, err);
              return cb();
            };
            return script.src = url;
          };
          appendcallback = function() {
            scriptloading = false;
            if (loadqueue.length === 0) {
              return cb();
            } else {
              return appendScript(loadqueue.shift(), appendcallback, loadqueue.shift());
            }
          };
          return appendScript(url, appendcallback, error);
        };
        inlineclasses = {};
        filerequests = [];
        fileloaded = {};
        loadInclude = function(url, el) {
          var prom;
          if (url in fileloaded) {
            return;
          }
          fileloaded[url] = el;
          dependencies.push(url);
          prom = $.get(url);
          prom.url = url;
          prom.el = el;
          return filerequests.push(prom);
        };
        loadMixins = function(el, names) {
          var j, len, mixin, ref, results;
          if (names == null) {
            names = {};
          }
          if (el.attributes["with"] && (el.attributes["with"].value != null)) {
            ref = el.attributes["with"].value.split(',');
            results = [];
            for (j = 0, len = ref.length; j < len; j++) {
              mixin = ref[j];
              results.push(names[mixin.trim()] = el);
            }
            return results;
          }
        };
        findMissingClasses = function(names) {
          var el, j, len, name, out, ref, ref1, ref2;
          if (names == null) {
            names = {};
          }
          ref = jqel.find('*');
          for (j = 0, len = ref.length; j < len; j++) {
            el = ref[j];
            name = el.localName;
            if (name === 'class') {
              if (el.attributes["extends"]) {
                names[el.attributes["extends"].value] = el;
              }
              loadMixins(el, names);
              inlineclasses[(ref1 = el.attributes.name) != null ? ref1.value : void 0] = true;
            } else if (name === 'replicator') {
              names[name] = el;
              names[el.attributes.classname.value] = el;
              loadMixins(el, names);
            } else {
              if (ref2 = el.parentNode.localName, indexOf.call(specialtags, ref2) < 0) {
                names[name] = el;
                loadMixins(el, names);
              }
            }
          }
          out = {};
          for (name in names) {
            el = names[name];
            if (!(name in dr || name in fileloaded || indexOf.call(specialtags, name) >= 0 || name in inlineclasses || builtinTags[name])) {
              out[name] = el;
            }
          }
          return out;
        };
        findIncludeURLs = function(urls) {
          var el, j, len, ref, url;
          if (urls == null) {
            urls = {};
          }
          ref = jqel.find('include');
          for (j = 0, len = ref.length; j < len; j++) {
            el = ref[j];
            url = el.attributes.href.value;
            el.parentNode.removeChild(el);
            urls[url] = el;
          }
          return urls;
        };
        loadIncludes = function(callback) {
          var el, ref, url;
          if (!fileloaded['skin']) {
            fileloaded['skin'] = true;
            loadInclude(DREEM_ROOT + "classes/skin.dre");
          }
          ref = findIncludeURLs();
          for (url in ref) {
            el = ref[url];
            loadInclude(url, el);
          }
          return $.when.apply($, filerequests).done(function() {
            var args, file, html, includeRE, j, len, name, ref1, results, xhr;
            args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
            if (filerequests.length === 1) {
              args = [args];
            }
            filerequests = [];
            includeRE = /<[\/]*library>/gi;
            for (j = 0, len = args.length; j < len; j++) {
              xhr = args[j];
              html = xhr[0].replace(includeRE, '');
              jqel.prepend(html);
            }
            ref1 = findMissingClasses();
            for (name in ref1) {
              el = ref1[name];
              fileloaded[name] = true;
              if (name) {
                loadInclude(DREEM_ROOT + "classes/" + name.split(tagPackageSeparator).join('/') + ".dre", el);
              }
            }
            $.when.apply($, filerequests).done(function() {
              var args, includes, k, len1, oneurl;
              args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
              if (filerequests.length === 1) {
                args = [args];
              }
              filerequests = [];
              for (k = 0, len1 = args.length; k < len1; k++) {
                xhr = args[k];
                jqel.prepend(xhr[0]);
                jqel.contents().each(function() {
                  if (this.nodeType === COMMENT_NODE) {
                    return $(this).remove();
                  }
                });
              }
              includes = findMissingClasses(findIncludeURLs());
              if (Object.keys(includes).length > 0) {
                loadIncludes(callback);
                return;
              }
              oneurl = DREEM_ROOT + 'lib/one_base.js';
              return $.ajax({
                dataType: "script",
                cache: true,
                url: oneurl
              }).done(function() {
                var l, len2, ref2, results, trimmedUrl;
                ONE.base_.call(Eventable.prototype);
                Eventable.prototype.enumfalse(Eventable.prototype.keys());
                Node.prototype.enumfalse(Node.prototype.keys());
                View.prototype.enumfalse(View.prototype.keys());
                Layout.prototype.enumfalse(Layout.prototype.keys());
                State.prototype.enumfalse(State.prototype.keys());
                loadScript(DREEM_ROOT + 'lib/animator.js', callback, 'Missing /lib/animator.js');
                ref2 = jqel.find('[scriptincludes]');
                results = [];
                for (l = 0, len2 = ref2.length; l < len2; l++) {
                  el = ref2[l];
                  results.push((function() {
                    var len3, m, ref3, ref4, results1;
                    ref3 = el.attributes.scriptincludes.value.split(',');
                    results1 = [];
                    for (m = 0, len3 = ref3.length; m < len3; m++) {
                      url = ref3[m];
                      trimmedUrl = url.trim();
                      if (!(trimmedUrl.match(/^\w+:\/\//) || trimmedUrl.match(/^\//))) {
                        trimmedUrl = DREEM_ROOT + trimmedUrl;
                      }
                      results1.push(loadScript(trimmedUrl, callback, (ref4 = el.attributes.scriptincludeserror) != null ? ref4.value.toString() : void 0));
                    }
                    return results1;
                  })());
                }
                return results;
              }).fail(function() {
                return console.warn("failed to load " + oneurl);
              });
            }).fail(function() {
              var args, k, len1;
              args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
              if (args.length === 1) {
                args = [args];
              }
              for (k = 0, len1 = args.length; k < len1; k++) {
                xhr = args[k];
                showWarnings(["failed to load " + xhr.url + " for element " + xhr.el.outerHTML]);
              }
            });
            results = [];
            for (file in fileloaded) {
              results.push(fileloaded[file] = true);
            }
            return results;
          }).fail(function() {
            var args, j, len, xhr;
            args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
            if (args.length === 1) {
              args = [args];
            }
            for (j = 0, len = args.length; j < len; j++) {
              xhr = args[j];
              showWarnings(["failed to load " + xhr.url + " for element " + xhr.el.outerHTML]);
            }
          });
        };
        blacklist = ['/primus/primus.io.js'];
        filereloader = function() {
          var paths;
          dependencies.push(window.location.pathname);
          dependencies.push('/core/dreem.coffee');
          paths = dependencies.filter(function(path) {
            if (indexOf.call(blacklist, path) < 0) {
              return true;
            }
          });
          return $.ajax({
            url: '/watchfile/',
            datatype: 'text',
            data: {
              url: paths
            },
            success: function(url) {
              if (indexOf.call(paths, url) >= 0) {
                return window.location.reload();
              }
            }
          }).done(function(data) {
            return console.log('[RELOAD]', data, 'changed on server, reloading page');
          }).fail(function(jqXHR, textStatus, errorThrown) {
            if (jqXHR.status === 0) {
              return setTimeout(filereloader, 3000);
            } else {
              return console.log('Watchfile AJAX request failed', jqXHR.status, textStatus, errorThrown);
            }
          });
        };
        validator = function() {
          return $.ajax({
            url: '/validate/',
            data: {
              url: window.location.pathname
            },
            success: function(data) {
              if (data.length) {
                showWarnings(data);
              }
              return setTimeout(filereloader, 1000);
            },
            error: function(err) {
              return console.warn('Validation requires the Teem server');
            }
          }).always(finalcallback);
        };
        return loadIncludes(test ? finalcallback : validator);
      };
      builtinTags = {
        'a': true,
        'abbr': true,
        'address': true,
        'area': true,
        'article': true,
        'aside': true,
        'audio': true,
        'b': true,
        'base': true,
        'bdi': true,
        'bdo': true,
        'blockquote': true,
        'body': true,
        'br': true,
        'button': true,
        'canvas': true,
        'caption': true,
        'cite': true,
        'code': true,
        'col': true,
        'colgroup': true,
        'command': true,
        'datalist': true,
        'dd': true,
        'del': true,
        'details': true,
        'dfn': true,
        'div': true,
        'dl': true,
        'dt': true,
        'em': true,
        'embed': true,
        'fieldset': true,
        'figcaption': true,
        'figure': true,
        'footer': true,
        'form': true,
        'h1': true,
        'h2': true,
        'h3': true,
        'h4': true,
        'h5': true,
        'h6': true,
        'head': true,
        'header': true,
        'hgroup': true,
        'hr': true,
        'html': true,
        'i': true,
        'iframe': true,
        'img': true,
        'image': true,
        'input': true,
        'ins': true,
        'kbd': true,
        'keygen': true,
        'label': true,
        'legend': true,
        'li': true,
        'link': true,
        'map': true,
        'mark': true,
        'menu': true,
        'meta': true,
        'meter': true,
        'nav': true,
        'noscript': true,
        'object': true,
        'ol': true,
        'optgroup': true,
        'option': true,
        'output': true,
        'p': true,
        'param': true,
        'pre': true,
        'progress': true,
        'q': true,
        'rp': true,
        'rt': true,
        'ruby': true,
        's': true,
        'samp': true,
        'script': true,
        'section': true,
        'select': true,
        'small': true,
        'source': true,
        'span': true,
        'strong': true,
        'style': true,
        'sub': true,
        'summary': true,
        'sup': true,
        'table': true,
        'tbody': true,
        'td': true,
        'textarea': true,
        'tfoot': true,
        'th': true,
        'thead': true,
        'time': true,
        'title': true,
        'tr': true,
        'track': true,
        'u': true,
        'ul': true,
        'var': true,
        'video': true,
        'wbr': true
      };
      requiredAttributes = {
        "class": {
          "name": 1
        },
        "method": {
          "name": 1
        },
        "setter": {
          "name": 1
        },
        "handler": {
          "event": 1
        },
        "attribute": {
          "name": 1,
          "type": 1,
          "value": 1
        },
        "dataset": {
          "name": 1
        },
        "replicator": {
          "classname": 1
        }
      };
      checkRequiredAttributes = function(tagname, attributes, tag, parenttag) {
        var attrname, error;
        if (tagname in requiredAttributes) {
          for (attrname in requiredAttributes[tagname]) {
            if (!(attrname in attributes)) {
              error = tagname + "." + attrname + " must be defined on " + tag.outerHTML;
              if (parenttag) {
                error = error + (" inside " + parenttag.outerHTML);
              }
              showWarnings([error]);
            }
          }
        }
        return error;
      };
      initElement = function(el, parent) {
        var attr, attributes, checkChildren, child, children, event, eventname, isClass, isState, j, k, len, len1, li, skiponinit, tagname;
        if (el.$init) {
          return;
        }
        el.$init = true;
        tagname = el.localName;
        if (!tagname in dr) {
          if (!builtinTags[tagname]) {
            console.warn('could not find class for tag', tagname, el);
          }
          return;
        } else if (builtinTags[tagname]) {
          if (!(tagname === 'input' || tagname === 'textarea')) {
            console.warn('refusing to create a class that would overwrite the builtin tag', tagname);
          }
          return;
        }
        attributes = flattenattributes(el.attributes);
        checkRequiredAttributes(tagname, attributes, el);
        attributes.$tagname = tagname;
        for (j = 0, len = mouseEvents.length; j < len; j++) {
          event = mouseEvents[j];
          eventname = 'on' + event;
          if (eventname in attributes) {
            if (attributes.clickable !== false) {
              attributes.clickable = true;
            }
            el.removeAttribute(eventname);
          }
        }
        for (attr in attributes) {
          if (matchEvent.test(attr)) {
            el.removeAttribute(attr);
          }
        }
        if (parent == null) {
          parent = el.parentNode;
        }
        if (parent != null) {
          attributes.parent = parent;
        }
        li = tagname.lastIndexOf('state');
        isState = li > -1 && li === tagname.length - 5;
        isClass = tagname === 'class';
        if (!(isClass || isState)) {
          dom.processSpecialTags(el, attributes, attributes.type);
        }
        children = dom.getChildElements(el);
        attributes.$skiponinit = skiponinit = children.length > 0;
        if (typeof dr[tagname] === 'function') {
          parent = new dr[tagname](el, attributes, true);
        } else {
          showWarnings(["Unrecognized class " + tagname + " " + el.outerHTML]);
          return;
        }
        if (!(children.length > 0)) {
          return;
        }
        if (!(isClass || isState)) {
          if (!dr[tagname].skipinitchildren) {
            children = (function() {
              var k, len1, ref, ref1, results;
              ref = dom.getChildElements(el);
              results = [];
              for (k = 0, len1 = ref.length; k < len1; k++) {
                child = ref[k];
                if (ref1 = child.localName, indexOf.call(specialtags, ref1) < 0) {
                  results.push(child);
                }
              }
              return results;
            })();
            for (k = 0, len1 = children.length; k < len1; k++) {
              child = children[k];
              initElement(child, parent);
            }
          }
          if (!parent.inited) {
            checkChildren = function() {
              if (parent.inited) {
                return;
              }
              parent._bindHandlers(true);
              parent.initialize();
            };
            callOnIdle(checkChildren);
          }
        }
      };
      writeCSS = function() {
        var noSelectStyle, spriteInputTextStyle, spriteStyle, spriteTextStyle, style, warningsStyle;
        style = document.createElement('style');
        style.type = 'text/css';
        spriteStyle = ["position:absolute", "pointer-events:none", "padding:0", "margin:0", "box-sizing:border-box", "border-color:transparent", "border-style:solid", "border-width:0"];
        spriteTextStyle = ["white-space:nowrap", "padding:0", "margin:0", "text-decoration:none", "font-family:inherit", "font-size:20px"];
        spriteInputTextStyle = ["border:none", "outline:none", "background-color:transparent", "resize:none"];
        noSelectStyle = ["-webkit-touch-callout:none", "-webkit-user-select:none", "-khtml-user-select:none", "-moz-user-select:none", "-ms-user-select:none", "user-select:none"];
        warningsStyle = ["font-size:14px", "background-color:pink", "margin:0"];
        style.innerHTML = '.sprite{' + spriteStyle.join(';') + '}' + '.sprite-text{' + spriteTextStyle.join(';') + '}' + '.sprite-inputtext{' + spriteInputTextStyle.join(';') + '}' + '.noselect{' + noSelectStyle.join(';') + '}' + '.warnings{' + warningsStyle.join(';') + '}' + '.noscrollbar::-webkit-scrollbar{display:none;}' + '.hidden{display:none}' + 'method,handler,setter,class,node,dataset{display:none}';
        return document.getElementsByTagName('head')[0].appendChild(style);
      };
      initAllElements = function(selector) {
        var el, j, len;
        if (selector == null) {
          selector = $('view').not('view view');
        }
        for (j = 0, len = selector.length; j < len; j++) {
          el = selector[j];
          initFromElement(el);
        }
      };
      htmlDecode = function(input) {
        var child, e, j, len, out, ref;
        e = document.createElement('div');
        e.innerHTML = input;
        out = '';
        ref = e.childNodes;
        for (j = 0, len = ref.length; j < len; j++) {
          child = ref[j];
          if ((child.nodeValue != null) && (child.nodeType === 3 || child.nodeType === 8)) {
            out += child.nodeValue;
          } else {
            return;
          }
        }
        return out;
      };
      processSpecialTags = function(el, classattributes, defaulttype) {
        var args, attributes, base1, child, children, handler, j, len, name, ref, ref1, script, tagname, type;
        if (classattributes.$types == null) {
          classattributes.$types = {};
        }
        if (classattributes.$methods == null) {
          classattributes.$methods = {};
        }
        if (classattributes.$handlers == null) {
          classattributes.$handlers = [];
        }
        children = (function() {
          var j, len, ref, ref1, results;
          ref = dom.getChildElements(el);
          results = [];
          for (j = 0, len = ref.length; j < len; j++) {
            child = ref[j];
            if (ref1 = child.localName, indexOf.call(specialtags, ref1) >= 0) {
              results.push(child);
            }
          }
          return results;
        })();
        for (j = 0, len = children.length; j < len; j++) {
          child = children[j];
          attributes = flattenattributes(child.attributes);
          tagname = child.localName;
          args = ((ref = attributes.args) != null ? ref : '').split();
          script = htmlDecode(child.innerHTML);
          if (script == null) {
            console.warn('Invalid tag', name, child);
          }
          type = (ref1 = attributes.type) != null ? ref1 : defaulttype;
          name = attributes.name;
          checkRequiredAttributes(tagname, attributes, child, el);
          switch (tagname) {
            case 'handler':
              handler = {
                name: name,
                ev: attributes.event,
                script: compiler.transform(script, type),
                args: args,
                reference: attributes.reference,
                method: attributes.method
              };
              classattributes.$handlers.push(handler);
              break;
            case 'method':
            case 'setter':
              if (tagname === 'setter') {
                name = "set_" + (name.toLowerCase());
              }
              if ((base1 = classattributes.$methods)[name] == null) {
                base1[name] = [];
              }
              classattributes.$methods[name].push({
                method: compiler.transform(script, type),
                args: args,
                allocation: attributes.allocation
              });
              break;
            case 'attribute':
              name = name.toLowerCase();
              classattributes[name] = attributes.value;
              classattributes.$types[name] = attributes.type;
          }
        }
        return children;
      };
      return exports = {
        initAllElements: initAllElements,
        initElement: initElement,
        processSpecialTags: processSpecialTags,
        writeCSS: writeCSS,
        getChildElements: getChildElements
      };
    })();
    State = 
/**
 * @class dr.state {Core Dreem}
 * @extends dr.node
 * Allows a group of attributes, methods, handlers and instances to be removed and applied as a group.
#
 * Like views and nodes, states can contain methods, handlers, setters, constraints, attributes and other view, node or class instances.
#
 * Currently, states must end with the string 'state' in their name to work properly.
#
 *     @example
 *     <spacedlayout axis="y"></spacedlayout>
 *     <view id="square" width="100" height="100" bgcolor="lightgrey">
 *       <attribute name="ispink" type="boolean" value="false"></attribute>
 *       <state name="pinkstate" applied="${this.parent.ispink}">
 *         <attribute name="bgcolor" value="pink" type="string"></attribute>
 *       </state>
 *     </view>
 *     <labelbutton text="pinkify!">
 *       <handler event="onclick">
 *         square.setAttribute('ispink', true);
 *       </handler>
 *     </labelbutton>
#
 * You can set the 'applied' attribute to true to activate a state.
#
 *     @example
 *     <view id="square" width="200" height="100" bgcolor="lightgrey">
 *       <state name="pinkstate">
 *         <view name="sub" bgcolor="pink" width="100" height="100"></view>
 *       </state>
 *       <handler event="oninit">
 *         this.pinkstate.setAttribute('applied', true);
 *       </handler>
 *     </view>
#
 */

(function() {
  var State,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  State = (function(superClass) {
    extend(State, superClass);

    function State(el, attributes) {
      var base, base1, child, compilertype, finish, handler, j, k, len, len1, name, oldbody, processedChildren, ref, ref1, value;
      if (attributes == null) {
        attributes = {};
      }
      this.skipattributes = ['parent', 'types', 'applyattributes', 'applied', 'skipattributes', 'stateattributes', 'subnodes'];
      this.subnodes = [];
      this.stateattributes = attributes;
      this.applyattributes = {};
      this.applied = false;
      compilertype = attributes.type;
      processedChildren = dom.processSpecialTags(el, attributes, compilertype);
      oldbody = el.innerHTML.trim();
      for (j = 0, len = processedChildren.length; j < len; j++) {
        child = processedChildren[j];
        child.parentNode.removeChild(child);
      }
      this.instancebody = el.innerHTML.trim();
      if (oldbody) {
        el.innerHTML = oldbody;
      }
      this.types = (ref = attributes.$types) != null ? ref : {};
      this.setAttribute('parent', attributes.parent);
      if ((base = this.parent).states == null) {
        base.states = [];
      }
      if ((base1 = this.parent.states).origmethods == null) {
        base1.origmethods = {};
      }
      this.parent.states.push(this);
      this.parent.sendEvent('states', this.parent.states);
      this.statemethods = attributes.$methods;
      for (name in attributes) {
        value = attributes[name];
        if (!(indexOf.call(this.skipattributes, name) >= 0 || name.charAt(0) === '$')) {
          if (name !== 'name') {
            this.applyattributes[name] = value;
          }
          this.setAttribute(name, value);
        }
      }
      if (attributes.applied) {
        this.bindAttribute('applied', attributes.applied, 'state');
      }
      ref1 = attributes.$handlers;
      for (k = 0, len1 = ref1.length; k < len1; k++) {
        handler = ref1[k];
        if (handler.ev === 'onapplied') {
          this.installHandlers([handler], 'state', this);
          this._bindHandlers();
        }
      }
      finish = (function(_this) {
        return function() {
          if (_this.constraints) {
            _this._bindConstraints();
          }
          if (_this.events) {
            _this.skipattributes.push('events');
          }
          return _this.enumfalse(_this.skipattributes);
        };
      })(this);
      callOnIdle(finish);
      if (el) {
        el.$view = this;
      }
      this.children = [];
      this.initialize(true);
    }


    /**
     * @attribute {Boolean} [applied=false]
     * If true, the state is applied.  Note that onapplied handlers run in the scope of the state itself, see dr.dragstate for an example.
     */

    State.prototype.set_applied = function(applied) {
      var name, origmethods, val;
      if (this.parent && this.applied !== applied) {
        origmethods = this.parent.states.origmethods;
        for (name in origmethods) {
          this.parent[name] = origmethods[name];
        }
        if (applied) {
          this._apply();
        } else {
          this._remove();
        }
        for (name in this.applyattributes) {
          val = this.parent[name];
          delete this.parent[name];
          this.parent.setAttribute(name, val, true);
        }
      }
      return applied;
    };

    State.prototype._apply = function() {
      var children, childrenbefore, el, i, j, k, l, len, len1, len2, name, origmethods, parentel, ref, state, subnode;
      if (this.applied) {
        return;
      }
      this.parent.learn(this);
      origmethods = this.parent.states.origmethods;
      for (name in this.statemethods) {
        if (name in this.parent) {
          if (indexOf.call(origmethods, name) < 0) {
            origmethods[name] = this.parent[name];
          }
        }
      }
      ref = this.parent.states;
      for (j = 0, len = ref.length; j < len; j++) {
        state = ref[j];
        if (state.applied || state === this) {
          this.parent.installMethods(state.statemethods, this.parent.$tagname, this.parent, this.parent);
        }
      }
      if (this.instancebody) {
        parentel = this.parent.sprite.el;
        childrenbefore = dom.getChildElements(parentel);
        for (k = 0, len1 = childrenbefore.length; k < len1; k++) {
          el = childrenbefore[k];
          if (el.$view) {
            el.$view = null;
          }
        }
        parentel.innerHTML += this.instancebody;
        children = dom.getChildElements(parentel);
        for (i = l = 0, len2 = children.length; l < len2; i = ++l) {
          el = children[i];
          if (i < childrenbefore.length) {
            subnode = this.parent.subnodes[i];
            if (subnode != null ? subnode.sprite : void 0) {
              subnode.sprite.el = el;
            }
            el.$view = subnode;
          } else {
            dom.initElement(el, this.parent);
            this.children.push(el.$view);
          }
        }
      }
      if (this.stateattributes.$handlers) {
        this.parent.installHandlers(this.stateattributes.$handlers, this.parent.$tagname, this.parent);
        return this.parent._bindHandlers();
      }
    };

    State.prototype._remove = function() {
      var child, j, len, ref, state;
      if (!this.applied) {
        return;
      }
      this.parent.forget(this);
      while (child = this.children.pop()) {
        child.destroy();
      }
      ref = this.parent.states;
      for (j = 0, len = ref.length; j < len; j++) {
        state = ref[j];
        if (state.applied && state !== this) {
          this.parent.installMethods(state.statemethods, this.parent.$tagname, this.parent, this.parent);
        }
      }
      if (this.stateattributes.$handlers) {
        return this.parent.removeHandlers(this.stateattributes.$handlers, this.parent.$tagname, this.parent);
      }
    };

    return State;

  })(Node);

  return State;

}).call(this);
;
    Class = 
/**
 * @class dr.class {Core Dreem}
 * Allows new tags to be created. Classes only be created with the &lt;class>&lt;/class> tag syntax.
#
 * Classes can extend any other class, and they extend dr.view by default.
#
 * Once declared, classes invoked with the declarative syntax, e.g. &lt;classname>&lt;/classname>.
#
 * If a class can't be found in the document, dreem will automatically attempt to load it from the classes/* directory.
#
 * Like views and nodes, classes can contain methods, handlers, setters, constraints, attributes and other view, node or class instances.
#
 * Here is a class called 'tile' that extends dr.view. It sets the bgcolor, width, and height attributes. An instance of tile is created using declarative syntax.
#
 *     @example
 *     <class name="tile" extends="view" bgcolor="thistle" width="100" height="100"></class>
#
 *     <tile></tile>
#
 * Now we'll extend the tile class with a class called 'labeltile', which contains a label inside of the box. We'll declare one each of tile and labeltile, and position them with a spacedlayout.
#
 *     @example
 *     <class name="tile" extends="view" bgcolor="thistle" width="100" height="100"></class>
#
 *     <class name="labeltile" extends="tile">
 *       <text text="Tile"></text>
 *     </class>
#
 *     <spacedlayout></spacedlayout>
 *     <tile></tile>
 *     <labeltile></labeltile>
#
 * Attributes that are declared inside of a class definition can be set when the instance is declared. Here we bind the label text to the value of an attribute called label.
#
 *     @example
 *     <class name="tile" extends="view" bgcolor="thistle" width="100" height="100"></class>
#
 *     <class name="labeltile" extends="tile">
 *       <attribute name="label" type="string" value=""></attribute>
 *       <text text="${this.parent.label}"></text>
 *     </class>
#
 *     <spacedlayout></spacedlayout>
 *     <tile></tile>
 *     <labeltile label="The Tile"></labeltile>
#
 */

(function() {
  var Class,
    indexOf = [].indexOf || function(item) { for (var i = 0, l = this.length; i < l; i++) { if (i in this && this[i] === item) return i; } return -1; };

  Class = (function() {

    /**
     * @attribute {String} name (required)
     * The name of the new tag.
     */

    /**
     * @attribute {String} [extends=view]
     * The name of a class that should be extended.
     */

    /**
     * @attribute {"js"/"coffee"} [type=js]
     * The default compiler to use for methods, setters and handlers. Either 'js' or 'coffee'
     */

    /**
     * @attribute {Boolean} [initchildren=true]
     * If false, class instances won't initialize their children.
     */
    function Class(el, classattributes) {
      var child, compilertype, context, extend, haschildren, i, idx, ignored, instancebody, j, k, klass, len, len1, len2, len3, name, newContext, oldbody, part, parts, processedChildren, ref, skipinitchildren;
      if (classattributes == null) {
        classattributes = {};
      }
      name = (classattributes.name ? classattributes.name.toLowerCase() : classattributes.name);
      extend = classattributes["extends"] != null ? classattributes["extends"] : classattributes["extends"] = 'view';
      compilertype = classattributes.type;
      skipinitchildren = classattributes.initchildren === 'false';
      delete classattributes.initchildren;
      for (ignored in ignoredAttributes) {
        delete classattributes[ignored];
      }
      ref = el.childNodes;
      for (i = 0, len1 = ref.length; i < len1; i++) {
        child = ref[i];
        if ((child != null) && child.nodeType === COMMENT_NODE) {
          child.parentNode.removeChild(child);
        }
      }
      processedChildren = dom.processSpecialTags(el, classattributes, compilertype);
      oldbody = el.innerHTML.trim();
      for (j = 0, len2 = processedChildren.length; j < len2; j++) {
        child = processedChildren[j];
        child.parentNode.removeChild(child);
      }
      haschildren = dom.getChildElements(el).length > 0;
      instancebody = el.innerHTML.trim();
      if (oldbody) {
        el.innerHTML = oldbody;
      }
      if (name in dr) {
        console.warn('overwriting class', name);
      }
      dr[name] = klass = function(instanceel, instanceattributes, internal, skipchildren) {
        var attributes, children, k, len3, parent, ref1, sendInit, viewel, viewhtml;
        attributes = clone(classattributes);
        _processAttrs(instanceattributes, attributes);
        if (attributes.$instanceattributes == null) {
          attributes.$instanceattributes = instanceattributes;
        }
        if (!(extend in dr)) {
          console.warn('could not find class for tag', extend);
          return;
        }
        if (attributes.$tagname === 'class' || !attributes.$tagname) {
          attributes.$tagname = name;
        }
        attributes.$skiponinit = true;
        attributes.$deferbindings = haschildren;
        parent = new dr[extend](instanceel, attributes, true, true);
        viewel = (ref1 = parent.sprite) != null ? ref1.el : void 0;
        if (instanceel) {
          if (!viewel) {
            instanceel.setAttribute('class', 'hidden');
          }
        }
        if (viewel) {
          if (instancebody) {
            viewhtml = viewel.innerHTML.trim();
            if (viewhtml) {
              viewel.innerHTML = instancebody + viewhtml;
            } else {
              viewel.innerHTML = instancebody;
            }
          }
          if (!skipchildren) {
            children = (function() {
              var k, len3, ref2, ref3, results;
              ref2 = dom.getChildElements(viewel);
              results = [];
              for (k = 0, len3 = ref2.length; k < len3; k++) {
                child = ref2[k];
                if (ref3 = child.localName, indexOf.call(specialtags, ref3) < 0) {
                  results.push(child);
                }
              }
              return results;
            })();
            if (!skipinitchildren) {
              for (k = 0, len3 = children.length; k < len3; k++) {
                child = children[k];
                dom.initElement(child, parent);
              }
            }
          }
        }
        if (!skipchildren) {
          sendInit = function() {
            if (parent.inited) {
              return;
            }
            parent._bindHandlers(true);
            return parent.initialize();
          };
          if (internal) {
            callOnIdle(sendInit);
          } else {
            sendInit();
          }
        }
        return parent;
      };
      if (name) {
        parts = name.split(tagPackageSeparator);
        len = parts.length;
        if (len > 1) {
          context = dr;
          for (idx = k = 0, len3 = parts.length; k < len3; idx = ++k) {
            part = parts[idx];
            if (idx === len - 1) {
              context[part] = klass;
            } else {
              newContext = context[part];
              if (!newContext) {
                context[part] = newContext = {};
              }
              context = newContext;
            }
          }
        }
      }
      klass.skipinitchildren = skipinitchildren;
      klass.classattributes = classattributes;
    }

    return Class;

  })();

  return Class;

}).call(this);
;
    Layout = 
/**
 * @class dr.layout {Layout}
 * @extends dr.node
 * The base class for all layouts.
#
 * When a new layout is added, it will automatically create and add itself to a layouts array in its parent. In addition, an onlayouts event is fired in the parent when the layouts array changes. This allows the parent to access the layout(s) later.
#
 * Here is a view that contains a spacedlayout.
#
 *     @example
 *     <spacedlayout axis="y"></spacedlayout>
#
 *     <view bgcolor="oldlace" width="auto" height="auto">
 *       <spacedlayout>
 *         <method name="startMonitoringSubview" args="view">
 *           output.setAttribute('text', output.text + "View Added: " + view.$tagname + ":" + view.bgcolor + "\n");
 *           this.super();
 *         </method>
 *       </spacedlayout>
 *       <view width="50" height="50" bgcolor="pink" opacity=".3"></view>
 *       <view width="50" height="50" bgcolor="plum" opacity=".3"></view>
 *       <view width="50" height="50" bgcolor="lightblue" opacity=".3"></view>
 *       <view width="50" height="50" bgcolor="blue" opacity=".3"></view>
 *     </view>
#
 *     <text id="output" multiline="true" width="300"></text>
#
 */

(function() {
  var Layout,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Layout = (function(superClass) {
    extend(Layout, superClass);

    function Layout() {
      return Layout.__super__.constructor.apply(this, arguments);
    }

    Layout.prototype.construct = function(el, attributes) {
      var attrLocked, base, j, len, subview, subviews;
      if (attributes.$types == null) {
        attributes.$types = {};
      }
      attributes.$types.locked = 'boolean';
      if (attributes.locked != null) {
        attrLocked = attributes.locked === 'true' ? true : false;
      }
      this.locked = true;
      this.subviews = [];
      Layout.__super__.construct.apply(this, arguments);
      this.listenTo(this.parent, 'subviewAdded', this.addSubview.bind(this));
      this.listenTo(this.parent, 'subviewRemoved', this.removeSubview.bind(this));
      this.listenTo(this.parent, 'init', this.update.bind(this));
      if ((base = this.parent).layouts == null) {
        base.layouts = [];
      }
      this.parent.layouts.push(this);
      this.parent.sendEvent('layouts', this.parent.layouts);
      subviews = this.parent.subviews;
      if (subviews && this.parent.inited) {
        for (j = 0, len = subviews.length; j < len; j++) {
          subview = subviews[j];
          this.addSubview(subview);
        }
      }
      if (attrLocked != null) {
        this.locked = attrLocked;
      } else {
        this.locked = false;
      }
      return this.update();
    };

    Layout.prototype.destroy = function(skipevents) {
      this.locked = true;
      Layout.__super__.destroy.apply(this, arguments);
      if (!skipevents) {
        return this._removeFromParent('layouts');
      }
    };


    /**
     * Adds the provided view to the subviews array of this layout, starts
     * monitoring the view for changes and updates the layout.
     * @param {dr.view} view The view to add to this layout.
     * @return {void}
     */

    Layout.prototype.addSubview = function(view) {
      var func, self;
      self = this;
      func = this.__ignoreFunc = function(ignorelayout) {
        if (self.__removeSubview(this) === -1) {
          return self.__addSubview(this);
        }
      };
      this.startMonitoringSubviewForIgnore(view, func);
      return this.__addSubview(view);
    };

    Layout.prototype.__addSubview = function(view) {
      if (this.ignore(view)) {
        return;
      }
      this.subviews.push(view);
      this.startMonitoringSubview(view);
      if (!this.locked) {
        return this.update();
      }
    };


    /**
     * Removes the provided View from the subviews array of this Layout,
     * stops monitoring the view for changes and updates the layout.
     * @param {dr.view} view The view to remove from this layout.
     * @return {number} the index of the removed subview or -1 if not removed.
     */

    Layout.prototype.removeSubview = function(view) {
      this.stopMonitoringSubviewForIgnore(view, this.__ignoreFunc);
      if (this.ignore(view)) {
        return -1;
      } else {
        return this.__removeSubview(view);
      }
    };

    Layout.prototype.__removeSubview = function(view) {
      var idx;
      idx = this.subviews.indexOf(view);
      if (idx !== -1) {
        this.stopMonitoringSubview(view);
        this.subviews.splice(idx, 1);
        if (!this.locked) {
          this.update();
        }
      }
      return idx;
    };


    /**
     * Use this method to add listeners for any properties that need to be
     * monitored on a subview that determine if it will be ignored by the layout.
     * Each listenTo should look like: this.listenTo(view, propname, func)
     * The default implementation monitors ignorelayout.
     * @param {dr.view} view The view to monitor.
     * @param {Function} func The function to bind
     * @return {void}
     */

    Layout.prototype.startMonitoringSubviewForIgnore = function(view, func) {
      return this.listenTo(view, 'ignorelayout', func);
    };


    /**
     * Use this method to remove listeners for any properties that need to be
     * monitored on a subview that determine if it will be ignored by the layout.
     * Each stopListening should look like: this.stopListening(view, propname, func)
     * The default implementation monitors ignorelayout.
     * @param {dr.view} view The view to monitor.
     * @param {Function} func The function to unbind
     * @return {void}
     */

    Layout.prototype.stopMonitoringSubviewForIgnore = function(view, func) {
      return this.stopListening(view, 'ignorelayout', func);
    };


    /**
     * Checks if a subview can be added to this Layout or not. The default
     * implementation checks the 'ignorelayout' attributes of the subview.
     * @param {dr.view} view The view to check.
     * @return {boolean} True means the subview will be skipped, false otherwise.
     */

    Layout.prototype.ignore = function(view) {
      var ignore, name, v;
      ignore = view.ignorelayout;
      if (typeof ignore === 'object') {
        name = this.name;
        if (name) {
          v = ignore[name];
          if (v != null) {
            return v;
          } else {
            return ignore['*'];
          }
        } else {
          return ignore['*'];
        }
      } else {
        return ignore;
      }
    };


    /**
     * Subclasses should implement this method to start listening to
     * events from the subview that should update the layout. The default
     * implementation does nothing.
     * @param {dr.view} view The view to start monitoring for changes.
     * @return {void}
     */

    Layout.prototype.startMonitoringSubview = function(view) {};


    /**
     * Calls startMonitoringSubview for all views. Used by layout
     * implementations when a change occurs to the layout that requires
     * refreshing all the subview monitoring.
     * @return {void}
     */

    Layout.prototype.startMonitoringAllSubviews = function() {
      var i, results, svs;
      svs = this.subviews;
      i = svs.length;
      results = [];
      while (i) {
        results.push(this.startMonitoringSubview(svs[--i]));
      }
      return results;
    };


    /**
     * Subclasses should implement this method to stop listening to
     * events from the subview that should update the layout. This
     * should remove all listeners that were setup in startMonitoringSubview.
     * The default implementation does nothing.
     * @param {dr.view} view The view to stop monitoring for changes.
     * @return {void}
     */

    Layout.prototype.stopMonitoringSubview = function(view) {};


    /**
     * Calls stopMonitoringSubview for all views. Used by Layout
     * implementations when a change occurs to the layout that requires
     * refreshing all the subview monitoring.
     * @return {void}
     */

    Layout.prototype.stopMonitoringAllSubviews = function() {
      var i, results, svs;
      svs = this.subviews;
      i = svs.length;
      results = [];
      while (i) {
        results.push(this.stopMonitoringSubview(svs[--i]));
      }
      return results;
    };


    /**
     * Checks if the layout can be updated right now or not. Should be called
     * by the "update" method of the layout to check if it is OK to do the
     * update. The default implementation checks if the layout is locked and
     * the parent is inited.
     * @return {boolean} true if not locked, false otherwise.
     */

    Layout.prototype.canUpdate = function() {
      return !this.locked && this.parent.inited;
    };


    /**
     * Updates the layout. Subclasses should call canUpdate to check if it is
     * OK to update or not. The defualt implementation does nothing.
     * @return {void}
     */

    Layout.prototype.update = function() {};

    Layout.prototype.set_locked = function(v) {
      if (this.locked !== v && v === false) {
        this.locked = false;
        this.update();
      }
      return v;
    };

    return Layout;

  })(Node);

  return Layout;

}).call(this);
;
    AutoPropertyLayout = (function() {
  var AutoPropertyLayout,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  AutoPropertyLayout = (function(superClass) {
    extend(AutoPropertyLayout, superClass);

    function AutoPropertyLayout() {
      return AutoPropertyLayout.__super__.constructor.apply(this, arguments);
    }

    AutoPropertyLayout.prototype.startMonitoringSubview = function(view) {
      var func;
      func = this.update.bind(this);
      if (this.axis === 'x') {
        this.listenTo(view, 'x', func);
        this.listenTo(view, 'width', func);
        this.listenTo(view, 'boundsx', func);
        this.listenTo(view, 'boundswidth', func);
      } else {
        this.listenTo(view, 'y', func);
        this.listenTo(view, 'height', func);
        this.listenTo(view, 'boundsy', func);
        this.listenTo(view, 'boundsheight', func);
      }
      return this.listenTo(view, 'visible', func);
    };

    AutoPropertyLayout.prototype.stopMonitoringSubview = function(view) {
      var func;
      func = this.update.bind(this);
      if (this.axis === 'x') {
        this.stopListening(view, 'x', func);
        this.stopListening(view, 'width', func);
        this.stopListening(view, 'boundsx', func);
        this.stopListening(view, 'boundswidth', func);
      } else {
        this.stopListening(view, 'y', func);
        this.stopListening(view, 'height', func);
        this.stopListening(view, 'boundsy', func);
        this.stopListening(view, 'boundsheight', func);
      }
      return this.stopListening(view, 'visible', func);
    };

    AutoPropertyLayout.prototype.update = function() {
      var i, max, maxFunc, parent, sv, svs, val;
      if (!this.locked && this.axis) {
        this.locked = true;
        svs = this.subviews;
        i = svs.length;
        maxFunc = Math.max;
        parent = this.parent;
        max = 0;
        if (this.axis === 'x') {
          while (i) {
            sv = svs[--i];
            if (!this._skipX(sv)) {
              max = maxFunc(max, sv.boundsx + maxFunc(0, sv.boundswidth));
            }
          }
          val = max + parent.__fullBorderPaddingWidth;
          if (parent.width !== val) {
            parent.__noSpecialValueHandling = true;
            parent.setAttribute('width', val);
          }
        } else {
          while (i) {
            sv = svs[--i];
            if (!this._skipY(sv)) {
              max = maxFunc(max, sv.boundsy + maxFunc(0, sv.boundsheight));
            }
          }
          val = max + parent.__fullBorderPaddingHeight;
          if (parent.height !== val) {
            parent.__noSpecialValueHandling = true;
            parent.setAttribute('height', val);
          }
        }
        return this.locked = false;
      }
    };

    AutoPropertyLayout.prototype._skipX = function(view) {
      return !view.visible || (view.__percentFuncwidth != null) || (view.__percentFuncx != null) || ((view.__alignFuncx != null) && !view.__alignFuncx.autoOk);
    };

    AutoPropertyLayout.prototype._skipY = function(view) {
      return !view.visible || (view.__percentFuncheight != null) || (view.__percentFuncy != null) || ((view.__alignFuncy != null) && !view.__alignFuncy.autoOk);
    };

    return AutoPropertyLayout;

  })(Layout);

  return AutoPropertyLayout;

}).call(this);
;
    Path = (function() {
  var Path;

  Path = (function() {
    function Path(vectors) {
      if (vectors == null) {
        vectors = [];
      }
      this._boundingBox = null;
      this.vectors = vectors;
    }


    /**
     * Convert radians to degrees.
     * @param {Number} deg The degrees to convert.
     * @return {Number} The radians
     */

    Path.prototype.degreesToRadians = function(deg) {
      return deg * Math.PI / 180;
    };


    /**
     * Convert degrees to radians.
     * @param {Number} rad The radians to convert.
     * @return {Number} The radians
     */

    Path.prototype.radiansToDegrees = function(rad) {
      return rad * 180 / Math.PI;
    };


    /**
     * Shift this path by the provided x and y amount.
     * @param {Number} dx The x amount to shift.
     * @param {Number} dy The y amount to shift.
     */

    Path.prototype.translate = function(dx, dy) {
      var i, vecs;
      vecs = this.vectors;
      i = vecs.length;
      while (i) {
        vecs[--i] += dy;
        vecs[--i] += dx;
      }
      this._boundingBox = null;
      return this;
    };


    /**
     * Rotates this path around 0,0 by the provided angle in radians.
     * @param {Number} a The angle in degrees to rotate
     */

    Path.prototype.rotate = function(a) {
      var cosA, i, len, sinA, vecs, xNew, yNew;
      a = this.degreesToRadians(a);
      cosA = Math.cos(a);
      sinA = Math.sin(a);
      vecs = this.vectors;
      len = vecs.length;
      i = 0;
      while (len > i) {
        xNew = vecs[i] * cosA - vecs[i + 1] * sinA;
        yNew = vecs[i] * sinA + vecs[i + 1] * cosA;
        vecs[i++] = xNew;
        vecs[i++] = yNew;
      }
      this._boundingBox = null;
      return this;
    };


    /**
     * Scales this path around the origin by the provided scale amount
     * @param {Number} sx The amount to scale along the x-axis.
     * @param {Number} sy The amount to scale along the y-axis.
     */

    Path.prototype.scale = function(sx, sy) {
      var i, vecs;
      vecs = this.vectors;
      i = vecs.length;
      while (i) {
        vecs[--i] *= sy;
        vecs[--i] *= sx;
      }
      this._boundingBox = null;
      return this;
    };


    /**
     * Rotates and scales this path around the provided origin by the angle in
     * degrees, scalex and scaley.
     * @param {Number} scalex The amount to scale along the x axis.
     * @param {Number} scaley The amount to scale along the y axis.
     * @param {Number} angle The amount to scale.
     * @param {Number} xOrigin The amount to scale.
     * @param {Number} yOrign The amount to scale.
     */

    Path.prototype.transformAroundOrigin = function(scalex, scaley, angle, xOrigin, yOrigin) {
      return this.translate(-xOrigin, -yOrigin).rotate(angle).scale(scalex, scaley).translate(xOrigin, yOrigin);
    };


    /**
     * Gets the bounding box for this path.
     * @return {Object} with properties x, y, width and height or null
     * if no bounding box could be calculated.
     */

    Path.prototype.getBoundingBox = function() {
      var i, maxX, maxY, minX, minY, vecs, x, y;
      if (this._boundingBox) {
        return this._boundingBox;
      }
      vecs = this.vectors;
      i = vecs.length;
      if (i >= 2) {
        minY = maxY = vecs[--i];
        minX = maxX = vecs[--i];
        while (i) {
          y = vecs[--i];
          x = vecs[--i];
          minY = Math.min(y, minY);
          maxY = Math.max(y, maxY);
          minX = Math.min(x, minX);
          maxX = Math.max(x, maxX);
        }
        return this._boundingBox = {
          x: minX,
          y: minY,
          width: maxX - minX,
          height: maxY - minY
        };
      } else {
        return this._boundingBox = null;
      }
    };

    return Path;

  })();

  return Path;

}).call(this);
;
    StartEventable = (function() {
  var StartEventable,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  StartEventable = (function(superClass) {
    extend(StartEventable, superClass);

    function StartEventable() {
      return StartEventable.__super__.constructor.apply(this, arguments);
    }

    StartEventable.prototype.register = function(ev, callback) {
      StartEventable.__super__.register.apply(this, arguments);
      if (this.startEventTest()) {
        return this.startEvent();
      }
    };

    StartEventable.prototype.unregister = function(ev, callback) {
      StartEventable.__super__.unregister.apply(this, arguments);
      if (!this.startEventTest()) {
        return this.stopEvent();
      }
    };

    StartEventable.prototype.startEvent = function(event) {
      if (this.eventStarted) {
        return;
      }
      return this.eventStarted = true;
    };

    StartEventable.prototype.stopEvent = function(event) {
      if (!this.eventStarted) {
        return;
      }
      return this.eventStarted = false;
    };

    return StartEventable;

  })(Eventable);

  return StartEventable;

}).call(this);
;
    starttime = Date.now();
    idle = (function() {
      var doTick, requestAnimationFrame, tickEvents, ticking;
      requestAnimationFrame = capabilities.raf;
      if (!requestAnimationFrame) {
        requestAnimationFrame = (function() {
          return function(callback, element) {
            var callbackwrapper;
            callbackwrapper = function() {
              return callback(Date.now() - starttime);
            };
            return window.setTimeout(callbackwrapper, 1000 / 60);
          };
        })();
      }
      ticking = false;
      tickEvents = [];
      doTick = function(time) {
        var key;
        for (key in tickEvents) {
          if (tickEvents[key]) {
            tickEvents[key](time);
            tickEvents[key] = null;
          }
        }
        return ticking = false;
      };
      return function(key, callback) {
        if (!ticking) {
          requestAnimationFrame(doTick);
          ticking = true;
        }
        return tickEvents[key] = callback;
      };
    })();
    callOnIdle = (function() {
      var callback, queue;
      queue = [];
      callback = function(time) {
        var cb, j, len, localqueue;
        localqueue = queue;
        queue = [];
        for (j = 0, len = localqueue.length; j < len; j++) {
          cb = localqueue[j];
          cb(time);
        }
        if (queue.length) {
          setTimeout(function() {
            return idle(2, callback);
          }, 0);
        }
      };
      if (capabilities.raf) {
        return function(cb) {
          queue.push(cb);
          idle(2, callback);
        };
      } else {
        return function(cb) {
          setTimeout(function() {
            return cb(Date.now() - starttime);
          }, 0);
        };
      }
    })();
    Idle = 
/**
 * @class dr.idle {Util}
 * @extends Eventable
 * Sends onidle events when the application is active and idle.
#
 *     @example
 *     <handler event="onidle" reference="dr.idle" args="idleStatus">
 *       milis.setAttribute('text', idleStatus);
 *     </handler>
#
 *     <spacedlayout axis="y" spacing="5"></spacedlayout>
 *     <text text="Milliseconds since app started: "></text>
 *     <text id="milis"></text>
 */

(function() {
  var Idle,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Idle = (function(superClass) {
    extend(Idle, superClass);

    function Idle() {
      this.sender = bind(this.sender, this);
      this.startEvent = bind(this.startEvent, this);
      return Idle.__super__.constructor.apply(this, arguments);
    }

    Idle.prototype.startEventTest = function() {
      var ref, start;
      start = (ref = this.events['idle']) != null ? ref.length : void 0;
      if (start) {
        return start;
      }
    };

    Idle.prototype.startEvent = function(event) {
      Idle.__super__.startEvent.apply(this, arguments);
      idle(1, this.sender);
    };

    Idle.prototype.sender = function(time) {

      /**
       * @event onidle
       * Fired when the application is active and idle.
       * @param {Number} time The number of milliseconds since the application started
       */
      this.sendEvent('idle', time);
      return setTimeout((function(_this) {
        return function() {
          return idle(1, _this.sender);
        };
      })(this), 0);

      /**
       * @method callOnIdle
       * Calls a function on the next idle event.
       * @param {Function} callback A function to be called on the next idle event
       */
    };

    Idle.prototype.callOnIdle = function(callback) {
      return callOnIdle(callback);
    };

    return Idle;

  })(StartEventable);

  return Idle;

}).call(this);
;
    mouseEvents = ['click', 'mouseover', 'mouseout', 'mousedown', 'mouseup'];
    Mouse = 
/**
 * @class dr.mouse {Input}
 * @extends Eventable
 * Sends mouse events. Often used to listen to onmouseover/x/y events to follow the mouse position.
#
 * Here we attach events handlers to the onx and ony events of dr.mouse, and set the x,y coordinates of a square view so it follows the mouse.
#
 *     @example
 *     <view id="mousetracker" width="20" height="20" bgcolor="MediumTurquoise"></view>
#
 *     <handler event="onx" args="x" reference="dr.mouse">
 *       mousetracker.setAttribute('x', x - mousetracker.width);
 *     </handler>
#
 *     <handler event="ony" args="y" reference="dr.mouse">
 *       mousetracker.setAttribute('y', y - mousetracker.height);
 *     </handler>
#
#
 */

(function() {
  var Mouse,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Mouse = (function(superClass) {
    var lastTouchDown, lastTouchOver, skipEvent;

    extend(Mouse, superClass);


    /**
     * @event onclick
     * Fired when the mouse is clicked
     * @param {dr.view} view The dr.view that fired the event
     */


    /**
     * @event onmouseover
     * Fired when the mouse moves over a view
     * @param {dr.view} view The dr.view that fired the event
     */


    /**
     * @event onmouseout
     * Fired when the mouse moves off a view
     * @param {dr.view} view The dr.view that fired the event
     */


    /**
     * @event onmousedown
     * Fired when the mouse goes down on a view
     * @param {dr.view} view The dr.view that fired the event
     */


    /**
     * @event onmouseup
     * Fired when the mouse goes up on a view
     * @param {dr.view} view The dr.view that fired the event
     */

    function Mouse() {
      this.sender = bind(this.sender, this);
      this.handle = bind(this.handle, this);
      this.touchHandler = bind(this.touchHandler, this);
      this.x = 0;
      this.y = 0;
      this.docSelector = $(document);
      this.docSelector.on(mouseEvents.join(' '), this.handle);
      this.docSelector.on("mousemove", this.handle).one("mouseout", this.stopEvent);
      if (capabilities.touch) {
        document.addEventListener('touchstart', this.touchHandler, true);
        document.addEventListener('touchmove', this.touchHandler, true);
        document.addEventListener('touchend', this.touchHandler, true);
        document.addEventListener('touchcancel', this.touchHandler, true);
      }
    }

    skipEvent = function(e) {
      if (e.stopPropagation) {
        e.stopPropagation();
      }
      if (e.preventDefault) {
        e.preventDefault();
      }
      e.cancelBubble = true;
      e.returnValue = false;
      return false;
    };

    Mouse.prototype.startEventTest = function() {
      var ref, ref1, ref2;
      return ((ref = this.events['mousemove']) != null ? ref.length : void 0) || ((ref1 = this.events['x']) != null ? ref1.length : void 0) || ((ref2 = this.events['y']) != null ? ref2.length : void 0);
    };

    Mouse.prototype.sendMouseEvent = function(type, first) {
      var simulatedEvent;
      simulatedEvent = document.createEvent('MouseEvent');
      simulatedEvent.initMouseEvent(type, true, true, window, 1, first.pageX, first.pageY, first.clientX, first.clientY, false, false, false, false, 0, null);
      first.target.dispatchEvent(simulatedEvent);
      if (first.target.$view) {
        if (first.target.$view.$tagname !== 'inputtext') {
          return skipEvent(event);
        }
      }
    };

    lastTouchDown = null;

    lastTouchOver = null;

    Mouse.prototype.touchHandler = function(event) {
      var first, over, touches;
      touches = event.changedTouches;
      first = touches[0];
      switch (event.type) {
        case 'touchstart':
          this.sendMouseEvent('mouseover', first);
          this.sendMouseEvent('mousedown', first);
          return lastTouchDown = first.target;
        case 'touchmove':
          over = document.elementFromPoint(first.pageX - window.pageXOffset, first.pageY - window.pageYOffset);
          if (over && over.$view) {
            if (lastTouchOver && lastTouchOver !== over) {
              this.handle({
                target: lastTouchOver,
                type: 'mouseout'
              });
            }
            lastTouchOver = over;
            this.handle({
              target: over,
              type: 'mouseover'
            });
          }
          return this.sendMouseEvent('mousemove', first);
        case 'touchend':
          this.sendMouseEvent('mouseup', first);
          if (lastTouchDown === first.target) {
            this.sendMouseEvent('click', first);
            return lastTouchDown = null;
          }
      }
    };

    Mouse.prototype.handle = function(event) {
      var type, view;
      view = event.target.$view;
      type = event.type;
      if (view) {
        if (type === 'mousedown') {
          this._lastMouseDown = view;
          if (view.$tagname !== 'inputtext') {
            skipEvent(event);
          }
        }
      }
      if (type === 'mouseup' && this._lastMouseDown && this._lastMouseDown !== view) {
        this.sendEvent('mouseup', this._lastMouseDown);
        this._lastMouseDown.sendEvent('mouseup', this._lastMouseDown);
        this.sendEvent('mouseupoutside', this._lastMouseDown);
        this._lastMouseDown.sendEvent('mouseupoutside', this._lastMouseDown);
        this._lastMouseDown = null;
        return;
      } else if (view) {
        view.sendEvent(type, view);
      }
      this.x = event.pageX;
      this.y = event.pageY;
      if (this.eventStarted && type === 'mousemove') {
        idle(0, this.sender);
      } else {
        this.sendEvent(type, view);
      }
    };

    Mouse.prototype.sender = function() {

      /**
       * @event onmousemove
       * Fired when the mouse moves
       * @param {Object} coordinates The x and y coordinates of the mouse
       */
      this.sendEvent("mousemove", {
        x: this.x,
        y: this.y
      });

      /**
       * @attribute {Number} x The x position of the mouse
       * @readonly
       */
      this.sendEvent('x', this.x);

      /**
       * @attribute {Number} y The y position of the mouse
       * @readonly
       */
      return this.sendEvent('y', this.y);
    };

    Mouse.prototype.handleDocEvent = function(event) {
      if (event && event.target !== document) {
        return;
      }
      if (this.eventStarted) {
        return this.docSelector.on("mousemove", this.handle).one("mouseout", this.stopEvent);
      } else {
        return this.docSelector.on("mousemove", this.handle).one("mouseout", this.startEvent);
      }
    };

    return Mouse;

  })(StartEventable);

  return Mouse;

}).call(this);
;
    Window = 
/**
 * @class dr.window {Util}
 * @extends Eventable
 * Sends window resize events. Often used to dynamically reposition views as the window size changes.
#
 *     <handler event="onwidth" reference="dr.window" args="newWidth">
 *       //adjust views
 *     </handler>
#
 *     <handler event="onheight" reference="dr.window" args="newHeight">
 *       //adjust views
 *     </handler>
#
#
 */

(function() {
  var Window,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Window = (function(superClass) {
    extend(Window, superClass);

    function Window() {
      this.handle = bind(this.handle, this);
      var handleVisibilityChange, hidden, visibilityChange;
      window.addEventListener('resize', this.handle, false);
      this.visible = true;
      if (document.hidden != null) {
        hidden = "hidden";
        visibilityChange = "visibilitychange";
      } else if (document.mozHidden != null) {
        hidden = "mozHidden";
        visibilityChange = "mozvisibilitychange";
      } else if (document.msHidden != null) {
        hidden = "msHidden";
        visibilityChange = "msvisibilitychange";
      } else if (document.webkitHidden != null) {
        hidden = "webkitHidden";
        visibilityChange = "webkitvisibilitychange";
      }
      handleVisibilityChange = (function(_this) {
        return function() {
          _this.visible = document[hidden];

          /**
           * @attribute {Boolean} visible=true Set when the window visibility changes, true if the window is currently visible
           * @readonly
           */
          return _this.sendEvent('visible', _this.visible);
        };
      })(this);
      document.addEventListener(visibilityChange, handleVisibilityChange, false);
      this.handle();
    }

    Window.prototype.startEventTest = function() {
      var ref, ref1;
      return ((ref = this.events['width']) != null ? ref.length : void 0) || ((ref1 = this.events['height']) != null ? ref1.length : void 0);
    };

    Window.prototype.handle = function(event) {

      /**
       * @attribute {Number} width Set when the window width changes
       * @readonly
       */
      this.width = window.innerWidth;
      this.sendEvent('width', this.width);

      /**
       * @attribute {Number} height Set when the window height changes
       * @readonly
       */
      this.height = window.innerHeight;
      this.sendEvent('height', this.height);
    };

    return Window;

  })(StartEventable);

  return Window;

}).call(this);
;
    Keyboard = 
/**
 * @class dr.keyboard {Input}
 * @extends Eventable
 * Sends keyboard events.
#
 * You might want to listen for keyboard events globally. In this example, we display the code of the key being pressed. Note that you'll need to click on the example to activate it before you will see keyboard events.
#
 *     @example
 *     <text id="keycode" text="Key Code:"></text>
#
 *     <handler event="onkeyup" args="keys" reference="dr.keyboard">
 *       keycode.setAttribute('text', 'Key Code: ' + keys.keyCode);
 *     </handler>
 */

(function() {
  var Keyboard,
    bind = function(fn, me){ return function(){ return fn.apply(me, arguments); }; },
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  Keyboard = (function(superClass) {
    extend(Keyboard, superClass);

    function Keyboard() {
      this.handle = bind(this.handle, this);
      this.keys = {
        shiftKey: false,
        altKey: false,
        ctrlKey: false,
        metaKey: false,
        keyCode: 0
      };
      $(document).on('select change keyup keydown', this.handle);
    }

    Keyboard.prototype.handle = function(event) {
      var key, target, type;
      target = event.target.$view;
      type = event.type;
      for (key in this.keys) {
        this.keys[key] = event[key];
      }
      this.keys.type = type;
      if (target) {
        target.sendEvent(type, this.keys);
      }
      if (type === 'select' || type === 'change') {
        return;
      }

      /**
       * @event onkeydown
       * Fired when a key goes down
       * @param {Object} keys An object representing the keyboard state, including shiftKey, allocation, ctrlKey, metaKey, keyCode and type
       */

      /**
       * @event onkeyup
       * Fired when a key goes up
       * @param {Object} keys An object representing the keyboard state, including shiftKey, allocation, ctrlKey, metaKey, keyCode and type
       */
      this.sendEvent(type, this.keys);

      /**
       * @attribute {Object} keys
       * An object representing the most recent keyboard state, including shiftKey, allocation, ctrlKey, metaKey, keyCode and type
       */
      return this.sendEvent('keys', this.keys);
    };

    return Keyboard;

  })(Eventable);

  return Keyboard;

}).call(this);
;
    window.onerror = function(e) {
      return showWarnings([(e.toString()) + ". Try running in debug mode for more info. " + window.location.href + (querystring ? '&' : '?') + "debug"]);
    };

    /**
     * @class dr {Core Dreem}
     * Holds builtin and user-created classes and public APIs.
    #
     * All classes listed here can be invoked with the declarative syntax, e.g. &lt;node>&lt;/node> or &lt;view>&lt;/view>
     */
    return exports = {
      view: View,
      "class": Class,
      node: Node,
      mouse: new Mouse(),
      keyboard: new Keyboard(),
      window: new Window(),
      layout: Layout,
      idle: new Idle(),
      state: State,
      _noop: noop,
      _sprite: Sprite,
      _textSprite: TextSprite,
      _inputTextSprite: InputTextSprite,
      _artSprite: ArtSprite,
      _bitmapSprite: BitmapSprite,

      /**
       * @method initElements
       * Initializes all top-level views found in the document. Called automatically when the page loads, but can be called manually as needed.
       */
      initElements: dom.initAllElements,

      /**
       * @method writeCSS
       * Writes generic dreem-specific CSS to the document. Should only be called once.
       */
      writeCSS: dom.writeCSS,
      initConstraints: _initConstraints
    };

    /**
     * @class dr.method {Core Dreem}
     * Declares a member function in a node, view, class or other class instance. Methods can only be created with the &lt;method>&lt;/method> tag syntax.
    #
     * If a method overrides an existing method, any existing (super) method(s) will be called first automatically.
    #
     * Let's define a method called changeColor in a view that sets the background color to pink.
    #
     *     @example
    #
     *     <view id="square" width="100" height="100">
     *       <method name="changeColor">
     *         this.setAttribute('bgcolor', 'pink');
     *       </method>
     *     </view>
    #
     *     <handler event="oninit">
     *       square.changeColor();
     *     </handler>
    #
     * Here we define the changeColor method in a class called square. We create an instance of the class and call the method on the intance.
    #
     *     @example
     *     <class name="square" width="100" height="100">
     *       <method name="changeColor">
     *         this.setAttribute('bgcolor', 'pink');
     *       </method>
     *     </class>
    #
     *     <square id="square1"></square>
    #
     *     <handler event="oninit">
     *       square1.changeColor();
     *     </handler>
    #
     * Now we'll subclass the square class with a bluesquare class, and override the changeColor method to color the square blue. We also add an inner square who's color is set in the changeColor method of the square superclass. Notice that the color of this square is set when the method is called on the subclass.
    #
     *     @example
     *     <class name="square" width="100" height="100">
     *       <view name="inner" width="25" height="25"></view>
     *       <method name="changeColor">
     *         this.inner.setAttribute('bgcolor', 'green');
     *         this.setAttribute('bgcolor', 'pink');
     *       </method>
     *     </class>
    #
     *     <class name="bluesquare" extends="square">
     *       <method name="changeColor">
     *         this.setAttribute('bgcolor', 'blue');
     *       </method>
     *     </class>
    #
     *     <spacedlayout></spacedlayout>
    #
     *     <square id="square1"></square>
     *     <bluesquare id="square2"></bluesquare>
    #
     *     <handler event="oninit">
     *       square1.changeColor();
     *       square2.changeColor();
     *     </handler>
    #
     */

    /**
     * @attribute {String} name (required)
     * The name of the method.
     */

    /**
     * @attribute {String[]} args
     * A comma separated list of method arguments.
     */

    /**
     * @attribute {"js"/"coffee"} type
     * The compiler to use for this method. Inherits from the immediate class if unspecified.
     */

    /**
     * @class dr.setter
     * Declares a setter in a node, view, class or other class instance. Setters can only be created with the &lt;setter>&lt;/setter> tag syntax.
    #
     * Setters allow the default behavior of attribute changes to be changed.
    #
     * Like dr.method, if a setter overrides an existing setter any existing (super) setter(s) will be called first automatically.
     * @ignore
     */

    /**
     * @attribute {String} name (required)
     * The name of the method.
     */

    /**
     * @attribute {String[]} args
     * A comma separated list of method arguments.
     */

    /**
     * @attribute {"js"/"coffee"} type
     * The compiler to use for this method. Inherits from the immediate class if unspecified.
     */

    /**
     * @class dr.handler {Core Dreem, Events}
     * Declares a handler in a node, view, class or other class instance. Handlers can only be created with the `<handler></handler>` tag syntax.
    #
     * Handlers are called when an event fires with new value, if available.
    #
     * Here is a simple handler that listens for an onx event in the local scope. The handler runs when x changes:
    #
     *     <handler event="onx">
     *       // do something now that x has changed
     *     </handler>
    #
     * When a handler uses the args attribute, it can recieve the value that changed:
    #
     * Sometimes it's nice to use a single method to respond to multiple events:
    #
     *     <handler event="onx" method="handlePosition"></handler>
     *     <handler event="ony" method="handlePosition"></handler>
     *     <method name="handlePosition">
     *       // do something now that x or y have changed
     *     </method>
    #
    #
     * When a handler uses the args attribute, it can receive the value that changed:
    #
     *     @example
    #
     *     <handler event="onwidth" args="widthValue">
     *        exampleLabel.setAttribute("text", "Parent view received width value of " + widthValue)
     *     </handler>
    #
     *     <text id="exampleLabel" x="50" y="5" text="no value yet" color="coral" outline="1px dotted coral" padding="10"></text>
     *     <text x="50" y="${exampleLabel.y + exampleLabel.height + 20}" text="no value yet" color="white" bgcolor="#DDAA00" padding="10">
     *       <handler event="onwidth" args="wValue">
     *          this.setAttribute("text", "This label received width value of " + wValue)
     *       </handler>
     *     </text>
    #
    #
     * It's also possible to listen for events on another scope. This handler listens for onidle events on dr.idle instead of the local scope:
    #
     *     @example
    #
     *     <handler event="onidle" args="time" reference="dr.idle">
     *       exampleLabel.setAttribute('text', 'received time from dr.idle.onidle: ' + Math.round(time));
     *     </handler>
     *     <text id="exampleLabel" x="50" y="5" text="no value yet" color="coral" outline="1px dotted coral" padding="10px"></text>
    #
    #
     */

    /**
     * @attribute {String} event (required)
     * The name of the event to listen for, e.g. 'onwidth'.
     */

    /**
     * @attribute {String} reference
     * If set, the handler will listen for an event in another scope.
     */

    /**
     * @attribute {String} method
     * If set, the handler call a local method. Useful when multiple handlers need to do the same thing.
     */

    /**
     * @attribute {String[]} args
     * A comma separated list of method arguments.
     */

    /**
     * @attribute {"js"/"coffee"} type
     * The compiler to use for this method. Inherits from the immediate class if unspecified.
     */

    /**
     * @class dr.attribute {Core Dreem, Events}
     * @aside guide constraints
    #
     * Adds a variable to a node, view, class or other class instance. Attributes can only be created with the &lt;attribute>&lt;/attribute> tag syntax.
    #
     * Attributes allow classes to declare new variables with a specific type and default value.
    #
     * Attributes automatically send events when their value changes.
    #
     * Here we create a new class with a custom attribute representing a person's mood, along with two instances. One instance has the default mood of 'happy', the other sets the mood attribute to 'sad'. Note there's nothing visible in this example yet:
    #
     *     <class name="person">
     *       <attribute name="mood" type="string" value="happy"></attribute>
     *     </class>
    #
     *     <person></person>
     *     <person mood="sad"></person>
    #
     * Let's had a handler to make our color change with the mood. Whenever the mood attribute changes, the color changes with it:
    #
     *     @example
     *     <class name="person" width="100" height="100">
     *       <attribute name="mood" type="string" value="happy"></attribute>
     *       <handler event="onmood" args="mood">
     *         var color = 'orange';
     *         if (mood !== 'happy') {
     *           color = 'blue'
     *         }
     *         this.setAttribute('bgcolor', color);
     *       </handler>
     *     </class>
    #
     *     <spacedlayout></spacedlayout>
     *     <person></person>
     *     <person mood="sad"></person>
    #
     * You can add as many attributes as you like to a class. Here, we add a numeric attribute for size, which changes the height and width attributes via a constraint:
    #
     *     @example
     *     <class name="person" width="${this.size}" height="${this.size}">
     *       <attribute name="mood" type="string" value="happy"></attribute>
     *       <handler event="onmood" args="mood">
     *         var color = 'orange';
     *         if (mood !== 'happy') {
     *           color = 'blue'
     *         }
     *         this.setAttribute('bgcolor', color);
     *       </handler>
     *       <attribute name="size" type="number" value="20"></attribute>
     *     </class>
    #
     *     <spacedlayout></spacedlayout>
     *     <person></person>
     *     <person mood="sad" size="50"></person>
     */

    /**
     * @attribute {String} name (required)
     * The name of the attribute
     */

    /**
     * @attribute {"string"/"number"/"boolean"/"json"/"expression"} [type=string] (required)
     * The type of the attribute. Used to convert from a string to an appropriate representation of the type.
     */

    /**
     * @attribute {String} value (required)
     * The initial value for the attribute
     */
  })();

  dr.writeCSS();

  $(window).on('load', function() {
    dr.initElements();
    return hackstyle(true);
  });

}).call(this);
