  compiler = do ->
    nocache = querystring.indexOf('nocache') > 0
    strict = querystring.indexOf('strict') > 0

    # Fix for iOS throwing exceptions when accessing localStorage in private mode, see http://stackoverflow.com/questions/21159301/quotaexceedederror-dom-exception-22-an-attempt-was-made-to-add-something-to-st
    usecache = capabilities.localStorage unless nocache

    cacheKey = "dreemcache"
    cacheData = localStorage.getItem(cacheKey)
    if usecache and cacheData and cacheData.length < 5000000
      compileCache = JSON.parse(cacheData)
      # console.log 'restored', compileCache, cacheData.length
    else
      localStorage.clear()
      compileCache =
        bindings: {}
        script:
          coffee: {}
      localStorage[cacheKey] = JSON.stringify(compileCache) if usecache

    window.addEventListener('unload', () ->
      localStorage[cacheKey] = JSON.stringify(compileCache) if usecache
      # console.log 'onunload', localStorage[cacheKey]
    )

    findBindings = do ->
      bindingCache = compileCache.bindings
      scopes = null
      propertyBindings =
        MemberExpression: (n, parent) ->
          # console.log('MemberExpression', n, parent)
          # avoid binding to CallExpressions whose parent is a function call, e.g. Math.round(...) shouldn't attempt to bind to 'round' on Math
          if parent.node.type is 'CallExpression' and parent.sub is 'callee'
            # console.warn(acorn.stringify parent.node, n.property.name, n.object)
            return true

          # grab the property name
          name = n.property.name

          # remove the property so we can compute the rest of the expression
          n = n.object

          # push the scope onto the list
          scopes.push({binding: acorn.stringify(n), property: name})
          # console.log 'MemberExpression', name, n, acorn.stringify n
          return true

      (expression) ->
        return bindingCache[expression] if usecache and expression of bindingCache
        ast = acorn.parse(expression)
        scopes = []
        acorn.walkDown(ast, propertyBindings)
        bindingCache[expression] = scopes
        # console.log compileCache.bindings
        # return scopes
      # propertyBindings.find = _.memoize(propertyBindings.find)

    # transforms a script to javascript using a runtime compiler
    transform = do ->
      coffeeCache = compileCache.script.coffee
      compilers =
        coffee: (script) ->
          if usecache and script of coffeeCache
            # console.log 'cache hit', script
            return coffeeCache[script]
          if not window.CoffeeScript
            console.warn 'missing coffee-script.js include'
            return
          try
          # console.log 'compiling coffee-script', script
            coffeeCache[script] = CoffeeScript.compile(script, bare: true) if script
          catch error
            showWarnings(["error #{error} compiling script\r\n#{script}"])
          # console.log 'compiled coffee-script', script
          # console.log coffeeCache
          # return coffeeCache[script]

      (script='', name) ->
        return script unless name of compilers
        compilers[name](script)

    # cache compiled scripts to speed up instantiation
    scriptCache = {}
    compiledebug = (script='', args=[], name='') ->
      argstring = args.join()
      key = script + argstring + name
      return scriptCache[key] if key of scriptCache
      # console.log 'compiling', args, script
      try
        script = "\"use strict\"\n" + script if strict
        if name
          # Use a named function so backtraces have names. Replace '-' (from 
          # package names) with '_' to prevent compilation errors.
          func = new Function("return function #{name.replace('-','_')}(#{argstring}){#{script}}")()
        else
          func = new Function(args, script)
        # console.log 'compiled', func
        scriptCache[key] = func
      catch e
        showWarnings(["Failed to compile #{e.toString()} #{args} #{script}"])

    # compile a string into a function
    compile = (script='', args=[], name='') ->
      argstring = args.join()
      key = script + argstring + name
      return scriptCache[key] if key of scriptCache
      # console.log 'compiling', key, args, script
      scriptCache[key] = new Function(args, script)
      # console.log 'compiled', scriptCache

    exports =
      compile: if debug then compiledebug else compile
      transform: transform
      findBindings: findBindings