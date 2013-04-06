//"use strict";

var requestTick = (function() {
  var requestAnimationFrame = window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame || function(delegate) {
      setTimeout(delegate, 17);
    };
  var ticking = false;
  var tickEvents = {};
  var doTick = function() {
    for (var key in tickEvents) {
      if (tickEvents[key]) {
        //console.log('tick', key, tickEvents[key]);
        tickEvents[key]();
        tickEvents[key] = null;
      }
    }
    ticking = false;
  };

  return function requestTick(key, callback) {
    //if (tickEvents[key] !== null) console.log('hit', key)
    if (!ticking) {
      requestAnimationFrame(doTick);
    }
    ticking = true;
    tickEvents[key] = callback;
  };
})();

// singleton that listens for mouse position and holds the most recent left and top coordinates
var Mouse = (function($) {
  var left = 0;
  var top = 0;
  var started = null;
  var selector = $(this);
  var docSelector = $(document);
  var sender = function() {
    selector.trigger("move");
  };
  var handler = function(event) {
    //if (disabled) return;
    if (started) requestTick(0, sender);
    left = event.pageX;
    top = event.pageY;
  };
  var start = function() {
    if (started) return;
    started = true;
    docSelector.on("mousemove", handler).one("mouseout", stop);
  };
  var stop = function() {
    if (!started) return;
    started = false;
    docSelector.off("mousemove", handler).one("mouseover", start);
  };
  var position = function() {
    // compatible with JQuery
    return {
      top: top,
      left: left
    };
  };
  var exports = {
    start: start,
    stop: stop,
    position: position,
    offset: position,
    selector: selector
  };
  return exports;
})(jQuery);

/*
  $(Mouse).on("move", function(e){
    console.log("move just happened.", e);
  });
  */
