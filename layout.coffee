###
# The MIT License (MIT)
# 
# Copyright ( c ) 2014 Teem2 LLC
# 
# Permission is hereby granted, free of charge, to any person obtaining a copy
# of this software and associated documentation files (the "Software"), to deal
# in the Software without restriction, including without limitation the rights
# to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
# copies of the Software, and to permit persons to whom the Software is
# furnished to do so, subject to the following conditions:
# 
# The above copyright notice and this permission notice shall be included in all
# copies or substantial portions of the Software.
# 
# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
# IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
# FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
# AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
# LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
# OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
# SOFTWARE.
###

# Maps attribute names to CSS style names.
stylemap =
  x: 'marginLeft'
  y: 'marginTop'
  bgcolor: 'backgroundColor'
  visible: 'display'
  border: 'borderWidth'
  borderstyle: 'borderStyle'
  bordercolor: 'borderColor'

hackstyle = do ->
  # hack jQuery to send a style event when CSS changes
  monitoredJQueryStyleProps = {}
  for prop, value of stylemap
    monitoredJQueryStyleProps[value] = prop
  
  origstyle = $.style
  styletap = (elem, name, value) ->
    attrName = monitoredJQueryStyleProps[name]
    if !attrName?
      # Normalize style names to camel case names by removing '-' and upper
      # casing the subsequent character.
      attrName = monitoredJQueryStyleProps[name.replace(/-([a-z])/i, (m) -> m[1].toUpperCase())]
      monitoredJQueryStyleProps[name] = if attrName then attrName else name
    
    view = elem.$view
    if view[attrName] != value
    # if (view[name] != value and view?.events?[name])
      # console.log('sending style', name, elem.$view._locked) if sendstyle
      view.setAttribute(attrName, value, true)

    origstyle.apply(@, arguments)

  return (active) ->
    if active
      $.style = styletap
    else
      $.style = origstyle


