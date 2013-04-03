var rheses = (function() {
  // if true, jQuery acts normally and constraints are disabled
  var disabled = false;

  // hack jquery to send a style event when CSS changes, see http://stackoverflow.com/questions/2157963/is-it-possible-to-listen-to-a-style-change-event
  var origcss = $.fn.css;
  $.fn.css = function() {
    origcss.apply(this, arguments);
    if (!disabled) {
      var styles = {};
      if (typeof arguments[0] != 'object') {
        styles[arguments[0]] = true;
      } else {
        styles = arguments[0];
      }
      var scope = $(this);
      scope.each(function(i, e) {
        if (e && e.$sendstyle) {
          for (var style in styles) {
            //console.log('each', style, styles, e);
            if (e.$sendstyle[style]) {
              //console.log('style change event', style, e);
              $(e).trigger('style-' + style);
            }
          }
        }
      });
    }
    return this;
  };

  // hack animate to send style change events when needed
  var origanimate = $.fn.animate;
  $.fn.animate = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    if (!disabled) {
      $(this).each(function(i, e) {
        if (e && e.$sendstyle) {
          //console.log('animate', e.$sendstyle, args);
          if (typeof args[1] != 'object') {
            // process as duration
            args[1] = {
              duration: args[1],
              easing: args[2],
              complete: args[3]
            };
            args.length = 2;
            //console.log('processed arguments', args);
          }

          // collect list of styles to send
          var sendstyle = [];
          for (var style in args[0]) {
            if (e.$sendstyle[style]) {
              sendstyle.push(style);
            }
          }
          if (sendstyle.length) {
            // change step method to send style events
            var oldstep = args[1].step;
            args[1].step = function() {
              if (oldstep) oldstep.call(this, arguments);
              for (var i = 0, l = sendstyle.length; i < l; i++) {
                var style = sendstyle[i];
                //console.log('sending style update', style, arguments[1]);
                $(e).trigger('style-' + style);
              }
            };
          }
        }
      });
    }
    return origanimate.apply(this, args);
  };

  // borrowed from underscore
  var throttle = function(n, t) {
    var r, e, u, i, a = 0,
      o = function() {
        a = new Date, u = null, i = n.apply(r, e)
      };
    return function() {
      var c = new Date,
        l = t - (c - a);
      return r = this, e = arguments, 0 >= l ? (clearTimeout(u), u = null, a = c, i = n.apply(r, e)) : u || (u = setTimeout(o, l)), i
    }
  };

  // singleton that listens for mouse position and holds the last x and y coordinate
  Mouse = {
    x: 0,
    y: 0,
    handler: function(event) {
      //if (disabled) return;
      var x = event.pageX;
      var y = event.pageY;
      if ((Mouse.x === x) && (Mouse.y === y)) return;
      Mouse.x = x;
      Mouse.y = y;
      $(Mouse).trigger("move");
    },
    start: function(interval) {
      interval = interval || 17;

      this.update = this.handler;
      if (interval > 0) {
        this.update = throttle(this.update, interval);
      }

      this.stop();
      $(document).on("mousemove", this.update);
    },
    stop: function() {
      $(document).off("mousemove", this.update);
    },
    position: function() {
      // compatible with JQuery
      return {
        left: this.x,
        top: this.y
      };
    }
  };

  /*
  $(Mouse).on("move", function(e){
    console.log("move just happened.", e);
  });
  */

  // transform names to jQuery expressions
  var transforms = {
    top: 'position().top',
    left: 'position().left',
    width: 'width()',
    height: 'height()',
    parent: 'parent()'
  };

  // process identifiers in AST
  var idWalker = {
    scope: 'this'
  };
  idWalker.process = function(n) {
    var findOuterIdentifier = function(n) {
      while (n.object && n.object.type === 'MemberExpression') {
        n = n.object;
      }
      //console.log('found outer', n.object || n);
      return n.object || n;
    };
    var addScopeLookup = function(n, scope) {
      var outer = findOuterIdentifier(n);
      var propname = outer.name;
      if (scope !== '') {
        // look up scope
        outer.name = "$(" + scope + ")";
        if (scope === 'this') {
          // append property name for this expressions
          outer.name = outer.name + "." + propname;
        }
      }
    };
    this.scope = 'this';
    acorn.walkDown(n, this);
    addScopeLookup(n, this.scope);
  };
  idWalker.Identifier = function(n, p) {
    var name = n.name;
    //console.log('Identifier', name, n, p);
    if (name in transforms) {
      //console.log('transforming', name, 'to', transforms[name]);
      n.name = transforms[name];
    } else {
      if (name in window) {
        var obj = window[name];
        //console.log('found global object', obj);
        if (obj instanceof HTMLElement) {
          // found div ID
          idWalker.scope = "'#" + name + "'";
        } else if (obj === window || obj === document) {
          // explicitly look in window or object
          idWalker.scope = name;
        } else {
          idWalker.scope = '';
        }
      }
    }
  };
  idWalker.ThisExpression = function(n, p) {
    // TODO: eliminate this extra node
    //p.node = p.node.property;
    //console.log('ThisExpression', n, p);
    n.type = 'Identifier';
    n.name = "select()";
  };

  // rewrite expressions in AST
  var exprWalker = {};
  exprWalker.MemberExpression = function(n, p) {
    var prop = n.property.name;
    var scope = n.object;
    idWalker.process(n);
    //console.log('expr', prop, scope, n);
    return true;
  };

  // Find scopes to listen for changes on
  var scopeWalker = {
    foundScopes: []
  };
  scopeWalker.MemberExpression = function(n, p) {
    var prop = n.property.name;
    var scope = n.object;
    // remove last property to find scope
    n = n.object;

    idWalker.process(n);
    //console.log('found scope', acorn.stringify(n), prop, scope, n);
    scopeWalker.foundScopes.push({
      scope: n,
      propname: prop
    });
    return true;
  };
  findScopes = function(jsexpression) {
    var scope = acorn.parse(jsexpression);
    scopeWalker.foundScopes = [];
    acorn.walkDown(scope, scopeWalker);
    return scopeWalker.foundScopes;
  };

  // create function from a javascipt function body, bound so 'this' is bound to an element
  var returnBoundExpression = function(javascript, el) {
    //console.log('parsing ', javascript);
    return $.proxy(new Function([], javascript), el);
  };

  // applies a constraint to a given element's css property, returning an expression to be evaluated once
  var applyConstraint = function(el, cssprop, jsexpression) {
    var ast;
    try {
      ast = acorn.parse(jsexpression);
    } catch (e) {
      console.error('Failed to parse', jsexpression, 'for', cssprop, 'of', el);
      return false;
    }
    // modify expressions in place
    acorn.walkDown(ast, exprWalker);
    var parsedExpression = acorn.stringify(ast);

    var constraints = el.$constraints = (el.$constraints || {});
    // store parsed expressions
    if (!constraints[cssprop]) {
      constraints[cssprop] = {
        get: returnBoundExpression('return ' + parsedExpression, el),
        scopes: {}
      };
    } else {
      console.warn('Not binding: already applied', jsexpression, 'to property', cssprop, 'of', el);
      return false;
    }

    //console.info('Parsed "' + jsexpression + '" to "' + parsedExpression + '"');
    // close over this to get access to method and dependent scopes
    var context = constraints[cssprop];

    // Set the css property to the value returned by the getter
    context.set = function() {
      if (disabled) return;
      var get = el && el.$constraints && el.$constraints[cssprop] && el.$constraints[cssprop].get;
      if (get) {
        //console.log('set', cssprop, get(), el);
        $(el).css(cssprop, get());
      }
    };

    var localel = el;
    // listen for style change events for each scope used by the expression
    findScopes(jsexpression).forEach(function(item) {
      var scopeAST = item.scope;
      var propname = item.propname;

      // evaluate the scope relative to the element, returns a jquery expression 
      var scopejs = acorn.stringify(scopeAST);
      var key = scopejs + '.' + propname;
      if (context.scopes[key]) {
        console.warn('Not binding: scope already bound for', key, 'in', parsedExpression, 'for', el);
        return;
      }
      var jqel = returnBoundExpression('return ' + scopejs, localel)();
      //console.log('processing scope', propname, body, 'in', parsedExpression);

      // there should only be one scope element
      if (jqel.length > 1) {
        console.warn('"' + body + '" may have an error. Found multiple scopes, only using the first in: ', jqel);
      }

      var scopeel = jqel && jqel[0];
      if (scopeel === localel && propname === cssprop) {
        console.warn('Not binding: expression "' + body + '" may have an error binding to own property:', cssprop, 'on element', localel);
        return;
      }

      var scopeinfo;
      var isBody = scopeel && (scopeel === window || scopeel.localName === 'body');
      if (isBody && (propname === 'width' || propname === 'height')) {
        // width/height bindings to body or window also listen for onresize
        //console.info('binding to', propname, 'resize event on window');
        $(window).on('resize', context.set);
        scopeinfo = context.scopes[key] = [];
        scopeinfo.push(window, 'resize', context.set);
      } else if (jqel === Mouse) {
        // listen for mouse move events
        //console.info('binding to', propname, 'mouse event');
        Mouse.start(17);
        $(Mouse).on("move", context.set);
        scopeinfo = context.scopes[key] = [];
        scopeinfo.push(Mouse, 'value', context.set);
      }
      if (scopeel instanceof HTMLElement) {
        // bind to style change event
        //console.info('binding to', propname, 'style change event on', scopeel);
        if (!scopeel.$sendstyle) scopeel.$sendstyle = {};
        // so we get style listen events
        scopeel.$sendstyle[propname] = true;
        var styleListener = function(e) {
          if (e.target !== scopeel) {
            //console.log('skipping changed style', propname, scopeel);
            return;
          }
          //console.log('changed style', propname, scopeel);
          context.set();
        };
        //styleListener.bind(scopeel);
        var stylekey = 'style-' + propname;
        $(scopeel).on(stylekey, styleListener);
        scopeinfo = context.scopes[key] = [];
        scopeinfo.push(scopeel, stylekey, styleListener);
      }
    });

    context.set();
    return this;
  };

  var removeConstraint = function(el, cssprop) {
    var constraint = el && el.$constraints && el.$constraints[cssprop];
    if (!constraint) return;
    var scopes = constraint.scopes;
    for (var scopekey in scopes) {
      var scope = scopes[scopekey];
      for (var i = 0, l = scope.length; i < l; i += 3) {
        var obj = scope[i];
        var eventname = scope[i + 1];
        var fn = scope[i + 2];
        //console.log('removeConstraint', eventname, obj, fn);
        $(obj).off(eventname, fn);
      }
    }
    delete el.$constraints[cssprop];
  };

  var unbindConstraints = function(selector, cssprop) {
    selector = selector || '[r-style]';
    $(selector).each(function(zstyle, el) {
      if (cssprop === undefined) {
        // remove constraints for all properties
        var constraints = el && el.$constraints;
        if (constraints) {
          for (var prop in constraints) {
            removeConstraint(el, prop);
          }
        }
      } else {
        // remove constraint for the specified property
        removeConstraint(el, cssprop);
      }
    });
    return this;
  };

  // initialize r-style attributes for the given selector, or initialize all elements with r-style attributes
  var bindConstraints = function(selector) {
    selector = selector || '[r-style]';
    // TODO: use jquery.live/on() to listen for new elements
    $(selector).each(function(zstyle, el) {
      var css = el.getAttribute('r-style');

      // TODO: use a real CSS parser
      var csstokens = css.split(';');
      csstokens.forEach(function(token) {
        if (!token) return;
        var index = token.indexOf(':');
        var cssprop = token.substr(0, index).replace(/ /g, '');
        var value = token.substr(index + 1);
        applyConstraint(el, cssprop, value);
      });
    });
    return this;
  };

  // update constraints for the given selector, or update all elements with r-style attributes
  var updateConstraints = function(selector) {
    selector = selector || '[r-style]';
    $(selector).each(function(zstyle, el) {
      var constraints = el.$constraints;
      if (!constraints) return false;
      for (var key in constraints) {
        //console.log('updateConstraints', constraints, constraints[key].set)
        constraints[key].set();
      }
    });
    return this;
  };

  var setEnabled = function(enabled) {
    disabled = !enabled;
    if (enabled) updateConstraints();
    return this;
  };

  $(function() {
    bindConstraints();
  });
  return {
    applyConstraint: applyConstraint,
    unbindConstraints: unbindConstraints,
    bindConstraints: bindConstraints,
    setEnabled: setEnabled,
    updateConstraints: updateConstraints
  };
})();