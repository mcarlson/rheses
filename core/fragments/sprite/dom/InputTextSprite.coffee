###*
# @class InputTextSprite
# @private
# Abstracts the underlying visual primitives for an input text component
###
class InputTextSprite extends TextSprite
  constructor: (view, jqel, attributes) ->
    @css_baseclass ?= 'sprite noselect'
    super
    attributes.text ||= @getText()

    input = null
    if attributes.multiline is 'true'
      input = document.createElement('textarea')
    else
      input = document.createElement('input')
      input.setAttribute('type', 'text')
    
    # don't try to init this tag
    input.$init = true

    input.setAttribute('class', 'sprite-inputtext')

    @setStyle('color', 'inherit', false, input)
    @setStyle('background', 'inherit', false, input)
    @setStyle('font-variant', 'inherit', false, input)
    @setStyle('font-style', 'inherit', false, input)
    @setStyle('font-weight', 'inherit', false, input)
    @setStyle('font-size', 'inherit', false, input)
    @setStyle('font-family', 'inherit', false, input)
    @setStyle('width', '100%', false, input)
    @setStyle('height', '100%', false, input)

    @el.appendChild(input)

    input.$view = view
    $(input).on('focus blur', @handle)
    @input = input

  handle: (event) ->
    view = event.target.$view
    return unless view
    view.sendEvent(event.type, view)

  destroy: ->
    super
    @input = @input.$view = null if @input

  value: (value) ->
    if value?
      @input.value = value
    else
      @input.value

return InputTextSprite