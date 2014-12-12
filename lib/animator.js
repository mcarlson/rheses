var Animator = {};
(function(){

	this.createAnimator = function(first_value, object, varname){
		var anim = Object.create(this)
		anim.controller = this
		anim.is_animator = true
		anim.object = object
		anim.varname = varname
		anim.first_value = first_value
		return anim
	}
	
	// overload these on the prototype to have a central entry
	this.onvalue = function(player, value){
		// get a value change callback
	}

	// our end callback
	this.onend = function(player){

	}

	this.timestep = function(time_stamp, first_value, time_skew){
		this.last_time_stamp = time_stamp

		if(!this.is_animator){
			throw new Error('Api not available')
		}

		var track = this.current
		if(!track) return undefined
		// alright lets process the tracks.
		if(this.reset_time){
			this.start_time_stamp = time_stamp - (time_skew || 0)
			// initialize slot 0
			if(track.values[0] === undefined){
				track.first_value = first_value !== undefined? first_value: (this.first_value || 0)
			}
			this.reset_time = false
		}

		if(this.pause_time !== undefined){
			// just skid the start_time for as long as it is stopped
			this.start_time_stamp = time_stamp - this.pause_time
			return
		}

		// alright now, we have to compute the right time.
		var local_time = (time_stamp - this.start_time_stamp )
		if(track.delay !== undefined){
			if(local_time - track.delay <= 0) local_time = 0
			else local_time -= track.delay
		}

		if(this.reverse_time !== undefined){
			// essentially we are going to count backwards starting this.reverse_time
			local_time = this.reverse_time - (local_time - this.reverse_time)
		}

		// norm time goes from 0 to 1 over the length of the track 
		var norm_time = (local_time / track.end_time) * track.speed
		// lets check the looping
		var end_gap = undefined

		if (track.bounce){
			if(norm_time >= track.repeat) end_gap = norm_time - track.repeat, norm_time = track.repeat
			norm_time = norm_time % 2
			if(norm_time > 1) norm_time = 2 - norm_time
		}
		else if (track.repeat){
			if(norm_time >= track.repeat) end_gap = norm_time - track.repeat, norm_time = track.repeat - 0.000001
			norm_time = norm_time % 1
		}

		if(norm_time < 0){
			end_gap = -norm_time
		}

		if(end_gap !== undefined){ // alright we are stopping
			var end_ms = end_gap * track.end_time
			// we have to seek end_ms into the new track.
			if(track.next){
				// skes the start time
				this.reset_time = true
				this.current = track.next
				// fetch the last key of our track and pass it in as the new first for the next one 
				var new_first_value = norm_time >= 1? track.values[track.order[track.order.length - 1]]: track.values[track.order[0]]
				// recur so we dont have to handle the degenerate case of it skipping through another next chain
				return this.timestep(time_stamp, new_first_value, end_ms)
			}
			// otherwise just let the current track end.
		} 

		if(norm_time > 1) norm_time = 1
		if(norm_time < 0) norm_time = 0
		var motion_time = track.motion(norm_time, track.control)
		if(motion_time < 0.001 ) motion_time = 0
		if(motion_time > 0.999 ) motion_time = 1
		// lets convert it back to keyspace time
		var track_time = motion_time * track.end_time

		// the key pair to interpolate between
		var key1, key2

		// find the right keys
		if(!track.clamped && (track_time <= track.order[0] || track_time >= track.order[track.order.length-1])){
			if(track_time <= track.order[0]){
				key1 = track.order[0]
				key2 = track.order[1]
			}
			else{
				key1 = track.order[track.order.length - 2] || 0
				key2 = track.order[track.order.length - 1]
			}
		}
		else{ // scan for it
			for(var i = 0, len = track.order.length; i<len; i++){
				var key = track.order[i]
				if(track_time <= key){
					key1 = track.order[i-1] || 0
					key2 = key
					break
				}
			}
		}
		// if has atleast 1 key, do something
		if(key1 !== undefined){
			// only key1, the check is to deal with the 'computed' 0 key
			if(key2 === undefined) this.value = key1 in track.values? track.values[key1]: track.first_value
			else{ // interpolate
				var inter_key_time
				if(Math.abs(key2 - key1) <0.0001) inter_key_time = 0
				else inter_key_time = (track_time - key1) / (key2 - key1)
				var value1 = key1 in track.values? track.values[key1]: track.first_value
				this.value = this[track.interpolator](value1, track.values[key2], inter_key_time)

			}

			//call the callbacks
			this.onvalue(this)
		}

		if(end_gap !== undefined){ // we need to terminate our Player
			this.ended = true
			//this.onend(this)
			//if(track.onend) track.onend(this)
		}
		else{
			// add ourselves for the next frame
			//if(this.playing_animators.indexOf(this) === -1)
			//	this.playing_animators.push(this)
		}
		return this.value
	}
	
	this.mix_number = function(a, b, f){
		return a * (1 - f) + b * f
	}

	this.mix_array = function(a, b, f){
		var out = []
		var longest = Math.max(a.length, b.length)
		var nf = 1 - f
		for(var i = 0; i < longest; i++){
			var av = a[i]
			if(av === undefined) av = 0
			var bv = b[i]
			if(bv === undefined) bv = 0
			out[i] = av * nf + bv * f
		}
		return out
	}

	this.mix_color = function(a, b, f){
		// the colors are pre-parsed in 'play'
		var nf = 1 - f
		var r = a[0]*nf  + b[0]*f
		var g = a[1]*nf  + b[1]*f
		var b = a[2]*nf  + b[2]*f
		// return a css color
		return '#' + ('000000' + ( ( ( ( ( r*255 ) & 0xff ) << 8 | ( ( g*255 ) & 0xff ) ) << 8 ) | ( ( b*255 ) & 0xff ) ).toString( 16 ) ).slice( -6 )
	}

	// stops an animation, untill resumed
	this.pause = function(){
		if(!this.is_animator) throw new Error('Api not available')
		this.pause_time = this.last_time_stamp - this.start_time_stamp
	}

	// resume a paused track
	this.resume = function(){
		if(!this.is_animator) throw new Error('Api not available')
		this.pause_time = undefined
	}

	// this reverses the playback. it will just play the current trackbackwards starting now
	this.reverse = function(){
		// also, how do we make time run in reverse properly
		if(!this.is_animator) throw new Error('Api not available')
		// alright if we have reverse time, calculate the right start_time_stamp
		if(this.reverse_time !== undefined){
			// calculate the current time
			this.start_time_stamp = 2*(this.last_time_stamp - this.reverse_time) - this.start_time_stamp
			//this.start_time_stamp = this.last_time_stamp-this.reverse_time
			this.reverse_time = undefined
		}
		else{
			this.reverse_time = this.last_time_stamp - this.start_time_stamp
		}
	}
	
	// stops an animation
	this.stop = function(){
		if(!this.is_animator) throw new Error('Api not available')
		this.current = undefined
		if(!this.playing_animators) return
		var id = this.playing_animators.indexOf(this)
		if(id !== -1){
			this.playing_animators.splice(id, 1)
		}
		this.onend(this)
	}

	this.update = function(track){
		var old_track = this.current
		if(!track.motion && old_track) track.motion = this.current.motion
		this.current = this.buildTrack(track)
		if(old_track) this.current.first_value = old_track.first_value
	}

	this.buildTrack = function(track){
		// the internal track construct
		var mytrack = {
			// wether to interrupt the now playing track
			delay: track.delay !== undefined? track.delay: 0,
			onend: track.onend,
			interrupt: track.interrupt!==undefined? track.interrupt: false,
			repeat: track.repeat !== undefined? track.repeat: 1,
			bounce: track.bounce,
			motion: motion[track.motion || (track.control?'bezier':'linear')] || motion.linear, // fail silently on wrong motion function
			speed: track.speed ||  1,
			values: Object.create(null),
			order: [0],
			end_time:0,
			interpolator: 'mix_number' // or color or array
		}

		// fetch the keys from the track and store them in an ordered fashion
		for(var key in track){
			if(parseFloat(key) == key){
				key = parseFloat(key)
				var value = track[key]
				
				if(typeof value == 'string'){
					var fvalue = parseFloat(value)
					if(fvalue != value){
						value = this.parse_color(value)
						mytrack.interpolator = 'mix_color'
					}
					else value = fvalue
				}
				else if(Array.isArray(value)) mytrack.interpolator = 'mix_array'
				mytrack.values[key] = value
				mytrack.order.push(key)
				if(key > mytrack.end_time) mytrack.end_time = key
			}
		}
		if(track.control) mytrack.control = prepBezier(track.control, mytrack.end_time)

		// make sure they are sorted in time order
		mytrack.order.sort()
		return mytrack
	}

	// interrupt or play a new track
	this.play = function(track){
		if(!this.is_animator) throw new Error('Api not available')
		
		/*
		// our controller is simply our prototype
		var controller = Object.getPrototypeOf(this)

		// initialize the controller
		if(!controller.playing_animators){
			controller.playing_animators = []
			controller.playLoop = function(){
				var animators = this.playing_animators
				this.playing_animators = []
				for(var i = 0, len = this.playing_animators; i < len; i++){
					animators[i].timestep(time, this.first_value)
				}
				// only keep animating if there are running animators
				if(this.playing_animators.length) window.requestAnimationFrame(this.playLoop)
			}.bind(controller)
		}

		if(controller.playing_animators.indexOf(this) == -1){
			// add us to the playing animator set and trigger the first animation
			controller.playing_animators.push(this)
			window.requestAnimationFrame(controller.playLoop)
		}
		*/

		var mytrack = this.buildTrack(track)
		// ok if we interrupt, we interrupt
		// if we dont we chain it to the current track
		if(this.current){
			// we are interrupting
			if(this.interrupt){
				// just hardswitch it for the next update
				this.current = mytrack
				this.reset_time = true
			}
			else{
				//chain it at the end 
				var find_end = this.current
				while(find_end.next) find_end = find_end.next
				find_end.next = mytrack
			}
		}
		else{
			this.current = mytrack
			this.reset_time = true
		}
	}

	function prepBezier(control, time){
		var b = {}
		b.epsilon = 1.0/(200.0*time)
		b.points = control
		if(control.length != 4) control = [0,0,1,1]
		b.cx = 3.0*control[0]
		b.bx = 3.0 * (control[2] - control[0]) -b.cx
		b.ax = 1.0 - b.cx - b.bx
		b.cy = 3.0 * control[1]
		b.by = 3.0 * (control[3] - control[1]) - b.cy
		b.ay = 1.0 - b.cy - b.by
		return b
	}

	function bezierCurveX(t, b) {
		return ((b.ax * t + b.bx) * t + b.cx) * t
	}

	function bezierCurveY(t, b) {
		return ((b.ay * t + b.by) * t + b.cy) * t
	}

	function bezierCurveDX(t, b) {
		return (3.0 * b.ax * t + 2.0 * b.bx) * t + b.cx
	}

	function bezierSolveX(x, b) {
		var t0, t1, t2, x2, d2, i
		// First try a few iterations of Newton's method -- normally very fast.
		for(t2 = x, i=0; i<8; i++) {
			x2 = bezierCurveX(t2, b) - x
			if(Math.abs(x2) < b.epsilon) return t2
			d2 = bezierCurveDX(t2, b)
			if(Math.abs(d2) < 1e-6) break 
			t2 = t2 - x2 / d2
		}
		// Fall back to the bisection method for reliability.
		t0 = 0.0
		t1 = 1.0 
		t2 = x
		if(t2 < t0) return t0
		if(t2 > t1) return t1
		while(t0 < t1) {
			x2 = bezierCurveX(t2, b)
			if(Math.abs(x2 - x) < b.epsilon) return t2
			if(x > x2) t0 = t2
			else t1 = t2
			t2 = (t1 - t0) *.5 + t0
		}
		return t2 // Failure.
	}

	// standard jquery motion functions
	var motion = {
		bezier:function(t, control) {
			// Given an x value, find a parametric value it came from.
			return bezierCurveY(bezierSolveX(t, control), control)
		},
		bret:function(t, control){ // get the curve
			// pick a d that seems to make sense
			//return t
			var di = 0.01
			var df = 0.01
			// use the bezier array to pass in di and df
			if(control && control.points){
				if(control.points.length == 2){
					di = control.points[0]
					df = control.points[1]
				}
				else{
					di = df = control.points[0]
				}
			}

			var Xi = 0 // we go from 0 
			var Xf = 1 // to 1 , as we are an motion function
			var Xo = Xi - di // as per email
			var Xn = Xf + df // here too
			// compute the constant
			var K = ((Xo - Xf) * (Xi - Xn)) / ((Xo - Xi) * (Xf - Xn))
			// seems to be 1.20001
			var Kt = Math.pow(K, t)
			// so when t starts at 0 and ends at 1 K(t) is just K^t
			var out = (Xo * (Xi - Xn) + Xn * (Xo - Xi) * Kt) / ((Xo - Xi) * Kt + (Xi - Xn))
			return out
		},
		linear:function(t){ return t },
		inQuad:function(t){ return t*t },
		outQuad:function(t){ return -t*(t-2) },
		inOutQuad:function(t){ return (t/=0.5) < 1 ? 0.5*t*t : -0.5 * ((--t)*(t-2) - 1) },
		inCubic:function(t){ return t*t*t },
		outCubic:function(t){ return ((t=t-1)*t*t + 1) },
		inOutCubic:function(t){ return (t/=0.5) < 1 ? 0.5*t*t*t : 1 /2*((t-=2)*t*t + 2) },
		inQuart:function(t){ return t*t*t*t },
		outQuart:function(t){ return -((t=t-1)*t*t*t - 1) },
		inOutQuart:function(t){ return (t/=0.5) < 1 ? 0.5*t*t*t*t : -0.5 * ((t-=2)*t*t*t - 2) },
		inQuint:function(t){ return t*t*t*t*t },
		outQuint:function(t){ return ((t=t-1)*t*t*t*t + 1) },
		inOutQuint:function(t){ return (t/=0.5) < 1 ? 0.5*t*t*t*t*t : 0.5*((t-=2)*t*t*t*t + 2) },
		inSine:function(t){ return - Math.cos(t * (Math.PI/2)) + 1 },
		outSine:function(t){ return Math.sin(t * (Math.PI/2)) },
		inOutSine:function(t){ return -0.5 * (Math.cos(Math.PI*t) - 1) },
		inExpo:function(t){ return (t==0)? 0: Math.pow(2, 10 * (t - 1)) },
		outExpo:function(t){ return (t==1)? 1: (-Math.pow(2, -10 * t) + 1) },
		inCirc:function(t){ return - (Math.sqrt(1 - t*t) - 1) },
		outCirc:function(t){ return Math.sqrt(1 - (t=t-1)*t) },
		inOutCirc:function(t){ return (t/=0.5) < 1? -0.5 * (Math.sqrt(1 - t*t) - 1): 0.5 * (Math.sqrt(1 - (t-=2)*t) + 1) },
		inOutExpo:function(t){
			if (t==0) return 0
			if (t==1) return 1
			if ((t/=0.5) < 1) return 0.5 * Math.pow(2, 10 * (t - 1)) 
			return 0.5 * (-Math.pow(2, -10 * --t) + 2) 
		},
		inElastic:function(t){
			var s=1.70158, p=0, a=1;
			if (t==0) return 0
			if (t==1) return 1
			if (!p) p=0.3
			if (a < 1) { a=1; var s=p/4 }
			else var s = p/(2*Math.PI) * Math.asin (1/a)
			return -(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*1-s)*(2*Math.PI)/p )) 
		},
		
		outElastic:function(t){
			var s=1.70158, p=0, a=1
			if (t==0) return 0
			if (t==1) return 1
			if (!p) p=1*0.3
			if (a < 1) { a=1; var s=p/4; }
			else var s = p/(2*Math.PI) * Math.asin (1/a)
			return a*Math.pow(2,-10*t) * Math.sin( (t*1-s)*(2*Math.PI)/p ) + 1 
		},
		inOutElastic:function(t){
			var s=1.70158, p=0, a=1
			if (t==0) return 0
			if ((t/=0.5)==2) return 1
			if (!p) p=(0.3*1.5)
			if (a < 1) { a=1; var s=p/4; }
			else var s = p/(2*Math.PI) * Math.asin (1/a)
			if (t < 1) return -.5*(a*Math.pow(2,10*(t-=1)) * Math.sin( (t*1-s)*(2*Math.PI)/p )) 
			return a*Math.pow(2,-10*(t-=1)) * Math.sin( (t*1-s)*(2*Math.PI)/p )*0.5 + 1 
		},
		inBack:function(t, s){
			if (s == undefined) s = 1.70158
			return (t/=1)*t*((s+1)*t - s) 
		},
		outBack:function(t, s){
			if (s == undefined) s = 1.70158
			return ((t=t/1-1)*t*((s+1)*t + s) + 1) 
		},
		inOutBack:function(t, s){
			if (s == undefined) s = 1.70158
			if ((t/=0.5) < 1) return 0.5*(t*t*(((s*=(1.525))+1)*t - s)) 
			return 0.5*((t-=2)*t*(((s*=(1.525))+1)*t + s) + 2) 
		},
		inBounce:function(t){ return 1 - motion.outBounce (1-t) },
		outBounce:function(t){
			if (t < (1/2.75)) return (7.5625*t*t) 
			else if (t < (2/2.75)) return (7.5625*(t-=(1.5/2.75))*t + 0.75) 
			else if (t < (2.5/2.75)) return (7.5625*(t-=(2.25/2.75))*t + 0.9375) 
			return (7.5625*(t-=(2.625/2.75))*t + .984375) 
		},
		inOutBounce:function(t){
			if (t < 0.5) return motion.inBounce (t*2) * 0.5 
			return motion.outBounce (t*2-1) * 0.5 + 0.5 
		}
	}

	// CSS color table
	var color_table = [130,15792383,388,16444375,5,65535,6,8388564,7,15794175,8,16119260,9,16770244,10,0,1420,16772045,2,255,269,
	9055202,14,10824234,1936,14596231,2178,6266528,18,8388352,19,13789470,20,16744272,2690,6591981,22,16775388,23,14423100,
	24,65535,3202,139,3224,35723,412955,12092939,3228,11119017,3229,25600,3230,11119017,3231,12433259,3232,9109643,413853,
	5597999,3234,10040012,3235,9109504,3236,15308410,414365,9419919,414466,4734347,414492,3100495,414494,3100495,3239,52945,
	3213,9699539,40,16747520,5290,16716947,677250,49151,5660,6908265,5662,6908265,5762,2003199,5935,11674146,6148,16775920,
	6301,2263842,50,16711935,51,14474460,6660,16316671,53,16766720,3355,14329120,28,8421504,29,32768,3766,11403055,30,
	8421504,7096,15794160,7338,16738740,7459,13458524,59,4915330,60,16777200,31,15787660,61,15132410,7870,16773365,8093,
	8190976,8257,16775885,8450,11393254,8468,15761536,8472,14745599,138841526,16448210,8476,13882323,8477,9498256,8478,
	13882323,8490,16758465,8484,16752762,1086109,2142890,1086850,8900346,1086236,7833753,1086238,7833753,1089922,11584734,
	8502,16777184,68,65280,8733,3329330,69,16445670,32,16711935,70,8388608,1163976,6737322,9090,205,9122,12211667,9161,
	9662680,1168029,3978097,1168130,8087790,1172765,64154,9127,4772300,1164963,13047173,9602,1644912,9805,16121850,10063,
	16770273,80,16770229,10372,16768685,82,128,10708,16643558,33,8421376,4309,7048739,86,16753920,11043,16729344,34,14315734,
	1428763,15657130,11165,10025880,11175,11529966,1427107,14184595,11353,16773077,11611,16767673,92,13468991,42,16761035,93,
	14524637,12034,11591910,73,8388736,35,16711680,12174,12357519,12290,4286945,12430,9127187,36,16416882,12558,16032864,
	4765,3050327,4835,16774638,100,10506797,101,12632256,5506,8900331,4866,6970061,4892,7372944,4894,7372944,102,16775930,
	9501,65407,8578,4620980,103,13808780,104,32896,105,14204888,106,16737095,39,4251856,13,15631086,107,16113331,4,16777215,
	620,16119285,54,16776960,6941,10145074]

	var color_words = ['','Alice','Blue','Antique','White','Aqua','Aquamarine','Azure','Beige','Bisque','Black','Blanched','Almond','Violet',
	'Brown','Burly','Wood','Cadet','Chartreuse','Chocolate','Coral','Cornflower','Cornsilk','Crimson','Cyan','Dark','Golden',
	'Rod','Gray','Green','Grey','Khaki','Magenta','Olive','Orchid','Red','Salmon','Sea','Slate','Turquoise','Darkorange',
	'Deep','Pink','Sky','Dim','Dodger','Fire','Brick','Floral','Forest','Fuchsia','Gainsboro','Ghost','Gold','Yellow',
	'Honey','Dew','Hot','Indian','Indigo','Ivory','Lavender','Blush','Lawn','Lemon','Chiffon','Light','Steel','Lime',
	'Linen','Maroon','Medium','Marine','Purple','Spring','Midnight','Mint','Cream','Misty','Rose','Moccasin','Navajo',
	'Navy','Old','Lace','Drab','Orange','Pale','Papaya','Whip','Peach','Puff','Peru','Plum','Powder','Rosy','Royal',
	'Saddle','Sandy','Shell','Sienna','Silver','Snow','Tan','Teal','Thistle','Tomato','Wheat','Smoke']

	// decompress colortable
	this.color_lookup = {}
	for(var i = 0;i < color_table.length;i += 2){
		var str = ''    // output string
		var combiner = color_table[i] // fetch the 8 bytes per lookup word combiner 
		while(combiner){
			str = color_words[combiner&0x7f] + str, combiner = combiner >> 7 // rebuild the strange word
		}
		var color = color_table[i + 1]
		var t =this.color_lookup[str.toLowerCase()] = this.color_lookup[str] = color
	}

	// color parser
	this.parse_color = function( col ) {
		var c = this.color_lookup[col] // color LUT
		var a = []
		if( c === undefined ){
			// lets parse the color
			var len = col.length
			var i = 0
			c = 0
			while(i<len){
				var ch = col.charCodeAt(i++)
				if(ch >= 48 && ch <= 57){
					c = c << 4
					c += ch - 48
				}
				else if(ch >= 97 && ch <= 102){
					c = c << 4
					c += ch - 87
				}
				else if(ch >= 65 && ch <= 70){
					c = c << 4
					c += ch - 55
				}
				else{ // try to find the nearest color
					col = col.toLowerCase()
					c = this.color_wikipedia[col]
					if(c === undefined) for(var k in this.color_wikipedia){
						if(k.indexOf(col) != -1){
							c = this.color_wikipedia[k]
							// cache it
							this.color_wikipedia[col] = c
							break
						}
					}
					len = 0
				}
			}
			if(len == 3){ 
				a[0] = ((c&0xf00)>>8|(c&0xf00)>>4) /255
				a[1] = ((c&0xf0)|(c&0xf0)>>4) /255
				a[2] = ((c&0xf)|(c&0xf)<<4) /255 
				return a
			}
		}
		a[0] = ((c >> 16)&0xff) /255
		a[1] = ((c >> 8)&0xff) /255
		a[2] = (c&0xff) /255
		return a
	}

}).call(Animator)