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
      view.setAttribute(name, value, true)

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
      @listeningTo.push {obj: obj, ev: ev, callback: callback}
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
        for {obj, ev, callback} in @listeningTo
          # console.log 'stopped listening', obj, ev, callback
          obj.unbind(ev, callback)
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


  class Eventable extends Module
    @include Events

    typemappings= 
      number: parseFloat
      boolean: (val) -> (if (typeof val == 'string') then val == 'true' else (!! val))
      string: (val) -> val + ''
      json: (val) -> JSON.parse(val)
      expression: (val) -> 
        if typeof val != 'string'
          return val
        eval(val)

    setAttribute: (name, value) ->
      # TODO: add support for dynamic constraints
      # constraint = value.match?(matchConstraint)
      # if constraint
      #   @applyConstraint(name, constraint[1])
      #   return

      # coerce value to type
      type = @types[name]
      if type# and type of typemappings
        # console.log 'type', name, type, value, typemappings[type], @
        value = typemappings[type](value)

      @["set_#{name}"]?(value)
      if @[name] != value
        # console.log 'setAttribute', name, value
        @[name] = value

      @sendEvent(name, value)
      @

    sendEvent: (name, value) ->
      # send event
      if @events?[name]
        @trigger(name, value, @) 
      # else
        # console.log 'no event named', name, @events, @
      @

    set: (attributes) ->
      for name, value of attributes
        @setAttribute(name, value)
      @


  compiler = do ->
    cacheKey = "compilecache"
    if cacheKey of localStorage
      compileCache = JSON.parse(localStorage[cacheKey])
      # console.log 'restored', compileCache
    else
      compileCache = 
        bindings: {}
        script: 
          coffee: {}

    $(window).on('unload', -> 
      localStorage[cacheKey] = JSON.stringify(compileCache) 
      # console.log 'onunload', localStorage[cacheKey]
    )

    findBindings = do ->
      bindingCache = compileCache.bindings
      scopes = null
      propertyBindings = 
        MemberExpression: (n) ->
          # grab the property name
          name = n.property.name

          # remove the property so we can compute the rest of the expression
          n = n.object

          # push the scope onto the list
          scopes.push({binding: acorn.stringify(n), property: name})
          # console.log 'MemberExpression', name, n, acorn.stringify n
          return true

      (expression) ->
        return bindingCache[expression] if expression of bindingCache
        ast = acorn.parse(expression)
        scopes = []
        acorn.walkDown(ast, propertyBindings)
        bindingCache[expression] = scopes
        # console.log compileCache.bindings
        # return scopes
      # propertyBindings.find = _.memoize(propertyBindings.find)

    # transforms a script to javascript using a runtime compiler
    transform = do ->    
      coffeeCache = compileCache.script.coffee
      compilers = 
        coffee: (script) ->
          if script of coffeeCache
            # console.log 'cache hit', script
            return coffeeCache[script]
          if not window.CoffeeScript
            console.warn 'missing coffee-script.js include'
            return
          # console.log 'compiling coffee-script', script
          coffeeCache[script] = CoffeeScript.compile(script, bare: true) if script
          # console.log 'compiled coffee-script', script
          # console.log coffeeCache
          # return coffeeCache[script]

      (script='', name) ->
        return script unless name of compilers
        compilers[name](script) 

    # cache compiled scripts to speed up instantiation
    scriptCache = {}
    # compile a string into a function
    compile = (script='', args=[]) ->
      key = script + args.join()
      return scriptCache[key] if key of scriptCache
      # console.log 'compile', args, script
      try 
        # console.log scriptCache
        scriptCache[key] = new Function(args, script)
      catch e
        console.error('failed to compile', args, script, e)

    exports = 
      compile: compile
      transform: transform
      findBindings: findBindings


  # a list of constraint scopes gathered at init time
  constraintScopes = []
  # init constraints
  _initConstraints = ->
    for constraint in constraintScopes
      constraint._bindConstraints()
    constraintScopes = []

  class Node extends Eventable
    matchConstraint = /\${(.+)}/

    constructor: (el, attributes = {}) ->
      @subnodes = []
      # Install types
      @types = attributes.$types ? {}
      delete attributes.$types

      # store textual content
      if el?.textContent 
        attributes.textcontent = el.textContent

      if attributes.$methods
        # Install methods
        for methodname, method of attributes.$methods
          # console.log 'installing method', methodname, method, @
          installMethod(@, methodname, compiler.compile.apply(null, method))
        delete attributes.$methods

      if attributes.$handlers
        for {name, script, args, reference, method} in attributes.$handlers
          name = name.substr(2)

          # console.log 'installing handler', name, args, type, script, @
          if method
            callback = @[method]
            # console.log('using method', method, callback)
          else
            callback = eventCallback(name, script, @, args)

          if reference?
            @listenTo(eval(reference), name, callback)
          else
            @bind(name, callback)

          if name in mouseEvents
            attributes.clickable = true unless attributes.clickable is "false"
            # console.log 'registered for clickable', attributes.clickable
        delete attributes.$handlers

      # Bind to event expressions and set attributes
      for name, value of attributes
        constraint = value.match?(matchConstraint)
        if constraint
          @applyConstraint(name, constraint[1])
        else if name.indexOf('on') == 0
          name = name.substr(2)
          # console.log('binding to event expression', name, value, @)
          @bind(name, eventCallback(name, value, @))
        else
          @setAttribute(name, value)

      constraintScopes.push(@) if @constraints

      # console.log 'new node', @, attributes
      @sendEvent('init', @)

    initConstraints: ->
      _initConstraints()
      

    # generate a callback for an event expression in a way that preserves scope, e.g. on_x="console.log(value, this, ...)"
    eventCallback = (name, script, scope, fnargs=['value']) ->
      # console.log 'binding to event expression', name, script, scope, fnargs
      js = compiler.compile(script, fnargs)
      ->
        if name of scope
          args = [scope[name]]
        else 
          args = arguments
        # console.log 'event callback', name, args, scope, js
        js.apply(scope, args)

    installMethod = (scope, methodname, method) ->
      if methodname of scope
        # Cheesy override
        supr = scope[methodname]
        meth = method
        scope[methodname] = ->
          # console.log 'applying overridden method', methodname, arguments
          supr.apply(scope, arguments)
          meth.apply(scope, arguments)
          # console.log('overrode method', methodname, scope, supr, meth)
      else
        scope[methodname] = method
      # console.log('installed method', methodname, scope, scope[methodname])

    applyConstraint: (property, expression) ->
      @constraints ?= {}
      @constraints[property] = 
        expression: 'return ' + expression #compiler.compile('return ' + expression).bind(@)
      # console.log 'adding constraint', property, expression, @
        bindings: {}

      bindings = @constraints[property].bindings
      scopes = compiler.findBindings(expression)
      # console.log 'found scopes', scopes
      for scope in scopes
        bindexpression = scope.binding
        bindings[bindexpression] = scope
        # console.log 'applied', scope.property, bindexpression, 'for', @

      # console.log 'matched constraint', property, @, expression
      return

    _bindConstraints: ->
      # register constraints last
      for name, constraint of @constraints
        {bindings, expression} = constraint
        fn = compiler.compile(expression).bind(@)
        # console.log 'binding constraint', name, expression, @
        constraint = @_constraintCallback(name, fn)
        for bindexpression, binding of bindings
          property = binding.property
          boundref = compiler.compile('return ' + bindexpression).bind(@)()
          boundref ?= boundref.$view
          # console.log 'binding to', property, 'on', boundref
          boundref.bind?(property, constraint)
          
        @setAttribute(name, fn())

      return

    # generate a callback for a constraint expression, e.g. x="${this.parent.baz.x + 10}"
    _constraintCallback: (name, fn) ->
      # console.log('binding to constraint fn', name, fn, @)
      () =>
        # console.log 'setting', name, fn(), @
        @setAttribute(name, fn())

    set_parent: (parent) ->
      # console.log 'set_parent', parent, @
      # normalize to jQuery object
      if parent instanceof Node
        # store references to parent and children
        parent[@name] = @ if @name
        parent.subnodes.push(@)
        parent.sendEvent('subnodes', @)

    set_name: (name) ->
      # console.log 'set_name', name, this
      @parent?[name] = @

    _removeFromParent: (name) ->
      return if not @parent
      arr = @parent[name]
      index = arr.indexOf(@)
      if (index != -1)
        arr.splice(index, 1)
        @parent.sendEvent(name, arr[index])
      return

    destroy: (skipevents) ->
      # console.log 'destroy node', @
      @sendEvent('destroy', @)

      if @listeningTo
        @stopListening()
      @unbind()

      # remove name reference
      if (@parent?[@name] == @)
        delete @parent[@name]

      # console.log 'destroying', @subnodes, @
      for subnode in @subnodes
        # console.log 'destroying', subnode, @
        subnode.destroy(true)

      @_removeFromParent('subnodes') unless skipevents


  class Sprite
