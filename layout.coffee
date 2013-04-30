hackstyle = do ->
  # hack jQuery to send a style event when CSS changes
  stylemap= {left: 'x', top: 'y', 'background-color': 'bgcolor'}
  origstyle = $.style
  styletap = (elem, name, value) ->
    returnval = origstyle.apply(this, arguments)
    name = stylemap[name] or name
    view = elem.$view
    if view[name] != value
    # if (view[name] != value and view?.events?[name])
      # console.log('sending style', name, elem.$view._locked) if sendstyle
      # view.setAttribute(name, value, true)
      view.gotStyle(name, value)

    returnval

  return (active) ->
    if active
      $.style = styletap
    else
      $.style = origstyle


window.lz = do ->
  # from https://github.com/spine/spine/tree/dev/src
  Events =
    bind: (ev, callback) ->
      # console.log 'binding', ev, callback
      evs   = ev.split(' ')
      calls = @hasOwnProperty('events') and @events or= {}
      for name in evs
        calls[name] or= []
        calls[name].push(callback)
      this

    one: (ev, callback) ->
      @bind ev, ->
        @unbind(ev, arguments.callee)
        callback.apply(this, arguments)

    trigger: (args...) ->
      ev = args.shift()
      list = @hasOwnProperty('events') and @events?[ev]
      return unless list
