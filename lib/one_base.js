"use strict"

if(typeof window !== 'undefined') window.ONE = {}
else ONE = {}

ONE.init = function(){

	// make ONE a class
	this.base_()
	
	this.__class__ = 'ONE'
	// create base class
	this.base_.call(this.Base = {})
	this.Base.Base = this.Base
	this.signal_.call(this.Base.Signal = this.Signal = {})

	// make ONE the new root scope
	this.Base.$ = this.$ = Object.create(this)

	// hide all the props
	this.Base.enumfalse( Object.keys( ONE.Base ) )
}

ONE.base_ = function(){

	this.__class__ = 'Base'

	// inherit a new class, whilst passing on the scope
	this.extend = function( outer, role, selfname ){

		if(this.owner) throw new Error("You are extending an instance")

		// variable API
		if(typeof outer == 'string') selfname = outer, outer = this
		else if(typeof outer == 'function')  selfname = role, role = outer, outer = this
		else if(typeof role == 'string') selfname = role, role = outer, outer = this

		var obj = Object.create(this)

		if(outer && outer.$) obj.$ = outer.$
		obj.__class__ = selfname || 'unknown-class'

		// allow reference to self on inherited classes
		if(selfname) obj[selfname] = obj
		
		if( role ){
			if( typeof role == 'function') role.call(obj, outer)
			else obj.import(role)
		}
		return obj
	}

	// new an object with variable arguments and automatic owner
	this.new = function( owner ){

		if(this.owner !== undefined) throw new Error("You are newing an instance")

		var obj = Object.create(this)

		var len = arguments.length
		Object.defineProperty( obj, 'owner', {value:owner || null, enumerable:false, configurable:false} )

		if(len > 1){
			if(obj._init) obj._init.apply(obj, Array.prototype.slice.call(arguments, 1))
			else if(obj.init) obj.init.apply(obj, Array.prototype.slice.call(arguments, 1))
		}
		else {
			if(obj._init) obj._init()
			else if(obj.init) obj.init()
		}

		return obj
	}

	// call signature for new
	this.call = function( pthis, role, owner ){
		if(pthis !== this) throw new Error("Base.call used with different this")
		if(this.owner !== undefined) throw new Error("You are newing an instance")

		var obj = Object.create(this)

		obj.owner = owner || null

		if(obj._init) obj._init()
		else if(obj.init) obj.init()

		if( role ) role.call( obj )

		return obj
	}

	// apply forwards to call
	this.apply = function( pthis, args ){
		this.call.apply(this, [pthis].concat(args))
	}

	this.isClass = function(){
		return this.owner === undefined
	}

	this.isInstance = function(){
		return this.owner !== undefined
	}

	this.prototypeOf = function( other ){
		return this.isPrototypeOf( other )
	}

	// plain value storage wrapper for overloads
	function StackValue(v){
		this.v = v
	}
	
	// load a property bag into a new object
	this.load = function( irole ){
		var role = irole
		if(typeof irole == 'string'){// try to read it from scope
			role = this.$[irole]
			if(!role) throw new Error("Cannot find role "+irole+" on this")
		}

		if(typeof role == 'function'){
			var base = this.Base.new(this)
			role.call(base)
			return base
		}

		return role
	}

	// merge a role onto this
	this.import = function( irole ){
		var role = irole
		if( typeof irole == 'string' ){// try to read it from scope
			role = this.$[irole]
			if( !role ) throw new Error("Cannot find role "+irole+" on this")
		}

		if( typeof role == 'function' ){
			role.call( this )
			return this
		}
		
		if( typeof role == 'object' ){
			for( var k in role ) this[ k ] = role[ k ]
			return this
		}

		throw new Error('could not mix in', irole)
	}

	// Internal prefixes:
	// __xx = computed value storage
	// __xx__ = class datastructures
	// $ = scope object

	// learn a property bag, creates undo stacks so forget works.
	this.learn = function( ){

		var roles
		var overloads
		var isfirst
		if( !this.hasOwnProperty('__roles__') ){
			roles = this.__roles__ = [ ] 
			isfirst = true
			Object.defineProperty( this, '__roles__', {enumerable:false, configurable:false} )
			if(! this.hasOwnProperty('__overloads__') ){
				overloads = this.__overloads__ = Object.create(null)
				Object.defineProperty( this, '__overloads__', {enumerable:false, configurable:false} )
			}
		} 
		else {
			roles = this.__roles__
			overloads = this.__overloads__
		}
		
		var learn = [ ]
		for(var i = 0, len = arguments.length; i < len; i++){
			var role = arguments[ i ]

			if(typeof role == 'function'){
				var obj = Object.create(ONE.Base)
				obj.__teach__ = this
				obj.__role__ = role
				if(i == 0 && arguments.length > 1) role.apply(obj, Array.prototype.slice(arguments, 1))
				else role.call(obj, this)
				role = obj
			} 
			
			if(typeof role != 'object') throw new Error("Cannot learn role " + role)

			if(roles.indexOf(role) == -1){
				roles.push(role)
				learn.push(role)
			}
		}

		if(!learn.length) return this
		for(var i = 0, len = learn.length; i < len; i++){
			
			var source = learn[i]
			for(var k in source){
				// this shouldnt be needed but, guess what!
				if(!source.propertyIsEnumerable(k)) continue

				if(k[0] === '_' || k[0] === '$'){
					continue
				}

				if(this.__lookupSetter__(k)){ // we are a signal
					// if we have a setter,
					// we might be a signal.
					var store = this['__' + k]
					if(store._signal_){ // we have a signal
						// we need to make a new signal,
						// and merge onset and onend in there
						// we need to merge the onSet and onEnd arrays
						
					}
					else{ // lets just 
						
					}
				}
				else if(source.__lookupSetter__(k)){ // we might be a signal
					
				}
				else { // 2 normal properties
					var stack = overloads[k] || (overloads[k] = [])
					var val = this[k]
					
					// harmless __supername__ property for usable this.super
					if(typeof val == 'function') val.__supername__ = k

					if(val !== undefined){
						if(stack.length){ // compare to stack top
							var top = stack[stack.length - 1]
							if(top instanceof StackValue) top = top.v
							else top = top[k]
							if(top !== val){
								stack.push(new StackValue(val))
							}  // compare to prototype
						} 
						else if(Object.getPrototypeOf(this)[k] !== val){
							stack.push(new StackValue(val))
						}
					}
					// overlay the role
					stack.push(source)
					
					// assign
					this[k] = source[k] // normal assign
					//console.log('learning', k, source[k])
				}
			}
		}
		//console.log(overloads)
		return this
	}

	// forget a property bag
	this.forget = function( role ){
	   if(!this.hasOwnProperty('__roles__')) return
		
		var forget = []
		var roles = this.__roles__
		var overloads = this.__overloads__

		if( !roles.length ) return
		var num = 0
		for(var i = 0, len = arguments.length; i < len; i++){

			var role = arguments[i]

			if(typeof role == 'number'){
				num = role
				continue
			}

			if(typeof role == 'function'){
				for(var i = 0; i < roles.length; i++){
					if(roles[ i ].__role__ ===  role){
						forget.push(roles[i])
						roles.splice(i, 1)
						break
					}
				}
			}
			else if (typeof role == 'object'){
				var i = roles.indexOf(role)
				if( i !== -1 ) { 
					forget.push(role)
					roles.splice(i, 1)
				}
			} 
		}

		if(num !== 0) forget.push.apply(forget, roles.splice(-num, num))

		if(!forget.length) return

		for(var i = forget.length -1; i >= 0; i--){
			// restore a property as best we can
			var source = forget[i]
			
			for(var k in source){
				// this shouldnt be needed but, guess what!
				if(!source.propertyIsEnumerable(k)) continue
				if( k[ 0 ] === '_'  || k[0] === '$') continue

				if(this.__lookupSetter__(k)){
					continue
				}

				var stack = overloads[k] // the overload stack

				// our top of the stack
				var top = stack[stack.length - 1]
				if(top instanceof StackValue) top = top.v
				else top = top[k]

				// get our current value
				var val = this[k]
				
				var srcidx = stack.indexOf(source)
				//console.log('forgetting', srcidx, val, top, val === top, k)
				// check if we are like the top of the stack, and we are removing that one
				if(val === top && srcidx === stack.length - 1){ 
					// fetch overloaded value
					var newtop = stack[srcidx - 1]
					// restore property from overload stack
					if(newtop === undefined) this[k] = undefined
					else {
						if(newtop instanceof StackValue) this[k] = newtop.v
						else this[k] = newtop[k]
					}                            
					//console.log('forgetting', k, this[k])
				}
				// remove our source from the overlay stack
				stack.splice(srcidx, 1)
			}
		}
	}

	// Make properties non enumerable
	this.enumfalse = function( enums ){
		for( var i = enums.length - 1; i>=0; i--){
			var k = enums[i]
			if (this.hasOwnProperty(k)) {
				Object.defineProperty( this, k, {value:this[k], enumerable:false, configurable:true})
			} else {
				console.error('attempting to overwrite property', k, 'not owned by', this)
			}
		}
	}

	this.now = (function(){
		var p = typeof window !== 'undefined' && window.performance || {}
		return (p.now && p.now.bind(p)) ||
			(p.webkitNow && p.webkitNow.bind(p)) ||
			(p.msNow && p.oNow.bind(p)) ||
			(p.oNow && p.oNow.bind(p)) ||
			(p.mozNow && p.mozNow.bind(p)) ||
			function(){ return Date.now() }
	})()

	// Quickly profile things
	this.profile = function( msg, times, call ){
		var tm = this.now()
		if(arguments.length == 1) call = msg, times = 1, msg = ''
		if(arguments.length == 2) call = times, times = msg, msg = ''
		var ret
		for( var i = 0; i < times; i++ ){
			ret = call.call( this, i )
		}
		tm = this.now() - tm
		console.log("profile " + msg + " " + Math.ceil(tm) + 'ms')
		return ret
	}

	// Create a new scope
	this.scoped = function( name ){
		if( this.$.scopeof == this ) throw new Error("Don't scope more than once")
		// create a prototype backed scope chain
		var $ = Object.create( this.$ )
		if( name ) this.$[ name ] = $
		this.$ = $
		$.$ = $ // make scope objects scope itself
		$.scopeof = this
		return $
	}

	// Finding the thing you overloaded, for anything besides objects
	// and functions this is a 'probably' since it cant uniquely identify the value
	this.overloads = function( key, me ){
		var proto = this
		var next // flags if the next item is the one i want
		var ret // return value of recur
		// recursive Role scanner
		function recur( obj ){
			if(obj.hasOwnProperty(key)){
				var val = obj[key]
				if(next && val != me) return ret = val
				if(val == me) next = 1
			}
			if(obj.hasOwnProperty( '__overloads__')){
				var stack = obj.__overloads__[key]
				if(stack) for(var i = stack.length - 1; i >= 0; i--){
					var item = stack[ i ]
					if(next){
					   var val = item instanceof StackValue ? item.v : item[key]
					   if(val != me) return ret = val
					}
					if(item instanceof StackValue){
						if(item.v == me) next = 1
					} else if(recur(item)) return ret
				}
			}
		}
		while(proto){
			if(recur(proto)) return ret
			proto = Object.getPrototypeOf(proto)
		}
	}
	 
	// Calls the function you overloaded, works with roles and prototypes
	// utilizes a __supername__ property on your function to quickly find out
	// the name of function to traverse the prototype and overload objects
	// Call as this.super( arguments ) in the overloaded function 
	// Depends on arguments.callee to fetch the function you want to
	// call super on
	// or to change the args: this.super( arguments, newarg1, newarg2 )

	this.super = function( args ){
		// figure out arguments
		var me = args.callee || args
		var fnargs = args
		// someone passed in replacement arguments
		if( arguments.length > 1 ) fnargs = Array.prototype.slice.call( arguments, 1 )
		// look up function name
		var name = me.__supername__
		if( name !== undefined ){ // we can find our overload directly
			var fn = this.overloads(name, me)
			if(fn && typeof fn == 'function') return fn.apply(this, fnargs)
		} 
		else { // we have to find our overload in the entire keyspace
			for(var k in this) {
				// filter out the internal properties
				if( !(k in ONE.Base) && k[0] != '_' && (k[1] != '$' || k[1] != '_') && 
					(k[0] != '$' || k.length > 1 )){
					fn = this.overloads( k, me )
					if( fn && typeof fn == 'function' ) {
						me.__supername__ = k // store it for next time
						return fn.apply( this, fnargs )
					}
				}
			}
		}
	}

	// push a property on the overload stack
	this.push = function( key, value ){
		var overloads
		if( !this.hasOwnProperty('__overloads__') ){
			overloads = this.__overloads__ = { }
			Object.defineProperty( this, '__overloads__', {enumerable:false, configurable:false} )
		} else overloads = this.__overloads__
		
		var stack = overloads[ key ] || (overloads[ key ] = [ ])

		stack.push( new StackValue( this[ '$$'+key ] || this[ key ] ) )
		
		this[ key ] = value
	}

	// pop a property off the overload stack
	this.pop = function( key ){
		if( !this.hasOwnProperty('__overloads__') ) return
		var overloads = this.__overloads__
		var stack = overloads[ key ]
		if(! stack || !stack.length ) return
		var top = stack[ stack.length - 1]
		top = top instanceof StackValue ? top.v : top[ key ] 
		this[ key ] = top
		stack.pop()
	}

	// keys
	this.keys = function( ){
		return Object.keys(this)
	}

	// flush an entire property stack
	this.popAll = function( key ){
		if( !this.hasOwnProperty('__overloads__') ) return
		var overloads = this.__overloads__
		var stack = overloads[ key ]
		if(! stack || !stack.length ) return
		stack.length = 0
	}
	
	// return the property at index in the stack
	this.stackAt = function( key, idx ){
		if( !this.hasOwnProperty('__overloads__') ) return
		var overloads = this.__overloads__
		var stack = overloads[ key ]
		if(! stack || !stack.length ) return
		if( idx < 0 ) var last = stack[ stack.length - idx ]
		else var last = stack[ idx ]
		if( !last ) return
		return last instanceof StackValue ? last.v : last[ key ] 
	}
   
	// bind the signals
	this.bind_signals = function(){
		// we bind the signals late

		var sigbinds = this.__$sigbinds
		if( sigbinds ){
			for( var k in sigbinds ){
				this[ k ] = sigbinds[ k ]
			}
		}
	}

	// define a property
	this.defineProperty = function( key, def ){
		Object.defineProperty( this, key, def )
	}

	this.signal = function( key, value, setter ){
		var signalStore = '__' + key
		var fastStore = '__$' + key
		var sig =  this[ signalStore ]
		if( !sig ){ 
			sig = this[ signalStore ] = this.Signal.prop( this, key, setter )

			// make a getter/setter pair
			Object.defineProperty( this, key, {
				configurable:true,
				enumerable:true ,
				get:function(){
					var sig = this[ signalStore ]					
					// make an instance copy if needed
					if( sig.owner != this ){
						sig = this[ signalStore ] = sig.fork( this )
						if( fastStore in this ) sig.value = this[fastStore]
					}
					return sig
				},
				set:function(value){
					var sig = this[ signalStore ]
					// fast path property setter
					if(!sig.onSet && sig.setter && 
						(typeof value == 'number' || Array.isArray(value))){
						if( sig.owner != this ){
							sig = this[ signalStore ] = Object.create( sig )
							sig.owner = this
						}
						sig.value = value
						sig.setter.call( this, value )
						return
					}
					// make an instance copy if needed
					if( sig.owner != this ) sig = this[ signalStore ] = sig.fork( this )
					sig.set( value )
				}
			})
		}
		else{ // we might need to create a new signal copy
			if( sig.owner != this ){
				sig = this[ signalStore ] = sig.fork( this )
				if( fastStore in this ) sig.value = this[fastStore]
			}
		}
		if( value !== undefined ) sig.set( value )
	}

	this.trace = function(){ console.log.apply(console, arguments); return arguments[0];}
}

