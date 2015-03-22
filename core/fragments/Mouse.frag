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