  ###*
  # @aside guide constraints
  # @class dr.view {UI Components}
  # @extends dr.node
  # The visual base class for everything in dreem. Views extend dr.node to add the ability to set and animate visual attributes, and interact with the mouse.
  #
  # Views are positioned inside their parent according to their x and y coordinates.
  #
  # Views can contain methods, handlers, setters, constraints, attributes and other view, node or class instances.
  #
  # Views can be easily converted to reusable classes/tags by changing their outermost &lt;view> tags to &lt;class> and adding a name attribute.
  #
  # Views support a number of builtin attributes. Setting attributes that aren't listed explicitly will pass through to the underlying Sprite implementation.
  #
  # Views currently integrate with jQuery, so any changes made to their CSS via jQuery will automatically cause them to update.
  #
  # Note that dreem apps must be contained inside a top-level &lt;view>&lt;/view> tag.
  #
  # The following example shows a pink view that contains a smaller blue view offset 10 pixels from the top and 10 from the left.
  #
  #     @example
  #     <view width="200" height="100" bgcolor="lightpink">
  #
  #       <view width="50" height="50" x="10" y="10" bgcolor="lightblue"></view>
  #
  #     </view>
  #
  # Here the blue view is wider than its parent pink view, and because the clip attribute of the parent is set to false it extends beyond the parents bounds.
  #
  #     @example
  #     <view width="200" height="100" bgcolor="lightpink" clip="false">
  #
  #       <view width="250" height="50" x="10" y="10" bgcolor="lightblue"></view>
  #
  #     </view>
  #
  # Now we set the clip attribute on the parent view to true, causing the overflowing child view to be clipped at its parent's boundary.
  #
  #     @example
  #     <view width="200" height="100" bgcolor="lightpink" clip="true">
  #
  #       <view width="250" height="50" x="10" y="10" bgcolor="lightblue"></view>
  #
  #     </view>
  #
  # Here we demonstrate how unsupported attributes are passed to the underlying sprite system. We make the child view semi-transparent by setting opacity. Although this is not in the list of supported attributes it is still applied.
  #
  #     @example
  #     <view width="200" height="100" bgcolor="lightpink">
  #
  #       <view width="250" height="50" x="10" y="10" bgcolor="lightblue" opacity=".5"></view>
  #
  #     </view>
  #
  # It is convenient to [constrain](#!/guide/constraints) a view's size and position to attributes of its parent view. Here we'll position the inner view so that its inset by 10 pixels in its parent.
  #
  #     @example
  #     <view width="200" height="100" bgcolor="lightpink">
  #
  #       <view width="${this.parent.width-this.inset*2}" height="${this.parent.height-this.inset*2}" x="${this.inset}" y="${this.inset}" bgcolor="lightblue">
  #         <attribute name="inset" type="number" value="10"></attribute>
  #       </view>
  #
  #     </view>
  ###
  class View extends Node
    ###*
    # @attribute {Number} [x=0]
    # This view's x-position. There are several categories of allowed values.
    #   1) Fixed: If a number is provided the x-position will be a fixed
    #      pixel position relative to the parent view.
    #   2) Percentage: If a number followed by a '%' sign is provided the
    #      x-position will constrained to a percent of the parent views
    #      inner width.
    #   3) Aligned Left: If the string 'left' is provided the x-position will
    #      be constrained so that the view's left bound is aligned with the
    #      inner left edge of the parent view. To clarify, aligning left is
    #      different from a fixed x-position of 0 since it accounts for
    #      transformations applied to the view.
    #   4) Aligned Right: If the string 'right' is provided the x-position will
    #      be constrained so that the view's right bound is aligned with the
    #      inner right edge of the parent view. Like align left, this means
    #      transformations applied to the view are accounted for.
    #   5) Aligned Center: If the string 'center' or 'middle' is provided the 
    #      x-position will be constrained so that the midpoint of the width
    #      bound of the view is the same as the midpoint of the inner width of
    #      the parent view. Like align left, this means transformations applied
    #      to the view are accounted for.
    ###
    ###*
    # @attribute {Number} [y=0]
    # This view's y-position. There are several categories of allowed values.
    #   1) Fixed: If a number is provided the y-position will be a fixed
    #      pixel position relative to the parent view.
    #   2) Percentage: If a number followed by a '%' sign is provided the
    #      y-position will constrained to a percent of the parent views
    #      inner height.
    #   3) Aligned Top: If the string 'top' is provided the y-position will
    #      be constrained so that the view's top bound is aligned with the
    #      inner top edge of the parent view. To clarify, aligning top is
    #      different from a fixed y-position of 0 since it accounts for
    #      transformations applied to the view.
    #   4) Aligned Bottom: If the string 'bottom' is provided the y-position
    #      will be constrained so that the view's bottom bound is aligned with 
    #      the inner bottom edge of the parent view. Like align top, this means
    #      transformations applied to the view are accounted for.
    #   5) Aligned Middle: If the string 'middle' or 'center' is provided the 
    #      y-position will be constrained so that the midpoint of the height
    #      bound of the view is the same as the midpoint of the inner height of
    #      the parent view. Like align top, this means transformations applied
    #      to the view are accounted for.
    ###
    ###*
    # @attribute {Number} [width=0]
    # This view's width. There are several categories of allowed values.
    #   1) Fixed: If a number is provided the width will be a fixed
    #      pixel size.
    #   2) Percentage: If a number followed by a '%' sign is provided the
    #      width will constrained to a percent of the parent views
    #      inner width.
    #   3) Auto: If the string 'auto' is provided the width will be constrained
    #      to the maximum x bounds of the view children of this view. This
    #      feature is implemented like a Layout, so you can use ignorelayout
    #      on a child view to disregard them for auto sizing. Furthermore,
    #      views with a percentage width, percentage x, or an x-position of 
    #      'center' or 'right' will also be disregarded. Note that 'left' is 
    #      not ignored since it does not necessarily result in a circular
    #      constraint.
    ###
    ###*
    # @attribute {Number} [height=0]
    # This view's height. There are several categories of allowed values.
    #   1) Fixed: If a number is provided the height will be a fixed
    #      pixel size.
    #   2) Percentage: If a number followed by a '%' sign is provided the
    #      height will constrained to a percent of the parent views
    #      inner height.
    #   3) Auto: If the string 'auto' is provided the height will be constrained
    #      to the maximum y bounds of the view children of this view. This
    #      feature is implemented like a Layout, so you can use ignorelayout
    #      on a child view to disregard them for auto sizing. Furthermore,
    #      views with a percentage height, percentage y, or a y-position of 
    #      'center', 'middle' or 'bottom' will also be disregarded. Note that 
    #      'top' is not ignored since it does not necessarily result in a 
    #      circular constraint.
    ###
    ###*
    # @attribute {Boolean} isaligned Indicates that the x attribute is
    # set to one of the "special" alignment values.
    # @readonly
    ###
    ###*
    # @attribute {Boolean} isvaligned Indicates that the y attribute is
    # set to one of the "special" alignment values.
    # @readonly
    ###
    ###*
    # @attribute {Number} innerwidth The width of the view less padding and
    # border. This is the width child views should use if border or padding
    # is being used by the view.
    # @readonly
    ###
    ###*
    # @attribute {Number} innerheight The height of the view less padding and
    # border. This is the height child views should use if border or padding
    # is being used by the view.
    # @readonly
    ###
    ###*
    # @attribute {Number} boundsx The x position of the bounding box for the
    # view. This value accounts for rotation and scaling of the view.
    # @readonly
    ###
    ###*
    # @attribute {Number} boundsy The y position of the bounding box for the
    # view. This value accounts for rotation and scaling of the view.
    # @readonly
    ###
    ###*
    # @attribute {Number} boundsxdiff The difference between the x position
    # of the view and the boundsx of the view. Useful when you need to offset
    # a view to make it line up when it is scaled or rotated.
    # @readonly
    ###
    ###*
    # @attribute {Number} boundsydiff The difference between the y position
    # of the view and the boundsy of the view. Useful when you need to offset
    # a view to make it line up when it is scaled or rotated.
    # @readonly
    ###
    ###*
    # @attribute {Number} boundswidth The width of the bounding box for the
    # view. This value accounts for rotation and scaling of the view. This is
    # the width non-descendant views should use if the view is rotated or
    # scaled.
    # @readonly
    ###
    ###*
    # @attribute {Number} boundsheight The height of the bounding box for the
    # view. This value accounts for rotation and scaling of the view. This is
    # the height non-descendant views should use if the view is rotated or
    # scaled.
    # @readonly
    ###
    ###*
    # @attribute {Boolean} [clickable=false]
    # If true, this view recieves mouse events. Automatically set to true when an onclick/mouse* event is registered for this view.
    ###
    ###*
    # @attribute {Boolean} [clip=false]
    # If true, this view clips to its bounds
    ###
    ###*
    # @attribute {Boolean} [scrollable=false]
    # If true, this view clips to its bounds and provides scrolling to see content that overflows the bounds
    ###
    ###*
    # @attribute {Boolean} [scrollbars=false]
    # Controls the visibility of scrollbars if scrollable is true
    ###
    ###*
    # @attribute {Boolean} [visible=true]
    # If false, this view is invisible
    ###
    ###*
    # @attribute {String} bgcolor
    # Sets this view's background color
    ###
    ###*
    # @attribute {String} bordercolor
    # Sets this view's border color
    ###
    ###*
    # @attribute {String} borderstyle
    # Sets this view's border style (can be any css border-style value)
    ###
    ###*
    # @attribute {Number} border
    # Sets this view's border width
    ###
    ###*
    # @attribute {Number} padding
    # Sets this view's padding
    ###
    ###*
    # @attribute {Number} [xscale=1.0]
    # Sets this view's width scale
    ###
    ###*
    # @attribute {Number} [yscale=1.0]
    # Sets this view's height scale
    ###
    ###*
    # @attribute {Number} [z=0]
    # Sets this view's z position (higher values are on top of other views)
    #
    # *(note: setting a `z` value for a view implicitly sets its parent's `transform-style` to `preserve-3d`)*
    ###
    ###*
    # @attribute {Number} [rotation=0]
    # Sets this view's rotation in degrees.
    ###
    ###*
    # @attribute {String} [perspective=0]
    # Sets this view's perspective depth along the z access, values in pixels.
    # When this value is set, items further from the camera will appear smaller, and closer items will be larger.
    ###
    ###*
    # @attribute {Number} [opacity=1.0]
    # Sets this view's opacity, values can be a float from 0.0 to 1.0
    ###
    ###*
    # @attribute {Number} [scrollx=0]
    # Sets the horizontal scroll position of the view. Only relevant if
    # this.scrollable is true. Setting this value will generate both a
    # scrollx event and a scroll event.
    ###
    ###*
    # @attribute {Number} [scrolly=0]
    # Sets the vertical scroll position of the view. Only relevant if
    # this.scrollable is true. Setting this value will generate both a
    # scrolly event and a scroll event.
    ###
    ###*
    # @attribute {Number} [xanchor=0]
    # Sets the horizontal center of the view's transformations (such as 
    # rotation) There are several categories of allowed values:
    #   1) Fixed: If a number is provided the x anchor will be a fixed
    #      pixel position.
    #   2) Left: If the string 'left' is provided the left edge of the view
    #      will be used. This is equivalent to a fixed value of 0.
    #   3) Right: If the string 'right' is provided the right edge of the
    #      view will be used.
    #   4) Center: If the string 'center' is provided the midpoint of the
    #      width of the view will be used.
    ###
    ###*
    # @attribute {Number} [yanchor=0]
    # Sets the vertical center of the view's transformations (such as 
    # rotation) There are several categories of allowed values:
    #   1) Fixed: If a number is provided the y anchor will be a fixed
    #      pixel position.
    #   2) Top: If the string 'top' is provided the top edge of the view
    #      will be used. This is equivalent to a fixed value of 0.
    #   3) Bottom: If the string 'bottom' is provided the bottom edge of the
    #      view will be used.
    #   4) Center: If the string 'center' is provided the midpoint of the
    #      height of the view will be used.
    ###
    ###*
    # @attribute {Number} [zanchor=0]
    # Sets the z-axis center of the view's transformations (such as rotation)
    ###
    ###*
    # @attribute {String} [cursor='pointer']
    # Cursor that should be used when the mouse is over this view, can be any CSS cursor value. Only applies when clickable is true.
    ###
    ###*
    # @attribute {String} [boxshadow]
    # Drop shadow using standard CSS format (offset-x offset-y blur-radius spread-radius color). For example: "10px 10px 5px 0px #888888".
    ###
    ###*
    # @attribute {String} [ignorelayout='false']
    # Indicates if layouts should ignore this view or not. A variety of
    # configuration mechanisms are supported. Provided true or false will
    # cause the view to be ignored or not by all layouts. If instead a
    # serialized map is provided the keys of the map will target values
    # the layouts with matching names. A special key of '*' indicates a
    # default value for all layouts not specifically mentioned in the map.
    ###
    ###*
    # @attribute {String} [layouthint='']
    # Provides per view hinting to layouts. The specific hints supported
    # are layout specific. Hints are provided as a map. A map key may
    # be prefixied with the name of a layout followed by a '/'. This will
    # target that hint at a specific layout. If the prefix is ommitted or
    # a prefix of '*' is used the hint will be targeted to all layouts.
    ###

    ###*
    # @event onclick
    # Fired when this view is clicked
    # @param {dr.view} view The dr.view that fired the event
    ###
    ###*
    # @event onmouseover
    # Fired when the mouse moves over this view
    # @param {dr.view} view The dr.view that fired the event
    ###
    ###*
    # @event onmouseout
    # Fired when the mouse moves off this view
    # @param {dr.view} view The dr.view that fired the event
    ###
    ###*
    # @event onmousedown
    # Fired when the mouse goes down on this view
    # @param {dr.view} view The dr.view that fired the event
    ###
    ###*
    # @event onmouseup
    # Fired when the mouse goes up on this view
    # @param {dr.view} view The dr.view that fired the event
    ###
    ###*
    # @event onscroll
    # Fired when the scroll position changes. Also provides information about
    # the scroll width and scroll height though it does not refire when those
    # values change since the DOM does not generate an event when they do. This
    # event is typically delayed by a few millis after setting scrollx or
    # scrolly since the underlying DOM event fires during the next DOM refresh
    # performed by the browser.
    # @param {Object} scroll The following four properties are defined:
    #     scrollx:number The horizontal scroll position.
    #     scrolly:number The vertical scroll position.
    #     scrollwidth:number The width of the scrollable area. Note this is
    #       not the maximum value for scrollx since that depends on the bounds
    #       of the scrollable view. The maximum can be calculated using this
    #       formula: scrollwidth - view.width + 2*view.border
    #     scrollheight:number The height of the scrollable area. Note this is
    #       not the maximum value for scrolly since that depends on the bounds
    #       of the scrollable view. The maximum can be calculated using this
    #       formula: scrollheight - view.height + 2*view.border
    ###
    construct: (el, attributes) ->
      ###*
      # @attribute {dr.view[]} subviews
      # @readonly
      # An array of this views's child views
      ###
      ###*
      # @attribute {dr.layout[]} layouts
      # @readonly
      # An array of this views's layouts. Only defined when needed.
      ###
      @subviews = []
      types = {
        border:'positivenumber'
        borderstyle:'string'
        bottomborder:'positivenumber'
        bottompadding:'positivenumber'
        class:'string'
        clickable:'boolean'
        clip:'boolean'
        cursor:'string'
        height:'size'
        ignorelayout:'json'
        layouthint:'json'
        leftborder:'positivenumber'
        leftpadding:'positivenumber'
        opacity:'number'
        padding:'positivenumber'
        rightborder:'positivenumber'
        rightpadding:'positivenumber'
        rotation:'number'
        scrollable:'boolean'
        scrollbars:'boolean'
        scrollx:'number'
        scrolly:'number'
        skin:'string',
        topborder:'positivenumber'
        toppadding:'positivenumber'
        visible:'boolean'
        width:'size'
        x:'x'
        xanchor:'string'
        xscale:'number'
        y:'y'
        yanchor:'string'
        yscale:'number'
        z:'number'
        zanchor:'number'
        $tagname:'string'
        $textcontent:'string'
      }

      for key, type of attributes.$types
        types[key] = type
      @_declaredTypes = attributes.$types = types

      # Used in many calculations so precalculating for performance.
      @__fullBorderPaddingWidth = @__fullBorderPaddingHeight = 0

      # Default values
      @xanchor = @yanchor = 'center'
      @cursor = 'pointer'
      @bgcolor = @bordercolor = 'transparent'
      @borderstyle = 'solid'
      @skin = ''
      @leftborder = @rightborder = @topborder = @bottomborder = @border =
        @leftpadding = @rightpadding = @toppadding = @bottompadding = @padding =
        @x = @y = @width = @height = @innerwidth = @innerheight =
        @boundsxdiff = @boundsydiff = @boundsx = @boundsy = @boundswidth = @boundsheight = 
        @zanchor = @scrollx = @scrolly = 0
      @opacity = 1
      @clip = @scrollable = @clickable = @isaligned = @isvaligned = @ignorelayout = @scrollbars = false
      @visible = true

      # console.log 'sprite tagname', attributes.$tagname
      @_createSprite(el, attributes)
      super
      # console.log 'new view', el, attributes, @

    initialize: (skipevents) ->
      if @__autoLayoutwidth then @__autoLayoutwidth.setAttribute('locked', false)
      if @__autoLayoutheight then @__autoLayoutheight.setAttribute('locked', false)
      @__updateBounds()
      super

    _createSprite: (el, attributes) ->
      @sprite = new Sprite(el, @, attributes.$tagname)

    destroy: (skipevents) ->
      # console.log 'destroy view', @
      super
      @_removeFromParent('subviews') unless skipevents

      @sprite.destroy()
      @sprite = null

    defaultSetAttributeBehavior: (name, value) ->
      #xxxx
      existing = @[name]
      super
      value = @[name]
      if existing isnt value then @sprite.setAttribute(name, value)

    getBoundsRelativeToParent: () ->
      xanchor = @xanchor
      yanchor = @yanchor
      w = @width
      h = @height

      if xanchor is 'left'
        xanchor = 0
      else if xanchor is 'center'
        xanchor = w / 2
      else if xanchor is 'right'
        xanchor = w
      else
        xanchor = Number(xanchor)

      if yanchor is 'top'
        yanchor = 0
      else if yanchor is 'center'
        yanchor = h / 2
      else if yanchor is 'bottom'
        yanchor = h
      else
        yanchor = Number(yanchor)

      # Create a path from the 4 corners of the normal view box and then apply
      # the transform to get the bounding box.
      x1 = @x
      x2 = x1 + w
      y1 = @y
      y2 = y1 + h
      (new Path([x1,y1,x2,y1,x2,y2,x1,y2])).transformAroundOrigin(@xscale, @yscale, @rotation, xanchor + x1, yanchor + y1).getBoundingBox()

    __updateBounds: () ->
      if @__boundsAreDifferent
        bounds = @getBoundsRelativeToParent()
        width = bounds.width
        height = bounds.height
        x = bounds.x
        y = bounds.y
        xdiff = @x - x
        ydiff = @y - y
      else
        x = @x
        y = @y
        xdiff = ydiff = 0
        width = @width
        height = @height

      if not closeTo(@boundsx, x) then @setAndFire('boundsx', x)
      if not closeTo(@boundsy, y) then @setAndFire('boundsy', y)
      if not closeTo(@boundswidth, width) then @setAndFire('boundswidth', width)
      if not closeTo(@boundsheight, height) then @setAndFire('boundsheight', height)
      if not closeTo(@boundsxdiff, xdiff) then @setAndFire('boundsxdiff', xdiff)
      if not closeTo(@boundsydiff, ydiff) then @setAndFire('boundsydiff', ydiff)

    # Returns true if a special value is encountered for alignment so that
    # the setAttribute method can stop processing the value.
    __setupAlignConstraint: (name, value) ->
      funcKey = '__alignFunc' + name
      return unless typeof value is 'string' or @[funcKey]

      # The root view can't be aligned
      parent = @parent
      return unless parent instanceof Node

      if name is 'x'
        isX = true
        axis = 'innerwidth'
        boundsdiff = 'boundsxdiff'
        boundssize = 'boundswidth'
        alignattr = 'isaligned'
      else
        isX = false
        axis = 'innerheight'
        boundsdiff = 'boundsydiff'
        boundssize = 'boundsheight'
        alignattr = 'isvaligned'

      # Remove existing function if found
      oldFunc = @[funcKey]
      if oldFunc
        @stopListening(parent, axis, oldFunc)
        @stopListening(@, boundsdiff, oldFunc)
        @stopListening(@, boundssize, oldFunc)
        delete @[funcKey]
        if @[alignattr] then @setAndFire(alignattr, false)

      # Only process new values that are strings
      return unless typeof value is 'string'

      # Normalize to lowercase
      normValue = value.toLowerCase()

      # Handle special values
      self = @
      if normValue is 'begin' or (isX and normValue is 'left') or (not isX and normValue is 'top')
        func = @[funcKey] = () ->
          val = self[boundsdiff]
          if self[name] isnt val
            self.__noSpecialValueHandling = true
            self.setAttribute(name, val)
        func.autoOk = true # Allow auto width/height to work with top/left aligned subviews.
      else if normValue is 'middle' or normValue is 'center'
        func = @[funcKey] = () ->
          self.__noSpecialValueHandling = true
          self.setAttribute(name, ((parent[axis] - self[boundssize]) / 2) + self[boundsdiff])
        @listenTo(parent, axis, func)
        @listenTo(@, boundssize, func)
      else if normValue is 'end' or (isX and normValue is 'right') or (not isX and normValue is 'bottom')
        func = @[funcKey] = () ->
          self.__noSpecialValueHandling = true
          self.setAttribute(name, parent[axis] - self[boundssize] + self[boundsdiff])
        @listenTo(parent, axis, func)
        @listenTo(@, boundssize, func)
      else if normValue is 'none'
        return true

      if func
        @listenTo(@, boundsdiff, func)
        func.call()
        if not @[alignattr] then @setAndFire(alignattr, true)
        return true

    # Returns true if a special value is encountered for auto sizing so that
    # the setAttribute method can stop processing the value.
    __setupAutoConstraint: (name, value, axis) ->
      layoutKey = '__autoLayout' + name
      return unless value is 'auto' or @[layoutKey]

      oldLayout = @[layoutKey]
      if oldLayout
        oldLayout.destroy()
        delete @[layoutKey]
      if value is 'auto'
        @[layoutKey] = new AutoPropertyLayout(null, {parent:@, axis:axis, locked:if @inited then 'false' else 'true'})
        unless @inited
          @__noSpecialValueHandling = true
          @setAttribute(name, 0) # An initial value is still necessary.
        return true

    # Returns true if a special value is encountered for percent position or
    # size so that the setAttribute method can stop processing the value.
    __setupPercentConstraint: (name, value, axis) ->
      funcKey = '__percentFunc' + name
      return unless typeof value is 'string' or @[funcKey]
      oldFunc = @[funcKey]
      parent = @parent

      # Handle rootview case using dr.window
      unless parent instanceof Node
        parent = dr.window
        axis = axis.substring(5)

      if oldFunc
        @stopListening(parent, axis, oldFunc)
        delete @[funcKey]
      if matchPercent.test(value)
        self = @
        scale = parseInt(value)/100
        func = @[funcKey] = () ->
          self.__noSpecialValueHandling = true
          self.setAttribute(name, parent[axis] * scale)
        @listenTo(parent, axis, func)
        func.call()
        return true

    set_parent: (parent) ->
      # console.log 'view set_parent', parent, @
      retval = super

      # store references subviews
      if parent instanceof View
        parent.subviews.push(@)
        parent.sendEvent('subviews', @)
        parent = parent.sprite

      @sprite.set_parent(parent)
      retval

    set_id: (v) ->
      retval = super
      @sprite.set_id(v)
      retval

    set_class: (v) ->
      if @class isnt v
        @sprite.set_class(v)
        @setAndFire('class', v)
      noop

    set_clip: (v) ->
      if @clip isnt v
        @sprite.set_clip(v)
        @setAndFire('clip', v)
      noop

    set_scrollable: (v) ->
      if @scrollable isnt v
        @sprite.set_scrollable(v)
        @setAndFire('scrollable', v)
      noop

    set_scrollbars: (v) ->
      if @scrollbars isnt v
        @sprite.set_scrollbars(v)
        @setAndFire('scrollbars', v)
      noop

    set_scrollx: (v) ->
      if isNaN v
        v = 0
      else
        v = Math.max(0, Math.min(@sprite.el.scrollWidth - @width + @leftborder + @rightborder, v))
      if @scrollx isnt v
        @sprite.set_scrollx(v)
        @setAndFire('scrollx', v)
      noop

    set_scrolly: (v) ->
      if isNaN v
        v = 0
      else
        v = Math.max(0, Math.min(@sprite.el.scrollHeight - @height + @topborder + @bottomborder, v))
      if @scrolly isnt v
        @sprite.set_scrolly(v)
        @setAndFire('scrolly', v)
      noop

    set_visible: (v) ->
      if @visible isnt v
        @sprite.set_visible(v)
        @setAndFire('visible', v)
      noop

    set_bgcolor: (v) ->
      if @bgcolor isnt v
        @sprite.setAttribute('bgcolor', v)
        @setAndFire('bgcolor', v)
      noop

    set_x: (v) ->
      if not @__noSpecialValueHandling
        if @__setupPercentConstraint('x', v, 'innerwidth') then return noop
        if @__setupAlignConstraint('x', v) then return noop
      else
        @__noSpecialValueHandling = false
      
      if @x isnt v
        @sprite.set_x(v)
        # Update boundsx since it won't get updated if we're in an event loop
        if @__boundsAreDifferent and v - @boundsxdiff isnt @boundsx
          @sendEvent('boundsx', @boundsx = v - @boundsxdiff)
        @setAndFire('x', v)
        if @inited then @__updateBounds()
      noop

    set_y: (v) ->
      if not @__noSpecialValueHandling
        if @__setupPercentConstraint('y', v, 'innerheight') then return noop
        if @__setupAlignConstraint('y', v) then return noop
      else
        @__noSpecialValueHandling = false
      
      if @y isnt v
        @sprite.set_y(v)
        # Update boundsy since it won't get updated if we're in an event loop
        if @__boundsAreDifferent and v - @boundsydiff isnt @boundsy
          @sendEvent('boundsy', @boundsy = v - @boundsydiff)
        @setAndFire('y', v)
        if @inited then @__updateBounds()
      noop

    set_width: (v, noDomChange) ->
      # The noDomChange param is used by sizeToDom to prevent overwriting of 
      # a width value of 'auto' on the Sprite.
      
      if not @__noSpecialValueHandling
        if @__setupPercentConstraint('width', v, 'innerwidth') then return noop
        if @__setupAutoConstraint('width', v, 'x') then return noop
      else
        @__noSpecialValueHandling = false
      
      # Prevent width smaller than border and padding
      v = Math.max(v, @__fullBorderPaddingWidth)
      if @width isnt v
        @sprite.setAttribute('width', v) unless noDomChange
        @setAndFire('innerwidth', v - @__fullBorderPaddingWidth)
        @setAndFire('width', v)
        if @inited then @__updateBounds()
      noop

    set_height: (v, noDomChange) ->
      # The noDomChange param is used by sizeToDom to prevent overwriting of 
      # a height value of 'auto' on the Sprite.
      
      if not @__noSpecialValueHandling
        if @__setupPercentConstraint('height', v, 'innerheight') then return noop
        if @__setupAutoConstraint('height', v, 'y') then return noop
      else
        @__noSpecialValueHandling = false
      
      # Prevent height smaller than border and padding
      v = Math.max(v, @__fullBorderPaddingHeight)
      if @height isnt v
        @sprite.setAttribute('height', v) unless noDomChange
        @setAndFire('innerheight', v - @__fullBorderPaddingHeight)
        @setAndFire('height', v)
        if @inited then @__updateBounds()
      noop

    set_border: (v) ->
      @__lockBPRecalc = true
      @setAttribute('topborder', v)
      @setAttribute('bottomborder', v)
      @setAttribute('leftborder', v)
      @setAttribute('rightborder', v)
      @__lockBPRecalc = false

      @setAndFire('border', v)
      @__updateInnerWidth()
      @__updateInnerHeight()
      noop

    set_topborder: (v) ->
      @sprite.setAttribute('topborder', v)
      @setAndFire('topborder', v)
      unless @__lockBPRecalc
        @__updateBorder()
        @__updateInnerHeight()
      noop

    set_bottomborder: (v) ->
      @sprite.setAttribute('bottomborder', v)
      @setAndFire('bottomborder', v)
      unless @__lockBPRecalc
        @__updateBorder()
        @__updateInnerHeight()
      noop

    set_leftborder: (v) ->
      @sprite.setAttribute('leftborder', v)
      @setAndFire('leftborder', v)
      unless @__lockBPRecalc
        @__updateBorder()
        @__updateInnerWidth()
      noop

    set_rightborder: (v) ->
      @sprite.setAttribute('rightborder', v)
      @setAndFire('rightborder', v)
      unless @__lockBPRecalc
        @__updateBorder()
        @__updateInnerWidth()
      noop

    __updateBorder: () ->
      test = @topborder
      if @bottomborder is test and @leftborder is test and @rightborder is test
        @setAndFire('border', test)
      else if @border?
        @setAndFire('border', undefined)

    set_padding: (v) ->
      @__lockBPRecalc = true
      @setAttribute('toppadding', v)
      @setAttribute('bottompadding', v)
      @setAttribute('leftpadding', v)
      @setAttribute('rightpadding', v)
      @__lockBPRecalc = false
      
      @setAndFire('padding', v)
      @__updateInnerWidth()
      @__updateInnerHeight()
      noop

    set_toppadding: (v) ->
      @sprite.setAttribute('toppadding', v)
      @setAndFire('toppadding', v)
      unless @__lockBPRecalc
        @__updatePadding()
        @__updateInnerHeight()
      noop

    set_bottompadding: (v) ->
      @sprite.setAttribute('bottompadding', v)
      @setAndFire('bottompadding', v)
      unless @__lockBPRecalc
        @__updatePadding()
        @__updateInnerHeight()
      noop

    set_leftpadding: (v) ->
      @sprite.setAttribute('leftpadding', v)
      @setAndFire('leftpadding', v)
      unless @__lockBPRecalc
        @__updatePadding()
        @__updateInnerWidth()
      noop

    set_rightpadding: (v) ->
      @sprite.setAttribute('rightpadding', v)
      @setAndFire('rightpadding', v)
      unless @__lockBPRecalc
        @__updatePadding()
        @__updateInnerWidth()
      noop

    __updatePadding: () ->
      test = @toppadding
      if @bottompadding is test and @leftpadding is test and @rightpadding is test
        @setAndFire('padding', test)
      else if @padding?
        @setAndFire('padding', undefined)

    __updateInnerWidth: () ->
      @__fullBorderPaddingWidth = inset = @leftborder + @rightborder  + @leftpadding + @rightpadding
      # Prevent width less than horizontal border padding
      if inset > @width
        @__noSpecialValueHandling = true
        @setAttribute('width', inset, true)
      @setAndFire('innerwidth', @width - inset)

    __updateInnerHeight: () ->
      @__fullBorderPaddingHeight = inset = @topborder  + @bottomborder + @toppadding + @bottompadding
      # Prevent height less than vertical border padding
      if inset > @height
        @__noSpecialValueHandling = true
        @setAttribute('height', inset, true)
      @setAndFire('innerheight', @height - inset)

    set_clickable: (v) ->
      if @clickable isnt v
        @sprite.set_clickable(v)
        @setAndFire('clickable', v)
      noop
      
    set_cursor: (v) ->
      if @cursor isnt v
        @sprite.set_cursor(v)
        @setAndFire('cursor', v)
      noop

    __updateTransform: () ->
      transform = ''

      # Generate scale CSS
      xscale = @xscale
      if !@xscale? then xscale = @xscale = 1
      yscale = @yscale
      if !@yscale? then yscale = @yscale = 1
      if xscale isnt 1 or yscale isnt 1 then transform += 'scale3d(' + xscale + ',' + yscale + ',1.0)'

      # Generate rotation CSS
      @rotation ||= 0
      if @rotation % 360 isnt 0
        transform += ' rotate3d(0,0,1.0,' + @rotation + 'deg)'

      # Make it easy to determine that the bounds are different than the
      # simple x, y, width, height box
      @__boundsAreDifferent = transform isnt ''

      # Generate z-order CSS
      @z ||= 0
      if @z isnt 0
        transform += ' translate3d(0,0,' + @z + 'px)'
        @parent.sprite.setAttribute('transform-style', 'preserve-3d')

      # Generate and apply transform-origin CSS if a transform exists
      if transform isnt ''
        xanchor = @xanchor
        if xanchor isnt 'left' and xanchor isnt 'right' and xanchor isnt 'center' then xanchor += 'px'
        yanchor = @yanchor
        if yanchor isnt 'top' and yanchor isnt 'bottom' and yanchor isnt 'center' then yanchor += 'px'
        @sprite.setAttribute('transform-origin', xanchor + ' ' + yanchor + ' ' + @zanchor + 'px')

      # Apply transform CSS
      @sprite.setAttribute('transform', transform)

    set_perspective: (v) ->
      if v is '0'
        'none'
      else
        v + 'px'

    set_xscale: (v) ->
      if v isnt @xscale
        @setAndFire('xscale', v)
        @__updateTransform()
        if @inited then @__updateBounds()
      noop

    set_yscale: (v) ->
      if v isnt @yscale
        @setAndFire('yscale', v)
        @__updateTransform()
        if @inited then @__updateBounds()
      noop

    set_rotation: (v) ->
      if v isnt @rotation
        @setAndFire('rotation', v)
        @__updateTransform()
        if @inited then @__updateBounds()
      noop

    set_z: (v) ->
      if v isnt @z
        @sprite.setAttribute('z', v)
        @setAndFire('z', v)
        @__updateTransform()
      noop

    set_xanchor: (v) ->
      if !v? or v is '' or v is 'undefined' then v = 'center'
      if v isnt @xanchor
        @setAndFire('xanchor', v)
        @__updateTransform()
        if @inited then @__updateBounds()
      noop

    set_yanchor: (v) ->
      if !v? or v is '' or v is 'undefined' then v = 'center'
      if v isnt @yanchor
        @setAndFire('yanchor', v)
        @__updateTransform()
        if @inited then @__updateBounds()
      noop

    set_zanchor: (v) ->
      if !v? or v is '' then v = 0
      if v isnt @zanchor
        @setAndFire('zanchor', v)
        @__updateTransform()
      noop

    set_skin: (name) ->
      if name isnt @skin
        @skin = name
        @reskin()
        @setAndFire('skin', name)
      noop

    attachSkinListener: () ->
      if !@$skinlistner
        @$skinlistner = true
        @listenTo @, 'subviewAdded', (sv)->
          sv.attachSkinListener()
          sv.reskin()

    reskin: () ->
      @attachSkinListener()

      unless window.dr.skins
        console.log("<skin> hasn't been initialized yet", @)
        return

      if @skin
        skins = @skin.split(/[^A-Za-z0-9_-]+/)
        for skinname in skins
          if skin = window.dr.skins[skinname]
            skin.applyTo(@)
          else
            console.log('Cannot apply skin:', skinname)

      else if @parent && @parent.reskin
        return @parent.reskin()

    moveToFront: () ->
      for subview in @parent.subviews
        subview.setAttribute 'z', 0 unless subview.z
        @z = subview.z + 1 if @z <= subview.z
      @__updateTransform()

    ###*
    # @method moveToBack
    # Moves view behind all other sibling views
    ###
    moveToBack: () ->
      for subview in @parent.subviews
        subview.setAttribute 'z', 0 unless subview.z
        @z = subview.z - 1 if @z >= subview.z
      @__updateTransform()

    ###*
    # @method moveInFrontOf
    # Moves view to the front of sibling view
    # @param {dr.view} View to move in front of
    ###
    moveInFrontOf: (otherView) ->
      if otherView
        otherView.setAttribute 'z', 0 unless otherView.z
        @z = otherView.z + 1
        @__updateTransform()

    ###*
    # @method moveBehind
    # Moves view to the behind sibling view
    # @param {dr.view} View to move behind
    ###
    moveBehind: (otherView) ->
      if otherView
        otherView.setAttribute 'z', 0 unless otherView.z
        @z = otherView.z - 1
        @__updateTransform()

    ###*
    # Calls doSubviewAdded/doLayoutAdded if the added subnode is a view or
    # layout respectively. Subclasses should call super.
    # @private
    ###
    doSubnodeAdded: (node) ->
      if node instanceof View
        # update bounds before firing subviewAdded since some layouts
        # (specifically alignlayout) expect the bounds of a view to be updated
        # before updating the layout.
        node.__updateBounds()
        
        ###*
        # @event subviewAdded
        # Fired when a subview is added to this view.
        # @param {dr.view} view The dr.view that was added
        ###
        @sendEvent('subviewAdded', node)
        @doSubviewAdded(node);
      else if node instanceof Layout
        @doLayoutAdded(node);

    ###*
    # Calls doSubviewRemoved/doLayoutRemoved if the removed subnode is a view or
    # layout respectively. Subclasses should call super.
    # @private
    ###
    doSubnodeRemoved: (node) ->
      if node instanceof View
        ###*
        # @event subviewRemoved
        # Fired when a subview is removed from this view.
        # @param {dr.view} view The dr.view that was removed
        ###
        @sendEvent('subviewRemoved', node)
        @doSubviewRemoved(node);
      else if node instanceof Layout
        @doLayoutRemoved(node);

    ###*
    # Called when a subview is added to this view. Provides a hook for
    # subclasses. No need for subclasses to call super. Do not call this
    # method to add a subview. Instead call setParent.
    # @param {dr.view} sv The subview that was added.
    # @return {void}
    ###
    doSubviewAdded: (sv) ->
      # Empty implementation by default

    ###*
    # Called when a subview is removed from this view. Provides a hook for
    # subclasses. No need for subclasses to call super. Do not call this
    # method to remove a subview. Instead call _removeFromParent.
    # @param {dr.view} sv The subview that was removed.
    # @return {void}
    ###
    doSubviewRemoved: (sv) ->
      # Empty implementation by default

    ###*
    # Called when a layout is added to this view. Provides a hook for
    # subclasses. No need for subclasses to call super. Do not call this
    # method to add a layout. Instead call setParent.
    # @param {dr.layout} layout The layout that was added.
    # @return {void}
    ###
    doLayoutAdded: (layout) ->
      # Empty implementation by default

    ###*
    # Called when a layout is removed from this view. Provides a hook for
    # subclasses. No need for subclasses to call super. Do not call this
    # method to remove a layout. Instead call _removeFromParent.
    # @param {dr.layout} layout The layout that was removed.
    # @return {void}
    ###
    doLayoutRemoved: (layout) ->
      # Empty implementation by default

    ###*
    # Gets the value of a named layout hint.
    # @param {String} layoutName The name of the layout to match.
    # @param {String} key The name of the hint to match.
    # @return {*} The value of the hint or undefined if not found.
    ###
    getLayoutHint: (layoutName, hintName) ->
      hints = this.layouthint
      if hints
        hint = hints[layoutName + '/' + hintName]
        if hint? then return hint
        
        hint = hints[hintName]
        if hint? then return hint
        
        hint = hints['*/' + hintName]
        if hint? then return hint
      else
        # No hints exist

    getAbsolute: () ->
      @sprite.getAbsolute()