  ###*
  # @class dr.window {Util}
  # @extends Eventable
  # Sends window resize events. Often used to dynamically reposition views as the window size changes.
  #
  #     <handler event="onwidth" reference="dr.window" args="newWidth">
  #       //adjust views
  #     </handler>
  #
  #     <handler event="onheight" reference="dr.window" args="newHeight">
  #       //adjust views
  #     </handler>
  #
  #
  ###
  class Window extends StartEventable
    constructor: ->
      window.addEventListener('resize', @handle, false)

      # Handle page visibility change
      @visible = true
      if document.hidden?
        # Opera 12.10 and Firefox 18 and later support
        hidden = "hidden"
        visibilityChange = "visibilitychange"
      else if document.mozHidden?
        hidden = "mozHidden"
        visibilityChange = "mozvisibilitychange"
      else if document.msHidden?
        hidden = "msHidden"
        visibilityChange = "msvisibilitychange"
      else if document.webkitHidden?
        hidden = "webkitHidden"
        visibilityChange = "webkitvisibilitychange"

      handleVisibilityChange = () =>
        @visible = document[hidden]
        # console.log('visibilitychange', @visible)
        ###*
        # @attribute {Boolean} visible=true Set when the window visibility changes, true if the window is currently visible
        # @readonly
        ###
        @sendEvent('visible', @visible)

      document.addEventListener(visibilityChange, handleVisibilityChange, false)
      @handle()

    startEventTest: () ->
      @events['width']?.length or @events['height']?.length

    handle: (event) =>
      ###*
      # @attribute {Number} width Set when the window width changes
      # @readonly
      ###
      @width = window.innerWidth
      @sendEvent('width', @width)
      ###*
      # @attribute {Number} height Set when the window height changes
      # @readonly
      ###
      @height = window.innerHeight
      @sendEvent('height', @height)
      return
      # console.log('window resize', event, @width, @height)