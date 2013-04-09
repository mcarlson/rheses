hackstyle = do ->
	# hack jquery to send a style event when CSS changes
	stylemap= {left: 'x', top: 'y', 'background-color': 'bgcolor'}
	origstyle = $.style;
	$.style = (elem, name, value) ->
	  returnval = origstyle.apply(this, arguments);
	  locked = elem?.$view?.locked
	  name = stylemap[name] or name
	  if locked != name
		  # we are setting and aren't disabled
		  sendstyle = elem?.$view?._callbacks?[name]
#		  console.log('sending style', name, elem.$view.locked) if sendstyle
		  if sendstyle
		    elem.$view.locked = name;
		    elem.$view.setAttribute(name, value)
		    elem.$view.locked = null

	  returnval;


window.lz = do ->
	# from https://github.com/spine/spine/tree/dev/src
	Events =
	  bind: (ev, callback) ->
#	    console.log 'binding', ev, callback
	    evs   = ev.split(' ')
	    calls = @hasOwnProperty('_callbacks') and @_callbacks or= {}
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
	    list = @hasOwnProperty('_callbacks') and @_callbacks?[ev]
	    return unless list
#	    if list then console.log 'trigger', ev, list
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
	      @_callbacks = {}
	      return this
	    evs  = ev.split(' ')
	    for name in evs
	      list = @_callbacks?[name]
	      continue unless list
	      unless callback
	        delete @_callbacks[name]
	        continue
	      for cb, i in list when (cb is callback)
	        list = list.slice()
	        list.splice(i, 1)
	        @_callbacks[name] = list
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
#		    	console.log key, obj, @::
	      @::[key] = value
	    obj.included?.apply(this, [obj])
	    this


	class Node extends Module
		@include Events

		constructor: (el, options) ->
			@children = []
			@types = {}
			@constraints = {}
#			console.log 'new node', @, @ instanceof View
			@init(options) unless @ instanceof View

		scopes = null
		propertyBindings = 
			find: (expression) ->
				ast = acorn.parse(expression)
				scopes = []
				acorn.walkDown(ast, @)
				return scopes
			MemberExpression: (n) ->
				# grab the property name
        name = n.property.name

        # remove the property so we can compute the rest of the expression
        n = n.object;

        scopes.push({binding: acorn.stringify(n), property: name})
#       console.log 'MemberExpression', name, acorn.stringify n
        return true

		matchConstraint = /\${(.+)}/
		applyConstraint: (name, value) ->
			constraint = value.match?(matchConstraint)
			if expression = constraint?[1]
				@constraints[name] = (new Function([], 'return ' + expression)).bind(@)
#				console.log 'adding constraint', name, constraint[1], this
#				console.log 'eval', @constraints[name]()

				scopes = propertyBindings.find(expression)
#				console.log 'found scopes', scopes

				constraintBinding = @constraints[name];
				constraintBinding.bindings ?= {}

				for scope in scopes
					{binding, property} = scope
					bindingfn = (new Function([], 'return ' + binding)).bind(@)
					constraintBinding.bindings[property] = bindingfn;
#					console.log('bound', name, expression, property, binding)

#				console.log 'matched constraint', name, @, expression
				return true

		setAttribute: (name, value) ->
			return if @applyConstraint(name, value)
				
			# coerce value to type
			if name of @types
				type = @types[name]
				if type == 'number'
					value = parseFloat(value)
#				console.log 'type', name, type, value

#			console.log 'setAttribute', name, value
			setter = 'set_' + name
			if setter of @
	#			console.log 'calling setter', setter, value, @[setter]
				@[setter]?(value)
			else if name.indexOf('on_') == 0
				name = name.substr(3)
#				console.log('binding to event expression', name, value, @)
				@bind(name, @eventCallback(name, value, @))
			else
	#			console.log 'setting style', name, value
				@[name] = value

			# send event
			@trigger(name)

		# generate a callback for an event expression, e.g. on_x="console.log(value, ...)"
		eventCallback: (name, js, scope) ->
#			console.log 'binding to event expression', name, js, scope
			() =>
				val = scope[name]
#				console.log 'event callback', name, val, scope
				(new Function(['value'], js).bind(scope))(val)

		bindConstraints: () ->
			# register constraints last
			for name, value of @constraints
#				console.log 'applying constraint', name, value, this
#				console.log 'applied', value()
				@setAttribute(name, value())
				for js, binding of @constraints[name].bindings
#					console.log 'binding to scope', js, binding, name, value()
					binding().bind(js, @constraintCallback(js, value, name))

		# generate a callback for a constraint expression, e.g. x="${this.parent.baz.x + 10}"
		constraintCallback: (name, fn, propname) ->
