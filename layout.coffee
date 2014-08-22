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
      view.setAttribute(name, value, true)

    returnval

  return (active) ->
    if active
      $.style = styletap
    else
      $.style = origstyle


window.lz = do ->
  # from http://coffeescriptcookbook.com/chapters/classes_and_objects/mixins
  mixOf = (base, mixins...) ->
    class Mixed extends base
    for mixin, i in mixins by -1
      for name, method of mixin::
        Mixed::[name] = method
    Mixed

  # from https://github.com/spine/spine/tree/dev/src
  Events =
    bind: (ev, callback) ->
      # console.log 'binding', ev, callback
      evs   = ev.split(' ')
      @events = {} unless @hasOwnProperty('events') and @events
      for name in evs
        @events[name] or= []
        @events[name].push(callback)
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
      # console.log('listenTo', obj, ev, callback, obj.bind)
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
          # console.log('stopListening', idx, obj, listeningTo)
          if idx > -1
            listeningTo.splice(idx, 1)
          else
            # console.log('looking in array', listeningTo)
            for val, index in listeningTo
              # console.log('found', val)
              if obj == val.obj and ev == val.ev and callback == val.callback
                # console.log('found match', index)
                listeningTo.splice(index, 1)
                break
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
    usecache = window.location.search.indexOf('nocache') == -1
    debug = window.location.search.indexOf('debug') > 0
    strict = window.location.search.indexOf('strict') > 0

    cacheKey = "compilecache"
    if usecache and cacheKey of localStorage
      compileCache = JSON.parse(localStorage[cacheKey])
      # console.log 'restored', compileCache
    else
      compileCache = 
        bindings: {}
        script: 
          coffee: {}
      localStorage[cacheKey] = JSON.stringify(compileCache) 

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
        return bindingCache[expression] if usecache and expression of bindingCache
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
          if usecache and script of coffeeCache
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
    compile = (script='', args=[], name='') ->
      argstring = args.join()
      key = script + argstring + name
      return scriptCache[key] if key of scriptCache
      # console.log 'compile', args, script
      try 
        # console.log scriptCache
        if debug and name
          script = "\"use strict\"\n" + script if strict
          func = new Function("return function #{name}(#{argstring}){#{script}}")()
        else
          func = new Function(args, script)
        #console.log func()
        scriptCache[key] = func
      catch e
        console.error 'failed to compile', e.toString(), args, script 

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
        attributes.$textcontent = el.textContent

      if attributes.$methods
        @installMethods(attributes.$methods, attributes.$tagname)
        delete attributes.$methods

      if attributes.$handlers
        @installHandlers(attributes.$handlers, attributes.$tagname)
        # do this here for now - ugly though
        for {name, script, args, reference, method} in attributes.$handlers
          name = name.substr(2)
          if name in mouseEvents
            attributes.clickable = true unless attributes.clickable is "false"
            # console.log 'registered for clickable', attributes.clickable

        delete attributes.$handlers

      if attributes.parent
        par = attributes.parent
        delete attributes.parent
      if attributes.name
        nam = attributes.name
        delete attributes.name

      # Bind to event expressions and set attributes
      for name, value of attributes
        @bindAttribute(name, value, attributes.$tagname)
      constraintScopes.push(@) if @constraints 

      if par
        @setAttribute('parent', par)
      if nam
        @setAttribute('name', nam)

      # console.log 'new node', @, attributes
      @sendEvent('init', @)

    installMethods: (methods, tagname, scope=@, callbackscope=@) ->
      # Install methods
      for name, methodspec of methods
        # console.log 'installing method', name, methodspec, @
        _installMethod(scope, name, compiler.compile(methodspec[0], methodspec[1], "#{tagname}$#{name}").bind(callbackscope), methodspec[2])

    installHandlers: (handlers, tagname, scope=@) ->
      for handler in handlers
        {name, script, args, reference, method} = handler
        # strip off leading 'on'
        name = name.substr(2)

        # console.log 'installing handler', name, args, script, @
        if method
          handler.callback = scope[method]
          # console.log('using method', method, callback)
        else
          handler.callback = _eventCallback(name, script, scope, tagname, args)

        if reference?
          # console.log('listening to reference', reference, eval(reference), name, callback)
          scope.listenTo(eval(reference), name, handler.callback)
        else
          scope.bind(name, handler.callback)

    removeHandlers: (handlers, tagname, scope=@) ->
      for handler in handlers
        {name, script, args, reference, method} = handler
        # strip off leading 'on'
        name = name.substr(2)

        # console.log 'removing handler', name, args, script, @
        if reference?
          # console.log('stopListening to reference', reference, eval(reference), name, handler.callback)
          scope.stopListening(eval(reference), name, handler.callback)
        else
          scope.unbind(name, handler.callback)

    # Bind an attribute to an event expression, handler, or delegate to setAttribute()
    bindAttribute: (name, value, tagname) ->
      constraint = value.match?(matchConstraint)
      if constraint
        @applyConstraint(name, constraint[1])
      else if name.indexOf('on') == 0
        name = name.substr(2)
        # console.log('binding to event expression', name, value, @)
        @bind(name, _eventCallback(name, value, @, tagname))
      else
        @setAttribute(name, value)

    # public API
    initConstraints: ->
      _initConstraints()
      @

    # generate a callback for an event expression in a way that preserves scope, e.g. on_x="console.log(value, this, ...)"
    _eventCallback = (name, script, scope, tagname='', fnargs=['value']) ->
      # console.log 'binding to event expression', name, script, scope, fnargs
      js = compiler.compile(script, fnargs, "#{tagname}$on#{name}")
      ->
        if arguments.length
          args = arguments
        else if name of scope
          args = [scope[name]]
        else 
          args = []
        # console.log 'event callback', name, args, scope, js
        js.apply(scope, args)

    _installMethod = (scope, methodname, method, classmethod) ->
      # TODO: add class methods when classmethod == 'class'
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
      # console.log 'adding constraint', property, expression, @
      @constraints[property] = 
        expression: 'return ' + expression #compiler.compile('return ' + expression).bind(@)
        bindings: {}

      bindings = @constraints[property].bindings
      scopes = compiler.findBindings(expression)
      # console.log 'found scopes', scopes
      for scope in scopes
        bindexpression = scope.binding
        bindings[bindexpression] ?= []
        bindings[bindexpression].push(scope)
        # console.log 'applied', scope.property, bindexpression, 'for', @

      # console.log 'matched constraint', property, @, expression
      return

    _bindConstraints: ->
      for name, constraint of @constraints
        {bindings, expression} = constraint
        fn = compiler.compile(expression).bind(@)
        # console.log 'binding constraint', name, expression, @
        constraint = @_constraintCallback(name, fn)
        for bindexpression, bindinglist of bindings
          boundref = compiler.compile('return ' + bindexpression).bind(@)()
          boundref ?= boundref.$view
          for binding in bindinglist
            property = binding.property
            # console.log 'binding to', property, 'on', boundref
            boundref.bind?(property, constraint)
          
        @setAttribute(name, fn())
      return

    # generate a callback for a constraint expression, e.g. x="${this.parent.baz.x + 10}"
    _constraintCallback: (name, fn) ->
      # console.log('binding to constraint function', name, fn, @)
      return `(function constraintCallback(){`
      # console.log 'setting', name, fn(), @
      this.setAttribute(name, fn())
      `}).bind(this)`

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
      @parent[name] = @

    set_id: (id) ->
      window[id] = @

    _removeFromParent: (name) ->
      return unless @parent
      arr = @parent[name]
      index = arr.indexOf(@)
      if (index != -1)
        arr.splice(index, 1)
        # console.log('_removeFromParent', index, name, arr.length, arr, @)
        @parent.sendEvent(name, arr[index])
      return

    _findInParents: (name) ->
      p = @parent
      while (p)
        if name of p
          # console.log 'found in parent', name, p
          return p[name]
        p = p.parent

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
        subnode?.destroy(true)

      @_removeFromParent('subnodes') unless skipevents


  class Sprite