window.dr = do ->
  # from http://coffeescriptcookbook.com/chapters/classes_and_objects/mixins
  mixOf = (base, mixins...) ->
    class Mixed extends base
    for mixin, i in mixins by -1
      for name, method of mixin::
        Mixed::[name] = method
    Mixed

  ###*
  # @class Events
  # @private
  # A lightweight event system, used internally.
  ###
  # based on https://github.com/spine/spine/tree/dev/src
  triggerlock = null
  Events =
    ###*
    # Binds an event to the current scope
    # @param {String} ev the name of the event
    # @param {Function} callback called when the event is fired
    ###
    bind: (ev, callback) ->
      # console.log 'binding', ev, callback
      evs   = ev.split(' ')
      @events = {} unless @hasOwnProperty('events') and @events
      for name in evs
        @events[name] or= []
        @events[name].push(callback)
      @
    ###*
    # Binds an event to the current scope, automatically unbinds when the event fires
    # @param {String} ev the name of the event
    # @param {Function} callback called when the event is fired
    ###
    one: (ev, callback) ->
      @bind ev, ->
        @unbind(ev, arguments.callee)
        callback.apply(@, arguments)
      @
    ###*
    # Fires an event
    # @param {String} ev the name of the event to fire
    ###
    trigger: (ev, args...) ->
      list = @hasOwnProperty('events') and @events?[ev]
      return unless list
      if triggerlock and triggerlock.scope == @ and triggerlock.ev == ev
        return @
      unless triggerlock
        triggerlock = {
          ev: ev
          scope: @
        }
        # console.log triggerlock
      # else
      #   console.log 'old', triggerlock
      # if list then console.log 'trigger', ev, list
      for callback in list
        if callback.apply(@, args) is false
          break
      triggerlock = null
      @
    ###*
    # Listens for an event on a specific scope
    # @param {Object} obj scope to listen for events on
    # @param {String} ev the name of the event
    # @param {Function} callback called when the event is fired
    ###
    listenTo: (obj, ev, callback) ->
      # console.log('listenTo', obj, ev, callback, obj.bind)
      obj.bind(ev, callback)
      @listeningTo or= []
      @listeningTo.push {obj: obj, ev: ev, callback: callback}
      @

    ###*
    # Only listens for an event one time
    # @param {Object} obj scope to listen for events on
    # @param {String} ev the name of the event
    # @param {Function} callback called when the event is fired
    ###
    listenToOnce: (obj, ev, callback) ->
      listeningToOnce = @listeningToOnce or = []
      listeningToOnce.push obj
      obj.one ev, ->
        idx = listeningToOnce.indexOf(obj)
        listeningToOnce.splice(idx, 1) unless idx is -1
        callback.apply(@, arguments)
      @
    ###*
    # Stops listening for an event on a given scope
    # @param {Object} obj scope to listen for events on
    # @param {String} ev the name of the event
    # @param {Function} callback called when the event would have been fired
    ###
    stopListening: (obj, ev, callback) ->
      if obj
        obj.unbind(ev, callback)
        for listeningTo in [@listeningTo, @listeningToOnce]
          continue unless listeningTo
          idx = listeningTo.indexOf(obj)
          # console.log('stopListening', idx, obj, listeningTo)
          if idx > -1
            listeningTo.splice(idx, 1)
          else
            # console.log('looking in array', listeningTo)
            for val, index in listeningTo
              # console.log('found', val)
              if obj == val.obj and ev == val.ev and callback == val.callback
                # console.log('found match', index)
                listeningTo.splice(index, 1)
                break
      else
        for {obj, ev, callback} in @listeningTo
          # console.log 'stopped listening', obj, ev, callback
          obj.unbind(ev, callback)
        @listeningTo = undefined
      @
    ###*
    # Stops listening for an event on the current scope
    # @param {String} ev the name of the event
    # @param {Function} callback called when the event would have been fired
    ###
    unbind: (ev, callback) ->
      unless ev
        @events = {}
        return @
      evs  = ev.split(' ')
      for name in evs
        list = @events?[name]
        continue unless list
        unless callback
          delete @events[name]
          continue
        for cb, i in list when (cb is callback)
          list = list.slice()
          list.splice(i, 1)
          @events[name] = list
          break
      @

  ###*
  # @class Module
  # @private
  # Adds basic mixin support.
  ###
  # Coffeescript mixins adapted from https://github.com/spine/spine/tree/dev/src
  moduleKeywords = ['included', 'extended']
  class Module
    ###*
    # Includes a mixin in the current scope
    # @param {Object} obj the object to be mixed in
    ###
    @include: (obj) ->
      throw new Error('include(obj) requires obj') unless obj
      for key, value of obj when key not in moduleKeywords
        # console.log key, obj, @::
        @::[key] = value
      obj.included?.call(@, obj)
      @

  ###*
  # @class Eventable {Core Dreem}
  # @extends Module
  # The baseclass used by everything in dreem. Adds higher level event APIs.
  ###
  class Eventable extends Module
    ###*
    # @method include
    # @hide
    ###
    @include Events

    # A mapping of type coercion functions by attribute type.
    typemappings=
      number: parseFloat
      boolean: (val) -> (if (typeof val == 'string') then val == 'true' else (!! val))
      string: (val) -> val + ''
      json: (val) -> JSON.parse(val)
      expression: (val) -> 
        if typeof val != 'string'
          return val
        eval(val)

    # Tracks events sent by setAttribute() to prevent recursion
    eventlock = {}

    _coerceType: (name, value, type) ->
      type ||= @types[name]
      if type
        unless (typemappings[type])
          showWarnings ["Invalid type '#{type}' for attribute '#{name}', must be one of: #{Object.keys(typemappings).join(', ')}"]
          return
        value = typemappings[type](value)
      else unless value?
        #if this is a string type attribute it should be set to the empty string if it is null or undefined
        # (as in the case where it is set by constraint, and the constraint resolves to undefined)
        value = ''
      return value

    _setDefaults: (attributes, defaults={}) ->
      for key, value of defaults
        if not (key of attributes)
          attributes[key] = defaults[key]

    ###*
    # Sets an attribute, calls a setter if there is one, then sends an event with the new value
    # @param {String} name the name of the attribute to set
    # @param value the value to set to
    ###
    setAttribute: (name, value, skipcoercion, skipConstraintSetup, skipconstraintunregistration) ->
      # TODO: add support for dynamic constraints
      value = @_coerceType(name, value) unless skipcoercion

      unless skipconstraintunregistration
        if @constraints? and name of @constraints
          @_unbindConstraint(name)

      @["set_#{name}"]?(value)
      @[name] = value
      @sendEvent(name, value)
      @

    ###*
    # Sends an event
    # @param {String} name the name of the event to send
    # @param value the value to send with the event
    ###
    sendEvent: (name, value) ->
      # send event
      if @events?[name]
        @trigger(name, value, @) 
      # else
        # console.log 'no event named', name, @events, @
      @

    ###*
    # Calls setAttribute for each name/value pair in the attributes object
    # @param {Object} attributes An object of name/value pairs to be set
    ###
    setAttributes: (attributes) ->
      for name, value of attributes
        @setAttribute(name, value)
      @

  capabilities = {
    localStorage: do ->
      mod = 'dr'
      try
        localStorage.setItem(mod, mod)
        localStorage.removeItem(mod)
        return true
      catch e
        return false
    # detect touchhttp://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript
    touch: 'ontouchstart' of window || 'onmsgesturechange' of window # deal with ie10
    camelcss: navigator.userAgent.toLowerCase().indexOf('firefox') > -1
  }

  querystring = window.location.search
  debug = querystring.indexOf('debug') > 0
  test = querystring.indexOf('test') > 0
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
        MemberExpression: (n) ->
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
          func = new Function("return function #{name}(#{argstring}){#{script}}")()
        else 
          func = new Function(args, script)
        # console.log 'compiled', func
        scriptCache[key] = func
      catch e
        console.error 'failed to compile', e.toString(), args, script

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


  # a list of constraint scopes gathered at init time
  constraintScopes = []

  _initConstraints = ->
    for constraint in constraintScopes
      constraint._bindConstraints()
    constraintScopes = []
  ###*
  # @class dr.node {Core Dreem}
  # @extends Eventable
  # The nonvisual base class for everything in dreem. Handles parent/child relationships between tags.
  #
  # Nodes can contain methods, handlers, setters, [constraints](#!/guide/constraints), attributes and other node instances.
  #
  # Here we define a data node that contains movie data.
  #
  #     <node id="data">
  #       <node>
  #         <attribute name="title" type="string" value="Bill and Teds Excellent Adventure"></attribute>
  #         <attribute name="type" type="string" value="movie"></attribute>
  #         <attribute name="year" type="string" value="1989"></attribute>
  #         <attribute name="length" type="number" value="89"></attribute>
  #       </node>
  #       <node>
  #         <attribute name="title" type="string" value="Waynes World"></attribute>
  #         <attribute name="type" type="string" value="movie"></attribute>
  #         <attribute name="year" type="string" value="1992"></attribute>
  #         <attribute name="length" type="number" value="94"></attribute>
  #       </node>
  #     </node>
  #
  # This node defines a set of math helper methods. The node provides a tidy container for these related utility functions.
  #
  #     <node id="utils">
  #       <method name="add" args="a,b">
  #         return a+b;
  #       </method>
  #       <method name="subtract" args="a,b">
  #         return a-b;
  #       </method>
  #     </node>
  #
  # You can also create a sub-class of node to contain non visual functionality. Here is an example of an inches to metric conversion class that is instantiated with the inches value and can convert it to either cm or m.
  #
  #     @example
  #
  #     <class name="inchesconverter" extends="node">
  #       <attribute name="inchesval" type="number" value="0"></attribute>
  #
  #       <method name="centimetersval">
  #         return this.inchesval*2.54;
  #       </method>
  #
  #       <method name="metersval">
  #         return (this.inchesval*2.54)/100;
  #       </method>
  #     </class>
  #
  #     <inchesconverter id="conv" inchesval="2"></inchesconverter>
  #
  #     <spacedlayout axis="y"></spacedlayout>
  #     <text text="${conv.inchesval + ' inches'}"></text>
  #     <text text="${conv.centimetersval() + ' cm'}"></text>
  #     <text text="${conv.metersval() + ' m'}"></text>
  #
  #
  ###
  class Node extends Eventable
    ###*
    # @attribute {String} name
    # Names this node in its parent scope so it can be referred to later.
    ###
    ###*
    # @attribute {String} id
    # Gives this node a global ID, which can be looked up in the global window object.
    # Take care to not override builtin globals, or override your own instances!
    ###
    ###*
    # @attribute {String} scriptincludes
    # A comma separated list of URLs to javascript includes required as dependencies. Useful if you need to ensure a third party library is available.
    ###
    ###*
    # @attribute {String} scriptincludeserror
    # An error to show if scriptincludes fail to load
    ###
    matchConstraint = /\${(.+)}/
    # name should be set before parent so that when subnode events fire the 
    # nodes can be identified
    earlyattributes = ['name', 'parent']
    # data must be set after text
    lateattributes = ['data']

    constructor: (el, attributes = {}) ->

      ###*
      # @property {dr.node[]} subnodes
      # @readonly
      # An array of this node's child nodes
      ###
      @subnodes = []
      # Install types
      @types = attributes.$types ? {}
      delete attributes.$types
      skiponinit = attributes.$skiponinit
      delete attributes.$skiponinit
      deferbindings = attributes.$deferbindings
      delete attributes.$deferbindings

      ###
      # @property {String} $textcontent
      # @readonly
      # Contains the textual contents of this node, if any
      ###
      # store textual content
      if el?.textContent
        attributes.$textcontent = el.textContent

      if attributes.$methods
        @installMethods(attributes.$methods, attributes.$tagname)
        delete attributes.$methods

      if attributes.$handlers
        @installHandlers(attributes.$handlers, attributes.$tagname)
        # do this here for now - ugly though
        for {ev, name, script, args, reference, method} in attributes.$handlers
          ev = ev.substr(2)
          if ev in mouseEvents
            attributes.clickable = true unless attributes.clickable is "false"
            # console.log 'registered for clickable', attributes.clickable

        delete attributes.$handlers

      unless deferbindings
        @_bindHandlers()

      for name in earlyattributes
        @setAttribute(name, attributes[name]) if name of attributes

      # Bind to event expressions and set attributes
      for name, value of attributes
        continue if name in lateattributes or name in earlyattributes
        @bindAttribute(name, value, attributes.$tagname)
      
      # Need to fire subnode added events after attributes have been set since
      # we aren't fully configured until now so listeners may be notified
      # before the node is actually ready. Doing this in set_parent specificaly
      # causes problems in layouts when a view is added after initialization
      # since the layout will set a value such as x,y before the x,y setters
      # of the node itself have run.
      parent = @parent
      if (parent and parent instanceof Node)
        ###*
        # @event onsubnodes
        # Fired when this node's subnodes array has changed
        # @param {dr.node} node The dr.node that fired the event
        ###
        ###*
        # @event subnodeAdded
        # Fired when a subnode is added to this node.
        # @param {dr.node} node The dr.node that was added
        ###
        parent.sendEvent('subnodes', @)
        parent.sendEvent('subnodeAdded', @)
        parent.doSubnodeAdded(@)

      for name in lateattributes
        @bindAttribute(name, attributes[name], attributes.$tagname) if name of attributes

      constraintScopes.push(@) if @constraints

      unless deferbindings
        @_bindHandlers(true)

      ###*
      # @event oninit
      # Fired when this node and all its children are completely initialized
      # @param {dr.node} node The dr.node that fired the event
      ###
      ###*
      # @property {Boolean} inited
      # @readonly
      # True when this node and all its children are completely initialized
      ###

      # console.log 'new node', @, attributes
      unless skiponinit
        unless @inited
          @inited = true
          @sendEvent('init', @)

    installMethods: (methods, tagname, scope=@, callbackscope=@) ->
      # console.log('installing methods', methods, tagname, scope, callbackscope)
      # Install methods
      for name, methodlist of methods
        for {method, args, allocation, invokeSuper} in methodlist
          # console.log 'installing method', name, method, args, allocation, @
          _installMethod(scope, name, compiler.compile(method, args, "#{tagname}$#{name}").bind(callbackscope), allocation, invokeSuper)
      return

    installHandlers: (handlers, tagname, scope=@) ->
      # store list of handlers for late binding
      @handlers ?= []
      @latehandlers ?= []
      for handler in handlers
        {ev, name, script, args, reference, method} = handler
        # strip off leading 'on'
        ev = ev.substr(2)

        # console.log 'installing handler', ev, args, script, @
        if method
          handler.callback = scope[method]
          # console.log('using method', method, handler.callback)
        else
          handler.callback = _eventCallback(ev, script, scope, tagname, args)

        handlerobj = {scope: @, ev: ev, name: name, callback: handler.callback, reference: reference}
        if reference
          @latehandlers.push(handlerobj)
        else
          @handlers.push(handlerobj)
      return

    removeHandlers: (handlers, tagname, scope=@) ->
      for handler in handlers
        {ev, name, script, args, reference, method} = handler
        # strip off leading 'on'
        ev = ev.substr(2)

        # console.log 'removing handler', ev, args, script, @
        if reference?
          refeval = @_valueLookup(reference)()
          # console.log('stopListening to reference', reference, refeval, ev, handler.callback)
          scope.stopListening(refeval, ev, handler.callback)
        else
          scope.unbind(ev, handler.callback)
      return

    # Bind an attribute to a constraint, event expression/handler or fall back to setAttribute()
    bindAttribute: (name, value, tagname) ->
      constraint = value.match?(matchConstraint) if value
      if constraint
        # console.log('applying constraint', name, constraint[1])
        @setConstraint(name, constraint[1], true)
      else if name.indexOf('on') == 0
        name = name.substr(2)
        # console.log('binding to event expression', name, value, @)
        @bind(name, _eventCallback(name, value, @, tagname))
      else
        @setAttribute(name, value)

    # public API to initialize constraints for a group of nodes, used by replicator
    initConstraints: ->
      _initConstraints()
      @

    # generate a callback for an event expression in a way that preserves scope, e.g. on_x="console.log(value, this, ...)"
    _eventCallback = (name, script, scope, tagname='', fnargs=['value']) ->
      # console.log 'binding to event expression', name, script, scope, fnargs
      js = compiler.compile(script, fnargs, "#{tagname}$on#{name}")
      ->
        if arguments.length
          args = arguments
        else if name of scope
          args = [scope[name]]
        else
          args = []
        # console.log 'event callback', name, args, scope, js
        js.apply(scope, args)

    _installMethod = (scope, methodname, method, allocation, invokeSuper) ->
      # TODO: add class methods when allocation == 'class'
      if methodname of scope
        # Cheesy override
        supr = scope[methodname]
        meth = method
        scope[methodname] = ->
          # console.log 'applying overridden method', methodname, arguments
          if invokeSuper == 'after'
            retval = meth.apply(scope, arguments)
            supr.apply(scope, arguments)
          else if invokeSuper == 'inside'
            prevValue = scope['super'];
            prevOwn = scope.hasOwnProperty('super');
            scope['super'] = (args) -> supr.apply(scope, args)
            retval = meth.apply(scope, arguments)
            if prevOwn
              scope['super'] = prevValue;
            else
              delete scope.callSuper;
          else # before (default)
            supr.apply(scope, arguments)
            retval = meth.apply(scope, arguments)
          return retval
        # console.log('overrode method', methodname, scope, supr, meth)
      else
        scope[methodname] = method
      # console.log('installed method', methodname, scope, scope[methodname])

    # sets a constraint, binding it immediately unless skipbinding is true.
    # If skipbinding is true, call _bindConstraints() or _initConstraints()
    # to bind constraints later.
    setConstraint: (property, expression, skipbinding) ->
      # console.log 'adding constraint', property, expression, @
      if @constraints?
        @_unbindConstraint(property) if property of @constraints
      else
        @constraints = {}

      @constraints[property] =
        expression: expression
        bindings: {}

      bindings = @constraints[property].bindings
      scopes = compiler.findBindings(expression)
      # console.log 'found scopes', scopes
      for scope in scopes
        bindexpression = scope.binding
        bindings[bindexpression] ?= []
        bindings[bindexpression].push(scope)
        # console.log 'applied', scope.property, bindexpression, 'for', @

      @_bindConstraints() unless skipbinding
      # console.log 'matched constraint', property, @, expression
      return

    # compiles a function that looks bindexpression up later in the local scope
    _valueLookup: (bindexpression) ->
      compiler.compile('return ' + bindexpression).bind(@)

    # remove a constraint, unbinding from all its dependencies
    _unbindConstraint: (property) ->
      return unless property of @constraints
      constraint = @constraints[property]
      {callback, callbackbindings} = constraint
      # console.log "removing constraint for #{property}", constraint, callback, callbackbindings

      for prop, i in callbackbindings by 2
        scope = callbackbindings[i + 1]
        # console.log "removing binding", prop, scope, callback
        scope.unbind?(prop, callback)

      @constraints[property] = null
      return

    _bindConstraints: ->
      for name, constraint of @constraints
        {bindings, expression} = constraint
        constraint.callbackbindings ?= []
        fn = @_valueLookup(expression)
        # console.log 'binding constraint', name, expression, @
        constraint.callback = @_constraintCallback(name, fn)
        for bindexpression, bindinglist of bindings
          boundref = @_valueLookup(bindexpression)()
          if not boundref or not boundref.bind?
            showWarnings(["Could not bind to #{bindexpression} of constraint #{expression} for #{@$tagname}#{if @id then '#' + @id else if @name then '.' + name else ''}"])
            continue

          for binding in bindinglist
            property = binding.property
            # console.log 'binding to', property, 'on', boundref
            boundref.bind(property, constraint.callback)
            constraint.callbackbindings.push(property, boundref)

        @setAttribute(name, fn(), false, false, true)
      return

    _bindHandlers: (isLate) ->
      bindings = if isLate then @latehandlers else @handlers
      return unless bindings

      # Track bindings that need to be deferred here
      defer = []
      for binding in bindings
        {scope, name, ev, callback, reference} = binding
        if reference
          refeval = @_valueLookup(reference)()
          # Ensure we have a reference to a Dreem object
          if refeval instanceof Eventable
            scope.listenTo(refeval, ev, callback)
            # console.log('binding to reference', reference, refeval, ev, scope)
          else
            # if not, defer this binding and continue
            defer.push binding
            continue
        else
          # console.log('binding to scope', scope, ev)
          scope.bind(ev, callback)
          scope.sendEvent(ev, scope[ev]) if ev of scope

      # if bindings need to be deferred, try again later
      if defer.length
        if isLate 
          @latehandlers = defer
        else 
          @handlers = defer
        # console.log 'found deferred bindings', defer
        setTimeout(() =>
          @_bindHandlers(isLate)
        , 0)
        return

      if isLate 
        @latehandlers = []
      else
        @handlers = []
      return

    # generate a callback for a constraint expression, e.g. x="${this.parent.baz.x + 10}"
    _constraintCallback: (name, fn) ->
      # console.log('binding to constraint function', name, fn, @)
      return `(function constraintCallback(){`
      # console.log 'setting', name, fn(), @
      @.setAttribute(name, fn(), false, false, true)
      `}).bind(this)`

    set_parent: (parent) ->
      # console.log 'set_parent', parent, @
      # normalize to jQuery object
      if parent instanceof Node
        # store references to parent and children
        parent[@name] = @ if @name
        parent.subnodes.push(@)

    set_name: (name) ->
      # console.log 'set_name', name, @
      @parent[name] = @ if @parent and name

    set_id: (id) ->
      window[id] = @

    _removeFromParent: (name) ->
      return unless @parent
      arr = @parent[name]
      index = arr.indexOf(@)
      if (index != -1)
        removedNode = arr[index]
        arr.splice(index, 1)
        # console.log('_removeFromParent', index, name, arr.length, arr, @)
        @parent.sendEvent(name, removedNode)
        if name == 'subnodes'
          ###*
          # @event subnodeRemoved
          # Fired when a subnode is removed from this node.
          # @param {dr.node} node The dr.node that was removed
          ###
          @parent.sendEvent('subnodeRemoved', removedNode)
          @parent.doSubnodeRemoved(removedNode)
      return

    # find all parents with an attribute set to a specific value. Used in updateSize to deal with invisible parents.
    _findParents: (name, value) ->
      out = []
      p = @
      while (p)
        if name of p and p[name] == value
          out.push p
        p = p.parent
      out

    # find an attribute in a parent. Returns the value found. Used by datapath.
    _findInParents: (name) ->
      p = @parent
      while (p)
        if name of p
          # console.log 'found in parent', name, p
          return p[name]
        p = p.parent

    ###*
    # Called when a subnode is added to this node. Provides a hook for
    # subclasses. No need for subclasses to call super. Do not call this
    # method to add a subnode. Instead call setParent.
    # @param {dr.node} node The subnode that was added.
    # @return {void}
    ###
    doSubnodeAdded: (node) ->
      # Empty implementation by default

    ###*
    # Called when a subnode is removed from this node. Provides a hook for
    # subclasses. No need for subclasses to call super. Do not call this
    # method to remove a subnode. Instead call _removeFromParent.
    # @param {dr.node} node The subnode that was removed.
    # @return {void}
    ###
    doSubnodeRemoved: (node) ->
      # Empty implementation by default

    ###*
    # @method destroy
    # Destroys this node
    ###
    ###*
    # @ignore
    ###
    destroy: (skipevents) ->
      # console.log 'destroy node', @

      ###*
      # @event ondestroy
      # Fired when this node and all its children are about to be destroyed
      # @param {dr.node} node The dr.node that fired the event
      ###
      @sendEvent('destroy', @)

      # unbind constraints
      if @constraints
        for property of @constraints
          @_unbindConstraint(property)

      # stop events
      if @listeningTo
        @stopListening()
      @unbind()

      # remove name reference
      if (@parent?[@name] == @)
        delete @parent[@name]

      # console.log 'destroying', @subnodes, @
      for subnode in @subnodes
        # console.log 'destroying', subnode, @
        subnode?.destroy(true)

      @_removeFromParent('subnodes') unless skipevents

  ###*
  # @class Sprite
  # @private
  # Abstracts the underlying visual primitives (currently HTML) from dreem's view system.
  ###
  class Sprite