#			console.log('binding to constraint expression', name, fn, @)
			() =>
#				console.log 'setting', name, fn(), @
				@setAttribute(propname, fn())

		init: (attributes) ->
			for name, value of attributes
				@setAttribute(name, value)
			@bindConstraints()

		set_parent: (parent) ->
#			console.log 'set_parent', parent, @name if @name
			# normalize to jQuery object
			if parent instanceof View
				# store references to parent and children
				@parent = parent
				parent[@name] = @
				parent.children.push(@)
				parent = parent.sprite
			# module APIs must be unique :(
			@setParent? parent

		set_name: (@name) ->
#			console.log 'set_name', name, this
			@parent?[name] = @



	# sprite mixin
	stylemap= {x: 'left', y: 'top', bgcolor: 'background-color'}
	Sprite =
#		guid = 0
		initSprite: (@sprite = $('<div/>')) ->
			# normalize to jQuery object
			@sprite = $(@sprite) unless @sprite instanceof jQuery
#			guid++
#			@sprite.attr('id', 'sprite-' + guid) if not @sprite.attr('id')
			@sprite.addClass('sprite')
#			console.log 'new sprite', @sprite, @parent
		setStyle: (name, value) ->
			value ?= ''
			name = stylemap[name] if name of stylemap
	#		console.log('setStyle', name, value)
			@sprite.css(name, value)
		setParent: (parent) ->
			parent = $(parent) unless parent instanceof jQuery
	#		console.log 'set_parent', parent
			parent.append(@sprite)
		set_id: (@id) ->
#			console.log('setid', @id)
			@sprite.attr('id', @id)
#		included: (module) ->
#			console.log("module included: ", @, module)


	class View extends Node
		@include Sprite

		constructor: (el, options = {}) ->
			super(options)

			if el instanceof HTMLElement 
				if el.$view
					console.warn 'already bound view', el.$view, el
					return

			@types = {x: 'number', y: 'number', width: 'number', height: 'number'}

			if el
				if el instanceof View
					el = el.sprite

			@initSprite el
			@sprite[0].$view = @

			@init(options);
#			console.log 'new view', el, options, @

		setAttribute: (name, value) ->
			@setStyle(name, value)
			super(name, value)


	# init views based on an existing element
	viewFromElement = (el, parent) ->
		tagname = el.localName
		if not tagname of lz
			console.warn 'could not find element', tagname, el
			return

		options = {}
		for i in el.attributes
	#				console.log 'option', i.name, i.value
			options[i.name] = i.value

		parent ?= el.parentNode
		options.parent = parent
	#	console.log 'parent', tagname, options, parent

		children = (child for child in el.childNodes when child.nodeType == 1)

		view = new lz[tagname](el, options)

		for child in children
	#		console.log 'creating child', child, view
	#		console.dir(child)
			if tagname is 'class'
				child.$defer = true
			else
				viewFromElement(child, view) 

	# init all views in the DOM recursively
	init = (selector = $('view')) ->
		for el, i in selector
			viewFromElement(el) unless el.$defer


	class Class
		constructor: (el, classoptions) ->
			options = {}
			for name, value of classoptions
#				console.log 'classoption', name, value
				options[name] = value
			delete options.name
			body = el.innerHTML
			el.innerHTML = ''
			name = el.attributes.name.value
#			console.log('new class', name, options)
			console.warn 'class exists, overwriting', name if name of lz
			lz[name] = (instanceel, overrides) ->
				for key, value of overrides
#					console.log 'overriding class option', key, value
					options[key] = value
				delete options.name unless overrides.name
#				console.log 'creating class instance', name, options.name, children, options
				view = new View(instanceel, options)
				viewel = view.sprite?[0]
				return if not viewel

				viewel.innerHTML = body
				children = (child for child in viewel.childNodes when child.nodeType == 1)
				for child in children
					delete child.$defer
#					console.log 'creating class child in parent', child, view
					viewFromElement(child, view) 


	exports = {
		view: View,
		class: Class,
		node: Node,
		init: init,
		stylemap: stylemap
	}

$(window).on('load', () ->
	lz.init()
	canvas = new lz.view(null, {x: 100, y: 100, bgcolor: 'red', width: 100, height: 100, transform: 'rotate(45deg)', parent: $('#canvas')})
	aview = new lz.view(null, {x: 50, y:50, width:20, height:20, bgcolor: 'green', 'border-radius': '4px', parent:canvas})
)
