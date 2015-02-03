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
  z: 'z-index'
  bgcolor: 'backgroundColor'
  visible: 'display'
  border: 'borderWidth'
  borderstyle: 'borderStyle'
  bordercolor: 'borderColor'
  boxshadow: 'boxShadow'


# Maps attribute names to dom element property names.
propmap =
  scrollx: 'scrollLeft'
  scrolly: 'scrollTop'

hackstyle = do ->
  # hack jQuery to send a style event when CSS changes
  monitoredJQueryStyleProps = {}
  for prop, value of stylemap
    monitoredJQueryStyleProps[value] = prop

  origstyle = $.style
  styletap = (elem, name, value) ->
    attrName = monitoredJQueryStyleProps[name]
    unless attrName?
      # Normalize style names to camel case names by removing '-' and upper
      # casing the subsequent character.
      attrName = monitoredJQueryStyleProps[name.replace(/-([a-z])/i, (m) -> m[1].toUpperCase())]
      monitoredJQueryStyleProps[name] = if attrName then attrName else name

    view = elem.$view
    if view[attrName] isnt value
    # if (view[name] isnt value and view?.events?[name])
      # console.log('sending style', name, elem.$view._locked) if sendstyle
      view.setAttribute(attrName, value, true)

    origstyle.apply(@, arguments)

  return (active) ->
    if active
      $.style = styletap
    else
      $.style = origstyle


