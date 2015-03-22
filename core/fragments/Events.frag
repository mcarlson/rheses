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