###*
# @class BitmapSprite
# @private
# Abstracts the underlying visual primitives for a bitmap component
###
class BitmapSprite extends Sprite
  constructor: (view, jqel, attributes) ->
    super
    @el.style.backgroundSize = 'cover'

  destroy: ->
    super
    if @_img
      @_img.$view = null
      @_img = null

  setSrc: (v) ->
    el = @el
    view = el.$view
    style = el.style
    
    if not v
      style.backgroundImage = ''
      if view.inited then view.sendEvent('load', {width:0, height:0})
    else
      style.backgroundImage = 'url("' + v + '")'
      style.backgroundRepeat = 'no-repeat'
      
      img = @_img;
      if not img
        img = @_img = new Image()
        img.$view = view
      img.src = v
      sprite = @
      img.onload = () ->
        view = @$view
        if view
          sprite.naturalWidth = img.width
          sprite.naturalHeight = img.height
          if sprite.naturalSize
            view.setAttribute('width', img.width)
            view.setAttribute('height', img.height)
          view.sendEvent('load', {width:img.width, height:img.height})
      img.onerror = () ->
        view = @$view
        if view
          sprite.naturalWidth = sprite.naturalHeight = undefined
          view.sendEvent('error', img)

  setStretches: (v) ->
    if v is 'scale'
      v = 'contain'
    else if v is 'true'
      v = '100% 100%'
    else
      v = 'cover'
    @el.style.backgroundSize = v


  setNaturalSize: (v) ->
    @naturalSize = v
    if v
      img = @_img
      if img and @naturalWidth? and @naturalHeight?
        view = img.$view
        view.setAttribute('width', @naturalWidth)
        view.setAttribute('height', @naturalHeight)

return BitmapSprite