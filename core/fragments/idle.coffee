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
#     <spacedlayout axis="y" spacing="5"></spacedlayout>
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

return Idle