#      if list then console.log 'trigger', ev, list
      for callback in list
        if callback.apply(this, args) is false
          break
      true

    listenTo: (obj, ev, callback) ->
      obj.bind(ev, callback)
      @listeningTo or= []
      @listeningTo.push obj
      this

    listenToOnce: (obj, ev, callback) ->
      listeningToOnce = @listeningToOnce or = []
      listeningToOnce.push obj
      obj.one ev, ->
        idx = listeningToOnce.indexOf(obj)
        listeningToOnce.splice(idx, 1) unless idx is -1
        callback.apply(this, arguments)
      this

    stopListening: (obj, ev, callback) ->
      if obj
        obj.unbind(ev, callback)
        for listeningTo in [@listeningTo, @listeningToOnce]
          continue unless listeningTo
          idx = listeningTo.indexOf(obj)
          listeningTo.splice(idx, 1) unless idx is -1
      else
        for obj in @listeningTo
          obj.unbind()
        @listeningTo = undefined

    unbind: (ev, callback) ->
      unless ev
        @events = {}
        return this
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
      this

  Events.on = Events.bind
  Events.off = Events.unbind


  # mixins adapted from https://github.com/spine/spine/tree/dev/src
  moduleKeywords = ['included', 'extended']
  class Module
    @include: (obj) ->
      throw new Error('include(obj) requires obj') unless obj
      for key, value of obj when key not in moduleKeywords
        # console.log key, obj, @::
        @::[key] = value
      obj.included?.call(this, obj)
      this


  typemappings = 
    number: parseFloat

  installMethod = (scope, methodname, method) ->
    if methodname of scope
      # Cheesy override
      supr = scope[methodname]
      meth = method
      scope[methodname] = () ->
        # console.log 'applying overridden method', methodname, arguments
        supr.apply(scope, arguments)
        meth.apply(scope, arguments)
      # console.log('overrode method', methodname, scope, supr, meth)
    else
      scope[methodname] = method
      # console.log('installed method', methodname, scope, scope[methodname])


  compileCache.bindings ?= {}
  scopes = null
  propertyBindings = 
    find: (expression) ->
      return compileCache.bindings[expression] if expression of compileCache.bindings
      ast = acorn.parse(expression)
      scopes = []
      acorn.walkDown(ast, @)
      compileCache.bindings[expression] = scopes
      # console.log compileCache.bindings
      # return scopes
    MemberExpression: (n) ->
      # grab the property name
      name = n.property.name

      # remove the property so we can compute the rest of the expression
      n = n.object

      scopes.push({binding: acorn.stringify(n), property: name})
      # console.log 'MemberExpression', name, acorn.stringify n
      return true
  # propertyBindings.find = _.memoize(propertyBindings.find)

  class Node extends Module
    @include Events

    matchConstraint = /\${(.+)}/
    constructor: (el, attributes = {}) ->
      @subnodes = []
      # Install types
      @types = attributes.$types ? {}
      delete attributes.$types

      # Install methods
      for methodname, method of attributes.$methods
        # console.log 'installing method', methodname, method, @
        installMethod(@, methodname, method)
      delete attributes.$methods

      for {name, script, args, type} in attributes.$handlers?
        name = name.substr(2)
        # console.log 'installing handler', name, args, type, script, @
        @bind(name, @eventCallback(name, script, @, args, type))
      delete attributes.$handlers

      # Bind to event expressions and set attributes
      for name, value of attributes
        constraint = value.match?(matchConstraint)
        if constraint
          @applyConstraint(name, constraint[1])
        else if name.indexOf('on') == 0
          name = name.substr(2)
          # console.log('binding to event expression', name, value, @)
          @bind(name, @eventCallback(name, value, @))
        else
          @setAttribute(name, value)

      @bindConstraints() if @constraints
      # console.log 'new node', @, attributes
      @trigger('init', @) if @events?['init']

 

    applyConstraint: (name, expression) ->
      @constraints ?= {}
      @constraints[name] = compileScript('return ' + expression).bind(@)
      # console.log 'adding constraint', name, expression, @
      # console.log 'eval', @constraints[name]()

      constraintBinding = @constraints[name]
      bindings = constraintBinding.bindings ?= {}

      scopes = propertyBindings.find(expression)
      # console.log 'found scopes', scopes
      for scope in scopes
        bindexpression = scope.binding
        scope.compiled = compileScript('return ' + bindexpression).bind(@)
        bindings[bindexpression] = scope
        # console.log 'applied', scope.property, bindexpression, 'for', @

      # console.log 'matched constraint', name, @, expression
      return

    setAttribute: (name, value) ->
      # TODO: add support for dynamic constraints
      # constraint = value.match?(matchConstraint)
      # if constraint
      #   @applyConstraint(name, constraint[1])
      #   return

      # coerce value to type
      type = @types[name]
      if type
        value = typemappings[type](value) if type of typemappings
        # console.log 'type', name, type, value, @

      if @[name] != value
        # console.log 'setAttribute', name, value
        setter = 'set_' + name
        if setter of @
          # console.log 'calling setter', setter, value, @[setter]
          @[setter](value)
        else
          # console.log 'setting style', name, value
          @[name] = value

      # send event
      @trigger(name, value, @, name) if @events?[name]
      @

    # generate a callback for an event expression in a way that preserves scope, e.g. on_x="console.log(value, this, ...)"
    eventCallback: (name, script, scope, fnargs=['value'], type) ->
      # console.log 'binding to event expression', name, script, scope
      js = compileScript(script, fnargs, type)
      () ->
        if name of scope
          args = [scope[name]]
        else 
          args = arguments
        # console.log 'event callback', name, args, scope, js
        js.apply(scope, args)

    bindConstraints: () ->
      # register constraints last
      for name, value of @constraints
        # console.log 'binding constraint', name, value, @
        constraint = @constraintCallback(name, value)
        for bindexpression, binding of @constraints[name].bindings
          property = binding.property
          boundref = binding.compiled()
          boundref ?= boundref.$view
          # console.log 'binding to', property, 'on', boundref
          boundref.bind(property, constraint)
          
        @setAttribute(name, value())

      return

    # generate a callback for a constraint expression, e.g. x="${this.parent.baz.x + 10}"
    constraintCallback: (name, fn) ->
      # console.log('binding to constraint fn', name, fn, @)
      () =>
        # console.log 'setting', name, fn(), @
        @setAttribute(name, fn())

    set_parent: (parent) ->
      # console.log 'set_parent', parent, @
      # normalize to jQuery object
      if parent instanceof Node
        # store references to parent and children
        @parent = parent
        parent[@name] = @ if @name
        parent.subnodes.push(@)
        parent.trigger('subnodes', @) if parent.events?['subnodes']

    set_name: (@name) ->
      # console.log 'set_name', name, this
      @parent?[name] = @


  class Sprite
