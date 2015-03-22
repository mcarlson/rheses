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