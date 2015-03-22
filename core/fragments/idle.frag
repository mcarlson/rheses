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