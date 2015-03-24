# A private layout used by the special value for width/height of 'auto'.
# This layout sizes the view to fit its child views.
class AutoPropertyLayout extends Layout
  startMonitoringSubview: (view) ->
    func = @update.bind(@)
    if @axis is 'x'
      @listenTo(view, 'x', func)
      @listenTo(view, 'width', func)
      @listenTo(view, 'boundsx', func)
      @listenTo(view, 'boundswidth', func)
    else
      @listenTo(view, 'y', func)
      @listenTo(view, 'height', func)
      @listenTo(view, 'boundsy', func)
      @listenTo(view, 'boundsheight', func)
    @listenTo(view, 'visible', func)

  stopMonitoringSubview: (view) ->
    func = @update.bind(@)
    if @axis is 'x'
      @stopListening(view, 'x', func)
      @stopListening(view, 'width', func)
      @stopListening(view, 'boundsx', func)
      @stopListening(view, 'boundswidth', func)
    else
      @stopListening(view, 'y', func)
      @stopListening(view, 'height', func)
      @stopListening(view, 'boundsy', func)
      @stopListening(view, 'boundsheight', func)
    @stopListening(view, 'visible', func)

  update: ->
    if not @locked and @axis
      # console.log('update', @axis)
      # Prevent inadvertent loops
      @locked = true

      svs = @subviews
      i = svs.length
      maxFunc = Math.max
      parent = @parent
      max = 0

      if @axis is 'x'
        # Find the farthest horizontal extent of any subview
        while i
          sv = svs[--i]
          unless @_skipX(sv) then max = maxFunc(max, sv.boundsx + maxFunc(0, sv.boundswidth))
        val = max + parent.__fullBorderPaddingWidth
        if parent.width isnt val
          parent.__noSpecialValueHandling = true
          parent.setAttribute('width', val)
      else
        # Find the farthest vertical extent of any subview
        while i
          sv = svs[--i]
          unless @_skipY(sv) then max = maxFunc(max, sv.boundsy + maxFunc(0, sv.boundsheight))
        val = max + parent.__fullBorderPaddingHeight
        if parent.height isnt val
          parent.__noSpecialValueHandling = true
          parent.setAttribute('height', val)

      @locked = false

  # No need to measure children that are not visible or that use a percent
  # position or size since this leads to circular sizing constraints.
  # Also skip children that use an align of bottom/right or center/middle
  # since those also lead to circular sizing constraints.
  _skipX: (view) ->
    return not view.visible or view.__percentFuncwidth? or view.__percentFuncx? or (view.__alignFuncx? and not view.__alignFuncx.autoOk)
  _skipY: (view) ->
    return not view.visible or view.__percentFuncheight? or view.__percentFuncy? or (view.__alignFuncy? and not view.__alignFuncy.autoOk)

return AutoPropertyLayout