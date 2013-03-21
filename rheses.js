(function () {
  // hack jquery to send a style event when CSS changes, see http://stackoverflow.com/questions/2157963/is-it-possible-to-listen-to-a-style-change-event
  var orig = $.fn.css;
  $.fn.css = function() {
    orig.apply(this, arguments);
    if (this[0] && this[0].$bindings) {
      var ev = new $.Event('style');
      $(this).trigger(ev, arguments[0]);
    }
  };

  // map property names to jQuery expressions
  var mappings = {
    top: 'position().top',
    left: 'position().left',
    width: 'width()',
    height: 'height()',
    parent: 'parent()',
    window: "parents(window)"
  };
  // JS globals
  var globals = {
    Math: true
  };

  // process identifiers in AST
  var idWalker = {scope: 'this'};
  idWalker.process = function(n) {
    var findOuterIdentifier = function(n) {
      while (n.object && n.object.type === 'MemberExpression') {
        //console.log('found outer', n.object);
        n = n.object;
      }
      return n.object || n;
    };
    var addScopeLookup = function(n, scope) {
      var outer = findOuterIdentifier(n);
      var propname = outer.name;
      if (scope !== '') {
        // look up scope
        outer.name = "$(" + scope + ")";
      }
      if (scope === 'this') {
        // append property name for this expressions
        outer.name = outer.name + "." + propname;
      }
    };
    this.scope = 'this';
    acorn.walkDown(n, this);
    addScopeLookup(n, this.scope);
  };
  idWalker.Identifier = function(n,p) {
    var name = n.name;
    //console.log('Identifier', name, n, p);
    if (name in mappings) {
      // replace with remapped name
      n.name = mappings[name];
    } else if (name in globals) {
      // found global
      //console.log('found global', name);
      idWalker.scope = '';
    } else if (idWalker.scope !== '') {
      // found div ID
      idWalker.scope = "'#" + name + "'";
    }
  };
  idWalker.ThisExpression = function(n,p) {
    // TODO: eliminate this extra node
    //p.node = p.node.property;
    //console.log('ThisExpression', n, p);
    n.type = 'Identifier';
    n.name = "select()";
  };

  // rewrite expressions in AST
  var exprWalker = {};
  exprWalker.MemberExpression = function(n,p) {
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
  scopeWalker.MemberExpression = function(n,p) {
    var prop = n.property.name;
    var scope = n.object;
    // remove last property to find scope
    n = n.object;

    idWalker.process(n);
    //console.log('found scope', prop, scope, acorn.stringify(n), n);
    scopeWalker.foundScopes.push({scope: n, propname: prop});
    return true;
  };
  findScopes = function(jsexpression) {
    var scope = acorn.parse(jsexpression);
    scopeWalker.foundScopes = [];
    acorn.walkDown(scope, scopeWalker);
    return scopeWalker.foundScopes;  
  };

  // create function based on an ast bound so 'this' is the element
  var returnBoundExpression = function(ast, el) {
//    var body = "var $result = " + acorn.stringify(ast) + '; console.log($result); return $result';
    var body = 'return ' + acorn.stringify(ast);
    //console.log('parsing ast', body);
    return $.proxy(new Function([], body), el);
  };
  // applies a constraint to a given element's css property, returning an expression to be evaluated once
  var applyConstraint = function(el, name, jsexpression) {
    if (! el.$bindings) el.$bindings = {};

    var ast = acorn.parse(jsexpression);
    // modify expressions in place
    acorn.walkDown(ast, exprWalker);

    el.$bindings[name] = returnBoundExpression(ast, el);

    // Set the css property to the value returned by the expression
    var setValue = function() {
      var value = el.$bindings[name]();
      //console.log('applying', name, value, el);
      $(el).css(name, value);
    };

    // listen for style change events for each scope used by the expression
    findScopes(jsexpression).forEach(function (item) {
      var scope = item.scope;
      var propname = item.propname;

      // find scope for lookups
      var jqel = returnBoundExpression(scope, el)();
      //console.log('processing scope', propname, jqel, acorn.stringify(scope));
      $(jqel).bind('style', function(e, stylename) {
        if (stylename !== propname || e.target !== jqel[0]) return;
        //console.log('changed style', name, el, stylename, propname, e, e.target, jqel[0]);
        setValue();
      });
      // width/height bindings to body should also listen for onresize
      if (jqel && jqel[0] && jqel[0].localName === 'body' && (propname === 'width' || propname === 'height')) {
        $(window).bind('resize', setValue);
      }
    });

    setValue();
  };

  // look for r-style attributes and automatically apply constriaints
  var initializeConstraints = function() {
    var zstyles = $('[r-style]');
    zstyles.each(function (zstyle, el) {
      var css = el.getAttribute('r-style');

      // TODO: use a real CSS parser
      var csstokens = css.split(';');
      csstokens.forEach(function(token) {
        if (! token) return;
        var index = token.indexOf(':');
        var name = token.substr(0,index).replace(/ /g,'');
        var value = token.substr(index+1);
        applyConstraint(el, name, value);
      });
    });
  };
  $(initializeConstraints);
})();