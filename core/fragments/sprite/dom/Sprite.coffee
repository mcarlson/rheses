###*
# @class Sprite
# @private
# Abstracts the underlying visual primitives (currently HTML) from dreem's view system.
###
class Sprite
#    guid = 0
  constructor: (view, jqel, attributes) ->
    tagname = attributes.$tagname or 'div'
    
    # console.log 'new sprite', jqel, view, tagname
    if not jqel?
      # console.log 'creating element', tagname
      @el = document.createElement(tagname)
      # prevent duplicate initializations
      @el.$init = true
    # else if jqel instanceof jQuery
    #   @el = jqel[0]
    else if jqel instanceof HTMLElement
      @el = jqel
    # console.log 'sprite el', @el, @
    @el.$view = view

    # normalize to jQuery object
#      guid++
#      jqel.attr('id', 'jqel-' + guid) if not jqel.attr('id')
    @css_baseclass ?= 'sprite'
    @_updateClass()

  setAttribute: (name, value) ->
    switch name
      # Attributes that map to DOM element style attributes
      when 'width', 'height', 'z', 'opacity', 'bgcolor', 'color', 'whitespace', 'fontsize', 'fontfamily', 'fontweight', 'text-transform', 'boxshadow', 'leftpadding', 'rightpadding', 'toppadding', 'bottompadding', 'leftborder', 'rightborder', 'topborder', 'bottomborder', 'bordercolor', 'borderstyle'
        @setStyle(name, value)
      when 'bold'
        @setStyle(name, if value then 'bold' else 'normal')
      when 'italic'
        @setStyle(name, if value then 'italic' else 'normal')
      when 'smallcaps'
        @setStyle(name, if value then 'small-caps' else 'normal')
      when 'ellipsis'
        @__ellipsis = value
        @setStyle(name, if value then 'ellipsis' else 'clip')
        @__updateOverflow()
      
      # Attributes that map to DOM element style attributes but need a vendor prefix
      when 'perspective', 'transform-style', 'transform-origin', 'transform'
         @setStyle(capabilities.prefix.css + name, value)
      
      # Attributes that map to DOM element attributes
        # none for now
      
      else
        # Attributes with no entry in _declaredTypes are adhoc so we
        # attempt to set style with them to enable a passthru.
        types = @el.$view._declaredTypes
        if !types[name]? then @setStyle(name, value)

  setStyle: do (isWebkit = capabilities.prefix.dom is 'WebKit') ->
    # WORKAROUND only needed for Webkit browsers.
    if isWebkit
      (name, value, internal, el=@el) ->
        value ?= ''
        name = stylemap[name] if name of stylemap
        el.style[name] = value

        # WORKAROUND: Chrome and Safari (Webkit?) browsers only update position on
        # borderLeftWidth and paddingLeft change. Fix is to tweak the padding 
        # by +/- a small value to trigger a change but prevent value drift.
        if name is 'borderTopWidth' or name is 'paddingTop'
          # Perturb smaller since the browser appears to do a ceiling for
          # calculating the DOM element scrollLeft. This will give the expected
          # value whereas pertubing larger would give a value 1 greater than
          # expected for scrollLeft.
          if @__BP_TOGGLE = not @__BP_TOGGLE
            perturb = -0.001
          else
            perturb = 0.001
          v = el.style.paddingLeft
          el.style.paddingLeft = Number(v.substring(0, v.length - 2)) + perturb + 'px'
    else
      (name, value, internal, el=@el) ->
        value ?= ''
        name = stylemap[name] if name of stylemap
        el.style[name] = value

  set_parent: (parent) ->
    if parent instanceof Sprite
      parent = parent.el
    # else if parent instanceof jQuery
    #   parent = parent[0]

    # parent = $(parent) unless parent instanceof jQuery
    # parent.append(@jqel)
    # parent = parent[0] if parent instanceof jQuery
    # console.log 'set_parent', parent, @el
    # avoid appending twice, which messes with lexical order
    parent.appendChild(@el) unless @el.parentNode is parent

  set_id: (id) ->
    # console.log('setid', @id)
    @el.setAttribute('id', id)

  _cursorVal: () ->
    return if @__clickable then @__cursor or 'pointer' else ''

  set_scrollx: (v) ->
    if @el.scrollLeft isnt v then @el.scrollLeft = v

  set_scrolly: (v) ->
    if @el.scrollTop isnt v then @el.scrollTop = v

  set_cursor: (cursor) ->
    @__cursor = cursor
    @setStyle('cursor', @_cursorVal(), true)

  set_visible: (visible) ->
    # Move invisible elements to a very negative location so they won't
    # effect scrollable area. Ideally we could use display:none but we
    # can't because that makes measuring bounds not work.
    if visible
      value = null # default is 'inherit' which is what we want.
      view = @el.$view
      x = view.x
      y = view.y
    else
      value = 'hidden'
      x = y = -100000
    @setStyle('visibility', value, true)
    @setStyle('marginLeft', x, true)
    @setStyle('marginTop', y, true)

  set_x: (x) ->
    if @el.$view.visible then @setStyle('marginLeft', x, true)

  set_y: (y) ->
    if @el.$view.visible then @setStyle('marginTop', y, true)

  set_clickable: (clickable) ->
    # console.log('set_clickable', clickable)
    @__clickable = clickable
    @__updatePointerEvents()
    @setStyle('cursor', @_cursorVal(), true)

    # TODO: retrigger the event for the element below for IE and Opera? See http://stackoverflow.com/questions/3680429/click-through-a-div-to-underlying-elements
    # el = $(event.target)
    # el.hide()
    # $(document.elementFromPoint(event.clientX,event.clientY)).trigger(type)
    # el.show()

  set_clip: (clip) ->
    # console.log('set_clip', clip)
    @__clip = clip
    @__updateOverflow()

  set_scrollable: (scrollable) ->
    # console.log('set_scrollable', scrollable)
    @__scrollable = scrollable
    @__updateOverflow()
    @__updatePointerEvents()
    if scrollable
      $(@el).on('scroll', @_handleScroll)
    else
      $(@el).off('scroll', @_handleScroll)

  set_scrollbars: (scrollbars) ->
    @__scrollbars = scrollbars
    @_updateClass()

  _handleScroll: (event) =>
    domElement = event.target
    target = domElement.$view
    if target
      x = domElement.scrollLeft
      y = domElement.scrollTop
      if target.scrollx isnt x then target.setAttribute('scrollx', x)
      if target.scrolly isnt y then target.setAttribute('scrolly', y)

      # Prevent extra events when data has not changed
      oldEvt = @_lastScrollEvent
      newEvt = {scrollx:x, scrolly:y, scrollwidth:domElement.scrollWidth, scrollheight:domElement.scrollHeight}
      if not oldEvt or oldEvt.scrollx isnt newEvt.scrollx or oldEvt.scrolly isnt newEvt.scrolly or oldEvt.scrollwidth isnt newEvt.scrollwidth or oldEvt.scrollheight isnt newEvt.scrollheight
        target.sendEvent('scroll', newEvt)
        @_lastScrollEvent = newEvt

  __updateOverflow: () ->
    @setStyle('overflow',
      if @__scrollable
        'auto'
      else if @__clip or @__ellipsis
        'hidden'
      else
        ''
    , true)

  __updatePointerEvents: () ->
    @setStyle('pointer-events',
      if @__clickable or @__scrollable
        'auto'
      else
        ''
    , true)

  destroy: ->
    @el.parentNode.removeChild(@el)
    @el = @jqel = @el.$view = null

  setInnerHTML: (html) ->
    @el.innerHTML = html

  getInnerHTML: ->
    @el.innerHTML

  getBounds: () ->
    @el.getBoundingClientRect()

  getAbsolute: () ->
    bounds = @getBounds()
    {x:bounds.left + window.pageXOffset, y:bounds.top + window.pageYOffset}

  getScrollWidth: () ->
    @el.scrollWidth

  getScrollHeight: () ->
    @el.scrollHeight

  set_class: (classname='') ->
    @__classname = classname
    # console.log('setid', @id)
    @_updateClass()

  _updateClass: () ->
    classes = @css_baseclass
    classes += ' ' + @__classname if @__classname
    classes += ' ' + 'noscrollbar' if not @__scrollbars
    @el.setAttribute('class', classes)

if (capabilities.camelcss)
  # handle camelCasing CSS styles, e.g. background-color -> backgroundColor - not needed for webkit
  ss = Sprite::setStyle
  fcamelCase = ( all, letter ) ->
    letter.toUpperCase()
  rdashAlpha = /-([\da-z])/gi
  Sprite::setStyle = (name, value, internal, el=@el) ->
    if name.match(rdashAlpha)
      # console.log "replacing #{name}"
      name = name.replace(rdashAlpha, fcamelCase)
    ss(name, value, internal, el)

if (debug)
  # add warnings for unknown CSS properties
  knownstyles = ['width', 'height', 'background-color', 'opacity', 'padding', 'transform', 'transform-style', 'transform-origin', 'z-index', 'perspective', 'cursor', capabilities.prefix.css + 'transform', capabilities.prefix.css + 'transform-style', capabilities.prefix.css + 'transform-origin']
  ss2 = Sprite::setStyle
  Sprite::setStyle = (name, value, internal, el=@el) ->
    return if name == '$instanceattributes'
    if not internal and not (name of stylemap) and not (name in knownstyles)
      console.warn "Setting unknown CSS property #{name} = #{value} on ", @el.$view, stylemap, internal
    ss2(name, value, internal, el)

return Sprite