var rheses = (function($, acorn, Mouse, requestTick) {
  // if true, jQuery acts normally and constraints are disabled
  var disabled = false;
  var console = window.console || function() {};

  var eventNamespace = '.rheses';

  // hack jquery to send a style event when CSS changes
  var origstyle = $.style;
  $.style = function(elem, name, value) {
    var returnval = origstyle.apply(this, arguments);
    if (!(value === undefined || disabled)) {
      // we are setting and aren't disabled
      var sendstyle = $.data(elem, 'sendstyle');
      if (sendstyle && sendstyle[name]) {
        $(elem).trigger(name + eventNamespace);
      }
    }
    return returnval;
  };

  // transforms idiomatic JS to jQuery expressions, e.g. 'parent.left' -> '$(this).parent().position().left'.
  // also 
  var parser = (function() {
    // transform names to jQuery expressions
    var transforms = {
      top: 'position().top',
      left: 'position().left',
      width: 'width()',
      height: 'height()',
      parent: 'parent()'
    };

    // rewrites identifiers and determines top-level scope
    var idWalker = {
      scope: 'this',
      process: function(n) {
        var findOuterIdentifier = function(n) {
          while (n.object && n.object.type === 'MemberExpression') {
            n = n.object;
          }
          //console.log('found outer', n.object || n);
          return n.object || n;
        },
        addScopeLookup = function(n, scope) {
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
      },
      Identifier: function(n, p) {
        //console.log('idwalker Identifier', acorn.stringify(n), p, acorn.stringify(p));
        var name = n.name;
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
      },
      ThisExpression: function(n) {
        // rewrite to a regular identifier
        //console.log('id thisexpression', acorn.stringify(n))
        n.type = "Identifier";
        n.name = "$(this)";
        // don't prepend scope
        idWalker.scope = null;
      }
    };

    // rewrite member expressions in AST
    var expressionWalker = (function() {
      var process = function(node) {
        idWalker.process(node);
        //console.log('expr', node);
        return true;
      };
      return {
        MemberExpression: process,
        Identifier: process,
        parse: function(jsexpression) {
          var ast;
          try {
            ast = acorn.parse(jsexpression);
          } catch (e) {
            console.error('Failed to parse', jsexpression);
            return false;
          }
          //console.log('parsed', jsexpression, ast)
          // modify expressions in place
          acorn.walkDown(ast, this);
          return acorn.stringify(ast);
        }
      };
    })();

    // Find scopes to listen for changes on, e.g. parent.left evaluates to propname 'left' and scope '$(this).parent()'
    var scopeWalker = (function() {
      var foundScopes = [];
      var process = function(node, name) {
        //console.log('scope processing', acorn.stringify(node), name)
        idWalker.process(node);
        //console.log('scope processed', acorn.stringify(node), name)
        foundScopes.push({
          scope: acorn.stringify(node),
          propname: name
        });
        return true;
      };
      return {
        MemberExpression: function(n) {
          //console.log('skipping global constructor', n.object.name, typeof window[n.object.name])
          // Don't process global constructors, e.g. Math
          if (n.object.name in window) {
            //return true;
          }
          var name = n.property.name;
          // remove last property
          n = n.object;
          //console.log('scope Member', acorn.stringify(n), name)
          return process(n, name);
        },
        Identifier: function(n, p) {
          var name = n.name;
          if (p.node.type !== 'MemberExpression') {
            n = {
              type: 'ThisExpression'
            };
            //console.log('setting scope of bare identifier to this:', acorn.stringify(n));
          }
          //console.log('scope Identifier', acorn.stringify(n), acorn.stringify(p.node), name)
          return process(n, name);
        },
        ThisExpression: function(n) {
          idWalker.process(n);
        },
        // Find scope and properties for a given js expression.
        findScopes: function(jsexpression) {
          var scope = acorn.parse(jsexpression);
          foundScopes = [];
          acorn.walkDown(scope, this);
          //console.log('findScopes', foundScopes, jsexpression)
          return foundScopes;
        }
      };
    })();
    return {
      findScopes: scopeWalker.findScopes.bind(scopeWalker),
      parse: expressionWalker.parse.bind(expressionWalker)
    };
  })();

  // create function from a javascipt function body, bound so 'this' is bound to an element
  var returnBoundExpression = function(javascript, el) {
    //console.log('parsing ', javascript);
    return (new Function([], javascript)).bind(el);
  };

  var guid = 1;
  // applies a constraint to a given element's css property, returning an expression to be evaluated once
  var applyConstraint = function(el, cssprop, jsexpression) {
    var parsedExpression = parser.parse(jsexpression);

    var constraints = $.data(el, 'constraints') || {};
    $.data(el, 'constraints', constraints);

    if (constraints[cssprop]) {
      unbindConstraint(el, cssprop);
      //console.warn('Removing existing constraint because one is already already applied', constraints[cssprop].js, 'to property', cssprop, 'of', el);
    }
    // store parsed expressions
    if (!constraints[cssprop]) {
      constraints[cssprop] = {
        // get: returnBoundExpression('return ' + parsedExpression, el),
        // track events for unbindConstraint()
        scopes: []
        //js: parsedExpression
      };
    }

    //console.info('Parsed "' + jsexpression + '" to "' + parsedExpression + '"');

    // close over this to get access to method and dependent scopes
    var context = constraints[cssprop];

    // cache selector
    var selector = $(el);

    // close over getter
    var get = returnBoundExpression('return ' + parsedExpression, selector);
    var set = function() {
      // Updates the css property to the value returned by the getter
      selector.css(cssprop, get());
    };

    var uid = guid++;
    // store in the context for updateConstraints
    context.update = function() {
      if (disabled) return;
      requestTick(uid, set);
      //set();
      // stop propagation
      return false;
    };

    function bindToScope(event, scope) {
      //console.log('bindToScope', event, scope);
      scope.on(event + eventNamespace, context.update);
      // append scope info for unbindConstraint()
      context.scopes.push(scope);
    }

    // track scopes we are already bound to
    var boundScopes = {};
    // listen for style change events for each scope used by the expression
    parser.findScopes(jsexpression).forEach(function(item) {
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

      // special case window and Mouse
      var isBody = scopeel && (scopeel === window || scopeel.localName === 'body');
      if (isBody && (propname === 'width' || propname === 'height')) {
        // width/height bindings to body or window also listen for onresize
        //console.info('binding to', propname, 'resize event on window');
        bindToScope('resize', $(window));
      } else if (scope === Mouse) {
        // listen for mouse move events
        //console.info('binding to', propname, 'mouse event');
        Mouse.start();
        bindToScope('move', Mouse.selector);
      }
      if (scopeel instanceof HTMLElement) {
        // bind to style change event
        //console.info('binding to', propname, 'style change event on', scopeel);
        var sendstyle = $.data(scopeel, 'sendstyle');
        if (!sendstyle) {
          sendstyle = $.data(scopeel, 'sendstyle', {});
        }
        // so we get style events
        sendstyle[propname] = true;
        bindToScope(propname, scope);
      }
    });

    context.update();
    return this;
  };

  // unbind a constraint for the given element and css property.
  var unbindConstraint = function(el, cssprop) {
    var constraints = $.data(el, 'constraints');
    if (!constraints) return;
    // unbind scopes
    var constraint = constraints && constraints[cssprop];
    var method = constraint.update;
    var scopes = constraint.scopes;
    for (var i = 0, l = scopes.length; i < l; i++) {
      var obj = scopes[i];
      //console.log('unbindConstraint', obj, method);
      // clear rhesus-specific events
      obj.off(eventNamespace, method);
    }
    delete constraints[cssprop];
  };

  var defaultSelector = '[r-style]';

  // unbind constraints for the given selector. If cssprop isn't specified, unregister all constraints.
  var unbindConstraints = function(selector, cssprop) {
    selector = selector || defaultSelector;
    $(selector).each(function(i, el) {
      if (cssprop === undefined) {
        // remove constraints for all properties
        var constraints = $.data(el, 'constraints');
        if (constraints) {
          for (var prop in constraints) {
            unbindConstraint(el, prop);
          }
        }
      } else {
        // remove constraint for the specified property
        unbindConstraint(el, cssprop);
      }
    });
    return this;
  };

  // initialize r-style attributes for the given selector, or initialize all elements with r-style attributes
  var bindConstraints = function(selector) {
    selector = selector || defaultSelector;
    // TODO: use jquery.live/on() to listen for new elements
    $(selector).each(function(i, el) {
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
    $(selector).each(function(i, el) {
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
})(jQuery, acorn, Mouse, requestTick);