#    guid = 0
    stylemap= {x: 'left', y: 'top', bgcolor: 'backgroundColor'}
    fcamelCase = ( all, letter ) ->
      letter.toUpperCase()
    rdashAlpha = /-([\da-z])/gi

    constructor: (jqel, view) ->
      # console.log 'new sprite', jqel, view
      if not jqel?
        @el = document.createElement('div')
      else if jqel instanceof jQuery
        @el = jqel[0]
      else if jqel instanceof HTMLElement
        @el = jqel
      # console.log 'sprite el', @el, @
      @el.$view = view

      # normalize to jQuery object
#      guid++
#      jqel.attr('id', 'jqel-' + guid) if not jqel.attr('id')
      @el.setAttribute('class', 'sprite')
      # @jqel = $(@el)

    setStyle: (name, value) ->
      value ?= ''
      if name of stylemap
        name = stylemap[name] 
      else if name.match(rdashAlpha)
        # console.log "replacing #{name}"
        name = name.replace( rdashAlpha, fcamelCase )
      # console.log('setStyle', name, value, @el)
      @el.style[name] = value
      # @jqel.css(name, value)

    set_parent: (parent) ->
      if parent instanceof Sprite
        parent = parent.el
      else if parent instanceof jQuery
        parent = parent[0]

      # parent = $(parent) unless parent instanceof jQuery
      # parent.append(@jqel)
      # parent = parent[0] if parent instanceof jQuery
      # console.log 'set_parent', parent, @el
      parent.appendChild(@el)

    set_id: (id) ->
      # console.log('setid', @id)
      @el.setAttribute('id', id)

    animate: =>
      @jqel ?= $(@el)
      # console.log 'sprite animate', arguments, @jqel
      @jqel.animate.apply(@jqel, arguments)

    set_clickable: (clickable) ->
      @setStyle('pointer-events', if clickable then 'auto' else 'none')

      # TODO: retrigger the event for the element below for IE and Opera? See http://stackoverflow.com/questions/3680429/click-through-a-div-to-underlying-elements
      # el = $(event.target)
      # el.hide();
      # $(document.elementFromPoint(event.clientX,event.clientY)).trigger(type);
      # el.show();

    destroy: ->
      @el.parentNode.removeChild(@el);
      @el = @jqel = null

    set_clip: (clip) ->
      # console.log('setid', @id)
      @setStyle('overflow', if clip then 'hidden' else '')

    text: (text) ->
      if text?
        @el.innerHTML = text
      else
        @el.innerHTML

    value: (value) ->
      if value?
        @input.value = value
      else
        @input.value

    measureTextSize: (multiline, width) ->
      @el.setAttribute('class', 'sprite sprite-text')
      if multiline
        @setStyle('width', width)
        @setStyle('whiteSpace', 'normal')
      else
        @setStyle('width', 'auto')
      {width: @el.clientWidth, height: @el.clientHeight}

    createInputtextElement: (text, multiline, width) ->
      input = document.createElement('input')
      input.setAttribute('type', 'text')
      input.setAttribute('value', text)
      input.setAttribute('style', 'border: none; outline: none; background-color:transparent;')
      @el.appendChild(input)

      setTimeout(() =>
        @input = @el.getElementsByTagName('input')[0]
        @input.$view = @el.$view
      , 0);

    getAbsolute: () ->
      @jqel ?= $(@el)
      pos = @jqel.position()
      {x: pos.left, y: pos.top}

    set_class: (classname) ->
      # console.log('setid', @id)
      @el.setAttribute('class', klass)


  ignoredAttributes = {parent: true, id: true, name: true, extends: true, type: true}
  class View extends Node
    constructor: (el, attributes = {}) ->
      @subviews = []
      types = {x: 'number', y: 'number', width: 'number', height: 'number', clickable: 'boolean', clip: 'boolean'}
      for key, type of types
        if not (key of attributes)
          @[key] = if type is 'number' then 0 else false
          # console.log 'set default', key, type, @[key]

      for key, type of attributes.$types
        types[key] = type;
      attributes.$types = types

      if (el instanceof View)
        el = el.sprite

      @sprite = new Sprite(el, @)

      super(el, attributes)
      # console.log 'new view', el, attributes, @

    setAttribute: (name, value, skip) ->
      if not (skip or ignoredAttributes[name] or @[name] == value)
        # console.log 'setting style', name, @[name], value, @
        @sprite.setStyle(name, value)
      super(name, value)

    set_parent: (parent) ->
      # console.log 'view set_parent', parent, @
      super(parent)

      # store references subviews
      if parent instanceof View
        parent.subviews.push(@)
        parent.sendEvent('subviews', @)
        parent = parent.sprite

      @sprite.set_parent parent

    set_id: (id) ->
      @sprite.set_id(id)

    animate: ->
      # console.log 'animate', arguments, @sprite.animate
      @sprite.animate.apply(this, arguments)

    set_clickable: (clickable) ->
      @sprite.set_clickable(clickable)

    set_clip: (clip) ->
      @sprite.set_clip(clip)

    destroy: (skipevents) ->
      # console.log 'destroy view', @
      super(skipevents)
      @_removeFromParent('subviews') unless skipevents

      @sprite.destroy()
      @sprite = null

    getAbsolute: () ->
      @sprite.getAbsolute()

    set_class: (classname) ->
      @sprite.set_class(classname)



  dom = do ->
    # flatten element.attributes to a hash
    flattenattributes = (namednodemap)  ->
      attributes = {}
      for i in namednodemap
        attributes[i.name] = i.value
      attributes

    # initialize an element
    initFromElement = (el) ->
      initElement(el)
      for child of _children
        {name, el, attributes} = child
        console.log name, el, attributes
        parent = new lz[name](el, attributes)
      _children = []

      _initConstraints()


    specialtags = ['handler', 'method', 'attribute', 'setter']
    # recursively init classes based on an existing element
    initElement = (el, parent) ->
      tagname = el.localName
      if not (tagname of lz)
        console.warn 'could not find class for tag', tagname, el
        return

      attributes = flattenattributes(el.attributes)

      # swallow builtin mouse attributes to allow event delegation, set clickable if an event is found
      for event in mouseEvents
        eventname = 'on' + event
        if eventname of attributes
          attributes.clickable = true unless attributes.clickable == false
          el.removeAttribute(eventname)

      parent ?= el.parentNode
      attributes.parent = parent if parent?
      # console.log 'parent', tagname, attributes, parent

      children = (child for child in el.childNodes when child.nodeType == 1)

      if tagname is 'class'
        # defer creation of children created elsewhere
        for child in children
          child.$defer = true
      else 
        dom.processSpecialTags(el, attributes, attributes.type)

      parent = new lz[tagname](el, attributes)

      unless tagname is 'class'
        # create children now
        for child in children
          initElement(child, parent) unless child.localName in specialtags

      return


    # write default CSS to the DOM 
    writeCSS = ->
      style = document.createElement('style')
      style.type = 'text/css'
      style.innerHTML = '.sprite{ position: absolute; pointer-events: none; } .sprite-text{ width: auto; height; auto; white-space: nowrap; } .hidden{ display: none; } method { display: none; } handler { display: none; } setter { display: none; }'
      document.getElementsByTagName('head')[0].appendChild(style)

    # init all views in the DOM recursively
    initAllElements = (selector = $('view')) ->
      for el in selector
        initFromElement(el) unless el.$defer or el.$view
      # console.log 'caches', compileCache

    # http://stackoverflow.com/questions/1248849/converting-sanitised-html-back-to-displayable-html
    htmlDecode = (input) ->
      # return if not input
      e = document.createElement('div');
      e.innerHTML = input;
      e.childNodes[0]?.nodeValue

    processSpecialTags = (el, classattributes, defaulttype) ->
      classattributes.$types ?= {}
      classattributes.$methods ?= {}
      classattributes.$handlers ?= []
      children = (child for child in el.childNodes when child.nodeType == 1 and child.localName in specialtags)
      for child in children
        attributes = flattenattributes(child.attributes)
        # console.log child, attributes, classattributes

        switch child.localName
          when 'handler'
            args = (attributes.args ? '').split()
            script = htmlDecode(child.innerHTML)
            type = attributes.type ? defaulttype
            handler = 
              name: attributes.name
              script: compiler.transform(script, type)
              args: args
              reference: attributes.reference
              method: attributes.method

            classattributes.$handlers.push(handler)
            # console.log 'added handler', attributes.name, script, attributes
          when 'method'
            args = (attributes.args ? '').split()
            script = htmlDecode(child.innerHTML)
            type = attributes.type or defaulttype
            classattributes.$methods[attributes.name] = [compiler.transform(script, type), args]
            # console.log 'added method', attributes.name, script, classattributes
          when 'setter'
            args = (attributes.args ? '').split()
            script = htmlDecode(child.innerHTML)
            type = attributes.type or defaulttype
            classattributes.$methods['set_' + attributes.name] = [compiler.transform(script, type), args]
            # console.log 'added setter', 'set_' + attributes.name, args, classattributes.$methods
          when 'attribute'
            classattributes[attributes.name] = attributes.value
            classattributes.$types[attributes.name] = attributes.type
            # console.log 'added attribute', attributes, classattributes

      # console.log('processSpecialTags', classattributes)
      return children

    exports =
      initAllElements: initAllElements
      initElement: initElement
      processSpecialTags: processSpecialTags
      writeCSS: writeCSS


  class Class
    clone = (obj) ->
      newobj = {}
      for name, val of obj
        newobj[name] = val 
      newobj

    constructor: (el, classattributes = {}) ->
      name = classattributes.name
      extend = classattributes.extends ?= 'view'
      compilertype = classattributes.type
      for ignored of ignoredAttributes
        delete classattributes[ignored]

      processedChildren = dom.processSpecialTags(el, classattributes, compilertype)

      # console.log('compiled class', name, extend, classattributes)

      # cache the old contents
      oldbody = el.innerHTML.trim()

      for child in processedChildren
        child.parentNode.removeChild(child)

      # serialize the tag's contents
      body = el.innerHTML.trim()

      # restore old contents
      el.innerHTML = oldbody if (oldbody)

      # console.log('new class', name, classattributes)
      console.warn 'overwriting class', name if name of lz
      lz[name] = (instanceel, instanceattributes) ->
        attributes = clone(classattributes)
        for key, value of instanceattributes
          # console.log 'overriding class attribute', key, value
          if (key is '$methods' or key is '$types') and key of attributes
            attributes[key] = clone(attributes[key])
            # console.log('overwriting', key, attributes[key], value)
            for propname, val of value
              # TODO: deal with method overrides here?
              attributes[key][propname] = val
            # console.log 'overwrote class attribute', key, attributes[key], value
          else if key is '$handlers' and key of attributes
            # console.log 'concat', attributes[key], value
            attributes[key] = attributes[key].concat(value)
            # console.log 'after concat', attributes[key]
          else 
            attributes[key] = value

        # console.log 'creating class instance', name, attributes
        parent = new lz[extend](instanceel, attributes)
        # console.log 'created instance', name, extend, parent

        instanceel.setAttribute('class', 'hidden') if extend == 'node'

        return parent if not (viewel = parent.sprite?.el)

        # unpack instance 
        if body
          # console.log 'body', body
          viewel.innerHTML = body
          children = (child for child in viewel.childNodes when child.nodeType == 1)
          for child in children
            child.$defer = null
            # console.log 'creating class child in parent', child, parent
            dom.initElement(child, parent)

        return parent


  class Layout extends Node
    constructor: (el, attributes = {}) ->
      @locked = true
      super(el, attributes)
      # listen for new subviews
      @listenTo(@parent, 'subviews', @added)
      @parent.layouts ?= []
      @parent.layouts.push(this)

      # iterate through subviews that already exist
      subviews = @parent.subviews
      if subviews
        for subview in subviews
          @added(subview)
      @locked = false
      @update()
      # console.log('layout', attributes, @)

    # called when a new subview is added or removed from the parent view
    added: (child) =>
      # console.log 'added layout', child, @
      if child
        @sendEvent('subview', child)
      @update(null, child)

    # override to update the position of the parent view's children
    update: (value, sender) =>
      # console.log 'update layout', sender
      # return if @skip()
    
    # returns true if the layout should't update 
    skip: ->
      true if @locked or (not @parent?.subviews) or (@parent.subviews.length == 0)

    destroy: (skipevents) ->
      @locked = true
      # console.log 'destroy layout', @
      super(skipevents)
      @_removeFromParent('layouts') unless skipevents

    set_locked: (locked) ->
      changed = @locked != locked
      @locked = locked
      @sendEvent('locked', locked)
      # console.log 'set_locked', locked
      @update() if (changed and not locked)

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
      @listenTo(child, @axis, @update)
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


  idle = do ->
    requestAnimationFrame = window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame# || (delegate) -> setTimeout(delegate, 17);
    ticking = false
    tickEvents = []

    doTick = ->
      for key of tickEvents
        if tickEvents[key] 
          # console.log('tick', key, tickEvents[key])
          tickEvents[key]()
          tickEvents[key] = null
      ticking = false

    (key, callback) ->
      # console.log('idle', key, callback)
      # if (tickEvents[key] !== null) console.log('hit', key)
      if !ticking
        requestAnimationFrame(doTick)
      ticking = true;
      tickEvents[key] = callback


  # singleton that listens for keyboard and mouse events. Holds data about the most recent left and top mouse coordinates
  mouseEvents = ['click', 'mouseover', 'mouseout', 'mousedown', 'mouseup']
  class Mouse extends Eventable
    constructor: ->
      @x = 0
      @y = 0
      @docSelector = $(document)
      @docSelector.on(mouseEvents.join(' '), @handle)

    bind: (ev, callback) ->
      super(ev, callback)
      if @events['mousemove']?.length or @events['x']?.length or @events['y']?.length
        @start()

    unbind: (ev, callback) ->
      super(ev, callback)
      if @events['mousemove']?.length is 0 and @events['x']?.length is 0 and @events['y']?.length is 0
        @stop()

    handle: (event) =>
      view = event.target.$view
      type = event.type
      # console.log 'event', type, view
      if view
        view.sendEvent(type, view)

      if @started and type is 'mousemove'
        @x = event.pageX
        @y = event.pageY
        idle(0, @sender) 
      else 
        @sendEvent(type, view)

    sender: =>
      @sendEvent("mousemove", {x: @x, y: @y})
      @sendEvent('x', @x)
      @sendEvent('y', @y)

    start: (event) =>
      return if @started
      return if event and event.target != document
      @started = true
      # @tId = setInterval(@sender, 17)
      # console.log 'start'
      @docSelector.on("mousemove", @handle).one("mouseout", @stop)

    stop: (event) =>
      return if not @started
      return if event and event.target != document
      @started = false
      # clearInterval(@tId)
      # console.log 'stop'
      @docSelector.off("mousemove", @handle).one("mouseover", @start)


  class Keyboard extends Eventable
    keyboardEvents = ['focus', 'blur', 'select', 'keyup', 'keydown', 'change']

    keys =
      shiftKey: false
      altKey: false
      ctrlKey: false
      metaKey: false
      keyCode: 0

    constructor: ->
      $(document).on(keyboardEvents.join(' '), @handle)

    handle: (event) =>
      inputtext = event.target.$view
      type = event.type

      for key, value of keys
        # console.log value, key
        keys[key] = event[key]
      keys.type = type
      
      if inputtext
        inputtext.sendEvent(type, keys)
        # send text events
        if (type == 'keydown' or type == 'keyup' or type == 'blur' or type == 'change')
          value = event.target.value
          if (inputtext.text != value)
            inputtext.text = value
            inputtext.sendEvent('text', value);

      # keys.inputtext = inputtext
      @sendEvent(type, keys)
      # console.log 'handleKeyboard', type, inputtext, keys, event


  mouse = new Mouse()
  keyboard = new Keyboard()


  exports = 
    view: View
    class: Class
    node: Node
    mouse: mouse
    keyboard: keyboard
    layout: Layout
    simplelayout: SimpleLayout
    initElements: dom.initAllElements
    writeCSS: dom.writeCSS


lz.writeCSS()
$(window).on('load', -> 
  lz.initElements() 
  # listen for jQuery style changes
  hackstyle(true)
)