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
  lateattributes = ['data', 'skin']

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

        # Execute the method that called super
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
        if not boundref
          showWarnings(["Could not bind to #{bindexpression} of constraint #{expression} for #{@$tagname}#{if @id then '#' + @id else if @name then '.' + name else ''}"])
          continue

        unless boundref instanceof Eventable
          console.log("Binding to non-Eventable #{bindexpression} of constraint #{expression} for #{@$tagname}#{if @id then '#' + @id else if @name then '.' + name else ''}")

        for binding in bindinglist
          property = binding.property
          # console.log 'binding to', property, 'on', boundref
          boundref.register(property, constraint.callback) if boundref instanceof Eventable
          constraint.callbackbindings.push(property, boundref)

      @setAttribute(name, fn(), true)
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
    @setAttribute(name, fn(), true)
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

return Node