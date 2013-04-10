hackstyle = do ->
	# hack jQuery to send a style event when CSS changes
	stylemap= {left: 'x', top: 'y', 'background-color': 'bgcolor'}
	origstyle = $.style
	styletap = (elem, name, value) ->
	  returnval = origstyle.apply(this, arguments)
	  name = stylemap[name] or name
	  # we are setting and aren't disabled
	  sendstyle = elem.$view?.events?[name]
#		  console.log('sending style', name, elem.$view._locked) if sendstyle
	  if sendstyle
	  	view = elem.$view
	  	if (view[name] != value)	
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
#	    console.log 'binding', ev, callback
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
#		    	console.log key, obj, @::
	      @::[key] = value
	    obj.included?.apply(this, [obj])
	    this


	class Node extends Module
		@include Events

		constructor: (el, attributes = {}) ->
			@types = {x: 'number', y: 'number', width: 'number', height: 'number'}
			if attributes.types
				for name, type of attributes.types
#					console.log 'adding type', name, type
					@types[name] = type
				delete attributes.types

#			console.log 'new node', @, attributes
			@init(attributes)

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
        n = n.object

        scopes.push({binding: acorn.stringify(n), property: name})
#       console.log 'MemberExpression', name, acorn.stringify n
        return true

		matchConstraint = /\${(.+)}/
		applyConstraint: (name, expression) ->
			@constraints ?= {}
			@constraints[name] = (new Function([], 'return ' + expression)).bind(@)
#			console.log 'adding constraint', name, expression, @
#				console.log 'eval', @constraints[name]()

			scopes = propertyBindings.find(expression)
#				console.log 'found scopes', scopes

			constraintBinding = @constraints[name]
			bindings = constraintBinding.bindings or= {}

			for scope in scopes
				bindexpression = scope.binding
				scope.compiled = (new Function([], 'return ' + bindexpression)).bind(@)
				bindings[bindexpression] = scope
#				console.log 'applied', scope.property, bindexpression, 'for', @

#				console.log 'matched constraint', name, @, expression

		setAttribute: (name, value) ->
			if @[name] != value
				constraint = value.match?(matchConstraint)
				if constraint
			  	@applyConstraint(name, constraint[1])
			  	return
					
				# coerce value to type
				if name of @types
					type = @types[name]
					if type == 'number'
						value = parseFloat(value)
#				console.log 'type', name, type, value

#			console.log 'setAttribute', name, value
				setter = 'set_' + name
				if setter of @
	#				console.log 'calling setter', setter, value #, @[setter]
					@[setter]?(value)
				else if name.indexOf('on_') == 0
					name = name.substr(3)
	#				console.log('binding to event expression', name, value, @)
					@bind(name, @eventCallback(name, value, @))
				else
		#			console.log 'setting style', name, value
					@[name] = value

			# send event
			@trigger(name, @, name, value) if @events?[name]

		# generate a callback for an event expression in a way that preserves scope, e.g. on_x="console.log(value, this, ...)"
		eventCallback: (name, js, scope) ->
#			console.log 'binding to event expression', name, js, scope
			() ->
				val = scope[name]
#				console.log 'event callback', name, val, scope
				(new Function(['value'], js)).bind(scope)(val)

		bindConstraints: () ->
			# register constraints last
			for name, value of @constraints
#				console.log 'binding constraint', name, value, this
				@setAttribute(name, value())
				for bindexpression, binding of @constraints[name].bindings
					property = binding.property
					boundref = binding.compiled()
					boundref = boundref.$view if boundref.$view
#					console.log 'binding to', property, 'on', boundref
					boundref.bind(property, @constraintCallback(name, value))

		# generate a callback for a constraint expression, e.g. x="${this.parent.baz.x + 10}"
		constraintCallback: (name, value) ->
#			console.log('binding to constraint expression', name, fn, @)
			() =>
#				console.log 'setting', name, fn(), @
				@setAttribute(name, value())

		init: (attributes) ->
			for name, value of attributes
				@setAttribute(name, value)
			@bindConstraints() if @constraints
			@trigger('init', @) if @events?[name]

		set_parent: (parent) ->
#			console.log 'set_parent', parent, @
			# normalize to jQuery object
			if parent instanceof Node
				# store references to parent and children
				@parent = parent
				parent[@name] = @ if @name?
				parent.subnodes ?= []
				parent.subnodes.push(@)
				parent.trigger('subnodes', @) if parent.events?['subnodes']

		set_name: (@name) ->
#			console.log 'set_name', name, this
			@parent?[name] = @


	class Sprite
#		guid = 0
		stylemap= {x: 'left', y: 'top', bgcolor: 'background-color'}

		constructor: (@jqel = $('<div/>'), view) ->
#			console.log 'new sprite', @jqel, view
			@jqel = $(@jqel) unless @jqel instanceof jQuery
			@jqel[0].$view = view

			# normalize to jQuery object
#			guid++
#			@jqel.attr('id', 'jqel-' + guid) if not @jqel.attr('id')
			@jqel.addClass('sprite')
		setStyle: (name, value) ->
			value ?= ''
			name = stylemap[name] if name of stylemap
	#		console.log('setStyle', name, value)
			@jqel.css(name, value)
		setParent: (parent) ->
			if parent instanceof Sprite
				parent = parent.jqel

			parent = $(parent) unless parent instanceof jQuery
	#		console.log 'set_parent', parent
			parent.append(@jqel)
		set_id: (@id) ->
