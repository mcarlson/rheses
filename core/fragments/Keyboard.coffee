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

return Keyboard