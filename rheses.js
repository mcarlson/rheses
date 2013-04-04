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
        styles[arguments[0]] = arguments[1];
      } else {
        styles = arguments[0];
      }
      var self = $(this);
      for (var i = 0, l = self.length; i < l; i++) {
        var sendstyle = $.data(self[i], 'sendstyle');
        if (sendstyle) {
          for (var style in styles) {
            if (sendstyle[style]) {
              self.trigger('style-' + style);
            }
          }
        }
      }
    }
    return this;
  };

  // hack animate to send style change events when needed
  var origanimate = $.fn.animate;
  $.fn.animate = function() {
    var args = Array.prototype.slice.call(arguments, 0);
    if (!disabled) {
      //console.log('animate', e.$sendstyle, args);

      // normalize args
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

      // collect list of style events to send
      var self = $(this);
      var styles = {};
      var found = false;
      for (var style in args[0]) {
        for (var i = 0, l = self.length; i < l; i++) {
          var sendstyle = $.data(self[i], 'sendstyle');
          if (sendstyle && sendstyle[style]) {
            found = styles[style] = true;
            break;
          }
        }
      }
      if (found) {
        // change step method to send style events
        var oldstep = args[1].step;
        args[1].step = function() {
          if (oldstep) oldstep.call(this, arguments);
          for (var style in styles) {
            //console.log('sending style update', style, arguments[1]);
            self.trigger('style-' + style);
          }
        };
      }
    }
    return origanimate.apply(this, args);
  };

  var requestAnimationFrame = window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || function(delegate) {
      setTimeout(delegate, 17);
    };

  // singleton that listens for mouse position and holds the last left and top coordinate
  Mouse = (function() {
    var left = 0;
    var top = 0;
    var started = null;
    var dirty = false;
    var selector = null;
    var sender = function() {
      if (started) requestAnimationFrame(sender);
      if (dirty) {
        dirty = false;
        selector.trigger("move");
      }
    };
    var handler = function(event) {
      //if (disabled) return;
      dirty = true;
      left = event.pageX;
      top = event.pageY;
    };

    var start = function() {
      if (started === null) {
        selector = $(Mouse);
      }
      if (started) return;
      started = true;
      requestAnimationFrame(sender);
      $(document).on("mousemove", handler);
      $(document).one("mouseout", stop);
    };
    var stop = function() {
      if (!started) return;
      started = false;
      $(document).off("mousemove", handler);
      $(document).one("mouseover", start);
    };
    var position = function() {
      // compatible with JQuery
      return {
        top: top,
        left: left
      };
    };
    return {
      start: start,
      stop: stop,
      position: position,
      offset: position
    };
  })();

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
      //console.log('addScopeLookup', scope)
      if (scope) {
        // look up scope
        outer.name = "$(" + scope + ")";
        if (scope === 'this') {
          // append property name for this expressions
          outer.name += "." + propname;
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
          idWalker.scope = null;
        }
      }
    }
  };
  idWalker.ThisExpression = function(n, p) {
    // rewrite to a regular identifier
    n.type = "Identifier";
    n.name = "$(this)";
    // don't apply scope
    idWalker.scope = null;
  };

  // rewrite expressions in AST
  var exprWalker = {};
  exprWalker.MemberExpression = function(n, p) {
    //var prop = n.property.name;
    //var scope = n.object;
    idWalker.process(n);
    //console.log('expr', prop, scope, n);
    return true;
  };

  // Find scopes to listen for changes on
  var scopeWalker = {
    foundScopes: []
  };
  // filter out global constructors
  var skipScopes = {
    Math: true
  };
  scopeWalker.MemberExpression = function(n, p) {
    if (n.object.name in skipScopes) return true;
    var prop = n.property.name;
    // remove last property to find scope
    n = n.object;

    idWalker.process(n);
    //console.log('found scope', scopename, prop, n);
    scopeWalker.foundScopes.push({
      scope: acorn.stringify(n),
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
    return (new Function([], javascript)).bind(el);
  };

  var parseExpression = function(jsexpression) {
    var ast;
    try {
      ast = acorn.parse(jsexpression);
    } catch (e) {
      console.error('Failed to parse', jsexpression, 'for', cssprop, 'of', el);
      return false;
    }
    // modify expressions in place
    acorn.walkDown(ast, exprWalker);
    return acorn.stringify(ast);
  };

  // applies a constraint to a given element's css property, returning an expression to be evaluated once
  var applyConstraint = function(el, cssprop, jsexpression) {
    parsedExpression = parseExpression(jsexpression);

    var constraints = $.data(el, 'constraints') || {};
    $.data(el, 'constraints', constraints);

    // store parsed expressions
    if (!constraints[cssprop]) {
      constraints[cssprop] = {
        //        get: returnBoundExpression('return ' + parsedExpression, el),
        scopes: []
      };
    } else {
      //console.warn('Not binding: already applied', jsexpression, 'to property', cssprop, 'of', el);
      return false;
    }

    //console.info('Parsed "' + jsexpression + '" to "' + parsedExpression + '"');

    // close over this to get access to method and dependent scopes
    var context = constraints[cssprop];

    // cache selector
    var selector = $(el);

    // close over getter
    var get = returnBoundExpression('return ' + parsedExpression, selector);

    // store in the context for updateConstraints
    context.update = function(e) {
      // Updates the css property to the value returned by the getter
      if (e) e.stopPropagation();
      if (disabled) return;
      selector.css(cssprop, get());
    };

    var boundScopes = {};
    var scopeinfo = context.scopes;

    function bindToScope(scope, event) {
      //console.log('bindToScope', scope, event);
      scope.on(event, context.update);
      scopeinfo.push(scope, event);
    }
    // listen for style change events for each scope used by the expression
    findScopes(jsexpression).forEach(function(item) {
      var scopejs = item.scope;
      var propname = item.propname;

      // evaluate the scope relative to the element, returns a jquery expression 
      var key = scopejs + '.' + propname;
      if (boundScopes[key]) {
        //console.warn('Not binding: scope already bound for', key, 'in', parsedExpression, 'for', el);
        return;
      }
      var scope = returnBoundExpression('return ' + scopejs, selector)();
      //console.log('processing scope', propname, scopejs, 'in', parsedExpression);

      // there should only be one scope element
      if (scope.length === 0) {
        return;
      } else if (scope.length > 1) {
        console.warn('"' + scopejs + '" may have an error. Found multiple scopes, only using the first in: ', scope);
      }

      var scopeel = scope && scope[0];
      if (scopeel === el && propname === cssprop) {
        console.warn('Not binding: expression "' + jsexpression + '" may have an error binding to own property', cssprop, 'on element', el);
        return;
      }
      boundScopes[key] = true;

      // append scope info for removeConstraint()
      var isBody = scopeel && (scopeel === window || scopeel.localName === 'body');
      if (isBody && (propname === 'width' || propname === 'height')) {
        // width/height bindings to body or window also listen for onresize
        //console.info('binding to', propname, 'resize event on window');
        bindToScope($(window), 'resize');
      } else if (scope === Mouse) {
        // listen for mouse move events
        //console.info('binding to', propname, 'mouse event');
        Mouse.start();
        bindToScope($(Mouse), 'move');
      }
      if (scopeel instanceof HTMLElement) {
        // bind to style change event
        //console.info('binding to', propname, 'style change event on', scopeel);
        var sendstyle = $.data(scopeel, 'sendstyle') || {};
        // so we get style events
        sendstyle[propname] = true;
        $.data(scopeel, 'sendstyle', sendstyle);
        bindToScope(scope, 'style-' + propname);
      }
    });

    context.update();
    return this;
  };

  var removeConstraint = function(el, cssprop) {
    var constraints = $.data(el, 'constraints');
    if (!constraints) return;
    // unbind scopes
    var constraint = constraints && constraints[cssprop];
    var method = constraint.update;
    var scopes = constraint.scopes;
    for (var i = 0, l = scopes.length; i < l; i += 2) {
      var obj = scopes[i];
      var eventname = scopes[i + 1];
      //console.log('removeConstraint', eventname, obj, method);
      $(obj).off(eventname, method);
    }
    delete constraints[cssprop];
  };

  var defaultSelector = '[r-style]';

  var unbindConstraints = function(selector, cssprop) {
    selector = selector || defaultSelector;
    $(selector).each(function(zstyle, el) {
      if (cssprop === undefined) {
        // remove constraints for all properties
        var constraints = $.data(el, 'constraints');
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
    selector = selector || defaultSelector;
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
    selector = selector || defaultSelector;
    $(selector).each(function(zstyle, el) {
      var constraints = $.data(el, 'constraints');
      if (!constraints) return false;
      for (var key in constraints) {
        //console.log('updateConstraints', constraints, constraints[key].update)
        constraints[key].update();
      }
    });
    return this;
  };

  var setEnabled = function(enabled) {
    disabled = !enabled;
    if (enabled) updateConstraints();
    return this;
  };

  $(window).on('load', function() {
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