window.dr = do ->
  # Common noop function
  noop = () ->

  # Common float comparison function
  closeTo = (a, b, epsilon) ->
    epsilon ||= 0.01 # Default is appropriate for many pixel related comparisons
    Math.abs(a - b) < epsilon

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

  # Tracks events sent by setAttribute() to prevent recursion
  triggerlock = null
  Events =
    ###*
    # Registers one or more events with the current scope
    # @param {String} ev the name of the event, or event names if separated by spaces.
    # @param {Function} callback called when the event is fired
    ###
    register: (ev, callback) ->
      # console.log 'registering', ev, callback
      evs   = ev.split(' ')
      @events = {} unless @hasOwnProperty('events') and @events
      for name in evs
        @events[name] or= []
        @events[name].push(callback)
      @
    ###*
    # Registers an event with the current scope, automatically unregisters when the event fires
    # @param {String} ev the name of the event
    # @param {Function} callback called when the event is fired
    ###
    one: (ev, callback) ->
      @register ev, ->
        @unregister(ev, arguments.callee)
        callback.apply(@, arguments)
      @
    ###*
    # Fires an event
    # @param {String} ev the name of the event to fire
    ###
    trigger: (ev, value, scope) ->
      list = @hasOwnProperty('events') and @events?[ev]
      return unless list
      if triggerlock
        if triggerlock.scope is @
          if ev in triggerlock
            # console.log 'found lock', ev, triggerlock
            return @
          # store new event
          triggerlock.push(ev)
      else
        # store current scope and event
        triggerlock = [ev]
        triggerlock.scope = @

      # console.log 'trigger', ev, list
      for callback in list
        callback.call(@, value, scope)
      triggerlock = null
      @
    ###*
    # Listens for an event on a specific scope
    # @param {Object} obj scope to listen for events on
    # @param {String} ev the name of the event
    # @param {Function} callback called when the event is fired
    ###
    listenTo: (obj, ev, callback) ->
      # console.log('listenTo', obj, ev, callback, obj.register)
      obj.register(ev, callback)
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
      listeningToOnce = @listeningToOnce ||= []
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
        obj.unregister(ev, callback)
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
              if obj is val.obj and ev is val.ev and callback is val.callback
                # console.log('found match', index)
                listeningTo.splice(index, 1)
                break
      else
        for {obj, ev, callback} in @listeningTo
          # console.log 'stopped listening', obj, ev, callback
          obj.unregister(ev, callback)
        @listeningTo = undefined
      @
    ###*
    # Stops listening for an event on the current scope
    # @param {String} ev the name of the event
    # @param {Function} callback called when the event would have been fired
    ###
    unregister: (ev, callback) ->
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
      boolean: (val) -> (if (typeof val is 'string') then val is 'true' else (!! val))
      string: (val) -> val + ''
      json: (val) -> JSON.parse(val)
      expression: (val) ->
        if typeof val isnt 'string'
          return val
        compiler.compile("return #{val}")()
      positivenumber: (val) ->
        val = parseFloat(val)
        if isNaN val then 0 else Math.max(0, val)

    _coerceType: (name, value, type) ->
      type ||= @types[name]
      if type
        unless (typemappings[type])
          showWarnings ["Invalid type '#{type}' for attribute '#{name}', must be one of: #{Object.keys(typemappings).join(', ')}"]
          return
        value = typemappings[type](value)

        # Protect number values from being set to NaN
        if type is 'number' and isNaN value
          value = @[name]
          if isNaN value then value = 0
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

      @_unbindConstraint(name) unless skipconstraintunregistration

      # If a setter function exists, use its return value as the value for
      # the attribute.
      setterName = "set_#{name}"
      if typeof this[setterName] is 'function'
        value = this[setterName](value)
      @[name] = value
      @sendEvent(name, value)
      @

    ###*
    # Sends an event
    # @param {String} name the name of the event to send
    # @param value the value to send with the event
    ###
    sendEvent: (name, value) ->
      if instantiating
        eventq.push({scope: @, name: name, value: value})
        return

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
    touch: 'ontouchstart' of window or 'onmsgesturechange' of window # deal with ie10
    camelcss: navigator.userAgent.toLowerCase().indexOf('firefox') > -1
    raf: window.requestAnimationFrame       or
         window.webkitRequestAnimationFrame or
         window.mozRequestAnimationFrame    or
         window.oRequestAnimationFrame      or
         window.msRequestAnimationFrame
    prefix: (
      () ->
        styles = window.getComputedStyle(document.documentElement, '')
        pre = (Array.prototype.slice.call(styles).join('').match(/-(moz|webkit|ms)-/) or (styles.OLink is '' and ['', 'o']))[1]
        dom = ('WebKit|Moz|MS|O').match(new RegExp('(' + pre + ')', 'i'))[1]
        {
          dom:dom
          lowercase:pre
          css:'-' + pre + '-'
          js:pre[0].toUpperCase() + pre.substr(1)
        }
      )()
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
          func = new Function("return function #{name}(#{argstring}){#{script}}")()
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


  # a list of constraint scopes gathered at init time
  constraintScopes = []
  instantiating = false
  handlerq = []
  eventq = []

  _initConstraints = ->
    instantiating = false
    for scope in handlerq
      scope._bindHandlers()
    handlerq = []

    for ev in eventq
      {scope, name, value} = ev
      if name is 'init'
        # console.log ('init')
        scope.inited = true
      scope.sendEvent(name, value)
    eventq = []

    for scope in constraintScopes
      scope._bindConstraints()
    constraintScopes = []

  clone = (obj) ->
    newobj = {}
    for name, val of obj
      newobj[name] = val
    newobj

  _processAttrs = (sourceAttrs, targetAttrs) ->
    # Make sure "with" is processed before the rest of the attributes
    if sourceAttrs.with?
      # Process mixins from right to left since the rightmost mixin is more
      # "super" than the leftmost.
      mixins = sourceAttrs.with.split(',').reverse()
      for mixinName in mixins
        mixin = dr[mixinName.trim()]
        if mixin then _processAttrs(mixin.classattributes, targetAttrs)
    
    for key, value of sourceAttrs
      if key is 'with'
        # Don't process 'with' attribute
        continue
      else if (key is '$methods' or key is '$types') and key of targetAttrs
        targetAttrs[key] = clone(targetAttrs[key])
        # console.log('overwriting', key, targetAttrs[key], value)
        for propname, val of value
          if key is '$methods' and targetAttrs[key][propname]
            targetAttrs[key][propname] = targetAttrs[key][propname].concat(val)
            # console.log('method override found for', propname, targetAttrs[key][propname])
          else
            targetAttrs[key][propname] = val
          # console.log 'overwrote class attribute', key, targetAttrs[key], value
      else if key is '$handlers' and key of targetAttrs
        # console.log 'concat', targetAttrs[key], value
        targetAttrs[key] = targetAttrs[key].concat(value)
        # console.log 'after concat', targetAttrs[key]
      else
        targetAttrs[key] = value

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
    # name should be set before parent so that when subnode events fire the
    # nodes can be identified
    earlyattributes = ['name', 'parent']
    # data must be set after text
    lateattributes = ['data']

    constructor: (el, attributes = {}) ->
      # Process attributes if mixins are defined so that attributes from
      # the mixins get applied
      if attributes.with?
        if !attributes.$tagname? then supressTagname = true
        
        mixedAttributes = {}
        _processAttrs(attributes, mixedAttributes)
        attributes = mixedAttributes
        
        # Programatic instantiation doesn't work with a $tagname and 'class'
        # was inherited from the mixins so delete it.
        if supressTagname then delete attributes.$tagname

      # Immediately install the 'construct' method if it exists and then call
      # it with the element and attributes so that construct has a chance to
      # modify things.
      methods = attributes.$methods
      if methods
        for methodName in ['construct','_createSprite']
          methodObj = methods[methodName]
          if methodObj
            for {method, args} in methodObj
              hassuper = matchSuper.test(method)
              _installMethod(@, methodName, compiler.compile(method, args, "#{attributes.$tagname}$#{methodName}").bind(@), hassuper)
      
      @construct(el, attributes)

    ###*
    # Used to create child instances on a node.
    # @param Object options Should include a class attribute: 'class', e.g. {class: 'view'} unless a dr.node is desired.
    # @return {dr.node}
    ###
    createChild: (attributes = {}, async=false) ->
      # async argument is used by replicators.
      classname = attributes.class ? 'node'
      delete attributes.class
      if typeof dr[classname] isnt 'function'
        showWarnings(["Unrecognized class #{classname} in createChild()"])
        return

      el = attributes.element
      delete attributes.element
      attributes.parent ?= @
      new dr[classname](el, attributes, async)

    construct: (el, attributes) ->
      ###*
      # @attribute {dr.node[]} subnodes
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
      # @attribute {String} $textcontent
      # @readonly
      # Contains the textual contents of this node, if any
      ###
      if el?
        # store a reference so others can find out when we're initted
        el.$view = @
        # store textual content
        attributes.$textcontent = el.textContent

      # Install the rest of the methods
      tagname = attributes.$tagname
      if attributes.$methods
        @installMethods(attributes.$methods, tagname)
        delete attributes.$methods

      if attributes.$handlers
        @installHandlers(attributes.$handlers, tagname)
        # set clickable=true for elements listening for mouse events here for now - ugly though
        unless attributes.clickable is "false"
          for name in (name for name in attributes.$handlers when name.ev.substr(2) in mouseEvents)
            attributes.clickable = true
            # console.log 'registered for clickable', attributes.clickable
            break

        delete attributes.$handlers

      unless deferbindings
        @_bindHandlers()

      for name in (name for name in earlyattributes when name of attributes)
        @setAttribute(name, attributes[name])

      # Bind to event expressions and set attributes
      for name in (name for name of attributes when not (name in lateattributes or name in earlyattributes))
        @bindAttribute(name, attributes[name], tagname)

      # Need to fire subnode added events after attributes have been set since
      # we aren't fully configured until now so listeners may be notified
      # before the node is actually ready. Doing this in set_parent specificaly
      # causes problems in layouts when a view is added after initialization
      # since the layout will set a value such as x,y before the x,y setters
      # of the node itself have run.
      parent = @parent
      if (parent and parent instanceof Node)
        parent.sendEvent('subnodes', @)
        parent.doSubnodeAdded(@)

      for name in (name for name in lateattributes when name of attributes)
        @bindAttribute(name, attributes[name], tagname)

      constraintScopes.push(@) if @constraints

      ###*
      # @event oninit
      # Fired when this node and all its children are completely initialized
      # @param {dr.node} node The dr.node that fired the event
      ###
      ###*
      # @attribute {Boolean} inited
      # @readonly
      # True when this node and all its children are completely initialized
      ###

      # console.log 'new node', @, attributes
      unless skiponinit
        unless @inited
          @initialize()

    initialize: (skipevents) ->
      @inited = true unless instantiating
      if not skipevents then @sendEvent('init', @)

    # match js and CoffeeScript-style super() calls
    matchSuper = /this.super\(|this\["super"\]\(/
    installMethods: (methods, tagname, scope=@, callbackscope=@) ->
      # console.log('installing methods', methods, tagname, scope, callbackscope)
      # Install methods
      for name, methodlist of methods
        for {method, args, allocation} in methodlist
          continue if name is 'construct' or name is '_createSprite'
          hassuper = matchSuper.test(method)
          # console.log 'installing method', name, hassuper, args, method, allocation, @
          _installMethod(scope, name, compiler.compile(method, args, "#{tagname}$#{name}").bind(callbackscope), hassuper, allocation)
      return

    installHandlers: (handlers, tagname, scope=@) ->
      # store list of handlers for late binding
      @handlers ?= []
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
          scope.unregister(ev, handler.callback)
      return

    # Bind an attribute to a constraint, event expression/handler or fall back to setAttribute()
    matchConstraint = /\${(.+)}/
    bindAttribute: (name, value, tagname) ->
      if typeof value is 'string' and constraint = value.match(matchConstraint)
        # console.log('applying constraint', name, constraint[1])
        @setConstraint(name, constraint[1], true)
      else if eventname = name.match(matchEvent)
        name = eventname[1]
        # console.log('binding to event expression', name, value, @)
        handler =
          scope: @
          ev: name
          callback: _eventCallback(name, value, @, tagname)
        @handlers.push(handler)
      else
        @setAttribute(name, value)

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

    _installMethod = (scope, methodname, method, hassuper, allocation) ->
      # TODO: add class methods when allocation is 'class'
      unless hassuper
        scope[methodname] = method
      else
        # Check if we are overriding a method in the scope
        if methodname of scope and typeof scope[methodname] is 'function'
          # Remember overridden method
          supr = scope[methodname]
          exists = true

        # console.log 'applying overridden method', methodname, arguments
        scope[methodname] = (args...) ->
          # Remember current state of scope by storing current super
          prevOwn = scope.hasOwnProperty('super')
          prevValue = scope['super'] if prevOwn

          # Add a super function to the scope
          if exists
            # Super method exists so supr will be invoked
            scope['super'] = (superargs...) ->
              # Argument shadowing on the super call
              i = superargs.length
              params = args.splice(0)
              while i
                params[--i] = superargs[i]
              supr.apply(scope, params)
          else
            # Provide error protection when calling super inside a method where no super
            # exists. Should this warn?
            scope['super'] = noop

          # Execute the methd that called super
          retval = method.apply(scope, args)

          # Restore scope with remembered super or by deleting.
          if prevOwn
            scope['super'] = prevValue
          else
            delete scope['super']
          return retval
      # console.log('installed method', methodname, scope, scope[methodname])

    # sets a constraint, binding it immediately unless skipbinding is true.
    # If skipbinding is true, call _bindConstraints() or _initConstraints()
    # to bind constraints later.
    setConstraint: (property, expression, skipbinding) ->
      # console.log 'adding constraint', property, expression, @
      if @constraints?
        @_unbindConstraint(property)
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
      return unless @constraints and @constraints[property]?.callback
      {callback, callbackbindings} = @constraints[property]
      # console.log "removing constraint for #{property}", @constraints[property], callback, callbackbindings

      for prop, i in callbackbindings by 2
        scope = callbackbindings[i + 1]
        # console.log "removing binding", prop, scope, callback
        scope.unregister(prop, callback)

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
          if not boundref or not (boundref instanceof Eventable)
            showWarnings(["Could not bind to #{bindexpression} of constraint #{expression} for #{@$tagname}#{if @id then '#' + @id else if @name then '.' + name else ''}"])
            continue

          for binding in bindinglist
            property = binding.property
            # console.log 'binding to', property, 'on', boundref
            boundref.register(property, constraint.callback)
            constraint.callbackbindings.push(property, boundref)

        @setAttribute(name, fn(), false, false, true)
      return

    # bind all handlers
    _bindHandlers: (send) ->
      return unless @handlers

      if instantiating
        handlerq.push(@)
        return

      for binding in @handlers
        {scope, name, ev, callback, reference} = binding
        if reference
          refeval = @_valueLookup(reference)()
          # Ensure we have a reference to a Dreem object
          if refeval instanceof Eventable
            scope.listenTo(refeval, ev, callback)
            if send and ev of refeval
              callback(refeval[ev])
            # console.log('binding to reference', reference, refeval, ev, scope)
        else
          # console.log('binding to scope', scope, ev)
          scope.register(ev, callback)
          if send and ev of scope
            callback(scope[ev])

      @handlers = []
      return

    # generate a callback for a constraint expression, e.g. x="${this.parent.baz.x + 10}"
    _constraintCallback: (name, fn) ->
      # console.log('binding to constraint function', name, fn, @)
      return `(function constraintCallback(){`
      # console.log 'setting', name, fn(), @
      @setAttribute(name, fn(), false, false, true)
      `}).bind(this)`

    set_parent: (parent) ->
      # console.log 'set_parent', parent, @
      # normalize to jQuery object
      if parent instanceof Node
        # store references to parent and children
        parent[@name] = @ if @name
        parent.subnodes.push(@)
      parent

    set_name: (name) ->
      # console.log 'set_name', name, @
      @parent[name] = @ if @parent and name
      name

    set_id: (id) ->
      window[id] = @
      id

    ###*
    # Animates this node's attribute(s)
    # @param {Object} obj A hash of attribute names and values to animate to
    # @param Number duration The duration of the animation in milliseconds
    ###
    animate: (attributes, time=600) ->
      # decode argument block
      animators = {} # our set of animators
      for name, value of attributes
        # for every name, value we have to create an animator with a to.
        track = {motion: 'bret', control: [0.01]}
        track[0] = this[name] or 0 #original value
        track[time] = value
        anim = Animator.createAnimator()
        # start the animator stateless
        anim.playStateless(track)
        animators[name] = anim

      first = undefined

      animTick = (time) =>
        return if @destroyed
        # lazy init so we start at 0
        first ?= time
        # compute the local time relative to the lazy initialized first
        local_time = time - first
        # mark ended
        ended = false
        # loop over all our animators
        for name, anim of animators
          # compute the value of the animation
          myvalue = anim.timestep(local_time)
          # set the attribute
          this.setAttribute(name, myvalue)
          # flag ended if we ended
          ended = true if anim.ended
        # only do idle again if none ended
        dr.idle.callOnIdle(animTick) unless ended
        # TODO add termination promise call
      dr.idle.callOnIdle(animTick)
      @

    _removeFromParent: (name) ->
      return unless @parent
      arr = @parent[name]
      index = arr.indexOf(@)
      if (index isnt -1)
        removedNode = arr[index]
        arr.splice(index, 1)
        # console.log('_removeFromParent', index, name, arr.length, arr, @)
        @parent.sendEvent(name, removedNode)
        if name is 'subnodes' then @parent.doSubnodeRemoved(removedNode)
      return

    # find all parents with an attribute set to a specific value. Used in updateSize to deal with invisible parents.
    _findParents: (name, value) ->
      out = []
      p = @
      while (p)
        if name of p and p[name] is value
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
    # @private
    ###
    doSubnodeAdded: (node) ->
      # Empty implementation by default

    ###*
    # Called when a subnode is removed from this node. Provides a hook for
    # subclasses. No need for subclasses to call super. Do not call this
    # method to remove a subnode. Instead call _removeFromParent.
    # @param {dr.node} node The subnode that was removed.
    # @return {void}
    # @private
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
      @destroyed = true
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
      @unregister()

      # remove name reference
      if (@parent?[@name] is @)
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
    styleval =
      display: (isVisible) ->
        if isVisible then '' else 'none'

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
      @css_baseclass = 'sprite'
      @_updateClass()

    setStyle: (name, value, internal, el=@el) ->
      value ?= ''
      name = stylemap[name] if name of stylemap
      value = styleval[name](value) if name of styleval
      # console.log('setStyle', name, value, @el)
      el.style[name] = value
      # @jqel.css(name, value)

    setProperty: (name, value, el=@el) ->
      value ?= ''
      name = propmap[name] if name of propmap
      el[name] = value

    set_parent: (parent) ->
      if parent instanceof Sprite
        parent = parent.el
      # else if parent instanceof jQuery
      #   parent = parent[0]

      # parent = $(parent) unless parent instanceof jQuery
      # parent.append(@jqel)
      # parent = parent[0] if parent instanceof jQuery
      # console.log 'set_parent', parent, @el
      # avoid appending twice, which messes with lexical order
      parent.appendChild(@el) unless @el.parentNode is parent

    set_id: (id) ->
      # console.log('setid', @id)
      @el.setAttribute('id', id)

    _cursorVal: () ->
      return if @__clickable then @__cursor or 'pointer' else ''
 
    set_cursor: (cursor) ->
      @__cursor = cursor
      @setStyle('cursor', @_cursorVal(), true)

    set_clickable: (clickable) ->
      # console.log('set_clickable', clickable)
      @__clickable = clickable
      @__updatePointerEvents()
      @setStyle('cursor', @_cursorVal(), true)

      # TODO: retrigger the event for the element below for IE and Opera? See http://stackoverflow.com/questions/3680429/click-through-a-div-to-underlying-elements
      # el = $(event.target)
      # el.hide()
      # $(document.elementFromPoint(event.clientX,event.clientY)).trigger(type)
      # el.show()

    set_clip: (clip) ->
      # console.log('set_clip', clip)
      @__clip = clip
      @__updateOverflow()

    set_scrollable: (scrollable) ->
      # console.log('set_scrollable', scrollable)
      @__scrollable = scrollable
      @__updateOverflow()
      @__updatePointerEvents()
      if scrollable
        $(@el).on('scroll', @_handleScroll)
      else
        $(@el).off('scroll', @_handleScroll)

    set_scrollbars: (scrollbars) ->
      @__scrollbars = if (scrollbars) then '' else 'noscrollbar'
      @_updateClass()

    _handleScroll: (event) =>
      domElement = event.target
      target = domElement.$view
      if target
        x = domElement.scrollLeft
        y = domElement.scrollTop
        if target.scrollx isnt x then target.setAttribute('scrollx', x, true, true, true, true)
        if target.scrolly isnt y then target.setAttribute('scrolly', y, true, true, true, true)

        # Prevent extra events when data has not changed
        oldEvt = @_lastScrollEvent
        newEvt = {scrollx:x, scrolly:y, scrollwidth:domElement.scrollWidth, scrollheight:domElement.scrollHeight}
        if not oldEvt or oldEvt.scrollx isnt newEvt.scrollx or oldEvt.scrolly isnt newEvt.scrolly or oldEvt.scrollwidth isnt newEvt.scrollwidth or oldEvt.scrollheight isnt newEvt.scrollheight
          target.sendEvent('scroll', newEvt)
          @_lastScrollEvent = newEvt

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
        if @__clickable or @__scrollable
          'auto'
        else
          ''
      , true)

    destroy: ->
      @el.parentNode.removeChild(@el)
      @input = @input.$view = null if @input
      @el = @jqel = @el.$view = null

    setText: (txt) ->
      if txt?
        @el.innerHTML = txt

    getText: (textOnly) ->
      if textOnly
        # Firefox doesn't support innerText and textContent gives us more that
        # we want. Instead, walk the dom children and concat all the text nodes.
        # The nodes get trimmed since line feeds and other junk whitespace will
        # show up as text nodes.
        child = @el.firstChild
        texts = []
        while child
          if child.nodeType is 3 then texts.push(child.data.trim())
          child = child.nextSibling;
        texts.join("")
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

    handle: (event) ->
      view = event.target.$view
      return unless view
      # console.log 'event', event.type, view
      view.sendEvent(event.type, view)

    createTextElement: () ->
      @css_baseclass = 'sprite sprite-text noselect'
      @_updateClass()

    createInputtextElement: (text, multiline, width, height) ->
      @css_baseclass = 'sprite noselect'
      @_updateClass()

      if multiline
        input = document.createElement('textarea')
      else
        input = document.createElement('input')
        input.setAttribute('type', 'text')
      # don't try to init this tag
      input.$init = true
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

    set_class: (classname='') ->
      @__classname = classname
      # console.log('setid', @id)
      @_updateClass()

    _updateClass: () ->
      classes = @css_baseclass
      classes += ' ' + @__classname if @__classname
      classes += ' ' + @__scrollbars if @__scrollbars
      @el.setAttribute('class', classes)

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
    knownstyles = ['width', 'height', 'background-color', 'opacity', 'padding', 'transform', 'transform-style', 'transform-origin', 'z-index', 'perspective', 'cursor', capabilities.prefix.css + 'transform', capabilities.prefix.css + 'transform-style', capabilities.prefix.css + 'transform-origin']
    ss2 = Sprite::setStyle
    Sprite::setStyle = (name, value, internal, el=@el) ->
      if not internal and not (name of stylemap) and not (name in knownstyles)
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
    ignorelayout: true,
    layouthint: true,
    initchildren: true,
    rotation: true,
    xscale: true,
    yscale: true,
    xanchor: true,
    yanchor: true,
    zanchor: true,
  }

  # Attributes that should be set on the dom element directly, not the
  # style property of the dom element
  domElementAttributes = {
    scrollx: true,
    scrolly: true,
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
    # This view's x-position. There are several categories of allowed values.
    #   1) Fixed: If a number is provided the x-position will be a fixed
    #      pixel position relative to the parent view.
    #   2) Percentage: If a number followed by a '%' sign is provided the
    #      x-position will constrained to a percent of the parent views
    #      inner width.
    #   3) Aligned Left: If the string 'left' is provided the x-position will
    #      be constrained so that the view's left bound is aligned with the
    #      inner left edge of the parent view. To clarify, aligning left is
    #      different from a fixed x-position of 0 since it accounts for
    #      transformations applied to the view.
    #   4) Aligned Right: If the string 'right' is provided the x-position will
    #      be constrained so that the view's right bound is aligned with the
    #      inner right edge of the parent view. Like align left, this means
    #      transformations applied to the view are accounted for.
    #   5) Aligned Center: If the string 'center' or 'middle' is provided the 
    #      x-position will be constrained so that the midpoint of the width
    #      bound of the view is the same as the midpoint of the inner width of
    #      the parent view. Like align left, this means transformations applied
    #      to the view are accounted for.
    ###
    ###*
    # @attribute {Number} [y=0]
    # This view's y-position. There are several categories of allowed values.
    #   1) Fixed: If a number is provided the y-position will be a fixed
    #      pixel position relative to the parent view.
    #   2) Percentage: If a number followed by a '%' sign is provided the
    #      y-position will constrained to a percent of the parent views
    #      inner height.
    #   3) Aligned Top: If the string 'top' is provided the y-position will
    #      be constrained so that the view's top bound is aligned with the
    #      inner top edge of the parent view. To clarify, aligning top is
    #      different from a fixed y-position of 0 since it accounts for
    #      transformations applied to the view.
    #   4) Aligned Bottom: If the string 'bottom' is provided the y-position
    #      will be constrained so that the view's bottom bound is aligned with 
    #      the inner bottom edge of the parent view. Like align top, this means
    #      transformations applied to the view are accounted for.
    #   5) Aligned Middle: If the string 'middle' or 'center' is provided the 
    #      y-position will be constrained so that the midpoint of the height
    #      bound of the view is the same as the midpoint of the inner height of
    #      the parent view. Like align top, this means transformations applied
    #      to the view are accounted for.
    ###
    ###*
    # @attribute {Number} [width=0]
    # This view's width. There are several categories of allowed values.
    #   1) Fixed: If a number is provided the width will be a fixed
    #      pixel size.
    #   2) Percentage: If a number followed by a '%' sign is provided the
    #      width will constrained to a percent of the parent views
    #      inner width.
    #   3) Auto: If the string 'auto' is provided the width will be constrained
    #      to the maximum x bounds of the view children of this view. This
    #      feature is implemented like a Layout, so you can use ignorelayout
    #      on a child view to disregard them for auto sizing. Furthermore,
    #      views with a percentage width, percentage x, or an x-position of 
    #      'center' or 'right' will also be disregarded. Note that 'left' is 
    #      not ignored since it does not necessarily result in a circular
    #      constraint.
    ###
    ###*
    # @attribute {Number} [height=0]
    # This view's height. There are several categories of allowed values.
    #   1) Fixed: If a number is provided the height will be a fixed
    #      pixel size.
    #   2) Percentage: If a number followed by a '%' sign is provided the
    #      height will constrained to a percent of the parent views
    #      inner height.
    #   3) Auto: If the string 'auto' is provided the height will be constrained
    #      to the maximum y bounds of the view children of this view. This
    #      feature is implemented like a Layout, so you can use ignorelayout
    #      on a child view to disregard them for auto sizing. Furthermore,
    #      views with a percentage height, percentage y, or a y-position of 
    #      'center', 'middle' or 'bottom' will also be disregarded. Note that 
    #      'top' is not ignored since it does not necessarily result in a 
    #      circular constraint.
    ###
    ###*
    # @attribute {Boolean} isaligned Indicates that the x attribute is
    # set to one of the "special" alignment values.
    # @readonly
    ###
    ###*
    # @attribute {Boolean} isvaligned Indicates that the y attribute is
    # set to one of the "special" alignment values.
    # @readonly
    ###
    ###*
    # @attribute {Number} innerwidth The width of the view less padding and
    # border. This is the width child views should use if border or padding
    # is being used by the view.
    # @readonly
    ###
    ###*
    # @attribute {Number} innerheight The height of the view less padding and
    # border. This is the height child views should use if border or padding
    # is being used by the view.
    # @readonly
    ###
    ###*
    # @attribute {Number} boundsx The x position of the bounding box for the
    # view. This value accounts for rotation and scaling of the view.
    # @readonly
    ###
    ###*
    # @attribute {Number} boundsy The y position of the bounding box for the
    # view. This value accounts for rotation and scaling of the view.
    # @readonly
    ###
    ###*
    # @attribute {Number} boundsxdiff The difference between the x position
    # of the view and the boundsx of the view. Useful when you need to offset
    # a view to make it line up when it is scaled or rotated.
    # @readonly
    ###
    ###*
    # @attribute {Number} boundsydiff The difference between the y position
    # of the view and the boundsy of the view. Useful when you need to offset
    # a view to make it line up when it is scaled or rotated.
    # @readonly
    ###
    ###*
    # @attribute {Number} boundswidth The width of the bounding box for the
    # view. This value accounts for rotation and scaling of the view. This is
    # the width non-descendant views should use if the view is rotated or
    # scaled.
    # @readonly
    ###
    ###*
    # @attribute {Number} boundsheight The height of the bounding box for the
    # view. This value accounts for rotation and scaling of the view. This is
    # the height non-descendant views should use if the view is rotated or
    # scaled.
    # @readonly
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
    # @attribute {Boolean} [scrollbars=false]
    # Controls the visibility of scrollbars if scrollable is true
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
    # @attribute {Number} [xscale=1.0]
    # Sets this view's width scale
    ###
    ###*
    # @attribute {Number} [yscale=1.0]
    # Sets this view's height scale
    ###
    ###*
    # @attribute {Number} [z=0]
    # Sets this view's z position (higher values are on top of other views)
    #
    # *(note: setting a `z` value for a view implicitly sets its parent's `transform-style` to `preserve-3d`)*
    ###
    ###*
    # @attribute {Number} [rotation=0]
    # Sets this view's rotation in degrees.
    ###
    ###*
    # @attribute {String} [perspective=0]
    # Sets this view's perspective depth along the z access, values in pixels.
    # When this value is set, items further from the camera will appear smaller, and closer items will be larger.
    ###
    ###*
    # @attribute {Number} [opacity=1.0]
    # Sets this view's opacity, values can be a float from 0.0 to 1.0
    ###
    ###*
    # @attribute {Number} [scrollx=0]
    # Sets the horizontal scroll position of the view. Only relevant if
    # this.scrollable is true. Setting this value will generate both a
    # scrollx event and a scroll event.
    ###
    ###*
    # @attribute {Number} [scrolly=0]
    # Sets the vertical scroll position of the view. Only relevant if
    # this.scrollable is true. Setting this value will generate both a
    # scrolly event and a scroll event.
    ###
    ###*
    # @attribute {Number} [xanchor=0]
    # Sets the horizontal center of the view's transformations (such as 
    # rotation) There are several categories of allowed values:
    #   1) Fixed: If a number is provided the x anchor will be a fixed
    #      pixel position.
    #   2) Left: If the string 'left' is provided the left edge of the view
    #      will be used. This is equivalent to a fixed value of 0.
    #   3) Right: If the string 'right' is provided the right edge of the
    #      view will be used.
    #   4) Center: If the string 'center' is provided the midpoint of the
    #      width of the view will be used.
    ###
    ###*
    # @attribute {Number} [yanchor=0]
    # Sets the vertical center of the view's transformations (such as 
    # rotation) There are several categories of allowed values:
    #   1) Fixed: If a number is provided the y anchor will be a fixed
    #      pixel position.
    #   2) Top: If the string 'top' is provided the top edge of the view
    #      will be used. This is equivalent to a fixed value of 0.
    #   3) Bottom: If the string 'bottom' is provided the bottom edge of the
    #      view will be used.
    #   4) Center: If the string 'center' is provided the midpoint of the
    #      height of the view will be used.
    ###
    ###*
    # @attribute {Number} [zanchor=0]
    # Sets the z-axis center of the view's transformations (such as rotation)
    ###
    ###*
    # @attribute {String} [cursor='pointer']
    # Cursor that should be used when the mouse is over this view, can be any CSS cursor value. Only applies when clickable is true.
    ###
    ###*
    # @attribute {String} [boxshadow]
    # Drop shadow using standard CSS format (offset-x offset-y blur-radius spread-radius color). For example: "10px 10px 5px 0px #888888".
    ###
    ###*
    # @attribute {String} [ignorelayout='false']
    # Indicates if layouts should ignore this view or not. A variety of
    # configuration mechanisms are supported. Provided true or false will
    # cause the view to be ignored or not by all layouts. If instead a
    # serialized map is provided the keys of the map will target values
    # the layouts with matching names. A special key of '*' indicates a
    # default value for all layouts not specifically mentioned in the map.
    ###
    ###*
    # @attribute {String} [layouthint='']
    # Provides per view hinting to layouts. The specific hints supported
    # are layout specific. Hints are provided as a map. A map key may
    # be prefixied with the name of a layout followed by a '/'. This will
    # target that hint at a specific layout. If the prefix is ommitted or
    # a prefix of '*' is used the hint will be targeted to all layouts.
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
    ###*
    # @event onscroll
    # Fired when the scroll position changes. Also provides information about
    # the scroll width and scroll height though it does not refire when those
    # values change since the DOM does not generate an event when they do. This
    # event is typically delayed by a few millis after setting scrollx or
    # scrolly since the underlying DOM event fires during the next DOM refresh
    # performed by the browser.
    # @param {Object} scroll The following four properties are defined:
    #     scrollx:number The horizontal scroll position.
    #     scrolly:number The vertical scroll position.
    #     scrollwidth:number The width of the scrollable area. Note this is
    #       not the maximum value for scrollx since that depends on the bounds
    #       of the scrollable view. The maximum can be calculated using this
    #       formula: scrollwidth - view.width + 2*view.border
    #     scrollheight:number The height of the scrollable area. Note this is
    #       not the maximum value for scrolly since that depends on the bounds
    #       of the scrollable view. The maximum can be calculated using this
    #       formula: scrollheight - view.height + 2*view.border
    ###

    # default attribute values
    defaults = {
      x:0, y:0,
      width:0, height:0,
      opacity: 1,
      clickable:false, clip:false, scrollable:false, visible:true, cursor:'pointer',
      bordercolor:'transparent', borderstyle:'solid', border:0,
      padding:0, ignorelayout:false, scrollbars:false
    }
    construct: (el, attributes) ->
      ###*
      # @attribute {dr.view[]} subviews
      # @readonly
      # An array of this views's child views
      ###
      ###*
      # @attribute {dr.layout[]} layouts
      # @readonly
      # An array of this views's layouts. Only defined when needed.
      ###

      @subviews = []
      types = {
        x: 'number', y: 'number', z: 'number',
        xscale: 'number', yscale: 'number',
        rotation: 'number', opacity: 'number',
        width: 'positivenumber', height: 'positivenumber',
        clickable: 'boolean', clip: 'boolean', scrollable: 'boolean', visible: 'boolean',
        border: 'positivenumber', padding: 'positivenumber',
        ignorelayout:'json', layouthint:'json',
        scrollx: 'number', scrolly: 'number', scrollbars: 'boolean'
      }

      for key, type of attributes.$types
        types[key] = type
      attributes.$types = types

      @_setDefaults(attributes, defaults)

      # Used in many calculations so precalculating for performance.
      @__twiceBorderPadding = 0

      # prevent sprite updates for these
      @xanchor = @yanchor = 'center'
      @border = @padding = @width = @height = @zanchor = @boundsxdiff = @boundsydiff = @boundsx = @boundsy = @boundswidth = @boundsheight = 0
      @clip = @scrollable = @clickable = @isaligned = @isvaligned = false

      # console.log 'sprite tagname', attributes.$tagname
      @_createSprite(el, attributes)
      super
      # console.log 'new view', el, attributes, @

    initialize: (skipevents) ->
      if @__autoLayoutwidth then @__autoLayoutwidth.setAttribute('locked', false)
      if @__autoLayoutheight then @__autoLayoutheight.setAttribute('locked', false)
      @__updateBounds()
      super

    _createSprite: (el, attributes) ->
      @sprite = new Sprite(el, @, attributes.$tagname)

    # FIXME: explore using a hash for the attributes since there are so many now.
    setAttribute: (name, value, skipDomChange, skipConstraintSetup, skipconstraintunregistration, skipBounds) ->
      # Handle special values for x, y, width and height
      unless skipConstraintSetup
        switch name
          when 'x'
            return @ if @__setupPercentConstraint(name, value, 'innerwidth')
            return @ if @__setupAlignConstraint(name, value)
          when 'y'
            return @ if @__setupPercentConstraint(name, value, 'innerheight')
            return @ if @__setupAlignConstraint(name, value)
          when 'width'
            return @ if @__setupPercentConstraint(name, value, 'innerwidth')
            return @ if @__setupAutoConstraint(name, value, 'x')
          when 'height'
            return @ if @__setupPercentConstraint(name, value, 'innerheight')
            return @ if @__setupAutoConstraint(name, value, 'y')

      # Do super first since setters may modify the actual value set.
      existing = @[name]
      super(name, value, false, skipConstraintSetup, skipconstraintunregistration)
      value = @[name]

      if existing isnt value and not (name of ignoredAttributes)
        # Update dom element
        if not (skipDomChange or name of hiddenAttributes)
          # console.log 'setting style', name, value, @
          if name of domElementAttributes
            @sprite.setProperty(name, value)
          else if @inited or defaults[name] isnt value
            @sprite.setStyle(name, value)

        # Update bounds if any of the attributes that could modify the bounds
        # are being updated
        if not skipBounds and @inited
          switch name
            when 'x', 'y', 'width', 'height', 'xscale', 'yscale', 'rotation', 'xanchor', 'yanchor'
              @__updateBounds()
      @

    getBoundsRelativeToParent: () ->
      xanchor = @xanchor
      yanchor = @yanchor
      w = @width
      h = @height

      if xanchor is 'left'
        xanchor = 0
      else if xanchor is 'center'
        xanchor = w / 2
      else if xanchor is 'right'
        xanchor = w
      else
        xanchor = Number(xanchor)

      if yanchor is 'top'
        yanchor = 0
      else if yanchor is 'center'
        yanchor = h / 2
      else if yanchor is 'bottom'
        yanchor = h
      else
        yanchor = Number(yanchor)

      # Create a path from the 4 corners of the normal view box and then apply
      # the transform to get the bounding box.
      x1 = @x
      x2 = x1 + w
      y1 = @y
      y2 = y1 + h
      (new Path([x1,y1,x2,y1,x2,y2,x1,y2])).transformAroundOrigin(@xscale, @yscale, @rotation, xanchor + x1, yanchor + y1).getBoundingBox()

    __updateBounds: () ->
      if @__boundsAreDifferent
        bounds = @getBoundsRelativeToParent()
        width = bounds.width
        height = bounds.height
        x = bounds.x
        y = bounds.y
        xdiff = @x - x
        ydiff = @y - y
      else
        x = @x
        y = @y
        xdiff = ydiff = 0
        width = @width
        height = @height

      if not closeTo(@boundsx, x) then @setAttribute('boundsx', x, true, true, true, true)
      if not closeTo(@boundsy, y) then @setAttribute('boundsy', y, true, true, true, true)
      if not closeTo(@boundswidth, width) then @setAttribute('boundswidth', width, true, true, true, true)
      if not closeTo(@boundsheight, height) then @setAttribute('boundsheight', height, true, true, true, true)
      if not closeTo(@boundsxdiff, xdiff) then @setAttribute('boundsxdiff', xdiff, true, true, true, true)
      if not closeTo(@boundsydiff, ydiff) then @setAttribute('boundsydiff', ydiff, true, true, true, true)

    # Returns true if a special value is encountered for alignment so that
    # the setAttribute method can stop processing the value.
    __setupAlignConstraint: (name, value) ->
      funcKey = '__alignFunc' + name
      return unless typeof value is 'string' or @[funcKey]

      # The root view can't be aligned
      parent = @parent
      return unless parent instanceof Node

      if name is 'x'
        isX = true
        axis = 'innerwidth'
        boundsdiff = 'boundsxdiff'
        boundssize = 'boundswidth'
        alignattr = 'isaligned'
      else
        isX = false
        axis = 'innerheight'
        boundsdiff = 'boundsydiff'
        boundssize = 'boundsheight'
        alignattr = 'isvaligned'

      # Remove existing function if found
      oldFunc = @[funcKey]
      if oldFunc
        @stopListening(parent, axis, oldFunc)
        @stopListening(@, boundsdiff, oldFunc)
        @stopListening(@, boundssize, oldFunc)
        delete @[funcKey]
        if @[alignattr] then @setAttribute(alignattr, false, true, true, true, true)

      # Only process new values that are strings
      return unless typeof value is 'string'

      # Normalize to lowercase
      normValue = value.toLowerCase()

      # Handle special values
      self = @
      if normValue is 'begin' or (isX and normValue is 'left') or (not isX and normValue is 'top')
        func = @[funcKey] = () ->
          val = self[boundsdiff]
          if self[name] isnt val then self.setAttribute(name, val, false, true, false, true)
        func.autoOk = true # Allow auto width/height to work with top/left aligned subviews.
      else if normValue is 'middle' or normValue is 'center'
        func = @[funcKey] = () ->
          self.setAttribute(name, ((parent[axis] - self[boundssize]) / 2) + self[boundsdiff], false, true, false, true)
        @listenTo(parent, axis, func)
        @listenTo(@, boundssize, func)
      else if normValue is 'end' or (isX and normValue is 'right') or (not isX and normValue is 'bottom')
        func = @[funcKey] = () ->
          self.setAttribute(name, parent[axis] - self[boundssize] + self[boundsdiff], false, true, false, true)
        @listenTo(parent, axis, func)
        @listenTo(@, boundssize, func)

      if func
        @listenTo(@, boundsdiff, func)
        func.call()
        if not @[alignattr] then @setAttribute(alignattr, true, true, true, true, true)
        return true

    # Returns true if a special value is encountered for auto sizing so that
    # the setAttribute method can stop processing the value.
    __setupAutoConstraint: (name, value, axis) ->
      layoutKey = '__autoLayout' + name
      return unless value is 'auto' or @[layoutKey]

      oldLayout = @[layoutKey]
      if oldLayout
        oldLayout.destroy()
        delete @[layoutKey]
      if value is 'auto'
        @[layoutKey] = new AutoPropertyLayout(null, {parent:@, axis:axis, locked:if @inited then 'false' else 'true'})
        unless @inited
          @setAttribute(name, 0, false, true) # An initial value is still necessary.
        return true

    matchPercent = /%$/
    # Returns true if a special value is encountered for percent position or
    # size so that the setAttribute method can stop processing the value.
    __setupPercentConstraint: (name, value, axis) ->
      funcKey = '__percentFunc' + name
      return unless typeof value is 'string' or @[funcKey]
      oldFunc = @[funcKey]
      parent = @parent

      # Handle rootview case using dr.window
      unless parent instanceof Node
        parent = dr.window
        axis = axis.substring(5)

      if oldFunc
        @stopListening(parent, axis, oldFunc)
        delete @[funcKey]
      if matchPercent.test(value)
        self = @
        scale = parseInt(value)/100
        func = @[funcKey] = () ->
          self.setAttribute(name, parent[axis] * scale, false, true)
        @listenTo(parent, axis, func)
        func.call()
        return true

    set_x: (x) ->
      # Update boundsx since it won't get updated if we're in an event loop
      if @__boundsAreDifferent and x - @boundsxdiff isnt @boundsx
        @sendEvent('boundsx', @boundsx = x - @boundsxdiff)
      x

    set_y: (y) ->
      # Update boundsy since it won't get updated if we're in an event loop
      if @__boundsAreDifferent and y - @boundsydiff isnt @boundsy
        @sendEvent('boundsy', @boundsy = y - @boundsydiff)
      y

    set_width: (width) ->
      # Prevent width smaller than border and padding
      width = Math.max(width, @__twiceBorderPadding)

      @setAttribute('innerwidth', width - @__twiceBorderPadding, true, true, true, true)
      width

    set_height: (height) ->
      # Prevent height smaller than border and padding
      height = Math.max(height, @__twiceBorderPadding)

      @setAttribute('innerheight', height - @__twiceBorderPadding, true, true, true, true)
      height

    set_border: (border) ->
      @__updateInnerMeasures(2*(border + @padding))
      border

    set_padding: (padding) ->
      @__updateInnerMeasures(2*(@border + padding))
      padding

    __updateInnerMeasures: (inset) ->
      @__twiceBorderPadding = inset

      # Prevent width/height less than twice border padding
      if inset > @width then @setAttribute('width', inset, false, true, true)
      if inset > @height then @setAttribute('height', inset, false, true, true)

      @setAttribute('innerwidth', @width - inset, true, true, true, true)
      @setAttribute('innerheight', @height - inset, true, true, true, true)

    set_clickable: (clickable) ->
      @sprite.set_clickable(clickable) if clickable isnt @clickable
      # super?(clickable)
      clickable
      
    set_cursor: (cursor) ->
      @sprite.set_cursor(cursor) if cursor isnt @cursor
      cursor

    __updateTransform: () ->
      transform = ''
      prefix = capabilities.prefix.css

      # Generate scale CSS
      xscale = @xscale
      if !@xscale? then xscale = @xscale = 1
      yscale = @yscale
      if !@yscale? then yscale = @yscale = 1
      if xscale isnt 1 or yscale isnt 1 then transform += 'scale3d(' + xscale + ',' + yscale + ',1.0)'

      # Generate rotation CSS
      @rotation ||= 0
      if @rotation % 360 isnt 0
        transform += ' rotate3d(0,0,1.0,' + @rotation + 'deg)'

      # Make it easy to determine that the bounds are different than the
      # simple x, y, width, height box
      @__boundsAreDifferent = transform isnt ''

      # Generate z-order CSS
      @z ||= 0
      if @z isnt 0
        transform += ' translate3d(0,0,' + @z + 'px)'
        @parent.sprite.setStyle(prefix + 'transform-style', 'preserve-3d')

      # Generate and apply transform-origin CSS if a transform exists
      if transform isnt ''
        xanchor = @xanchor
        if xanchor isnt 'left' and xanchor isnt 'right' and xanchor isnt 'center' then xanchor += 'px'
        yanchor = @yanchor
        if yanchor isnt 'top' and yanchor isnt 'bottom' and yanchor isnt 'center' then yanchor += 'px'
        @sprite.setStyle(prefix + 'transform-origin', xanchor + ' ' + yanchor + ' ' + @zanchor + 'px')

      # Apply transform CSS
      @sprite.setStyle(prefix + 'transform', transform)

    set_perspective: (perspective) ->
      prefix = capabilities.prefix.css
      @perspective = perspective
      per = perspective + 'px'
      per = 'none' if per == 0
      @sprite.setStyle(prefix + 'perspective', per)
      perspective

    set_xscale: (xscale) ->
      @xscale = xscale
      @__updateTransform()
      xscale

    set_yscale: (yscale) ->
      @yscale = yscale
      @__updateTransform()
      yscale

    set_rotation: (rotation) ->
      @rotation = rotation
      @__updateTransform()
      rotation

    set_z: (depth) ->
      @z = depth
      @__updateTransform()
      depth

    set_xanchor: (xanchor) ->
      if !xanchor? or xanchor is '' then xanchor = 'center'
      @xanchor = xanchor
      @__updateTransform()
      xanchor

    set_yanchor: (yanchor) ->
      if !yanchor? or yanchor is '' then yanchor = 'center'
      @yanchor = yanchor
      @__updateTransform()
      yanchor

    set_zanchor: (zanchor) ->
      if !zanchor? or zanchor is '' then zanchor = 0
      @zanchor = zanchor
      @__updateTransform()
      zanchor

    moveToFront: () ->
      for subview in @parent.subviews
        subview.setAttribute 'z', 0 unless subview.z
        @z = subview.z + 1 if @z <= subview.z
      @__updateTransform()

    ###*
    # @method moveToBack
    # Moves view behind all other sibling views
    ###

    moveToBack: () ->
      for subview in @parent.subviews
        subview.setAttribute 'z', 0 unless subview.z
        @z = subview.z - 1 if @z >= subview.z
      @__updateTransform()

    ###*
    # @method moveInFrontOf
    # Moves view to the front of sibling view
    # @param {dr.view} View to move in front of
    ###

    moveInFrontOf: (otherView) ->
      if otherView
        otherView.setAttribute 'z', 0 unless otherView.z
        @z = otherView.z + 1
        @__updateTransform()

    ###*
    # @method moveBehind
    # Moves view to the behind sibling view
    # @param {dr.view} View to move behind
    ###

    moveBehind: (otherView) ->
      if otherView
        otherView.setAttribute 'z', 0 unless otherView.z
        @z = otherView.z - 1
        @__updateTransform()

    set_parent: (parent) ->
      # console.log 'view set_parent', parent, @
      retval = super

      # store references subviews
      if parent instanceof View
        parent.subviews.push(@)
        parent.sendEvent('subviews', @)
        parent = parent.sprite

      @sprite.set_parent parent
      retval

    set_id: (id) ->
      retval = super
      @sprite.set_id(id)
      retval

    set_clip: (clip) ->
      @sprite.set_clip(clip) if clip isnt @clip
      clip

    set_scrollable: (scrollable) ->
      if scrollable
        @setAttributes({scrollx: 0, scrolly: 0})
      @sprite.set_scrollable(scrollable) if scrollable isnt @scrollable
      scrollable

    set_scrollbars: (scrollable) ->
      @sprite.set_scrollbars(@scrollbars)
      scrollbars

    set_scrollx: (scrollx) ->
      if isNaN scrollx then 0 else Math.max(0, Math.min(@sprite.el.scrollWidth - @width + 2*@border, scrollx))

    set_scrolly: (scrolly) ->
      if isNaN scrolly then 0 else Math.max(0, Math.min(@sprite.el.scrollHeight - @height + 2*@border, scrolly))

    ###*
    # Calls doSubviewAdded/doLayoutAdded if the added subnode is a view or
    # layout respectively. Subclasses should call super.
    # @private
    ###
    doSubnodeAdded: (node) ->
      if node instanceof View
        # update bounds before firing subviewAdded since some layouts
        # (specifically alignlayout) expect the bounds of a view to be updated
        # before updating the layout.
        node.__updateBounds()
        
        ###*
        # @event subviewAdded
        # Fired when a subview is added to this view.
        # @param {dr.view} view The dr.view that was added
        ###
        @sendEvent('subviewAdded', node)
        @doSubviewAdded(node);
      else if node instanceof Layout
        @doLayoutAdded(node);

    ###*
    # Calls doSubviewRemoved/doLayoutRemoved if the removed subnode is a view or
    # layout respectively. Subclasses should call super.
    # @private
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

    ###*
    # Gets the value of a named layout hint.
    # @param {String} layoutName The name of the layout to match.
    # @param {String} key The name of the hint to match.
    # @return {*} The value of the hint or undefined if not found.
    ###
    getLayoutHint: (layoutName, hintName) ->
      hints = this.layouthint
      if hints
        hint = hints[layoutName + '/' + hintName]
        if hint? then return hint
        
        hint = hints[hintName]
        if hint? then return hint
        
        hint = hints['*/' + hintName]
        if hint? then return hint
      else
        # No hints exist

    set_class: (classname) ->
      @sprite.set_class(classname)
      classname

  warnings = []
  showWarnings = (data) ->
    warnings = warnings.concat(data)
    out = data.join('\n')
    pre = document.createElement('pre')
    pre.setAttribute('class', 'warnings')
    pre.textContent = out
    document.body.insertBefore(pre, document.body.firstChild)
    console.error out

  specialtags = ['handler', 'method', 'attribute', 'setter', 'include']

  matchEvent = /^on(.+)/

  tagPackageSeparator = '-'

  dom = do ->
    # flatten element.attributes to a hash
    flattenattributes = (namednodemap)  ->
      attributes = {}
      for i in namednodemap
        attributes[i.name] = i.value
      attributes

    sendInit = (el) ->
      # Create the event.
      event = document.createEvent('Event')
      event.initEvent('dreeminit', true, true)
      window.dispatchEvent(event)
      $(el).addClass('dreeminited')
      
      
    # initialize a top-level view element
    initFromElement = (el) ->
      instantiating = true
      el.style.display = 'none'
      findAutoIncludes(el, () ->
        el.style.display = null
        initElement(el)
        # register constraints last
        _initConstraints()
        sendInit(el)
      )

    getChildElements = (el) ->
      child for child in el.childNodes when child.nodeType is 1

    findAutoIncludes = (parentel, finalcallback) ->
      jqel = $(parentel)

      includedScripts = {}
      loadqueue = []
      scriptloading = false
      dependencies = []
      loadScript = (url, cb, error) ->
        return if url of includedScripts
        includedScripts[url] = true
        dependencies.push(url)

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
          if loadqueue.length is 0
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
        dependencies.push(url)
        # console.log "Loading #{url}", el
        prom = $.get(url)
        prom.url = url
        prom.el = el
        filerequests.push(prom)

      loadMixins = (el, names={}) ->
        if el.attributes.with and el.attributes.with.value?
          # load instance mixins with
          for mixin in el.attributes.with.value.split(',')
            names[mixin.trim()] = el

      findMissingClasses = (names={}) ->
        # look for class declarations and unloaded classes for tags
        for el in jqel.find('*')
          name = el.localName
          if name is 'class'
            if el.attributes.extends
              # load load class extends
              names[el.attributes.extends.value] = el
            # track inline class declaration so we don't attempt to load it later
            loadMixins(el, names)
            inlineclasses[el.attributes.name?.value] = true
          else if name is 'replicator'
            # load class instance for tag
            names[name] = el
            # load classname instance as well
            names[el.attributes.classname.value] = el
            loadMixins(el, names)
          else
            # don't autoload elements found inside specialtags, e.g. setter
            unless el.parentNode.localName in specialtags
              # load class instance for tag
              names[name] = el
              loadMixins(el, names)

        # filter out classnames that may have already been loaded or should otherwise be ignored
        out = {}
        for name, el of names
          unless name of dr or name of fileloaded or name in specialtags or name of inlineclasses or builtinTags[name]
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
          args = [args] if (filerequests.length is 1)
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
            loadInclude("/classes/" + name.split(tagPackageSeparator).join('/') + ".dre", el) if name
            # console.log 'loading dre', name, url, el

          # console.log(filerequests, fileloaded, inlineclasses)
          # wait for all dre files to finish loading
          $.when.apply($, filerequests).done((args...) ->
            args = [args] if (filerequests.length is 1)
            filerequests = []

            for xhr in args
              # console.log 'inserting html', args, xhr[0]
              jqel.prepend(xhr[0])
              if debug
                jqel.contents().each(() ->
                  if(@nodeType is 8)
                    $(this).remove()
                )

            includes = findMissingClasses(findIncludeURLs())
            if Object.keys(includes).length > 0
              # console.warn("missing includes", includes)
              loadIncludes(callback)
              return

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
              State::enumfalse(State::keys())

              # load scriptincludes
              loadScript('/lib/animator.js', callback, 'Missing /lib/animator.js')
              for el in jqel.find('[scriptincludes]')
                for url in el.attributes.scriptincludes.value.split(',')
                  loadScript(url.trim(), callback, el.attributes.scriptincludeserror?.value.toString())
            ).fail(() ->
              console.warn("failed to load #{oneurl}")
            )
          ).fail((args...) ->
            args = [args] if (args.length is 1)
            for xhr in args
              showWarnings(["failed to load #{xhr.url} for element #{xhr.el.outerHTML}"])
            return
          )
          # now that we're done, avoid holding references to the elements
          for file of fileloaded
            fileloaded[file] = true
        ).fail((args...) ->
          args = [args] if (args.length is 1)
          for xhr in args
            showWarnings(["failed to load #{xhr.url} for element #{xhr.el.outerHTML}"])
          return
        )

      blacklist = ['/primus/primus.io.js']
      filereloader = ->
        dependencies.push(window.location.pathname)
        dependencies.push('/layout.js')
        paths = dependencies.filter((path) ->
          return true unless path in blacklist
        )
        # console.log('listen for changes watching', dependencies)
        $.ajax({
          url: '/watchfile/',
          datatype: 'text',
          data: {url: paths},
          success: (url) ->
            if url in paths
              # alert('reload')
              window.location.reload()
        }).done((data) ->
          filereloader()
        )

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

    # tags built into the browser that should be ignored, from http://www.w3.org/TR/html-markup/elements.html
    builtinTags = {'a': true, 'abbr': true, 'address': true, 'area': true, 'article': true, 'aside': true, 'audio': true, 'b': true, 'base': true, 'bdi': true, 'bdo': true, 'blockquote': true, 'body': true, 'br': true, 'button': true, 'canvas': true, 'caption': true, 'cite': true, 'code': true, 'col': true, 'colgroup': true, 'command': true, 'datalist': true, 'dd': true, 'del': true, 'details': true, 'dfn': true, 'div': true, 'dl': true, 'dt': true, 'em': true, 'embed': true, 'fieldset': true, 'figcaption': true, 'figure': true, 'footer': true, 'form': true, 'h1': true, 'h2': true, 'h3': true, 'h4': true, 'h5': true, 'h6': true, 'head': true, 'header': true, 'hgroup': true, 'hr': true, 'html': true, 'i': true, 'iframe': true, 'img': true, 'image': true, 'input': true, 'ins': true, 'kbd': true, 'keygen': true, 'label': true, 'legend': true, 'li': true, 'link': true, 'map': true, 'mark': true, 'menu': true, 'meta': true, 'meter': true, 'nav': true, 'noscript': true, 'object': true, 'ol': true, 'optgroup': true, 'option': true, 'output': true, 'p': true, 'param': true, 'pre': true, 'progress': true, 'q': true, 'rp': true, 'rt': true, 'ruby': true, 's': true, 'samp': true, 'script': true, 'section': true, 'select': true, 'small': true, 'source': true, 'span': true, 'strong': true, 'style': true, 'sub': true, 'summary': true, 'sup': true, 'table': true, 'tbody': true, 'td': true, 'textarea': true, 'tfoot': true, 'th': true, 'thead': true, 'time': true, 'title': true, 'tr': true, 'track': true, 'u': true, 'ul': true, 'var': true, 'video': true, 'wbr': true}
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

      if not tagname of dr
        console.warn 'could not find class for tag', tagname, el unless builtinTags[tagname]
        return
      else if builtinTags[tagname]
        console.warn 'refusing to create a class that would overwrite the builtin tag', tagname unless tagname is 'input'
        return

      attributes = flattenattributes(el.attributes)

      checkRequiredAttributes(tagname, attributes, el)

      attributes.$tagname = tagname

      # swallow builtin mouse attributes to allow event delegation, set clickable if an event is found
      for event in mouseEvents
        eventname = 'on' + event
        if eventname of attributes
          attributes.clickable = true unless attributes.clickable is false
          el.removeAttribute(eventname)

      # swallow event handler attributes to allow event delegation, e.g. <inputtext onchange="..."></inputtext>
      for attr of attributes
        if matchEvent.test(attr)
          el.removeAttribute(attr)

      parent ?= el.parentNode
      attributes.parent = parent if parent?
      # console.log 'parent for tag', tagname, attributes, parent

      li = tagname.lastIndexOf('state')
      isState = li > -1 and li is tagname.length - 5
      isClass = tagname is 'class'

      unless isClass or isState
        dom.processSpecialTags(el, attributes, attributes.type)

      # Defer oninit if we have children
      children = dom.getChildElements(el)
      attributes.$skiponinit = skiponinit = children.length > 0

      if typeof dr[tagname] is 'function'
        parent = new dr[tagname](el, attributes, true)
      else
        showWarnings(["Unrecognized class #{tagname} #{el.outerHTML}"])
        return

      return unless children.length > 0

      unless isClass or isState
        # create children now, unless the class told us not to
        unless dr[tagname].skipinitchildren
          # grab children again in case any were added when the parent was instantiated
          children = (child for child in dom.getChildElements(el) when child.localName not in specialtags)
          for child in children
            # console.log 'initting class child', child.localName
            initElement(child, parent)

        unless parent.inited
          # console.log('skiponinit', parent, parent.subnodes.length)
          checkChildren = ->
            return if parent.inited
            # console.log('doinit', parent)
            parent._bindHandlers(true)
            parent.initialize()
            return
          callOnIdle(checkChildren)
      return


    # write default CSS to the DOM
    writeCSS = ->
      style = document.createElement('style')
      style.type = 'text/css'
      style.innerHTML = '.sprite{position: absolute; pointer-events: none; padding: 0; margin: 0; box-sizing: border-box; border-color: transparent; border-style: solid; border-width: 0} .sprite-text{width: auto; height; auto; white-space: nowrap; padding: 0; margin: 0} .sprite-inputtext{border: none; outline: none; background-color:transparent; resize:none} .hidden{display: none} .noselect{-webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none} .noscrollbar::-webkit-scrollbar{display: none;} .warnings{font-size: 14px; background-color: pink; margin: 0} method{display: none} handler{display: none} setter{display: none} class{display: none} node{display: none} dataset{display:none}'
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
        if child.nodeValue? and (child.nodeType is 3 or child.nodeType is 8)
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
      children = (child for child in dom.getChildElements(el) when child.localName in specialtags)
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
          when 'method','setter'
            if tagname is 'setter' then name = "set_#{name.toLowerCase()}"
            classattributes.$methods[name] ?= []
            classattributes.$methods[name].push({method: compiler.transform(script, type), args: args, allocation: attributes.allocation})
            # console.log 'added ' + tagname, 'set_' + name, args, classattributes.$methods
          when 'attribute'
            name = name.toLowerCase()
            classattributes[name] = attributes.value
            classattributes.$types[name] = attributes.type
            if 'visual' of attributes
              # allow non-visual attributes to be added
              hiddenAttributes[name] = attributes.visual is 'false'
            # console.log 'added attribute', attributes, classattributes

      # console.log('processSpecialTags', classattributes)
      return children

    exports =
      initAllElements: initAllElements
      initElement: initElement
      processSpecialTags: processSpecialTags
      writeCSS: writeCSS
      getChildElements: getChildElements

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
      @skipattributes = ['parent', 'types', 'applyattributes', 'applied', 'skipattributes', 'stateattributes', 'subnodes']
      @subnodes = []
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
      @instancebody = el.innerHTML.trim()

      # restore old contents
      el.innerHTML = oldbody if (oldbody)

      @types = attributes.$types ? {}

      @setAttribute('parent', attributes.parent)

      @parent.states ?= []
      @parent.states.origmethods ?= {}
      @parent.states.push(@)
      @parent.sendEvent('states', @parent.states)

      # Install methods in the state with the run scope set to the parent
      # These will be applied to the parent by ONE with learn()
      @statemethods = attributes.$methods

      # store attributes that change when the state is applied
      for name, value of attributes
        unless name in @skipattributes or name.charAt(0) is '$'
          @applyattributes[name] = value unless name is 'name'
          @setAttribute(name, value)
      # console.log('found applyattributes', @applyattributes)

      # handle applied constraint bindings as local to the state
      if attributes.applied
        @bindAttribute('applied', attributes.applied, 'state')

      # install onapplied handlers now
      for handler in attributes.$handlers
        if handler.ev is 'onapplied'
          # console.log('found onapplied', handler)
          @installHandlers([handler], 'state', @)
          @_bindHandlers()

      finish = () =>
        @_bindConstraints() if @constraints

        if @events
          # prevent warnings for local events
          @skipattributes.push('events')

        # hide local properties we don't want applied to the parent by learn()
        @enumfalse(@skipattributes)

      callOnIdle(finish)

      el.$view = @ if el
      @children = []
      @initialize(true)

    ###*
    # @attribute {Boolean} [applied=false]
    # If true, the state is applied.  Note that onapplied handlers run in the scope of the state itself, see dr.dragstate for an example.
    ###
    set_applied: (applied) ->
      if @parent and @applied isnt applied
        # console.log('set_applied', applied, @, @parent)

        # restore orignal methods
        origmethods = @parent.states.origmethods
        for name of origmethods
          # console.log('restoring method', name, @parent._originalstatemethods[name])
          @parent[name] = origmethods[name]

        if applied then @_apply() else @_remove()

        # Hack to set attributes for now - not needed when using signals
        for name of @applyattributes
          val = @parent[name]
          # learn/forget will have set the value already. Delete it so it can be reset
          delete @parent[name]
          # console.log('setAttribute', name, val, @parent)
          # call with same signature used in _constraintCallback
          @parent.setAttribute(name, val, false, false, true)
      applied

    _apply: () ->
      return if @applied
      # console.log('_apply', @applied, @)
      @parent.learn @

      # store orignal methods from parent
      origmethods = @parent.states.origmethods
      for name of @statemethods
        if name of @parent
          origmethods[name] = @parent[name] unless name in origmethods
          # console.log('storing _originalstatemethod', name)

      # apply methods for applied states in order, including this one
      for state in @parent.states
        if state.applied or state is @
          # console.log('applying methods', state.name, state.statemethods)
          @parent.installMethods(state.statemethods, @parent.$tagname, @parent, @parent)

      # create children, if we have any
      if @instancebody
        parentel = @parent.sprite.el
        # count children before HTML is tweaked
        childrenbefore = dom.getChildElements(parentel)
        for el in childrenbefore
          if el.$view
            # console.log('clearing el', el)
            el.$view = null
        # console.log('size', childrenbefore)
        parentel.innerHTML += @instancebody
        # create child instances
        children = dom.getChildElements(parentel)
        for el, i in children
          # reset class references on new elements created by innerHTML
          if i < childrenbefore.length
            subnode = @parent.subnodes[i]
            if subnode?.sprite
              # console.log('subnode', @parent.subnodes, subnode, subnode.sprite.el, el)
              subnode.sprite.el = el
            el.$view = subnode
          else
            # create new elements
            # console.log('initting el', el, @parent)
            dom.initElement(el, @parent)
            @children.push(el.$view)

      # bind handlers
      if @stateattributes.$handlers
        # console.log('installing handlers', @stateattributes.$handlers)
        @parent.installHandlers(@stateattributes.$handlers, @parent.$tagname, @parent)
        @parent._bindHandlers()

    _remove: () ->
      return unless @applied
      # console.log('_remove', @applied, @)

      # restore properties
      @parent.forget @

      # destroy any children created
      while child = @children.pop()
        # console.log('destroying', child)
        child.destroy()

      # apply methods for applied states in order, excluding this one
      for state in @parent.states
        if state.applied and state isnt @
          # console.log('applying methods', state.name, state.statemethods)
          @parent.installMethods(state.statemethods, @parent.$tagname, @parent, @parent)

      # remove handlers
      if @stateattributes.$handlers
        # console.log('removing handlers', @stateattributes.$handlers)
        @parent.removeHandlers(@stateattributes.$handlers, @parent.$tagname, @parent)


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
    ###*
    # @attribute {Boolean} [initchildren=true]
    # If false, class instances won't initialize their children.
    ###
    constructor: (el, classattributes = {}) ->
      name = (if classattributes.name then classattributes.name.toLowerCase() else classattributes.name)
      extend = classattributes.extends ?= 'view'
      compilertype = classattributes.type
      skipinitchildren = classattributes.initchildren is 'false'
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
      haschildren = dom.getChildElements(el).length > 0

      # serialize the tag's contents for recreation with processedChildren removed
      instancebody = el.innerHTML.trim()

      # restore old contents
      el.innerHTML = oldbody if (oldbody)

      # console.log('new class', name, classattributes)
      console.warn 'overwriting class', name if name of dr

      # class instance constructor
      dr[name] = klass = (instanceel, instanceattributes, internal, skipchildren) ->
        # override class attributes with instance attributes
        attributes = clone(classattributes)
        _processAttrs(instanceattributes, attributes)

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
        # call with the fourth argument as true to prevent creating children for the class we are extending
        parent = new dr[extend](instanceel, attributes, true, true)
        # console.log 'created class instance', name, extend, parent

        viewel = parent.sprite?.el

        if instanceel
          # hide contents of invisible nodes
          instanceel.setAttribute('class', 'hidden') unless viewel

        # unpack instance children
        if viewel
          if instancebody
            viewhtml = viewel.innerHTML.trim()
            if viewhtml
              # Append class children on instances instead of replacing them
              viewel.innerHTML = instancebody + viewhtml
              # console.log 'instancebody', instancebody, viewel.innerHTML, viewel
            else
              # console.log 'normal'
              viewel.innerHTML = instancebody

          unless skipchildren
            children = (child for child in dom.getChildElements(viewel) when child.localName not in specialtags)
            unless skipinitchildren
              for child in children
                # console.log 'creating class child in parent', child, parent, attributes
                dom.initElement(child, parent)

        unless skipchildren
          sendInit = () ->
            # console.log('sendInit', parent.inited, parent)
            return if parent.inited
            parent._bindHandlers(true)
            parent.initialize()

          if internal
            callOnIdle(sendInit)
          else
            # the user called dr[foo]() directly, init immediately
            sendInit()
        return parent

      if name
        # Store a secondary reference under an object if tagPackageSeparator 
        # syntax is used for the class name. This creates rudimentary namespacing.
        parts = name.split(tagPackageSeparator)
        len = parts.length
        if len > 1
          context = dr
          for part, idx in parts
            if idx is len - 1
              context[part] = klass
            else
              newContext = context[part]
              context[part] = newContext = {} unless newContext
              context = newContext
      
      # remember this for later when we're instantiating instances
      klass.skipinitchildren = skipinitchildren
      klass.classattributes = classattributes

  ###*
  # @class dr.layout {Layout}
  # @extends dr.node
  # The base class for all layouts.
  #
  # When a new layout is added, it will automatically create and add itself to a layouts array in its parent. In addition, an onlayouts event is fired in the parent when the layouts array changes. This allows the parent to access the layout(s) later.
  #
  # Here is a view that contains a spacedlayout.
  #
  #     @example
  #     <spacedlayout axis="y"></spacedlayout>
  #
  #     <view bgcolor="oldlace" width="auto" height="auto">
  #       <spacedlayout>
  #         <method name="startMonitoringSubview" args="view">
  #           output.setAttribute('text', output.text + "View Added: " + view.$tagname + ":" + view.bgcolor + "\n");
  #           this.super();
  #         </method>
  #       </spacedlayout>
  #       <view width="50" height="50" bgcolor="lightpink" opacity=".3"></view>
  #       <view width="50" height="50" bgcolor="plum" opacity=".3"></view>
  #       <view width="50" height="50" bgcolor="lightblue" opacity=".3"></view>
  #     </view>
  #
  #     <text id="output" multiline="true" width="300"></text>
  #
  ###
  class Layout extends Node
    construct: (el, attributes) ->
      types = {locked:'boolean'}
      defaults = {locked:false}

      # Remember initial lock state so we can restore it after initialization
      # is complete. We will always lock a layout during initialization to
      # prevent extraneous updates
      if attributes.locked?
        attrLocked = if attributes.locked is 'true' then true else false
      @locked = true

      # Holds the views managed by the layout in the order they will be
      # layed out.
      @subviews = []

      super

      # Listen to the parent for added/removed views. Bind needed because the
      # callback scope is the monitored object not the monitoring object.
      @listenTo(@parent, 'subviewAdded', @addSubview.bind(@))
      @listenTo(@parent, 'subviewRemoved', @removeSubview.bind(@))
      @listenTo(@parent, 'init', @update.bind(@))

      # Store ourself in the parent layouts and fire event
      @parent.layouts ?= []
      @parent.layouts.push(@)
      @parent.sendEvent('layouts', @parent.layouts)

      # Start monitoring existing subviews
      subviews = @parent.subviews
      if subviews and @parent.inited
        for subview in subviews
          @addSubview(subview)

      # Restore initial lock state or unlock now that initialization is done.
      if attrLocked?
        @locked = attrLocked
      else
        @locked = false

      # Finally, update the layout once
      @update()

    destroy: (skipevents) ->
      @locked = true
      # console.log 'destroy layout', @
      super
      @_removeFromParent('layouts') unless skipevents

    ###*
    # Adds the provided view to the subviews array of this layout, starts
    # monitoring the view for changes and updates the layout.
    # @param {dr.view} view The view to add to this layout.
    # @return {void}
    ###
    addSubview: (view) ->
      self = @
      func = this.__ignoreFunc = (ignorelayout) ->
        if self.__removeSubview(@) is -1 then self.__addSubview(@)
      @startMonitoringSubviewForIgnore(view, func)
      @__addSubview(view)

    __addSubview: (view) ->
      if @ignore(view) then return
      @subviews.push(view)
      @startMonitoringSubview(view)
      @update() unless @locked

    ###*
    # Removes the provided View from the subviews array of this Layout,
    # stops monitoring the view for changes and updates the layout.
    # @param {dr.view} view The view to remove from this layout.
    # @return {number} the index of the removed subview or -1 if not removed.
    ###
    removeSubview: (view) ->
      @stopMonitoringSubviewForIgnore(view, this.__ignoreFunc)
      if @ignore(view) then return -1 else return @__removeSubview(view)

    __removeSubview: (view) ->
      idx = @subviews.indexOf(view)
      if idx isnt -1
        @stopMonitoringSubview(view)
        @subviews.splice(idx, 1)
        @update() unless @locked
      return idx

    ###*
    # Use this method to add listeners for any properties that need to be
    # monitored on a subview that determine if it will be ignored by the layout.
    # Each listenTo should look like: this.listenTo(view, propname, func)
    # The default implementation monitors ignorelayout.
    # @param {dr.view} view The view to monitor.
    # @param {Function} func The function to bind
    # @return {void}
    ###
    startMonitoringSubviewForIgnore: (view, func) ->
      @listenTo(view, 'ignorelayout', func)

    ###*
    # Use this method to remove listeners for any properties that need to be
    # monitored on a subview that determine if it will be ignored by the layout.
    # Each stopListening should look like: this.stopListening(view, propname, func)
    # The default implementation monitors ignorelayout.
    # @param {dr.view} view The view to monitor.
    # @param {Function} func The function to unbind
    # @return {void}
    ###
    stopMonitoringSubviewForIgnore: (view, func) ->
      @stopListening(view, 'ignorelayout', func)

    ###*
    # Checks if a subview can be added to this Layout or not. The default
    # implementation checks the 'ignorelayout' attributes of the subview.
    # @param {dr.view} view The view to check.
    # @return {boolean} True means the subview will be skipped, false otherwise.
    ###
    ignore: (view) ->
      ignore = view.ignorelayout
      if typeof ignore is 'object'
        name = this.name
        if name
          v = ignore[name]
          if v? then return v else return ignore['*']
        else
          return ignore['*']
      else
        return ignore

    ###*
    # Subclasses should implement this method to start listening to
    # events from the subview that should update the layout. The default
    # implementation does nothing.
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
    # events from the subview that should update the layout. This
    # should remove all listeners that were setup in startMonitoringSubview.
    # The default implementation does nothing.
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
    # Checks if the layout can be updated right now or not. Should be called
    # by the "update" method of the layout to check if it is OK to do the
    # update. The default implementation checks if the layout is locked and
    # the parent is inited.
    # @return {boolean} true if not locked, false otherwise.
    ###
    canUpdate: ->
      return not @locked and @parent.inited

    ###*
    # Updates the layout. Subclasses should call canUpdate to check if it is
    # OK to update or not. The defualt implementation does nothing.
    # @return {void}
    ###
    update: ->
      # Empty implementation by default

    set_locked: (v) ->
      # Update the layout immediately if changing to false
      if @locked isnt v and v is false
        @locked = false
        @update()
      return v

  # A private layout used by the special value for width/height of 'auto'.
  # This layout sizes the view to fit its child views.
  class AutoPropertyLayout extends Layout
    startMonitoringSubview: (view) ->
      func = @update.bind(@)
      if @axis is 'x'
        @listenTo(view, 'x', func)
        @listenTo(view, 'width', func)
        @listenTo(view, 'boundsx', func)
        @listenTo(view, 'boundswidth', func)
      else
        @listenTo(view, 'y', func)
        @listenTo(view, 'height', func)
        @listenTo(view, 'boundsy', func)
        @listenTo(view, 'boundsheight', func)
      @listenTo(view, 'visible', func)

    stopMonitoringSubview: (view) ->
      func = @update.bind(@)
      if @axis is 'x'
        @stopListening(view, 'x', func)
        @stopListening(view, 'width', func)
        @stopListening(view, 'boundsx', func)
        @stopListening(view, 'boundswidth', func)
      else
        @stopListening(view, 'y', func)
        @stopListening(view, 'height', func)
        @stopListening(view, 'boundsy', func)
        @stopListening(view, 'boundsheight', func)
      @stopListening(view, 'visible', func)

    update: ->
      if not @locked and @axis
        # console.log('update', @axis)
        # Prevent inadvertent loops
        @locked = true

        svs = @subviews
        i = svs.length
        maxFunc = Math.max
        parent = @parent
        max = 0

        if @axis is 'x'
          # Find the farthest horizontal extent of any subview
          while i
            sv = svs[--i]
            unless @_skipX(sv) then max = maxFunc(max, sv.boundsx + maxFunc(0, sv.boundswidth))
          val = max + parent.__twiceBorderPadding
          if parent.width isnt val then parent.setAttribute('width', val, false, true)
        else
          # Find the farthest vertical extent of any subview
          while i
            sv = svs[--i]
            unless @_skipY(sv) then max = maxFunc(max, sv.boundsy + maxFunc(0, sv.boundsheight))
          val = max + parent.__twiceBorderPadding
          if parent.height isnt val then parent.setAttribute('height', val, false, true)

        @locked = false

    # No need to measure children that are not visible or that use a percent
    # position or size since this leads to circular sizing constraints.
    # Also skip children that use an align of bottom/right or center/middle
    # since those also lead to circular sizing constraints.
    _skipX: (view) ->
      return not view.visible or view.__percentFuncwidth? or view.__percentFuncx? or (view.__alignFuncx? and not view.__alignFuncx.autoOk)
    _skipY: (view) ->
      return not view.visible or view.__percentFuncheight? or view.__percentFuncy? or (view.__alignFuncy? and not view.__alignFuncy.autoOk)

  # An ordered collection of points that can be transformed in various ways.
  class Path
    constructor: (vectors = []) ->
      @_boundingBox = null
      @vectors = vectors
    
    ###*
    # Convert radians to degrees.
    # @param {Number} deg The degrees to convert.
    # @return {Number} The radians
    ###
    degreesToRadians: (deg) ->
      deg * Math.PI / 180
    
    ###*
    # Convert degrees to radians.
    # @param {Number} rad The radians to convert.
    # @return {Number} The radians
    ###
    radiansToDegrees: (rad) ->
      rad * 180 / Math.PI
    
    ###*
    # Shift this path by the provided x and y amount.
    # @param {Number} dx The x amount to shift.
    # @param {Number} dy The y amount to shift.
    ###
    translate: (dx, dy) ->
      vecs = @vectors
      i = vecs.length
      while i
        vecs[--i] += dy
        vecs[--i] += dx
      @_boundingBox = null
      @
    
    ###*
    # Rotates this path around 0,0 by the provided angle in radians.
    # @param {Number} a The angle in degrees to rotate
    ###
    rotate: (a) ->
      a = @degreesToRadians(a)
      
      cosA = Math.cos(a)
      sinA = Math.sin(a)
      vecs = @vectors
      len = vecs.length
      i = 0
      while len > i
        xNew = vecs[i] * cosA - vecs[i + 1] * sinA
        yNew = vecs[i] * sinA + vecs[i + 1] * cosA
        
        vecs[i++] = xNew
        vecs[i++] = yNew
      @_boundingBox = null
      @

    ###*
    # Scales this path around the origin by the provided scale amount
    # @param {Number} sx The amount to scale along the x-axis.
    # @param {Number} sy The amount to scale along the y-axis.
    ###
    scale: (sx, sy) ->
      vecs = @vectors
      i = vecs.length
      while i
        vecs[--i] *= sy
        vecs[--i] *= sx
      @_boundingBox = null
      @

    ###*
    # Rotates and scales this path around the provided origin by the angle in
    # degrees, scalex and scaley.
    # @param {Number} scalex The amount to scale along the x axis.
    # @param {Number} scaley The amount to scale along the y axis.
    # @param {Number} angle The amount to scale.
    # @param {Number} xOrigin The amount to scale.
    # @param {Number} yOrign The amount to scale.
    ###
    transformAroundOrigin: (scalex, scaley, angle, xOrigin, yOrigin) ->
      @translate(-xOrigin, -yOrigin).rotate(angle).scale(scalex, scaley).translate(xOrigin, yOrigin)

    ###*
    # Gets the bounding box for this path.
    # @return {Object} with properties x, y, width and height or null
    # if no bounding box could be calculated.
    ###
    getBoundingBox: () ->
      return @_boundingBox if @_boundingBox
      
      vecs = @vectors
      i = vecs.length
      if i >= 2
        minY = maxY = vecs[--i]
        minX = maxX = vecs[--i]
        while i
          y = vecs[--i]
          x = vecs[--i]
          minY = Math.min(y, minY)
          maxY = Math.max(y, maxY)
          minX = Math.min(x, minX)
          maxX = Math.max(x, maxX)
        @_boundingBox = {x:minX, y:minY, width:maxX - minX, height:maxY - minY}
      else
        @_boundingBox = null

  starttime = Date.now()
  idle = do ->
    requestAnimationFrame = capabilities.raf
    unless requestAnimationFrame
      # for phantom and really old browsers
      requestAnimationFrame = do ->
        (callback, element) ->
          callbackwrapper = () ->
            callback(Date.now() - starttime)
          window.setTimeout(callbackwrapper, 1000 / 60)

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
      # console.log('hit', key) if (tickEvents[key] isnt null)
      unless ticking
        requestAnimationFrame(doTick)
        ticking = true
      tickEvents[key] = callback

  callOnIdle = do ->
    queue = []

    callback = (time) ->
      # console.log('callback', time, queue.length)
      # snapshot the current queue to prevent recursion
      localqueue = queue
      queue = []
      for cb in localqueue
        # console.log('callback', cb)
        cb(time)
      if queue.length
        # if we have new items, call back later
        # console.log('new items', queue.length)
        setTimeout(() ->
          idle(2, callback)
        ,0)
      return

    if capabilities.raf
      (cb) ->
        queue.push(cb)
        # console.log('callOnIdle', queue)
        idle(2, callback)
        return
    else
      (cb) ->
        setTimeout(() ->
          cb(Date.now() - starttime)
        , 0)
        return

  # overrides bind/unbind to allow an event to be started/stopped automatically.
  # Used by Idle Mouse and Window to only register for events when they're used.
  class StartEventable extends Eventable
    register: (ev, callback) ->
      super
      if @startEventTest()
        @startEvent()

    unregister: (ev, callback) ->
      super
      if not @startEventTest()
        @stopEvent()

    startEvent: (event) ->
      return if @eventStarted
      @eventStarted = true
      # console.log 'start'

    stopEvent: (event) ->
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
  #     <text text="Milliseconds since app started: "></text>
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
      return

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

      ###*
      # @method callOnIdle
      # Calls a function on the next idle event.
      # @param {Function} callback A function to be called on the next idle event
      ###
    callOnIdle: (callback) ->
      callOnIdle(callback)

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
      return false

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
        skipEvent(event) unless first.target.$view.$tagname is 'inputtext'

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
          over = document.elementFromPoint(first.pageX - window.pageXOffset, first.pageY - window.pageYOffset)
          if (over and over.$view)
            if (lastTouchOver and lastTouchOver isnt over)
              @handle({target: lastTouchOver, type: 'mouseout'})
            lastTouchOver = over
            @handle({target: over, type: 'mouseover'})
            # console.log 'over', over, over.$view

          @sendMouseEvent('mousemove', first)
        when 'touchend'
          @sendMouseEvent('mouseup', first)
          if (lastTouchDown is first.target)
            @sendMouseEvent('click', first)
            lastTouchDown = null

    handle: (event) =>
      view = event.target.$view
      type = event.type
      # console.log 'event', type, view
      if view
        if type is 'mousedown'
          @_lastMouseDown = view
          skipEvent(event) unless view.$tagname is 'inputtext'

      if type is 'mouseup' and @_lastMouseDown and @_lastMouseDown isnt view
        # send onmouseup and onmouseupoutside to the view that the mouse originally went down
        @sendEvent('mouseup', @_lastMouseDown)
        @_lastMouseDown.sendEvent('mouseup', @_lastMouseDown)
        @sendEvent('mouseupoutside', @_lastMouseDown)
        @_lastMouseDown.sendEvent('mouseupoutside', @_lastMouseDown)
        @_lastMouseDown = null
        return
      else if view
        view.sendEvent(type, view)

      @x = event.pageX
      @y = event.pageY

      if @eventStarted and type is 'mousemove'
        idle(0, @sender)
      else
        @sendEvent(type, view)
      return

    sender: =>
      ###*
      # @event onmousemove
      # Fired when the mouse moves
      # @param {Object} coordinates The x and y coordinates of the mouse
      ###
      @sendEvent("mousemove", {x: @x, y: @y})
      ###*
      # @attribute {Number} x The x position of the mouse
      # @readonly
      ###
      @sendEvent('x', @x)
      ###*
      # @attribute {Number} y The y position of the mouse
      # @readonly
      ###
      @sendEvent('y', @y)

    handleDocEvent: (event) ->
      return if event and event.target isnt document
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
        # @attribute {Boolean} visible=true Set when the window visibility changes, true if the window is currently visible
        # @readonly
        ###
        @sendEvent('visible', @visible)

      document.addEventListener(visibilityChange, handleVisibilityChange, false)
      @handle()

    startEventTest: () ->
      @events['width']?.length or @events['height']?.length

    handle: (event) =>
      ###*
      # @attribute {Number} width Set when the window width changes
      # @readonly
      ###
      @width = window.innerWidth
      @sendEvent('width', @width)
      ###*
      # @attribute {Number} height Set when the window height changes
      # @readonly
      ###
      @height = window.innerHeight
      @sendEvent('height', @height)
      return
      # console.log('window resize', event, @width, @height)


  ###*
  # @class dr.keyboard {Input}
  # @extends Eventable
  # Sends keyboard events.
  #
  # You might want to listen for keyboard events globally. In this example, we display the code of the key being pressed. Note that you'll need to click on the example to activate it before you will see keyboard events.
  #
  #     @example
  #     <text id="keycode" text="Key Code:"></text>
  #
  #     <handler event="onkeyup" args="keys" reference="dr.keyboard">
  #       keycode.setAttribute('text', 'Key Code: ' + keys.keyCode);
  #     </handler>
  ###
  class Keyboard extends Eventable
    constructor: ->
      @keys =
        shiftKey: false
        altKey: false
        ctrlKey: false
        metaKey: false
        keyCode: 0
      $(document).on('select change keyup keydown', @handle)

    handle: (event) =>
      target = event.target.$view
      type = event.type

      for key of @keys
        # console.log key
        @keys[key] = event[key]
      @keys.type = type

      # delegate events to the target inputtext, if any
      target.sendEvent(type, @keys) if target

      # only keyup and down events should be sent
      return if type is 'select' or type is 'change'

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
      @sendEvent(type, @keys)
      ###*
      # @attribute {Object} keys
      # An object representing the most recent keyboard state, including shiftKey, allocation, ctrlKey, metaKey, keyCode and type
      ###
      @sendEvent('keys', @keys)
      # console.log 'handleKeyboard', type, target, out, event

  window.onerror = (e) ->
    showWarnings([e.toString()])

  ###*
  # @class dr {Core Dreem}
  # Holds builtin and user-created classes and public APIs.
  #
  # All classes listed here can be invoked with the declarative syntax, e.g. &lt;node>&lt;/node> or &lt;view>&lt;/view>
  ###
  exports =
    view: View
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
    # public API to initialize constraints for a group of nodes, used by replicator
    initConstraints: _initConstraints

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
  # @class dr.handler {Core Dreem, Events}
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
  # @class dr.attribute {Core Dreem, Events}
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
