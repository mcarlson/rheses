/*
The MIT License (MIT)

Copyright ( c ) 2014 OneJS

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.
*/

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
		if(!this.hasOwnProperty('__roles__')){
			roles = this.__roles__ = [] 
			Object.defineProperty( this, '__roles__', {enumerable:false, configurable:false} )
		} 
		else roles = this.__roles__
		
		// prepare learn array
		var learn = []
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

		// learn the array
		for(var i = 0, len = learn.length; i < len; i++){
			var source = learn[i]
			for(var k in source){
				// skip keys starting with _ or $
				if(k[0] === '_' || k[0] === '$') continue
				// console.log('learning', k, source)
				// push the value
				this.push(k, source['__' + k] || source[k], source)
			}
		}
	}

	// forget a property bag
	this.forget = function( role ){
	   if(!this.hasOwnProperty('__roles__')) return
		
		var forget = []
		var roles = this.__roles__

		if(!roles.length) return

		// prepare forget array
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

		// forget the properties
		for(var i = forget.length -1; i >= 0; i--){
			// restore a property as best we can
			var source = forget[i]
			
			for(var k in source){
				// skip variable
				if( k[ 0 ] === '_'  || k[0] === '$') continue
				// pop the value
				this.pop(k, source)
			}
		}
	}

	// push a property on the overload stack
	this.push = function( key, value, marker ){
		var overloads
		if(!this.hasOwnProperty('__overloads__')){
			overloads = this.__overloads__ = Object.create(null)
			Object.defineProperty(this, '__overloads__', {enumerable:false, configurable:false})
		} 
		else overloads = this.__overloads__
		
		var stack = overloads[key] || (overloads[key] = [])
		// we might be a signal
		var sigkey = '__' + key
		var this_sig = this[sigkey]

		if(typeof value == 'function') value.__supername__ = key

		var top_val 
		if(stack.length){
			var top = stack[stack.length - 1]
			if(top instanceof StackValue) top_val = top.v
			else {
				var top_sig = top[sigkey]
				if(top_sig) top_val = top_sig.value
				else top_val = top[key]
			}
		}

		if(this_sig){
			if(top_val !== this_sig.value)
				stack.push(new StackValue(this_sig.value))

			if(value && value._signal_){
				this_sig.mergeSignal(value)
				// call the signal setters
				this[key] = value.value
			}
			else{
				// just set the value
				this[key] = value
			}
		}
		else{
			// only push value on the stack if
			// stack top doesnt store it
			var val = this[key]
			if(top_val !== val)
				stack.push(new StackValue( val ))

			if(value && value._signal_){ // we are pushing a signal
				// convert self to signal
				var sig = this.signal(key, this[key])
				sig.mergeSignal(value)
				this[key] = value.value
			}
			else{
				this[key] = value
			}
		}
		if(marker) stack.push(marker)
	}

	// pop a property off the overload stack
	this.pop = function( key, marker ){
		if( !this.hasOwnProperty('__overloads__') ) return

		var stack = this.__overloads__[key]
		if(!stack || !stack.length ){
			this[key] = undefined
			return
		}

		var sigkey = '__' + key

		if(!marker){
			var top = stack[stack.length - 1]
			if(top === undefined){
				this[k] = undefined
			}
			else {
				if(top instanceof StackValue){
					// dont re-add a listener method
					if(!this[sigkey] || typeof top.v != 'function')
						this[key] = top.v
				}
				else{
					var newtop_sig = top[sigkey]
					if(newtop_sig) this[key] = newtop_sig.value
					else {
						if(!this[sigkey] || typeof top.v != 'function')
							this[key] = top[key]
					}
				}
			}
			return stack.pop()
		}

		// fetch value on this
		var this_val
		var this_sig = this[sigkey]
		if(this_sig) this_val = this_sig.value
		else this_val = this[key]

		// fetch value on marker
		var marker_val
		var marker_sig = marker[sigkey]
		if(marker_sig) marker_val = marker_sig.value
		else marker_val = marker[key]

		// look up the marker in our stack
		var idx = stack.indexOf(marker)

		if(idx != -1){ // okay so.
			if(marker_sig){ // unmerge the markers signal
				if(!this_sig) throw new Error('marker has signal, but this has not')
				this_sig.unmergeSignal(marker_sig)
			}// remove the listener
			else if(this_sig && typeof marker_val == 'function'){
				this_sig.removeListener(marker_val, 'set_list')
			}
			// we are top of the stack, and we havent messed with the value
			if(idx === stack.length - 1 && this_val === marker_val){
				stack.pop() // pop the marker
				// pop the stack to assign the new stacktop
				stack.push(this.pop(key)) // use the tophalf of this function to pop 
			}
			// remove the marker from the stack				
			stack.splice(idx, 1)
		}
	}


	// Make properties non enumerable
	this.enumfalse = function( enums ){
		for( var i = enums.length - 1; i>=0; i--){
			var k = enums[i]
			if (this.hasOwnProperty(k)) {
				Object.defineProperty( this, k, {enumerable:false, configurable:true})
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
		if(this.$.scopeof == this) throw new Error("Don't scope more than once")
		// create a prototype backed scope chain
		var $ = Object.create(this.$)
		if(name) this.$[name] = $
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
		if (args == null) args = []
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
				if( !(ONE.Base && (k in ONE.Base)) && k[0] != '_' && (k[1] != '$' || k[1] != '_') &&
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
	this.bindSignals = function(){
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
		var sig =  this[signalStore]
		if(!sig){ 
			sig = this[signalStore] = this.Signal.prop(this, key, setter)

			// make a getter/setter pair
			Object.defineProperty(this, key, {
				configurable:true,
				enumerable:true,
				get:function(){
					var sig = this[signalStore]					
					// make an instance copy if needed
					if( sig.owner != this ){
						sig = this[signalStore] = sig.fork(this)
						if(fastStore in this) sig.value = this[fastStore]
					}
					return sig
				},
				set:function(value){
					var sig = this[signalStore]
					// fast path property setter
					if(!sig.onSet && sig.setter && 
						(typeof value == 'number' || Array.isArray(value))){
						if(sig.owner != this){
							sig = this[ signalStore ] = Object.create(sig)
							sig.owner = this
						}
						sig.value = value
						sig.setter.call(this, value)
						return
					}
					// make an instance copy if needed
					if(sig.owner != this) sig = this[signalStore] = sig.fork(this)
					sig.set(value)
				}
			})
		}
		else{ // we might need to create a new signal copy
			if(sig.owner != this){
				sig = this[signalStore] = sig.fork(this)
				if(fastStore in this) sig.value = this[fastStore]
			}
		}
		if(value !== undefined) sig.set(value)
		return sig
	}

	this.trace = function(){ console.log.apply(console, arguments); return arguments[0];}
}

// the Signal class
// the union of a computed propery, an event, a promise and an Observable
ONE.signal_ = function(){

	// subscription classes
	function cancel_subscription(){
		if(!this.signal) return
		this.signal.removeListener(this.cb, this.set)
		this.signal = undefined
	}

	var SetSubscription = {
		set:'set_list',
		cancel: cancel_subscription
	}

	var ErrorSubscription = {
		set:'error_list',
		cancel: cancel_subscription
	}

	var EndSubscription = {
		set:'end_list',
		cancel: cancel_subscription
	}

	this.removeListener = function( cb, set ){
		set = set || 'set_list'
		var arr = this[set]
		if(arr === cb){
			this[set] = undefined
			return
		}
		if(!Array.isArray(arr)) return
		var idx = arr.indexOf(cb)
		if(idx == -1) return
		arr.splice(idx, 1)
		if(arr.length == 1) this[set] = arr[0]
		else if(arr.length == 0) this[set] = undefined
		console.log(window.hack == this)
	}

	this.enumListeners = function( set, cb ){
		var proto = this
		var s
 		while(proto && (s = proto[set])){
 			if(proto.hasOwnProperty(set)){
				if(!Array.isArray(s)) cb(s)
				else for(var i = 0, l = s.length; i < l; i++){
					cb(s[i])
				}
			}
			proto = Object.getPrototypeOf(proto)
		}
	}

	this.__class__ = 'Signal'
	this._signal_ = 1
	
	// create a new signal
	this.new = function( owner ){
		this.owner = owner
	}

	this.apply = function( sthis, args ){

	}

	// call all set listeners
	this.call = function( sthis, _value ){
		var value = _value === undefined? this.value: _value
		var owner = this.owner
		var proto = this
		var list
		while(proto){
			if(proto.hasOwnProperty('set_list') && (list = proto.set_list)){
				if(!Array.isArray(list)) list.call( owner, value, this )
				else for(var i = 0, l = list.length; i < l; i++){
					list[i].call( owner, value, this )
				}
			}
			proto = Object.getPrototypeOf(proto)
		}
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
				if(obj) obj.error(err)
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

	// listen to the end  / error
	this.then = function( end_cb, error_cb ){
		if(this.ended){
			if(this.errored) window.setTimeout(function(){
					error_cb.call(this, this.exception)	
				}.bind(this), 0)
			else {
				window.setTimeout(function(){
					end_cb.call(this, this.value)	
				}.bind(this), 0)
			}
			return
		}
		if(end_cb){
			if(!this.hasOwnProperty('end_list')) this.end_list = end_cb
			else if(!Array.isArray(this.end_list)) this.end_list = [this.end_list, end_cb]
			else this.end_list.push( end_cb )
		}

		if(error_cb){
			if(!this.hasOwnProperty('error_list')) this.error_list = error_cb
			else if(!Array.isArray(this.error_list)) this.error_list = [this.error_list, error_cb]
			else this.error_list.push( error_cb )
		}
	}

	this.mergeSignal = function(other){
		var _this = this
		other.enumListeners('set_list', function(v){
			_this.onSet(v)
		})
		other.enumListeners('end_list', function(v){
			_this.onEnd(v)
		})
		other.enumListeners('error_list', function(v){
			_this.onError(v)
		})
	}

	this.unmergeSignal = function(other){
		var _this = this
		other.enumListeners('set_list', function(v){
			_this.removeListener(v, 'set_list')
		})
		other.enumListeners('end_list', function(v){
			_this.removeListener(v, 'end_list')
		})
		other.enumListeners('error_list', function(v){
			_this.removeListener(v, 'error_list')
		})
	}

	// listen to set
	this.onSet =
	this.on = function( set_cb ){
		if(!this.hasOwnProperty('set_list')) this.set_list = set_cb
		else if(!Array.isArray(this.set_list)) this.set_list = [this.set_list, set_cb]
		else this.set_list.push(set_cb)

		if(this.monitor) this.monitor.call(this.owner, set_cb, 'set')

		var sub = Object.create(SetSubscription)
		sub.signal = this
		sub.cb = set_cb
		return sub
	}

	// set the signal value
	this.set = function(value){
		if(this.ended) throw new Error('Cant set an ended signal')
		
		if(typeof value == 'function'){
			return this.on(value)
		}

		this.value = value
		
		// call all our listeners
		var proto = this 
		var owner = this.owner
		if(this.setter) this.setter.call(owner, value, this)
		var list
		while(proto){
			if(proto.hasOwnProperty('set_list') && (list = proto.set_list)){
				if(!Array.isArray(list)) list.call(owner, value, this)
				else for(var i = 0, l = list.length; i < l; i++){
					list[i].call(owner, value, this)
				}
			}
			proto = Object.getPrototypeOf(proto)
		}
	}

	// listen to the end signal
	this.onEnd = function(end_cb){

		if(!this.hasOwnProperty('end_list')) this.end_list = end_cb
		else if(!Array.isArray(this.end_list)) this.end_list = [this.end_list, end_cb]
		else this.end_list.push(end_cb)

		var sub = Object.create(EndSubscription)
		sub.signal = this
		sub.cb = cb

		if(this.monitor) this.monitor.call(this.owner, set_cb, 'end')

		return sub
	}

	// end the signal
	this.end = function(value){
		this.set(value)
		this.ended = true
		// call end
		var proto = this 
		var owner = this.owner
		var list
		while(proto){
			if(proto.hasOwnProperty('end_list') && (list = proto.end_list)){
				if(!Array.isArray(list)) list.call( owner, value, this )
				else for(var i = 0, l = list.length; i < l; i++){
					list[i].call( owner, value, this )
				}
			}
			proto = Object.getPrototypeOf(proto)
		}
	}
	
	// default allows a throw to be transformed to a value
	this.default = function(default_cb){
		if('default_cb' in this) throw new Error('Cannot overload defaults')
		this.default_cb = default_cb
		return this
	}
	
	// called when signal errors
	this.onError = function(error_cb){
		if(!this.hasOwnProperty('error_list')) this.error_list = error_cb
		else if(!Array.isArray(this.onThrow)) this.error_list = [this.error_list, error_cb]
		else this.error_list.push( error_cb )

		var sub = Object.create(ErrorSubscription)
		sub.signal = this
		sub.cb = error_cb

		if(this.monitor) this.monitor.call(this.owner, set_cb, 'error')

		return sub
	}
	
	// make the signal error
	this.error = function(value, next){
		
		if(this.ended) throw new Error('Cant error ended signal')
		if(this.default_cb) return this.end( this.default_cb(value) )
		
		this.ended = true
		this.errored = value
		// call error
		var proto = this 
		var owner = this.owner
		var handled
		var s
		while(proto){
			if(proto.hasOwnProperty('error_list')){
				handled = true
				var list = proto.error_list
				if(!Array.isArray(list)) list.call(owner, value, next, this)	
				else for(var i = 0, l = list.length; i < l; i++){
					list[i].call(owner, value, next, this)
				}
			}
			proto = Object.getPrototypeOf(proto)
		}			
		return handled
	}
}
