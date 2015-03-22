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
      boolean: (v) ->
        if typeof v is 'string'
          v is 'true'
        else
          !!v
      string: (v) ->
        v + ''
      json: (v) ->
        JSON.parse(v)
      expression: (v) ->
        if typeof v isnt 'string'
          v
        else
          compiler.compile("return #{v}")()
      positivenumber: (v) ->
        v = parseFloat(v)
        if isNaN v
          0
        else
          Math.max(0, v)
      emptynumber: (v) ->
        if !v? or v is ''
          ''
        else
          parseFloat(v)
      size: (v) ->
        if matchPercent.test(v) or v is 'auto'
          v
        else
          v = parseFloat(v)
          if isNaN v then 0 else Math.max(0, v)
      x: (v) ->
        if matchPercent.test(v)
          v
        else
          if typeof v is 'string'
            normValue = v.toLowerCase()
            switch normValue
              when 'begin', 'middle', 'end', 'left', 'right', 'center', 'none'
                return normValue
              else
                v = parseFloat(v)
          if isNaN v
            v = @x
            if isNaN v
              0
            else
              v
          else
            v
      y: (v) ->
        if matchPercent.test(v)
          v
        else
          if typeof v is 'string'
            normValue = v.toLowerCase()
            switch normValue
              when 'begin', 'middle', 'end', 'top', 'bottom', 'center', 'none'
                return normValue
              else
                v = parseFloat(v)
          if isNaN v
            v = @y
            if isNaN v
              0
            else
              v
          else
            v

    _coerceType: (name, value, type) ->
      type ||= @types[name]
      if type
        if debug or test
          unless (typemappings[type])
            showWarnings ["Invalid type '#{type}' for attribute '#{name}', must be one of: #{Object.keys(typemappings).join(', ')}"]
            return
          try
            value = typemappings[type].call(@, value)
          catch e
            showWarnings ["error parsing #{type} value '#{value}' for attribute '#{name}'"]
        else
          value = typemappings[type].call(@, value)

        # Protect number values from being set to NaN
        if type is 'number' and isNaN value
          value = @[name]
          if isNaN value then value = 0
      else unless value?
        #if this is a string type attribute it should be set to the empty string if it is null or undefined
        # (as in the case where it is set by constraint, and the constraint resolves to undefined)
        value = ''
      return value

    ###*
    # Sets an attribute on this object, calls a setter function if it exists.
    # Also stores the attribute in a property on the object and sends an event
    # with the new value.
    # @param {String} name the name of the attribute to set
    # @param value the value to set to
    ###
    setAttribute: (name, value, skipconstraintunregistration) ->
      # TODO: add support for dynamic constraints
      value = @_coerceType(name, value)

      @_unbindConstraint(name) unless skipconstraintunregistration

      # If a setter function exists, use its return value as the value for
      # the attribute.
      setterName = "set_#{name}"
      if typeof this[setterName] is 'function'
        value = this[setterName](value)

        # If return value from the setter is noop do nothing
        if value is noop then return @

      # Do normal set attribute behavior
      if name of ignoredAttributes
        # Ignored attributes should only ever set a value and fire an event
        @setAndFire(name, value)
      else
        @defaultSetAttributeBehavior(name, value)
      @

    ###*
    # The default behavior to execute in setAttribute once setters have been
    # run. Stores the value on this object and fires an event.
    # @param {String} name the name of the attribute to set
    # @param value the value to set to
    ###
    defaultSetAttributeBehavior: (name, value) ->
      @setAndFire(name, value)

    ###*
    # Stores the value on this object and fires an event.
    # @param {String} name the name of the attribute to set
    # @param value the value to set to
    ###
    setAndFire: (name, value) ->
      @sendEvent(name, @[name] = value)

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