#    guid = 0
    noop = () ->
    styleval =
      display: (isVisible) ->
        if isVisible then '' else 'none'
      cursor: (clickable) ->
        if clickable then 'pointer' else ''
        
    constructor: (jqel, view, tagname = 'div') ->
      # console.log 'new sprite', jqel, view, tagname
      if not jqel?
        # console.log 'creating element', tagname
        @el = document.createElement(tagname)
        # prevent duplicate initializations
        @el.$init = true
      # else if jqel instanceof jQuery
      #   @el = jqel[0]
      else if jqel instanceof HTMLElement
        @el = jqel
      # console.log 'sprite el', @el, @
      @el.$view = view

      # normalize to jQuery object
#      guid++
#      jqel.attr('id', 'jqel-' + guid) if not jqel.attr('id')
      @el.setAttribute('class', 'sprite')

    setStyle: (name, value, internal, el=@el) ->
      value ?= ''
      name = stylemap[name] if name of stylemap
      value = styleval[name](value) if name of styleval
      # console.log('setStyle', name, value, @el)
      el.style[name] = value
      # @jqel.css(name, value)

    set_parent: (parent) ->
      if parent instanceof Sprite
        parent = parent.el
      # else if parent instanceof jQuery
      #   parent = parent[0]

      # parent = $(parent) unless parent instanceof jQuery
      # parent.append(@jqel)
      # parent = parent[0] if parent instanceof jQuery
      # console.log 'set_parent', parent, @el
      parent.appendChild(@el)

    set_id: (id) ->
      # console.log('setid', @id)
      @el.setAttribute('id', id)

    animate: =>
      @jqel ?= $(@el)
      for name, value of arguments[0]
        if name of stylemap
          arguments[0][stylemap[name]] = value
          delete arguments[0][name]
      # console.log 'sprite animate', arguments[0], @jqel
      @jqel.animate.apply(@jqel, arguments)

    set_clickable: (clickable) ->
      @__clickable = clickable
      @__updatePointerEvents()
      @setStyle('cursor', clickable, true)

      # TODO: retrigger the event for the element below for IE and Opera? See http://stackoverflow.com/questions/3680429/click-through-a-div-to-underlying-elements
      # el = $(event.target)
      # el.hide()
      # $(document.elementFromPoint(event.clientX,event.clientY)).trigger(type)
      # el.show()

    set_clip: (clip) ->
      # console.log('setid', @id)
      @__clip = clip
      @__updateOverflow()

    set_scrollable: (scrollable) ->
      # console.log('setid', @id)
      @__scrollable = scrollable
      @__updateOverflow()
      @__updatePointerEvents()

    __updateOverflow: () ->
      @setStyle('overflow',
        if @__scrollable
          'auto'
        else if @__clip
          'hidden'
        else
          ''
      , true)

    __updatePointerEvents: () ->
      @setStyle('pointer-events', 
        if @__clickable || @__scrollable
          'auto'
        else
          'none'
      , true)

    destroy: ->
      @el.parentNode.removeChild(@el)
      @el = @jqel = null

    setText: (txt) ->
      if txt?
        @el.innerHTML = txt

    getText: (textOnly) ->
      if textOnly
        @el.innerText
      else
        @el.innerHTML

    value: (value) ->
      return unless @input
      if value?
        @input.value = value
      else
        @input.value

    measureTextSize: (multiline, width, resize) ->
      if multiline
        @setStyle('width', width, true)
        @setStyle('height', 'auto', true)
        @setStyle('whiteSpace', 'normal', true)
      else
        if resize
          @setStyle('width', 'auto', true)
          @setStyle('height', 'auto', true)
        @setStyle('whiteSpace', '', true)
      {width: @el.clientWidth, height: @el.clientHeight}

    handle: (event) =>
      view = event.target.$view
      return unless view
      # console.log 'event', event.type, view
      view.sendEvent(event.type, view)

    createTextElement: () ->
      @el.setAttribute('class', 'sprite sprite-text noselect')

    createInputtextElement: (text, multiline, width, height) ->
      @el.setAttribute('class', 'sprite noselect')
      if multiline
        input = document.createElement('textarea')
      else
        input = document.createElement('input')
        input.setAttribute('type', 'text')
      input.setAttribute('value', text)
      input.setAttribute('class', 'sprite-inputtext')
      if width
        @setStyle('width', width, true, input)
      if height
        @setStyle('height', height, true, input)
      @el.appendChild(input)
      # console.log('createInputtextElement', text, multiline, width, height, input)

      input.$view = @el.$view
      $(input).on('focus blur', @handle)
      @input = input

    getAbsolute: () ->
      @jqel ?= $(@el)
      pos = @jqel.offset()
      {x: pos.left - window.pageXOffset, y: pos.top - window.pageYOffset}

    set_class: (classname) ->
      # console.log('setid', @id)
      @el.setAttribute('class', classname)

  if (capabilities.camelcss)
    # handle camelCasing CSS styles, e.g. background-color -> backgroundColor - not needed for webkit
    ss = Sprite::setStyle
    fcamelCase = ( all, letter ) ->
      letter.toUpperCase()
    rdashAlpha = /-([\da-z])/gi
    Sprite::setStyle = (name, value, internal, el=@el) ->
      if name.match(rdashAlpha)
        # console.log "replacing #{name}"
        name = name.replace(rdashAlpha, fcamelCase)
      ss(name, value, internal, el)

  if (debug)
    # add warnings for unknown CSS properties
    otherstyles = ['width', 'height', 'background-color']
    ss2 = Sprite::setStyle
    Sprite::setStyle = (name, value, internal, el=@el) ->
      if not internal and not (name of stylemap) and not (name in otherstyles)
        console.warn "Setting unknown CSS property #{name} = #{value} on ", @el.$view, stylemap, internal
      ss2(name, value, internal, el)

  # Attributes that shouldn't be applied visually and will thus not be
  # set on the sprite.
  hiddenAttributes = {
    text: true,
    $tagname: true,
    data: true,
    replicator: true,
    class: true,
    clip: true,
    clickable: true,
    scrollable: true,
    $textcontent: true,
    resize: true,
    multiline: true,
    ignorelayout: true
  }

  # Internal attributes ignored by class declarations and view styles
  ignoredAttributes = {
    parent: true, 
    id: true, 
    name: true, 
    extends: true, 
    type: true, 
    scriptincludes: true
  }


  ###*
  # @aside guide constraints
  # @class dr.view {UI Components}
  # @extends dr.node
  # The visual base class for everything in dreem. Views extend dr.node to add the ability to set and animate visual attributes, and interact with the mouse.
  #
  # Views are positioned inside their parent according to their x and y coordinates.
  #
  # Views can contain methods, handlers, setters, constraints, attributes and other view, node or class instances.
  #
  # Views can be easily converted to reusable classes/tags by changing their outermost &lt;view> tags to &lt;class> and adding a name attribute.
  #
  # Views support a number of builtin attributes. Setting attributes that aren't listed explicitly will pass through to the underlying Sprite implementation.
  #
  # Views currently integrate with jQuery, so any changes made to their CSS via jQuery will automatically cause them to update.
  #
  # Note that dreem apps must be contained inside a top-level &lt;view>&lt;/view> tag.
  #
  # The following example shows a pink view that contains a smaller blue view offset 10 pixels from the top and 10 from the left.
  #
  #     @example
  #     <view width="200" height="100" bgcolor="lightpink">
  #
  #       <view width="50" height="50" x="10" y="10" bgcolor="lightblue"></view>
  #
  #     </view>
  #
  # Here the blue view is wider than its parent pink view, and because the clip attribute of the parent is set to false it extends beyond the parents bounds.
  #
  #     @example
  #     <view width="200" height="100" bgcolor="lightpink" clip="false">
  #
  #       <view width="250" height="50" x="10" y="10" bgcolor="lightblue"></view>
  #
  #     </view>
  #
  # Now we set the clip attribute on the parent view to true, causing the overflowing child view to be clipped at its parent's boundary.
  #
  #     @example
  #     <view width="200" height="100" bgcolor="lightpink" clip="true">
  #
  #       <view width="250" height="50" x="10" y="10" bgcolor="lightblue"></view>
  #
  #     </view>
  #
  # Here we demonstrate how unsupported attributes are passed to the underlying sprite system. We make the child view semi-transparent by setting opacity. Although this is not in the list of supported attributes it is still applied.
  #
  #     @example
  #     <view width="200" height="100" bgcolor="lightpink">
  #
  #       <view width="250" height="50" x="10" y="10" bgcolor="lightblue" opacity=".5"></view>
  #
  #     </view>
  #
  # It is convenient to [constrain](#!/guide/constraints) a view's size and position to attributes of its parent view. Here we'll position the inner view so that its inset by 10 pixels in its parent.
  #
  #     @example
  #     <view width="200" height="100" bgcolor="lightpink">
  #
  #       <view width="${this.parent.width-this.inset*2}" height="${this.parent.height-this.inset*2}" x="${this.inset}" y="${this.inset}" bgcolor="lightblue">
  #         <attribute name="inset" type="number" value="10"></attribute>
  #       </view>
  #
  #     </view>
  ###
  class View extends Node
    ###*
    # @attribute {Number} [x=0]
    # This view's x position
    ###
    ###*
    # @attribute {Number} [y=0]
    # This view's y position
    ###
    ###*
    # @attribute {Number} [width=0]
    # This view's width
    ###
    ###*
    # @attribute {Number} [height=0]
    # This view's height
    ###
    ###*
    # @attribute {Boolean} [clickable=false]
    # If true, this view recieves mouse events. Automatically set to true when an onclick/mouse* event is registered for this view.
    ###
    ###*
    # @attribute {Boolean} [clip=false]
    # If true, this view clips to its bounds
    ###
    ###*
    # @attribute {Boolean} [scrollable=false]
    # If true, this view clips to its bounds and provides scrolling to see content that overflows the bounds
    ###
    ###*
    # @attribute {Boolean} [visible=true]
    # If false, this view is invisible
    ###
    ###*
    # @attribute {String} bgcolor
    # Sets this view's background color
    ###
    ###*
    # @attribute {String} bordercolor
    # Sets this view's border color
    ###
    ###*
    # @attribute {String} borderstyle
    # Sets this view's border style (can be any css border-style value)
    ###
    ###*
    # @attribute {Number} border
    # Sets this view's border width
    ###
    ###*
    # @attribute {Number} padding
    # Sets this view's padding
    ###

    ###*
    # @event onclick
    # Fired when this view is clicked
    # @param {dr.view} view The dr.view that fired the event
    ###
    ###*
    # @event onmouseover
    # Fired when the mouse moves over this view
    # @param {dr.view} view The dr.view that fired the event
    ###
    ###*
    # @event onmouseout
    # Fired when the mouse moves off this view
    # @param {dr.view} view The dr.view that fired the event
    ###
    ###*
    # @event onmousedown
    # Fired when the mouse goes down on this view
    # @param {dr.view} view The dr.view that fired the event
    ###
    ###*
    # @event onmouseup
    # Fired when the mouse goes up on this view
    # @param {dr.view} view The dr.view that fired the event
    ###
    constructor: (el, attributes = {}) ->
      ###*
      # @property {dr.view[]} subviews
      # @readonly
      # An array of this views's child views
      ###
      ###*
      # @event onsubviews
      # Fired when this views's subviews array has changed
      # @param {dr.view} view The dr.view that fired the event
      ###
      ###*
      # @property {dr.layout[]} layouts
      # @readonly
      # An array of this views's layouts. Only defined when needed.
      ###
      ###*
      # @event onlayouts
      # Fired when this views's layouts array has changed
      # @param {dr.layout} view The dr.layout that fired the event
      ###
      ###*
      # @property {Boolean} ignorelayout
      # If true, layouts should ignore this view
      ###

      @subviews = []
      types = {
        x: 'number', y: 'number', width: 'number', height: 'number', 
        clickable: 'boolean', clip: 'boolean', scrollable: 'boolean', visible: 'boolean', 
        border: 'number', padding: 'number'
      }
      defaults = {
        x:0, y:0, width:0, height:0, 
        clickable:false, clip:false, scrollable:false, visible:true, 
        bordercolor:'transparent', borderstyle:'solid', border:0, 
        padding:0
      }

      for key, type of attributes.$types
        types[key] = type
      attributes.$types = types

      @_setDefaults(attributes, defaults)

      if (el instanceof View)
        el = el.sprite

      # console.log 'sprite tagname', attributes.$tagname
      @_createSprite(el, attributes)
      super
      # console.log 'new view', el, attributes, @

    _isPercent: (value) ->
      typeof value == 'string' && value.indexOf('%') > -1;

    _createSprite: (el, attributes) ->
      @sprite = new Sprite(el, @, attributes.$tagname)

    setAttribute: (name, value, skipstyle, skipConstraintSetup, skipconstraintunregistration) ->
      # catch percent constraints
      if (!skipConstraintSetup)
        switch name
          when 'width','x'
            if @__setupPercentConstraint(name, value, 'innerwidth') then return
          when 'height','y'
            if @__setupPercentConstraint(name, value, 'innerheight') then return
      
      value = @_coerceType(name, value)
      
      # Protect from invalid values
      switch name
        when 'width','height','border','padding'
          value = Math.max(0, value)
      
      if not (skipstyle or name of ignoredAttributes or name of hiddenAttributes or @[name] == value)
        # console.log 'setting style', name, value, @
        @sprite.setStyle(name, value)
      super(name, value, true, skipConstraintSetup, skipconstraintunregistration)
    
    __setupPercentConstraint: (name, value, axis) ->
      funcKey = '__percentFunc' + name
      oldFunc = @[funcKey]
      parent = @parent
      
      # Handle rootview case using dr.window
      if !(parent instanceof Node)
        parent = dr.window
        axis = axis.substring(5)
      
      if oldFunc
        @stopListening(parent, axis, oldFunc)
        delete @[funcKey]
      if @_isPercent(value)
        self = @
        scale = parseInt(value)/100
        func = @[funcKey] = () ->
          self.setAttribute(name, parent[axis] * scale, false, true)
        @listenTo(parent, axis, func)
        func.call()
        return true
    
    set_width: (width) ->
      @setAttribute('innerwidth', width - 2*(@border + @padding), true)
    
    set_height: (height) ->
      @setAttribute('innerheight', height - 2*(@border + @padding), true)
    
    set_border: (border) ->
      @__updateInnerMeasures(2*(border + @padding))
    
    set_padding: (padding) ->
      @__updateInnerMeasures(2*(@border + padding))
      
    __updateInnerMeasures: (inset) ->
      # Ensures innerwidth and innerheight will both be correct before 
      # oninnerwidth and oninnerheight fire. Needed by wrappinglayout.
      @innerwidth = @width - inset
      @innerheight = @height - inset
      
      @setAttribute('innerwidth', @width - inset, true)
      @setAttribute('innerheight', @height - inset, true)
    
    set_clickable: (clickable) ->
      @sprite.set_clickable(clickable)
      # super?(clickable)

    set_parent: (parent) ->
      # console.log 'view set_parent', parent, @
      super

      # store references subviews
      if parent instanceof View
        parent.subviews.push(@)
        parent.sendEvent('subviews', @)
        parent = parent.sprite

      @sprite.set_parent parent

    set_id: (id) ->
      super
      @sprite.set_id(id)

    ###*
    # Animates this view's attribute(s)
    # @param {Object} obj A hash of attribute names and values to animate to
    # @param Number duration The duration of the animation in milliseconds
    ###
    animate: ->
      # console.log 'animate', arguments, @sprite.animate
      @sprite.animate.apply(@, arguments)
      @

    set_clip: (clip) ->
      @sprite.set_clip(clip)

    set_scrollable: (scrollable) ->
      @sprite.set_scrollable(scrollable)

    ###*
    # Calls doSubviewAdded/doLayoutAdded if the added subnode is a view or
    # layout respectively. Subclasses should call super.
    ###
    doSubnodeAdded: (node) ->
      if node instanceof View
        ###*
        # @event subviewAdded
        # Fired when a subview is added to this view.
        # @param {dr.view} view The dr.view that was added
        ###
        @sendEvent('subviewAdded', node)
        @doSubviewAdded(node);
      else if node instanceof Layout
        ###*
        # @event layoutAdded
        # Fired when a layout is added to this view.
        # @param {dr.layout} layout The dr.layout that was added
        ###
        @sendEvent('layoutAdded', node)
        @doLayoutAdded(node);

    ###*
    # Calls doSubviewRemoved/doLayoutRemoved if the removed subnode is a view or
    # layout respectively. Subclasses should call super.
    ###
    doSubnodeRemoved: (node) ->
      if node instanceof View
        ###*
        # @event subviewRemoved
        # Fired when a subview is removed from this view.
        # @param {dr.view} view The dr.view that was removed
        ###
        @sendEvent('subviewRemoved', node)
        @doSubviewRemoved(node);
      else if node instanceof Layout
        ###*
        # @event layoutRemoved
        # Fired when a layout is removed from this view.
        # @param {dr.layout} layout The dr.layout that was removed
        ###
        @sendEvent('layoutRemoved', node)
        @doLayoutRemoved(node);

    ###*
    # Called when a subview is added to this view. Provides a hook for
    # subclasses. No need for subclasses to call super. Do not call this
    # method to add a subview. Instead call setParent.
    # @param {dr.view} sv The subview that was added.
    # @return {void}
    ###
    doSubviewAdded: (sv) ->
      # Empty implementation by default
    
    ###*
    # Called when a subview is removed from this view. Provides a hook for
    # subclasses. No need for subclasses to call super. Do not call this
    # method to remove a subview. Instead call _removeFromParent.
    # @param {dr.view} sv The subview that was removed.
    # @return {void}
    ###
    doSubviewRemoved: (sv) ->
      # Empty implementation by default

    ###*
    # Called when a layout is added to this view. Provides a hook for
    # subclasses. No need for subclasses to call super. Do not call this
    # method to add a layout. Instead call setParent.
    # @param {dr.layout} layout The layout that was added.
    # @return {void}
    ###
    doLayoutAdded: (layout) ->
      # Empty implementation by default
    
    ###*
    # Called when a layout is removed from this view. Provides a hook for
    # subclasses. No need for subclasses to call super. Do not call this
    # method to remove a layout. Instead call _removeFromParent.
    # @param {dr.layout} layout The layout that was removed.
    # @return {void}
    ###
    doLayoutRemoved: (layout) ->
      # Empty implementation by default

    destroy: (skipevents) ->
      # console.log 'destroy view', @
      super
      @_removeFromParent('subviews') unless skipevents

      @sprite.destroy()
      @sprite = null

    getAbsolute: () ->
      @sprite.getAbsolute()

    set_class: (classname) ->
      @sprite.set_class(classname)

  ###*
  # @class dr.inputtext {UI Components, Input}
  # @extends dr.view
  # Provides an editable input text field.
  #
  #     @example
  #     <spacedlayout axis="y"></spacedlayout>
  #
  #     <text text="Enter your name"></text>
  #
  #     <inputtext id="nameinput" bgcolor="white" border="1px solid lightgrey" width="200"></inputtext>
  #
  #     <labelbutton text="submit">
  #       <handler event="onclick">
  #         welcome.setAttribute('text', 'Welcome ' + nameinput.text);
  #       </handler>
  #     </labelbutton>
  #
  #     <text id="welcome"></text>
  #
  # It's possible to listen for an onchange event to find out when the user changed the inputtext value:
  #
  #     @example
  #     <inputtext id="nameinput" bgcolor="white" border="1px solid lightgrey" width="200" onchange="console.log('onchange', this.text)"></inputtext>
  #
  ###
  class InputText extends View
    ###*
    # @attribute {Boolean} [multiline=false]
    # Set to true to show multi-line text.
    ###
    ###*
    # @attribute {String} text
    # The text inside this input text field
    ###
    ###*
    # @attribute {Number} [width=100]
    # The width of this input text field
    ###
    constructor: (el, attributes = {}) ->
      types = {multiline: 'boolean'}
      defaults = {clickable:true, multiline:false, width: 100}
      for key, type of attributes.$types
        types[key] = type
      attributes.$types = types

      @_setDefaults(attributes, defaults)

      super

      @setAttribute('height', @_getDefaultHeight()) unless @height

      @listenTo(@, 'change', @_handleChange)

      @listenTo(@, 'innerwidth',
        (iw) ->
          @sprite.setStyle('width', iw, true, @sprite.input)
      )
      @sprite.setStyle('width', @innerwidth, true, @sprite.input)
      @listenTo(@, 'innerheight',
        (ih) ->
          @sprite.setStyle('height', ih, true, @sprite.input)
      )
      @sprite.setStyle('height', @innerheight, true, @sprite.input)
      
      # fixes spec/inputext_spec.rb 'can be clicked into' by forwarding user-generated click events
      # a click() without focus() wasn't enough... See http://stackoverflow.com/questions/210643/in-javascript-can-i-make-a-click-event-fire-programmatically-for-a-file-input
      @listenTo(@, 'click',
        () ->
          @sprite.input.focus()
      )

    _createSprite: (el, attributes) ->
      super
      attributes.text ||= @sprite.getText(true)
      @sprite.setText('')
      multiline = @_coerceType('multiline', attributes.multiline, 'boolean')
      @sprite.createInputtextElement('', multiline, attributes.width, attributes.height)

    _getDefaultHeight: () ->
      h = parseInt($(@sprite.input).css('height'))
      domElem = $(@sprite.el)
      borderH = parseInt(domElem.css('border-top-width')) + parseInt(domElem.css('border-bottom-width'))
      paddingH = parseInt(domElem.css('padding-top')) + parseInt(domElem.css('padding-bottom'))
      return h + borderH + paddingH
      
    _handleChange: () ->
      return unless @replicator
      # attempt to coerce to the current type if it was a boolean or number (bad idea?)
      newdata = @text
      if (typeof @data == 'number')
        if parseFloat(newdata) + '' == newdata
          newdata = parseFloat(newdata)
      else if (typeof @data == 'boolean')
        if newdata == 'true'
          newdata = true
        else if newdata == 'false'
          newdata = false
      @replicator.updateData(newdata)

    set_data: (d) ->
      @setAttribute('text', d, true)

    set_text: (text) ->
      @sprite.value(text)

  ###*
  # @class dr.text {UI Components}
  # @extends dr.view
  # Text component that supports single and multi-line text.
  #
  # The text component can be fixed size, or sized to fit the size of the text.
  #
  #     @example
  #     <text text="Hello World!" bgcolor="red"></text>
  #
  # Here is a multiline text
  #
  #     @example
  #     <text multiline="true" text="Lorem ipsum dolor sit amet, consectetur adipiscing elit"></text>
  #
  # You might want to set the value of a text element based on the value of other attributes via a constraint. Here we set the value by concatenating three attributes together.
  #
  #     @example
  #     <attribute name="firstName" type="string" value="Lumpy"></attribute>
  #     <attribute name="middleName" type="string" value="Space"></attribute>
  #     <attribute name="lastName" type="string" value="Princess"></attribute>
  #
  #     <text text="${this.parent.firstName + ' ' + this.parent.middleName + ' ' + this.parent.lastName}" color="hotpink"></text>
  #
  # Constraints can contain more complex JavaScript code
  #
  #     @example
  #     <attribute name="firstName" type="string" value="Lumpy"></attribute>
  #     <attribute name="middleName" type="string" value="Space"></attribute>
  #     <attribute name="lastName" type="string" value="Princess"></attribute>
  #
  #     <text text="${this.parent.firstName.charAt(0) + ' ' + this.parent.middleName.charAt(0) + ' ' + this.parent.lastName.charAt(0)}" color="hotpink"></text>
  #
  # We can simplify this by using a method to return the concatenation and constraining the text value to the return value of the method
  #
  #     @example
  #     <attribute name="firstName" type="string" value="Lumpy"></attribute>
  #     <attribute name="middleName" type="string" value="Space"></attribute>
  #     <attribute name="lastName" type="string" value="Princess"></attribute>
  #
  #     <method name="initials">
  #       return this.firstName.charAt(0) + ' ' + this.middleName.charAt(0) + ' ' + this.lastName.charAt(0);
  #     </method>
  #
  #     <text text="${this.parent.initials()}" color="hotpink"></text>
  #
  # You can override the format method to provide custom formatting for text elements. Here is a subclass of text, timetext, with the format method overridden to convert the text given in seconds into a formatted string.
  #
  #     @example
  #     <class name="timetext" extends="text">
  #       <method name="format" args="seconds">
  #         var minutes = Math.floor(seconds / 60);
  #         var seconds = Math.floor(seconds) - minutes * 60;
  #         if (seconds < 10) {
  #           seconds = '0' + seconds;
  #         }
  #         return minutes + ':' + seconds;
  #       </method>
  #     </class>
  #
  #     <timetext text="240"></timetext>
  #
  ###
  class Text extends View
    ###*
    # @attribute {Boolean} [multiline=false]
    # Set to true to show multi-line text.
    ###
    ###*
    # @attribute {Boolean} [resize=true]
    # By default, the text component is sized to the size of the text.
    # By setting resize=false, the component size is not modified
    # when the text changes.
    ###
    ###*
    # @attribute {String} [text=""]
    # Component text.
    ###
    constructor: (el, attributes = {}) ->
      types = {resize: 'boolean', multiline: 'boolean'}
      defaults = {resize:true, multiline:false}

      for key, type of attributes.$types
        types[key] = type
      attributes.$types = types

      @_setDefaults(attributes, defaults)

      if 'width' of attributes
        @_initialwidth = attributes.width

      @listenTo(@, 'multiline', @updateSize)
      @listenTo(@, 'resize', @updateSize)
      @listenTo(@, 'init', @updateSize)

      super

    _createSprite: (el, attributes) ->
      super
      attributes.text ||= @sprite.getText(true) #so the text attribute has value when the text is set between the tags
      @sprite.createTextElement()

    ###*
    # @method format
    # Format the text to be displayed. The default behavior is to
    # return the text intact. Override to change formatting.
    # @param {String} str The current value of the text component.
    # @return {String} The formated string to display in the component.
    #
    ###
    format: (str) ->
      return str

    updateSize: () ->
      return unless @inited
      width = if @multiline then @_initialwidth else @width
      size = @sprite.measureTextSize(@multiline, width, @resize)
      if size.width == 0 and size.height == 0
        # check for hidden parents
        parents = @_findParents('visible', false)
        for parent in parents
          parent.sprite.el.style.display = ''
        size = @sprite.measureTextSize(@multiline, width, @resize)
        for parent in parents
          parent.sprite.el.style.display = 'none'

      # console.log('updateSize', @multiline, width, @resize, size, @)
      @setAttribute 'width', size.width, true
      @setAttribute 'height', size.height, true

    set_data: (d) ->
      @setAttribute('text', d, true)

    set_text: (text) ->
      if (text != @text)
        @sprite.setText(@format(text))
        @updateSize()


  warnings = []
  showWarnings = (data) ->
    warnings = warnings.concat(data)
    out = data.join('\n')
    pre = document.createElement('pre')
    pre.setAttribute('class', 'warnings');
    pre.textContent = out
    document.body.insertBefore(pre, document.body.firstChild);
    console.error out


  dom = do ->
    getChildren = (el) ->
      child for child in el.childNodes when child.nodeType == 1 and child.localName in specialtags

    # flatten element.attributes to a hash
    flattenattributes = (namednodemap)  ->
      attributes = {}
      for i in namednodemap
        attributes[i.name] = i.value
      attributes

    sendInit = () ->
      # Create the event.
      event = document.createEvent('Event');
      event.initEvent('dreeminit', true, true);
      window.dispatchEvent(event);

    # initialize a top-level view element
    initFromElement = (el) ->
      el.style.display = 'none'
      findAutoIncludes(el, () ->
        el.style.display = null
        initElement(el)
        # register constraints last
        _initConstraints()
        window.DREEM_INITED = true;
        sendInit()
      )

    findAutoIncludes = (parentel, finalcallback) ->
      jqel = $(parentel)

      includedScripts = {}
      loadqueue = []
      scriptloading = false
      loadScript = (url, cb, error) ->
        return if url of includedScripts
        includedScripts[url] = true

        if (scriptloading)
          loadqueue.push(url, error)
          return url

        appendScript = (url, cb, error='failed to load scriptinclude ' + url) ->
          # console.log('loading script', url)
          scriptloading = url
          script = document.createElement('script')
          script.type = 'text/javascript'
          $('head').append(script)
          script.onload = cb
          script.onerror = (err) ->
            console.error(error, err)
            cb()
          script.src = url

        appendcallback = () ->
          # console.log('loaded script', scriptloading, loadqueue.length, includedScripts[url])
          scriptloading = false
          if loadqueue.length == 0
            # console.log('done, calling callback', cb)
            cb()
          else
            appendScript(loadqueue.shift(), appendcallback, loadqueue.shift())

        appendScript(url, appendcallback, error)

      # classes declared inline with the class tag
      inlineclasses = {}
      # current list of jquery promises for outstanding requests
      filerequests = []
      # hash of files and classes loaded already
      fileloaded = {}

      loadInclude = (url, el) ->
        return if url of fileloaded
        fileloaded[url] = el
        # console.log "Loading #{url}", el
        prom = $.get(url)
        prom.url = url
        prom.el = el
        filerequests.push(prom)

      findMissingClasses = (names={}) ->
        # look for class declarations and unloaded classes for tags
        for el in jqel.find('*')
          name = el.localName
          if name == 'class'
            if el.attributes.extends
              # load load class extends
              names[el.attributes.extends.value] = el
            # track inline class declaration so we don't attempt to load it later
            inlineclasses[el.attributes.name?.value] = true
          else if name == 'replicator'
            # load class instance for tag
            names[name] = el
            # load classname instance as well
            names[el.attributes.classname.value] = el
          else
            # don't autoload elements found inside specialtags, e.g. setter
            unless el.parentNode.localName in specialtags
              # load class instance for tag
              names[name] = el 

        # filter out classnames that may have already been loaded or should otherwise be ignored
        out = {}
        for name, el of names
          unless name of dr or name of fileloaded or name in specialtags or name of inlineclasses or name in builtinTags
            out[name] = el
        out

      findIncludeURLs = (urls={}) ->
        for el in jqel.find('include')
          url = el.attributes.href.value
          el.parentNode.removeChild(el)
          urls[url] = el
          # console.log('found include', url)
        urls

      loadIncludes = (callback) ->
        # load includes
        for url, el of findIncludeURLs()
          # console.log 'include url', url
          loadInclude(url, el)

        # wait for all includes to load
        $.when.apply($, filerequests).done((args...) ->
          # append includes
          args = [args] if (filerequests.length == 1)
          filerequests = []
          # console.log('loaded includes', args)

          includeRE = /<[\/]*library>/gi
          for xhr in args
            # remove any library tags found
            html = xhr[0].replace(includeRE, '')
            # console.log 'inserting include', html
            jqel.prepend(html)

          # load missing classes
          for name, el of findMissingClasses()
            fileloaded[name] = true
            loadInclude("/classes/#{name}.dre", el)
            # console.log 'loading dre', name, url, el

          # console.log(filerequests, fileloaded, inlineclasses)
          # wait for all dre files to finish loading
          $.when.apply($, filerequests).done((args...) ->
            args = [args] if (filerequests.length == 1)
            filerequests = []

            for xhr in args
              # console.log 'inserting html', args, xhr[0]
              jqel.prepend(xhr[0])
              if debug
                jqel.contents().each(() ->
                  if(this.nodeType == 8)
                    $(this).remove()
                )

            includes = findMissingClasses(findIncludeURLs())
            if Object.keys(includes).length > 0
              # console.warn("missing includes", includes)
              loadIncludes(callback)
              return;

            # find class script includes and load them in lexical order

            # initialize ONE integration
            oneurl = '/lib/one_base.js'
            $.ajax({
              dataType: "script",
              cache: true,
              url: oneurl
            }).done(() ->
              # init one_base
              ONE.base_.call(Eventable::)
              # hide builtin keys from learn()
              Eventable::enumfalse(Eventable::keys())
              Node::enumfalse(Node::keys())
              View::enumfalse(View::keys())
              Layout::enumfalse(Layout::keys())

              # load scriptincludes
              scriptloaded = false
              for el in jqel.find('[scriptincludes]')
                for url in el.attributes.scriptincludes.value.split(',')
                  scriptloaded = loadScript(url.trim(), callback, el.attributes.scriptincludeserror?.value.toString())
              callback() unless scriptloaded
            ).fail(() ->
              console.warn("failed to load #{oneurl}")
            )
          ).fail((args...) ->
            args = [args] if (args.length == 1)
            for xhr in args
              showWarnings(["failed to load #{xhr.url} for element #{xhr.el.outerHTML}"])
            return
          )
        ).fail((args...) ->
          args = [args] if (args.length == 1)
          for xhr in args
            showWarnings(["failed to load #{xhr.url} for element #{xhr.el.outerHTML}"])
          return
        )

      filereloader = ->
        # console.log('listen for changes watching')
        $.ajax({
          url: '/watchfile/',
          datatype: 'text',
          data: {url: window.location.pathname},
          success: (data) ->
            # console.log('got data...', data)
            if data == window.location.pathname
              # alert('reload')
              window.location.reload()
        }).done((data) ->
          # console.log('file reloaded', data)
          filereloader()
        );

      validator = ->
        $.ajax({
          url: '/validate/',
          data: {url: window.location.pathname},
          success: (data) ->
            # we have a teem server!
            showWarnings(data) if (data.length)
            filereloader()
          error: (err) ->
            console.warn('Validation requires the Teem server')
        }).always(finalcallback)

      # call the validator after everything loads
      loadIncludes(if test then finalcallback else validator)

    specialtags = ['handler', 'method', 'attribute', 'setter', 'include']
    # tags built into the browser that should be ignored, from http://www.w3.org/TR/html-markup/elements.html
    builtinTags = ['a', 'abbr', 'address', 'area', 'article', 'aside', 'audio', 'b', 'base', 'bdi', 'bdo', 'blockquote', 'body', 'br', 'button', 'canvas', 'caption', 'cite', 'code', 'col', 'colgroup', 'command', 'datalist', 'dd', 'del', 'details', 'dfn', 'div', 'dl', 'dt', 'em', 'embed', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'head', 'header', 'hgroup', 'hr', 'html', 'i', 'iframe', 'img', 'image', 'input', 'ins', 'kbd', 'keygen', 'label', 'legend', 'li', 'link', 'map', 'mark', 'menu', 'meta', 'meter', 'nav', 'noscript', 'object', 'ol', 'optgroup', 'option', 'output', 'p', 'param', 'pre', 'progress', 'q', 'rp', 'rt', 'ruby', 's', 'samp', 'script', 'section', 'select', 'small', 'source', 'span', 'strong', 'style', 'sub', 'summary', 'sup', 'table', 'tbody', 'td', 'textarea', 'tfoot', 'th', 'thead', 'time', 'title', 'tr', 'track', 'u', 'ul', 'var', 'video', 'wbr']
    # found by running './bin/builddocs' followed by 'node ./bin/findrequired.js'
    requiredAttributes = {"class":{"name":1},"method":{"name":1},"setter":{"name":1},"handler":{"event":1},"attribute":{"name":1,"type":1,"value":1},"dataset":{"name":1},"replicator":{"classname":1}}

    checkRequiredAttributes = (tagname, attributes, tag, parenttag) ->
      if tagname of requiredAttributes
        # console.log('requiredAttributes', tagname)
        for attrname of requiredAttributes[tagname]
          # console.log('checking attribute', tagname, attrname)
          unless attrname of attributes
            error = "#{tagname}.#{attrname} must be defined on #{tag.outerHTML}"
            error = error + " inside #{parenttag.outerHTML}" if parenttag
            showWarnings([error])
            # throw new Error(error)
      error

    # recursively init classes based on an existing element
    initElement = (el, parent) ->
      # don't init the same element twice
      return if el.$init
      el.$init = true

      tagname = el.localName
      return if tagname in specialtags

      if not tagname of dr
        console.warn 'could not find class for tag', tagname, el unless tagname in builtinTags
        return
      else if tagname in builtinTags
        console.warn 'refusing to create a class that would overwrite the builtin tag', tagname unless tagname is 'input'
        return

      attributes = flattenattributes(el.attributes)

      checkRequiredAttributes(tagname, attributes, el)

      attributes.$tagname = tagname

      # swallow builtin mouse attributes to allow event delegation, set clickable if an event is found
      for event in mouseEvents
        eventname = 'on' + event
        if eventname of attributes
          attributes.clickable = true unless attributes.clickable == false
          el.removeAttribute(eventname)

      # swallow event handler attributes to allow event delegation, e.g. <inputtext onchange="..."></inputtext>
      for attr of attributes
        if attr.indexOf('on') == 0
          el.removeAttribute(attr)

      parent ?= el.parentNode
      attributes.parent = parent if parent?
      # console.log 'parent for tag', tagname, attributes, parent

      li = tagname.lastIndexOf('state')
      isState = li > -1 && li == tagname.length - 5
      isClass = tagname is 'class'

      unless isClass or isState
        dom.processSpecialTags(el, attributes, attributes.type)

      # Defer oninit if we have children
      children = (child for child in el.childNodes when child.nodeType == 1)
      attributes.$skiponinit = skiponinit = children.length > 0

      if typeof dr[tagname] is 'function'
        parent = new dr[tagname](el, attributes)
      else
        showWarnings(["Unrecognized class #{tagname} #{el.outerHTML}"])
        return

      return unless children.length > 0

      unless isClass or isState