// the Signal class
// the union of a computed propery, an event, a promise and 
// an Observable and quite possibly a constraint.
ONE.signal_ = function(){

	this.__class__ = 'Signal'
	this._signal_ = 1
	
	// create a new signal
	this.new = function( owner ){
		this.owner = owner
	}

	this.apply = function( sthis, args ){

	}

	this.call = function( sthis, value ){

	}

	// signal wrapper
	this.wrap = function( wrap ){
		var obj = Object.create(this)
		wrap(obj)
		return obj
	}
	
	this.all = function(array){
		var obj = Object.create(this)
		if(!array || !array.length){
			obj.end()
			return obj
		}
		var deps = array.length
		var res = []
		for(var i = 0, l = deps; i < l; i++){
			array[i].then(function(value){
				if(obj){
					res[this] = value
					if(!--deps){
						obj.end(res)
						obj = null
					}
				}
			}.bind(i),
			function(err){
				if(obj) obj.throw(err)
				obj = null
			})
		}
		return obj
	}

	// bind to a property
	this.prop = function( owner, name, setter ){
		var obj = Object.create( this )
		
		obj.owner = owner
		obj.name = name
		obj.setter = setter

		return obj
	}

	// fork a signal
	this.fork = function( owner ){
		var sig = Object.create( this )
		sig.owner = owner
		return sig
	}

	// valueOf aliases signals to values
	this.valueOf = function(){
		return this.value
	}

	// listen to set
	this.forEach
	this.on = function( cb, pthis ){
		if(pthis && pthis.owner) cb = cb.bind( pthis )

		if(!this.hasOwnProperty('onSet')) this.onSet = cb
		else if(!Array.isArray(this.onSet)) this.onSet = [this.onSet, cb]
		else this.onSet.push( cb )

		if(this.monitor) this.monitor.call( this.owner, cb )
	}

	this.off = function( cb ){
		var i
		if( this.onSet && (i = this.onSet.indexOf(cb)) !== -1){
			this.onSet.splice(i, 1)
		}
	}

	// listen to the end  / error
	this.then = function( onEnd, onError ){
		if(this.ended){
			if(this.error) window.setTimeout(function(){
					onError.call(this, this.exception)	
				}.bind(this), 0)
			else {
				window.setTimeout(function(){
					onEnd.call(this, this.value)	
				}.bind(this), 0)
			}
			return
		}

		if(onEnd){
			if(!this.hasOwnProperty('onEnd')) this.onEnd = onEnd
			else if(!Array.isArray(this.onEnd)) this.onEnd = [this.onEnd, onEnd]
			else this.onEnd.push( onEnd )
		}

		if(onError){
			if(!this.hasOwnProperty('onError')) this.onError = onError
			else if(!Array.isArray(this.onError)) this.onError = [this.onError, onError]
			else this.onError.push( onError )
		}
	}
	
	// called by bound objects to set the value of the signal
	// without replacing themselves
	this.bypass = function( value ){
		this.value = value

		// call all our listeners
		var proto = this 
		var owner = this.owner
		var s

		if(this.setter) this.setter.call( owner, value, this )

 		while(proto && (s = proto.onSet)){
 			if(proto.hasOwnProperty('onSet')){
				if(!Array.isArray(s)) s.call( owner, value, this )
				else for(var i = 0, l = s.length; i < l; i++){
					s[i].call( owner, value, this )
				}
			}
			proto = Object.getPrototypeOf(proto)
		}
	}
	
	// set the signal value
	this.set = function(value){
		if(this.ended) throw new Error('Cant set an ended signal')
		
		if(typeof value == 'function'){
			return this.on( value )
		}
		/*
		var owner = this.owner
		// if someone assigns something bindable we bind that
		var old_bind
		if(old_bind = this.bound){
			old_bind.unbind_signal( this )
			this.bound = undefined
		}
		if(value && value.bind_signal){
			// lets check if we are bound to an instance
			this.bind = value
			if(!this.owner || this.owner.owner){
				this.bound = value.bind_signal( owner, this, old_bind )
			}
			// delay the signal bind by pushing it on a stack
			else this.owner.bind_signals
			return
		}
		*/
		this.value = value
		
		// call all our listeners
		var proto = this 
		var s
		
		if(this.setter) this.setter.call( owner, value, this )
		
		while(proto && (s = proto.onSet)){
			if(proto.hasOwnProperty('onSet')){
				if(!Array.isArray(s)) s.call( owner, value, this )
				else for(var i = 0, l = s.length; i < l; i++){
					s[i].call( owner, value, this )
				}
			}
			proto = Object.getPrototypeOf(proto)
		}
	}
	
	// end the signal
	this.end = function(value){
		this.set( value )
		this.ended = true
		// call end
		var proto = this 
		var owner = this.owner
		var s
		while(proto && (s = proto.onEnd)){
			if(proto.hasOwnProperty('onEnd')){
				if(!Array.isArray(s)) s.call(owner, value, this)
				else for(var i = 0, l = s.length; i < l; i++){
					s[i].call(owner, value, this)
				}
			}
			proto = Object.getPrototypeOf(proto)
		}
	}
	
	// default allows a throw to be transformed to a value
	this.default = function(onDefault){
		if(onDefault in this) throw new Error('Cannot overload defaults')
		this.onDefault = onDefault
		return this
	}
	
	// default allows a throw to be transformed
	this.catch = function(onError){
		if(onError){
			if(!this.hasOwnProperty('onError')) this.onError = onError
			else if(!Array.isArray(this.onError)) this.onError = [this.onError, onError]
			else this.onError.push( onError )
		}
		return this
	}
	
	// throw and exception in the signal
	this.throw = function(error, next){
		
		if(this.ended) throw new Error('Cant throw on an ended signal')
		if(this.onDefault) return this.end( this.onDefault(error) )
		
		this.ended = true
		this.error = error
		// call error
		var proto = this 
		var owner = this.owner
		var s
		var handled
		while(proto && (s = proto.onError)){
			if(proto.hasOwnProperty('onError')){
				handled = true
				if(!Array.isArray(s)) s.call(owner, error, next, this)
				else for(var i = 0, l = s.length; i < l; i++){
					s[i].call(owner, error, next, this)
				}
			}
			proto = Object.getPrototypeOf(proto)
		}			
		return handled
	}
}