#    guid = 0
    noop = () ->
    stylemap= {x: 'left', y: 'top', bgcolor: 'backgroundColor'}
    fcamelCase = ( all, letter ) ->
      letter.toUpperCase()
    rdashAlpha = /-([\da-z])/gi
    capabilities =
      # detect touchhttp://stackoverflow.com/questions/4817029/whats-the-best-way-to-detect-a-touch-screen-device-using-javascript
      touch: 'ontouchstart' of window || 'onmsgesturechange' of window # deal with ie10

    constructor: (jqel, view, tagname = 'div') ->
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
      @el.setAttribute('class', 'sprite')
      # @jqel = $(@el)

    setStyle: (name, value) ->
      value ?= ''
      if name of stylemap
        name = stylemap[name] 
      else if name.match(rdashAlpha)
        # console.log "replacing #{name}"
        name = name.replace(rdashAlpha, fcamelCase)
      # console.log('setStyle', name, value, @el)
      @el.style[name] = value
      # @jqel.css(name, value)

    set_parent: (parent) ->
      if parent instanceof Sprite
        parent = parent.el
      # else if parent instanceof jQuery
      #   parent = parent[0]

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
      @setStyle('cursor', if clickable then 'pointer' else '')

      if capabilities.touch
        # ugly hack to make touch events emulate clicks, see http://sitr.us/2011/07/28/how-mobile-safari-emulates-mouse-events.html
        @el.onclick = noop

      # TODO: retrigger the event for the element below for IE and Opera? See http://stackoverflow.com/questions/3680429/click-through-a-div-to-underlying-elements
      # el = $(event.target)
      # el.hide()
      # $(document.elementFromPoint(event.clientX,event.clientY)).trigger(type)
      # el.show()

    destroy: ->
      @el.parentNode.removeChild(@el)
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
      return unless @input
      if value?
        @input.value = value
      else
        @input.value

    measureTextSize: (multiline, width) ->
      @el.setAttribute('class', 'sprite sprite-text noselect')
      if multiline
        if @_cachedwidth > -1
          width = @_cachedwidth
          @_cachedwidth = -1
        @setStyle('width', width)
        @setStyle('whiteSpace', 'normal')
      else
        @_cachedwidth = width
        @setStyle('width', 'auto')
        @setStyle('whiteSpace', '')
      {width: @el.clientWidth, height: @el.clientHeight}

    handle: (event) =>
      view = event.target.$view
      return unless view
      # console.log 'event', event.type, view
      view.sendEvent(event.type, view)

    createInputtextElement: (text, multiline, width) ->
      input = document.createElement('input')
      input.setAttribute('type', 'text')
      input.setAttribute('value', text)
      input.setAttribute('style', 'border: none; outline: none; background-color:transparent;')
      input.setAttribute('class', 'noselect')
      @el.setAttribute('class', 'sprite noselect')
      @el.appendChild(input)

      setTimeout(() =>
        return unless @el
        @input = @el.getElementsByTagName('input')[0]
        @input.$view = @el.$view
        $(input).on('focus blur', @handle)
      , 0)

    getAbsolute: () ->
      @jqel ?= $(@el)
      pos = @jqel.offset()
      {x: pos.left, y: pos.top}

    set_class: (classname) ->
      # console.log('setid', @id)
      @el.setAttribute('class', classname)

  class Clickable
    set_clickable: (clickable) ->
      @sprite.set_clickable(clickable)
      # super?(clickable)

  # internal attributes ignored by class declarations and view styles
  ignoredAttributes = {parent: true, id: true, name: true, extends: true, type: true, scriptincludes: true}
  class View extends mixOf Node, Clickable
    constructor: (el, attributes = {}) ->
      @subviews = []
      types = {x: 'number', y: 'number', width: 'number', height: 'number', clickable: 'boolean', clip: 'boolean'}
      for key, type of types
        if not (key of attributes)
          @[key] = if type is 'number' then 0 else false
          # console.log 'set default', key, type, @[key]

      for key, type of attributes.$types
        types[key] = type
      attributes.$types = types

      if (el instanceof View)
        el = el.sprite

      # console.log 'sprite tagname', attributes.$tagname
      @sprite = new Sprite(el, @, attributes.$tagname)

      super
      # console.log 'new view', el, attributes, @

    setAttribute: (name, value, skip) ->
      if not (skip or name of ignoredAttributes or @[name] == value)
        # console.log 'setting style', name, value, @
        @sprite.setStyle(name, value)
      super

    set_parent: (parent) ->
      # console.log 'view set_parent', parent, @
      super

      # store references subviews
      if parent instanceof View
        parent.subviews.push(@)
        parent.sendEvent('subviews', @)
        parent = parent.sprite

      @sprite.set_parent parent

    set_id: (id) ->
      super
      @sprite.set_id(id)

    animate: ->
      # console.log 'animate', arguments, @sprite.animate
      @sprite.animate.apply(this, arguments)

    set_clip: (clip) ->
      @sprite.set_clip(clip)

    destroy: (skipevents) ->
      # console.log 'destroy view', @
      super
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

    # initialize a top-level view element
    initFromElement = (el) ->
      el.style.display = 'none'
      findAutoIncludes(el, () ->
        el.style.display = null
        initElement(el)
        # register constraints last
        _initConstraints()
      )

    findAutoIncludes = (parentel, callback) ->
      jqel = $(parentel)
      includerequests = []

      includedScripts = {}
      loadqueue = []
      scriptloading = false
      loadScript = (url, cb) ->
        return if url of includedScripts
        includedScripts[url] = true

        if (scriptloading)
          loadqueue.push(url)
          return url

        appendScript = (url, cb) ->
          # console.log('loading script', url)
          scriptloading = url
          script = document.createElement('script')
          script.type = 'text/javascript'
          $('head').append(script)
          script.onload = cb
          script.onerror = () ->
            console.error('failed to load scriptinclude', url)
            cb()
          script.src = url

        appendcallback = () ->
          # console.log('loaded script', scriptloading, loadqueue.length, includedScripts[url])
          scriptloading = false
          if loadqueue.length == 0
            # console.log('done, calling callback', cb)
            cb()
          else
            appendScript(loadqueue.shift(), appendcallback)

        appendScript(url, appendcallback)

      inlineclasses = {}
      lzxrequests = []
      lzxloaded = {}
      loadLZX = (name, el) ->
        return if name of lz or name of lzxloaded or name in specialtags or name of inlineclasses or name in builtinTags
        lzxloaded[name] = true
        url = 'classes/' + name + '.lzx'
        # console.log 'loading lzx', url
        prom = $.get(url)
        prom.url = url
        prom.el = el
        lzxrequests.push(prom)

      # load includes 
      for jel in jqel.find('include')
        includerequests.push($.get(jel.attributes.href.value))

      # wait for all includes to load
      $.when.apply($, includerequests).done((args...) ->
        # append includes
        args = [args] if (includerequests.length == 1)

        includeRE = /<[\/]*library>/gi
        initONE = false
        for xhr in args
          # remove any library tags found
          html = xhr[0].replace(includeRE, '')
          # console.log 'inserting include', html
          jqel.prepend(html)

        # look for class declarations and unloaded classes for tags
        for el in jqel.find('*')
          name = el.localName
          if name == 'class'
            if el.attributes.extends
              extendz = el.attributes.extends.value 
              # load load class extends
              loadLZX(extendz, el)
              initONE = true if extendz = 'state'
            # track incline class declaration so we don't load it again later
            inlineclasses[el.attributes.name.value] = true
          else if name == 'state'
            initONE = true
          else
            # load class instance for tag
            loadLZX(name, el)
   
        # console.log(lzxrequests, lzxloaded, inlineclasses)
        # wait for all lzx files to finish loading
        $.when.apply($, lzxrequests).done((args...) ->
          args = [args] if (lzxrequests.length == 1)
          for xhr in args
            # console.log 'inserting html', xhr[0] 
            jqel.prepend(xhr[0])

          # find class script includes and load them in lexical order
          scriptsloading = false
          if (initONE)
            # initialize ONE integration
            scriptsloading = loadScript('lib/one_base.js', () ->
              ONE.base_.call(Eventable::)
              # hide builtin keys from learn()
              Eventable::enumfalse(Eventable::keys())
              Node::enumfalse(Node::keys())
              View::enumfalse(View::keys())
              Layout::enumfalse(Layout::keys())
              callback()
            )

          for el in jqel.find('[scriptincludes]')
            for url in el.attributes.scriptincludes.value.split(',')
              scriptsloading = loadScript(url, callback)

          # no class script includes found, execute callback immediately
          unless scriptsloading
            callback()
        ).fail((args...) ->
          args = [args] if (args.length == 1)
          for xhr in args
            console.error('failed to load', xhr.url, 'for element', xhr.el)
        )
      )

    specialtags = ['handler', 'method', 'attribute', 'setter', 'include', 'library']
    # tags built into the browser that should be ignored
    builtinTags = ['input', 'div', 'img', 'script', 'canvas']
    # recursively init classes based on an existing element
    initElement = (el, parent) ->
      # don't init the same element twice
      return if el.$init
      el.$init = true

      tagname = el.localName
      if not (tagname of lz)
        console.warn 'could not find class for tag', tagname, el unless tagname in builtinTags
        return

      attributes = flattenattributes(el.attributes)

      attributes.$tagname = tagname

      # swallow builtin mouse attributes to allow event delegation, set clickable if an event is found
      for event in mouseEvents
        eventname = 'on' + event
        if eventname of attributes
          attributes.clickable = true unless attributes.clickable == false
          el.removeAttribute(eventname)

      parent ?= el.parentNode
      attributes.parent = parent if parent?
      # console.log 'parent for tag', tagname, attributes, parent

      unless (tagname is 'class') or (tagname is 'state') or (attributes.extends is 'state')
        dom.processSpecialTags(el, attributes, attributes.type)

      parent = new lz[tagname](el, attributes)

      unless tagname is 'class' or (tagname is 'state') or (attributes.extends is 'state')
        children = (child for child in el.childNodes when child.nodeType == 1)
        # create children now
        for child in children
          # console.log 'initting class child', child.localName
          initElement(child, parent) unless child.localName in specialtags

      return


    # write default CSS to the DOM 
    writeCSS = ->
      style = document.createElement('style')
      style.type = 'text/css'
      style.innerHTML = '.sprite{ position: absolute; pointer-events: none; padding: 0; margin: 0;} .sprite-text{ width: auto; height; auto; white-space: nowrap;  padding: 0; margin: 0;} .hidden{ display: none; } .noselect{ -webkit-touch-callout: none; -webkit-user-select: none; -khtml-user-select: none; -moz-user-select: none; -ms-user-select: none; user-select: none;} method { display: none; } handler { display: none; } setter { display: none; } class { display:none } node { display:none }'
      document.getElementsByTagName('head')[0].appendChild(style)

    # init top-level views in the DOM recursively
    initAllElements = (selector = $('view').not('view view')) ->
      for el in selector
        initFromElement(el)

    # http://stackoverflow.com/questions/1248849/converting-sanitised-html-back-to-displayable-html
    htmlDecode = (input) ->
      # return if not input
      e = document.createElement('div')
      e.innerHTML = input
      e.childNodes[0]?.nodeValue

    # process handlers, methods, setters and attributes 
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
            allocation = attributes.allocation
            classattributes.$methods[attributes.name] = [compiler.transform(script, type), args, allocation]
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


  class State extends Node
    constructor: (el, attributes = {}) ->
      @skipattributes = ['parent', 'types', 'applyattributes', 'applied', 'skipattributes', 'stateattributes']
      @stateattributes = attributes
      @applyattributes = {}
      @applied = false

      compilertype = attributes.type
      # collapse children into attributes
      processedChildren = dom.processSpecialTags(el, attributes, compilertype)

      # console.log('compiled state', attributes, @)

      # cache the old contents to preserve appearance
      oldbody = el.innerHTML.trim()

      for child in processedChildren
        child.parentNode.removeChild(child)

      # serialize the tag's contents for recreation with processedChildren removed
      instancebody = el.innerHTML.trim()

      # restore old contents
      el.innerHTML = oldbody if (oldbody)

      @types = attributes.$types ? {}

      @setAttribute('parent', attributes.parent)

      # Install methods in the state with the run scope set to the parent
      # These will be applied to the parent by ONE with learn()
      @installMethods(attributes.$methods, @parent.$tagname, @, @parent)

      if attributes.name
        @setAttribute('name', attributes.name) 
        @skipattributes.push('name') 

      # handle applied constraint bindings as local to the state
      if attributes.applied
        @bindAttribute('applied', attributes.applied, 'state')

      for handler in attributes.$handlers
        if handler.name == 'onapplied'
          # console.log('found onapplied', handler) 
          @installHandlers([handler], 'state', @)

      for name, value of attributes
        unless name in @skipattributes or name.charAt(0) == '$'
          @applyattributes[name] = value 
          @setAttribute(name, value)
      # console.log('applyattributes', @applyattributes)

      if @constraints
        @_bindConstraints()
        # prevent warnings if we have a constraint to @applied
        @skipattributes.push('constraints') 

      if @events
        # prevent warnings for local events
        @skipattributes.push('events') 

      # hide local properties we don't want applied to the parent by learn()
      @enumfalse(@skipattributes)
      @enumfalse(@keys)

    set_applied: (applied) ->
      return unless @parent
      return if @applied == applied
      @applied = applied
      @sendEvent('applied', applied)

      # console.log('set_applied', applied, this, @parent)
      if applied
        @parent.learn @
        if @stateattributes.$handlers
          # console.log('installing handlers', @stateattributes.$handlers)
          @parent.installHandlers(@stateattributes.$handlers, @parent.$tagname, @parent)
      else
        @parent.forget @
        if @stateattributes.$handlers
          # console.log('removing handlers', @stateattributes.$handlers)
          @parent.removeHandlers(@stateattributes.$handlers, @parent.$tagname, @parent)

      parentname = @parent.$tagname
      # Hack to set attributes for now - not needed when using signals
      for name of @applyattributes
        val = @parent[name]
        continue if val == undefined
        # learn/forget will have set the value already. Invert to cache bust setAttribute()
        @parent[name] = !val
        # console.log('bindAttribute', name, val)
        @parent.bindAttribute(name, val, parentname)
      
    apply: () ->
      @setAttribute('applied', true) unless @applied

    remove: () ->
      @setAttribute('applied', false) if @applied


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
      # only class instances should specify these
      for ignored of ignoredAttributes
        delete classattributes[ignored]

      # collapse children into attributes
      processedChildren = dom.processSpecialTags(el, classattributes, compilertype)

      # console.log('compiled class', name, extend, classattributes)

      # cache the old contents to preserve appearance
      oldbody = el.innerHTML.trim()

      for child in processedChildren
        child.parentNode.removeChild(child)

      # serialize the tag's contents for recreation with processedChildren removed
      instancebody = el.innerHTML.trim()

      # restore old contents
      el.innerHTML = oldbody if (oldbody)

      # console.log('new class', name, classattributes)
      console.warn 'overwriting class', name if name of lz

      # class instance constructor
      lz[name] = (instanceel, instanceattributes) ->
        # override class attributes with instance attributes
        attributes = clone(classattributes)
        for key, value of instanceattributes
          # console.log 'overriding class attribute', key, value
          if (key is '$methods' or key is '$types') and key of attributes
            attributes[key] = clone(attributes[key])
            # console.log('overwriting', key, attributes[key], value)
            for propname, val of value
              # TODO: deal with method overrides here? Likely not wanted for instance overrides
              attributes[key][propname] = val
            # console.log 'overwrote class attribute', key, attributes[key], value
          else if key is '$handlers' and key of attributes
            # console.log 'concat', attributes[key], value
            attributes[key] = attributes[key].concat(value)
            # console.log 'after concat', attributes[key]
          else 
            attributes[key] = value

        if not (extend of lz)
          console.warn 'could not find class for tag', extend
          return

        # tagname would be 'class' in this case, replace with the right one!
        # also, don't overwrite if it's already set, since we are invoking lz[extend]
        if attributes.$tagname is 'class' or not attributes.$tagname
          attributes.$tagname = name
        # console.log 'creating class instance', name, attributes.$tagname, instanceel, extend, attributes
        parent = new lz[extend](instanceel, attributes)
        # console.log 'created class instance', name, extend, parent

        viewel = parent.sprite?.el

        if instanceel
          # hide contents of invisible nodes
          instanceel.setAttribute('class', 'hidden') unless viewel

        # unpack instance children
        if instancebody and viewel
          if viewel.innerHTML
            # Append class children on instances instead of replacing them
            viewel.innerHTML = instancebody + viewel.innerHTML
            # console.log 'instancebody', instancebody, viewel.innerHTML, viewel
          else
            # console.log 'normal'
            viewel.innerHTML = instancebody

          children = (child for child in viewel.childNodes when child.nodeType == 1)
          for child in children
            # console.log 'creating class child in parent', child, parent
            dom.initElement(child, parent)

          # console.log 'done creating class instance', attributes.__classname if children.length
        return parent


  class Layout extends Node
    constructor: (el, attributes = {}) ->
      @locked = true
      super
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
        @sendEvent('subview', child) unless child.ignorelayout
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
      super
      @_removeFromParent('layouts') unless skipevents

    set_locked: (locked) ->
      changed = @locked != locked
      @locked = locked
      @sendEvent('locked', locked)
      # console.log 'set_locked', locked
      @update() if (changed and not locked)

  idle = do ->
    requestAnimationFrame = window.mozRequestAnimationFrame || window.webkitRequestAnimationFrame# || (delegate) -> setTimeout(delegate, 17)
    ticking = false
    tickEvents = []

    doTick = (time) ->
      for key of tickEvents
        if tickEvents[key] 
          # console.log('tick', key, tickEvents[key])
          tickEvents[key](time)
          tickEvents[key] = null
      ticking = false

    (key, callback) ->
      # console.log('idle', key, callback)
      # console.log('hit', key) if (tickEvents[key] != null) 
      if !ticking
        requestAnimationFrame(doTick)
      ticking = true
      tickEvents[key] = callback


  class StartEventable extends Eventable
    bind: (ev, callback) ->
      super
      if @startEventTest()
        @startEvent()

    unbind: (ev, callback) ->
      super
      if not @startEventTest()
        @stopEvent()

    startEvent: (event) =>
      return if @eventStarted
      @eventStarted = true
      # console.log 'start'

    stopEvent: (event) =>
      return if not @eventStarted
      @eventStarted = false
      # console.log 'stop'


  class Idle extends StartEventable
    startEventTest: () ->
      start = @events['idle']?.length
      if start
        # console.log 'startEventTest', start, @sender
        # @sender()

        return start

    startEvent: (event) =>
      super
      idle(1, @sender)

    sender: (time) =>
      @sendEvent('idle', time)
      # console.log('sender', time, @eventStarted, idle)
      setTimeout(() =>
        idle(1, @sender)
      ,0)


  # singleton that listens for mouse events. Holds data about the most recent left and top mouse coordinates
  mouseEvents = ['click', 'mouseover', 'mouseout', 'mousedown', 'mouseup']
  class Mouse extends StartEventable
    constructor: ->
      @x = 0
      @y = 0
      @docSelector = $(document)
      @docSelector.on(mouseEvents.join(' '), @handle)
      @docSelector.on("mousemove", @handle).one("mouseout", @stopEvent)

    startEventTest: () ->
      @events['mousemove']?.length or @events['x']?.length or @events['y']?.length

    handle: (event) =>
      view = event.target.$view
      type = event.type
      # console.log 'event', type, view
      if view
        view.sendEvent(type, view)

      if @eventStarted and type is 'mousemove'
        @x = event.pageX
        @y = event.pageY
        idle(0, @sender) 
      else 
        @sendEvent(type, view)

    sender: =>
      @sendEvent("mousemove", {x: @x, y: @y})
      @sendEvent('x', @x)
      @sendEvent('y', @y)

    handleDocEvent: (event) ->
      return if event and event.target != document
      if @eventStarted
        @docSelector.on("mousemove", @handle).one("mouseout", @stopEvent)
      else
        @docSelector.on("mousemove", @handle).one("mouseout", @startEvent)


  class Window extends StartEventable
    constructor: ->
      window.addEventListener('resize', @handle, false)
      @handle()

    startEventTest: () ->
      @events['width']?.length or @events['height']?.length

    handle: (event) =>
      @width = window.innerWidth
      @sendEvent('width', @width)
      @height = window.innerHeight
      @sendEvent('height', @height)
      # console.log('window resize', event, @width, @height)


  class Keyboard extends Eventable
    keyboardEvents = ['select', 'keyup', 'keydown', 'change']

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
        # send text events for events that could cause text to change
        if (type == 'keydown' or type == 'keyup' or type == 'blur' or type == 'change')
          value = event.target.value
          if (inputtext.text != value)
            inputtext.text = value
            inputtext.sendEvent('text', value)

      # keys.inputtext = inputtext
      @sendEvent(type, keys)
      # console.log 'handleKeyboard', type, inputtext, keys, event


  exports = 
    view: View
    class: Class
    node: Node
    mouse: new Mouse()
    keyboard: new Keyboard()
    window: new Window()
    layout: Layout
    idle: new Idle()
    state: State
    initElements: dom.initAllElements
    writeCSS: dom.writeCSS


lz.writeCSS()
$(window).on('load', -> 
  lz.initElements() 
  # listen for jQuery style changes
  hackstyle(true)
)