#        grab children again in case any were added when the parent was instantiated
        children = (child for child in el.childNodes when child.nodeType == 1)
        # create children now
        for child in children
          # console.log 'initting class child', child.localName
          initElement(child, parent)

        unless parent.inited
          # console.log('skiponinit', parent, parent.subnodes.length)
          checkChildren = ->
            for child in children
              if not child.inited and child.localName is not 'class'
                # console.log 'child not initted', child, parent
                setTimeout(checkChildren, 0)
                return
            # console.log('doinit', parent)
            parent.inited = true
            parent.sendEvent('init', parent)
            return
          setTimeout(checkChildren, 0)

      return


    # write default CSS to the DOM
    writeCSS = ->
      style = document.createElement('style')
      style.type = 'text/css'
      style.innerHTML = '.sprite{ position: absolute; pointer-events: none; padding: 0; margin: 0; box-sizing:border-box;} .sprite-text{ width: auto; height; auto; white-space: nowrap;  padding: 0; margin: 0;} .sprite-inputtext{border: none; outline: none; background-color:transparent; resize:none;} .hidden{ display: none; } .noselect{ -webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;} method { display: none; } handler { display: none; } setter { display: none; } class { display:none } node { display:none } dataset { display:none } .warnings {font-size: 14px; background-color: pink; margin: 0;}'
      document.getElementsByTagName('head')[0].appendChild(style)

    # init top-level views in the DOM recursively
    initAllElements = (selector = $('view').not('view view')) ->
      for el in selector
        initFromElement(el)
      return

    # http://stackoverflow.com/questions/1248849/converting-sanitised-html-back-to-displayable-html
    htmlDecode = (input) ->
      # return if not input
      e = document.createElement('div')
      e.innerHTML = input
      out = ''
      for child in e.childNodes
        if child.nodeValue? and (child.nodeType == 3 or child.nodeType == 8)
          out += child.nodeValue
          # console.log('child', child.nodeType, child)
          # console.log('out', out)
        else
          # console.log('invalid child', child, child.nodeType, child.nodeValue)
          return
      out

    # process handlers, methods, setters and attributes
    processSpecialTags = (el, classattributes, defaulttype) ->
      classattributes.$types ?= {}
      classattributes.$methods ?= {}
      classattributes.$handlers ?= []
      children = getChildren(el)
      for child in children
        attributes = flattenattributes(child.attributes)
        # console.log child, attributes, classattributes
        tagname = child.localName
        args = (attributes.args ? '').split()
        script = htmlDecode(child.innerHTML)
        unless script?
          console.warn 'Invalid tag', name, child

        type = attributes.type ? defaulttype
        name = attributes.name

        checkRequiredAttributes(tagname, attributes, child, el)

        switch tagname
          when 'handler'
            # console.log 'adding handler', name, script, child.innerHTML, attributes
            handler =
              name: name
              ev: attributes.event
              script: compiler.transform(script, type)
              args: args
              reference: attributes.reference
              method: attributes.method

            classattributes.$handlers.push(handler)
            # console.log 'added handler', name, script, attributes
          when 'method'
            classattributes.$methods[name] ?= []
            classattributes.$methods[name].push({method: compiler.transform(script, type), args: args, allocation: attributes.allocation, invokeSuper: attributes.invokesuper})
            # console.log 'added method', name, script, classattributes, classattributes.$methods[name]
          when 'setter'
            name = name.toLowerCase()
            classattributes.$methods['set_' + name] ?= []
            classattributes.$methods['set_' + name].push({method: compiler.transform(script, type), args: args, allocation: attributes.allocation, invokeSuper: attributes.invokesuper})
            # console.log 'added setter', 'set_' + name, args, classattributes.$methods
          when 'attribute'
            name = name.toLowerCase()
            classattributes[name] = attributes.value
            classattributes.$types[name] = attributes.type
            if 'visual' of attributes 
              # allow non-visual attributes to be added
              hiddenAttributes[name] = attributes.visual == 'false'
            # console.log 'added attribute', attributes, classattributes

      # console.log('processSpecialTags', classattributes)
      return children

    exports =
      initAllElements: initAllElements
      initElement: initElement
      processSpecialTags: processSpecialTags
      writeCSS: writeCSS

    ###*
  # @class dr.state {Core Dreem}
  # @extends dr.node
  # Allows a group of attributes, methods, handlers and instances to be removed and applied as a group.
  # 
  # Like views and nodes, states can contain methods, handlers, setters, constraints, attributes and other view, node or class instances.
  #
  # Currently, states must end with the string 'state' in their name to work properly.
  #
  #     @example
  #     <spacedlayout axis="y"></spacedlayout>
  #     <view id="square" width="100" height="100" bgcolor="lightgrey">
  #       <attribute name="ispink" type="boolean" value="false"></attribute>
  #       <state name="pinkstate" applied="${this.parent.ispink}">
  #         <attribute name="bgcolor" value="pink" type="string"></attribute>
  #       </state>
  #     </view>
  #     <labelbutton text="pinkify!">
  #       <handler event="onclick">
  #         square.setAttribute('ispink', true);
  #       </handler>
  #     </labelbutton>
  #
  ###
  class State extends Node
    constructor: (el, attributes = {}) ->
      @skipattributes = ['parent', 'types', 'applyattributes', 'applied', 'skipattributes', 'stateattributes']
      @stateattributes = attributes
      @applyattributes = {}
      @applied = false

      compilertype = attributes.type
      # collapse children into attributes
      processedChildren = dom.processSpecialTags(el, attributes, compilertype)

      # console.log('compiled state', attributes, @)

      # cache the old contents to preserve appearance
      oldbody = el.innerHTML.trim()

      for child in processedChildren
        child.parentNode.removeChild(child)

      # serialize the tag's contents for recreation with processedChildren removed
      instancebody = el.innerHTML.trim()

      # restore old contents
      el.innerHTML = oldbody if (oldbody)

      @types = attributes.$types ? {}

      @setAttribute('parent', attributes.parent)

      # Install methods in the state with the run scope set to the parent
      # These will be applied to the parent by ONE with learn()
      @installMethods(attributes.$methods, @parent.$tagname, @, @parent)

      if attributes.name
        @setAttribute('name', attributes.name) 
        @skipattributes.push('name') 

      # handle applied constraint bindings as local to the state
      if attributes.applied
        @bindAttribute('applied', attributes.applied, 'state')

      for handler in attributes.$handlers
        if handler.ev == 'onapplied'
          # console.log('found onapplied', handler) 
          @installHandlers([handler], 'state', @)
          @_bindHandlers()

      for name, value of attributes
        unless name in @skipattributes or name.charAt(0) == '$'
          @applyattributes[name] = value 
          @setAttribute(name, value)
      # console.log('applyattributes', @applyattributes)

      if @constraints
        @_bindConstraints()
        # prevent warnings if we have a constraint to @applied
        @skipattributes.push('constraints') 

      if @events
        # prevent warnings for local events
        @skipattributes.push('events') 

      if @handlers
        # prevent warnings for local handlers
        @skipattributes.push('handlers') 

      if @latehandlers
        # prevent warnings for local handlers
        @skipattributes.push('latehandlers') 

      # hide local properties we don't want applied to the parent by learn()
      @enumfalse(@skipattributes)
      @enumfalse(@keys)
 
    ###*
    # @event onapplied 
    # Fired when the state has been applied or unapplied. Onapplied handlers run in the scope of the state itself, see dragstate for an example.
    # @param {Boolean} applied If true, the state was applied.
    ###
    ###*
    # @attribute {Boolean} [applied=false]
    # If true, the state is applied.
    ###
    set_applied: (applied) ->
      return unless @parent
      return if @applied == applied
      @applied = applied

      # console.log('set_applied', applied, @, @parent)
      if applied
        @parent.learn @
        if @stateattributes.$handlers
          # console.log('installing handlers', @stateattributes.$handlers)
          @parent.installHandlers(@stateattributes.$handlers, @parent.$tagname, @parent)
          @parent._bindHandlers()
          @parent._bindHandlers(true)
      else
        @parent.forget @
        if @stateattributes.$handlers
          # console.log('removing handlers', @stateattributes.$handlers)
          @parent.removeHandlers(@stateattributes.$handlers, @parent.$tagname, @parent)

      parentname = @parent.$tagname
      # Hack to set attributes for now - not needed when using signals
      for name of @applyattributes
        val = @parent[name]
        continue if val == undefined
        # learn/forget will have set the value already. Invert to cache bust setAttribute()
        @parent[name] = !val
        # console.log('bindAttribute', name, val)
        @parent.bindAttribute(name, val, parentname)
      return
      
    apply: () ->
      @setAttribute('applied', true) unless @applied

    remove: () ->
      @setAttribute('applied', false) if @applied


  ###*
  # @class dr.class {Core Dreem}
  # Allows new tags to be created. Classes only be created with the &lt;class>&lt;/class> tag syntax. 
  # 
  # Classes can extend any other class, and they extend dr.view by default. 
  # 
  # Once declared, classes invoked with the declarative syntax, e.g. &lt;classname>&lt;/classname>.
  # 
  # If a class can't be found in the document, dreem will automatically attempt to load it from the classes/* directory.
  #
  # Like views and nodes, classes can contain methods, handlers, setters, constraints, attributes and other view, node or class instances.
  #
  # Here is a class called 'tile' that extends dr.view. It sets the bgcolor, width, and height attributes. An instance of tile is created using declarative syntax.
  #
  #     @example
  #     <class name="tile" extends="view" bgcolor="thistle" width="100" height="100"></class>
  #
  #     <tile></tile>
  #
  # Now we'll extend the tile class with a class called 'labeltile', which contains a label inside of the box. We'll declare one each of tile and labeltile, and position them with a spacedlayout.
  #
  #     @example
  #     <class name="tile" extends="view" bgcolor="thistle" width="100" height="100"></class>
  #
  #     <class name="labeltile" extends="tile">
  #       <text text="Tile"></text>
  #     </class>
  #
  #     <spacedlayout></spacedlayout>
  #     <tile></tile>
  #     <labeltile></labeltile>
  #
  # Attributes that are declared inside of a class definition can be set when the instance is declared. Here we bind the label text to the value of an attribute called label.
  #
  #     @example
  #     <class name="tile" extends="view" bgcolor="thistle" width="100" height="100"></class>
  #
  #     <class name="labeltile" extends="tile">
  #       <attribute name="label" type="string" value=""></attribute>
  #       <text text="${this.parent.label}"></text>
  #     </class>
  #
  #     <spacedlayout></spacedlayout>
  #     <tile></tile>
  #     <labeltile label="The Tile"></labeltile>
  #
  ###
  class Class
    ###*
    # @attribute {String} name (required)
    # The name of the new tag. 
    ###
    ###*
    # @attribute {String} [extends=view] 
    # The name of a class that should be extended.
    ###
    ###*
    # @attribute {"js"/"coffee"} [type=js] 
    # The default compiler to use for methods, setters and handlers. Either 'js' or 'coffee'
    ###
    clone = (obj) ->
      newobj = {}
      for name, val of obj
        newobj[name] = val 
      newobj

    constructor: (el, classattributes = {}) ->
      name = (if classattributes.name then classattributes.name.toLowerCase() else classattributes.name)
      extend = classattributes.extends ?= 'view'
      compilertype = classattributes.type
      # only class instances should specify these
      for ignored of ignoredAttributes
        delete classattributes[ignored]

      # collapse children into attributes
      processedChildren = dom.processSpecialTags(el, classattributes, compilertype)

      # console.log('compiled class', name, extend, classattributes)

      # cache the old contents to preserve appearance
      oldbody = el.innerHTML.trim()

      for child in processedChildren
        child.parentNode.removeChild(child)
      haschildren = (child for child in el.childNodes when child.nodeType == 1).length > 0

      # serialize the tag's contents for recreation with processedChildren removed
      instancebody = el.innerHTML.trim()

      # restore old contents
      el.innerHTML = oldbody if (oldbody)

      # console.log('new class', name, classattributes)
      console.warn 'overwriting class', name if name of dr

      # class instance constructor
      dr[name] = (instanceel, instanceattributes) ->
        # override class attributes with instance attributes
        attributes = clone(classattributes)
        for key, value of instanceattributes
          # console.log 'overriding class attribute', key, value
          if (key is '$methods' or key is '$types') and key of attributes
            attributes[key] = clone(attributes[key])
            # console.log('overwriting', key, attributes[key], value)
            for propname, val of value
              if key is '$methods' and attributes[key][propname]
                attributes[key][propname] = attributes[key][propname].concat(val)
                # console.log('method override found for', propname, attributes[key][propname])
              else 
                attributes[key][propname] = val
              # console.log 'overwrote class attribute', key, attributes[key], value
          else if key is '$handlers' and key of attributes
            # console.log 'concat', attributes[key], value
            attributes[key] = attributes[key].concat(value)
            # console.log 'after concat', attributes[key]
          else 
            attributes[key] = value

        if not (extend of dr)
          console.warn 'could not find class for tag', extend
          return

        # tagname would be 'class' in this case, replace with the right one!
        # also, don't overwrite if it's already set, since we are invoking dr[extend]
        if attributes.$tagname is 'class' or not attributes.$tagname
          attributes.$tagname = name

        # skip Node.oninit event
        attributes.$skiponinit = true
        # defer bindings until after children are created
        attributes.$deferbindings = haschildren

        # console.log 'creating class instance', name, attributes.$tagname, instanceel, extend, attributes
        parent = new dr[extend](instanceel, attributes)
        # console.log 'created class instance', name, extend, parent

        viewel = parent.sprite?.el

        if instanceel
          # hide contents of invisible nodes
          instanceel.setAttribute('class', 'hidden') unless viewel

        # unpack instance children
        if instancebody and viewel
          if viewel.innerHTML
            # Append class children on instances instead of replacing them
            viewel.innerHTML = instancebody + viewel.innerHTML
            # console.log 'instancebody', instancebody, viewel.innerHTML, viewel
          else
            # console.log 'normal'
            viewel.innerHTML = instancebody

          children = (child for child in viewel.childNodes when child.nodeType == 1)
          for child in children
            # console.log 'creating class child in parent', child, parent
            dom.initElement(child, parent)

        sendInit = () ->
          return if parent.inited
          parent._bindHandlers()
          parent._bindHandlers(true)
          parent.inited = true
          parent.sendEvent('init', parent)

        if children?.length
          # console.log 'delaying init', parent, children
          checkChildren = ->
            for child in children
              if not child.inited and child.localName is not 'class'
                # console.log 'child not initted', child, parent
                setTimeout(checkChildren, 0)
                return
            # console.log('class doinit', parent)
            sendInit()
          setTimeout(checkChildren, 0)
        else
          # console.log 'class init', parent
          sendInit()
        return parent

  ###*
  # @class dr.layout {Layout}
  # @extends dr.node
  # The base class for all layouts. 
  #
  # When a new layout is added, it will automatically create and add itself to a layouts array in its parent. In addition, an onlayouts event is fired in the parent when the layouts array changes. This allows the parent to access the layout(s) later.
  #
  # Here is a view that contains both a spacedlayout and a shrinktofit.
  #
  #     @example
  #     <spacedlayout axis="y"></spacedlayout>
  #     <view bgcolor="oldlace">
  #       <shrinktofit axis="both"></shrinktofit>
  #
  #       <spacedlayout></spacedlayout>
  #
  #       <view width="50" height="50" bgcolor="lightpink" opacity=".3"></view>
  #       <view width="50" height="50" bgcolor="plum" opacity=".3"></view>
  #       <view width="50" height="50" bgcolor="lightblue" opacity=".3"></view>
  #
  #       <handler event="onlayouts" args="layouts">
  #         output.setAttribute('text', output.text||'' + "New layout added: " + layouts[layouts.length-1].$tagname + "\n");
  #       </handler>
  #     </view>
  #
  #     <text id="output" multiline="true" width="300"></text>
  #
  #
  ###
  class Layout extends Node
    constructor: (el, attributes = {}) ->
      @locked = true
      @subviews = []
      
      super
      
      # listen for changes in the parent
      @listenTo(@parent, 'subviewAdded', @addSubview.bind(@))
      @listenTo(@parent, 'subviewRemoved', @removeSubview.bind(@))
      @listenTo(@parent, 'init', @update)
      
      # Store ourself in the parent layouts
      @parent.layouts ?= []
      @parent.layouts.push(@)
      
      # Start monitoring existing subviews
      subviews = @parent.subviews
      if subviews
        for subview in subviews
          @addSubview(subview)
      
      @locked = false
      
      @update()
    
    destroy: (skipevents) ->
      @locked = true
      # console.log 'destroy layout', @
      super
      @_removeFromParent('layouts') unless skipevents
    
    ###*
    # Adds the provided view to the subviews array of this layout.
    # @param {dr.view} view The view to add to this layout.
    # @return {void}
    ###
    addSubview: (view) ->
      if @ignore(view)
        return
      
      @subviews.push(view)
      @startMonitoringSubview(view)
      if !@locked
        @update()
    
    ###*
    # Removes the provided View from the subviews array of this Layout.
    # @param {dr.view} view The view to remove from this layout.
    # @return {number} the index of the removed subview or -1 if not removed.
    ###
    removeSubview: (view) ->
      if @ignore(view)
        return -1
      
      idx = @subviews.indexOf(view)
      if idx != -1
        @stopMonitoringSubview(view)
        @subviews.splice(idx, 1)
        if !@locked
          @update()
      return idx
    
    ###*
    # Checks if a subview can be added to this Layout or not. The default 
    # implementation returns the 'ignorelayout' attributes of the subview.
    # @param {dr.view} view The view to check.
    # @return {boolean} True means the subview will be skipped, false otherwise.
    ###
    ignore: (view) ->
      return view.ignorelayout
    
    ###*
    # Subclasses should implement this method to start listening to
    # events from the subview that should trigger the update method.
    # @param {dr.view} view The view to start monitoring for changes.
    # @return {void}
    ###
    startMonitoringSubview: (view) ->
      # Empty implementation by default
    
    ###*
    # Calls startMonitoringSubview for all views. Used by layout 
    # implementations when a change occurs to the layout that requires
    # refreshing all the subview monitoring.
    # @return {void}
    ###
    startMonitoringAllSubviews: ->
      svs = @subviews
      i = svs.length
      while (i)
        @startMonitoringSubview(svs[--i])
    
    ###*
    # Subclasses should implement this method to stop listening to
    # events from the subview that would trigger the update method. This
    # should remove all listeners that were setup in startMonitoringSubview.
    # @param {dr.view} view The view to stop monitoring for changes.
    # @return {void}
    ###
    stopMonitoringSubview: (view) ->
      # Empty implementation by default
    
    ###*
    # Calls stopMonitoringSubview for all views. Used by Layout 
    # implementations when a change occurs to the layout that requires
    # refreshing all the subview monitoring.
    # @return {void}
    ###
    stopMonitoringAllSubviews: ->
      svs = @subviews
      i = svs.length
      while (i)
        @stopMonitoringSubview(svs[--i])
    
    ###*
    # Checks if the layout is locked or not. Should be called by the
    # "update" method of each layout to check if it is OK to do the update.
    # @return {boolean} true if not locked, false otherwise.
    ###
    canUpdate: ->
      return !@locked and @parent.inited
    
    ###*
    # Updates the layout. Subclasses should call canUpdate to check lock state
    # before doing anything.
    # @return {void}
    ###
    update: ->
      # Empty implementation by default

  idle = do ->
    requestAnimationFrame = (()->
      return  window.requestAnimationFrame       or
              window.webkitRequestAnimationFrame or
              window.mozRequestAnimationFrame    or
              window.oRequestAnimationFrame      or
              window.msRequestAnimationFrame     or
              (callback, element) ->
                window.setTimeout(callback, 1000 / 60);
    )();

    ticking = false
    tickEvents = []

    doTick = (time) ->
      for key of tickEvents
        if tickEvents[key] 
          # console.log('tick', key, tickEvents[key])
          tickEvents[key](time)
          tickEvents[key] = null
      ticking = false

    (key, callback) ->
      # console.log('idle', key, callback)
      # console.log('hit', key) if (tickEvents[key] != null) 
      if !ticking
        requestAnimationFrame(doTick)
      ticking = true
      tickEvents[key] = callback


  class StartEventable extends Eventable
    bind: (ev, callback) ->
      super
      if @startEventTest()
        @startEvent()

    unbind: (ev, callback) ->
      super
      if not @startEventTest()
        @stopEvent()

    startEvent: (event) =>
      return if @eventStarted
      @eventStarted = true
      # console.log 'start'

    stopEvent: (event) =>
      return if not @eventStarted
      @eventStarted = false
      # console.log 'stop'

  ###*
  # @class dr.idle {Util}
  # @extends Eventable
  # Sends onidle events when the application is active and idle.
  #
  #     @example
  #     <handler event="onidle" reference="dr.idle" args="idleStatus">
  #       milis.setAttribute('text', idleStatus);
  #     </handler>
  #
  #     <spacedlayout></spacedlayout>
  #     <text text="Miliseconds since app started: "></text>
  #     <text id="milis"></text>
  ###
  class Idle extends StartEventable
    startEventTest: () ->
      start = @events['idle']?.length
      if start
        # console.log 'startEventTest', start, @sender
        # @sender()

        return start

    startEvent: (event) =>
      super
      idle(1, @sender)

    sender: (time) =>
      ###*
      # @event onidle 
      # Fired when the application is active and idle.
      # @param {Number} time The number of milliseconds since the application started
      ###
      @sendEvent('idle', time)
      # console.log('sender', time, @eventStarted, idle)
      setTimeout(() =>
        idle(1, @sender)
      ,0)


  # singleton that listens for mouse events. Holds data about the most recent left and top mouse coordinates
  mouseEvents = ['click', 'mouseover', 'mouseout', 'mousedown', 'mouseup']

  ###*
  # @class dr.mouse {Input}
  # @extends Eventable
  # Sends mouse events. Often used to listen to onmouseover/x/y events to follow the mouse position.
  #
  # Here we attach events handlers to the onx and ony events of dr.mouse, and set the x,y coordinates of a square view so it follows the mouse.
  #
  #     @example
  #     <view id="mousetracker" width="20" height="20" bgcolor="MediumTurquoise"></view>
  #
  #     <handler event="onx" args="x" reference="dr.mouse">
  #       mousetracker.setAttribute('x', x);
  #     </handler>
  #
  #     <handler event="ony" args="y" reference="dr.mouse">
  #       mousetracker.setAttribute('y', y);
  #     </handler>
  #
  #
  ###
  class Mouse extends StartEventable

    ###*
    # @event onclick 
    # Fired when the mouse is clicked
    # @param {dr.view} view The dr.view that fired the event
    ###
    ###*
    # @event onmouseover 
    # Fired when the mouse moves over a view
    # @param {dr.view} view The dr.view that fired the event
    ###
    ###*
    # @event onmouseout 
    # Fired when the mouse moves off a view
    # @param {dr.view} view The dr.view that fired the event
    ###
    ###*
    # @event onmousedown 
    # Fired when the mouse goes down on a view
    # @param {dr.view} view The dr.view that fired the event
    ###
    ###*
    # @event onmouseup 
    # Fired when the mouse goes up on a view
    # @param {dr.view} view The dr.view that fired the event
    ###
    constructor: ->
      @x = 0
      @y = 0
      @docSelector = $(document)
      @docSelector.on(mouseEvents.join(' '), @handle)
      @docSelector.on("mousemove", @handle).one("mouseout", @stopEvent)

      if capabilities.touch
        document.addEventListener('touchstart', @touchHandler, true)
        document.addEventListener('touchmove', @touchHandler, true)
        document.addEventListener('touchend', @touchHandler, true)
        document.addEventListener('touchcancel', @touchHandler, true)

    skipEvent = (e) ->
      if e.stopPropagation
        e.stopPropagation()
      if e.preventDefault  
        e.preventDefault()
      e.cancelBubble = true
      e.returnValue = false
      return false;

    startEventTest: () ->
      @events['mousemove']?.length or @events['x']?.length or @events['y']?.length

    sendMouseEvent: (type, first) ->
      simulatedEvent = document.createEvent('MouseEvent')
      simulatedEvent.initMouseEvent(type, true, true, window, 1,
                                first.pageX, first.pageY,
                                first.clientX, first.clientY, false,
                                false, false, false, 0, null)
      first.target.dispatchEvent(simulatedEvent)
      if first.target.$view
        skipEvent(event) unless first.target.$view instanceof InputText

    lastTouchDown = null
    lastTouchOver = null
    touchHandler: (event) =>
      touches = event.changedTouches
      first = touches[0]

      switch event.type
        when 'touchstart'
          @sendMouseEvent('mouseover', first)
          @sendMouseEvent('mousedown', first)
          lastTouchDown = first.target
        when 'touchmove'
          # console.log 'touchmove', event.touches, first, window.pageXOffset, window.pageYOffset, first.pageX, first.pageY, first.target
          over = document.elementFromPoint(first.pageX - window.pageXOffset, first.pageY - window.pageYOffset);
          if (over and over.$view)
            if (lastTouchOver and lastTouchOver != over)
              @handle({target: lastTouchOver, type: 'mouseout'}) 
            lastTouchOver = over
            @handle({target: over, type: 'mouseover'})
            # console.log 'over', over, over.$view

          @sendMouseEvent('mousemove', first)
        when 'touchend'
          @sendMouseEvent('mouseup', first)
          if (lastTouchDown == first.target)
            @sendMouseEvent('click', first)
            lastTouchDown = null
            
    handle: (event) =>
      view = event.target.$view
      type = event.type
      # console.log 'event', type, view
      if view
        if type is 'mousedown'
          @_lastMouseDown = view
          skipEvent(event) unless view instanceof InputText
      
      if type is 'mouseup' and @_lastMouseDown and @_lastMouseDown != view
        # send onmouseup and onmouseupoutside to the view that the mouse originally went down
        @sendEvent('mouseup', @_lastMouseDown)
        @_lastMouseDown.sendEvent('mouseup', @_lastMouseDown) 
        @sendEvent('mouseupoutside', @_lastMouseDown)
        @_lastMouseDown.sendEvent('mouseupoutside', @_lastMouseDown) 
        @_lastMouseDown = null
        return
      else if view 
        view.sendEvent(type, view)

      ###*
      # @property {Number} x
      # @readonly
      # The x coordinate of the mouse
      ###
      @x = event.pageX
      ###*
      # @property {Number} y
      # @readonly
      # The y coordinate of the mouse
      ###
      @y = event.pageY

      if @eventStarted and type is 'mousemove'
        idle(0, @sender) 
      else 
        @sendEvent(type, view)

    sender: =>
      ###*
      # @event onmousemove 
      # Fired when the mouse moves
      # @param {Object} coordinates The x and y coordinates of the mouse
      ###
      @sendEvent("mousemove", {x: @x, y: @y})
      ###*
      # @event onx 
      # Fired when the mouse moves in the x axis
      # @param {Number} x The x coordinate of the mouse
      ###
      @sendEvent('x', @x)
      ###*
      # @event ony 
      # Fired when the mouse moves in the y axis
      # @param {Number} y The y coordinate of the mouse
      ###
      @sendEvent('y', @y)

    handleDocEvent: (event) ->
      return if event and event.target != document
      if @eventStarted
        @docSelector.on("mousemove", @handle).one("mouseout", @stopEvent)
      else
        @docSelector.on("mousemove", @handle).one("mouseout", @startEvent)


  ###*
  # @class dr.window {Util}
  # @extends Eventable
  # Sends window resize events. Often used to dynamically reposition views as the window size changes.
  #
  #     <handler event="onwidth" reference="dr.window" args="newWidth">
  #       //adjust views
  #     </handler>
  #
  #     <handler event="onheight" reference="dr.window" args="newHeight">
  #       //adjust views
  #     </handler>
  #
  #
  ###
  class Window extends StartEventable
    constructor: ->
      window.addEventListener('resize', @handle, false)

      # Handle page visibility change   
      @visible = true
      if document.hidden?
        # Opera 12.10 and Firefox 18 and later support 
        hidden = "hidden"
        visibilityChange = "visibilitychange"
      else if document.mozHidden?
        hidden = "mozHidden"
        visibilityChange = "mozvisibilitychange"
      else if document.msHidden?
        hidden = "msHidden"
        visibilityChange = "msvisibilitychange"
      else if document.webkitHidden?
        hidden = "webkitHidden"
        visibilityChange = "webkitvisibilitychange"

      handleVisibilityChange = () =>
        @visible = document[hidden]
        # console.log('visibilitychange', @visible)
        ###*
        # @event onvisible 
        # Fired when the window visibility changes
        # @param {Boolean} visible True if the window is currently visible
        ###
        @sendEvent('visible', @visible)

      document.addEventListener(visibilityChange, handleVisibilityChange, false)
      @handle()

    startEventTest: () ->
      @events['width']?.length or @events['height']?.length

    handle: (event) =>
      @width = window.innerWidth
      ###*
      # @event onwidth 
      # Fired when the window resizes
      # @param {Number} width The width of the window
      ###
      @sendEvent('width', @width)
      @height = window.innerHeight
      ###*
      # @event onheight 
      # Fired when the window resizes
      # @param {Number} height The height of the window
      ###
      @sendEvent('height', @height)
      # console.log('window resize', event, @width, @height)


  ###*
  # @class dr.keyboard {Input}
  # @extends Eventable
  # Sends keyboard events.
  #
  # You might want to track specific keyboard events when text is being entered into an input box. In this example we listen for the enter key and display the value.
  #
  #     @example
  #     <spacedlayout axis="y" spacing="25"></spacedlayout>
  #     <inputtext id="nameinput" bgcolor="lightgrey"></inputtext>
  #     <text id="keycode" text="Key Code:"></text>
  #     <text id="entered"></text>
  #
  #     <handler event="onkeyup" args="keys" reference="dr.keyboard">
  #       keycode.setAttribute('text', 'Key Code: ' + keys.keyCode);
  #       if (keys.keyCode == 13) {
  #         entered.setAttribute('text', 'You entered: ' + nameinput.text);
  #         nameinput.setAttribute('text', '');
  #       }
  #     </handler>
  ###
  class Keyboard extends Eventable

    keyboardEvents = ['select', 'keyup', 'keydown', 'change']

    keys =
      shiftKey: false
      altKey: false
      ctrlKey: false
      metaKey: false
      keyCode: 0

    constructor: ->
      $(document).on(keyboardEvents.join(' '), @handle)

    handle: (event) =>
      target = event.target.$view
      type = event.type

      if type != 'select'
        for key, value of keys
          # console.log value, key
          keys[key] = event[key]
      keys.type = type
      
      if target
        target.sendEvent(type, keys)
        # send text events for events that could cause text to change
        if (type == 'keydown' or type == 'keyup' or type == 'blur' or type == 'change')
          value = event.target.value
          if (target.text != value)
            target.text = value
            target.sendEvent('text', value)

      out = if type == 'select' then target else keys
      ###*
      # @event onselect 
      # Fired when text is selected
      # @param {dr.view} view The view that fired the event
      ###
      ###*
      # @event onchange 
      # Fired when an inputtext has changed
      # @param {dr.view} view The view that fired the event
      ###
      ###*
      # @event onkeydown 
      # Fired when a key goes down
      # @param {Object} keys An object representing the keyboard state, including shiftKey, allocation, ctrlKey, metaKey, keyCode and type
      ###
      ###*
      # @event onkeyup 
      # Fired when a key goes up
      # @param {Object} keys An object representing the keyboard state, including shiftKey, allocation, ctrlKey, metaKey, keyCode and type
      ###
      @sendEvent(type, out)
      ###*
      # @event onkeys 
      # Fired when a key is pressed on the keyboard
      # @param {Object} keys An object representing the keyboard state, including shiftKey, allocation, ctrlKey, metaKey, keyCode and type
      ###
      @sendEvent('keys', out) unless type == 'select'
      # console.log 'handleKeyboard', type, target, out, event

  ###*
  # @class dr {Core Dreem}
  # Holds builtin and user-created classes and public APIs.
  # 
  # All classes listed here can be invoked with the declarative syntax, e.g. &lt;node>&lt;/node> or &lt;view>&lt;/view>
  ###
  exports = 
    view: View
    text: Text
    inputtext: InputText
    class: Class
    node: Node
    mouse: new Mouse()
    keyboard: new Keyboard()
    window: new Window()
    layout: Layout
    idle: new Idle()
    state: State
    ###*
    # @method initElements
    # Initializes all top-level views found in the document. Called automatically when the page loads, but can be called manually as needed.
    ###
    initElements: dom.initAllElements
    ###*
    # @method writeCSS
    # Writes generic dreem-specific CSS to the document. Should only be called once.
    ###
    writeCSS: dom.writeCSS

  # virtual classes declared for documentation purposes
  ###*
  # @class dr.method {Core Dreem}
  # Declares a member function in a node, view, class or other class instance. Methods can only be created with the &lt;method>&lt;/method> tag syntax.
  # 
  # If a method overrides an existing method, any existing (super) method(s) will be called first automatically.
  #
  # Let's define a method called changeColor in a view that sets the background color to pink.
  #
  #     @example
  #
  #     <view id="square" width="100" height="100">
  #       <method name="changeColor">
  #         this.setAttribute('bgcolor', 'pink');
  #       </method>
  #     </view>
  #
  #     <handler event="oninit">
  #       square.changeColor();
  #     </handler>
  #
  # Here we define the changeColor method in a class called square. We create an instance of the class and call the method on the intance.
  #
  #     @example
  #     <class name="square" width="100" height="100">
  #       <method name="changeColor">
  #         this.setAttribute('bgcolor', 'pink');
  #       </method>
  #     </class>
  #
  #     <square id="square1"></square>
  #
  #     <handler event="oninit">
  #       square1.changeColor();
  #     </handler>
  #
  # Now we'll subclass the square class with a bluesquare class, and override the changeColor method to color the square blue. We also add an inner square who's color is set in the changeColor method of the square superclass. Notice that the color of this square is set when the method is called on the subclass.
  #
  #     @example
  #     <class name="square" width="100" height="100">
  #       <view name="inner" width="25" height="25"></view>
  #       <method name="changeColor">
  #         this.inner.setAttribute('bgcolor', 'green');
  #         this.setAttribute('bgcolor', 'pink');
  #       </method>
  #     </class>
  #
  #     <class name="bluesquare" extends="square">
  #       <method name="changeColor">
  #         this.setAttribute('bgcolor', 'blue');
  #       </method>
  #     </class>
  #
  #     <spacedlayout></spacedlayout>
  #
  #     <square id="square1"></square>
  #     <bluesquare id="square2"></bluesquare>
  #
  #     <handler event="oninit">
  #       square1.changeColor();
  #       square2.changeColor();
  #     </handler>
  #
  ###
  ###*
  # @attribute {String} name (required)
  # The name of the method.
  ###
  ###*
  # @attribute {String[]} args
  # A comma separated list of method arguments.
  ###
  ###*
  # @attribute {"js"/"coffee"} type 
  # The compiler to use for this method. Inherits from the immediate class if unspecified.
  ###

  ###*
  # @class dr.setter
  # Declares a setter in a node, view, class or other class instance. Setters can only be created with the &lt;setter>&lt;/setter> tag syntax.
  #
  # Setters allow the default behavior of attribute changes to be changed.
  # 
  # Like dr.method, if a setter overrides an existing setter any existing (super) setter(s) will be called first automatically.
  # @ignore
  ###
  ###*
  # @attribute {String} name (required)
  # The name of the method.
  ###
  ###*
  # @attribute {String[]} args
  # A comma separated list of method arguments.
  ###
  ###*
  # @attribute {"js"/"coffee"} type 
  # The compiler to use for this method. Inherits from the immediate class if unspecified.
  ###

  ###*
  # @class dr.handler {Core Dreem}
  # Declares a handler in a node, view, class or other class instance. Handlers can only be created with the `<handler></handler>` tag syntax.
  #
  # Handlers are called when an event fires with new value, if available.
  #
  # Here is a simple handler that listens for an onx event in the local scope. The handler runs when x changes:
  #
  #     <handler event="onx">
  #       // do something now that x has changed
  #     </handler>
  #
  # When a handler uses the args attribute, it can recieve the value that changed:
  #
  # Sometimes it's nice to use a single method to respond to multiple events:
  #
  #     <handler event="onx" method="handlePosition"></handler>
  #     <handler event="ony" method="handlePosition"></handler>
  #     <method name="handlePosition">
  #       // do something now that x or y have changed
  #     </method>
  #
  #
  # When a handler uses the args attribute, it can receive the value that changed:
  #
  #     @example
  #
  #     <handler event="onwidth" args="widthValue">
  #        exampleLabel.setAttribute("text", "Parent view received width value of " + widthValue)
  #     </handler>
  #
  #     <text id="exampleLabel" x="50" y="5" text="no value yet" color="coral" outline="1px dotted coral" padding="10px"></text>
  #     <text x="50" y="${exampleLabel.y + exampleLabel.height + 20}" text="no value yet" color="white" bgcolor="#DDAA00" padding="10px">
  #       <handler event="onwidth" args="wValue">
  #          this.setAttribute("text", "This label received width value of " + wValue)
  #       </handler>
  #     </text>
  #
  #
  # It's also possible to listen for events on another scope. This handler listens for onidle events on dr.idle instead of the local scope:
  #
  #     @example
  #
  #     <handler event="onidle" args="time" reference="dr.idle">
  #       exampleLabel.setAttribute('text', 'received time from dr.idle.onidle: ' + Math.round(time));
  #     </handler>
  #     <text id="exampleLabel" x="50" y="5" text="no value yet" color="coral" outline="1px dotted coral" padding="10px"></text>
  #
  #
  ###
  ###*
  # @attribute {String} event (required)
  # The name of the event to listen for, e.g. 'onwidth'.
  ###
  ###*
  # @attribute {String} reference
  # If set, the handler will listen for an event in another scope.
  ###
  ###*
  # @attribute {String} method
  # If set, the handler call a local method. Useful when multiple handlers need to do the same thing.
  ###
  ###*
  # @attribute {String[]} args
  # A comma separated list of method arguments.
  ###
  ###*
  # @attribute {"js"/"coffee"} type 
  # The compiler to use for this method. Inherits from the immediate class if unspecified.
  ###

  ###*
  # @class dr.attribute {Core Dreem}
  # Adds a variable to a node, view, class or other class instance. Attributes can only be created with the &lt;attribute>&lt;/attribute> tag syntax.
  # 
  # Attributes allow classes to declare new variables with a specific type and default value. 
  #
  # Attributes automatically send events when their value changes.
  #
  # Here we create a new class with a custom attribute representing a person's mood, along with two instances. One instance has the default mood of 'happy', the other sets the mood attribute to 'sad'. Note there's nothing visible in this example yet:
  #
  #     <class name="person">
  #       <attribute name="mood" type="string" value="happy"></attribute>
  #     </class>
  #
  #     <person></person>
  #     <person mood="sad"></person>
  #
  # Let's had a handler to make our color change with the mood. Whenever the mood attribute changes, the color changes with it:
  #
  #     @example
  #     <class name="person" width="100" height="100">
  #       <attribute name="mood" type="string" value="happy"></attribute>
  #       <handler event="onmood" args="mood">
  #         var color = 'orange';
  #         if (mood !== 'happy') {
  #           color = 'blue'
  #         }
  #         this.setAttribute('bgcolor', color);
  #       </handler>
  #     </class>
  # 
  #     <spacedlayout></spacedlayout>
  #     <person></person>
  #     <person mood="sad"></person>
  #
  # You can add as many attributes as you like to a class. Here, we add a numeric attribute for size, which changes the height and width attributes via a constraint:
  #
  #     @example
  #     <class name="person" width="${this.size}" height="${this.size}">
  #       <attribute name="mood" type="string" value="happy"></attribute>
  #       <handler event="onmood" args="mood">
  #         var color = 'orange';
  #         if (mood !== 'happy') {
  #           color = 'blue'
  #         }
  #         this.setAttribute('bgcolor', color);
  #       </handler>
  #       <attribute name="size" type="number" value="20"></attribute>
  #     </class>
  # 
  #     <spacedlayout></spacedlayout>
  #     <person></person>
  #     <person mood="sad" size="50"></person>
  ###
  ###*
  # @attribute {String} name (required)
  # The name of the attribute
  ###
  ###*
  # @attribute {"string"/"number"/"boolean"/"json"} [type=string] (required)
  # The type of the attribute. Used to convert from a string to an appropriate representation of the type.
  ###
  ###*
  # @attribute {String} value (required)
  # The initial value for the attribute
  ###
  ###*
  # @attribute {Boolean} [visible=true]
  # Set to false if an attribute shouldn't affect a view's visual appearence
  ###

dr.writeCSS()
$(window).on('load', -> 
  dr.initElements() 
  # listen for jQuery style changes
  hackstyle(true)
)