#    guid = 0
    stylemap= {x: 'left', y: 'top', bgcolor: 'background-color'}

    constructor: (@jqel = $('<div/>'), view) ->
      # console.log 'new sprite', @jqel, view
      @jqel = $(@jqel) unless @jqel instanceof jQuery
      @jqel[0].$view = view

      # normalize to jQuery object
#      guid++
#      @jqel.attr('id', 'jqel-' + guid) if not @jqel.attr('id')
      @jqel.addClass('sprite')
    setStyle: (name, value) ->
      value ?= ''
      name = stylemap[name] if name of stylemap
      # console.log('setStyle', name, value, @jqel[0])
      @jqel.css(name, value)
    set_parent: (parent) ->
      if parent instanceof Sprite
        parent = parent.jqel

      parent = $(parent) unless parent instanceof jQuery
      # console.log 'set_parent', parent
      parent.append(@jqel)
    set_id: (@id) ->
      # console.log('setid', @id)
      @jqel.attr('id', @id)
    animate: =>
      # console.log 'sprite animate', arguments, @jqel
      @jqel.animate.apply(@jqel, arguments)


  ignoredAttributes = {parent: true, id: true, name: true, extends: true, type: true}
  class View extends Node
    constructor: (el, attributes = {}) ->
      @subviews = []
      attributes.$types = {x: 'number', y: 'number', width: 'number', height: 'number'}
      if (el instanceof HTMLElement and el.$view)
        console.warn 'already bound view', el.$view, el
        return

      if (el instanceof View)
        el = el.sprite

      @sprite = new Sprite(el, @)

      super(el, attributes)
      # console.log 'new view', el, attributes, @

    gotStyle: (name, value) ->
      if not ignoredAttributes[name] 
        # if view.events?[name])
        _super::setAttribute.apply(@, arguments)

    setAttribute: (name, value) ->
      if not (ignoredAttributes[name] or @[name] == value)
        # console.log 'setting style', name, @[name], value, @
        @sprite.setStyle(name, value)
      super(name, value)

    set_parent: (parent) ->
      # console.log 'view set_parent', parent, @
      super(parent)

      # store references subviews
      if parent instanceof View
        parent.subviews.push(@)
        parent.trigger('subviews', @) if parent.events?['subviews']
        parent = parent.sprite
      @sprite.set_parent parent

    set_id: (@id) ->
      @sprite.set_id(id)

    animate: ->
      # console.log 'animate', arguments, @sprite.animate
      @sprite.animate.apply(this, arguments)

  # flatten element.attributes to a hash
  flattenattributes = (namednodemap)  ->
    attributes = {}
    for i in namednodemap
      attributes[i.name] = i.value
    attributes

  specialtags = ['handler', 'method', 'attribute', 'setter']
  # init classes based on an existing element
  initFromElement = (el, parent) ->
    tagname = el.localName
    if not (tagname of lz)
      console.warn 'could not find class for tag', tagname, el
      return

    attributes = flattenattributes(el.attributes)

    # swallow builtin mouse attributes to prevent events from the tag
    for event in mouseEvents
      el.removeAttribute('on' + event)

    parent ?= el.parentNode
    attributes.parent = parent if parent?
    # console.log 'parent', tagname, attributes, parent

    children = (child for child in el.childNodes when child.nodeType == 1)

    if tagname is 'class'
      for child in children
        # console.log 'creating child', tagname, child.localName, child, parent
        # console.dir(child)
        # console.log 'defer', child
        child.$defer = true
        
    processSpecialTags(el, attributes, attributes.type)

    parent = new lz[tagname](el, attributes)

    unless tagname is 'class'
      for child in children
        initFromElement(child, parent) unless child.localName in specialtags

    return


  # write default CSS to the DOM 
  writeDefaultStyle = () ->
    style = document.createElement('style')
    style.type = 'text/css'
    style.innerHTML = '.sprite{position:absolute;} .hidden{display:none;}'
    document.getElementsByTagName('head')[0].appendChild(style)

  # init all views in the DOM recursively
  init = (selector = $('view')) ->
    for el, i in selector
      initFromElement(el) unless el.$defer or el.$view
    # listen for jQuery style changes
    hackstyle(true)

  compilermappings = 
    coffee: (script) ->
      if not window.CoffeeScript
        console.warn 'missing coffee-script.js include'
        return
      # console.log 'compiling coffee-script', script
      CoffeeScript.compile(script, bare: true) if script
      # console.log 'compiled coffee-script', script

  compileScript = (script='', args=[], compiler) ->
    script = compilermappings[compiler](script) if compiler of compilermappings
    # console.log 'compileScript', compiler, args, script
    try 
      new Function(args, script)
    catch e
      console.error('failed to compile', args, script, e)

  # http://stackoverflow.com/questions/1248849/converting-sanitised-html-back-to-displayable-html
  htmlDecode = (input) ->
    # return if not input
    e = document.createElement('div');
    e.innerHTML = input;
    e.childNodes[0].nodeValue;

  processSpecialTags = (el, classattributes, defaulttype) ->
    classattributes.$types ?= {}
    classattributes.$methods ?= {}
    classattributes.$handlers ?= []
    children = (child for child in el.childNodes when child.nodeType == 1 and child.localName in specialtags)
    for child in children
      attributes = flattenattributes(child.attributes)
      child.setAttribute('class', 'hidden')
      # console.log child, attributes, classattributes

      childname = child.localName
      if childname == 'handler'
        args = (attributes.args ? '').split()
        script = htmlDecode(child.innerHTML)
        type = attributes.type or defaulttype
        handler = 
          name: attributes.name
          script: script
          args: args
          type: type

        classattributes.$handlers.push(handler)
        # console.log 'added handler', attributes.name, script, attributes
      else if childname == 'method'
        args = (attributes.args ? '').split()
        script = htmlDecode(child.innerHTML)
        type = attributes.type or defaulttype
        classattributes.$methods[attributes.name] = compileScript(script, args, type)
        # console.log 'added method', attributes.name, script, classattributes
      else if childname == 'setter'
        args = (attributes.args ? '').split()
        script = htmlDecode(child.innerHTML)
        type = attributes.type or defaulttype
        classattributes.$methods['set_' + attributes.name] = compileScript(script, args, type)
        # console.log 'added setter', 'set_' + attributes.name, args, classattributes.$methods
      else if childname == 'attribute'
        classattributes[attributes.name] = attributes.value
        classattributes.$types[attributes.name] = attributes.type
        # console.log 'added attribute', attributes, classattributes
    return 


  class Class
    constructor: (el, classattributes = {}) ->
      name = classattributes.name
      extend = classattributes.extends ?= 'view'
      compilertype = classattributes.type
      for ignored of ignoredAttributes
        delete classattributes[ignored]

      processSpecialTags(el, classattributes, compilertype)
      # console.log('compiled class', name, extend, (classattributes))

      # serialize the tag's contents
      body = el.innerHTML

      # console.log('new class', name, classattributes)
      console.warn 'overwriting class', name if name of lz
      lz[name] = (instanceel, instanceattributes) ->
        attributes = _.clone(classattributes)
        for key, value of instanceattributes
          # console.log 'overriding class attribute', key, value
          if (key is '$methods' or key is '$types') and key of attributes
            attributes[key] = _.clone(attributes[key])
            # console.log('overwriting', key, attributes[key], value)
            for propname, val of value
              # TODO: deal with method overrides here?
              attributes[key][propname] = val
          else if key is '$handlers' and key of attributes
            # console.log 'concat', attributes[key], value
            attributes[key] = attributes[key].concat(value)
            # console.log 'after concat', attributes[key]
          else 
            attributes[key] = value

        # console.log 'creating class instance', name, attributes
        parent = new lz[extend](instanceel, attributes)
        # console.log 'created instance', name, extend, parent

        return if not (viewel = parent.sprite?.jqel[0])

        viewel.innerHTML = body
        children = (child for child in viewel.childNodes when child.nodeType == 1)
        for child in children
          child.$defer = null
          # console.log 'creating class child in parent', child, parent
          initFromElement(child, parent)
        return


  class Layout extends Node
    locked = true
    constructor: (el, attributes = {}) ->
      super(el, attributes)
      # listen for new subviews
      @parent.bind('subviews', @added)
      @parent.layouts ?= []
      @parent.layouts.push(this)

      # iterate through subviews that already exist
      subviews = @parent.subviews
      if subviews
        for subview in subviews
          @added(subview)
      locked = false
      @update()
      # console.log('layout', attributes, @)

    # called when a new subview is added to the parent view
    added: (child) =>
      # console.log 'added layout', child, @
      @trigger('subview', child) if @events?['subview']
      @update(null, child)

    # override to update the position of the parent view's children
    update: (ignore, sender) =>
      # console.log 'update layout', sender
      return if @skip()
    
    # returns true if the layout should't update 
    skip: () ->
      true if locked or (not @parent?.subviews)


  class SimpleLayout extends Layout
    constructor: (el, attributes = {}) ->
      @attribute = 'x'
      @axis = 'width'
      @spacing = 10
      @inset = 10
      attributes.$types ?= {}
      attributes.$types.spacing = 'number'
      attributes.$types.inset = 'number'
      super(el, attributes)

    set_attribute: (attr) ->
      newaxis = switch attr
        when 'x' then 'width' 
        when 'y' then 'height'

      for subview in @parent.subviews?
        subview.unbind(@axis, @update).bind(newaxis, @update)

      @axis = newaxis

      @attribute = attr
      # console.log('set_attribute', attr, typeof attr, @attribute, @axis, newaxis)
      @update()

    set_spacing: (space) ->
      # console.log('set_spacing', space, typeof space)
      @spacing = space
      @update()

    set_inset: (i) ->
      # console.log('set_inset', i, typeof i)
      @inset = i
      @update()

    added: (child) ->
      # console.log 'added', child
      child.bind(@axis, @update)
      super(child)

    update: (value, sender) ->
      # console.log('skip', @skip, @locked)
      return if @skip()
      pos = @inset
      skip = true if sender
      for subview in @parent.subviews
        if (skip and subview != sender)
          # console.log 'skipping', subview, sender
        else 
          # console.log 'updating', subview, @attribute, pos
          subview.setAttribute(@attribute, pos) unless subview[@attribute] == pos
          skip = false
        # console.log 'value', pos, @spacing, @inset, @attribute, @axis, subview[@axis]
        pos += @spacing + subview[@axis]
      return pos


  mouseEvents = ['click', 'mouseover', 'mouseout', 'mousedown', 'mouseup']
  # singleton that listens for mouse position and holds the most recent left and top coordinates
  class Mouse extends Module
    constructor: () ->
      @docSelector = $(document)
      for event in mouseEvents
        @docSelector.on(event, @handler)
    sender: () ->
      trigger("mousemove", left, top)
    handler: (event) ->
      view = event.target.$view
      type = event.type
      if view?.events?[type]
        view.trigger(event.type, view)
        # console.log 'event', event.type, event.target.$view
      if @started
        requestTick 0, sender 
        @left = event.pageX
        @top = event.pageY
    start: () ->
      return if @started
      @started = true
      @docSelector.on("mousemove", @handler).one("mouseout", @stop)
    stop: () ->
      return if not @started
      @started = false
      @docSelector.off("mousemove", @handler).one("mouseover", @start)

    mouse = new Mouse()

  exports = {
    view: View,
    class: Class,
    node: Node,
    layout: Layout,
    simplelayout: SimpleLayout,
    initViews: init
    writeDefaultStyle: writeDefaultStyle
  }

lz.writeDefaultStyle()
$(window).on('load', () ->
  lz.initViews()
  canvas = new lz.view(null, {x: 100, y: 100, bgcolor: 'red', width: 100, height: 100, transform: 'rotate(45deg)', parent: $('#canvas')})
  aview = new lz.view(null, {x: 50, y:50, width:20, height:20, bgcolor: 'green', 'border-radius': '4px', parent:canvas})
)