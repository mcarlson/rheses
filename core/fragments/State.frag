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
  # You can set the 'applied' attribute to true to activate a state.
  #
  #     @example
  #     <view id="square" width="200" height="100" bgcolor="lightgrey">
  #       <state name="pinkstate">
  #         <view name="sub" bgcolor="pink" width="100" height="100"></view>
  #       </state>
  #       <handler event="oninit">
  #         this.pinkstate.setAttribute('applied', true);
  #       </handler>
  #     </view>
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
          @parent.setAttribute(name, val, true)
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