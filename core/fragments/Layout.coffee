###*
# @class dr.layout {Layout}
# @extends dr.node
# The base class for all layouts.
#
# When a new layout is added, it will automatically create and add itself to a layouts array in its parent. In addition, an onlayouts event is fired in the parent when the layouts array changes. This allows the parent to access the layout(s) later.
#
# Here is a view that contains a spacedlayout.
#
#     @example
#     <spacedlayout axis="y"></spacedlayout>
#
#     <view bgcolor="oldlace" width="auto" height="auto">
#       <spacedlayout>
#         <method name="startMonitoringSubview" args="view">
#           output.setAttribute('text', output.text + "View Added: " + view.$tagname + ":" + view.bgcolor + "\n");
#           this.super();
#         </method>
#       </spacedlayout>
#       <view width="50" height="50" bgcolor="pink" opacity=".3"></view>
#       <view width="50" height="50" bgcolor="plum" opacity=".3"></view>
#       <view width="50" height="50" bgcolor="lightblue" opacity=".3"></view>
#       <view width="50" height="50" bgcolor="blue" opacity=".3"></view>
#     </view>
#
#     <text id="output" multiline="true" width="300"></text>
#
###
class Layout extends Node
  construct: (el, attributes) ->
    attributes.$types ?= {}
    attributes.$types.locked = 'boolean'

    # Remember initial lock state so we can restore it after initialization
    # is complete. We will always lock a layout during initialization to
    # prevent extraneous updates
    if attributes.locked?
      attrLocked = if attributes.locked is 'true' then true else false
    @locked = true

    # Holds the views managed by the layout in the order they will be
    # layed out.
    @subviews = []

    super

    # Listen to the parent for added/removed views. Bind needed because the
    # callback scope is the monitored object not the monitoring object.
    @listenTo(@parent, 'subviewAdded', @addSubview.bind(@))
    @listenTo(@parent, 'subviewRemoved', @removeSubview.bind(@))
    @listenTo(@parent, 'init', @update.bind(@))

    # Store ourself in the parent layouts and fire event
    @parent.layouts ?= []
    @parent.layouts.push(@)
    @parent.sendEvent('layouts', @parent.layouts)

    # Start monitoring existing subviews
    subviews = @parent.subviews
    if subviews and @parent.inited
      for subview in subviews
        @addSubview(subview)

    # Restore initial lock state or unlock now that initialization is done.
    if attrLocked?
      @locked = attrLocked
    else
      @locked = false

    # Finally, update the layout once
    @update()

  destroy: (skipevents) ->
    @locked = true
    # console.log 'destroy layout', @
    super
    @_removeFromParent('layouts') unless skipevents

  ###*
  # Adds the provided view to the subviews array of this layout, starts
  # monitoring the view for changes and updates the layout.
  # @param {dr.view} view The view to add to this layout.
  # @return {void}
  ###
  addSubview: (view) ->
    self = @
    func = this.__ignoreFunc = (ignorelayout) ->
      if self.__removeSubview(@) is -1 then self.__addSubview(@)
    @startMonitoringSubviewForIgnore(view, func)
    @__addSubview(view)

  __addSubview: (view) ->
    if @ignore(view) then return
    @subviews.push(view)
    @startMonitoringSubview(view)
    @update() unless @locked

  ###*
  # Removes the provided View from the subviews array of this Layout,
  # stops monitoring the view for changes and updates the layout.
  # @param {dr.view} view The view to remove from this layout.
  # @return {number} the index of the removed subview or -1 if not removed.
  ###
  removeSubview: (view) ->
    @stopMonitoringSubviewForIgnore(view, this.__ignoreFunc)
    if @ignore(view) then return -1 else return @__removeSubview(view)

  __removeSubview: (view) ->
    idx = @subviews.indexOf(view)
    if idx isnt -1
      @stopMonitoringSubview(view)
      @subviews.splice(idx, 1)
      @update() unless @locked
    return idx

  ###*
  # Use this method to add listeners for any properties that need to be
  # monitored on a subview that determine if it will be ignored by the layout.
  # Each listenTo should look like: this.listenTo(view, propname, func)
  # The default implementation monitors ignorelayout.
  # @param {dr.view} view The view to monitor.
  # @param {Function} func The function to bind
  # @return {void}
  ###
  startMonitoringSubviewForIgnore: (view, func) ->
    @listenTo(view, 'ignorelayout', func)

  ###*
  # Use this method to remove listeners for any properties that need to be
  # monitored on a subview that determine if it will be ignored by the layout.
  # Each stopListening should look like: this.stopListening(view, propname, func)
  # The default implementation monitors ignorelayout.
  # @param {dr.view} view The view to monitor.
  # @param {Function} func The function to unbind
  # @return {void}
  ###
  stopMonitoringSubviewForIgnore: (view, func) ->
    @stopListening(view, 'ignorelayout', func)

  ###*
  # Checks if a subview can be added to this Layout or not. The default
  # implementation checks the 'ignorelayout' attributes of the subview.
  # @param {dr.view} view The view to check.
  # @return {boolean} True means the subview will be skipped, false otherwise.
  ###
  ignore: (view) ->
    ignore = view.ignorelayout
    if typeof ignore is 'object'
      name = this.name
      if name
        v = ignore[name]
        if v? then return v else return ignore['*']
      else
        return ignore['*']
    else
      return ignore

  ###*
  # Subclasses should implement this method to start listening to
  # events from the subview that should update the layout. The default
  # implementation does nothing.
  # @param {dr.view} view The view to start monitoring for changes.
  # @return {void}
  ###
  startMonitoringSubview: (view) ->
    # Empty implementation by default

  ###*
  # Calls startMonitoringSubview for all views. Used by layout
  # implementations when a change occurs to the layout that requires
  # refreshing all the subview monitoring.
  # @return {void}
  ###
  startMonitoringAllSubviews: ->
    svs = @subviews
    i = svs.length
    while (i)
      @startMonitoringSubview(svs[--i])

  ###*
  # Subclasses should implement this method to stop listening to
  # events from the subview that should update the layout. This
  # should remove all listeners that were setup in startMonitoringSubview.
  # The default implementation does nothing.
  # @param {dr.view} view The view to stop monitoring for changes.
  # @return {void}
  ###
  stopMonitoringSubview: (view) ->
    # Empty implementation by default

  ###*
  # Calls stopMonitoringSubview for all views. Used by Layout
  # implementations when a change occurs to the layout that requires
  # refreshing all the subview monitoring.
  # @return {void}
  ###
  stopMonitoringAllSubviews: ->
    svs = @subviews
    i = svs.length
    while (i)
      @stopMonitoringSubview(svs[--i])

  ###*
  # Checks if the layout can be updated right now or not. Should be called
  # by the "update" method of the layout to check if it is OK to do the
  # update. The default implementation checks if the layout is locked and
  # the parent is inited.
  # @return {boolean} true if not locked, false otherwise.
  ###
  canUpdate: ->
    return not @locked and @parent.inited

  ###*
  # Updates the layout. Subclasses should call canUpdate to check if it is
  # OK to update or not. The defualt implementation does nothing.
  # @return {void}
  ###
  update: ->
    # Empty implementation by default

  set_locked: (v) ->
    # Update the layout immediately if changing to false
    if @locked isnt v and v is false
      @locked = false
      @update()
    return v

return Layout