#			console.log('setid', @id)
			@jqel.attr('id', @id)
#		included: (module) ->
#			console.log("module included: ", @, module)


	ignoredAttributes = {parent: true, id: true, name: true, extends: true}
	class View extends Node
		constructor: (el, attributes = {}) ->
			if (el instanceof HTMLElement and el.$view)
				console.warn 'already bound view', el.$view, el
				return

			if (el and el instanceof View)
				el = el.sprite

			@sprite = new Sprite(el, @)

			super(el, attributes)
#			console.log 'new view', el, attributes, @

		setAttribute: (name, value, skipsend) ->
			if (skipsend or ignoredAttributes[name] or value == this[name])
#				console.log 'skipping style', name, this[name], value, @
			else
				@sprite.setStyle(name, value)
			super(name, value)

		set_parent: (parent) ->
#			console.log 'view set_parent', parent, @
			super(parent)

			# store references subviews
			if parent instanceof View
				parent.subviews ?= []
				parent.subviews.push(@)
				parent.trigger('subviews', @) if parent.events?['subviews']
				parent = parent.sprite
			@sprite.setParent parent

		set_id: (@id) ->
			@sprite.set_id(id)


	# init classes based on an existing element
	initFromElement = (el, parent) ->
		tagname = el.localName
		if not (tagname of lz)
			console.warn 'could not find class for tag', tagname, el
			return

		attributes = {}
		for i in el.attributes
	#				console.log 'option', i.name, i.value
			attributes[i.name] = i.value

		parent ?= el.parentNode
		attributes.parent = parent
#		console.log 'parent', tagname, attributes, parent

		children = (child for child in el.childNodes when child.nodeType == 1)

		parent = new lz[tagname](el, attributes)

		for child in children
#			console.log 'creating child', child, parent
	#		console.dir(child)
			if tagname is 'class'
				child.$defer = true
			else
				initFromElement(child, parent) 

	# init all views in the DOM recursively
	init = (selector = $('view')) ->
		for el, i in selector
			initFromElement(el) unless el.$defer
		# listen for jQuery style changes
		hackstyle(true)


	class Class
		constructor: (el, attributes = {}) ->
			name = attributes.name
			ext = attributes.extends ?= 'view'
			for ignored of ignoredAttributes
				delete attributes[ignored]
				
			body = el.innerHTML
			el.innerHTML = ''
#			console.log('new class', name, attributes)
			console.warn 'class exists, overwriting', name if name of lz
			lz[name] = (instanceel, overrides) ->
				for key, value of overrides
#  				console.log 'overriding class option', key, value
					attributes[key] = value
#				console.log 'creating class instance', name, attributes.name, children, attributes
				parent = new lz[ext](instanceel, attributes)
#				console.log 'created instance', name, parent

				viewel = parent.sprite?.jqel?[0]
				return if not viewel

				viewel.innerHTML = body
				children = (child for child in viewel.childNodes when child.nodeType == 1)
				for child in children
					delete child.$defer
#					console.log 'creating class child in parent', child, parent
					initFromElement(child, parent)


	class Layout extends Node
		constructor: (el, attributes = {}) ->
			@locked = true
			super(el, attributes)
			@parent.bind('subviews', @added)
			subviews = @parent.subviews
			if subviews
				for subview in subviews
					@added(subview)
			@locked = false
			@update()
			#console.log('layout', @parent, attributes)

		added: (child) =>
#			console.log 'added', child, @
			@update(child)

		update: (sender) ->
#			console.log 'update', sender


	class SimpleLayout extends Layout
		attribute = 'x'
		axis = 'width'
		spacing = 10
		inset = 10

		constructor: (el, attributes = {}) ->
			attributes.types ?= {}
			attributes.types.spacing = 'number'
			attributes.types.inset = 'number'
			super(el, attributes)
			@update()

		set_attribute: (attr) ->
			axis = switch attr
				when 'x' then 'width' 
				when 'y' then 'height'
			axis = 'width' if attr is 'x'
			attribute = attr
#			console.log('set_attribute', attr, typeof attr)
			@update()

		set_spacing: (space) ->
#			console.log('set_spacing', space, typeof space)
			spacing = space
			@update()

		set_inset: (i) ->
#			console.log('set_spacing', space, typeof space)
			inset = i
			@update()

		added: (child) ->
#			console.log 'added', child
			child.bind(axis, @update)
			super(child)

		update: (sender) ->
			if @locked
#				console.log 'locked'
				return
			subviews = @parent.subviews
			if not subviews
				return
			super(sender)
			pos = inset
			skip = true if sender
			for subview in subviews
				if (skip and subview != sender)
#					console.log 'skipping', subview
				else 
#					console.log 'updating', subview, attribute, pos
					subview.setAttribute(attribute, pos) unless subview[attribute] == pos
					skip = false

				pos += spacing + subview[axis]


	exports = {
		view: View,
		class: Class,
		node: Node,
		layout: Layout,
		simplelayout: SimpleLayout,
		init: init
	}

$(window).on('load', () ->
	lz.init()
	canvas = new lz.view(null, {x: 100, y: 100, bgcolor: 'red', width: 100, height: 100, transform: 'rotate(45deg)', parent: $('#canvas')})
	aview = new lz.view(null, {x: 50, y:50, width:20, height:20, bgcolor: 'green', 'border-radius': '4px', parent:canvas})
)
