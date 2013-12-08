
define('/trace/trace_server',function(require){

	if(process.version.indexOf('v0.6') != -1 || process.version.indexOf('v0.4') != -1){
		console.log("Node version too old, try 0.8 or 0.10")
		process.exit(-1)
		return
	}

	var path = require('path')
	var fs = require('fs')
	var zlib = require('zlib')
	var instrument = require('./instrument')

	// the nodejs loader
	if(process.argv[2] == '-l') return nodeLoader()

	function nodeLoader(){
		var m = require('module').Module.prototype;
		var oldCompile = m._compile;
		var did = 1
		m._compile = function(content, filename){
			// rip off #..\n
			content = content.replace(/^\#.*?\n/,'\n')
			// lets instrument 
			var t = instrument(filename, content, did)
			did = t.id
			// send the dictionary out
			var m = {dict:1, src:t.input, f:filename, d:t.d}
			if(process.send)	process.send(m)
			else process.stderr.write('\x1f'+JSON.stringify(m)+'\x17')

			return oldCompile.call(this, t.output, filename)
		}
	
		process.argv.splice(1,2) // remove leading arguments
		require(path.resolve(process.argv[1]));
	}

	var fn = require('../core/fn')
	var ssl = require('../core/io_ssl')
	var ioServer = require('../core/io_server')

	function out() {
		for (var v = Array.prototype.slice.call(arguments), i = 0, c = out.colors; i < v.length; i++) {
			v[i] = String(v[i]).replace(/~(\w*)~/g, function(m, a) {
				return "\033[" + (c[a] || 0) + "m";
			}) + "\033[0m";
			process.stderr.write(v[i]);
		}
	}

	out.colors = {
		bl:"30",bo:"1",r:"0;31",g:"0;32",y:"0;33",b:"0;34",m:"0;35",c:"0;36",
		w:"0;37",br:"1;31",bg:"1;32",by:"1;33",bb:"1;34",bm:"1;35",bc:"1;36",bw:"1;37"
	}
	
	var username = 'John Doe'
	out('~bw~Code.GL ~bc~See~w~ your code. Version 1.0.0, This product is licensed to ' + username + '.\n')

	// argument parse variables
	function processArgs(arg){
		var sender // send messages to ui or zip
		var uiport = 2000
		var tgtport = 2080
		function usage(err){
			out('~br~'+err+'\n')
			out('~w~Usage:\n')
			out('~w~node codegl.js ~c~[flag] ~g~target ~y~[args]\n')
			out('  ~g~../path/to/wwwroot ~w~Trace browser js via static fileserver\n')
			out('  ~g~http://url:port ~w~Trace browser js via proxy\n')
			out('  ~g~nodefile.js ~y~[args] ~w~Trace Node.js process\n')
			out('  ~g~trace.gz ~w~Play back trace.gz file\n')
			out('  ~c~-gz[:file] ~w~Record trace to gzip file. default: trace.gz\n')
			out('  ~c~-ui:port ~w~Open UI at a port. default: 2000\n')
			out('  ~c~-tgt:port ~w~Open browser JS server or proxy at a port. default: 2080\n')
			out('~w~node codegl.js ~r~[commmand]\n')
			out('  ~r~-update ~w~update CodeGL to latest version\n')
			out('  ~r~-install[:path] ~w~install codeGL in your execution path /usr/bin by default\n')

			return
		}
		
		// process arguments
		for(var i = 2;i<arg.length;i++){
			var a = arg[i]
			if(a.charAt(0) == '-'){
				if(a.indexOf('-gz') == 0){
					var d = a.indexOf(':')
					if(d!=-1) sender = gzSender(a.slice(d+1))
					else sender = gzSender('trace.gz')
				} else if(a.indexOf('-update') == 0){
					return checkUpdates()
				} else if(a.indexOf('-install') == 0){
				} else if(a.indexOf('-ui') == 0){
					var d = a.indexOf(':')
					if(d==-1) return usage("No port specified")
					uiport = parseInt(a.slice(d+1))
				} else if(a.indexOf('-tgt') == 0){
					var d = a.indexOf(':')
					if(d==-1) return usage("No port specified")
					tgtport = parseInt(a.slice(d+1))
				} else return usage("Invalid argument "+a)
			} else {
				if(!sender) sender = uiSender(uiport)
				// execute the right mode
				if(a.match(/\.gz$/i)) return gzPlaybackMode(a, sender)
				if(a.match(/\.js$/i)) return nodeJSMode(a, arg.slice(i+1), sender)
				if(a.match(/^https?/)) return proxyMode(tgtport, a, sender)
				return browserJSMode(tgtport, path.resolve(process.cwd(), a), sender)
				break
			}
		}
		usage("Error, no target specified")
	}

	return processArgs(process.argv)
	
	// send data to UI
	function uiSender(port){
		ui = ioServer()
		ui.main = "./trace/trace_client"
		ui.pass = fn.sha1hex("p4ssw0rd")
		if(require.absolute)
		ui.packaged = require.absolute('./trace_client')

		ui.listen(port, "0.0.0.0")
		out("~bw~[Code.GL]~w~ WebGL UI: http://localhost:2000\n")

		var dict = []
		var queue = []
		var joined = false
		// incoming channel data
		ui.data = function(m, c){
			if(m.t == 'join'){
				for(var i = 0;i<dict.length;i++) c.send(dict[i])
				for(var i = 0;i<queue.length;i++) c.send(queue[i])
				joined = true
			}
			else console.log('unused message',m)
		}

		// outgoing data channel
		var lgc = 0
		return function(m){
			// verify ordering
			if(!m.dict){
				if(!lgc) lgc = m.g
				else{
					if(lgc + 1 != m.g){
						console.log("Message order error", lgc, m.g)
					}
					lgc = m.g
				}
				if(joined && m.d == 1) queue = [] // clear the queue at depth 1
				queue.push(m)
			} else {	// keep dictionaries for join
				dict.push(m)
			}
			// keep all messages with depth 0
			if(joined) ui.send(m)
		}
	}

	// send data to zip
	function gzSender(file){
		// pipe writer into gzip into file
		var gz = zlib.createGzip()
		var file = fs.createWriteStream(file)
		file.on('error', function(err){
			console.log("Error writing "+file+" "+err)
		})
		gz.pipe(file)
		// write data to gzip file
		return function(m){
			gz.write('\x1f'+JSON.stringify(m)+'\x17')
		}
		process.on('exit', function(){
			gz.end()
		})
	}

	// app server
	function browserJSMode(port, root, sender){

		// start the target server
		var tgt = ioServer()
		tgt.root = root
		tgt.listen(port, "0.0.0.0")
		//appHttp.watcher = define.watcher()
		out("~bw~[Code.GL]~w~ Serving browser JS: http://localhost:2080\n")

		// incoming message, forward to sender
		tgt.data = function(m, c){
			sender(m)
		}
		
		var fileCache= {}		
		var did = 1 // count instrument offset id
		tgt.process = function(file, name, data, type){
			if(type != "application/javascript") return data
			// cache
			if(fileCache[name]) return fileCache[name].output
			// lets use trace
			var t = fileCache[name] = instrument(file, data.toString('utf8'), did)
			did = t.id
			// send to UI
			sender({dict:1, f:name, src:t.input, d:t.d})
			return t.output
		}
	}

	function streamParser(dataCb, sideCb){
		var last = ""
		return function(d){
			var data = last + d.toString();
			last = "";
			data = data.replace(/\x1f(.*?)\x17/g, function(x, m){
				try{
					dataCb(JSON.parse(m))
				} catch(e){
					fn('error in '+e,m)
				}
				return ''
			})
			if(data.indexOf('\x1f')!= -1) last = data;
			else if(data.length && sideCb) sideCb(data)
		}
	}

	// node server
	function nodeJSMode(file, args, sender){
		// we start up ourselves with -l
		var cp = require('child_process')
		args.unshift(file)
		args.unshift('-l')
		args.unshift(process.argv[1])
 		
 		var stdio = [process.stdin, process.stdout,'pipe']
 		//if(process.version.indexOf('v0.8') != -1)	stdio.push('ipc')

		var child = cp.spawn(process.execPath, args, {
			stdio: stdio
		})

		// stderr datapath
		var sp = streamParser(sender, function(d){
			process.stderr.write(d)
		})
		if(child.stderr) child.stderr.on('data',sp)

		// ipc datapath
		child.on('message', function(m){
			sender(m)
		})
	}

	function proxyMode(url, sender){
	}

	function gzPlaybackMode(file, sender){
		// just output the gz file to sender
		var rs = fs.createReadStream(file)
		var gz = zlib.createGunzip()
		rs.pipe(gz)
		var sp = streamParser(sender)
		gz.on('data', sp)
	}
})
function define(id,fac){
//PACKSTART
	// | returns path of file
	function path(p){ //
		if(!p) return ''
		p = p.replace(/\.\//g, '')
		var b = p.match(/([\s\S]*)\/[^\/]*$/)
		return b ? b[1] : ''
	}

	// | normalizes relative path r against base b
	function norm(r, b){
		b = b.split(/\//)
		r = r.replace(/\.\.\//g,function(){ b.pop(); return ''}).replace(/\.\//g, '')
		var v = b.join('/')+ '/' + r
		if(v.charAt(0)!='/') v = '/'+v
		return v
	}	
	//PACKEND
//PACKSTART
	function def(id, fac){
		if(!fac) fac = id, id = null
		def.factory[id || '_'] = fac
	}

	def.module = {}
	def.factory = {}
	def.urls = {}
	def.tags = {}

	var reload

	function req(id, base){
		if(!base) base = ''
		if(typeof require !== "undefined" && id.charAt(0) != '.') return require(id)

		id = norm(id, base)

		var c = def.module[id]
		if(c) return c.exports

		var f = def.factory[id]
		if(!f) throw new Error('module not available '+id + ' in base' + base)
		var m = {exports:{}}

		var localreq = def.mkreq(id)
	
		var ret = f(localreq, m.exports, m)
		if(ret) m.exports = ret
		def.module[id] = m

		return m.exports
	}

	def.mkreq = function(base){
		function localreq(i){
			return def.req(i, path(base))
		}

		localreq.reload = function(i, cb){
			var id = norm(i, base)
			script(id, 'reload', function(){
				delete def.module[id] // cause reexecution of module
				cb( req(i, base) )
			})
		}

		localreq.absolute = function(i){
			return norm(i, path(base))
		}

		return localreq
	}
	def.req = req
	def.outer = define
	def.path = path
	def.norm = norm

	define = def
	def(id, fac)

	//RELOADER
	if(typeof window != 'undefined' && window.location.origin != 'file://'){
		function reloader(){
			rtime = Date.now()
			var x = new XMLHttpRequest()
			x.onreadystatechange = function(){
				if(x.readyState != 4) return
				if(x.status == 200){
					// we can filter on filename
					if(!define.reload || !define.reload(x.responseText))
						return location.href = location.href
				}
				setTimeout(reloader, (Date.now() - rtime) < 1000?500:0)
			}
			x.open('GET', "/_reloader_")
			x.send()	
		}
		reloader()
	}
	//RELOADER	

	//PACKEND
}


define('/core/fn',function(){
if(console.log.bind)
var fn = console.log.bind(console)
else
var fn = function(){
var s = ''
for(var i = 0;i<arguments.length;i++) s+= (s?', ':'')+arguments[i]
console.log(s)
}
fn.list = list
fn.stack = stack
fn.ps = ps
fn.wait = wait
fn.repeat = repeat
fn.events = events
fn.dt = dt
fn.mt = mt
fn.sha1hex = sha1hex
fn.rndhex = rndhex
fn.tr = tr
fn.dump = dump
fn.walk = walk
fn.min = min
fn.max = max
fn.clamp = clamp
fn.nextpow2 = nextpow2
fn.named = named
function named(a, f){
var t = typeof a[0]
if(t == 'function' || t== 'object') return t
if(!f) f = named.caller
if(!f._c) f._c = f.toString()
if(!f._n) f._n = f._c.match(/function.*?\((.*?)\)/)[1].split(',')
var n = f._n
if(a.length > n.length) throw new Error("Argument list mismatch, "+a.length+" instead of "+n.length)
var g = {}
for(var i = 0, j = a.length;i<j;i++) g[n[i]] = a[i]
return g
}
function list(l, r){
var b
var e
function li(){
return li.fn.apply(0, arguments)
}
li.fn = function(a){
if(arguments.length > 1){
var rm = {}
for(var i = 0, j = arguments.length; i<j; i++) li.add(rm[i] = arguments[i])
return function(){
for(var i in rm) li.rm(rm[i])
rm = null
}
}
li.add(a)
return function(){
if(a) li.rm(a)
a = null
}
}
var ln = 0
li.len = 0
li.add = add
li.rm = rm
li.clear = function(){
var n = b
while(n){
var m = n[r]
delete n[r]
delete n[l]
n = m
}
b = e = undefined
li.len = ln = 0
}
li.drop = function(){
b = e = undefined
li.len = ln = 0
}
function add(i){
if(arguments.length > 1){
for(var i = 0, j = arguments.length; i<j; i++) add(arguments[i])
return ln
}
if( l in i || r in i || b == i) return ln
if(!e) b = e = i
else e[r] = i, i[l] = e, e = i
li.len = ++ln
if(ln == 1 && li.fill) li.fill()
return ln
}
li.sorted = function(i, s){
if( l in i || r in i || b == i) return ln
var a = e
while(a){
if(a[s] <= i[s]){
if(a[r]) a[r][l] = i, i[r] = a[r]
else e = i
i[l] = a
a[r] = i
break
}
a = a[l]
}
if(!a){
if(!e) e = i
if(b) i[r] = b, b[l] = i
b = i
}
li.len = ++ln
if(ln == 1 && li.fill) li.fill()
return ln
}
function rm(i){
if(arguments.length > 1){
for(var i = 0, j = arguments.length; i<j; i++) rm(arguments[i])
return ln
}
var t = 0
if(b == i) b = i[r], t++
if(e == i) e = i[l], t++
if(i[r]){
if(i[l]) i[r][l] = i[l]
else delete i[r][l]
t++
}
if(i[l]){
if(i[r]) i[l][r] = i[r]
else delete i[l][r]
t++
}
if(!t) return
delete i[r]
delete i[l]
li.len = --ln
if(!ln && li.empty) li.empty()
return ln
}
li.run = function(){
var n = b, t, v
while(n) v = n.apply(null, arguments), t = v !== undefined ? v : t, n = n[r]
return t
}
li.each = function(c){
var n = b
var j = 0
var t
while(n) {
var x = n[r]
v = c(n, li, j)
if(v !== undefined) t = v
n = x, j++
}
return t
}
li.has = function(i){
return l in i || r in i || b == i
}
li.first = function(){
return b
}
li.last = function(){
return e
}
return li
}
function events(o){
o.on = function(e, f){
var l = this.$l || (this.$l = {})
var a = l[e]
if(!a) l[e] = f
else{
if(Array.isArray(a)) a.push(event)
else l[e] = [l[e], f]
}
}
o.off = function(e, f){
var l = this.$l || (this.$l = {})
if(!l) return
var a = l[e]
if(!a) return
if(Array.isArray(a)){
for(var i = 0;i<a.length;i++){
if(a[i] == f) a.splice(i,1), i--
}
}
else if (l[e] == f) delete l[e]
}
o.clear = function(e, f){
var l = this.$l
if(!l) return
delete l[e]
}
o.emit = function(e){
var l = this.$l
if(!l) return
var a = l[e]
if(!a) return
if(arguments.length>1){
var arg = Array.prototype.slice.call(arguments, 1)
if(typeof a == 'function') a.apply(null, arg)
else for(var i = 0;i<a.length;i++) a[i].apply(null, arg)
} else {
if(typeof a == 'function') a()
else for(var i = 0;i<a.length;i++) a[i]()
}
}
}
function stack(){
function st(){
return st.fn.apply(null, arguments)
}
st.fn = function(a){
if(arguments.length > 1){
var rm = {}
for(var i = 0, j = arguments.length; i<j; i++) rm[push(arguments[i])] = 1
return function(){
for(var i in rm) st.rm(i)
rm = null
}
} else {
var i = push(a)
return function(){
if(i !== undefined) st.rm(i)
i = undefined
}
}
}
st.push = push
st.shift = shift
st.set = set
var b = st.beg = 1
var e = st.end = 1
var l = st.len = 0
st.bottom = function(){
if(b == e) return null
return st[b]
}
st.top = function(){
if(b == e) return null
return st[e]
}
function push(a){
if(arguments.length > 1){
var r
for(var i = 0, j = arguments.length; i<j; i++) r = push(arguments[i])
return r
}
st[e++] = a, st.len = ++l
return (st.end = e) - 1
}
st.pop = function(){
var p = st[e - 1]
if(b != e){
delete st[e]
while(e != b && !(e in st)) e --
if(!--l) st.beg = st.end = b = e = 1
st.len = l
} else b = e = 1, st.len = l = 0
st.end = e
return p
}
function shift(a){
if(arguments.length > 1){
var r
for(var i = 0, j = arguments.length; i<j; i++) r = push(arguments[i])
return r
}
st[--b] = a, st.len = ++l
return st.beg = b
}
st.unshift = function(){
if(b != e){
delete st[b]
while(b != e && !(b in st)) b++
if(!--l) st.beg = st.end = b = e = 1
st.len = l
}
return st.beg
}
function set(i, v){
if(arguments.length > 2){
var r
for(var i = 0, j = arguments.length; i<j; i+=2) r = add(arguments[i], arguments[i+1])
return r
}
st[i] = v
if(i < b) st.beg = b = i
if(i >= e) st.end = e = i + 1
return i
}
st.rm = function(i){
if(!i in st) return
delete st[i]
if(!--l) {
st.len = 0
st.beg = st.end = b = e = 1
return i
}
st.len = l
if(i == b) while(b != e && !(b in st)) st.beg = ++b
if(i == e) while(e != b && !(e in st)) st.end = --e
return i
}
st.each = function(c){
var r
var v
for(var i = b; i < e; i++){
if(i in st){
v = c(st[i], st, i)
if(v !== undefined) r = v
}
}
return v
}
return st
}
function rndhex(n){
var s = ""
for(var i = 0;i<n;i++) s += parseInt(Math.random()*16).toString(16)
return s.toLowerCase()
}
function ps(il, ir){
var li = list(il || '_psl', ir || '_psr')
var of = li.fn
li.fn = function(i){
if(arguments.length == 1 && typeof i == 'function') return of(i)
return li.run.apply(null, arguments)
}
return li
}
function mt(s, h){
if (s === undefined) s = new Date().getTime();
var p, t
if(h){
p = {}
var j = 0
for(var i in h) p[j++] = h[i]
t = j
}
m = new Array(624)
m[0] = s >>> 0
for (var i = 1; i < m.length; i++){
var a = 1812433253
var b = (m[i-1] ^ (m[i-1] >>> 30))
var x = a >>> 16, y = a & 0xffff
var c = b >>> 16, d = b & 0xffff;
m[i] = (((x * d + y * c) << 16) + y * d) >>> 0
}
var i = m.length
function nx(a) {
var v
if (i >= m.length) {
var k = 0, N = m.length, M = 397
do {
v = (m[k] & 0x80000000) | (m[k+1] & 0x7fffffff)
m[k] = m[k + M] ^ (v >>> 1) ^ ((v & 1) ? 0x9908b0df : 0)
} while (++k < N - M)
do {
v = (m[k] & 0x80000000) | (m[k+1] & 0x7fffffff)
m[k] = m[k + M - N] ^ (v >>> 1) ^ ((v & 1) ? 0x9908b0df : 0)
} while (++k < N - 1)
v = (m[N - 1] & 0x80000000) | (m[0] & 0x7fffffff)
m[N - 1] = m[M - 1] ^ (v >>> 1) ^ ((v & 1) ? 0x9908b0df : 0)
i = 0
}
v = m[i++]
v ^= v >>> 11, v ^= (v << 7) & 0x9d2c5680, v ^= (v << 15) & 0xefc60000, v ^= v >>> 18
if(a!==undefined){
v = ((a >>> 5) * 0x4000000 + (v>>>6)) / 0x20000000000000
if(p) return p[ Math.round(v * ( t - 1 )) ]
return v
}
return nx(v)
}
return nx
}
function sha1hex (m) {
function rl(n,s){ return ( n<<s ) | (n>>>(32-s)) }
function lsb(v) {
var s = "", i, vh, vl
for( i=0; i<=6; i+=2 ) vh = (v>>>(i*4+4))&0x0f, vl = (v>>>(i*4))&0x0f, s += vh.toString(16) + vl.toString(16)
return s
}
function hex(v) {
var s = "", i, j
for( i=7; i>=0; i-- ) j = (v>>>(i*4))&0x0f, s += j.toString(16)
return s
}
function utf8(s) {
s = s.replace(/\r\n/g,"\n");
var u = "";
var fc = String.fromCharCode
for (var n = 0; n < s.length; n++) {
var c = s.charCodeAt(n)
if (c < 128) u += fc(c)
else if((c > 127) && (c < 2048)) u += fc((c >> 6) | 192), u += fc((c & 63) | 128)
else u += fc((c >> 12) | 224), u += fc(((c >> 6) & 63) | 128), u += fc((c & 63) | 128)
}
return u
}
m = utf8(m)
var bs, i, j, u = new Array(80)
var v = 0x67452301, w = 0xEFCDAB89, x = 0x98BADCFE, y = 0x10325476, z = 0xC3D2E1F0
var a, b, c, d, e, t
var l = m.length
var wa = []
for(i=0; i<l-3; i+=4) j = m.charCodeAt(i)<<24 | m.charCodeAt(i+1)<<16 | m.charCodeAt(i+2)<<8 | m.charCodeAt(i+3), wa.push(j)
var r = l%4
if(r == 0) i = 0x080000000
else if(r == 1) i = m.charCodeAt(l-1)<<24 | 0x0800000
else if(r == 2) i = m.charCodeAt(l-2)<<24 | m.charCodeAt(l-1)<<16 | 0x08000
else i = m.charCodeAt(l-3)<<24 | m.charCodeAt(l-2)<<16 | m.charCodeAt(l-1)<<8 | 0x80
wa.push(i)
while((wa.length % 16) != 14) wa.push( 0 )
wa.push(l>>>29)
wa.push((l<<3)&0x0ffffffff)
for(bs=0; bs<wa.length; bs+=16){
for(i=0; i<16; i++) u[i] = wa[bs+i]
for(i=16; i<=79; i++) u[i] = rl(u[i-3] ^ u[i-8] ^ u[i-14] ^ u[i-16], 1)
a = v, b = w, c = x, d = y, e = z
for(i = 0;i <= 19;i++) t = (rl(a,5) + ((b&c) | (~b&d)) + e + u[i] + 0x5A827999) & 0x0ffffffff, e = d, d = c, c = rl(b,30), b = a, a = t
for(i = 20;i <= 39;i++) t = (rl(a,5) + (b ^ c ^ d) + e + u[i] + 0x6ED9EBA1) & 0x0ffffffff, e = d,d = c,c = rl(b,30),b = a,a = t
for(i = 40;i <= 59;i++) t = (rl(a,5) + ((b&c) | (b&d) | (c&d)) + e + u[i] + 0x8F1BBCDC) & 0x0ffffffff, e = d, d = c, c = rl(b,30), b = a, a = t
for(i = 60;i <= 79;i++) t = (rl(a,5) + (b ^ c ^ d) + e + u[i] + 0xCA62C1D6) & 0x0ffffffff, e = d, d = c, c = rl(b,30), b = a, a = t
v = (v + a) & 0x0ffffffff
w = (w + b) & 0x0ffffffff
x = (x + c) & 0x0ffffffff
y = (y + d) & 0x0ffffffff
z = (z + e) & 0x0ffffffff
}
return (hex(v) + hex(w) + hex(x) + hex(y) + hex(z)).toLowerCase()
}
function wait(t){
var p = ps()
p.empty = function(){
clearTimeout(i)
}
var i = setTimeout(p, t)
return p;
}
function repeat(t){
var p = ps()
p.empty = function(){
clearInterval(i)
}
var i = setInterval(p, t)
return p;
}
function nextpow2(x) {
--x
for (var i = 1; i < 32; i <<= 1) x = x | x >> i
return x + 1
}
function clamp(a, mi, ma){
return a<mi?mi:a>ma?ma:a
}
function min(a, b){
return a<b?a:b
}
function max(a, b){
return a>b?a:b
}
function dt(){
var ci
if (typeof chrome !== "undefined" && typeof chrome.Interval === "function")
ci = new chrome.Interval
var n = now()
function now(){
return ci ? ci.microseconds() : Date.now()
}
function dt(){
return now() - n
}
dt.log = function(m){
return console.log((m?m:'')+(now() - n ))
}
dt.reset = function(){
n = now()
}
return dt;
}
function tr(){
console.log(new Error().stack)
}
function walk(n, sn, f){
var s = typeof f != 'function' && f
var z = 0
while(n && n != sn){
if(s) { if(s in n) n[s](n) }
else f(n, z)
if(n._c) n = n._c, z++
else if(n._d) n = n._d
else {
while(n && !n._d && n != sn) n = n._p, z--
if(n) n = n._d
}
}
}
function dump(
d,
o,
s,
z,
r
){
if(!s)s = [], r = [], z = 0;
o = o || {};
var k
var ic
var ip
var nl
var i
var l
var t
var c = s.length
switch(typeof(d)){
case 'function':
case 'object':
if(d == null) {
s[c++] = "null"
break
}
if(z >= (o.m || 99)) {
s[c++] = "{...}"
break
}
r.push(d)
if(o.p) ic = ic = nl = ""
else ic = Array(z + 2).join(' '), ip = Array(z + 1).join(' '), nl = "\n"
if(d.constructor == Array) {
s[c++] = "[", s[c++] = nl
for(k = 0; k < d.length; k++){
s[c++] = ic
for(i = 0, t = d[k], l = r.length;i < l; i++) if(r[i] == t) break
var c1 = c
if(i == l) dump(t, o, s, z + 1, r)
else s[c++] = "nested: " + i + ""
c = s.length
var c2 = c
console.log(c1,c2)
if(s.slice(c1,c2-c1).join('').length < 50){
for(var c3 = c1;c3<c2;c3++){
s[c3] = s[c3].replace?s[c3].replace(/[\r\n\t]|\s\s/g,""):s[c3]
}
}
s[c++]=", " +nl
}
s[c-1] = nl + ip + "]"
} else {
if(typeof(d) == 'function') s[c++] = "->"
s[c++] = "{", s[c++] = nl
for(k in d) {
if(d.hasOwnProperty(k)) {
if(o.c && c > o.c) {
s[c++] = "<...>"
break
}
s[c++] = ic + (k.match(/[^a-zA-Z0-9_]/)?"'"+k+"'":k) + ':'
for(i = 0, t = d[k], l = r.length; i < l; i++) if(r[i] == t) break
var c1 = c
if(i == l) dump(t, o, s, z + 1, r)
else s[c++] = "[nested: " + i + "]"
c = s.length
var c2 = c
if(s.slice(c1,c2).join('').length < 200){
for(var c3 = c1;c3<c2;c3++){
if(s[c3] && typeof(s[c3]) == 'string')
s[c3] = s[c3].replace(/[\r\n\t]|\s\s/g,"")
}
}
s[c++] = ", " + nl
}
}
s[c-1] = nl + ip + "}"
}
r.pop()
break
case 'string':
s[c++]="'" + d + "'"
break
default:
s.push(d)
break
}
return z ? 0 : s.join('')
}
return fn
})

define('/core/acorn',function(require, exports, module){
exports.version = "0.0.2";
var options, input, inputLen, sourceFile;
var defaultOptions = exports.defaultOptions = {
ecmaVersion: 5,
strictSemicolons: false,
allowTrailingCommas: true,
forbidReserved: false,
locations: false,
onComment: null,
ranges: false,
program: null,
sourceFile: null,
noclose:false,
compact:false,
tokens:false,
};
exports.parse = function(inpt, opts) {
input = String(inpt); inputLen = input.length;
options = opts || {};
for (var opt in defaultOptions) if (!options.hasOwnProperty(opt))
options[opt] = defaultOptions[opt];
sourceFile = options.sourceFile || null;
var n
if(options.tokens){
tokTree = new Node()
tokTree.root = 1
tokTree.t = tokTree.w = ''
n = parseTopLevel(options.program)
n.tokens = tokTree
} else {
n = parseTopLevel(options.program)
}
return n
};
exports.dump = function(o, t, r){
t = t || ''
var a = Array.isArray(o)
var s = (a?'[':'{')
for(var k in o)if(o.hasOwnProperty(k)){
if(k == 'token'){
s += '\n'+t+'token: '+o[k].t
continue
}
var v = o[k]
s += '\n' + t + k+': '
if(typeof v == 'object') {
s += exports.dump(v, t + ' ', r)
}
else s += v
}
s += '\n'+t.slice(1) + (a?']':'}')
return s
}
var walk = {
Literal: {},
Identifier: {},
Program: {body:2},
ExpressionStatement: {expression:1},
BreakStatement: {},
ContinueStatement: {},
DebuggerStatement: {},
DoWhileStatement: {body:1, test:1},
ReturnStatement: {argument:1},
SwitchStatement: {discriminant:1,cases:2},
SwitchCase: {consequent:2,test:1},
WhileStatement: {test:1, body:1},
WithStatement: {object:1,body:1},
EmptyStatement: {},
LabeledStatement: {body:1,label:4},
BlockStatement: {body:2},
ForStatement: {init:1,test:1,update:1,body:1},
ForInStatement: {left:1,right:1,body:1},
VariableDeclaration: {declarations:2},
VariableDeclarator: {id:4,init:1},
SequenceExpression: {expressions:2},
AssignmentExpression: {left:1,right:1},
ConditionalExpression:{test:1,consequent:1,alternate:1},
LogicalExpression: {left:1,right:1},
BinaryExpression: {left:1,right:1},
UpdateExpression: {argument:1},
UnaryExpression: {argument:1},
CallExpression: {callee:1,arguments:2},
ThisExpression: {},
ArrayExpression: {elements:2},
NewExpression: {callee:1,arguments:2},
FunctionDeclaration: {id:4,params:2,body:1},
FunctionExpression: {id:4,params:2,body:1},
ObjectExpression: {properties:3},
MemberExpression: {object:1,property:1},
IfStatement: {test:1,consequent:1,alternate:1},
ThrowStatement: {argument:1},
TryStatement: {block:1,handlers:2,finalizer:1},
CatchClause: {param:1,guard:1,body:1}
}
function walkDown(n, o, p){
var f = o[n.type]
if(f){
if(f(n, p)) return
}
var w = walk[n.type]
for(var k in w){
var t = w[k]
var m = n[k]
if(t == 2){
if(!Array.isArray(m))throw new Error("invalid type")
for(var i = 0; i < m.length; i++){
walkDown(m[i], o, {up:p, sub:k, node:n, index:i} )
}
} else if(t == 3){
if(!Array.isArray(m))throw new Error("invalid type")
for(var i = 0; i < m.length; i++){
walkDown(m[i].value, o, {up:p, sub:k, node:n, index:i, key:m[i].key} )
}
} else {
if(m) walkDown(m, o, {up:p, sub:k, node:n})
}
}
}
function walkUp(p, o){
while(p){
var f = o[p.node.type]
if(f && f(p.node, p)) break
p = p.up
}
}
exports.walkDown = walkDown
exports.walkUp = walkUp
var sSep
function sExp(e){
if(!e || !e.type) return ''
return sTab[e.type](e)
}
function sBlk(b){
var s = ''
for(var i = 0;i<b.length;i++) s += sExp(b[i]) + sSep
return s
}
function sSeq(b){
var s = ''
for(var i = 0;i<b.length;i++){
if(i) s += ', '
s += sExp(b[i])
}
return s
}
var sTab = {
Literal: function(n){ return n.raw },
Identifier: function(n){ return n.name },
Program: function(n){ return sBlk(n.body) },
ExpressionStatement: function(n){ return sExp(n.expression) },
BreakStatement: function(n){ return 'break' },
ContinueStatement: function(n){ return 'continue' },
DebuggerStatement: function(n){ return 'debugger' },
DoWhileStatement: function(n){ return 'do'+sExp(n.body)+sSep+'while('+sExp(n.test)+')' },
ReturnStatement: function(n){ return 'return '+sExp(n.argument) },
SwitchStatement: function(n){ return 'switch('+sExp(n.discriminant)+'){'+sBlk(n.cases)+'}' },
SwitchCase: function(n){ return 'case '+sExp(n.test)+':'+sSep+sBlk(n.consequent) },
WhileStatement: function(n){ return 'while('+sExp(n.test)+')'+sExp(n.body) },
WithStatement: function(n){ return 'with('+sExp(n.object)+')'+sExp(n.body) },
EmptyStatement: function(n){ return '' },
LabeledStatement: function(n){ return sExp(n.label) + ':' + sSep + sExp(n.body) },
BlockStatement: function(n){ return '{'+sSep+sBlk(n.body)+'}' },
ForStatement: function(n){ return 'for('+sExp(n.init)+';'+sExp(n.test)+';'+sExp(n.update)+')'+sExp(n.body) },
ForInStatement: function(n){ return 'for('+sExp(n.left)+' in '+sExp(n.right)+')'+sExp(n.body) },
VariableDeclarator: function(n){ return sExp(n.id)+' = ' +sExp(n.init) },
VariableDeclaration: function(n){ return 'var '+sSeq(n.declarations) },
SequenceExpression: function(n){ return sSeq(n.expressions) },
AssignmentExpression: function(n){ return sExp(n.left)+n.operator+sExp(n.right) },
ConditionalExpression:function(n){ return sExp(n.test)+'?'+sExp(n.consequent)+':'+sExp(n.alternate) },
LogicalExpression: function(n){ return sExp(n.left)+n.operator+sExp(n.right) },
BinaryExpression: function(n){ return sExp(n.left)+n.operator+sExp(n.right) },
UpdateExpression: function(n){ return n.prefix?n.operator+sExp(n.argument):sExp(n.argument)+n.operator },
UnaryExpression: function(n){ return n.prefix?n.operator+sExp(n.argument):sExp(n.argument)+n.operator },
CallExpression: function(n){ return sExp(n.callee)+'('+sSeq(n.arguments)+')' },
ThisExpression: function(n){ return 'this' },
ArrayExpression: function(n){ return '['+sSeq(n.elements)+']' },
NewExpression: function(n){ return 'new '+sExp(n.callee)+'('+sSeq(n.arguments)+')' },
FunctionDeclaration: function(n){ return 'function'+(n.id?' '+sExp(n.id):'')+'('+sSeq(n.params)+')'+sExp(n.body) },
FunctionExpression: function(n){ return 'function'+(n.id?' '+sExp(n.id):'')+'('+sSeq(n.params)+')'+sExp(n.body) },
ObjectExpression: function(n){
var s = '{'
var b = n.properties
for(var i = 0;i<b.length;i++){
if(i) s += ', '
s += sExp(b.key) + ':' + sExp(b.value)
}
s += '}'
return s
},
MemberExpression: function(n){
if(n.computed) return sExp(n.object)+'['+sExp(n.property)+']'
return sExp(n.object)+'.'+sExp(n.property)
},
IfStatement: function(n){
return 'if('+sExp(n.test)+')' + sExp(n.consequent) + sSep +
(n.alternate ? 'else ' + sExp(n.alternate) + sSep : '')
},
ThrowStatement: function(n){ return 'throw '+sExp(n.argument) },
TryStatement: function(n){
return 'try '+sExp(n.block)+sSep+sBlk(n.handlers)+sSep+
(n.finalizer? 'finally ' + sBlk(n.finalizer) : '')
},
CatchClause: function(n){
return 'catch(' + sExp(n.param) + (n.guard?' if '+sExp(n.guard):')') + sExp(n.body)
}
}
function stringify(n, sep){
sSep = sep || '\n'
return sExp(n)
}
exports.stringify = stringify
var getLineInfo = exports.getLineInfo = function(input, offset) {
for (var line = 1, cur = 0;;) {
lineBreak.lastIndex = cur;
var match = lineBreak.exec(input);
if (match && match.index < offset) {
++line;
cur = match.index + match[0].length;
} else break;
}
return {line: line, column: offset - cur};
};
var tokPos;
var tokStart, tokEnd;
var tokStartLoc, tokEndLoc;
var tokType, tokVal;
var tokRegexpAllowed;
var tokCurLine, tokLineStart, tokLineStartNext;
var lastStart, lastEnd, lastEndLoc;
var inFunction, labels, strict;
function raise(pos, message) {
if (typeof pos == "number") pos = getLineInfo(input, pos);
message += " (" + pos.line + ":" + pos.column + ")";
throw new SyntaxError(message);
}
var _num = {type: "num"}, _regexp = {type: "regexp"}, _string = {type: "string"};
var _name = {type: "name"}, _eof = {type: "eof"};
var _break = {keyword: "break"}, _case = {keyword: "case", beforeExpr: true}, _catch = {keyword: "catch"};
var _continue = {keyword: "continue"}, _debugger = {keyword: "debugger"}, _default = {keyword: "default"};
var _do = {keyword: "do", isLoop: true}, _else = {keyword: "else", beforeExpr: true};
var _finally = {keyword: "finally"}, _for = {keyword: "for", isLoop: true}, _function = {keyword: "function"};
var _if = {keyword: "if"}, _return = {keyword: "return", beforeExpr: true}, _switch = {keyword: "switch"};
var _throw = {keyword: "throw", beforeExpr: true}, _try = {keyword: "try"}, _var = {keyword: "var"};
var _while = {keyword: "while", isLoop: true}, _with = {keyword: "with"}, _new = {keyword: "new", beforeExpr: true};
var _this = {keyword: "this"}, _const = {keyword:"const"};
var _null = {keyword: "null", atomValue: null}, _true = {keyword: "true", atomValue: true};
var _false = {keyword: "false", atomValue: false};
var _in = {keyword: "in", binop: 7, beforeExpr: true};
var keywordTypes = {"break": _break, "case": _case, "catch": _catch,
"continue": _continue, "debugger": _debugger, "default": _default,
"do": _do, "else": _else, "finally": _finally, "for": _for,
"function": _function, "if": _if, "return": _return, "switch": _switch,
"throw": _throw, "try": _try, "var": _var, "while": _while, "with": _with,
"null": _null, "true": _true, "false": _false, "new": _new, "in": _in,
"instanceof": {keyword: "instanceof", binop: 7}, "this": _this,
"typeof": {keyword: "typeof", prefix: true},
"void": {keyword: "void", prefix: true},
"delete": {keyword: "delete", prefix: true},
"const": _const};
var _bracketL = {type: "[", beforeExpr: true}, _bracketR = {type: "]"}, _braceL = {type: "{", beforeExpr: true};
var _braceR = {type: "}"}, _parenL = {type: "(", beforeExpr: true}, _parenR = {type: ")"};
var _comma = {type: ",", beforeExpr: true}, _semi = {type: ";", beforeExpr: true};
var _colon = {type: ":", beforeExpr: true}, _dot = {type: "."}, _question = {type: "?", beforeExpr: true};
var _slash = {binop: 10, beforeExpr: true}, _eq = {isAssign: true, beforeExpr: true};
var _assign = {isAssign: true, beforeExpr: true}, _plusmin = {binop: 9, prefix: true, beforeExpr: true};
var _incdec = {postfix: true, prefix: true, isUpdate: true}, _prefix = {prefix: true, beforeExpr: true};
var _bin1 = {binop: 1, beforeExpr: true}, _bin2 = {binop: 2, beforeExpr: true};
var _bin3 = {binop: 3, beforeExpr: true}, _bin4 = {binop: 4, beforeExpr: true};
var _bin5 = {binop: 5, beforeExpr: true}, _bin6 = {binop: 6, beforeExpr: true};
var _bin7 = {binop: 7, beforeExpr: true}, _bin8 = {binop: 8, beforeExpr: true};
var _bin10 = {binop: 10, beforeExpr: true};
function makePredicate(words) {
words = words.split(" ");
var f = "", cats = [];
out: for (var i = 0; i < words.length; ++i) {
for (var j = 0; j < cats.length; ++j)
if (cats[j][0].length == words[i].length) {
cats[j].push(words[i]);
continue out;
}
cats.push([words[i]]);
}
function compareTo(arr) {
if (arr.length == 1) return f += "return str === " + JSON.stringify(arr[0]) + ";";
f += "switch(str){";
for (var i = 0; i < arr.length; ++i) f += "case " + JSON.stringify(arr[i]) + ":";
f += "return true}return false;";
}
if (cats.length > 3) {
cats.sort(function(a, b) {return b.length - a.length;});
f += "switch(str.length){";
for (var i = 0; i < cats.length; ++i) {
var cat = cats[i];
f += "case " + cat[0].length + ":";
compareTo(cat);
}
f += "}";
} else {
compareTo(words);
}
return new Function("str", f);
}
var isReservedWord3 = makePredicate("abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile");
var isReservedWord5 = makePredicate("class enum extends super const export import");
var isStrictReservedWord = makePredicate("implements interface let package private protected public static yield");
var isStrictBadIdWord = makePredicate("eval arguments");
var isKeyword = makePredicate("break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this const");
var nonASCIIwhitespace = /[\u1680\u180e\u2000-\u200a\u2028\u2029\u202f\u205f\u3000\ufeff]/;
var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u0527\u0531-\u0556\u0559\u0561-\u0587\u05d0-\u05ea\u05f0-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u08a0\u08a2-\u08ac\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0977\u0979-\u097f\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c33\u0c35-\u0c39\u0c3d\u0c58\u0c59\u0c60\u0c61\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d60\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e87\u0e88\u0e8a\u0e8d\u0e94-\u0e97\u0e99-\u0e9f\u0ea1-\u0ea3\u0ea5\u0ea7\u0eaa\u0eab\u0ead-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f4\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f0\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1877\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191c\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19c1-\u19c7\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1ce9-\u1cec\u1cee-\u1cf1\u1cf5\u1cf6\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2119-\u211d\u2124\u2126\u2128\u212a-\u212d\u212f-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u2e2f\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309d-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312d\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fcc\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua697\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua78e\ua790-\ua793\ua7a0-\ua7aa\ua7f8-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa80-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uabc0-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc";
var nonASCIIidentifierChars = "\u0371-\u0374\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u0620-\u0649\u0672-\u06d3\u06e7-\u06e8\u06fb-\u06fc\u0730-\u074a\u0800-\u0814\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0840-\u0857\u08e4-\u08fe\u0900-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962-\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09d7\u09df-\u09e0\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2-\u0ae3\u0ae6-\u0aef\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b5f-\u0b60\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c01-\u0c03\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62-\u0c63\u0c66-\u0c6f\u0c82\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2-\u0ce3\u0ce6-\u0cef\u0d02\u0d03\u0d46-\u0d48\u0d57\u0d62-\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0df2\u0df3\u0e34-\u0e3a\u0e40-\u0e45\u0e50-\u0e59\u0eb4-\u0eb9\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f41-\u0f47\u0f71-\u0f84\u0f86-\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u1000-\u1029\u1040-\u1049\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u170e-\u1710\u1720-\u1730\u1740-\u1750\u1772\u1773\u1780-\u17b2\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u1920-\u192b\u1930-\u193b\u1951-\u196d\u19b0-\u19c0\u19c8-\u19c9\u19d0-\u19d9\u1a00-\u1a15\u1a20-\u1a53\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1b46-\u1b4b\u1b50-\u1b59\u1b6b-\u1b73\u1bb0-\u1bb9\u1be6-\u1bf3\u1c00-\u1c22\u1c40-\u1c49\u1c5b-\u1c7d\u1cd0-\u1cd2\u1d00-\u1dbe\u1e01-\u1f15\u200c\u200d\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2d81-\u2d96\u2de0-\u2dff\u3021-\u3028\u3099\u309a\ua640-\ua66d\ua674-\ua67d\ua69f\ua6f0-\ua6f1\ua7f8-\ua800\ua806\ua80b\ua823-\ua827\ua880-\ua881\ua8b4-\ua8c4\ua8d0-\ua8d9\ua8f3-\ua8f7\ua900-\ua909\ua926-\ua92d\ua930-\ua945\ua980-\ua983\ua9b3-\ua9c0\uaa00-\uaa27\uaa40-\uaa41\uaa4c-\uaa4d\uaa50-\uaa59\uaa7b\uaae0-\uaae9\uaaf2-\uaaf3\uabc0-\uabe1\uabec\uabed\uabf0-\uabf9\ufb20-\ufb28\ufe00-\ufe0f\ufe20-\ufe26\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f";
var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");
var newline = /[\n\r\u2028\u2029]/;
var lineBreak = /\r\n|[\n\r\u2028\u2029]/g;
function isIdentifierStart(code) {
if (code < 65) return code === 36;
if (code < 91) return true;
if (code < 97) return code === 95;
if (code < 123)return true;
return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code));
}
function isIdentifierChar(code) {
if (code < 48) return code === 36;
if (code < 58) return true;
if (code < 65) return false;
if (code < 91) return true;
if (code < 97) return code === 95;
if (code < 123)return true;
return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code));
}
function nextLineStart() {
lineBreak.lastIndex = tokLineStart;
var match = lineBreak.exec(input);
return match ? match.index + match[0].length : input.length + 1;
}
function line_loc_t() {
this.line = tokCurLine;
this.column = tokPos - tokLineStart;
}
function curLineLoc() {
while (tokLineStartNext <= tokPos) {
++tokCurLine;
tokLineStart = tokLineStartNext;
tokLineStartNext = nextLineStart();
}
return new line_loc_t();
}
function initTokenState() {
tokCurLine = 1;
tokPos = tokLineStart = 0;
tokLineStartNext = nextLineStart();
tokRegexpAllowed = true;
skipSpace();
if(tokPos != 0 && options.tokens) tokTree.w = input.slice(0, tokPos)
}
var otherTypes = {
"num":_num , "regexp":_regexp, "string":_string,
"name":_name, "eof":_eof,
"bracketL":_bracketL, "bracketR":_bracketR,
"braceL":_braceL,"braceR":_braceR,
"parenL":_parenL,"parenR":_parenR,
"comma":_comma, "semi":_semi,
"colon":_colon, "dot":_dot, "question":_question,
"slash":_slash, "eq":_eq,
"assign":_assign, "plusmin":_plusmin,
"incdec":_incdec,"prefix":_prefix,
"bin1":_bin1, "bin2":_bin2,
"bin3":_bin3, "bin4":_bin4,
"bin5":_bin5, "bin6":_bin6,
"bin7":_bin7, "bin8":_bin8,
"bin10":_bin10
};
function nodeProto(p){
for(var k in keywordTypes){
(function(k){
p.__defineGetter__(k, function(){
return this._t == keywordTypes[k]
})
})(k)
}
for(var k in otherTypes){
(function(k){
p.__defineGetter__(k, function(){
return this._t == otherTypes[k]
})
})(k)
}
p.__defineGetter__('isAssign', function(){ return this._t && this._t.isAssign })
p.__defineGetter__('isLoop', function(){ return this._t && this._t.isLoop })
p.__defineGetter__('prefix', function(){ return this._t && this._t.prefix })
p.__defineGetter__('beforeExpr', function(){ return this._t && this._t.beforeExpr })
p.__defineGetter__('beforeNewline', function(){ return this.w && this.w.match(/\n/) })
p.__defineGetter__('beforeEnd', function(){ return this.w && this.w.match(/\n/) || this.d.semi || this.d.braceR })
p.__defineGetter__('fnscope', function(){ return this.d.parenL ? this.d.d : this.d.d.d })
p.__defineGetter__('last', function(){ var t = this; while(t._d) t = t._d; return t })
p.__defineGetter__('astParent', function(){ var t = this; while(t._d) t = t._d; return t })
p.walk = function(cb){
var n = this
var p = n
cb(n)
n = n._c
while(n != p){
cb(n)
if(n._c) n = n._c
else while(n != p){
if(n._d){ n = n._d; break }
n = n._p
}
}
}
p.scope = function(cb){
var n = this
if(n.function){
if(n.d.name) n = n.d.d.d
else n = n.d.d
}
if(!n.root && !n.braceL) return
var p = n
cb(n)
n = n._c
while(n != p){
cb(n)
if(n._c && !(n.u.u.function || n.u.u.u.function)) n = n._c
else while(n != p){
if(n._d){ n = n._d; break }
n = n._p
}
}
}
}
var tokTree
function Node(){ }
nodeProto(Node.prototype)
function finishToken(type, val) {
tokEnd = tokPos;
if (options.locations) tokEndLoc = curLineLoc();
tokType = type;
skipSpace();
tokVal = val;
tokRegexpAllowed = type.beforeExpr;
if(options.tokens){
var n
if(type == _eof) return
if(type == _regexp && tokTree._e && tokTree._e.t.binop == 10){
n = tokTree._e, tokStart -= 1
} else if(options.compact && tokTree._e && (type == _name && tokTree._e._t == _dot || type == _dot && tokTree._e._t == _name)){
n = tokTree._e
n._t = type
n.t += input.slice(tokStart, tokEnd)
} else {
var n = new Node()
var t = tokTree
if(t){
if(!t._c) t._e = t._c = n
else t._e._d = n, n._u = t._e, t._e = n
}
n._p = t
n._t = type
n.t = input.slice(tokStart, tokEnd)
}
n.y = tokCurLine;
n.x = tokStart - tokLineStart;
n.i = tokStart
while (tokLineStartNext <= tokPos) {
++tokCurLine;
tokLineStart = tokLineStartNext;
tokLineStartNext = nextLineStart();
}
if(tokEnd != tokPos) n.w = input.slice(tokEnd, tokPos)
else n.w = ''
if(type == _braceL || type == _bracketL || type == _parenL){
tokTree = n
}
else if(type == _braceR || type == _bracketR || type == _parenR){
if(options.noclose){
if(!tokTree._e._u) delete tokTree._c, delete tokTree._e
else delete tokTree._e._u._d
}
if(tokTree._p)
tokTree = tokTree._p
}
}
}
function skipBlockComment() {
if (options.onComment && options.locations)
var startLoc = curLineLoc();
var start = tokPos, end = input.indexOf("*/", tokPos += 2);
if (end === -1) raise(tokPos - 2, "Unterminated comment");
tokPos = end + 2;
if (options.onComment)
options.onComment(true, input.slice(start + 2, end), start, tokPos,
startLoc, options.locations && curLineLoc());
}
function skipLineComment() {
var start = tokPos;
if (options.onComment && options.locations)
var startLoc = curLineLoc();
var ch = input.charCodeAt(tokPos+=2);
while (tokPos < inputLen && ch !== 10 && ch !== 13 && ch !== 8232 && ch !== 8329) {
++tokPos;
ch = input.charCodeAt(tokPos);
}
if (options.onComment)
options.onComment(false, input.slice(start + 2, tokPos - 1), start, tokPos,
startLoc, options.locations && curLineLoc());
}
function skipSpace() {
var start = tokPos
while (tokPos < inputLen) {
var ch = input.charCodeAt(tokPos);
if (ch === 47) {
var next = input.charCodeAt(tokPos+1);
if (next === 42) {
skipBlockComment();
} else if (next === 47) {
skipLineComment();
} else break;
} else if (ch < 14 && ch > 8) {
++tokPos;
} else if (ch === 32 || ch === 160) {
++tokPos;
} else if (ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
++tokPos;
} else {
break;
}
}
}
function readToken_dot(code) {
var next = input.charCodeAt(tokPos+1);
if (next >= 48 && next <= 57) return readNumber(String.fromCharCode(code));
++tokPos;
return finishToken(_dot);
}
function readToken_slash() {
var next = input.charCodeAt(tokPos+1);
if (tokRegexpAllowed) {++tokPos; return readRegexp();}
if (next === 61) return finishOp(_assign, 2);
return finishOp(_slash, 1);
}
function readToken_mult_modulo() {
var next = input.charCodeAt(tokPos+1);
if (next === 61) return finishOp(_assign, 2);
return finishOp(_bin10, 1);
}
function readToken_pipe_amp(code) {
var next = input.charCodeAt(tokPos+1);
if (next === code) return finishOp(code === 124 ? _bin1 : _bin2, 2);
if (next === 61) return finishOp(_assign, 2);
return finishOp(code === 124 ? _bin3 : _bin5, 1);
}
function readToken_caret() {
var next = input.charCodeAt(tokPos+1);
if (next === 61) return finishOp(_assign, 2);
return finishOp(_bin4, 1);
}
function readToken_plus_min(code) {
var next = input.charCodeAt(tokPos+1);
if (next === code) return finishOp(_incdec, 2);
if (next === 61) return finishOp(_assign, 2);
return finishOp(_plusmin, 1);
}
function readToken_lt_gt(code) {
var next = input.charCodeAt(tokPos+1);
var size = 1;
if (next === code) {
size = code === 62 && input.charCodeAt(tokPos+2) === 62 ? 3 : 2;
if (input.charCodeAt(tokPos + size) === 61) return finishOp(_assign, size + 1);
return finishOp(_bin8, size);
}
if (next === 61)
size = input.charCodeAt(tokPos+2) === 61 ? 3 : 2;
return finishOp(_bin7, size);
}
function readToken_eq_excl(code) {
var next = input.charCodeAt(tokPos+1);
if (next === 61) return finishOp(_bin6, input.charCodeAt(tokPos+2) === 61 ? 3 : 2);
return finishOp(code === 61 ? _eq : _prefix, 1);
}
function getTokenFromCode(code) {
switch(code) {
case 46:
return readToken_dot(code);
case 40: ++tokPos; return finishToken(_parenL);
case 41: ++tokPos; return finishToken(_parenR);
case 59: ++tokPos; return finishToken(_semi);
case 44: ++tokPos; return finishToken(_comma);
case 91: ++tokPos; return finishToken(_bracketL);
case 93: ++tokPos; return finishToken(_bracketR);
case 123: ++tokPos; return finishToken(_braceL);
case 125: ++tokPos; return finishToken(_braceR);
case 58: ++tokPos; return finishToken(_colon);
case 63: ++tokPos; return finishToken(_question);
case 48:
var next = input.charCodeAt(tokPos+1);
if (next === 120 || next === 88) return readHexNumber();
case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57:
return readNumber(String.fromCharCode(code));
case 34: case 39:
return readString(code);
case 47:
return readToken_slash(code);
case 37: case 42:
return readToken_mult_modulo();
case 124: case 38:
return readToken_pipe_amp(code);
case 94:
return readToken_caret();
case 43: case 45:
return readToken_plus_min(code);
case 60: case 62:
return readToken_lt_gt(code);
case 61: case 33:
return readToken_eq_excl(code);
case 126:
return finishOp(_prefix, 1);
}
return false;
}
function readToken(forceRegexp) {
tokStart = tokPos;
if (options.locations) tokStartLoc = curLineLoc();
if (forceRegexp) return readRegexp();
if (tokPos >= inputLen) return finishToken(_eof);
var code = input.charCodeAt(tokPos);
if (isIdentifierStart(code) || code === 92 ) return readWord();
var tok = getTokenFromCode(code);
if(tok === false) {
var ch = String.fromCharCode(code);
if (ch === "\\" || nonASCIIidentifierStart.test(ch)) return readWord();
raise(tokPos, "Unexpected character '" + ch + "'");
}
return tok;
}
function finishOp(type, size) {
var str = input.slice(tokPos, tokPos + size);
tokPos += size;
finishToken(type, str);
}
function readRegexp() {
var content = "", escaped, inClass, start = tokPos;
for (;;) {
if (tokPos >= inputLen) raise(start, "Unterminated regular expression");
var ch = input.charAt(tokPos);
if (newline.test(ch)) raise(start, "Unterminated regular expression");
if (!escaped) {
if (ch === "[") inClass = true;
else if (ch === "]" && inClass) inClass = false;
else if (ch === "/" && !inClass) break;
escaped = ch === "\\";
} else escaped = false;
++tokPos;
}
var content = input.slice(start, tokPos);
++tokPos;
var mods = readWord1();
if (mods && !/^[gmsiy]*$/.test(mods)) raise(start, "Invalid regexp flag");
return finishToken(_regexp, new RegExp(content, mods));
}
function readInt(radix, len) {
var start = tokPos, total = 0;
for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
var code = input.charCodeAt(tokPos), val;
if (code >= 97) val = code - 97 + 10;
else if (code >= 65) val = code - 65 + 10;
else if (code >= 48 && code <= 57) val = code - 48;
else val = Infinity;
if (val >= radix) break;
++tokPos;
total = total * radix + val;
}
if (tokPos === start || len != null && tokPos - start !== len) return null;
return total;
}
function readHexNumber() {
tokPos += 2;
var val = readInt(16);
if (val == null) raise(tokStart + 2, "Expected hexadecimal number");
if (isIdentifierStart(input.charCodeAt(tokPos))) raise(tokPos, "Identifier directly after number");
return finishToken(_num, val);
}
function readNumber(ch) {
var start = tokPos, isFloat = ch === ".";
if (!isFloat && readInt(10) == null) raise(start, "Invalid number");
if (isFloat || input.charAt(tokPos) === ".") {
var next = input.charAt(++tokPos);
if (tokPos == start+1 && (next === "-" || next === "+")) ++tokPos;
if (readInt(10) === null && ch === ".") raise(start, "Invalid number");
isFloat = true;
}
if (/e/i.test(input.charAt(tokPos))) {
var next = input.charAt(++tokPos);
if (tokPos == start+1 && (next === "-" || next === "+")) ++tokPos;
if (readInt(10) === null) raise(start, "Invalid number")
isFloat = true;
}
if (isIdentifierStart(input.charCodeAt(tokPos))) raise(tokPos, "Identifier directly after number "+input.charAt(tokPos));
var str = input.slice(start, tokPos), val;
if (isFloat) val = parseFloat(str);
else if (ch !== "0" || str.length === 1) val = parseInt(str, 10);
else if (/[89]/.test(str) || strict) raise(start, "Invalid number");
else val = parseInt(str, 8);
return finishToken(_num, val);
}
var rs_str = [];
function readString(quote) {
tokPos++;
rs_str.length = 0;
for (;;) {
if (tokPos >= inputLen) raise(tokStart, "Unterminated string constant");
var ch = input.charCodeAt(tokPos);
if (ch === quote) {
++tokPos;
return finishToken(_string, String.fromCharCode.apply(null, rs_str));
}
if (ch === 92) {
ch = input.charCodeAt(++tokPos);
var octal = /^[0-7]+/.exec(input.slice(tokPos, tokPos + 3));
if (octal) octal = octal[0];
while (octal && parseInt(octal, 8) > 255) octal = octal.slice(0, octal.length - 1);
if (octal === "0") octal = null;
++tokPos;
if (octal) {
if (strict) raise(tokPos - 2, "Octal literal in strict mode");
rs_str.push(parseInt(octal, 8));
tokPos += octal.length - 1;
} else {
switch (ch) {
case 110: rs_str.push(10); break;
case 114: rs_str.push(13); break;
case 120: rs_str.push(readHexChar(2)); break;
case 117: rs_str.push(readHexChar(4)); break;
case 85: rs_str.push(readHexChar(8)); break;
case 116: rs_str.push(9); break;
case 98: rs_str.push(8); break;
case 118: rs_str.push(11); break;
case 102: rs_str.push(12); break;
case 48: rs_str.push(0); break;
case 13: if (input.charCodeAt(tokPos) === 10) ++tokPos;
case 10: break;
default: rs_str.push(ch); break;
}
}
} else {
if (ch === 13 || ch === 10 || ch === 8232 || ch === 8329) raise(tokStart, "Unterminated string constant");
rs_str.push(ch);
++tokPos;
}
}
}
function readHexChar(len) {
var n = readInt(16, len);
if (n === null) raise(tokStart, "Bad character escape sequence");
return n;
}
var containsEsc;
function readWord1() {
containsEsc = false;
var word, first = true, start = tokPos;
for (;;) {
var ch = input.charCodeAt(tokPos);
if (isIdentifierChar(ch)) {
if (containsEsc) word += input.charAt(tokPos);
++tokPos;
} else if (ch === 92) {
if (!containsEsc) word = input.slice(start, tokPos);
containsEsc = true;
if (input.charCodeAt(++tokPos) != 117)
raise(tokPos, "Expecting Unicode escape sequence \\uXXXX");
++tokPos;
var esc = readHexChar(4);
var escStr = String.fromCharCode(esc);
if (!escStr) raise(tokPos - 1, "Invalid Unicode escape");
if (!(first ? isIdentifierStart(esc) : isIdentifierChar(esc)))
raise(tokPos - 4, "Invalid Unicode escape");
word += escStr;
} else {
break;
}
first = false;
}
return containsEsc ? word : input.slice(start, tokPos);
}
function readWord() {
var word = readWord1();
var type = _name;
if (!containsEsc) {
if (isKeyword(word)) type = keywordTypes[word];
else if (options.forbidReserved &&
((options.ecmaVersion === 3 ? isReservedWord3 : isReservedWord5)(word) ||
strict && isStrictReservedWord(word)))
raise(tokStart, "The keyword '" + word + "' is reserved");
}
return finishToken(type, word);
}
function next() {
lastStart = tokStart;
lastEnd = tokEnd;
lastEndLoc = tokEndLoc;
readToken();
}
function setStrict(strct) {
strict = strct;
if(!options.tokens){
tokPos = lastEnd;
skipSpace();
readToken();
}
}
function node_t(s) {
this.type = null;
this.start = tokStart;
this.end = null;
}
function node_loc_t(s) {
this.start = tokStartLoc;
this.end = null;
if (sourceFile !== null) this.source = sourceFile;
}
function startNode() {
var node = new node_t();
if (options.locations)
node.loc = new node_loc_t();
if (options.ranges)
node.range = [tokStart, 0];
return node;
}
function startNodeFrom(other) {
var node = new node_t();
node.start = other.start;
if (options.locations) {
node.loc = new node_loc_t();
node.loc.start = other.loc.start;
}
if (options.ranges)
node.range = [other.range[0], 0];
return node;
}
function finishNode(node, type) {
node.type = type;
node.end = lastEnd;
if (options.locations)
node.loc.end = lastEndLoc;
if (options.ranges)
node.range[1] = lastEnd;
return node;
}
function isUseStrict(stmt) {
return options.ecmaVersion >= 5 && stmt.type === "ExpressionStatement" &&
stmt.expression.type === "Literal" && stmt.expression.value === "use strict";
}
function eat(type) {
if (tokType === type) {
next();
return true;
}
}
function canInsertSemicolon() {
return !options.strictSemicolons &&
(tokType === _eof || tokType === _braceR || newline.test(input.slice(lastEnd, tokStart)));
}
function semicolon() {
if (!eat(_semi) && !canInsertSemicolon()) unexpected();
}
function expect(type) {
if (tokType === type) next();
else unexpected();
}
function unexpected() {
raise(tokStart, "Unexpected token");
}
function checkLVal(expr) {
if (expr.type !== "Identifier" && expr.type !== "MemberExpression")
raise(expr.start, "Assigning to rvalue");
if (strict && expr.type === "Identifier" && isStrictBadIdWord(expr.name))
raise(expr.start, "Assigning to " + expr.name + " in strict mode");
}
function parseTopLevel(program) {
initTokenState();
lastStart = lastEnd = tokPos;
if (options.locations) lastEndLoc = curLineLoc();
inFunction = strict = null;
labels = [];
readToken();
var node = program || startNode(), first = true;
if (!program) node.body = [];
while (tokType !== _eof) {
var stmt = parseStatement();
node.body.push(stmt);
if (first && isUseStrict(stmt)) setStrict(true);
first = false;
}
return finishNode(node, "Program");
};
var loopLabel = {kind: "loop"}, switchLabel = {kind: "switch"};
function parseStatement() {
if (tokType === _slash)
readToken(true);
var starttype = tokType, node = startNode();
switch (starttype) {
case _break: case _continue:
next();
var isBreak = starttype === _break;
if (eat(_semi) || canInsertSemicolon()) node.label = null;
else if (tokType !== _name) unexpected();
else {
node.label = parseIdent();
semicolon();
}
for (var i = 0; i < labels.length; ++i) {
var lab = labels[i];
if (node.label == null || lab.name === node.label.name) {
if (lab.kind != null && (isBreak || lab.kind === "loop")) break;
if (node.label && isBreak) break;
}
}
if (i === labels.length) raise(node.start, "Unsyntactic " + starttype.keyword);
return finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement");
case _debugger:
next();
semicolon();
return finishNode(node, "DebuggerStatement");
case _do:
next();
labels.push(loopLabel);
node.body = parseStatement();
labels.pop();
expect(_while);
node.test = parseParenExpression();
semicolon();
return finishNode(node, "DoWhileStatement");
case _for:
next();
labels.push(loopLabel);
expect(_parenL);
if (tokType === _semi) return parseFor(node, null);
if (tokType === _var) {
var init = startNode();
next();
parseVar(init, true);
if (init.declarations.length === 1 && eat(_in))
return parseForIn(node, init);
return parseFor(node, init);
}
var init = parseExpression(false, true);
if (eat(_in)) {checkLVal(init); return parseForIn(node, init);}
return parseFor(node, init);
case _function:
next();
return parseFunction(node, true);
case _if:
next();
node.test = parseParenExpression();
node.consequent = parseStatement();
node.alternate = eat(_else) ? parseStatement() : null;
return finishNode(node, "IfStatement");
case _return:
next();
if (eat(_semi) || canInsertSemicolon()) node.argument = null;
else { node.argument = parseExpression(); semicolon(); }
return finishNode(node, "ReturnStatement");
case _switch:
next();
node.discriminant = parseParenExpression();
node.cases = [];
expect(_braceL);
labels.push(switchLabel);
for (var cur, sawDefault; tokType != _braceR;) {
if (tokType === _case || tokType === _default) {
var isCase = tokType === _case;
if (cur) finishNode(cur, "SwitchCase");
node.cases.push(cur = startNode());
cur.consequent = [];
next();
if (isCase) cur.test = parseExpression();
else {
if (sawDefault) raise(lastStart, "Multiple default clauses"); sawDefault = true;
cur.test = null;
}
cur.colon = tokPos
expect(_colon);
} else {
if (!cur) unexpected();
cur.consequent.push(parseStatement());
}
}
if (cur) finishNode(cur, "SwitchCase");
next();
labels.pop();
return finishNode(node, "SwitchStatement");
case _throw:
next();
if (newline.test(input.slice(lastEnd, tokStart)))
raise(lastEnd, "Illegal newline after throw");
node.argument = parseExpression();
semicolon();
return finishNode(node, "ThrowStatement");
case _try:
next();
node.block = parseBlock();
node.handlers = [];
while (tokType === _catch) {
var clause = startNode();
next();
expect(_parenL);
clause.param = parseIdent();
if (strict && isStrictBadIdWord(clause.param.name))
raise(clause.param.start, "Binding " + clause.param.name + " in strict mode");
expect(_parenR);
clause.guard = null;
clause.body = parseBlock();
node.handlers.push(finishNode(clause, "CatchClause"));
}
node.finalizer = eat(_finally) ? parseBlock() : null;
if (!node.handlers.length && !node.finalizer)
raise(node.start, "Missing catch or finally clause");
return finishNode(node, "TryStatement");
case _var:
next();
node = parseVar(node);
semicolon();
return node;
case _const:
next();
node = parseVar(node, false, "const")
semicolon();
return node;
case _while:
next();
node.test = parseParenExpression();
labels.push(loopLabel);
node.body = parseStatement();
labels.pop();
return finishNode(node, "WhileStatement");
case _with:
if (strict) raise(tokStart, "'with' in strict mode");
next();
node.object = parseParenExpression();
node.body = parseStatement();
return finishNode(node, "WithStatement");
case _braceL:
return parseBlock();
case _semi:
next();
return finishNode(node, "EmptyStatement");
default:
var maybeName = tokVal, expr = parseExpression();
if (starttype === _name && expr.type === "Identifier" && eat(_colon)) {
for (var i = 0; i < labels.length; ++i)
if (labels[i].name === maybeName) raise(expr.start, "Label '" + maybeName + "' is already declared");
var kind = tokType.isLoop ? "loop" : tokType === _switch ? "switch" : null;
labels.push({name: maybeName, kind: kind});
node.body = parseStatement();
labels.pop();
node.label = expr;
return finishNode(node, "LabeledStatement");
} else {
node.expression = expr;
semicolon();
return finishNode(node, "ExpressionStatement");
}
}
}
function parseParenExpression() {
expect(_parenL);
var val = parseExpression();
expect(_parenR);
return val;
}
function parseBlock(allowStrict) {
var node = startNode(), first = true, strict = false, oldStrict;
node.body = [];
expect(_braceL);
while (!eat(_braceR)) {
var stmt = parseStatement();
node.body.push(stmt);
if (first && isUseStrict(stmt)) {
oldStrict = strict;
setStrict(strict = true);
}
first = false
}
if (strict && !oldStrict) setStrict(false);
return finishNode(node, "BlockStatement");
}
function parseFor(node, init) {
node.init = init;
expect(_semi);
node.test = tokType === _semi ? null : parseExpression();
expect(_semi);
node.update = tokType === _parenR ? null : parseExpression();
expect(_parenR);
node.body = parseStatement();
labels.pop();
return finishNode(node, "ForStatement");
}
function parseForIn(node, init) {
node.left = init;
node.right = parseExpression();
expect(_parenR);
node.body = parseStatement();
labels.pop();
return finishNode(node, "ForInStatement");
}
function parseVar(node, noIn, kind) {
node.declarations = [];
node.kind = kind || "var";
for (;;) {
var decl = startNode();
decl.id = parseIdent();
if (strict && isStrictBadIdWord(decl.id.name))
raise(decl.id.start, "Binding " + decl.id.name + " in strict mode");
decl.init = eat(_eq) ? parseExpression(true, noIn) : null;
node.declarations.push(finishNode(decl, "VariableDeclarator"));
if (!eat(_comma)) break;
}
return finishNode(node, "VariableDeclaration");
}
function parseExpression(noComma, noIn) {
var expr = parseMaybeAssign(noIn);
if (!noComma && tokType === _comma) {
var node = startNodeFrom(expr);
node.expressions = [expr];
while (eat(_comma)) node.expressions.push(parseMaybeAssign(noIn));
return finishNode(node, "SequenceExpression");
}
return expr;
}
function parseMaybeAssign(noIn) {
var left = parseMaybeConditional(noIn);
if (tokType.isAssign) {
var node = startNodeFrom(left);
node.operator = tokVal;
node.left = left;
next();
node.right = parseMaybeAssign(noIn);
checkLVal(left);
return finishNode(node, "AssignmentExpression");
}
return left;
}
function parseMaybeConditional(noIn) {
var expr = parseExprOps(noIn);
if (eat(_question)) {
var node = startNodeFrom(expr);
node.test = expr;
node.consequent = parseExpression(true);
expect(_colon);
node.alternate = parseExpression(true, noIn);
return finishNode(node, "ConditionalExpression");
}
return expr;
}
function parseExprOps(noIn) {
return parseExprOp(parseMaybeUnary(noIn), -1, noIn);
}
function parseExprOp(left, minPrec, noIn) {
var prec = tokType.binop;
if (prec != null && (!noIn || tokType !== _in)) {
if (prec > minPrec) {
var node = startNodeFrom(left);
node.left = left;
node.operator = tokVal;
next();
node.right = parseExprOp(parseMaybeUnary(noIn), prec, noIn);
var node = finishNode(node, /&&|\|\|/.test(node.operator) ? "LogicalExpression" : "BinaryExpression");
return parseExprOp(node, minPrec, noIn);
}
}
return left;
}
function parseMaybeUnary(noIn) {
if (tokType.prefix) {
var node = startNode(), update = tokType.isUpdate;
node.operator = tokVal;
node.prefix = true;
next();
node.argument = parseMaybeUnary(noIn);
if (update) checkLVal(node.argument);
else if (strict && node.operator === "delete" &&
node.argument.type === "Identifier")
raise(node.start, "Deleting local variable in strict mode");
return finishNode(node, update ? "UpdateExpression" : "UnaryExpression");
}
var expr = parseExprSubscripts();
while (tokType.postfix && !canInsertSemicolon()) {
var node = startNodeFrom(expr);
node.operator = tokVal;
node.prefix = false;
node.argument = expr;
checkLVal(expr);
next();
expr = finishNode(node, "UpdateExpression");
}
return expr;
}
function parseExprSubscripts() {
return parseSubscripts(parseExprAtom());
}
function parseSubscripts(base, noCalls) {
if (eat(_dot)) {
var node = startNodeFrom(base);
node.object = base;
node.property = parseIdent(true);
node.computed = false;
return parseSubscripts(finishNode(node, "MemberExpression"), noCalls);
} else if (eat(_bracketL)) {
var node = startNodeFrom(base);
node.object = base;
node.property = parseExpression();
node.computed = true;
expect(_bracketR);
return parseSubscripts(finishNode(node, "MemberExpression"), noCalls);
} else if (!noCalls && eat(_parenL)) {
var node = startNodeFrom(base);
node.callee = base;
node.arguments = parseExprList(_parenR, false);
return parseSubscripts(finishNode(node, "CallExpression"), noCalls);
} else return base;
}
function parseExprAtom() {
switch (tokType) {
case _this:
var node = startNode();
next();
return finishNode(node, "ThisExpression");
case _name:
return parseIdent();
case _num: case _string: case _regexp:
var node = startNode();
node.value = tokVal;
node.raw = input.slice(tokStart, tokEnd);
next();
return finishNode(node, "Literal");
case _null: case _true: case _false:
var node = startNode();
node.value = tokType.atomValue;
node.raw = tokType.keyword
next();
return finishNode(node, "Literal");
case _parenL:
var tokStartLoc1 = tokStartLoc, tokStart1 = tokStart;
next();
var val = parseExpression();
val.start = tokStart1;
val.end = tokEnd;
if (options.locations) {
val.loc.start = tokStartLoc1;
val.loc.end = tokEndLoc;
}
if (options.ranges)
val.range = [tokStart1, tokEnd];
expect(_parenR);
return val;
case _bracketL:
var node = startNode();
next();
node.elements = parseExprList(_bracketR, true, true);
return finishNode(node, "ArrayExpression");
case _braceL:
return parseObj();
case _function:
var node = startNode();
next();
return parseFunction(node, false);
case _new:
return parseNew();
default:
unexpected();
}
}
function parseNew() {
var node = startNode();
next();
node.callee = parseSubscripts(parseExprAtom(false), true);
if (eat(_parenL)) node.arguments = parseExprList(_parenR, false);
else node.arguments = [];
return finishNode(node, "NewExpression");
}
function parseObj() {
var node = startNode(), first = true, sawGetSet = false;
node.properties = [];
next();
while (!eat(_braceR)) {
if (!first) {
expect(_comma);
if (options.allowTrailingCommas && eat(_braceR)) break;
} else first = false;
var prop = {key: parsePropertyName()}, isGetSet = false, kind;
if (eat(_colon)) {
prop.value = parseExpression(true);
kind = prop.kind = "init";
} else if (options.ecmaVersion >= 5 && prop.key.type === "Identifier" &&
(prop.key.name === "get" || prop.key.name === "set")) {
isGetSet = sawGetSet = true;
kind = prop.kind = prop.key.name;
prop.key = parsePropertyName();
if (!tokType === _parenL) unexpected();
prop.value = parseFunction(startNode(), false);
} else unexpected();
if (prop.key.type === "Identifier" && (strict || sawGetSet)) {
for (var i = 0; i < node.properties.length; ++i) {
var other = node.properties[i];
if (other.key.name === prop.key.name) {
var conflict = kind == other.kind || isGetSet && other.kind === "init" ||
kind === "init" && (other.kind === "get" || other.kind === "set");
if (conflict && !strict && kind === "init" && other.kind === "init") conflict = false;
if (conflict) raise(prop.key.start, "Redefinition of property");
}
}
}
node.properties.push(prop);
}
return finishNode(node, "ObjectExpression");
}
function parsePropertyName() {
if (tokType === _num || tokType === _string) return parseExprAtom();
return parseIdent(true);
}
function parseFunction(node, isStatement) {
if (tokType === _name) node.id = parseIdent();
else node.id = null;
node.params = [];
var first = true;
expect(_parenL);
while (!eat(_parenR)) {
if (!first) expect(_comma); else first = false;
node.params.push(parseIdent());
}
var oldInFunc = inFunction, oldLabels = labels;
inFunction = true; labels = [];
node.body = parseBlock(true);
inFunction = oldInFunc; labels = oldLabels;
if (strict || node.body.body.length && isUseStrict(node.body.body[0])) {
for (var i = node.id ? -1 : 0; i < node.params.length; ++i) {
var id = i < 0 ? node.id : node.params[i];
if (isStrictReservedWord(id.name) || isStrictBadIdWord(id.name))
raise(id.start, "Defining '" + id.name + "' in strict mode");
if (i >= 0) for (var j = 0; j < i; ++j) if (id.name === node.params[j].name)
raise(id.start, "Argument name clash in strict mode");
}
}
return finishNode(node, isStatement ? "FunctionDeclaration" : "FunctionExpression");
}
function parseExprList(close, allowTrailingComma, allowEmpty) {
var elts = [], first = true;
while (!eat(close)) {
if (!first) {
expect(_comma);
if (allowTrailingComma && options.allowTrailingCommas && eat(close)) break;
} else first = false;
if (allowEmpty && tokType === _comma) elts.push(null);
else elts.push(parseExpression(true));
}
return elts;
}
function parseIdent(liberal) {
var node = startNode();
node.name = tokType === _name ? tokVal : (liberal && !options.forbidReserved && tokType.keyword) || unexpected();
next();
return finishNode(node, "Identifier");
}
})

// | Browser <> Node.JS communication channels |__/
// |
// |  (C) Code.GL 2013
// \____________________________________________/

define('/core/io_channel',function(require, exports, module){

	function parse(d){ // data
		try{ 
			return JSON.parse(d) 
		}
		catch (e){ 
			return
		}
	}

	if(typeof process !== "undefined"){

		var cr = require('crypto')
		// | Node.JS Path
		// \____________________________________________/
		module.exports = function(url){
			var ch = {}

			var pr // poll request
			var pt // poll timer
			var nc /*no cache header*/ = {"Content-Type": "text/plain","Cache-Control":"no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"}
			var sd = []// send data
			var ws // websocket
			var wk // websocket keepalive
			var st // send timeout

			function wsClose(){
				if(ws) ws.destroy(), ws = 0
				if(wk) clearInterval(wk), wk = 0
			}

			function endPoll(c, d){ // end poll http status code, data
				if(!pr) return
				pr.writeHead(c, nc)
				pr.end(d)
				pr = null
			}

			ch.handler = function(req, res){
				if(req.url != url) return
				if(req.method == 'GET'){ // Long poll
					endPoll(304)
					if(pt) clearInterval(pt), pt = 0
					pt = setInterval(function(){endPoll(304)}, 30000)
					pr = res
					if(sd.length) endPoll(200, '['+sd.join(',')+']'), sd.length = 0 // we have pending data
					return 1
				}

				if(req.method == 'PUT'){ // RPC call
					var d = ''
					req.on('data', function(i){ d += i.toString() })
					req.on('end', function(){
						if(!ch.rpc) return res.end()
						d = parse(d)
						if(!d) return res.end()
						ch.rpc(d, function(r){
							res.writeHead(200, nc)
							res.end(JSON.stringify(r))
						})
					})
					return 1
				}

				if(req.method == 'POST'){ // Message  
					var d = ''
					req.on('data', function(i){ d += i.toString() })
					req.on('end', function(){
						res.writeHead(204, nc)
						res.end()
						d = parse(d)
						if(ch.data && d && d.length) for(var i = 0;i<d.length;i++) ch.data(d[i])
					})
					return 1
				}
			}

			ch.upgrade = function(req, sock, head){
				if(req.headers['sec-websocket-version'] != 13) return sock.destroy()
				wsClose()
				ws = sock

			   // calc key
				var k = req.headers['sec-websocket-key']
				var sha1 = cr.createHash('sha1');
				sha1.update(k + "258EAFA5-E914-47DA-95CA-C5AB0DC85B11");
				var v = 'HTTP/1.1 101 Switching Protocols\r\n'+
					'Upgrade: websocket\r\n'+
					'Connection: Upgrade\r\n'+
					'Sec-WebSocket-Accept: ' + sha1.digest('base64') +'\r\n'+
					'Sec-WebSocket-Protocol: ws\r\n\r\n'
				ws.write(v)

				var max = 100000000
				var h = new Buffer(14) // header
				var o = new Buffer(10000) // output
				var s = opcode // state
				var e = 1// expected
				var w = 0// written
				var r // read
				var i // input

				var m // mask offset
				var c // mask counter
				var l // payload len

				function err(t){
					console.log('websock '+t)
					wsClose()
				}

				function head(){
					var se = e
					while(e > 0 && r < i.length && w < h.length) h[w++] = i[r++], e--
					if(w > h.length) return err("unexpected data in header"+ se + s.toString())
					return e != 0
				}

				function data(){
					while(e > 0 && r < i.length) o[w++] = i[r++] ^ h[m + (c++&3)], e--
					if(e) return 
					var d = parse(o.toString('utf8', 0, w))
					if(ch.data && d && d.length) {
						for(var j = 0;j<d.length;j++) ch.data(d[j])
					}
					return e = 1, w = 0, s = opcode
				}

				function mask(){
					if(head()) return
					if(!l) return e = 1, w = 0, s = opcode
					m = w - 4
					w = c = 0
					e = l
					if(l > max) return err("buffer size request too large "+l+" > "+max)
					if(l > o.length) o = new Buffer(l)
					return s = data
				}

				function len8(){
					if(head()) return
					return l = h.readUInt32BE(w - 4), e = 4, s = mask
				}

				function len2(){
					if(head()) return 
					return l = h.readUInt16BE(w - 2), e = 4, s = mask
				}

				function len1(){
					if(head()) return
					if(!(h[w  - 1] & 128)) return err("only masked data")
					var t = h[w - 1] & 127
					if(t < 126) return l = t, e = 4, s = mask
					if(t == 126) return e = 2, s = len2
					if(t == 127) return e = 8, s = len8
				}

				function pong(){
					if(head()) return
					if(h[w-1] & 128) return e = 4, l = 0, s = mask 
					return e = 1, w = 0, s = opcode
				}

				function opcode(){
					if(head()) return
					var f = h[0] & 128
					var t = h[0] & 15
					if(t == 1){
						if(!f) return err("only final frames supported")
						return e = 1, s = len1
					}
					if(t == 8) return wsClose()
					if(t == 10) return e = 1, s = pong
					return err("opcode not supported " + t)
				}

				ws.on('data', function(d){
					i = d
					r = 0
					while(s());
				})

				var cw = ws
				ws.on('close', function(){
					if(cw == ws) wsClose()
					o = null
				})

				// 10 second ping frames
				var pf = new Buffer(2)
				pf[0] = 9 | 128
				pf[1] = 0
				wk = setInterval(function(){
					ws.write(pf)
				}, 10000)
			}

			function wsWrite(d){
				var h
				var b = new Buffer(d)
				if(b.length < 126){
					h = new Buffer(2)
					h[1] = b.length
				} else if (b.length<=65535){
					h = new Buffer(4)
					h[1] = 126
					h.writeUInt16BE(b.length, 2)
				} else {
					h = new Buffer(10)
					h[1] = 127
					h[2] = h[3] = h[4] =	h[5] = 0
					h.writeUInt32BE(b.length, 6)
				}
				h[0] = 128 | 1
				ws.write(h)
				ws.write(b)
			}

			ch.send = function(m){
				sd.push(JSON.stringify(m))
				if(!st) st = setTimeout(function(){
					st = 0
					if(ws) wsWrite('['+sd.join(',')+']'), sd.length = 0
					else
					if(pr) endPoll(200, '['+sd.join(',')+']'), sd.length = 0
				}, 0)
			}

			return ch
		}

		return
	}
	// | Browser Path
	// \____________________________________________/

	module.exports = 
	//CHANNEL
	function(url){
		var ch = {}

		var sd = [] // send data
		var ws // websocket
		var wt // websocket sendtimeout
		var wr = 0 //websocket retry
		var sx // send xhr
		var tm;

		function xsend(d){
			var d = '[' + sd.join(',') +']'
			sd.length = 0
			sx = new XMLHttpRequest()
			sx.onreadystatechange = function(){
				if(sx.readyState != 4) return
				sx = 0
				if(sd.length > 0) xsend()
			}
			sx.open('POST', url)
			sx.send(d)
		};

		function wsFlush(){
			if(ws === 1) {
				if(!wt){
					wt = setTimeout(function(){
						wt = 0
						wsFlush()
					},50)
				}
				return
			}
			if(sd.length){
				ws.send('[' + sd.join(',') + ']'), sd.length = 0
			}
		}

		//| send json message via xhr or websocket
		ch.send = function(m){
			sd.push(JSON.stringify(m))
			if(ws){
				if(sd.length>10000) wsFlush()
				if(!wt) wt = setTimeout(function(){
					wt = 0
					wsFlush()
				},0)
			} else {
				if(!sx) return xsend()
			}
		}

		function poll(){
			var x = new XMLHttpRequest()
			x.onreadystatechange = function(){
				if(x.readyState != 4) return
				if(x.status == 200 || x.status == 304) poll()
				else setTimeout(poll, 500)
				try{ var d = JSON.parse(x.responseText) }catch(e){}
				if(d && ch.data && d.length) for(var i = 0;i<d.length;i++) ch.data(d[i])
			}
			x.open('GET', url)
			x.send()
		}

		ch.rpc = function(m, cb){ // rpc request
			var x = new XMLHttpRequest()
			x.onreadystatechange = function(){
				if(x.readyState != 4) return
				var d
				if(x.status == 200 ) try{d = JSON.parse(x.responseText) }catch(e){}
				if(cb) cb(d)
			}
			x.open('PUT', url)
			x.send(JSON.stringify(m))
			return x
		}

		function websock(){
			var u = 'ws://'+window.location.hostname +':'+window.location.port+''+url
			var w = new WebSocket(u, "ws")
			ws = 1
			w.onopen = function(){
				ws = w
			}
			w.onerror = w.onclose = function(e){
				if(ws == w){ // we had a connection, retry
					console.log("Websocket closed, retrying", e)
					ws = 0
					websock()
				} else {
					console.log("Falling back to polling", e)
					ws = 0, poll()
				}
			}
			w.onmessage = function(e){
				var d = parse(e.data)
				if(d && ch.data) for(var i = 0;i<d.length;i++) ch.data(d[i])
			}
		}
		
		if(typeof no_websockets !== "undefined" || typeof WebSocket === "undefined") poll()
		else websock()
		//poll()
		return ch
	}
	//CHANNEL
})
define('/trace/instrument',function(require){
	var fn = require("../core/fn")
	var ac = require("../core/acorn")
	var io_channel = require("../core/io_channel")
	var dt = fn.dt()

	var gs = "_$_"

	function tracehub(){
		//TRACE
		try{ _$_ } catch(e){ 
			_$_ = {};
			(function(){
				var isNode = typeof process != 'undefined'
				var isBrowser = typeof window != 'undefined'
				var isWorker = !isNode && !isBrowser

				if(isNode) global._$_ = _$_

				var max_depth = 1
				var max_count = 5
				function dump(i, d){
					var t = typeof i
					if(t == 'string'){

						if(i.length>100) return i.slice(0,100)+"..."
						return i
					}
					if(t == 'boolean') return i
					if(t == 'number') {
						if( i === Infinity) return "_$_Infinity"
						if( i == NaN ) return "_$_NaN"
						return i
					}
					if(t == 'function') return "_$_function"
					if(t == 'undefined') return "_$_undefined"
					if(t == 'object'){
						if(i === null) return null
						if(Array.isArray(i)){
							if(i.length == 0) return []
							if(d>=max_depth) return "_$_[..]"
							var o = []
							for(var k = 0;k<i.length && k<max_count;k++){
								var m = i[k]
								o[k] = dump(m, d+1)
							}
							if(k<i.length){
								o[k] = "..."
							}
							return o
						}
						if(d>=max_depth) return "_$_{..}"
						var o = {}
						var c = 0 
						try{ 
						var pd 
						for(var k in i) if(pd = Object.getOwnPropertyDescriptor(i, k)){
							if(c++>max_count){
								o["..."] = 1
								break
							}
							if(pd.value !== undefined) o[k] = dump(pd.value, d+1)
						}
						} catch(e){}
						return o
					}
				}

				//RELOADER
				//var no_websockets = 1
				var channel = //CHANNEL
				0;
				if (isBrowser) {
					_$_.ch = channel('/io_X_X');
					//_$_.ch = {send : function(){}}
					window.onerror = function(error, url, linenr){}					
				} else if (isWorker){
					_$_.ch = {send : function(){}}
				} else if(isNode){
					_$_.ch = {send : function(m){
						try{
							if(process.send)process.send(m);else process.stderr.write('\x1f' + JSON.stringify(m) + '\x17')
						} catch(e){
							console.log(e, m)
						}
					}}
				}
				var lgc = 0
				var dp = 0 // depth
				var di = 0
				var gc = 1
				
				var lr = 0 // last return
				// function call entry
				_$_.f = function(i, a, t, u){
					if(lr) _$_.ch.send(lr, 1), lr = 0
					// dump arguments
					dp ++
					if(!di) di = setTimeout(function(){di = dp = 0},0)
					var r = {i:i, g:gc++, d:dp, u:u, t:Date.now()}
					if(a){
						r.a = []
						for(var j = 0;j<a.length;j++) r.a[j] = dump(a[j], 0)
					} else r.a = null
					_$_.ch.send(r)
					return r.g
				}
				
				// callsite annotation for last return
				_$_.c = function(i, v){
					if(!lr) return v
					lr.c = i
					_$_.ch.send(lr)
					lr = 0
					return v
				}
				// function exit
				_$_.e = function(i, r, v, x){
					if(lr) _$_.ch.send(lr, 1), lr = 0
					for(var k in r){
						var j = r[k]
						if(j !== null){
							var t = typeof j
							if(t =='undefined' | t=='function')	r[k] = '_$_' + t
							else if(t=='object' ) r[k] = dump(j, 0)
							else if(t == 'number'){
								if(j === Infinity) r[k] = '_$_Infinity'
								if(j === NaN) r[k] = '_$_NaN'
							}
						}
					}
					r.g = gc++
					r.i = i
					r.d = dp
					if(arguments.length>2) r.v = dump(v, 0), r.x = x
					lr = r
					if(dp>0)dp --
					return v
				}

			})()		
		}
		//TRACE
	}
				/*
				_$_.set = function(s, v){
					_$_[s] = {}
					function sv(i){
						_$_[s].__defineSetter__(i - s, function(v){
							var r = _$_.b
							for(var k in r){
								var j = r[k]
								if(j !== null){
									t = typeof j
									if(t =='undefined' || t=='object' || t=='function')	r[k] = '_$_' + t
								}
							}
							r.g = gc++
							r.i = i
							r.d = dp
							r.v = dump(v, 0)
							_$_.ch.send(r)
							if(dp>0)dp --
						})
					}
					for(var i = 0;i<v.length;i++) sv(v[i])
				}
			*/	
	var head = (function(){
	
		// imperfect newline stripper
		function strip(i){
			var t = ac.parse(i, {tokens:1})
			var o = ''
			t.tokens.walk(function(n){ 
				o+= n.t
				if(n.w.indexOf('\n')!=-1 && !n._c) o += ';'
				else if(n.w.indexOf(' ')!=-1) o+= ' '
			})
			return o
		}

		// trace impl
		var trc = tracehub.toString().match(/\/\/TRACE[\s\S]*\/\/TRACE/)[0]
		// reloader
		var rld = define.outer.toString().match(/\/\/RELOADER[\s\S]*\/\/RELOADER/)[0]
		// fetch io channel
		for(var k in define.factory) if(k.indexOf('core/io_channel') != -1)break
		var chn = define.factory[k].toString().match(/\/\/CHANNEL\n([\s\S]*)\/\/CHANNEL/)[1]

		return strip(trc.replace('//RELOADER', rld).replace('//CHANNEL', chn)+"\n")
	})();

	function instrument(file, src, iid, dump){

		src = src.replace(/\t/g,"   ")
		try {
			var n = ac.parse(src,{locations:1})
		} catch(e){
			fn('Parse error '+file+' '+e)
		}

		if(dump) fn(ac.dump(n))
		// verify parse
		var dict = {}
		var id = iid
		var assignId = []

		var cuts = fn.list('_u','_d')
		function cut(i, v){
			var n = {i:i, v:v}
			cuts.sorted(n, 'i') 
			return n
		}
		
		function instrumentFn(n, name, isRoot, parentId){

			var fnid  = id
			if(!isRoot){
				var fhead = cut(n.body.start + 1, '')
				var args = []
				for(var i = 0;i<n.params.length;i++){
					var p = n.params[i]
					args[i] = {
						n:ac.stringify(p),
						x:p.loc.start.column,
						y:p.loc.start.line,
						ex:p.loc.end.column,
						ey:p.loc.end.line
					}
				}
				
				dict[id++] = {x:n.body.loc.start.column, y:n.body.loc.start.line, 
					ex:n.body.loc.end.column,
					ey:n.body.loc.end.line,
					sx:n.loc.start.column,
					sy:n.loc.start.line,
					n:name, 
					a:args
				}
			} else {
				var fhead = cut(n.start, '')
				dict[id++] = {x:n.loc.start.column, y:n.loc.start.line, 
					ex:n.loc.end.column,
					ey:n.loc.end.line,
					n:name, 
					a:[],
					root:1
				}
			}

			var loopIds = []

			function addLoop(b, s, e){
				if(!b || !('type' in b)) return

				var x, o
				if(b.type == 'BlockStatement') x = gs + 'b.l'+id+'++;', o = 1
				else if (b.type == 'ExpressionStatement') x = gs + 'b.l'+id+'++,', o = 0
				else if (b.type == 'EmptyStatement') x = gs + 'b.l'+id+'++', o = 0
				if(x){
					cut(b.start + o, x)
					loopIds.push(id)
					dict[id++] = {x:s.column, y:s.line, ex:e.column, ey:e.line}
				}
			}

			function logicalExpression(n){
				var hasLogic = 0
				// if we have logical expressions we only mark the if 
				ac.walkDown(n, {
					LogicalExpression:function(n, p){
						// insert ( ) around logical left and right
						hasLogic = 1
						if(n.left.type != 'LogicalExpression'){
							cut(n.left.start, '('+gs+'b.b'+id+'=')
							cut(n.left.end, ')')
							dict[id++] = {x:n.left.loc.start.column, y:n.left.loc.start.line, ex:n.left.loc.end.column, ey:n.left.loc.end.line}
						}
						if(n.right.type != 'LogicalExpression'){
							cut(n.right.start, '('+gs+'b.b'+id+'=')
							cut(n.right.end, ')')
							dict[id++] = {x:n.right.loc.start.column, y:n.right.loc.start.line, ex:n.right.loc.end.column, ey:n.right.loc.end.line}
						}
					},
					FunctionExpression:  function(){return 1},
					FunctionDeclaration: function(){return 1}
				})
				return hasLogic
			}

			ac.walkDown(isRoot?n:n.body,{
				FunctionExpression:function(n, p){
					//return 1
					var name = 'function()'
					ac.walkUp(p,{
						VariableDeclarator:  function(n, p){ return name = ac.stringify(n.id) },
						AssignmentExpression:function(n, p){ return name = ac.stringify(n.left) },
						ObjectExpression:    function(n, p){ return name = ac.stringify(p.key) },
						CallExpression:      function(n, p){ 
							var id = '' // use deepest id as name
							ac.walkDown(n.callee, {Identifier: function(n){id = n.name}})
							if(id == 'bind') return
							return name = (n.callee.type == 'FunctionExpression'?'()':id) + '->' 
						}
					})
					instrumentFn(n, name, false, fnid)
					return 1
				},
				FunctionDeclaration:function(n, p){
					//return 1
					instrumentFn(n, ac.stringify(n.id), false, fnid)
					return 1
				},
				ForInStatement: function(n, p){ addLoop(n.body, n.loc.start, n.body.loc.start ) },
				ForStatement: function(n, p){ addLoop(n.body, n.loc.start, n.body.loc.start) },
				WhileStatement: function(n, p){ addLoop(n.body, n.loc.start, n.body.loc.start) },
				DoWhileStatement : function(n, p){ addLoop(n.body, n.loc.start, n.body.loc.start) },
				IfStatement: function(n, p){
					var b = n.test
					cut(b.start, gs+'b.b'+id+'=')
					var m = dict[id++] = {x:n.loc.start.column, y:n.loc.start.line, 
						ex:n.test.loc.end.column + 1, ey:n.test.loc.end.line}
					// lets go and split apart all boolean expressions in our test
					if(logicalExpression(n.test)){
						m.ex = m.x + 2
						m.ey = m.y
					}
					//addBlock(n.consequent)
					//addBlock(n.alternate)
				},
				ConditionalExpression : function(n, p){
					var b = n.test
					if(!logicalExpression(n.test)){
						cut(b.start, '('+gs+'b.b'+id+'=')
						cut(b.end, ')')
						dict[id++] = {x:b.loc.start.column, y:b.loc.start.line, 
							ex:b.loc.end.column + 1, ey:b.loc.end.line}
					}
				},				
				SwitchCase : function(n, p){ 
					var b = n.test
					if(b){
						cut(n.colon, gs+'b.b'+id+'=1;')
						dict[id++] = {x:n.loc.start.column, y:n.loc.start.line, ex:b.loc.end.column, ey:b.loc.end.line}
					}
				},
				VariableDeclarator  : function(n, p){
					if(n.init && n.init.type != 'Literal' && n.init.type != 'FunctionExpression' && n.init.type != 'ObjectExpression')
						addAssign(n.id.loc, n.init.start)
				},
				ObjectExpression : function(n, p){
					for(var i = 0;i<n.properties.length;i++){
						var k = n.properties[i].key
						var v = n.properties[i].value
						if(v && v.type != 'Literal' && v.type != 'FunctionExpression' && v.type != 'ObjectExpression'){
							addAssign(k.loc, v.start)
						}
					}
				},
				AssignmentExpression : function(n, p){
					if(/*n.operator == '='*/n.right.type != 'Literal' && n.right.type != 'FunctionExpression' && n.right.type != 'ObjectExpression')
						addAssign(n.left.loc, n.right.start)
				},
				CallExpression: function(n, p){
					// only if we are the first of a SequenceExpression
					if(p.node.type == 'SequenceExpression' && p.node.expressions[0] == n) p = p.up
					if(p.node.type == 'ExpressionStatement' &&
						(p.up.node.type == 'BlockStatement' || p.up.node.type == 'Program')){
						cut(n.start, ';('+gs+'.c('+id+',')					
					}else cut(n.start, '('+gs+'.c('+id+',')
					cut(n.end - 1, "))")
					var a = []
					for(var i = 0;i<n.arguments.length;i++){
						var arg = n.arguments[i]
						if(arg)
							a.push({x:arg.loc.start.column, y:arg.loc.start.line,ex:arg.loc.end.column, ey:arg.loc.end.line})
						else a.push(null)
					}

					var ce = 0
					if(n.callee.type == 'MemberExpression'){
						if(n.callee.property.name == 'call') ce = 1
						if(n.callee.property.name == 'apply') ce = 2
					}
					dict[id++] = {x:n.callee.loc.start.column, y:n.callee.loc.start.line, ex:n.callee.loc.end.column, ey:n.callee.loc.end.line, a:a, ce:ce}
				},
				NewExpression: function(n, p){
					if(p.node.type == 'SequenceExpression' && p.node.expressions[0] == n) p = p.up
					if(p.node.type == 'ExpressionStatement' &&
						(p.up.node.type == 'BlockStatement'  || p.up.node.type == 'Program')){
						cut(n.start, ';('+gs+'.c('+id+',')					
					}else cut(n.start, '('+gs+'.c('+id+',')
					cut(n.end, "))")
					var a = []
					for(var i = 0;i<n.arguments.length;i++){
						var arg = n.arguments[i]
						if(arg)
							a.push({x:arg.loc.start.column, y:arg.loc.start.line,ex:arg.loc.end.column, ey:arg.loc.end.line})
						else a.push(null)
					}
					dict[id++] = {isnew:1,x:n.callee.loc.start.column, y:n.callee.loc.start.line, ex:n.callee.loc.end.column, ey:n.callee.loc.end.line, a:a}
				},
				ReturnStatement:     function(n, p){
					if(n.argument){
						//assignId.push(id)
						//cut(n.start+6, " "+gs+".b="+gs+"b,"+gs + "["+iid+"][" + (id-iid) + "]=")
						cut(n.argument.start, "("+gs+".e("+id+","+gs+"b,(")
						cut(n.argument.end, ")))")
					} else {
						cut(n.start+6, " "+gs + ".e(" + id + ", "+gs+"b)")
					}
					dict[id++] = {x:n.loc.start.column, y:n.loc.start.line, ret:fnid, r:1}
					// return object injection
				},
				CatchClause: function(n, p){
					// catch clauses need to send out a depth-reset message
					//cut(n.body.start + 1, gs + '.x('+gs+'d,'+gs+'b.x'+id+'='+ac.stringify(n.param)+');')
					cut(n.body.start + 1, gs+'b.x'+id+'='+ac.stringify(n.param)+';')
					
					// lets store the exception as logic value on the catch
					dict[id++]= {x:n.loc.start.column, y:n.loc.start.line, ex:n.loc.start.column+5,ey:n.loc.start.line}
				}
			})
	
			function addAssign(mark, inj){
				cut(inj, gs+"b.a"+id+"=")
				dict[id++] = {x:mark.start.column, y:mark.start.line,	ex:mark.end.column, ey:mark.end.line}
			}

			// write function entry
			var s = 'var '+gs+'b={};'
			if(loopIds.length){
				s = 'var '+gs+'b={'
				for(var i = 0;i<loopIds.length;i++){
					if(i) s += ','
					s += 'l'+loopIds[i]+':0'
				}
				s += '};'
			}
			var tryStart = "try{"
			var tryEnd = "}catch(x){"+gs+".e(" + id + "," + gs + "b,x,1);throw x;}"

			if(isRoot){
				fhead.v = 'var '+gs+'g'+fnid+'=' +gs + ".f(" + fnid + ",null,0,0);" + s + tryStart
				cut(n.end, ";" + gs + ".e(" + id + "," + gs + "b)" + tryEnd)
				dict[id++] = {x:n.loc.end.column, y:n.loc.end.line, ret:fnid, root:1}
			
			} else {
				fhead.v = 'var '+gs+'g'+fnid+'=' +gs + ".f(" + fnid + ",arguments,this,"+gs+"g"+parentId+");" + s + tryStart 
				cut(n.body.end - 1, ";" + gs + ".e(" + id + "," + gs + "b)" + tryEnd)
				dict[id++] = {x:n.body.loc.end.column, y:n.body.loc.end.line, ret:fnid}
			}
		}	

		instrumentFn(n, file, true, 0)

		function cutUp(cuts, str){
			var s = ''
			var b = 0
			var n = cuts.first()
			while(n){
				s += str.slice(b, n.i)
				s += n.v
				b = n.i
				n = n._d
			}
			s += str.slice(b)
			return s
		}	

		//"_$_.set("+iid+",["+assignId.join(',')+"]);"
		return {
			output:head + cutUp(cuts, src), 
			input:src,//cutUp(cuts,src),
			id:id, 
			d:dict
		}
	}

	return instrument
})
define('/core/io_ssl',function(require, exports, module){
module.exports = {
cert: "-----BEGIN CERTIFICATE-----\n"+
"MIIB7zCCAVgCCQD4paokB3c5RzANBgkqhkiG9w0BAQUFADA8MQswCQYDVQQGEwJO\n"+
"TDELMAkGA1UECBMCTkgxDDAKBgNVBAcTA0FNUzESMBAGA1UEChMJTG9jYWxob3N0\n"+
"MB4XDTEyMTAyNzExMjEyNVoXDTEyMTEyNjExMjEyNVowPDELMAkGA1UEBhMCTkwx\n"+
"CzAJBgNVBAgTAk5IMQwwCgYDVQQHEwNBTVMxEjAQBgNVBAoTCUxvY2FsaG9zdDCB\n"+
"nzANBgkqhkiG9w0BAQEFAAOBjQAwgYkCgYEA0CEQ2x8I4ri+ePcetGP6+jWmpe1A\n"+
"0U+q4jZYb/ws1D8sfnexc9UCz1j5y1WVyLxExfNTw7gi19+1ASGWE/JGSbIl6aRd\n"+
"8Ez0IuYLEtCds/BXRAj2Mq9Iu45T8fgswgX2ErtuGEOHfSOA+l9PvtBPg2AKJNzP\n"+
"4WJY0hw6HDS+lccCAwEAATANBgkqhkiG9w0BAQUFAAOBgQCQMx+M4iM/6ZQNwGzi\n"+
"9U9Gm2hvemSmgcP05zBeisN3yFGNxNtVZyZ3K/sITE2KOW11Wcd/VDWfO6OGxlPx\n"+
"yObL+GPVkL/2HEfBfYovqcSdHT+ZiVVo4tYJt6Tdx8iGAuOtAP7C+vl81CDI4fHf\n"+
"9npl96D1wcQjW3PtI7YacYXjmQ==\n"+
"-----END CERTIFICATE-----",
key:"-----BEGIN RSA PRIVATE KEY-----\n"+
"MIICXQIBAAKBgQDQIRDbHwjiuL549x60Y/r6Naal7UDRT6riNlhv/CzUPyx+d7Fz\n"+
"1QLPWPnLVZXIvETF81PDuCLX37UBIZYT8kZJsiXppF3wTPQi5gsS0J2z8FdECPYy\n"+
"r0i7jlPx+CzCBfYSu24YQ4d9I4D6X0++0E+DYAok3M/hYljSHDocNL6VxwIDAQAB\n"+
"AoGAPo2BlGnqcMHXtWGIX+0gtGzFjl8VORN5p41v3RBspMnr5IKy2b5unsT+Joet\n"+
"gexbuybbyRohlsIMk691fL83MknJA7CPTE0RZKEKN2gS41cagpM8+3rm57ElZBub\n"+
"SjZUq8WYbL0gY4GL6b+jgdm9F4qlm5DxVBqk4oadHEhZHqECQQD79XiV9SWB6m/+\n"+
"tg6leOeBnlbfHURwyyyhDEbhXEWfr9OUXg+vng+rDtf5p1T6u3oQ0u1lYG+RlFwu\n"+
"MDMSWZM3AkEA03eh6sxJBvvLzNIHFsy9Oer7Tq+1R7nr0/ylmr2kjUeVg3fSiuCY\n"+
"MTD9c+YubBidN7PNXZyiW/o2sYRRHdp58QJAL77Feg05bVQCow7W2a5+mEZsCd2e\n"+
"8YzeySntaJk2rFsCShRE/q+CIpUugiWeaeEK8ZM230YV/k1R5oLFus10owJBAKsS\n"+
"iwDCBwoJRVQLTQTa2PIz8N41Mzg1Zlz2dJp8dNR+ZqwWkVMcYsLY2RGb005Lk1Ru\n"+
"tuLWRlqWTwzI+D5ocmECQQC99YYhg+Jo9ONQz7ov5KSh1NCBDZCBd91GEV+NJzgd\n"+
"WArz102//xuzKcakjdHPUbuUYUeIAC/8grKvN2hnsB4h\n"+
"-----END RSA PRIVATE KEY-----"
}
})

define('/core/io_server',function(require){
var http = require("http")
var https = require("https")
var url = require("url")
var path = require("path")
var fs = require("fs")
var fn = require('./fn')
var ioChannel = require('./io_channel')
function ioServer(ssl){
var hs = ssl?https.createServer(ssl, handler):http.createServer(handler)
var ch = hs.ch = {}
hs.root = path.resolve(__dirname,'..')
hs.pass = 'X'
hs.send = function(m){
for(var k in ch) ch[k].send(m)
}
function watcher(){
var d
var t = 0
var w = {}
var rs = {}
var ri = 0
var rt = 0
function sig(code, text){
d = Date.now()
if(code == 200) t++
for(var k in rs){
rs[k].writeHead(code,{"Content-Type": "text/plain","Cache-Control":"no-cache, private, no-store, must-revalidate, max-stale=0, post-check=0, pre-check=0"})
rs[k].end(text || "OK")
delete rs[k]
}
}
w.watch = function(f){
if(w[f]) return
d = Date.now()
w[f] = fs.watch(f, function(){
if(Date.now() - d < 2000) return
console.log("---- "+f+" changed, reloading frontend x"+ t +" ----")
sig(200, f)
})
}
w.handler = function(req, res){
if(req.url == '/_reloader_'){
var id = ri++
rs[id] = res
req.on('error',function(){ delete rs[id] })
if(!rt) rt = setTimeout(function(){ rt = 0; sig(304) }, 30000)
if(!t) sig(200)
return true
}
}
return w
}
hs.watcher = watcher()
function chan(req){
if(req.url.indexOf('/io_') != 0) return
var m = req.url.split('_')
if(m[2] != hs.pass) return console.log("invalid password in connection")
var c = ch[m[1]]
if(c) return c
c = ch[m[1]] = ioChannel(req.url)
c.data = function(d){
hs.data(d, c)
}
c.rpc = function(d, r){
if(hs.rpc) hs.rpc(d, r, c)
}
return c
}
hs.on('upgrade', function(req, sock, head) {
var c = chan(req)
if(c) c.upgrade(req, sock, head)
else sock.destroy()
})
var mime = {
"htm":"text/html",
"html":"text/html",
"js":"application/javascript",
"jpg":"image/jpeg",
"jpeg":"image/jpeg",
"txt":"text/plain",
"css":"text/css",
"png":"image/png",
"gif":"image/gif"
}
var mimeRx = new RegExp("\\.(" + Object.keys(mime).join("|") + ")$")
function handler(req, res) {
if(hs.watcher && hs.watcher.handler(req, res)) return
var c = chan(req)
if(c && c.handler(req, res)) return
var name = url.parse(req.url).pathname
if (name == '/'){
if(hs.packaged){
var pkg = ''
var files = {}
function findRequires(n, base){
if(files[n]) return
files[n] = 1
var f = define.factory[n]
if(!f) console.log('cannot find', n)
else {
var s = f.toString()
s.replace(/require\(['"](.*?)['"]\)/g,function(x, m){
if(m.charAt(0)!='.') return m
var n = define.norm(m,base)
findRequires(n, define.path(n))
})
pkg += 'define("'+n+'",'+s+')\n'
}
}
findRequires(hs.packaged, define.path(hs.packaged))
pkg += "function define(id,fac){\n"+
define.outer.toString().match(/\/\/PACKSTART([\s\S]*?)\/\/PACKEND/g,'').join('\n').replace(/\/\/RELOADER[\s\S]*?\/\/RELOADER/,'')+"\n"+
"}\n"
pkg += 'define.factory["'+hs.packaged+'"](define.mkreq("'+hs.packaged+'"))'
res.writeHead(200,{"Content-Type":"text/html"})
res.end(
"<html><head><meta http-equiv='Content-Type' CONTENT='text/html; charset=utf-8'><title></title>"+
"</head><body style='background-color:black'>"+
"<script>"+pkg+"</script></body></html>"
)
}
else {
res.writeHead(200,{"Content-Type":"text/html"})
res.end(
"<html><head><meta http-equiv='Content-Type' CONTENT='text/html; charset=utf-8'><title></title>"+
"</head><body style='background-color:black' define-main='"+hs.main+"'>"+
"<script src='/core/define.js'></script></body></html>"
)
}
return
}
var file = path.join(hs.root, name)
fs.exists(file, function(x) {
if(!x){
res.writeHead(404)
res.end("file not found")
console.log('cannot find '+file)
return
}
fs.readFile(file, function(err, data) {
if(err){
res.writeHead(500, {"Content-Type": "text/plain"})
res.end(err + "\n")
return
}
var ext = file.match(mimeRx), type = ext && mime[ext[1]] || "text/plain"
if(hs.process) data = hs.process(file, name, data, type)
res.writeHead(200, {"Content-Type": type})
res.write(data)
res.end()
})
if(hs.watcher) hs.watcher.watch(file)
})
}
return hs
}
return ioServer
})

define('/core/gl_browser',function(require, exports, module){
var fn = require("./fn")
var gl
var cvs
var div
var img = {}
if(typeof navigator === 'undefined'){
module.exports = null
return
}
var isSafari = navigator.userAgent.match(/Safari/) != null
var isGecko = navigator.userAgent.match(/Gecko\//) != null
var isChrome = navigator.userAgent.match(/Chrome\//) != null
var isIos = navigator.userAgent.match(/Apple.*Mobile\//) != null
if(!init()){
module.exports = null
return
}
gl.resize = fn.ps()
function init(){
window.requestAnimFrame = (function(){
return window.requestAnimationFrame ||
window.webkitRequestAnimationFrame ||
window.mozRequestAnimationFrame ||
window.oRequestAnimationFrame ||
window.msRequestAnimationFrame ||
function( callback ){
window.setTimeout(callback, 1000 / 60)
}
})()
cvs = document.createElement('canvas')
div = document.body
div.style.margin = '0'
div.style.backgroundColor = 'black'
div.style.overflow = 'hidden'
div.style.height = '100%'
div.style.userSelect = 'none';
var ratio = window.devicePixelRatio
document.body.appendChild(cvs)
window.onresize = function(){
cvs.style.width = div.offsetWidth - 2
cvs.style.height = div.offsetHeight - 2
cvs.width = gl.width = (div.offsetWidth - 2) * ratio
cvs.height = gl.height = (div.offsetHeight - 2) * ratio
gl.viewport(0, 0, gl.width, gl.height)
gl.resize()
}
cvs.style.width = div.offsetWidth - 2
cvs.style.height = div.offsetHeight - 2
cvs.width = (div.offsetWidth - 2) * ratio
cvs.height = (div.offsetHeight - 2) * ratio
gl = cvs.getContext && cvs.getContext('experimental-webgl', {
antialias:false,
premultipliedAlpha: false,
alpha: false,
preserveDrawingBuffer: true
})
if(!gl){
function msg(){
var w = '<a href="http://en.wikipedia.org/wiki/WebGL#Implementation">WebGL</a>'
var c = '<a href="http://www.google.com/chrome">Chrome</a>'
var gi = '<a href="http://www.google.com/search?q=enable+webgl+ios">solution</a>'
var d = 'Oh no! We cannot use '+w+'. You are missing something amazing!<br>'
var p1 = 'Reminder to self, try this WebGL link: '
var l1 = encodeURIComponent(p1+location.href)
var m = '<a href="mailto:link@n4.io?subject='+l1+'&body='+l1+'">Email yourself the link</a> (replace to).'
var a = 'http://www.apple.com/feedback/safari.html'
var w = 'install '+c+' for the best experience. Or '+m
if(isChrome){
d += 'You seem to be running Chrome already, try updating your videocard drivers, updating '+c+', or running on a newer computer.<br/>' + m
} else if(isIos){
d += 'Please help by <a href="' + a + '">asking Apple to enable WebGL in mobile safari.</a><br/>'
d += 'For now, experience this on a desktop OS. '+m+'<br/>Or search for a '+gi
} else if(isSafari) {
d += w+'<br/><br/>'+
'To enable webGL in Safari (5.1 or higher) follow these 5 steps:<br/>'+
'1. Top left of the screen: click Safari then Preferences (opens window).<br/>'+
'2. Click the advanced tab (gear) in the preferences window, its the last tab on the right.<br/>'+
'3. At the bottom check the "Show Develop menu in menu bar" checkbox.<br/>'+
'   At the top of the screen between Bookmarks and Window a new Develop menu appears<br/>'+
'4. Click the Develop menu at the top, and select Enable WebGL (last item at the bottom)<br/>'+
'5. <a href="'+location.href+'">Click here to refresh the browser</a><br/>'
d += 'I know this is a hassle, you can help by <a href="'+a+'"+>asking Apple to enable WebGL by default.</a><br/>'
} else {
d += w + '<br/>'
d += 'If you have Chrome already, just cut and paste "'+location.href+'" in the address bar of Chrome!<br>'
}
div.style.backgroundColor = 'lightgray'
div.style.font = '14px Monaco, Consolas'
div.style.color = 'black'
div.style.margin = '25'
document.body.innerHTML = d
}
return msg()
}
module.exports = gl
gl.ratio = ratio
gl.width = cvs.width
gl.height = cvs.height
gl.mouse_p = fn.ps()
gl.mouse_m = fn.ps()
gl.mouse_r = fn.ps()
gl.mouse_u = fn.ps()
gl.mouse_s = fn.ps()
gl.keydown = fn.ps()
gl.keyup = fn.ps()
var ct = isGecko ? {
'grab' : '-moz-grab',
'grabbing' : '-moz-grabbing'
}:{
'grab' : '-webkit-grab',
'grabbing' : '-webkit-grabbing',
'zoom-in' : '-webkit-zoom-in',
'zoom-out' : '-webkit-zoom-out'
}
var cursor
gl.cursor = function(c){
if(cursor != c)
document.body.style.cursor = cursor = c in ct? ct[c] : c
}
var b = 0
gl.anim = function(c){
if(b) return
b = 1
window.requestAnimFrame(function(){
b = 0
c()
})
}
gl.ms = {
x: -1,
y: -1,
h: 0,
v: 0
}
function setMouse(e){
gl.ms.b = e.button
gl.ms.c = e.ctrlKey
gl.ms.a = e.altKey
gl.ms.m = e.metaKey
gl.ms.s = e.shiftKey
}
var dfx
var dfy
var dfd
cvs.onmousedown = function(e){
dfx = e.clientX
dfy = e.clientY
setMouse(e)
gl.mouse_p()
cvs.focus()
window.focus()
}
document.ondblclick = function(e){
if(!dfd) return
setMouse(e)
gl.mouse_u()
}
document.onmouseout = function(e){
gl.ms.x = -1
gl.ms.y = -1
gl.mouse_m()
}
document.onmousemove = function(e){
setMouse(e)
gl.ms.x = e.clientX - 2
gl.ms.y = e.clientY - 2
gl.mouse_m()
}
window.onmouseup =
cvs.onmouseup = function(e){
dfd = dfx == e.clientX && dfy == e.clientY
setMouse(e)
gl.mouse_r()
}
if(isGecko){
window.addEventListener('DOMMouseScroll', function(e){
setMouse(e)
var d = e.detail;
d = d * 10
if(e.axis == 1){
gl.ms.v = 0
gl.ms.h = d
} else {
gl.ms.v = d
gl.ms.h = 0
}
gl.mouse_s()
})
}
window.onmousewheel = function(e){
setMouse(e)
var n = Math.abs(e.wheelDeltaX || e.wheelDeltaY)
if(n%120) n = isSafari?-6:-1
else n = -15
gl.ms.h = e.wheelDeltaX / n
gl.ms.v = e.wheelDeltaY / n
gl.mouse_s()
}
var clip = document.createElement('textarea')
clip.tabIndex = -1
clip.autocomplete = 'off'
clip.spellcheck = false
clip.id = 'clipboard'
clip.style.position = 'absolute'
clip.style.left =
clip.style.top = '-10px'
clip.style.width =
clip.style.height = '0px'
clip.style.border = '0'
clip.style.display = 'none'
document.body.appendChild(clip)
gl.getpaste = function(cb){
clip.style.display = 'block'
clip.select()
clip.onpaste = function(e){
cb(e.clipboardData.getData("text/plain"))
e.preventDefault()
clip.style.display = 'none'
}
}
gl.setpaste = function(v){
clip.style.display = 'block'
clip.value = v
clip.select()
setTimeout(function(){
clip.style.display = 'none'
},100)
}
var kn = {
8:'backspace',9:'tab',13:'enter',16:'shift',17:'ctrl',18:'alt',
19:'pause',20:'caps',27:'escape',
32:'space',33:'pgup',34:'pgdn',
35:'end',36:'home',37:'left',38:'up',39:'right',40:'down',
45:'insert',46:'delete',
48:'0',49:'1',50:'2',51:'3',52:'4',
53:'5',54:'6',55:'7',56:'8',57:'9',
65:'a',66:'b',67:'c',68:'d',69:'e',70:'f',71:'g',
72:'h',73:'i',74:'j',75:'k',76:'l',77:'m',78:'n',
79:'o',80:'p',81:'q',82:'r',83:'s',84:'t',85:'u',
86:'v',87:'w',88:'x',89:'y',90:'z',
91:'leftmeta',92:'rightmeta',
96:'num0',97:'num1',98:'num2',99:'num3',100:'num4',101:'num5',
102:'num6',103:'num7',104:'num8',105:'num9',
106:'multiply',107:'add',109:'subtract',110:'decimal',111:'divide',
112:'f1',113:'f2',114:'f3',115:'f4',116:'f5',117:'f6',
118:'f7',119:'f8',120:'f9',121:'f10',122:'f11',123:'f12',
144:'numlock',145:'scrollock',186:'semicolon',187:'equals',188:'comma',
189:'dash',190:'period',191:'slash',192:'accent',219:'openbracket',
220:'backslash',221:'closebracket',222:'singlequote'
}
var kr = {}
function key(e, k){
var r
if(kr[k]) r = kr[k]++
else r = 0, kr[k] = 1
gl.key = {
a:e.altKey,
c:e.ctrlKey,
s:e.shiftKey,
m:e.metaKey,
r:r,
k:k,
i:kn[k],
v:String.fromCharCode(e.charCode),
h:e.charCode
}
}
var kc = 0
var ki = 0
window.onkeydown = function(e){
kc = e.keyCode
ki = setTimeout(function(){
key(e, kc)
gl.keydown()
},0)
if(e.keyCode == 8 || e.keyCode == 9 || e.keyCode == 27 || e.keyCode == 13){
e.preventDefault()
e.stopPropagation()
}
}
window.onkeypress = function(e){
clearTimeout(ki)
key(e, kc)
gl.keydown()
}
window.onkeyup = function(e){
key(e, e.keyCode)
kr[gl.key.k] = 0
gl.keyup()
}
return true
}
function fwatch(ft, cb){
var c = document.createElement('canvas')
c.width = c.height = 4
var x = c.getContext('2d')
x.fillStyle = 'rgba(0,0,0,0)'
x.fillRect(0,0,c.width, c.height)
x.fillStyle = 'white'
x.textBaseline = 'top'
var n = document.createElement('span')
n.innerHTML = 'giItT1WQy@!-/#'
n.style.position = 'absolute'
n.style.left = n.style.top = '-10000px'
n.style.font = 'normal normal normal 300px sans-serif'
n.style.letterSpacing = '0'
document.body.appendChild(n)
var w = n.offsetWidth
n.style.fontFamily = ft
var i = setInterval(function(){
if(n.offsetWidth != w) {
x.font = '4px '+ft
x.fillText('X',0,0)
var p = x.getImageData(0,0,c.width,c.height).data
for (var j = 0, l = p.length; j < l; j++) if(p[j]){
document.body.removeChild(n)
clearInterval(i)
cb()
return
}
}
}, 100)
}
gl.load = function(){
var n = 0
var f = arguments[arguments.length - 1]
for(var i = 0;i< arguments.length - 1;i++){
r = arguments[i]
var t = r.indexOf(':')
var c = r.slice(0, t)
var u = r.slice(t + 1)
if(c == 'g'){
n++
var l = document.createElement('link')
l.setAttribute('rel', 'stylesheet')
l.setAttribute('type', 'text/css')
l.setAttribute('href', 'http://fonts.googleapis.com/css?family=' + u.replace(/ /g,'+'))
document.getElementsByTagName("head")[0].appendChild(l)
fwatch(u, function(){
if(!--n) f()
})
} else if(c == 'i'){
var i = new Image()
i.src = u
img[u] = i
n++
i.onload = function(){
if(!--n) f()
}
} else if(c == 'a'){
}
}
if(arguments.length == 1) f()
}
gl.texture = function(i, t, s) {
if(!t ) t = gl.createTexture()
gl.bindTexture(gl.TEXTURE_2D, t)
if( !i.width || (i.width & (i.width - 1)) || (i.height & (i.height - 1)) ){
if(gl.npot){
var c = document.createElement("canvas")
fn(i.width, i.height)
c.width = fn.nextpow2(i.width)
c.height = fn.nextpow2(i.height)
fn(c.width, c.height)
var x = c.getContext("2d")
x.drawImage(i, 0, 0, i.width, i.height)
i = c
} else {
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, i)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, s||gl.LINEAR)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, s||gl.LINEAR)
t.w = i.width, t.h = i.height
i = 0
}
}
if(i){
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, i)
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, s||gl.LINEAR)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
t.w = i.width, t.h = i.height
}
gl.bindTexture(gl.TEXTURE_2D, null)
return t
}
gl.camera = function(cb) {
var o = document.createElement('video');
o.autoplay = 'autoplay';
if(!window.navigator.webkitGetUserMedia) return
window.navigator.webkitGetUserMedia({audio:false, video:true},
function(s){
o.src = window.webkitURL.createObjectURL(s)
cb(o)
},
function(e){
fn(e)
}
)
}
gl.loadImage = function(u, cb){
var t = gl.createTexture()
if(img[u]){
gl.texture(img[u], t)
return t
}
var i = new Image()
i.onload = function(){ gl.texture(i, t); if(cb) cb() }
i.src = u
return t
}
var sFontSh
var pFontSh
gl.pfont = function(f){
var t = font((typeof f == 'object') ? f : {f:f})
if(!pFontSh){
var d = {u:{s:'sampler2D'}}
if(isChrome) d.f = function(){
vec4_v = texture2D(s,vec2(c.x,c.y));
return_vec4(v.x, v.y, v.z, pow(v.w,1.2))
}
else
if(isGecko) d.f = function(){
vec4_v = texture2D(s,vec2(c.x,c.y));
return_vec4(v.y, v.y, v.y, pow(v.w,1.4))
}
else d.f = function(){
vec4_v = texture2D(s,vec2(c.x,c.y));
float_y = pow(v.y,0.25);
return_vec4(y,y,y, pow(v.w,2.2))
}
s = gl.getScreenShader(d)
pFontSh = s
}
var t2 = gl.renderTexture(t.w, t.h, function(){
gl.disable(gl.BLEND)
pFontSh.use()
pFontSh.s(t)
pFontSh.draw()
})
for(var k in t) t2[k] = t[k]
gl.deleteTexture(t)
return t2
}
gl.sfont = function(f){
var t
if(typeof f == 'object'){
f.a = 1
t = font(f)
} else t = font({a:1,f:f})
if(!sFontSh){
sFontSh = gl.getScreenShader({
u: {s:'sampler2D', a:'float'},
f: function(){
float_p( 1./2048 )
float_x( c.x * 0.75 )
float_g1( pow(texture2D(s,vec2( x - 2 * p, c.y )).g, a) )
float_b1( pow(texture2D(s,vec2( x - 1 * p, c.y )).g, a) )
float_r( pow(texture2D(s,vec2( x, c.y )).g, a) )
float_g( pow(texture2D(s,vec2( x + 1 * p, c.y )).g, a) )
float_b( pow(texture2D(s,vec2( x + 2 * p, c.y )).g, a) )
float_rs((r+g1+b1)/3)
float_gs((r+g+b1)/3)
float_bs((r+g+b)/3)
return_vec4(rs,gs,bs, step(min(min(rs,gs),bs),0.9))
}
})
}
var t2 = gl.renderTexture(t.w, t.h, function(){
gl.disable(gl.BLEND)
sFontSh.use()
sFontSh.s(t)
sFontSh.a(1)
sFontSh.draw()
})
for(var k in t) t2[k] = t[k]
gl.deleteTexture(t)
return t2
}
gl.palette = function(o, t){
var w = 0
var h = 1
for(var i in o) w++
w = fn.nextpow2(w)
t = t || gl.createTexture()
t.w = w
t.h = h
var c = document.createElement( "canvas" )
var x = c.getContext( "2d" )
c.width = x.width = w
c.height = x.height = h
var d = x.createImageData(w, 1)
var p = d.data
var j = 0
var v = 0
for(var i in o){
t[i] = v / w
var r = gl.parseColor(o[i])
p[j + 0] = r.r * 255
p[j + 1] = r.g * 255
p[j + 2] = r.b * 255
p[j + 3] = r.a * 255
j += 4
v++
}
x.putImageData(d, 0, 0)
gl.texture(c, t, gl.NEAREST)
return t
}
function font(f){
var c = document.createElement( "canvas" )
var x = c.getContext( "2d" )
var t = gl.createTexture()
var o = {}
if(typeof f == 'object') o = f, f = o.f || o.font
var n = f.match(/(\d+)px/)
if(!n) throw new Error("Cannot parse font without size in px")
var px = parseInt(n[0])
px = px * gl.ratio
f = px+'px'+f.slice(n[0].length)
gs = fn.nextpow2(px)
t.w = 512
t.g = gs
t.p = px
t.b = Math.floor(t.w / gs)
t.s = 32
t.e = o.e || 256
t.h = fn.nextpow2( ((t.e - 32) / t.b) * gs + 1 )
t.m = []
t.c = []
t.t = []
t.xp = 0
c.width = o.a?2048:512
c.height = t.h
x.scale(o.a?3:1, 1)
x.fillStyle = o.a?'white':'rgba(0,0,0,0)'
x.fillRect(0, 0, t.w, t.h)
x.font = f
x.fillStyle = o.a?'black':'white'
x.textBaseline = 'bottom'
x.textAlign = 'start'
var ia = 0
if(f.match(/italic/i)) ia = parseInt(px/4)
for(var i = 0, l = t.e - t.s; i <l; i++){
var xp = i % t.b
var yp = Math.floor(i / t.b)
var ch = String.fromCharCode(i + t.s)
t.c[i] = Math.round(x.measureText(ch).width)
t.m[i] = t.c[i] + ia
t.t[i] = (Math.floor( (( xp * gs - t.xp) / t.w) * 256 ) << 16) |
(Math.floor( (( yp * gs) / t.h) * 256 ) << 24)
if(i == 127 - t.s){
for(var j = 0;j < px+1; j += 2) x.fillRect(xp*gs+2+0.5, yp*gs+j, 0.25, 1)
} else if(i == 128 - t.s){
x.fillRect(xp*gs, yp*gs+0.5*px, 1, px)
}else x.fillText(ch, xp * gs, yp * gs + px + (isGecko?0:1) )
}
gl.bindTexture(gl.TEXTURE_2D, t)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, c)
gl.bindTexture(gl.TEXTURE_2D, null)
return t
}
return gl
})

define('/core/gl',function(require, exports, module){
var fn = require("./fn")
var gl = require("./gl_browser")
var ac = require("./acorn")
if(!gl){
module.exports = null
return
}
module.exports = gl
function Shader(){}
(function(){
var la = 0
this.use = function(f){
var ss = this.$ss = this.$sf[f || '_']
this.$ul = ss.ul
gl.useProgram(ss.sp)
var ha = 0
for(var i in ss.al){
var a = ss.al[i]
gl.enableVertexAttribArray(a)
if(a > ha) ha = a
}
while(la > ha) gl.disableVertexAttribArray(la--)
la = ha
this.$tc = 0
var tl = this.$tl
for(var i in tl){
var tc = this.$tc++
gl.activeTexture(gl.TEXTURE0 + tc)
gl.bindTexture(gl.TEXTURE_2D, tl[i])
gl.uniform1i(this.$ul[i], tc)
}
var u = this.$un
if(u) for(var k in u) this[k](u[k])
}
this.n = function(n){
var nu = this.$nu
for(var i in nu){
var v = nu[i]
var p = n
var d = v.d
var k = v.k
while(d > 0) p = p._p || p._b, d--
var t = typeof p[k]
if(t == 'string') this[i](p.eval(k))
else this[i](p[k] || 0)
}
}
this.draw = function(b){
var sd = this.$sd
var ss = this.$ss
b = b || this.$b
gl.bindBuffer(gl.ARRAY_BUFFER, b.$vb)
if(b.up) gl.bufferData(gl.ARRAY_BUFFER, b.$va, gl.STATIC_DRAW)
var vt = b.$vt
for(var i in vt){
var t = vt[i]
gl.vertexAttribPointer(ss.al[i], t.c, t.t, !t.n, b.$vs, b[i].o)
}
if(sd.i){
gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, b.$ib)
if(b.up) gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, b.$ia, gl.STATIC_DRAW)
gl.drawElements(sd.m, (b.hi - b.lo) * b.$ic, gl.UNSIGNED_SHORT, b.lo * b.$ic)
} else {
gl.drawArrays(sd.m, b.lo * b.$sl, (b.hi - b.lo) * b.$sl)
}
b.up = false
}
this.set = function(u){
for(var k in u) this[k](u[k])
}
var _delvb = []
var _delib = []
this.alloc = function(sc, ob){
var sd = this.$sd
var ad = this.$ad
var an = this.$an
var b = {}
var vs = 0
for(var k in ad) vs += gt.types[ ad[k] ].s
var vl = sc * vs * sd.l
var va = new ArrayBuffer(vl)
if(sd.i){
var il = sc * 2 * sd.i
var ia = new ArrayBuffer(il)
}
if(ob){
var x = new Int32Array(ob.$va)
var y = new Int32Array(va)
for(var j = 0, l = ob.$vl >> 2; j < l; j++) y[j] = x[j]
b = ob
if(sd.i){
var x = new Int32Array(ob.$ia)
var y = new Int32Array(ia)
for(var j = 0, l = ob.$il >> 1; j < l; j++) y[j] = x[j]
}
} else {
b.$vb = _delvb.pop() || gl.createBuffer()
if(sd.i) b.$ib = _delib.pop() || gl.createBuffer()
b.lo = 0
b.hi = 0
b.$us = 0
}
if(sd.i){
b.$ia = ia
b.i = {
a: new Uint16Array(ia),
i: sd.i,
l: sd.l
}
b.$il = il
b.$ic = sd.i
}
b.up = true
b.$sc = sc
b.$va = va
b.$vl = vl
b.$vs = vs
b.$sl = sd.l
b.$vt = {}
b.$sh = this
var o = 0
var vt = b.$vt
for(var i in ad){
var t = gt.types[ad[i]]
vt[i] = t
b[i] = {
a : new t.a(va, o),
t : t,
s : vs / t.f,
o : o,
n : an[i],
l : sd.l
}
o += t.s
}
return b
}
this.free = function(b){
_delvb.push(b.$vb)
b.$vb = 0
if(b.$ib){
_delib.push(b.$ib)
b.$ib = 0
}
}
}).apply(Shader.prototype)
var shader_us = {
0: function(i){
return function(t){
var tc = this.$tc++
gl.activeTexture(gl.TEXTURE0 + tc)
gl.bindTexture(gl.TEXTURE_2D, t)
gl.uniform1i(this.$ul[i], tc)
}
},
1: function(i, u){
return function(x) {
gl[u](this.$ul[i], x)
}
},
2: function(i, u){
return function(x, y) {
if(typeof x == 'object') gl[u](this.$ul[i], x.x, x.y)
else gl[u](this.$ul[i], x, y)
}
},
3: function(i, u){
return function(x, y, z) {
if(typeof x == 'object') gl[u](this.$ul[i], x.x, x.y, x.z)
else gl[u](this.$ul[i], x, y, z)
}
},
4: function(i, u){
return function(x, y, z, w) {
if(typeof x == 'object') gl[u](this.$ul[i],x.x, x.y, x.z, x.w)
else gl[u](this.$ul[i], x, y, z, w)
}
}
}
var illegal_attr = {hi:1,lo:1,i:1,up:1}
var fnid_c = 1
var fnid_o = {}
var fnid_tc = {}
var fnid_rc = {}
var fnid_ev = {}
function fnid(f, n){
if(!n || n.q) return f
var c = f._c
if(!c) f._c = c = f.toString().replace(/[;\s\r\n]*/g,'')
var i = fnid_o[c]
var tc = fnid_tc[i]
if(!tc) return '@'
var s = String(i)
for(var k in tc){
var v = tc[k]
var p = n
while(v>0) p = n._p || n._b, v--, s += '^'
var j = p[k]
var t = typeof j
if(p.hasOwnProperty(k)){
delete p[k]
p[k] = j
}
if(t == 'number') s += k+'#'
else if(t == 'object') s+= k+'*'
else if(t == 'undefined') s += k+'?'
else s += k + fnid(j, p)
}
return s
}
gl.totalCompiletime = 0
gl.createTexture2 = gl.createTexture
var textureID = 0
gl.createTexture = function(){
var t = gl.createTexture2()
t.id = textureID++
return t
}
gl.getShader = function(sd, dn){
sd.l = sd.l || 1
sd.d = sd.d || {}
sd.e = sd.e || {}
sd.x = sd.x || {}
sd.y = sd.y || {}
sd.u = sd.u || {}
if(!sd.cache) sd.cache = {}
var vi = dn && dn.v || sd.v
var fi = dn && dn.f || sd.f
var sid = fnid(vi, dn) + '|' + fnid(fi, dn)
var sh = sd.cache[sid]
if(sh) return sh
sh = new Shader()
sh.$sd = sd
var ad = sh.$ad = {}
var an = sh.$an = {}
var nu = sh.$nu = {}
var ud = sh.$ud = {}
var tl = sh.$tl = {}
var nd = sh.$nd = {}
var tn
var dt = Date.now()
var fw
var fd = {}
var in_f
var rd
var fa = {}
var ts = {}
var ti = 0
var wi = 0
var oh
var od
var oe
var ob
oh = ob = od = '', pd = {}, fw = '', in_f = true
if(sd.m == gl.POINTS) pd.c = 1
var cs = fi
if(typeof cs == 'function'){
sd.e._f = cs
cs = '_f()'
}
var ns = {n:dn || {l:1}, np:'N', dp:0}
oe = expr(cs, 0, 0, ns)
var ssf = sd.s || {_:0}
var sf = {}
for(var i in ssf) sf[i] = expr(ssf[i], [oe], 0, ns)
if(sd.m == gl.POINTS){
oh += 'vec2 c;\n'
ob += gl.flip_y?
' c = vec2(gl_PointCoord.x,gl_PointCoord.y);\n':
' c = vec2(gl_PointCoord.x,1.-gl_PointCoord.y);\n'
}
var yf = '', yd = '', yb = '', yv = ''
var vu = 0
var vs = 0
var vn = { 0:'x',1:'y',2:'z',3:'w' }
for(var i in fa){
yd += fa[i] + ' ' + i +';\n'
if(fa[i] == 'float'){
yb += ' ' + i + ' = v_' + vs + '.' + vn[vu] + ';\n'
yv += ' v_' + vs + '.' + vn[vu] + ' = ' + i + ';\n'
vu++
if(vu >= 4){
yf += 'varying vec4 v_' + vs + ';\n'
vs ++, vu = 0
}
} else {
yf += 'varying ' + fa[i] + ' ' + i + 'v_;\n'
yb += ' ' + i + ' = ' + i + 'v_;\n'
yv += ' ' + i + 'v_ = ' + i + ';\n'
}
}
if(vu > 0) yf += 'varying vec'+(vu>1?vu:2)+' v_' + vs + ';\n'
var fs =
'precision mediump float;\n' +
'#define ucol vec4\n' +
oh + od + yf + yd + fw +
'void main(void){\n'+ yb + ob +
' gl_FragColor = '
for(var i in sf) sf[i] = fs + sf[i] + ';\n}\n'
cs = vi
if(typeof cs == 'function'){
sd.e._v = cs
cs = '_v()'
}
oh = ob = od = '', pd = {}, fw = '', in_f = false
oe = expr(cs, 0, 0, ns)
if(sd.p) ob += ' gl_PointSize = ' + expr(sd.p, 0, 0, ns) + ';\n'
for(var i in ad){
if(i in illegal_attr) throw new Error("Cannot name an attribute hi,lo or i." + i)
od += 'attribute ' + ad[i] + ' ' + i + ';\n'
}
var vs =
'#define ucol vec4\n' +
oh + od + yf + fw + '\n' +
'void main(void){\n'+ yv + ob +
' gl_Position = ' + oe + ';\n' +
'}\n'
if(sd.dbg || (dn && dn.dbg)){
var o = ''
for(var i in sf) o += '---- fragment shader '+i+' ----\n' + sf[i]
fn('---- vertex shader ----\n' + vs + o)
}
var gv = gl.createShader(gl.VERTEX_SHADER)
gl.shaderSource(gv, vs)
gl.compileShader(gv)
if (!gl.getShaderParameter(gv, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(gv) + "\n" + vs)
sh.$sf = {}
for(var i in sf) sh.$sf[i] = frag(gv, sf[i])
for(var i in sd.u) if(!(i in ud)) sh[i] = function(){}
for(i in ud){
var t = ud[i]
var y = gt.types[t]
if(i in sh) throw new Error("Cannot use uniform with name "+i)
sh[i] = shader_us[y.c](i, y.u)
}
gl.totalCompiletime += Date.now() - dt
sid = fnid(vi, dn) + '|' + fnid(fi, dn)
sh.$id = sid
sd.cache[sid] = sh
return sh
function frag(gv, fs){
var s = {}
s.al = {}
s.ul = {}
var gf = gl.createShader(gl.FRAGMENT_SHADER)
gl.shaderSource(gf, fs)
gl.compileShader(gf)
if (!gl.getShaderParameter(gf, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(gf) + "\n" + fs)
var sp = s.sp = gl.createProgram()
gl.attachShader(sp, gv)
gl.attachShader(sp, gf)
gl.linkProgram(sp)
if (!gl.getProgramParameter(sp, gl.LINK_STATUS)) throw new Error("Could not link, max varying:" + gl.getParameter(gl.MAX_VARYING_VECTORS) +"\n"+ gl.getShaderInfoLog(gf) + fs)
gl.useProgram(sp)
for(var i in ad) s.al[i] = gl.getAttribLocation(sp, i)
for(i in ud) s.ul[i] = gl.getUniformLocation(sp, i)
return s
}
function expr(f, a, lv, ns){
if(!f) return a[0]
var c = f._c || (f._c = f.toString().replace(/[;\s\r\n]*/g,''))
var id = f._i
if(!id) f._i = id = fnid_o[c] || (fnid_o[c] = fnid_c++)
var tc = fnid_tc[id] || (fnid_tc[id] = {})
fnid_rc[id] = f
var p = ac.parse(c,{noclose:1, compact:1, tokens:1}).tokens._c
var ma = {}
if(p.t.match(/^function/)){
if(a){
var c = 0
while(!p.parenL) p = p._d
for(var i = p._c; i; i = i._d) if(i.name) c++
c = a.length - c - 1
for(var i = p._c; i; i = i._d) if(i.name) ma[i.t] = a[++c < 0 ? 0 : c]
}
while(p && !p.braceL) p = p._d
} else {
p = p._p
}
function subexpr(i, f, lv, ns){
var c = f._c || (f._c = f.toString().replace(/[;\s\r\n]*/g,''))
var e = f._e
if(!e) f._e = e =c.indexOf('_fw_') != -1 ? 3 :
c.indexOf('return_') != -1 ? 2 :
c.indexOf('return') != -1 ? 4 : 1
var ar
if(i._d && i._d.parenL){
ar = expand(i._d._c, 0, lv, ns), i._d.t = i._d._t = ''
}
if(e == 1){
if(ar) for(var j = 0;j<ar.length;j++) ar[j] = '('+ar[j]+')'
i.t = '('+expr(f, ar, lv, ns)+')'
}
else if(e == 2){
var o = i.t.indexOf('.')
if(o != -1) i.t = i.t.slice(0, o) + '_' + i.t.slice(o+1)
if(!fd[i.t]){
fd[i.t] = 1
var v = subfn(f, i.t, ns)
fw += v
}
i.t = i.t+'('+ar.join(',')+')'
}
else if(e == 3){
var m = c.match(/([a-zA-Z0-9_]*)\_fw\_([a-zA-Z0-9_]*)/)
var v = m[1] || 'vec4'
var o = 'vec2 c'
if(m[2]) o = m[2].replace(/_/g,' ')
fw += v + ' _fw' + wi + '(' + o + '){\n return ' + ar[ar.length - 1] + ';\n}\n'
ar[ar.length-1] = '_fw' + wi++
i.t = expr(f, ar, lv, ns)
}
else if(e == 4) {
var b = []
if(ar) for(var j = 0;j<ar.length;j++) b[j] = '('+ar[j]+')'
var v = f.apply(null, b)
var o = v.indexOf('#')
if(o == -1) i.t = v
else {
v = v.slice(0,o)+'_fw'+wi+v.slice(o+1)
fw += v;
i.t = '_fw' + wi + '(' + ar.join(',') + ')'
wi++
}
}
}
function subfn(f, t, ns){
var ce = f._ce
if(!ce) f._ce = ce = f.toString()
var p = ac.parse(ce,{noclose:1, compact:1, tokens:1}).tokens._c
var i
var lv = {}
var rt
while(!p.parenL) p = p._d
var os = '('
for(i = p._c; i; i = i._d) if(i.name){
var j = i.t.indexOf('_')
var k = i.t.slice(j + 1)
var y = i.t.slice(0, j)
os += (os != '(' ? ',' : '' )+ y + ' ' + k
lv[k] = y
}
os = t + os + ')'
while(p && !p.braceL) p = p._d
i = p
while(i){
while(i.braceL){
os += '{\n'
if(!i._c){ s+= '}\n'; break;}
i = i._c
}
if(i.name && i._d && i._d.semi){
var o = i.t.indexOf('_'), y
var k = i.t.slice(o+1)
if(o != 0 && gt.types[y = i.t.slice(0,o)]){
lv[k] = y
} else y = i.t, k = ''
os += y + ' ' + k + ';'
i = i._d
}else
if(i.name && i._d && i._d.isAssign){
var o = i.t.indexOf('_'), y
var k = i.t.slice(o+1)
if(o != 0 && gt.types[y = i.t.slice(0,o)]){
lv[k] = y
} else y = i.t, k = ''
var j = i;
while(j && !j.semi) j = j._d
if(!j) throw new Error("assignment without terminating ; found")
os += y + ' ' + k + ' ' + i._d.t + ' ' + expand(i._d._d, j, lv, ns) + ';'
i = j
} else
if(i.name && i._d && i._d.parenL){
var o = i.t.indexOf('_'), y
if(o != 0 && gt.types[y = i.t.slice(0,o)]){
var k = i.t.slice(o+1)
lv[k] = y, k += ' = ' + y
os += y + ' '+ k + '('+ expand(i._d._c, 0, lv, ns).join(',')+');\n'
i = i._d
} else if(y == 'return'){
var k = i.t.slice(o+1)
if(rt && k != rt) throw new Error("please use one return type in "+t)
rt = k
os += 'return '+ k + '('+ expand(i._d._c, 0, lv, ns).join(',')+');\n'
i = i._d
} else {
os += expand(i, i._d._d, lv, ns)[0]
i = i._d
}
}else if(i.if && i._d.parenL){
os += ';\n'+i.t +'('+ expand(i._d._c, 0, lv, ns).join(',')+')'
i = i._d
}else if(i.for && i._d.parenL){
var p1 = i._d._c, p2, p3, p4
p2 = p1
while(p2 && !p2.semi) p2 = p2._d
p3 = p2._d
while(p3 && !p3.semi) p3 = p3._d
var o = p1.t.indexOf('_')
if(!p1 || !p2 || !p3 || o == -1) throw new Error("for loop without init declaration")
var k = p1.t.slice(o + 1)
var y = p1.t.slice(0, o)
lv[k] = y
p1.t = k
os += 'for(' + y +' '+ expand(p1, p2, lv, ns) + ';' + expand(p2._d, p3, lv, ns) + ';' + expand(p3._d, 0, lv, ns) + ')'
i = i._d._d
}
else{
os += i.t + ' '
}
while(i && !i._d && i != p){
i = i._p || i._b, os+= ';\n}\n'
}
if(i) i = i._d
}
if(!rt) throw new Error("no returntype for "+t)
os = rt + ' ' + os
return os
}
function expand(i, x, lv, ns){
var ea = []
var os = ''
while(i && i != x){
if(i.t == '+' && i._d && i._d.num && (!i._u || i._u.t == '=')){
i.t = '', i._d._t = {}
}else
if(i.num && i.t.indexOf('.') == -1){
i.t += '.'
}
else if(i.name){
var o
var t = (o = i.t.indexOf('.')) != -1 ? i.t.slice(0, o) : i.t
if(t in ma) i.t = ma[t]
else if(o==0){}
else if(lv && (t in lv)){}
else if(t in pd){}
else if(t in sd.d)
pd[t] = oh += '#define ' + t + ' ' + sd.d[t] + '\n'
else if(t in gt.cv4)
pd[t] = oh += '#define ' + t + ' ' + gt.cv4[t] + '\n'
else if(t == 't' && o != -1){
var k = i.t.slice(o+1)
if(!sd.t) throw new Error('theme object not supplied to compiler for '+i.t)
if(!(k in sd.t)) throw new Error('color not defined in theme: ' + i.t)
if(!('T' in ud)){
pd.T = ud.T = 'sampler2D'
tl.T = sd.t
oh += 'uniform sampler2D T;\n'
}
i.t = 'texture2D(T,vec2('+sd.t[k]+',0))'
}
else if(t in sd.u)
pd[t] = ud[t] = sd.u[t], oh += 'uniform ' + ud[t] + ' ' + t + ';\n'
else if(t in sd.a){
in_f ? fa[t] = ad[t] = sd.a[t] : ad[t] = sd.a[t]
}
else if(t == 'n' || t == 'p'){
var n2 = ns
var k = i.t.slice(o+1)
if(t == 'p'){
n2 = {
np: 'P' + ns.np,
dp: ns.dp+1,
n: ns.n._p || ns.n._b
}
tc[k] = 1
} else tc[k] = 0
var j = n2.n[k]
var to = typeof j
gl.regvar(k)
var is_tex = j instanceof WebGLTexture
if(to == 'function' || to == 'string') subexpr(i, j, lv, n2)
else if(to == 'object' && !is_tex){
} else {
if(n2.n.l || is_tex){
var lu = {d:n2.dp || 0, k:k}
k = n2.np + k
if(is_tex){
if(!tn) tn = sh.$tn = {}
tn[k] = lu
}
if(!pd[k]){
nu[k] = lu
pd[k] = ud[k] = (is_tex?'sampler2D':sd.y[k] || 'float')
oh += 'uniform ' + ud[k] + ' ' + k + ';\n'
}
i.t = k
} else {
var lu = {d:n2.dp, k:k}
k = n2.np + k
an[k] = lu
i.t = k
in_f ? fa[k] = ad[k] = (sd.y[k] || 'float') : ad[k] = (sd.y[k] || 'float')
}
}
}
else if(t in sd.x){
var o = sd.x[t]
oh += o.t +' '+t + ';\n'
ob += t + ' = ' + expr(o.c, 0, lv, ns) + ';\n'
pd[t] = 1
}
else if(ns.n.e && t in ns.n.e)
subexpr(i, ns.n.e[t], lv, ns)
else if(t in sd.e)
subexpr(i, sd.e[t], lv, ns)
else if(!(t in gt.types || t in gt.builtin)){
throw new Error("undefined variable used:" + t + " in " + f)
}
} else if(i.string){
if(!in_f) throw new Error("texture not supported in vertex shader")
if(!(i.t in ts)){
var o = ts[i.t] = '_'+(ti++)
ud[o] = 'sampler2D'
var t = i.t.slice(1, -1)
tl[o] = gl.loadImage(t)
oh += 'uniform sampler2D '+o+';\n'
}
i.t = ts[i.t]
}
if(i.comma) ea.push(os), os = ''
else if(i.parenL) os+= '(' + expand(i._c, null, lv, ns).join(',') + ')'
else os += i.t
i = i._d
}
ea.push(os)
return ea
}
return expand(p._c,0,lv,ns)[0]
}
}
function js_expr(f, a, un, el, rd){
if(!f) return a[0]
var c = f._c
var id = f._i
if(!c) f._c = c = f.toString()
if(!id) f._i = id = fnid_o[c] || (fnid_o[c] = fnid_c++)
var p = ac.parse(c,{noclose:1, compact:1, tokens:1}).tokens._c
var i
var m = {}
if(p.t.match(/^function/)){
if(a){
var c = 0
while(!p.parenL) p = p._d
for(i = p._c; i; i = i._d) if(i.name) c++
c = a.length - c - 1
for(i = p._c; i; i = i._d) if(i.name) m[i.t] = a[++c < 0 ? 0 : c]
}
while(p && !p.braceL) p = p._d
} else{
p = p._p
}
function subexpr(i, f){
var c = f._c
if(!c) f._c = c = f.toString().replace(/[;\s\r\n]*/g,'')
var e = f._e
if(!e) f._e = e = c.indexOf('_fw_') != -1 ? 3 :
c.indexOf('return_') != -1 ? 2 :
c.indexOf('return') != -1 ? 4 :1
var a
if(i._d && i._d.parenL){
a = expand(i._d._c), i._d.t = i._d._t = ''
for(var j = 0; j < a.length; j++) a[j] = '(' + a[j] + ')'
}
if(e == 1)i.t = '(' + js_expr(f, a, un, el, rd) + ')'
else if(e == 2) throw new Error("cant use function wrappers in JS expressions")
else if(e == 3) throw new Error("cant use sub functions in JS expressions")
else if(e == 4) i.t = f.apply(null, a)
}
function expand(i){
var a = []
var s = ''
while(i){
if(i.num && i.t.indexOf('.') == -1) i.t += '.'
else if(i.name){
var o, t = (o = i.t.indexOf('.')) != -1 ? i.t.slice(0, o) : i.t
if(t in m) i.t = m[t]
else if(t in un){
i.t = '__u.'+i.t
}
else if(t == 'n' || t == 'p'){
var k = i.t.slice(o+1)
i.t = t+'_'+k
if(!rd[t+'_'+k]){
rd.b += 'var '+t+'_'+k+' = __x('+t+','+t+'.'+k+', __u, __e);\n'
rd[t+'_'+k] = 1
}
}
else if(t in el){
subexpr(i, el[t])
}
else if(t in gt.builtin){
i.t = '__b.' + i.t
} else {
fn(un)
throw new Error("undefined variable used in JS expression:(" + t + ")")
}
}
else if(i.string) throw new Error("texture not supported in JS expressions")
if(i.comma) a.push(s), s = ''
else if(i.parenL) s+= '(' + expand(i._c).join(',') + ')'
else s += i.t
i = i._d
}
a.push(s)
return a
}
return expand(p._c)[0]
}
gl.eval = function(n, f, un, el){
if(typeof f == 'number') return f
var j = fnid_ev[f]
if(!j){
var rd = {b:''}
var e = js_expr(f, 0, un, el, rd)
rd.b += 'return '+e+'\n'
fnid_ev[f] = j = Function('n','p','__u','__e','__b','__x', rd.b)
}
return j(n, n._p || n._b, un, el, gt.builtin, gl.eval)
}
gl.renderTexture = function(w, h, f){
var b = gl.createFramebuffer()
b.width = w
b.height = h
var t = gl.createTexture()
gl.bindTexture(gl.TEXTURE_2D, t)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, false)
gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false)
gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null)
gl.bindFramebuffer(gl.FRAMEBUFFER, b)
gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0)
gl.viewport(0, 0, w, h)
f()
gl.bindFramebuffer(gl.FRAMEBUFFER, null)
gl.bindTexture(gl.TEXTURE_2D, null)
gl.deleteFramebuffer(b)
gl.viewport(0, 0, gl.width, gl.height)
t.id = gl.textureID++
return t
}
function detect_y(){
var v = 'attribute vec2 c;void main(void){gl_PointSize = 2.;gl_Position = vec4(c.x,c.y,0,1.);}'
var f = 'precision mediump float;void main(void){gl_FragColor = vec4(gl_PointCoord.y>0.5?1.0:0.0,gl_PointCoord.x,0,1.);}'
var fs = gl.createShader(gl.FRAGMENT_SHADER)
gl.shaderSource(fs, f), gl.compileShader(fs)
if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(fs))
var vs = gl.createShader(gl.VERTEX_SHADER)
gl.shaderSource(vs, v), gl.compileShader(vs)
if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(vs))
sp = gl.createProgram()
gl.attachShader(sp, vs),
gl.attachShader(sp, fs),
gl.linkProgram(sp)
var b = gl.createBuffer()
gl.bindBuffer(gl.ARRAY_BUFFER, b)
var x = new Float32Array(2)
x[0] = -1, x[1] = 1
gl.bufferData(gl.ARRAY_BUFFER, x, gl.STATIC_DRAW)
var cl = gl.getAttribLocation(sp, 'c')
gl.useProgram(sp)
gl.enableVertexAttribArray(cl)
gl.vertexAttribPointer(cl, 2, gl.FLOAT, false, 8, 0);
gl.drawArrays(gl.POINTS, 0, 1)
var pv = new Uint8Array(4)
gl.readPixels(0, gl.height - 1, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pv)
gl.deleteBuffer(b)
return pv[0] != 0
}
function gt(){
var y = {}
y.int = {u:"uniform1i", c:1}
y.ivec2 = {u:"uniform2i", c:2}
y.ivec3 = {u:"uniform3i", c:3}
y.ivec4 = {u:"uniform4i", c:4}
y.uint = {u:"uniform1i", c:1}
y.uvec2 = {u:"uniform2i", c:2}
y.uvec3 = {u:"uniform3i", c:3}
y.uvec4 = {u:"uniform4i", c:4}
y.double = {u:"uniform1f", s:8, a:Float64Array, f:8, c:1, w:fl, r:_fl, t:gl.FLOAT}
y.dvec2 = {u:"uniform2f", s:16, a:Float64Array, f:8, c:2, w:v2, r:_v2, t:gl.FLOAT}
y.dvec3 = {u:"uniform3f", s:24, a:Float64Array, f:8, c:3, w:v3, r:_v3, t:gl.FLOAT}
y.dvec4 = {u:"uniform4f", s:32, a:Float64Array, f:8, c:4, w:v4, r:_v4, t:gl.FLOAT}
y.float = {u:"uniform1f", s:4, a:Float32Array, f:4, c:1, w:fl, r:_fl, t:gl.FLOAT}
y.vec2 = {u:"uniform2f", s:8, a:Float32Array, f:4, c:2, w:v2, r:_v2, t:gl.FLOAT}
y.vec3 = {u:"uniform3f", s:12, a:Float32Array, f:4, c:3, w:v3, r:_v3, t:gl.FLOAT}
y.vec4 = {u:"uniform4f", s:16, a:Float32Array, f:4, c:4, w:v4, r:_v4, t:gl.FLOAT}
y.ucol = {u:"uniform1ic", s:4, a:Uint32Array, f:4, c:4, w:co, r:_co, t:gl.UNSIGNED_BYTE, n:false, x:'vec4'},
y.sampler2D = {c:0}
y.bool = {c:0}
gt.types = y
gt.vertex = {
gl_Position:1,
gl_PointSize:1,
gl_DepthRange:1
}
gt.fragment = {
gl_DepthRange:1,
gl_FragCoord:1,
gl_PointCoord:1,
gl_FrontFacing:1,
gl_FragColor:1,
gl_FragData:1
}
gt.globals = {
gl_MaxVertexAttribs:1,
gl_MaxVertexUniformVectors:1,
gl_MaxVaryingVectors:1,
gl_MaxVertexTextureImageUnits:1,
gl_MaxCombinedTextureImageUnits:1,
gl_MaxTextureImageUnits:1,
gl_MaxFragmentUniformVectors:1,
gl_MaxDrawBuffers:1
}
gt.builtin = {
sin:Math.sin,
cos:Math.cos,
tan:Math.tan,
asin:Math.asin,
acos:Math.acos,
atan:Math.atan,
sinh:function(a){ return (Math.exp(a) - Math.exp(-a))/2 },
cosh:function(a){ return (Math.exp(a) + Math.exp(-a))/2 },
tanh:function(a){ return (Math.exp(a) - Math.exp(-a)) / (Math.exp(a) + Math.exp(-a)) },
asinh:function(a){ return Math.log(a + Math.sqrt(a * a + 1)) },
acosh:function(a){ return Math.log(a + Math.sqrt(a * a - 1)) },
atanh:function(a){ return 0.5 * Math.log((1 + a) / (1 - a)) },
degrees:function(a){ return a*180/Math.PI },
radians:function(a){ return a*Math.PI/180 },
abs:Math.abs,
ceil:Math.ceil,
floor:Math.floor,
trunc:Math.floor,
round:Math.round,
min:Math.min,
max:Math.max,
all:function(a){ return a != 0 },
any:function(a){ return a != 0 },
not:function(a){ return a == 0 },
clamp:function(a, mi, ma) {return a < mi ? mi : a > ma ? ma : a },
roundEven:function(a) { return Math.round(a / 2) * 2 },
equal:function(a, b) { return a == b },
greaterThan:function(a, b) { return a > b },
greaterThanEqual:function(a, b) { return a >= b },
lessThan:function(a, b) { return a < b },
lessThanEqual:function(a, b) { return a <= b },
notEqual:function(a, b) { return a != b },
isinf:function(a) { return a === Number.POSITIVE_INFINITY || a === Number.NEGATIVE_INFINITY },
isnan:function(a) { return a === NaN},
sign:function(a) { return a >= 0 ? 1 : -1 },
mod:Math.mod,
pow:Math.pow,
sqrt:Math.sqrt,
exp:Math.exp,
log:Math.log,
fract:function(a) { return a - Math.floor(a) },
exp2:function(a) { return a * a },
log2:function(a){ return Math.log(a,2) },
step:function(e, a){ return a < e ? 0 : 1 },
inverse:function(a) { return 1/a },
inversesqrt:function(a){ return 1 / Math.sqrt(a) },
mix:function(a, b, f){ return (1-f) * a + f * b },
smoothstep:function(e1, e2, x){ if(x<e1) return 0; if(x>e1) return 1; x = (x-e1) / (e2-e1); return x * x * (3 - 2 * x); },
length:function(a){ return a },
modf:1,
noise:1,cross:1,distance:1,dot:1,outerProduct:1,normalize:1,
determinant:1,matrixCompMult:1,transpose:1,
dFdx:1,dFdy:1,fwidth:1,
faceforward:1,fma:1,reflect:1,refract:1,
texture2D:1,
texelFetch:1,texelFetchOffset:1,texture:1,textureGrad:1,textureGradOffset:1,
textureLod:1,textureLodOffset:1,textureOffset:1,textureProj:1,textureProjGrad:1,
textureProjGradOffset:1,textureProjLod:1,textureProjLodOffset:1,textureSize:1,
gl_FragCoord:1
}
var ci = [130,15792383,388,16444375,5,65535,6,8388564,7,15794175,8,16119260,9,16770244,10,0,1420,16772045,2,255,269,
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
var wd = ['','Alice','Blue','Antique','White','Aqua','Aquamarine','Azure','Beige','Bisque','Black','Blanched','Almond','Violet',
'Brown','Burly','Wood','Cadet','Chartreuse','Chocolate','Coral','Cornflower','Cornsilk','Crimson','Cyan','Dark','Golden',
'Rod','Gray','Green','Grey','Khaki','Magenta','Olive','Orchid','Red','Salmon','Sea','Slate','Turquoise','Darkorange',
'Deep','Pink','Sky','Dim','Dodger','Fire','Brick','Floral','Forest','Fuchsia','Gainsboro','Ghost','Gold','Yellow',
'Honey','Dew','Hot','Indian','Indigo','Ivory','Lavender','Blush','Lawn','Lemon','Chiffon','Light','Steel','Lime',
'Linen','Maroon','Medium','Marine','Purple','Spring','Midnight','Mint','Cream','Misty','Rose','Moccasin','Navajo',
'Navy','Old','Lace','Drab','Orange','Pale','Papaya','Whip','Peach','Puff','Peru','Plum','Powder','Rosy','Royal',
'Saddle','Sandy','Shell','Sienna','Silver','Snow','Tan','Teal','Thistle','Tomato','Wheat','Smoke']
var col = {}
var cv4 = {}
for(var i = 0;i < ci.length;i += 2){
var s = ''
var p = ci[i]
while(p) s = wd[p&0x7f] + s, p = p >> 7
var c = ci[i + 1]
var sl = s.toLowerCase()
col[sl] = col[s] = {r:(c>>16)/255, g:((c>>8)&0xff)/255, b:(c&0xff)/255, a:1.0}
cv4[sl] = cv4[s] = 'vec4('+((c>>16)/255)+','+(((c>>8)&0xff)/255)+','+((c&0xff)/255)+',1.)'
}
gt.col = col
gt.cv4 = cv4
function fl(i, a, o, m, s){
a[o] = parseFloat(i)
if(m <= 1) return
var x = a[o], o2 = o + s
while(m > 1) a[o2] = x, m--, o2 += s
}
function _fl(a, o, m, s) {
var v = 'fl |' + a[o] + '|'
if(m <= 1) return v
var x = a[o], o2 = o + s
while(m > 1) v += ' ' + a[o2] + '|', m--, o2 += s
return v
}
function v2(i, a, o, m, s){
var t = typeof i
if(t == 'object') a[o] = i.x, a[o + 1] = i.y
else if(t == 'array') a[o] = i[0], a[o + 1] = i[1]
else a[o] = a[o + 1] = parseFloat(i[0])
if(m <= 1) return
var x = a[o], y = a[o + 1], o2 = o + s
while(m > 1) a[o2] = x, a[o2 + 1] = y, m--, o2 += s
}
function _v2(a, o, m, s) {
var v = '|'+ a[o] + ' ' + a[o + 1] + ''
if(m <= 1) return v
var x = a[o], o2 = o + s
while(m > 1) v += '|'+ a[o2] + ' ' + a[o2 + 1] + '', m--, o2 += s
return v + '|'
}
function v3(i, a, o, m, s){
var t = typeof i
if(t == 'object') a[o] = i.x, a[o + 1] = i.y, a[o + 2] = i.z
else if(t == 'array') a[o] = i[0], a[o + 1] = i[1], a[o + 2] = i[2]
else a[o] = a[o + 1] = a[o + 2] = parseFloat(v[0])
if(m <= 1) return
var x = a[o], y = a[o + 1], z = a[o + 2], o2 = o + s
while(m > 1) a[o2] = x, a[o2 + 1] = y, a[o2 + 2] = z, n--, o2 += s
}
function _v3(a, o, m, s) {
var v = '|'+ a[o] + ' ' + a[o + 1] + ' ' + a[o + 2] + ''
if(m <= 1) return v
var x = a[o], o2 = o + s
while(m > 1) v += '|'+ a[o2] + ' ' + a[o2 + 1] + ' ' + a[o2 + 2] + '', m--, o2 += s
return v
}
function v4(i, a, o, m, s){
var t = typeof i
if(t == 'object'){
if('r' in i) a[o] = i.r, a[o + 1] = i.g, a[o + 2] = i.b, a[o + 3] = i.a
else if('h' in i) a[o] = i.x, a[o + 1] = i.y, a[o + 2] = i.x + i.w, a[o + 3] = i.y + i.h
else a[o] = i.x, a[o + 1] = i.y, a[o + 2] = i.z, a[o + 3] = i.w
} else if(t == 'array')a[o] = v[0], a[o + 1] = v[1], a[o + 2] = v[2], a[o + 3] = v[3]
else {
if(parseFloat(i) == i) a[o] = a[o + 1] = a[o + 2] = a[o + 3] = parseFloat(i)
else {
i = parseColor(i)
a[o] = i.r, a[o + 1] = i.g, a[o + 2] = i.b, a[o + 3] = i.a
}
}
if(m <= 1) return;
var x = a[o], y = a[o + 1], z = a[o + 2], w = a[o + 3], o2 = o + s
while(m > 1) a[o2] = x, a[o2 + 1] = y, a[o2 + 2] = z, a[o2 + 3] = w, m--, o2 += s
}
function _v4(a, o, m, s) {
var v = '|'+ a[o] + ' ' + a[o + 1] + ' ' + a[o + 2] + ' ' + a[o + 3] + ''
if(m <= 1) return v
var x = a[o], o2 = o + s
while(m > 1) v += '|' + a[o2] + ' ' + a[o2 + 1] + ' ' + a[o2 + 2] + ' ' + a[o2 + 3] + '', m--, o2 += s
return v
}
function co(i, a, o, m, s){
var t = typeof i;
if(t == 'number') a[o] = i
else if(t == 'object' || t == 'function'){
if('r' in i) a[o] = ((i.r*255)&0xff)<<24 | ((i.g*255)&0xff)<<16 | ((i.b*255)&0xff)<<8 | ((i.a*255)&0xff)
else a[o] = ((i.x*255)&0xff)<<24 | ((i.y*255)&0xff)<<16 | ((i.z*255)&0xff)<<8 | ((i.w*255)&0xff)
}
else if(t == 'array') a[o] = ((i[0]*255)&0xff)<<24 | ((i[1]*255)&0xff)<<16 | ((i[2]*255)&0xff)<<8 | ((i[3]*255)&0xff)
else {
var i = parseColor(i)
a[o] = ((i.r*255)&0xff)<<24 | ((i.g*255)&0xff)<<16 | ((i.b*255)&0xff)<<8 | ((i.a*255)&0xff)
}
if(m <= 1) return
var x = a[o], o2 = o + s
while(m > 1) a[o2] = x, m--, o2 += s;
}
function _co(a, o, m, s) {
var v = '|'+ a[o]
if(m <= 1) return v
var x = a[o], o2 = o + s
while(m > 1) v += '|' + a[o2], m--, o2 += s
return v
}
}
gt()
gl.flip_y = detect_y()
function parseColor(s) {
var c
if(!s.indexOf("vec4")) {
c = s.slice(5,-1).split(",")
return {r:parseFloat(c[0]), g:parseFloat(c[1]), b:parseFloat(c[2]),a:parseFloat(c[3])}
}
if(!s.indexOf("rgba")) {
c = s.slice(5,-1).split(",")
return {r:parseFloat(c[0])/255, g:parseFloat(c[1])/255, b:parseFloat(c[2])/255,a:parseFloat(c[3])}
}
if(!s.indexOf("rgb")) {
c = s.slice(4,-1).split(",")
return {r:parseFloat(c[0])/255, g:parseFloat(c[1])/255, b:parseFloat(c[2])/255,a:1.0}
}
if(c = gt.col[s])
return c
}
function packColor(c){
return (c.a*255<<24)&0xff000000 | ((c.b*255<<16)&0xff0000) | (c.g*255<<8)&0xff00 | (c.r*255)&0xff
}
gl.parseColor = parseColor
gl.packColor = packColor
gl.uniform1ic = function(i, u){ gl.uniform4f(i,(u&0xff)/255,((u>>8)&0xff)/255,((u>>16)&0xff)/255,((u>>24)&0xff)/255) }
gl.getScreenShader = function(sd){
var d = {
m:gl.TRIANGLES,
l:6,
a:{c:'vec2'},
v:'vec4(c.x * 2. -1, 1. - c.y * 2., 0, 1.)'
}
for(var k in sd) d[k] = sd[k]
var sh = gl.getShader(d)
var b = sh.$b = sh.alloc(1)
var a = b.c.a
a[0] = a[1] = a[3] = a[7] = a[10] = a[4] = 0
a[2] = a[5] = a[6] = a[8] = a[9] = a[11] = 1
b.hi = 1
return sh
}
function debug(stack){
if('__createTexture' in gl) return
var glrev = {}
for(var k in gl){
if(k == 'debug' || k == 'undebug' || k == 'eval' || k == 'regvar' ||
k == 'parseColor') continue;
if(typeof gl[k] == 'function'){
gl['__'+k] = gl[k];
function gldump(k){
var v = '__' + k
gl[k] = function(){
var s = [], t;
for(var i = 0; i<arguments.length; i++){
var a = arguments[i]
if(a && (t = glrev[a])) s.push(a+" = gl."+t+"")
else s.push(a)
}
if(stack) fn.log(new Error().stack)
var rv = gl[v].apply(gl, arguments)
console.log("gl." + k + "(" + s.join(", ") + ")" + ((rv !== undefined)?(" -> " + rv):""))
return rv
}
}
gldump(k)
} else {
glrev[gl[k]] = k;
}
}
}
gl.debug = debug
function undebug(){
if(!('__createTexture' in gl)) return
for(var k in gl){
if(k.indexOf('__') == 0){
var k2 = k.slice(2)
gl[k2] = gl[k]
delete gl[k]
}
}
}
gl.undebug = undebug
})


define('/core/ext_lib',function(require, exports){
var fn = require("./fn")
var e = exports
e.i0 = function(){ clamp(step(0, -n.a0) + (u - n.t0)/n.a0, 0, 1) }
e.i1 = function(){ clamp(step(0, -n.a1) + (u - n.t1)/n.a1, 0, 1) }
e.i2 = function(){ clamp(step(0, -n.a2) + (u - n.t2)/n.a2, 0, 1) }
e.i3 = function(){ clamp(step(0, -n.a3) + (u - n.t3)/n.a3, 0, 1) }
e.i4 = function(){ clamp(step(0, -n.a4) + (u - n.t4)/n.a4, 0, 1) }
e.i5 = function(){ clamp(step(0, -n.a5) + (u - n.t5)/n.a5, 0, 1) }
e.i6 = function(){ clamp(step(0, -n.a6) + (u - n.t6)/n.a6, 0, 1) }
e.i7 = function(){ clamp(step(0, -n.a7) + (u - n.t7)/n.a7, 0, 1) }
e.i8 = function(){ clamp(step(0, -n.a8) + (u - n.t8)/n.a8, 0, 1) }
e.i9 = function(){ clamp(step(0, -n.a9) + (u - n.t9)/n.a9, 0, 1) }
e.tsin = function(x) { (0.5 * sin(x) + 0.5) }
e.tcos = function(x) { (0.5 * cos(x) + 0.5) }
e.len = function(x) { length(x) }
e.rad = function(xp, yp){
sqrt(pow(c.x, 2 + xp) + pow(c.y, 2 + yp))
}
e.theme = function(i){
texture2D(T,vec2(i,0))
}
function img(c){
texture2D(1, w.x, w.y)
}
e.dbg = function(c){
vec4(w.x, w.y, 1-w.y, 1)
}
e._tf_ = 1
e.linx = function(){
(c.x)
}
e.liny = function(){
(c.y)
}
e.ts = function(a){
(0.5*sin(a*t)+0.5)
}
e.tc = function(a){
(0.5*cos(a*t)+0.5)
}
e.rotate = e.rot = function(r, _fw_){
_fw_(vec2((c.x-.5) * cos(r) - (c.y-.5) * sin(r), (c.x-.5) * sin(r) + (c.y-.5) * cos(r))+.5)
}
e.scale = function(x, y, _fw_){
_fw_(((c-.5)*vec2(x,y))+.5)
}
e.move = function(x, y, _fw_){
_fw_(c-vec2(x,y))
}
e.spiral = function(r, _fw_){
_fw_(vec2((c.x-.5) * cos(r*len(c-.5)) - (c.y-.5) * sin(r*len(c-.5)), (c.x-.5) * sin(r*len(c-.5)) + (c.y-.5) * cos(r*len(c-.5)))+.5)
}
e.pixel = function(x, y, _fw_){
_fw_(vec2(floor((c.x-.5)*x)/x,floor((c.y-.5)*y)/y)+.5)
}
e.normal_ = function(float_ln, float_n1, float_n2, float_n3){
return_vec3(
cross(
normalize(vec3(0,ln,n2-n1)),
normalize(vec3(ln,0,n3-n1))
)
);
}
e.mask = function(float_a, vec4_c){
return_vec4(c.x,c.y,c.z,a)
}
e.pow2 = function(float_xp, float_yp, vec2_c){
return_vec2(pow(c.x,pow(xp,1.2)), pow(c.y,pow(yp,1.2)))
}
e.hermite = function(float_t, float_p0, float_p1, float_m0, float_m1){
float_t2 = t*t;
float_t3 = t2*t;
return_float((2*t3 - 3*t2 + 1)*p0 + (t3-2*t2+t)*m0 + (-2*t3+3*t2)*p1 + (t3-t2)*m1);
}
e.normal = function(ds, ln, float_fw_vec2_c){
normal_(ln,
float_fw_vec2_c(vec2(c.x, c.y)),
float_fw_vec2_c(vec2(c.x+ds, c.y)),
float_fw_vec2_c(vec2(c.x, c.y+ds)))
}
e.img = function(a){
texture2D(a, vec2(c.x, c.y))
}
e.font = function(){
texture2D(n.b,vec2(e.z, e.w))
}
e.fontgrow = function(){
return_vec4(
(
texture2D(n.b,vec2(e.z - 'n.b'.x, e.w - 'n.b'.y)) +
texture2D(n.b,vec2(e.z, e.w - 'n.b'.y)) +
texture2D(n.b,vec2(e.z + 'n.b'.x, e.w - 'n.b'.y)) +
texture2D(n.b,vec2(e.z - 'n.b'.x, e.w)) +
texture2D(n.b,vec2(e.z, e.w)) +
texture2D(n.b,vec2(e.z + 'n.b'.x, e.w)) +
texture2D(n.b,vec2(e.z - 'n.b'.x, e.w + 'n.b'.y)) +
texture2D(n.b,vec2(e.z, e.w + 'n.b'.y)) +
texture2D(n.b,vec2(e.z+ 'n.b'.x, e.w + 'n.b'.y))
))
}
e.fontshift = function(){
texture2D(n.b,vec2(e.z- 'n.b'.x, e.w - 'n.b'.y))
}
e.blend = function(vec4_a, vec4_b){
return_vec4( a.xyz * (1-b.w) + (b.w)*b.xyz, max(a.w,b.w) )
}
e.subpix = function(vec4_c, vec4_fg, vec4_bg){
float_a(3.2*(t.subpx).w)
return_vec4(vec4(pow(c.r * pow(fg.r, a) + (1-c.r) * pow(bg.r, a), 1/a),
pow(c.g * pow(fg.g, a) + (1-c.g) * pow(bg.g, a), 1/a),
pow(c.b * pow(fg.b, a) + (1-c.b) * pow(bg.b, a), 1/a),
c.a*fg.a)*1.0)
}
e.sfont = function(vec4_fg, vec4_bg){
vec4_c( texture2D(n.b, vec2(e.z, e.w)) )
float_a(3.2*(t.subpx).w)
return_vec4(vec4(pow(c.r * pow(fg.r, a) + (1-c.r) * pow(bg.r, a), 1/a),
pow(c.g * pow(fg.g, a) + (1-c.g) * pow(bg.g, a), 1/a),
pow(c.b * pow(fg.b, a) + (1-c.b) * pow(bg.b, a), 1/a),
c.a*fg.a))
}
e.sfont2 = function(vec4_fg, vec4_bg, float_a){
vec4_c( texture2D(n.b, vec2(e.z, e.w)) )
return_vec4(vec4(pow(c.r * pow(fg.r, a) + (1-c.r) * pow(bg.r, a), 1/a),
pow(c.g * pow(fg.g, a) + (1-c.g) * pow(bg.g, a), 1/a),
pow(c.b * pow(fg.b, a) + (1-c.b) * pow(bg.b, a), 1/a),
c.a*fg.a))
}
e.alpha = function(vec4_i, float_a){
return_vec4(i.x,i.y,i.z,a)
}
e.mix = function(){
var a = arguments
var l = a.length
var s = 'vec4 #('
for(var i = 0;i < l - 1; i++){
s+= (i?',vec4 a':'vec4 a')+i
}
s += ',float f){\n return '
for(var i = 0; i < l - 2; i++){
s += 'mix(a' + i + ','
if(i == l - 3) {
s += 'a'+(i+1)
while(i >= 0) {
s += ',clamp(f' + (l>3 ? '*'+(l - 2)+'.-'+(i)+'.' : '')+ ',0.,1.))'
i--
}
break
}
}
s += ';\n}\n'
return s
}
e.permute1 = function(float_x) {
return_float( mod((34.0 * x + 1.0) * x, 289.0) );
}
e.permute3 = function(vec3_x) {
return_vec3( mod((34.0 * x + 1.0) * x, 289.0) );
}
e.permute4 = function(vec4_x) {
return_vec4( mod((34.0 * x + 1.0) * x, 289.0) );
}
e.isqrtT1 = function(float_r){
return_float(1.79284291400159 - 0.85373472095314 * r);
}
e.isqrtT4 = function(vec4_r){
return_vec4(1.79284291400159 - 0.85373472095314 * r);
}
e.snoise2 = function(vec2_v){
vec4_C = vec4(0.211324865405187,0.366025403784439,-0.577350269189626,0.024390243902439);
vec2_i = floor(v + dot(v, C.yy) );
vec2_x0 = v - i + dot(i, C.xx);
vec2_i1;
i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
vec4_x12 = x0.xyxy + C.xxzz;
x12.xy -= i1;
i = mod(i, 289.0);
vec3_p = permute3(permute3(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0 ));
vec3_m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
m = m*m;
m = m*m;
vec3_x = 2.0 * fract(p * C.www) - 1.0;
vec3_h = abs(x) - 0.5;
vec3_ox = floor(x + 0.5);
vec3_a0 = x - ox;
m *= (1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h ));
vec3_g;
g.x = a0.x * x0.x + h.x * x0.y;
g.yz = a0.yz * x12.xz + h.yz * x12.yw;
return_float(130.0 * dot(m, g));
}
e.snoise3 = function(vec3_v){
vec2_C = vec2(1.0/6.0, 1.0/3.0);
vec4_D = vec4(0.0, 0.5, 1.0, 2.0);
vec3_i = floor(v + dot(v, C.yyy));
vec3_x0 = v - i + dot(i, C.xxx);
vec3_g = step(x0.yzx, x0.xyz);
vec3_l = 1.0 - g;
vec3_i1 = min(g.xyz, l.zxy);
vec3_i2 = max(g.xyz, l.zxy);
vec3_x1 = x0 - i1 + 1.0 * C.xxx;
vec3_x2 = x0 - i2 + 2.0 * C.xxx;
vec3_x3 = x0 - 1. + 3.0 * C.xxx;
i = mod(i, 289.0);
vec4_p = permute4(permute4(permute4(
i.z + vec4(0.0, i1.z, i2.z, 1.0))
+ i.y + vec4(0.0, i1.y, i2.y, 1.0))
+ i.x + vec4(0.0, i1.x, i2.x, 1.0));
float_n_ = 1.0/7.0;
vec3_ns = n_ * D.wyz - D.xzx;
vec4_j = p - 49.0 * floor(p * ns.z *ns.z);
vec4_x_ = floor(j * ns.z);
vec4_y_ = floor(j - 7.0 * x_);
vec4_x = x_ * ns.x + ns.yyyy;
vec4_y = y_ * ns.x + ns.yyyy;
vec4_h = 1.0 - abs(x) - abs(y);
vec4_b0 = vec4( x.xy, y.xy );
vec4_b1 = vec4( x.zw, y.zw );
vec4_s0 = floor(b0)*2.0 + 1.0;
vec4_s1 = floor(b1)*2.0 + 1.0;
vec4_sh = -step(h, vec4(0.0));
vec4_a0 = b0.xzyw + s0.xzyw*sh.xxyy;
vec4_a1 = b1.xzyw + s1.xzyw*sh.zzww;
vec3_p0 = vec3(a0.xy,h.x);
vec3_p1 = vec3(a0.zw,h.y);
vec3_p2 = vec3(a1.xy,h.z);
vec3_p3 = vec3(a1.zw,h.w);
vec4_norm = isqrtT4(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
p0 *= norm.x;
p1 *= norm.y;
p2 *= norm.z;
p3 *= norm.w;
vec4_m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
m = m * m;
return_float(42.0 * dot( m*m, vec4( dot(p0,x0), dot(p1,x1),
dot(p2,x2), dot(p3,x3) ) ));
}
e.snoise4_g = function(float_j, vec4_ip)
{
vec4_p;
p.xyz = floor( fract (vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
p.w = 1.5 - dot(abs(p.xyz), vec3(1.0,1.0,1.0));
vec4_s = vec4(lessThan(p, vec4(0.0)));
p.xyz = p.xyz + (s.xyz*2.0 - 1.0) * s.www;
return_vec4(p);
}
e.snoise4 = function(vec4_v)
{
vec4_C = vec4(0.138196601125011,0.276393202250021,0.414589803375032,-0.447213595499958);
vec4_i = floor(v + dot(v, vec4(0.309016994374947451)) );
vec4_x0 = v - i + dot(i, C.xxxx);
vec4_i0;
vec3_isX = step( x0.yzw, x0.xxx );
vec3_isYZ = step( x0.zww, x0.yyz );
i0.x = isX.x + isX.y + isX.z;
i0.yzw = 1.0 - isX;
i0.y += isYZ.x + isYZ.y;
i0.zw += 1.0 - isYZ.xy;
i0.z += isYZ.z;
i0.w += 1.0 - isYZ.z;
vec4_i3 = clamp( i0, 0.0, 1.0 );
vec4_i2 = clamp( i0-1.0, 0.0, 1.0 );
vec4_i1 = clamp( i0-2.0, 0.0, 1.0 );
vec4_x1 = x0 - i1 + C.xxxx;
vec4_x2 = x0 - i2 + C.yyyy;
vec4_x3 = x0 - i3 + C.zzzz;
vec4_x4 = x0 + C.wwww;
i = mod(i, 289.0 );
float_j0 = permute1( permute1( permute1( permute1(i.w) + i.z) + i.y) + i.x);
vec4_j1 = permute4( permute4( permute4( permute4(
i.w + vec4(i1.w, i2.w, i3.w, 1.0 ))
+ i.z + vec4(i1.z, i2.z, i3.z, 1.0 ))
+ i.y + vec4(i1.y, i2.y, i3.y, 1.0 ))
+ i.x + vec4(i1.x, i2.x, i3.x, 1.0 ));
vec4_ip = vec4(1.0/294.0, 1.0/49.0, 1.0/7.0, 0.0) ;
vec4_p0 = snoise4_g(j0, ip);
vec4_p1 = snoise4_g(j1.x, ip);
vec4_p2 = snoise4_g(j1.y, ip);
vec4_p3 = snoise4_g(j1.z, ip);
vec4_p4 = snoise4_g(j1.w, ip);
vec4_nr = isqrtT4(vec4(dot(p0,p0), dot(p1,p1), dot(p2, p2), dot(p3,p3)));
p0 *= nr.x;
p1 *= nr.y;
p2 *= nr.z;
p3 *= nr.w;
p4 *= isqrtT1(dot(p4,p4));
vec3_m0 = max(0.6 - vec3(dot(x0,x0), dot(x1,x1), dot(x2,x2)), 0.0);
vec2_m1 = max(0.6 - vec2(dot(x3,x3), dot(x4,x4)), 0.0);
m0 = m0 * m0;
m1 = m1 * m1;
return_float(49.0 * (dot(m0*m0, vec3(dot( p0, x0 ), dot(p1, x1), dot(p2, x2)))
+ dot(m1*m1, vec2( dot(p3, x3), dot(p4, x4)))));
}
e.cell = function(vec2_v){
return_float(cell3(vec3(v.x, v.y,0)))
}
e.cell2 = function(vec3_P){
float_K = 0.142857142857;
float_Ko = 0.428571428571;
float_K2 = 0.020408163265306;
float_Kz = 0.166666666667;
float_Kzo = 0.416666666667;
float_ji = 0.8;
vec3_Pi = mod(floor(P), 289.0);
vec3_Pf = fract(P);
vec4_Pfx = Pf.x + vec4(0.0, -1.0, 0.0, -1.0);
vec4_Pfy = Pf.y + vec4(0.0, 0.0, -1.0, -1.0);
vec4_p = permute4(Pi.x + vec4(0.0, 1.0, 0.0, 1.0));
p = permute4(p + Pi.y + vec4(0.0, 0.0, 1.0, 1.0));
vec4_p1 = permute4(p + Pi.z);
vec4_p2 = permute4(p + Pi.z + vec4(1.0));
vec4_ox1 = fract(p1*K) - Ko;
vec4_oy1 = mod(floor(p1*K), 7.0)*K - Ko;
vec4_oz1 = floor(p1*K2)*Kz - Kzo;
vec4_ox2 = fract(p2*K) - Ko;
vec4_oy2 = mod(floor(p2*K), 7.0)*K - Ko;
vec4_oz2 = floor(p2*K2)*Kz - Kzo;
vec4_dx1 = Pfx + ji*ox1;
vec4_dy1 = Pfy + ji*oy1;
vec4_dz1 = Pf.z + ji*oz1;
vec4_dx2 = Pfx + ji*ox2;
vec4_dy2 = Pfy + ji*oy2;
vec4_dz2 = Pf.z - 1.0 + ji*oz2;
vec4_d1 = dx1 * dx1 + dy1 * dy1 + dz1 * dz1;
vec4_d2 = dx2 * dx2 + dy2 * dy2 + dz2 * dz2;
vec4_d= min(d1,d2);
d2 = max(d1,d2);
d.xy = (d.x < d.y) ? d.xy : d.yx;
d.xz = (d.x < d.z) ? d.xz : d.zx;
d.xw = (d.x < d.w) ? d.xw : d.wx;
d.yzw = min(d.yzw, d2.yzw);
d.y = min(d.y, d.z);
d.y = min(d.y, d.w);
d.y = min(d.y, d2.x);
return_vec2(sqrt(d.xy));
}
e.cell3 = function(vec3_P){
float_K = 0.142857142857;
float_Ko = 0.428571428571;
float_K2 = 0.020408163265306;
float_Kz = 0.166666666667;
float_Kzo = 0.416666666667;
float_ji = 1.0;
vec3_Pi = mod(floor(P), 289.0);
vec3_Pf = fract(P) - 0.5;
vec3_Pfx = Pf.x + vec3(1.0, 0.0, -1.0);
vec3_Pfy = Pf.y + vec3(1.0, 0.0, -1.0);
vec3_Pfz = Pf.z + vec3(1.0, 0.0, -1.0);
vec3_p = permute3(Pi.x + vec3(-1.0, 0.0, 1.0));
vec3_p1 = permute3(p + Pi.y - 1.0);
vec3_p2 = permute3(p + Pi.y);
vec3_p3 = permute3(p + Pi.y + 1.0);
vec3_p11 = permute3(p1 + Pi.z - 1.0);
vec3_p12 = permute3(p1 + Pi.z);
vec3_p13 = permute3(p1 + Pi.z + 1.0);
vec3_p21 = permute3(p2 + Pi.z - 1.0);
vec3_p22 = permute3(p2 + Pi.z);
vec3_p23 = permute3(p2 + Pi.z + 1.0);
vec3_p31 = permute3(p3 + Pi.z - 1.0);
vec3_p32 = permute3(p3 + Pi.z);
vec3_p33 = permute3(p3 + Pi.z + 1.0);
vec3_ox11 = fract(p11*K) - Ko;
vec3_oy11 = mod(floor(p11*K), 7.0)*K - Ko;
vec3_oz11 = floor(p11*K2)*Kz - Kzo;
vec3_ox12 = fract(p12*K) - Ko;
vec3_oy12 = mod(floor(p12*K), 7.0)*K - Ko;
vec3_oz12 = floor(p12*K2)*Kz - Kzo;
vec3_ox13 = fract(p13*K) - Ko;
vec3_oy13 = mod(floor(p13*K), 7.0)*K - Ko;
vec3_oz13 = floor(p13*K2)*Kz - Kzo;
vec3_ox21 = fract(p21*K) - Ko;
vec3_oy21 = mod(floor(p21*K), 7.0)*K - Ko;
vec3_oz21 = floor(p21*K2)*Kz - Kzo;
vec3_ox22 = fract(p22*K) - Ko;
vec3_oy22 = mod(floor(p22*K), 7.0)*K - Ko;
vec3_oz22 = floor(p22*K2)*Kz - Kzo;
vec3_ox23 = fract(p23*K) - Ko;
vec3_oy23 = mod(floor(p23*K), 7.0)*K - Ko;
vec3_oz23 = floor(p23*K2)*Kz - Kzo;
vec3_ox31 = fract(p31*K) - Ko;
vec3_oy31 = mod(floor(p31*K), 7.0)*K - Ko;
vec3_oz31 = floor(p31*K2)*Kz - Kzo;
vec3_ox32 = fract(p32*K) - Ko;
vec3_oy32 = mod(floor(p32*K), 7.0)*K - Ko;
vec3_oz32 = floor(p32*K2)*Kz - Kzo;
vec3_ox33 = fract(p33*K) - Ko;
vec3_oy33 = mod(floor(p33*K), 7.0)*K - Ko;
vec3_oz33 = floor(p33*K2)*Kz - Kzo;
vec3_dx11 = Pfx + ji*ox11;
vec3_dy11 = Pfy.x + ji*oy11;
vec3_dz11 = Pfz.x + ji*oz11;
vec3_dx12 = Pfx + ji*ox12;
vec3_dy12 = Pfy.x + ji*oy12;
vec3_dz12 = Pfz.y + ji*oz12;
vec3_dx13 = Pfx + ji*ox13;
vec3_dy13 = Pfy.x + ji*oy13;
vec3_dz13 = Pfz.z + ji*oz13;
vec3_dx21 = Pfx + ji*ox21;
vec3_dy21 = Pfy.y + ji*oy21;
vec3_dz21 = Pfz.x + ji*oz21;
vec3_dx22 = Pfx + ji*ox22;
vec3_dy22 = Pfy.y + ji*oy22;
vec3_dz22 = Pfz.y + ji*oz22;
vec3_dx23 = Pfx + ji*ox23;
vec3_dy23 = Pfy.y + ji*oy23;
vec3_dz23 = Pfz.z + ji*oz23;
vec3_dx31 = Pfx + ji*ox31;
vec3_dy31 = Pfy.z + ji*oy31;
vec3_dz31 = Pfz.x + ji*oz31;
vec3_dx32 = Pfx + ji*ox32;
vec3_dy32 = Pfy.z + ji*oy32;
vec3_dz32 = Pfz.y + ji*oz32;
vec3_dx33 = Pfx + ji*ox33;
vec3_dy33 = Pfy.z + ji*oy33;
vec3_dz33 = Pfz.z + ji*oz33;
vec3_d11 = dx11 * dx11 + dy11 * dy11 + dz11 * dz11;
vec3_d12 = dx12 * dx12 + dy12 * dy12 + dz12 * dz12;
vec3_d13 = dx13 * dx13 + dy13 * dy13 + dz13 * dz13;
vec3_d21 = dx21 * dx21 + dy21 * dy21 + dz21 * dz21;
vec3_d22 = dx22 * dx22 + dy22 * dy22 + dz22 * dz22;
vec3_d23 = dx23 * dx23 + dy23 * dy23 + dz23 * dz23;
vec3_d31 = dx31 * dx31 + dy31 * dy31 + dz31 * dz31;
vec3_d32 = dx32 * dx32 + dy32 * dy32 + dz32 * dz32;
vec3_d33 = dx33 * dx33 + dy33 * dy33 + dz33 * dz33;
vec3_d1a = min(d11, d12);
d12 = max(d11, d12);
d11 = min(d1a, d13);
d13 = max(d1a, d13);
d12 = min(d12, d13);
vec3_d2a = min(d21, d22);
d22 = max(d21, d22);
d21 = min(d2a, d23);
d23 = max(d2a, d23);
d22 = min(d22, d23);
vec3_d3a = min(d31, d32);
d32 = max(d31, d32);
d31 = min(d3a, d33);
d33 = max(d3a, d33);
d32 = min(d32, d33);
vec3_da = min(d11, d21);
d21 = max(d11, d21);
d11 = min(da, d31);
d31 = max(da, d31);
d11.xy = (d11.x < d11.y) ? d11.xy : d11.yx;
d11.xz = (d11.x < d11.z) ? d11.xz : d11.zx;
d12 = min(d12, d21);
d12 = min(d12, d22);
d12 = min(d12, d31);
d12 = min(d12, d32);
d11.yz = min(d11.yz,d12.xy);
d11.y = min(d11.y,d12.z);
d11.y = min(d11.y,d11.z);
return_vec2(sqrt(d11.xy));
}
return e
})


define('/core/ui_draw',function(require, exports, module){
var fn = require("./fn")
module.exports = function(ui){
function group(g){
var n = new ui.Node()
n._t = group
n.$$ = function(){}
n.l = 1
if(g) n.set(g)
return n
}
ui.group = group
function rect(g){
var n = new ui.Node()
n._t = rect
n.$$ = function(){
var sh = ui.gl.getShader(rect.sd, n)
ui.alloc(n, sh)
rect.set(n._v.c, n._s, 0, 1)
n._v.up = 1
ui.update(n)
}
if(g) n.set(g)
return n
}
rect.sd = ui.shader({
a:{c:'vec2'},
v:'vec4(((n._x+c.x*n._w+l.x)/s.x)*2.-1.,1.-((n._y+c.y*n._h+l.y)/s.y)*2.,0,1.)',
f:'green',
m:ui.gl.TRIANGLES,
l:6
})
rect.set = function(v, i, z, d){
var s = v.s
var o = i * s * v.l
var a = v.a
a[o] = z, a[o+1] = z, o += s
a[o] = d, a[o+1] = z, o += s
a[o] = z, a[o+1] = d, o += s
a[o] = d, a[o+1] = z, o += s
a[o] = d, a[o+1] = d, o += s
a[o] = z, a[o+1] = d, o += s
}
rect.clear = function(n){
rect.set(n._v.c, n._s, 0, 0)
n._v.up = 1
}
rect.drawer = function(n){
n.l = 1
var sd = ui.gl.getShader(rect.sd, n)
var b = sd.alloc(1)
rect.set(b.c, 0, 0, 1)
b.hi = 1
sd.rect = function(x, y, w, h){
sd.use()
sd.N_x(x)
sd.N_y(y)
sd.N_w(w)
sd.N_h(h)
sd.set(ui.uniforms)
sd.draw(b)
}
return sd
}
ui.rect = rect
function text(g){
var n = new ui.Node()
n._t = text
n.$$ = function(){
var ol = n._n
var t = n.t
var m = t && t.length || 0
l = 0
for(var i = 0; i < m; i++){
var c = t.charCodeAt(i)
if(c>32) l++
}
n._n = l
n.w = 0
n.h = 0
var sh = ui.gl.getShader(text.sd, n)
ui.alloc(n, sh)
if(!n._v) return
var v = n._v.e
var a = v.a
var s = v.s
var o = n._s * s * v.l
var b = n.b
if(!b) throw new Error("missing font on textnode")
var floor = Math.floor
var x = 0
var y = 0
var w = 0
for(var i = 0;i < m;i++){
var c = t.charCodeAt(i)
if(c > 32){
var d = c - b.s
var wn = b.m[d] + 2*b.xp
var x2 = x + (wn / ui.gl.ratio)
var y2 = y + (b.g / ui.gl.ratio)
var tx1 = ((d % b.b) * b.g - b.xp) / b.w
var ty1 = (floor(d / b.b) * b.g) / b.h
var tx2 = tx1 + (wn / (b.w))
var ty2 = ty1 + (b.g / b.h)
a[o] = x, a[o+1] = y, a[o+2] = tx1, a[o+3] = ty1, o += s
a[o] = x2, a[o+1] = y, a[o+2] = tx2, a[o+3] = ty1, o += s
a[o] = x, a[o+1] = y2, a[o+2] = tx1, a[o+3] = ty2, o += s
a[o] = x2, a[o+1] = y, a[o+2] = tx2, a[o+3] = ty1, o += s
a[o] = x2, a[o+1] = y2, a[o+2] = tx2, a[o+3] = ty2, o += s
a[o] = x, a[o+1] = y2, a[o+2] = tx1, a[o+3] = ty2, o += s
x += b.c[d] / ui.gl.ratio
}
else if(c == 10) y += b.g/ ui.gl.ratio , x = 0
else if(c == 32) x += b.m[0]/ ui.gl.ratio
else if(c == 9) x += 3 * b.m[0]/ ui.gl.ratio
if(x > w) w = x
}
n.w = ui.text.pos(n, m).x, n.h = y + b.p/ ui.gl.ratio
n._v.up = 1
if(n._v.c) text.set(n._v.c, n._s, l, 0, 1)
ui.update(n)
}
if(g) n.set(g)
return n
}
text.clear = function(n){
text.set(n._v.e, n._s, n._i, 0, 0)
n._v.up = 1
}
text.set = function(v, i, l, z, d){
var a = v.a
var s = v.s
var o = i * s * v.l
for(var j = 0;j < l; j++){
a[o] = z, a[o + 1] = z, o += s
a[o] = d, a[o + 1] = z, o += s
a[o] = z, a[o + 1] = d, o += s
a[o] = d, a[o + 1] = z, o += s
a[o] = d, a[o + 1] = d, o += s
a[o] = z, a[o + 1] = d, o += s
}
}
text.sd = ui.shader({
a: {c: 'vec2', e: 'vec4'},
v:'vec4(((n._x+e.x+l.x)/s.x)*2.-1.,1.-((n._y+e.y+l.y)/s.y)*2.,0,1.)',
f:'font',
l:6,
m:ui.gl.TRIANGLES
})
text.pos = function(n, l, cb){
if(!n.t) return {x:0,y:0}
if(l == -1) l = n.t.length
var b = n.b
var x = 0
var y = 0
var w = 0
var t = n.t
var ratio = ui.gl.ratio
for(var i = 0;i < l; i++){
if(cb && cb(i, x / ratio, y / ratio)) break
var c = t.charCodeAt(i)
if(c > 32){
var d = c - b.s
w = b.m[d] + 2*b.xp
x += b.c[d]
} else if(c == 10) y += b.p, x = 0
else if(c == 32) x += b.m[0]
else if(c == 9) x += 3 * b.m[0]
}
return {x:x / ratio, y:y / ratio}
}
ui.text = text
function edge(g){
var n = new ui.Node()
n._t = edge
n.x_ = 'n.x + n.mx'
n.y_ = 'n.y + n.my'
n.w_ = 'n.w - 2*n.mx'
n.h_ = 'n.h - 2*n.my'
n.$$ = function(){
var sh = ui.gl.getShader(edge.sd, n)
ui.alloc(n, sh)
if(!n._v)return
var v = n._v.e
var a = v.a
var s = v.s
var o = n._s * v.l * s
a[o] = 0, a[o+1] = 0, a[o+2] = 0, a[o+3] = 0, o += s
a[o] = 1, a[o+1] = 0, a[o+2] = 0, a[o+3] = 0, o += s
a[o] = 1, a[o+1] = 1, a[o+2] = 0, a[o+3] = 0, o += s
a[o] = 0, a[o+1] = 1, a[o+2] = 0, a[o+3] = 0, o += s
a[o] = 0, a[o+1] = 0, a[o+2] = 1, a[o+3] = 1, o += s
a[o] = 1, a[o+1] = 0, a[o+2] =-1, a[o+3] = 1, o += s
a[o] = 1, a[o+1] = 1, a[o+2] =-1, a[o+3] =-1, o += s
a[o] = 0, a[o+1] = 1, a[o+2] = 1, a[o+3] =-1, o += s
var v = n._v.i
var a = v.a
var o = n._s * v.i
var i = n._s * v.l
a[o++] = i + 0, a[o++] = i + 4, a[o++] = i + 1
a[o++] = i + 1, a[o++] = i + 4, a[o++] = i + 5
a[o++] = i + 5, a[o++] = i + 6, a[o++] = i + 1
a[o++] = i + 1, a[o++] = i + 6, a[o++] = i + 2
a[o++] = i + 7, a[o++] = i + 3, a[o++] = i + 6
a[o++] = i + 6, a[o++] = i + 3, a[o++] = i + 2
a[o++] = i + 0, a[o++] = i + 3, a[o++] = i + 4
a[o++] = i + 4, a[o++] = i + 3, a[o++] = i + 7
var v = n._v.c
if(v){
var a = v.a
var s = v.s
var o = n._s * v.l * s
a[o] = 0, a[o+1] = 0, o += s
a[o] = 1, a[o+1] = 0, o += s
a[o] = 0, a[o+1] = 0, o += s
a[o] = 1, a[o+1] = 0, o += s
a[o] = 0, a[o+1] = 1, o += s
a[o] = 1, a[o+1] = 1, o += s
a[o] = 0, a[o+1] = 1, o += s
a[o] = 1, a[o+1] = 1, o += s
}
n._v.clean = false
ui.update(n)
}
if(g) n.set(g)
return n
}
edge.sd = ui.shader({
a: {c: 'vec2', e: 'vec4'},
v: 'vec4(((n._x+e.x*n._w+e.z*n.mx+l.x)/s.x)*2.-1.,1.-((n._y+e.y*n._h+e.w*n.my+l.y)/s.y)*2.,0,1.)',
f: 'vec4(0,1.,0,1.)',
l:8,
i:24,
m:ui.gl.TRIANGLES
})
ui.edge = edge
}
})

define('/core/ui',function(require){
var gl = require("./gl")
var fn = require("./fn")
var el = require("./ext_lib")
if(!gl) return { load:function(){} }
var ui = {}
ui.gl = gl
ui.load = gl.load
function ui(){}
var ex = {
x : 'x',
y : 'y',
z : 'z',
w : 'width',
h : 'height',
d : 'depth',
i : 'in',
o : 'out',
p : 'press',
m : 'move',
r : 'release',
s : 'scroll',
k : 'key',
j : 'joy',
u : 'doubleclick',
c : 'click or change',
n : 'nodeselect',
v : 'vertex',
f : 'frag',
b : 'bitmap',
t : 'text',
q : 'quick',
_ : 'destructor',
e : 'extension lib',
l : 'layer draw',
g : 'group draw',
a : 'cameramatrix',
_g : 'groupid',
_p : 'parent',
_c : 'child',
_u : 'up',
_d : 'down',
_l : 'left',
_r : 'right',
_f : 'front',
_b : 'back',
_z : 'zorder',
_e : 'end',
_t : 'type',
_q : 'qbuf',
_v : 'vb',
_s : 'slot',
_o : 'old slot lut',
_k : 'old vb lut',
_i : 'alloced slots',
_n : 'numslots',
_a : 'all child deps',
_j : 'pushpopstack',
__ : 'factory',
a0 : 'animtime0',
e0 : 'endevent0',
i0 : 'interpolator0',
_x : 'absx',
_y : 'absy',
_w : 'absw',
_h : 'absh',
_m : 'modal',
x_ : 'padded x',
y_ : 'padded y',
w_ : 'padded w',
h_ : 'padded h',
m_ : 'matrix',
a_ : 'added',
i_ : 'inserted',
r_ : 'removed',
v_ : 'view changed',
f_ : 'focussed',
u_ : 'unfocussed',
s_ : 'selected',
d_ : 'deselected',
c_ : 'clicked',
n_ : 'normal',
_h_ : 'horizontal scrollbar',
_v_ : 'vertical scrollbar',
_0 : 'listc',
_1 : 'list_c l',
_2 : 'list_c r',
_3 : 'list_i l',
_4 : 'list_i r',
_5 : 'list_t l',
_6 : 'list_t r',
_7 : 'alias key',
_8 : 'alias object',
t_ : 'starttime',
n_ : 'old width',
o_ : 'old height',
g_ : 'old geometry'
}
var defaults = {
i0 : el.i0,
i1 : el.i1,
i2 : el.i2,
i3 : el.i3,
i4 : el.i4,
i5 : el.i5,
i6 : el.i6,
i7 : el.i7,
i8 : el.i8,
i9 : el.i9,
x_ : 'n._x',
y_ : 'n._y',
w_ : 'n._w',
h_ : 'n._h',
x : 0,
y : 0,
w : 'p.w_ - n.x',
h : 'p.h_ - n.y',
_x : 'p.x_ + n.x',
_y : 'p.y_ + n.y',
_w : 'n.w',
_h : 'n.h',
t : ''
}
var node_vs = {};
function Node(){
this._p = ui.p
if(this._p) l_i.add(this)
}
(function(p){
p.set = function(g){
var t = typeof g
if(t == 'object') for(var k in g) this[k] = g[k]
else if(t == 'function') {
var p = ui.p
ui.p = this
g(this)
ui.p = p
}
if(this._9){
this.$$()
}
}
p.eval = function(k){
return gl.eval(this, this[k], uni, el)
}
p.alias = function(k, o, setCb){
this.__defineSetter__(k, function(v){
o[k] = v
if(setCb) setCb()
})
this.__defineGetter__(k, function(){
return o[k]
})
}
p.has = function(k){
return '$' + k in this
}
p.calc = function(k, c){
this.__defineSetter__(k, function(v){
delete this[k]
this[k] = v
})
this.__defineGetter__(k, function(){
return c()
})
}
p.show = function(){
if(!this.$l) return
this.l = this.$l
delete this.$l
ui.redraw(this)
}
p.hide = function(){
if(this.$l) return
this.$l = this.l
this.l = -1
ui.redraw(this)
}
function gs(k){
var pt = '$'+k
p.__defineSetter__(k, function(v){
if(!(this._g in group)) group[this._g = parseInt(groupRnd() * 0xffffff)|0xff000000] = this
this[pt] = v
})
p.__defineGetter__(k, function(){ return this[pt] })
}
gs('i')
gs('m')
gs('o')
gs('p')
gs('r')
gs('s')
function setvb(n, k, f){
if(!n._v) return
var v
if(v = n._v[k]){
var nm = n._i || 1
v.t.w(f, v.a, n._s * v.s * v.l, v.l * nm, v.s)
n._v.up = 1
}
if(n._a) for(var m in n._a){
ui.update(n._a[m])
}
}
function as(k){
var pk = '$'+k
var nk = 'N'+k
node_vs[k] = 1
p.__defineSetter__(k, function(v){
if(!l_a[k]){
var i = l_a_i[k]
l_a[k] = fn.list('l' + i, 'r' + i)
l_a[k].l = 'l' + i
l_a[k].r = 'r' + i
l_a[k].e = 'e' + i
l_a[k].t = 't' + i
}
this[l_a[k].t] = uni.u
if(!l_a[k].has(this)) l_a[k].add(this)
this[pk] = v
setvb(this, nk, v)
})
p.__defineGetter__(k, function(){ return this[pk] || 0 })
}
function vs(k, d){
var pk = '$'+k
var nk = 'N'+k
node_vs[k] = 1
p.__defineSetter__(k, function(v){
if(this._9){
var t = typeof this[pk]
var y = typeof v
this[pk] = v
if(t == y && y == 'number'){
setvb(this, nk, v)
} else {
this.$$()
}
} else this[pk] = v
})
p.__defineGetter__(k, function(){
if(pk in this) return this[pk]
if(k in defaults) return defaults[k]
return d
})
}
node_vs['_g'] = 1
vs('f')
vs('t')
vs('x')
vs('y')
vs('w')
vs('h')
vs('x_')
vs('y_')
vs('w_')
vs('h_')
vs('_x')
vs('_y')
vs('_w')
vs('_h')
gl.regvar = function(k){
if(k in node_vs) return
vs(k, 0)
}
for(var i = 0;i<10;i++){
as('a'+i)
vs('t'+i, 0)
vs('i'+i, 0)
}
})(Node.prototype)
var theme = gl.createTexture()
ui.t = theme
ui.theme = function(o){
gl.palette(o, theme)
}
ui.shader = function(p){
var d = {
e: el,
d: {
'P': '3.14159265358979323846264',
'E': '2.71828182845904523536029'
},
u: {
T: 'sampler2D',
l: 'vec2',
s: 'vec2',
m: 'vec2',
t: 'float',
u: 'float'
},
y: {
N_b:'sampler2D',
N_g:'ucol'
},
x:{
f : {
t : 'vec2',
c : gl.ratio>1?'vec2(gl_FragCoord.x/2, s.y - gl_FragCoord.y/2)':'vec2(gl_FragCoord.x, s.y - gl_FragCoord.y)'
}
},
s: {
_: 0,
g: function(e){ n._g }
},
t: theme
}
for(var k in p){
if(typeof p[k] == 'object'){
if(!(k in d)) d[k] = {}
var s = d[k]
var u = p[k]
for(var j in u) s[j] = u[j];
}else d[k] = p[k]
}
return d
}
var l_i = fn.list('_3','_4')
var l_t = fn.list('_5','_6')
var l_a = {}
var l_a_i = {}
for(var i = 0;i < 10; i++) l_a_i['a'+i] = i
var group = {}
var groupRnd = fn.mt()
var groupId = 1
var root = new Node()
root.l = 1
root.x = 0
root.y = 0
root.w = 's.x'
root.h = 's.y'
root._m = 1
root._x = 0
root._y = 0
root._w = 's.x'
root._h = 's.y'
ui.p = root
ui.Node = Node
function initnew(){
var t = l_i.len && fn.dt()
var n = l_i.first()
while(n){
if(n._b){
var p = n._b
if(p._f) p._f._u = n, n._d = p._f
p._f = n
delete n._p
} else if(n._p){
var p = n._p
if(p._e){
n._u = p._e, p._e = p._e._d = n
} else p._c = p._e = n
if(p.a_) p.a_(n)
}
if(!n._z){
var p = n._p || n._b
var z = 0
while(p && !p.l){ p = p._p || p._b; z++}
n._z = z
}
if(n.l){
var p = n._p || n._b
while(p && !p.l) p = p._p || p._b
if(!p._0) p._0 = fn.list('_1', '_2')
p._0.sorted(n,'_z')
}
if(!n._g){
var p = n._p || n._b
while(p){
if(p._g){
n._g = p._g
break
}
p = p._p || p._b
}
}
n.$$()
n._9 = 1
n = n._4
}
l_i.drop()
if(t) t.log('initnew: ')
}
ui.update = function(n){
if(!n._v) return
var vt = n._v.$vt
var nm = n._i || 1
for(var i in vt){
var v = n._v[i]
var ln = v.n
if(ln){
var d = ln.d
var k = ln.k
var p = n
while(d) p = p._p || p._b, d--
if(p != n){
if(!p._a) p._a = {}
p._a[n] = n
}
if(k in p) v.t.w(p[k], v.a, n._s * v.s * v.l, v.l * nm, v.s)
}
}
n._v.up = 1
}
ui.alloc = function(n, sh){
if(sh.$ud.t){
if(!l_t.has(n)) l_t.add(n)
gl.anim(ui.draw)
}
else if(l_t.has(n)) l_t.rm(n)
var v
var s = -1
var m = '_n' in n ? n._n : 1
var tn = sh.$tn
var id = sh.$id
if(tn){
for(var k in tn){
var l = tn[k]
var d = l.ld
var p = n
while(d>0) p = p._p || p._b, d--
p = p[l.k]
id += '|' + (p && p.id || 0)
}
}
if(n._v && n._i != m){
freenode(n)
}
if(!m) return
if(n._v){
if(n._v.$id != id){
if(n._s == n._v.hi - m || n._s == n._v.lo){
if(n._k && n._k[n._v.$id]) delete n._k[n._v.$id]
if(n._s == n._v.lo) n._v.lo += m
else n._v.hi -= m
n._v.$us -= m
if(!n._v.$us) n._v.hi = n._v.lo = 0
}
else {
n._t.clear(n)
var o = n._o || (n._o = {})
var k = n._k || (n._k = {})
o[n._v.$id] = n._s
k[n._v.$id] = n._v
}
if(n._k && (v = n._k[id])) n._s = s = n._o[id], n._v = v
} else v = n._v
} else n._i = -1
if(!v){
var l = n
while(!l.l){
l = l._p || l._b
if(!l) throw new Error('trying to execute node without a container')
}
var z = l._q || (l._q = {})
var d = n.l ? 0 : n._z
var q = z[d]
if(!q){
z[d] = q = {z:d}
var a = z.b
var b
while(a){
if(a.z > d){
if(b) b.d = q, q.d = a
else z.b = q, q.d = a
break
}
b = a
a = a.d
}
if(!a){
if(b) b.d = q
else z.b = q
}
}
if(!(v = q[id])){
n._v = v = q[id] = sh.alloc(n.pool || 1)
v.$id = id
v.$n = n
}
else n._v = v;
} else s = n._s
if(s < 0){
n._i = m
if(v.lo - m >= 0){
v.lo -= m
v.$us += m
s = n._s = v.lo
} else {
if(v.hi + m > v.$sc){
n._v = v = q[id] = sh.alloc(fn.max(v.$sc * 2, v.$sc + m), v)
v.$id = id
v.$n = n
}
n._s = s = v.hi, v.hi += m, v.$us += m
}
}
}
function freelayer(n){
var q = n._q
for(var i in q){
var qb = q[i]
for(var k in qb) qb[k].sh.free(qb[k])
}
if(n._0) n._0.each(freelayer)
var p = n._p || n._b
while(!p.l) p = p._p || p._b
p._0.rm(n)
}
function freenode(n){
var v = n._v
if(!v) return
var m = n._i || 1
v.$us -= m
if(n._k && n._k[v.$id]) delete n._k[v.$id]
if(n._s == v.hi - m){
v.hi -= m
} else if(n._s == v.lo) v.lo += m
else n._t.clear(n)
if(!v.$us) v.hi = v.lo = 0
delete n._v
delete n._s
var k = n._k
if(k) for(var i in k){
var v = k[i]
v.$us -= m
if(!v.$us) v.hi = v.lo = 0
}
delete n._o
delete n._k
}
function unhook(n){
var p = n._p
if(!p){
p = n._b
if(p && p._f == n) p._f = n._d
} else {
if(p._e == n) p._e = n._u
if(p._c == n) p._c = n._d
}
if(n._u) n._u._d = n._d
if(n._d) n._d._u = n._u
}
ui.rm = function(n){
unhook(n)
if(n._p && n._p.r_) n._p.r_(n)
var i = n
do {
if(i.l) freelayer(i)
else freenode(i)
if(!i.l && i._c) i = i._c
else if(i._f) i = i._f
else if(i != n && i._d) i = i._d
else {
while(i && !i._d && i != n) i = i._p || i._b
if(i != n) i = i._d
}
}
while(i != n)
var i = n
do {
if(i._) i._()
if(i._g in group) delete group[i._g]
if(l_t.has(i)) l_t.rm(i)
for(var k in l_a) if(l_a[k].has(i)) l_a[k].rm(i)
if(i._c) i = i._c
else if(i._f) i = i._f
else if(i != n && i._d) i = i._d
else {
while(i && !i._d && i != n) i = i._p || i._b
if(i != n) i = i._d
}
}
while(i != n)
delete n._u
delete n._d
}
ui.count = function(n, c){
if(c>0){
while(c && n._d) n = n._d, c--
} else {
while(c && n._u) n = n._u, c++
}
return n
}
ui.first = function(n){
return n._p._c
}
ui.last = function(n){
while(n._d) n = n._d
return n
}
ui.top = function(n){
if(!n.l) throw new Error("cannot top non layer node")
var p = n._p || n._b
while(p && !p.l) p = p._p || n._b
if(!p._0) p._0 = fn.list('_1', '_2')
if(p._0.has(n)) p._0.rm(n)
p._0.add(n)
}
ui.modal = fn.stack()
ui.modal.push(root)
ui.pushmodal = function(n){
ui.modal.top()._m = 0
ui.modal.push(n)
n._m = 1
}
ui.popmodal = function(){
var n = ui.modal.pop()
n._m = 0
ui.modal.top()._m = 1
}
ui.focus = function(n){
if(ui.foc == n) return
if(ui.foc && ui.foc.u_) ui.foc.u_(n)
if(n && n.f_) n.f_(ui.foc)
ui.foc = n
}
ui.focus_next = function(){
var n = ui.foc._d
while(n){
if(n.f_){ ui.focus(n); return;}
n = n._d
}
if(!n) n = ui.foc._p._c
while(n){
if(n.f_){ ui.focus(n); return;}
n = n._d
}
}
ui.focus_prev = function(){
var n = ui.foc._u
while(n){
if(n.f_){ ui.focus(n); return;}
n = n._u
}
if(!n){
n = ui.foc._p._c
while(n._d) n = n._d
}
while(n){
if(n.f_){ ui.focus(n); return;}
n = n._u
}
}
ui.key = {}
gl.keydown(function(){
ui.key = gl.key
if(ui.keydown) ui.keydown()
if(!ui.foc) ui.foc = root._c
if(ui.foc){
if(!ui.bubble(ui.foc, 'k')){
if(ui.key.i == 'tab'){
if(!ui.key.s) ui.focus_next()
else ui.focus_prev()
}
}
gl.anim(ui.draw)
}
})
ui.bubble = function(n, e){
var p = n
while(p){
if(p._m) break
p = p._p || p._b
}
if(!p) return
if(n[e]){
if(typeof n[e] == 'object') {
n.set(n[e])
return 1
} else if(n[e](n)) return 1
}
var p = n._p
while(p){
if(p[e] && p[e](n)) return 1
p = p._p
}
}
ui.cursor = gl.cursor
ui.view = function(n, v){
v = v || {}
v.x = gl.eval(n, n._x, uni, el),
v.y = gl.eval(n, n._y, uni, el),
v.w = gl.eval(n, n._w, uni, el),
v.h = gl.eval(n, n._h, uni, el)
return v
}
ui.inner = function(n, v){
v = v || {}
v.x = gl.eval(n, n.x_, uni, el),
v.y = gl.eval(n, n.y_, uni, el),
v.w = gl.eval(n, n.w_, uni, el),
v.h = gl.eval(n, n.h_, uni, el)
return v
}
ui.isin = function(n){
var r = ui.map(n)
return !(r.x < 0 || r.x > 1 || r.y < 0 || r.y > 1)
}
ui.map = function(n, l, t, r, b){
var v = ui.view(n)
if(l) v.x += l
if(t) v.y += t
if(r) v.w -= r
if(b) v.h -= b
return {
x:(ui.mx - v.x) / v.w,
y:(ui.my - v.y) / v.h
}
}
ui.rel = function(n){
var v = ui.view(n)
return {
x:ui.mx - v.x,
y:ui.my - v.y
}
}
ui.clip = function(x, y, w, h, x1, y1, x2, y2){
if(arguments.length>4){
if(x > x1) x1 = x
if(y > y1) y1 = y
if(x + w < x2) x2 = x + w
if(y + h < y2) y2 = y + h
gl.scissor(x1, (gl.height - (y2)) , x2 - x1, y2 - y1 )
} else {
gl.scissor(x, (gl.height - y - h) , w < 0 ? 0: w, h < 0 ? 0: h )
}
}
var md
var ms
var lp
var le
var dc
var dt = fn.dt()
var uni = {s:{},m:{},l:{}}
ui.uniforms = uni
update_uni()
function update_uni(){
uni.t = uni.u = dt() / 1000
uni.l.x = 0
uni.l.y = 0
uni.s.x = gl.width / gl.ratio
uni.s.y = gl.height / gl.ratio
uni.m.x = ui.mx
uni.m.y = ui.my
}
var dirty = {}
function drawLayer(n, x1, y1, x2, y2){
var v = n.g_ || (n.g_ = {})
v.x = gl.eval(n, n._x, uni, el)
v.y = gl.eval(n, n._y, uni, el)
v.w = gl.eval(n, n._w, uni, el)
v.h = gl.eval(n, n._h, uni, el)
if(v.x > x1) x1 = v.x
if(v.y > y1) y1 = v.y
if(v.x + v.w < x2) x2 = v.x + v.w
if(v.y + v.h < y2) y2 = v.y + v.h
if(x1 >= x2) return
if(y1 >= y2) return
if(n.v_ && (n.n_ != v.w || n.o_ != v.h)){
n.v_()
n.n_ = v.w, n.o_ = v.h
}
gl.scissor(x1*gl.ratio, (gl.height - (y2*gl.ratio)) , (x2 - x1)*gl.ratio, (y2 - y1)*gl.ratio )
var q = n._q
if(q){
var z = q.b
while(z){
var sh
var b
for(var k in z) if(sh = (b = z[k]).$sh){
sh.use()
sh.n(b.$n)
sh.set(uni)
sh.draw(b)
}
z = z.d
}
}
if(n.l !== 1) n.l(x1, y1, x2, y2)
var q = n._0 && n._0.first()
while(q){
if(q.l !== -1) drawLayer(q, x1, y1, x2, y2)
q = q._2
}
}
function drawGroupID(n){
var vx1 = gl.eval(n, n._x, uni, el)
var vy1 = gl.eval(n, n._y, uni, el)
var vx2 = vx1 + gl.eval(n, n._w, uni, el)
var vy2 = vy1 + gl.eval(n, n._h, uni, el)
if(ui.mx >= vx1 && ui.my >= vy1 && ui.mx < vx2 && ui.my < vy2){
var q = n._q
if(q){
var z = q.b
while(z){
var sh
var b
for(var k in z) if(sh = (b = z[k]).$sh){
sh.use('g')
sh.n(b.$n)
sh.set(uni)
sh.draw(b)
}
z = z.d
}
}
if(n.g) n.g(n)
var q = n._0 && n._0.first()
while(q){
if(q.l !== -1) drawGroupID(q)
q = q._2
}
}
}
ui.frame = fn.ps()
var renderTime = fn.dt()
var pv = new Uint8Array(4)
ui.move = true
ui.draw = function(){
renderTime.reset()
initnew()
ui.frame()
ui.ms = gl.ms
ui.mx = ui.ms.x, ui.my = ui.ms.y
ui.mh = ui.ms.h, ui.mv = ui.ms.v
update_uni()
gl.disable(gl.BLEND)
if(ui.cap){
var n = ui.cap
} else {
if(ui.debug) gl.disable(gl.SCISSOR_TEST)
else gl.enable(gl.SCISSOR_TEST)
var sx = 0, sy = gl.height - 1
if(!ui.move){
sx = ui.mx
sy = gl.height - ui.my - 1
}
gl.scissor(sx, sy, 2, 2)
if(!ui.move){
uni.l.x = 0
uni.l.y = 0
} else {
uni.l.x = -ui.mx
uni.l.y = -ui.my
}
drawGroupID(root)
gl.readPixels(sx, sy, 1, 1, gl.RGBA, gl.UNSIGNED_BYTE, pv)
var n = group[(pv[3]<<24) | (pv[2]<<16) | (pv[1]<<8) | pv[0]]
}
uni.l.x = uni.l.y = 0
try{
if(lp != n){
if(lp) ui.bubble(lp, 'o')
if(n) ui.bubble(n, 'i')
lp = n
}
if(n){
if(md || !le) ui.bubble(n, 'm')
}
if(!md && le){
if(le) ui.bubble(le, 'r')
le = null
} else if(md == 1){
if(le) ui.bubble(le, 'r')
le = n
if(le) ui.bubble(le, 'p')
md = 2
}
if(dc && n){
ui.bubble(n, 'u')
dc = 0
}
if(ms && n){
ui.bubble(n, 's')
ms = 0
}
} catch(e){
var err = e
}
if(dirty.x1 !== Infinity){
gl.colorMask(true, true, true, true)
gl.enable(gl.BLEND)
gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA)
gl.enable(gl.SCISSOR_TEST)
drawLayer(root,dirty.x1,dirty.y1,dirty.x2,dirty.y2)
}
var e = null
dirty.y1 = dirty.x1 = Infinity
dirty.y2 = dirty.x2 = -Infinity
for(var k in l_a){
var _a = k
var _t = l_a[k].t
var _r = l_a[k].r
var _e = l_a[k].e
n = l_a[k].first()
while(n){
if(uni.u >= n[_t] + Math.abs(n[_a])){
var m = n[_r]
l_a[k].rm(n)
if(n[_e]){
e = n[_e]
delete n[_e]
n.set(e)
}
n = m
} else {
ui.redraw(n)
n = n[_r]
}
}
if(l_a[k].len) e = 1
}
if(e || l_t.len){
if(l_t.len > 0) ui.redraw()
gl.anim(ui.draw)
}
if(err) throw err
document.title = renderTime()
}
ui.drawer = function(){
ui.redraw()
gl.mouse_p(function(){ md = 1, ui.md = 1,gl.anim(ui.draw) })
gl.mouse_m(function(){ gl.anim(ui.draw) })
gl.mouse_r(function(){ md = 0, ui.md = 0, gl.anim(ui.draw) })
gl.mouse_s(function(){
ms = 1, gl.anim(ui.draw)
})
gl.mouse_u(function(){ dc = 1, gl.anim(ui.draw) })
return gl.resize(function(){
ui.redraw()
})
}
ui.redraw = function(n){
while(n && !n.g_) n = n._p
if(!n){
dirty.y1 = 0
dirty.x1 = 0
dirty.x2 = gl.width
dirty.y2 = gl.height
} else {
var v = n.g_
if(v.x < dirty.x1) dirty.x1 = v.x
if(v.y < dirty.y1) dirty.y1 = v.y
var x2 = v.x + v.w
var y2 = v.y + v.h
if(x2 > dirty.x2) dirty.x2 = x2
if(y2 > dirty.y2) dirty.y2 = y2
}
gl.anim(ui.draw)
}
ui.redrawRect = function(x, y, w, h){
if(x < dirty.x1) dirty.x1 = x
if(y < dirty.y1) dirty.y1 = y
var x2 = x + w
var y2 = y + h
if(x2 > dirty.x2) dirty.x2 = x2
if(y2 > dirty.y2) dirty.y2 = y2
gl.anim(ui.draw)
}
ui.dump = function(n, dv){
var s = ''
fn.walk(n, null, function(n, z){
s += Array(z + 1).join(' ') + n._t._t
if(n._v){
var vb = n._v
if(n.t) s += " t:" + n.t
var nm = n._i || 1
if(dv)
for(var i in vb.vv){
var v = vb.vv[i]
s += " " + i + "=" + v.t.r(v.a, n._s * v.s, vb.sl * nm, v.s)
}
}
s += '\n'
})
fn(s)
}
require('./ui_draw')(ui)
return ui
})


define('/core/controls_mix',function(require, exports){
var ui = require("./ui")
var fn = require("./fn")
var cm = exports
cm.button = function(b){
var d = 0
function cl(){
if(d) return
d = 1
if(b.c_) b.c_()
}
function nr(){
if(!d) return
d = 0
if(b.n_) b.n_()
return 1
}
b.p = function(){
cl()
ui.focus(b)
ui.cap = b
return 1
}
b.m = function(){
if(ui.cap != b) return 1
if(ui.isin(b)) cl()
else nr()
return 1
}
b.r = function(){
if(ui.cap == b) ui.cap = 0
if(nr() && ui.isin(b) && b.c) b.c(b)
}
b.k = function(){
if(ui.key.i == 'space'){
cl()
nr()
if(b.c) b.c(b)
}
}
}
cm.scroll = function(b, k, v){
var r
function ds(y){
r += y
var o = fn.clamp(r, 0, fn.max(b.ts - b.pg,0))
if(o != b.mv){
b.mv = o
if(b.c) b.c()
ui.redraw(b)
}
}
b.ds = function(y){
r = b.mv
ds(y)
}
b.p = function(n){
if(n != b) return
r = b.mv
var l = ui.rel(k)
ds( (((v?l.y:l.x)<0)?-1:1) * b.pg )
}
var x = 0
var y = 0
k.p = function(){
ui.cap = k
x = ui.mx
y = ui.my
r = b.mv
if(k.c_) k.c_()
}
k.m = function(){
if(ui.cap == k){
var d = v?(ui.my - y):(ui.mx - x)
ds( d * (b.ts / b.eval(v?'h':'w')) )
x = ui.mx
y = ui.my
}
ui.gl.cursor('default')
return 1
}
b.m = function(){
ui.gl.cursor('default')
return 1
}
k.r = function(){
if(ui.cap == k){
ui.cap = 0
if(k.n_) k.n_()
}
}
function hider(){
if(b.pg >= b.ts) b.l = -1
else b.l = 1
}
function mover(){
if(b.move) b.move()
}
b.alias('mv', k, mover)
b.alias('pg', k, hider)
b.alias('ts', k, hider)
b.mv = 0
}
cm.slider = function(b, k, v){
var r
function ds(y){
r += y
var o = fn.clamp(r, 0, 1)
if(o != b.mv){
b.mv = o
if(b.c) b.c(b)
ui.redraw(b)
}
}
b.ds = function(y){
r = b.eval('mv')
ds(y)
}
b.p = function(n){
if(n != b) return
r = b.eval('mv')
var l = ui.rel(k)
ds( (v?l.y:l.x)<0?-0.1:0.1 )
}
b.f_ = function(){
if(!ui.cap && k.f_) k.f_()
}
b.u_ = function(){
if(!ui.cap && k.u_) k.u_()
}
b.k = function(){
switch(ui.key.i){
case 'home': r = 0;ds(0); break
case 'end': r = 1;ds(0); break
case 'left':if(v)return;r = b.mv; ds(-0.1); break
case 'right':if(v)return;r = b.mv; ds(0.1); break
case 'up':if(!v)return; r = b.mv; ds(-0.1); break
case 'down':if(!v)return; r = b.mv; ds(0.1); break
default: return
}
return 1
}
var y = 0
var x = 0
k.p = function(){
if(ui.cap) return
ui.cap = k
ui.focus(b)
y = ui.my
x = ui.mx
r = b.eval('mv')
if(k.c_) k.c_()
return 1
}
k.m = function(){
if(ui.cap == k){
if(v)
ds( (ui.my - y) / ( b.eval('h') - k.eval('h') ) )
else
ds( (ui.mx - x) / ( b.eval('w') - k.eval('w') ) )
x = ui.mx
y = ui.my
}
}
k.r = function(){
if(ui.cap == k){
ui.cap = 0
if(k.n_) k.n_()
}
}
b.alias('mv', k)
}
cm.list = function(b){
var ty = 0
function cs(){
if(b._v_){
var v = b._v_
var pg = b.eval('h')
var mv = fn.clamp(v.mv, 0,fn.max(ty - pg, 0))
v.pg = pg
v.ts = ty
if(v.mv != mv) v.ds( mv - v.mv)
}
}
b.a_ = function(n){
if(n == b._v_) return
n.y = ty
ty += n.eval('h')
if(b._v_) b._v_.set({ ts: ty })
}
b.r_ = function(n){
ty = n.y
var p = n._d
while(p){
p.y = ty
ty += p.eval('h')
p = p._d
}
cs()
}
b.s = function(){
if(b._v_) b._v_.ds(ui.mv)
}
b.v_ = function(){
cs()
}
}
cm.select = function(b){
var s
function se(n){
if(s == n) return
if(s && s.d_) s.d_()
if(s && s.u_) s.u_()
s = n
if(ui.foc == b && s.f_)s.f_()
if(s && s.s_) s.s_()
if(!s) return
var rm = ui.frame(function(){
rm()
var rb = ui.view(b)
var rn = ui.view(n)
var y = rn.y - rb.y
if(y < 0) b._v_.ds( y )
if(y + rn.h > rb.h) b._v_.ds( y - rb.h + rn.h )
b.n = s
if(b.c) b.c()
})
}
b.sel = se
b.f_ = function(){
if(s && s.f_) s.f_()
}
b.u_ = function(){
if(s && s.u_) s.u_()
}
b.m =
b.p = function(n){
if(!ui.md || ui.cap) return
ui.focus(b)
if(s == n || b == n) return
se(n)
return 1
}
b.k = function(){
if(!s) se(b._c)
if(s && ui.key.i == 'up' && s._u) se(s._u)
if(s && ui.key.i == 'down' && s._d) se(s._d)
if(s && ui.key.i == 'pageup') se(ui.count(s, -10))
if(s && ui.key.i == 'pagedown') se(ui.count(s, 10))
if(s && ui.key.i == 'home') se(ui.first(s))
if(s && ui.key.i == 'end') se(ui.last(s))
}
}
cm.drag = function(b, c){
var d
var mx
var my
var sx
var sy
c.p = function(){
if(ui.bubble(c._p,'p')) return 1
ui.cap = c
mx = ui.mx, my = ui.my
sx = b.x
sy = b.y
if(c.c_)c.c_()
return 1
}
c.m = function(){
if(ui.cap == c){
ui.redraw(b)
b.x = sx + ui.mx - mx
b.y = sy + ui.my - my
ui.redraw(b)
}
}
c.r = function(){
if(ui.cap == c){
ui.cap = 0
if(c.n_)c.n_()
}
}
}
cm.resize = function(b){
var d
var mx
var my
var bx
var by
var ov
b.p = function(){
if(bx || by){
ui.cap = b
mx = ui.mx
my = ui.my
ov = ui.view(b)
return 1
}
}
b.m = function(n){
if(ui.cap == b){
var dx = ui.mx - mx
var dy = ui.my - my
if(bx == 1) b.w = fn.min(b.maxw || 9999, fn.max(b.minw || 50, ov.w - dx)), b.x = ov.x - (b.w - ov.w)
if(bx == 2) b.w = fn.min(b.maxw || 9999, fn.max(b.minw || 50, ov.w + dx))
if(by == 1) b.h = fn.min(b.maxh || 9999, fn.max(b.minh || 50, ov.h - dy)), b.y = ov.y - (b.h - ov.h)
if(by == 2) b.h = fn.min(b.maxh || 9999, fn.max(b.minh || 50, ov.h + dy))
ui.redraw(b)
return
}
var v = ui.view(b)
bx = ui.mx > v.x + v.w - 8 && ui.mx < v.x + v.w ? 2 : ui.mx < v.x + 8 && ui.mx >= v.x ? 1 : 0
by = ui.my > v.y + v.h - 8 && ui.my < v.y + v.h ? 2 : ui.my < v.y + 5 && ui.my >= v.y ? 1 : 0
var cx = ui.mx > v.x + v.w - 16 && ui.mx < v.x + v.w ? 2 : ui.mx < v.x + 16 && ui.mx >= v.x ? 1 : 0
var cy = ui.my > v.y + v.h - 16 && ui.my < v.y + v.h ? 2 : ui.my < v.y + 16 && ui.my >= v.y ? 1 : 0
if(cx && cy) bx = cx, by = cy
if(bx){
if(by) ui.cursor(bx == by?'nwse-resize':'nesw-resize')
else ui.cursor('ew-resize')
} else ui.cursor(by?'ns-resize':'default')
}
b.o = function(){
ui.cursor('default')
}
b.r = function(){
if(ui.cap == b) ui.cap = 0
bx = by = 0
}
}
cm.hSplit = function(b, d, v){
var c = 0
var n1
var n2
b.a_ = function(n){
if(c == 0){
n1 = n
d.x = n1.w
} else if (c == 1){
n2 = n
n2.x = d.x + d.w
n2.w = 'p.w_ - n.x'
}
c++
}
b.v_ = function(){
cv(n1.w)
}
function cv(w){
if(w < b.minw) w = b.minw
var sw = b.eval('w')
if(sw - (w + d.w) < b.minw) w = sw - b.minw - d.w
n1.w = d.x = w
n2.x = d.x + d.w
}
var m
var v
d.p = function(){
ui.cap = d
m = ui.mx
v = d.x
if(d.c_)d.c_()
}
d.m = function(){
if(ui.cap == d){
cv(v + (ui.mx - m))
ui.redraw(b)
}
}
d.r = function(){
ui.cap = 0
if(d.n_)d.n_()
}
}
cm.vSplit = function(b, d){
var c = 0
var n1
var n2
b.a_ = function(n){
if(c == 0){
n1 = n
d.y = n1.h
} else if (c == 1){
n2 = n
n2.y = d.y + d.h
n2.h = 'p.h_ - n.y'
}
c++
}
function cv(h){
if(h < b.minh) h = b.minh
var sh = b.eval('h')
if(sh - (h + d.h) < b.minh) h = sh - b.minh - d.h
n1.h = d.y = h
n2.y = d.y + d.h
}
b.v_ = function(){
cv(n1.h)
}
var m
var v
d.p = function(){
ui.cap = d
m = ui.my
v = d.y
if(d.c_)d.c_()
}
d.m = function(){
if(ui.cap == d){
ui.redraw(b)
cv(v + (ui.my - m))
}
}
d.r = function(){
if(d.n_)d.n_()
ui.cap = 0
}
}
cm.fold = function(g){
var b
}
cm.edit = function(b, t, c, s, m){
var cs = 0, ce = 0
function gc(){
var m = ui.rel(t)
var l = 0
ui.text.pos(t, t.t.length, function(i, x, y){
if((l+x)/2 > m.x){
l = i - 1
if(l<0)l = 0
return 1
}
l = x
})
return l
}
function scr(){
var ps = ui.text.pos(t, cs)
var pe = ui.text.pos(t, ce)
var pt = ui.text.pos(t, t.t.length)
var bv = ui.view(b)
var tv = ui.view(t)
tv.x -= b.xs
var sw = t.b.m[32-t.b.s] / ui.gl.ratio
var w = bv.w - sw - (tv.x - bv.x)
if(pe.x > -b.xs + w) b.xs = -(pe.x - w)
if(pe.x < -b.xs - sw) b.xs = -pe.x -sw
if(pt.x < -b.xs + w && pt.x > w) b.xs += (-b.xs + w) - pt.x
}
b.v_ = function(){
scr()
}
function mark(ms, me, re){
if(me === undefined) me = ms
cs = fn.clamp(ms, 0, t.t.length)
ce = fn.clamp(me, 0, t.t.length)
var ps = ui.text.pos(t, cs)
var pe = ui.text.pos(t, ce)
scr()
if(cs != ce){
if(ps.x > pe.x){
s.x = pe.x
s.w = ps.x - pe.x
m.t = t.t.slice(ce,cs)
} else {
s.x = ps.x
s.w = pe.x - ps.x
m.t = t.t.slice(cs,ce)
}
c.w = 0
} else {
c.x = ps.x
c.y = ps.y - 1
s.x = 0, s.w = 0
c.w = 1
m.t = ""
}
ui.redraw(b)
}
b.m = function(){
ui.cursor('text')
if(ui.cap != b) return 1
mark(cs, gc())
return 1
}
b.o = function(){
ui.cursor('default')
}
var ct
b.p = function(){
if(!ui.cap) ui.focus(b)
var p = gc()
if(ct && ct()< 500 && p>=fn.min(cs,ce) && p<= fn.max(cs,ce)){
mark(0, t.t.length)
} else {
mark(p)
ui.cap = b
}
}
b.u = function(){
var p = gc()
for(var q = p;q<t.t.length;q++) if(t.t.charCodeAt(q) != 32) break
for(var r = p;r>=0;r--) if(t.t.charCodeAt(r) != 32) break
p = (p - r < q - p) ? r : q
for(var e = p;e<t.t.length;e++) if(t.t.charCodeAt(e) == 32) break
for(var s = p;s>=0;s--) if(t.t.charCodeAt(s) == 32) break
mark(s+1,e)
if(!ct) ct = fn.dt()
else ct.reset()
}
b.r = function(){
if(ui.cap == b) ui.cap = 0
}
function kcr(v){
if(ui.key.s) mark(cs, ce + v)
else if(ce == cs) mark(ce + v)
else mark(v > 0 ? fn.max(ce,cs):fn.min(ce,cs))
}
function kca(v){
if(ui.key.s) mark(cs, v)
else mark(v)
}
b.k = function(){
var ms = fn.min(cs,ce)
var me = fn.max(cs,ce)
var last = b.t
switch(ui.key.i){
case 'up':
case 'home':
kca(0)
break
case 'down':
case 'end':
kca(t.t.length)
break
case 'right':
kcr(1)
break
case 'left':
kcr(-1)
break
case 'delete':
b.t = t.t.slice(0,ms) + t.t.slice(ms == me ? me + 1 : me)
mark(ms)
break
case 'backspace':
if(ms != me || ms>0){
if(ms == me){
b.t = t.t.slice(0,ms - 1) + t.t.slice(me)
kcr(-1)
} else {
b.t = t.t.slice(0,ms) + t.t.slice(me)
mark(ms)
}
}
break
default:
if(ui.key.m || ui.key.c){
if(ui.key.i == 'a'){
mark(0, t.t.length)
}
if(ui.key.i == 'v'){
ui.gl.getpaste(function(v){
b.t = t.t.slice(0,ms) + v + t.t.slice(me)
mark(ms + v.length)
ui.redraw()
})
}
if(ui.key.i == 'c'){
ui.gl.setpaste(m.t)
}
if(ui.key.i == 'x'){
ui.gl.setpaste(m.t)
b.t = t.t.slice(0,ms) + t.t.slice(me)
mark(ms)
}
} else if(ui.key.h){
b.t = t.t.slice(0,ms) + ui.key.v + t.t.slice(me)
mark(ms + 1)
}
break
}
if(last != b.t && b.c) b.c(b)
return ui.key.i!='tab'?1:0
}
}
cm.slides = function(b){
var cp = 0
var tp = 0
var vp = 0
var np = 0
ui.frame(function(){
if(tp < vp) tp += (vp-tp) / 10
if(tp > vp) tp -= (tp-vp) / 10
var w = ui.get(b, '_w')
if(Math.abs(tp-vp)*w<1)tp = vp
else {
ui.redraw()
}
var k = 0
var p = b._c
while(p){
p.x = Math.round((k - tp) * w)
k++
p = p._d
}
})
b.a_ = function(n){
np++
}
b.k = function(){
switch(ui.key.i){
case 'home':
vp = 0
break
case 'end':
vp = np - 1
break
case 'right':
if(vp<np-1) vp++
break
case 'left':
if(vp>0) vp --
break
}
}
}
})

define('/core/controls',function(require, exports){
var ui = require("./ui")
var fn = require("./fn")
var cm = require("./controls_mix")
var ct = exports
ct.f1s = ui.gl.sfont("12px Arial")
ct.f1p = ui.gl.pfont("12px Arial")
var bump = function(){
mix(black, n.hc, (0.5 + 0.5 * dot(vec3(1,0,0),normal(0.001, 0.001, n.hm))))
}
ct.button = function(g){
var b = ui.rect()
var t = ui.text()
t._p = b
cm.button(b)
var bu = '0.3*pow(sin(c.x*P*0.999),(1+4*n.i1)/n.w)*pow(sin(c.y*P*0.98),2/n.h)'
var bd = '0.3*((1-n.i0)+1.5*(n.i0)*len(c-0.5)*pow(tsin(len(c-0.5)*5-n.i0),1))*pow(sin(c.x*P*0.999),(1+40*n.i1)/n.w)*pow(sin(c.y*P*0.98),2/n.h)'
b.f = bump
t.f = 'sfont(t.deftbg, t.dlgtxt)'
b.hm = bu
b.hc = 'mix(t.dlghi, t.dlgbg, n.i1)'
t.b = ct.f1s
b.f_ =
b.s_ =
b.i = function(){ t.a1 = b.a1 = -0.01 }
b.u_ =
b.d_ =
b.o = function(){ t.a1 = b.a1 = 0.1 }
b.n_ = function(){ b.a0 = -0.1, b.e0 = { hm : bu } }
b.c_ = function(){ b.a0 = 0.01, b.e0 = 0, b.hm = bd }
b.h = 24
b.y_ = 'n._y + 5'
t.x = 'floor(0.5*p.w - 0.5*n.w)'
b.alias('t', t)
b.calc('w', function(){return ui.text.pos(t, -1).x + 20 })
b.set(g)
return b
}
ct.vScrollHider = function(g){
var b = ui.rect()
var k = ui.rect()
k._p = b
b.e = k.e = ct.el
cm.scroll(b, k, 1)
b.f = 'vec4(0,0,0,0)'
b.shape = k.shape = function(vec2_v){
return_float(len(vec2(pow(abs(v.x),n.w/15),pow(abs(v.y),n.h/5))))
}
b.f = 'mix(vec4(0,0,0,0),vec4(.4,.4,.4,0.1-n.i1),1-smoothstep(0.8,1.0,n.shape(2*(c-.5))) )'
k.f = 'mix(vec4(0,0,0,0),vec4(.4,.4,.4,1-n.i1),1-smoothstep(0.8,1.0,n.shape(2*(c-.5))) )'
var hider
var inout
b.i =
k.i = function(){ b.a1 = k.a1 = -0.01; inout = 1; if(hider)clearTimeout(hider), hider = 0 }
b.o =
k.o = function(){
if(hider) clearTimeout(hider)
hider = setTimeout(function(){
hider = 0
b.a1 = k.a1 = 0.5
ui.redraw(b)
}, 1000)
inout = 0
}
k.n_ = function(){ k.a0 = -0.3 }
k.c_ = function(){ k.a0 = 0.05, k.e0 = 0}
b.move = function(){
if(inout) return
if(hider) clearTimeout(hider)
else b.a1 = k.a1 = -0.1
hider = setTimeout(function(){
hider = 0
b.a1 = k.a1 = 0.5
ui.redraw(b)
}, 1000)
}
k.x = '0'
k.dh = '(p.h_ - 2 - n.cs) * clamp(n.pg / n.ts, 0, 1)'
k.y = 'floor(1 + (n.mv / n.ts) * (p.h - 2 - max(0,30 - n.dh)))'
k.w = 'p.w_'
k.h = 'max(n.dh, 30)'
b.x = 'p.w_ - 10'
b.w = '10'
b._x = 'p._x + n.x'
b._y = 'p._y + n.y'
b.set(g)
return b
}
ct.hScrollHider = function(g){
var b = ui.rect()
var k = ui.rect()
k._p = b
cm.scroll(b, k)
b.f = 'vec4(0,0,0,0)'
b.shape = k.shape = function(vec2_v){
return_float(len(vec2(pow(abs(v.x),n.w/5),pow(abs(v.y),n.h/20))))
}
b.f = 'mix(vec4(0,0,0,0),vec4(.5,.5,.5,0.1-n.i1),1-smoothstep(0.8,1.0,n.shape(2*(c-.5))) )'
k.f = 'mix(vec4(0,0,0,0),vec4(.5,.5,.5,1-n.i1),1-smoothstep(0.8,1.0,n.shape(2*(c-.5))) )'
var hider
var inout
b.i =
k.i = function(){ b.a1 = k.a1 = -0.01; inout = 1; if(hider)clearTimeout(hider), hider = 0 }
b.o =
k.o = function(){
if(hider) clearTimeout(hider)
hider = setTimeout(function(){
hider = 0
b.a1 = k.a1 = 0.5
ui.redraw(b)
}, 1000)
inout = 0
}
k.n_ = function(){ k.a0 = -0.3 }
k.c_ = function(){ k.a0 = 0.05, k.e0 = 0}
b.move = function(){
if(inout) return
if(hider) clearTimeout(hider)
else b.a1 = k.a1 = -0.1
hider = setTimeout(function(){
hider = 0
b.a1 = k.a1 = 0.5
ui.redraw(b)
}, 1000)
}
k.y = '0'
k.x = '1 + (n.mv / n.ts) * (p.w - 2)'
k.h = 'p.h_'
k.w = '(p.w_ - 2) * clamp(n.pg / n.ts, 0, 1)'
b.y = 'p.h_ - 10'
b.h = '10'
b._x = 'p._x + n.x'
b._y = 'p._y + n.y'
b.set(g)
return b
}
ct.vScroll = function(g){
var b = ui.rect()
var k = ui.rect()
k._p = b
b.e = k.e = ct.el
cm.scroll(b, k, 1)
b.f = 'mix(t.defbg2,t.dlgbg,0.3+0.03*snoise2(vec2(c.x*n.w*0.5,c.y*n.h*0.5)))'
k.f = bump
var bu = 'pow(sin(c.x*P*0.999),1/n.w) * pow(sin(c.y*P*0.999),1/n.h)'
var bd = 'pow(sin(c.x*P*0.999),1/n.w) * pow(sin(c.y*P*0.999),1/n.h) + sin((c.y-0.5)*P*(n.i0))'
b.hm = bd
k.hm = bu
b.hc = 'mix(t.dlghi, t.dlgbg, n.i1)'
k.hc = 'mix(t.dlghi, t.dlgbg, n.i1)'
k.i = function(){ k.a1 = -0.1 }
k.o = function(){ k.a1 = 0.5 }
k.n_ = function(){ k.a0 = -0.3, k.e0 = {hm:bu} }
k.c_ = function(){ k.a0 = 0.05, k.e0 = 0, k.set({hm:bd}) }
k.x = '1'
k.dh = '(p.h_ - 2 - n.cs) * clamp(n.pg / n.ts, 0, 1)'
k.y = 'floor(1 + (n.mv / n.ts) * (p.h - 2 - max(0,30 - n.dh)))'
k.w = 'p.w_ - 2'
k.h = 'max(n.dh, 30)'
b.x = 'p.w_ - 10'
b.w = '10'
b._x = 'p._x + n.x'
b._y = 'p._y + n.y'
b.set(g)
return b
}
ct.hScroll = function(g){
var b = ui.rect()
var k = ui.rect()
k._p = b
cm.scroll(b, k)
b.f = 'mix(t.defbg2,t.dlgbg,0.3+0.03*snoise2(vec2(c.x*n.w*0.5,c.y*n.h*0.5)))'
k.f = bump
var bu = 'pow(sin(c.x*P*0.999),3/n.w) * pow(sin(c.y*P*0.999),1/n.h)*0.15'
var bd = 'pow(sin(c.x*P*0.999),3/n.w) * pow(sin(c.y*P*0.999),1/n.h)*0.15 + sin((c.y-0.5)*P*(n.i0))'
b.hm = bd
k.hm = bu
b.hc = 'mix(t.dlghi, t.dlgbg, n.i1)'
k.hc = 'mix(t.dlghi, t.dlgbg, n.i1)'
k.i = function(){ k.a1 = -0.1 }
k.o = function(){ k.a1 = 0.5 }
k.n_ = function(){ k.a0 = -0.3, k.e0 = {hm:bu} }
k.c_ = function(){ k.a0 = 0.05, k.e0 = 0, k.set({hm:bd}) }
k.y = '1'
k.x = '1 + (n.mv / n.ts) * (p.w - 2)'
k.h = 'p.h_ - 2'
k.w = '(p.w_ - 2) * clamp(n.pg / n.ts, 0, 1)'
b.y = 'p.h_ - 10'
b.h = '10'
b._x = 'p._x + n.x'
b._y = 'p._y + n.y'
b.set(g)
return b
}
ct.hvFill = function(g){
var b = ui.rect()
b.f = 'mix(t.defbg2,t.dlgbg,0.3+0.03*snoise2(vec2(c.x*n.w*0.5,c.y*n.h*0.5)))'
b._x = 'p._x + n.x'
b._y = 'p._y + n.y'
b.set(g)
return b
}
ct.hvScroll = function(b){
var v = b._v_ || (b._v_ = ct.vScroll())
v._b = b
v.l = 1
v._z = Infinity
var h = b._h_ || (b._h_ = ct.hScroll())
h._b = b
h.l = 1
h._z = Infinity
var sw = 10
var c = ct.hvFill({x:'p.w_ - '+sw, y:'p.h_ - '+sw, w:sw, h:sw})
c._b = b
c.l = 1
function cv(){
var y = b.eval('h')
var x = b.eval('w')
v.pg = y
v.ts = b.vSize + sw
h.pg = x
h.ts = b.hSize + sw
var m = fn.clamp(v.mv, 0,fn.max(b.vSize - y, 0))
if(v.mv != m) v.ds( m - v.mv)
var m = fn.clamp(h.mv, 0,fn.max(b.hSize - x, 0))
if(h.mv != m) h.ds( m - h.mv)
}
b.v_ = cv
b.mark = 1
b.s = function(){
v.ds(ui.mv)
h.ds(ui.mh)
}
v.c = function(){ b.vScroll = Math.round(-v.mv);ui.redraw(b)}
v.h = 'p.h_ - ' + sw
h.w = 'p.w_ - ' + sw
h.c = function(){ b.hScroll = Math.round(-h.mv);ui.redraw(b) }
b.hScroll = 0
b.vScroll = 0
b.hSize = 0
b.vSize = 0
b.x_ = 'n._x + n.hScroll'
b.y_ = 'n._y + n.vScroll'
}
ct.vSlider = function(g){
var b = ui.rect()
var k = ui.rect()
k._p = b
cm.slider(b, k, true)
k.f = bump
b.f = 'mix( vec4(0,0,0,0),black, (pow(sin(c.x*P),n.w*4)) )'
var bu = '0.75*pow(sin(c.x*P*0.999),(10 + 50*n.i1)/n.w) * pow(sin(c.y*P*0.999),10/n.h)'
var bd = '0.75*((1-n.i0)+0.5*(n.i0)*len(c-0.5)*pow(tsin(len(c-0.5)*5-n.i0),1))*pow(sin(c.x*P*0.999),(10 + 50*n.i1)/n.w)*pow(sin(c.y*P*0.999),10/n.h)'
k.hm = bu
b.hc = 'mix(t.dlghi, t.dlgbg, n.i1)'
k.hc = 'mix(t.dlghi, t.dlgbg, n.i1)'
k.f_=
k.i = function(){ k.a1 = -0.01 }
k.u_=
k.o = function(){ k.a1 = 0.1 }
k.n_ = function(){ k.a0 = -0.1, k.e0 = {hm:bu} }
k.c_ = function(){ k.a0 = 0.01, k.e0 = 0, k.set({hm:bd}) }
k.x = '0'
k.y = '(n.mv) * (p.h - n.h)'
k.w = 'p.w'
k.h = 'p.w*0.5'
b.w = 20
b._x = 'p.x_ + n.x + 5'
b.mv = 0
b.set(g)
return b
}
ct.hSlider = function(g){
var b = ui.rect()
var k = ui.rect()
k._p = b
cm.slider(b, k, false)
k.f = bump
b.f = 'mix( vec4(0,0,0,0),black, (pow(sin(c.y*P),n.h*4)) )'
var bu = '0.75*pow(sin(c.x*P*0.999),(10 + 10*n.i1)/n.w) * pow(sin(c.y*P*0.999),10/n.h)'
var bd = '0.75*((1-n.i0)+0.5*(n.i0)*len(c-0.5)*pow(tsin(len(c-0.5)*5-n.i0),1))*pow(sin(c.x*P*0.999),(10 + 10*n.i1)/n.w)*pow(sin(c.y*P*0.999),10/n.h)'
k.hm = bu
b.hc = 'mix(t.dlghi, t.dlgbg, n.i1)'
k.hc = 'mix(t.dlghi, t.dlgbg, n.i1)'
k.f_=
k.i = function(){ k.a1 = -0.01 }
k.u_=
k.o = function(){ k.a1 = 0.1 }
k.n_ = function(){ k.a0 = -0.1, k.e0 = {hm:bu} }
k.c_ = function(){ k.a0 = 0.01, k.e0 = 0, k.set({hm:bd}) }
k.y = 0
k.x = '(n.mv) * (p.w - n.w)'
k.w = 'p.h*0.5'
k.h = 'p.h'
b.h = 20
b._x = 'p.x_ + n.x + 5'
b.mv = 0
b.set(g)
return b
}
ct.item = function(t){
var g = fn.named(arguments)
var b = ui.rect()
var t = ui.text()
t._p = b
var sb = 'mix(t.deftxt,t.selbg,n.i0)'
var nb = 't.defbg'
var st = 'sfont( mix(t.deftxt,t.selbg,n.i0), t.seltxt)'
var nt = 'sfont(t.defbg, t.deftxt)'
b.f = nb
t.f = nt
t.b = ct.f1s
b.p = function(){}
b.s_ = function(){ b.set({ f:sb }), t.set({ f:st }) }
b.d_ = function(){ b.set({ f:nb }), t.set({ f:nt }) }
b.f_ = function(){ b.a0 = t.a0 = 0.1 }
b.u_ = function(){ b.a0 = t.a0 = -0.1 }
b.h = t.b.p + 6
b.x_ = 'n._x + 3'
b.y_ = 'n._y + 2'
b.alias('t', t)
b.set(g)
return b
}
ct.label = function(g){
var t = ui.text()
t.f = 'sfont(t.defbg, t.deftxt)'
t.b = ct.f1s
t.set(g)
return t
}
ct.labelc = function(g){
var t = ui.text()
t.f = 'sfont(t.defbg, t.deftxt)'
t.b = ct.f1s
t.x = 'ceil(0.5*p.w - 0.5*n.w)'
t.set(g)
return t
}
ct.list = function(g){
var b = ui.rect()
var v = b._v_ = ct.vscroll()
v._b = b
b.l = v.l = 1
cm.list(b)
cm.select(b)
b.f = 't.defbg'
b.ys = 0
v.mv = 0
v.c = function(){
b.ys = Math.round(-v.mv)
}
b.y_ = 'n._y + n.ys'
v._y = 'p._y + n.y'
b.set(g)
return b
}
ct.edit = function(g){
var b = ui.rect()
var t = ui.text()
var c = ui.rect()
var s = ui.rect()
var m = ui.text()
var e
t._p = c._p = s._p = b
m._p = s
b.l = 1
c.l = 1
c._z = 10
c.w = '1'
c.h = '15'
c.f = 'mix(white,vec4(1,1,1,0),n.i0)'
s.f = 'mix(white,gray,n.i0)'
s.w = 0
s.h = 15
b.f = bump
b.h = 24
var bw = '1-0.5*pow(sin(c.x*P*0.9),1/n.w)*pow(sin(c.y*P*0.9),1/n.h)'
b.hm = bw
b.hc = 'mix(t.dlghi, t.dlgbg, n.i0)'
var bl
var foc
b.f_ = function(){
foc = 1
m.a0 = -0.05
s.a0 = -0.05
c.a0 = -0.05
b.a0 = -0.1
if(e){
e.hide()
}
}
b.u_ = function(){
foc = 0
m.a0 = 0.05
s.a0 = 0.05
c.a0 = 0.05
b.a0 = 0.1
if(e){
if(b.t.length) e.hide()
else e.show()
}
}
b.xs = 0
b.ys = 0
b.y_ = 'n._y + 6 + n.ys'
b.x_ = 'n._x + 5 + n.xs'
m.b = ct.f1s
t.b = ct.f1s
t.f = 'sfont( t.defbg, t.deftxt)'
m.f = 'sfont2( mix(white,gray,n.i0), black, 1.0)'
cm.edit(b, t, c, s, m)
b.alias('t', t, function(){
if(e){
if(b.t.length) e.hide()
else if(!foc) e.show()
}
})
b.set(g)
if(b.empty){
e = ui.text()
e._p = b
e.l = 1
e.x = 2
e.b = ct.f1s
e.f = 'sfont( t.defbg, t.deftxt*0.75)'
e.t = b.empty
}
return b
}
ct.comboBox = function(g){
var e = ct.edit()
}
ct.dropShadow = function(g){
var e = ui.edge()
e.set(g)
var r = e.radius || 10
e._x = 'p._x - (' + r + ')'
e._y = 'p._y - (' + r + ')'
e._w = 'p._w + (' + (2 * r) + ')'
e._h = 'p._h + (' + (2 * r) + ')'
e.l = 1
e.mx = r
e.my = r
e.stepa = e.stepa || 0
e.stepb = e.stepb || 1
e.inner = e.inner || "vec4(0,0,0,0.5)"
e.outer = e.outer || "vec4(0,0,0,0)"
e.f = 'mix('+e.inner+','+e.outer+',smoothstep('+e.stepa+','+e.stepb+',len(vec2(pow(abs(2*((f.x-n._x)/n._w-.5)),n._w/30),pow(abs(2*((f.y-n._y)/n._h-.5)),n._h/30)))))'
return e
}
ct.innerShadow = function(g){
var e = ui.edge()
e.set(g)
var r = e.radius || 10
e.l = 1
e.mx = r
e.my = r
e.stepa = e.stepa || 0
e.stepb = e.stepb || 1
e.inner = e.inner || "vec4(0,0,0,0.5)"
e.outer = e.outer || "vec4(0,0,0,0)"
e.f = 'mix('+e.inner+','+e.outer+',smoothstep('+e.stepa+','+e.stepb+',len(vec2(pow(abs(2*((f.x-n._x)/n._w-.5)),n._w/30),pow(abs(2*((f.y-n._y)/n._h-.5)),n._h/30)))))'
return e
}
ct.window = function(g){
var b = ui.rect()
var c = ui.rect()
var t = ui.text()
var d = ct.dropShadow()
c._p = b
d._p = b
t._p = c
b.l = 1
b.minw = 200
b.minh = 100
cm.drag(b, c)
cm.resize(b)
b.f = bump
c.f = bump
var bw = 'pow(sin(c.x*P*0.999),2/n.w)*pow(sin(c.y*P*0.99),2/n.h)'
var bc = 'pow(sin(c.x*P*0.999),2/n.w)*pow(sin(c.y*P*0.98),2/n.h)+(n.i0)*0.01*(sin((c.y-0.5)*n.h*n.i0*1))'
var bu = 'pow(sin(c.x*P*0.999),2/n.w)*pow(sin(c.y*P*0.98),2/n.h)'
c.hm = bu
c.hc = 'mix(t.dlghi, t.dlgbg, n.i1)'
b.hm = bw
b.hc = 'mix(t.dlghi, t.dlgbg, n.i1)'
t.f = 'sfont(t.defbg, t.deftxt)'
t.b = ct.f1s
c.i = function(){ c.a1 = -0.1 }
c.o = function(){ c.a1 = 0.3 }
c.n_ = function(){ c.a0 = -0.3, c.e0 = {hm:bu} }
c.c_ = function(){ c.a0 = 0.05, c.e0 = 0, c.set({hm:bc}), ui.top(b) }
c._x = 'p._x'
c._y = 'p._y'
c._w = 'p._w'
c.h = 30
c.x_ = 'n._x + 10'
c.y_ = 'n._y + 6'
b.y_ = 'n._y + 40'
b.x_ = 'n._x + 10'
b.w_ = 'n._w - 20'
b.h_ = 'n._h - 50'
b.alias('t',t)
b.set(g)
return b
}
ct.hSplit = function(g){
var b = ui.group()
b.l = 1
var d = ui.rect()
d._b = b
d.l = 1
d.w = 5
b.minw = 50
d.f = 'mix(mix(t.dlghi,t.splitter1,n.i1),mix(t.splitter3,t.splitter2,n.i0),pow(sin(c.x*P),0.8))'
d.f_
d.i = function(){ d.a1 = -0.01;ui.cursor('ew-resize') }
d.u_=
d.o = function(){ d.a1 = 0.1;ui.cursor('default') }
d.n_ = function(){ d.a0 = 0.1}
d.c_ = function(){ d.a0 = -0.01 }
cm.hSplit(b, d)
b.set(g)
return b
}
ct.vSplit = function(g){
var b = ui.group()
b.l = 1
var d = ui.rect()
d._b = b
d.l = 1
d.h = 5
b.minh = 50
d.f = 'mix(mix(t.dlghi,t.splitter1,n.i1),mix(t.splitter3,t.splitter2,n.i0),pow(sin(c.y*P),0.8))'
d.f_
d.i = function(){ d.a1 = -0.01;ui.cursor('ns-resize') }
d.u_=
d.o = function(){ d.a1 = 0.1;ui.cursor('default') }
d.n_ = function(){ d.a0 = 0.1}
d.c_ = function(){ d.a0 = -0.01 }
cm.vSplit(b, d)
b.set(g)
return b
}
ct.fold = function(g){
return ui.rect(function(n){
n.y = 20
n.w = 15
n.h = 15
n.f = ''
+ 'mix(vec4(0,0,0,0),white,'
+ 'clamp(pow(pow((1-2*len(c-0.5)),1.0)*(pow(sin(c.x*P),88)*ts(2)+pow(sin(c.y*P),88))*0.5+0.8,4)-0.75,0,1)+'
+ '0.7*pow(sin(P*len(vec2(pow(2*(c.x-0.5),2),pow(2*(c.y-0.5),2))) -0.3-0.5*ts(2)),4)'
+ ')'
})
}
ct.ico_c9 = function(g){
return ui.rect(function(n){
n.y = 300
n.w = 100
n.h = 100
n.f = ''
+ 'mix(vec4(0,0,0,0),white,'
+ '(1-clamp(pow(5*len(c-0.5-vec2(-0.25*ts(1),0)),30*ts(1)),0,1) * '
+ 'clamp(pow(5*len(c-0.5-vec2(+0.25*ts(1),0)),30*ts(1)),0,1) *  '
+ 'clamp(pow(5*len(c-0.5-vec2(0,-.17*pow(ts(1),4))),30*ts(1)),0,1) *'
+ 'clamp(pow(5*len(c-0.5-vec2(0,0)),30*ts(1)),0,1) *'
+ 'clamp(pow(5*len(c-0.5-vec2(-.12*ts(1),0)),30*ts(1)),0,1) *'
+ 'clamp(pow(5*len(c-0.5-vec2(+.12*ts(1),0)),30*ts(1)),0,1))'
+ ')'
})
}
ct.slides = function(g){
var b = ui.group()
var fnt_big = ui.gl.pfont("55px Monaco")
var fnt_med = ui.gl.pfont("30px Monaco")
b.slide = function(g){
var n = ui.rect()
n.l = 1
n.b = fnt_big
n.f = 'mix(black,gray,c.y);'
n.title = function(t, y){
var g = fn.named(arguments)
var n = ui.text()
n.x = '0.5*p.w - 0.5*n.w'
n.y = 5
n.b = fnt_big
n.f = 'font * white'
n.set(g)
return n
}
var bc = 0
n.bullet = function(t, y){
var g = fn.named(arguments)
var n = ui.text()
n.x = '0.5*p.w - 0.5*800 + 20'
n.y = '0.5*p.h - 0.5*600 + 20 + n.yv*40'
n.yv = bc++
n.b = fnt_med
n.f = 'font * white'
n.set(g)
return n
}
n.pic = function(g){
var n = ui.rect()
n.x = '0.5*p.w - 0.5*n.w'
n.y = '0.5*p.h - 0.5*n.h'
n.w = 800
n.h = 600
n.set(g)
return n
}
n.set(g)
return n
}
cm.slides(b)
b.set(g)
return b
}
})


define('/core/themes',function(require, exports){
function hex(c){ return 'vec4('+(((c>>16)&0xff)/255)+','+(((c>>8)&0xff)/255)+','+((c&0xff)/255)+',1)' }
function hexs(c){ return hex(parseInt(c,16)) }
exports.dark = {
subpx: 'vec4(0,0,0,1)',
dlgbg: hexs('808080'),
dlgbg: hexs('8F8F94'),
dlghi: hexs('9996e2'),
sliderbase: 'vec4(0,0,0,0.1)',
splitter1: hexs('333333'),
splitter2: hexs('444444'),
splitter3: hexs('777777'),
dlgtxt: hexs('FFFFFF'),
defbg2: hexs('000000'),
defbg: hexs('333333'),
deftxt: hexs('D3D3D3'),
deftbg: hexs('7f7f7f'),
selbg: hexs('9996e2'),
seltxt: hexs('000000'),
codeHover: hexs('2E2D52'),
codeSelect : hexs('424171'),
codeMark : hexs('424171'),
codeCursor: hexs('FFFFFF'),
codeBg2: hexs('4c4c4c'),
codeCall: hexs('033b6e'),
codeSelf: hexs('4D55A1'),
codeArg: hexs('032c54'),
codeBg: hexs('151426'),
codeFg: hexs('FFFFFF'),
codeLineBg: hexs('001625'),
codeLine: hexs('7a909e'),
codeTab: hexs('3f5c73'),
codeNumber: hexs('fb638d'),
codeVardef: hexs('fdec85'),
codeName: hexs('FFFFFF'),
codeString: hexs('3ed625'),
codeOperator: hexs('f59c25'),
codeComment: hexs('1a89f3'),
codeColor1: hexs('ffcccc'),
codeColor2: hexs('ffe0cc'),
codeColor3: hexs('fffecc'),
codeColor4: hexs('c7f5c4'),
codeColor5: hexs('c4f0f4'),
codeColor6: hexs('c9c4f4'),
codeColor7: hexs('f6c6e6'),
codeColor8: hexs('ffffff'),
codeExNone: hexs('660000'),
codeExOnce: hexs('006600'),
codeExMany: hexs('0B615E')
}
exports.dark2 = {
subpx: 'vec4(0,0,0,0.4)',
dlgbg: hexs('FFFFFF'),
dlghi: hexs('efefef'),
sliderbase: 'vec4(0,0,0,0.1)',
splitter1: hexs('5f5f5f'),
splitter2: hexs('6f6f6f'),
splitter3: hexs('9f9f9f'),
dlgtxt: hexs('FFFFFF'),
defbg2: hexs('3f3f3f'),
defbg: hexs('6f6f6f'),
deftxt: hexs('FFFFFF'),
deftbg: hexs('7f7f7f'),
selbg: hexs('9996e2'),
seltxt: hexs('000000'),
codeHover: hexs('FFF7C2'),
codeSelect : hexs('d3e2f4'),
codeMark : hexs('FFED75'),
codeCursor: hexs('000000'),
codeBg2: hexs('ffffff'),
codeCall: hexs('E0E6FF'),
codeSelf: hexs('F2D9FC'),
codeArg: hexs('D9E0FF'),
codeBg: hexs('ededed'),
codeFg: hexs('000000'),
codeLineBg: hexs('d3e2f4'),
codeLine: hexs('808080'),
codeTab: hexs('3f5c73'),
codeNumber: hexs('0000FF'),
codeVardef: hexs('8B0000'),
codeName: hexs('000000'),
codeString: hexs('006400'),
codeOperator: hexs('f59c25'),
codeComment: hexs('0000FF'),
codeColor1: hexs('539a2f'),
codeColor2: hexs('9aa633'),
codeColor3: hexs('ac8935'),
codeColor4: hexs('ac4d35'),
codeColor5: hexs('a13143'),
codeColor6: hexs('942d8b'),
codeColor7: hexs('592d94'),
codeColor8: hexs('2d3894'),
codeExNone: hexs('FFE0E0'),
codeExOnce: hexs('DDF0CE'),
codeExMany: hexs('D6FFFE')
}
})

define('/core/text_mix',function(require, exports){
var ui = require("./ui")
var fn = require("./fn")
exports.viewport = function(b){
var s = b.vps = {
o:{},
gx:48,
gy:2,
ox:7,
oy:16,
op:13,
os:2,
sx:0,
sy:0,
sp:0,
ss:0,
ts:3,
x:0,
y:0
}
s.sx = s.ox
s.sy = s.oy
s.sp = s.op
s.ss = s.os
b.zoom = function(z){
var osy = s.sy
if(z>1 && s.sy < s.oy/7){
s.sy *= z
if(s.sy>s.oy/7) s.sy = s.oy/7
if(osy!=s.sy) ui.redraw(b)
return
}
s.sx *= z
s.sy *= z
s.sp *= z
s.ss *= z
if(s.sp<s.op/7){
s.sx = s.ox/7
s.sp = s.op/7
s.ss = s.os/7
if(s.sy<1) s.sy = 1
}
if(s.sp > s.op){
s.sx = s.ox
s.sy = s.oy
s.sp = s.op
s.ss = s.os
}
if(osy!=s.sy) ui.redraw(b)
}
if('zm' in b) b.zoom(b.zm)
var v = b._v_
var h = b._h_
if(v){
v._b = b
v.l = 1
v.c = function(){ s.y = -v.mv; ui.redraw(b) }
}
if(h){
h._b = b
h.l = 1
h.c = function(){ s.x = -h.mv; ui.redraw(b) }
}
b.s = function(){
if(!ui.ms.m && !ui.ms.a){
v.ds(ui.mv / s.sy)
h.ds(ui.mh / s.sx)
return
}
if(ui.mv > 0){
var z = Math.pow(0.95,ui.mv / 16)
if(z<0.9) z = 0.9
var sy = s.sy
b.zoom(z)
var z = (ui.my - s.o.y)
b.size()
v.ds( z / sy - z / s.sy )
} else {
var z = Math.pow(1.05,-ui.mv / 16)
if(z>1.1) z = 1.1
var sy = s.sy
b.zoom(z)
var z = (ui.my - s.o.y)
b.size()
v.ds( z / sy - z / s.sy )
}
}
b.v_ = b.size = function(){
if(!v || !h) return
var end = (v.mv >= v.ts - v.pg)
if(!('h' in s.o)) ui.view(b, s.o)
v.pg = s.o.h / s.sy
v.ts = b.th
h.pg = s.o.w / s.sx
h.ts = b.tw + 2
var d
if((d = v.mv - (v.ts - v.pg))>0) v.ds(d)
else if(v.pg && end) v.ds((v.ts - v.pg) - v.mv)
if((d = h.mv - (h.ts - h.pg))>0) h.ds(d)
}
b.view = function(x, y, p, event, center){
var d
var c = center ? (s.o.h-s.gy)/s.sy / 2 : 0
if(center == 2) y += (s.o.h-s.gy)/s.sy / 2
if(!p || p == 1){
if((d = (y + c) - (-s.y + (s.o.h-s.gy)/s.sy - 1) ) > 0) v.ds(d)
}
if(!p || p == 2){
if((d = (y - c)- (-s.y ) ) < 0) v.ds(d)
}
if(!event){
if((d = ((x+2)) - (-s.x + (s.o.w-s.gx)/s.sx)) > 0) h.ds(d)
if((d = ((x) - (-s.x))) < 0) h.ds(d)
if(b.viewChange) b.viewChange(x,y,p)
}
ui.redraw(b)
}
b.tmx = function(){
return fn.max(0, Math.round(-s.x + (ui.mx - s.o.x - s.gx) / s.sx))
}
b.tmy = function(){
return fn.max(0, Math.round(-s.y + (ui.my - s.o.y - s.gy) / s.sy -0.25 ))
}
}
exports.cursors = function(b, opt){
opt = opt || {}
function curSet(){
var s = Object.create(curSet.prototype)
s.l = fn.list('_u', '_d')
return s
}
(function(p){
p.new = function(u, v, x, y){
var s = this
var c = cursor()
c.u = u || 0
c.v = v || 0
c.x = x || 0
c.y = y || 0
c.update()
s.l.add(c)
return c
}
p.clear = function(n){
var s = this
var l = n || -1
while(s.l.len){
if(l == 0) break
var c = s.l.last()
s.l.rm(c)
cursor.prototype.pool.add(c)
l--
}
}
p.remerge = function(){
var n = curSet()
var s = this
n.merge(s)
s.l = n.l
}
p.merge = function(o){
var s = this
var c = o.l.first()
var l
o.v = Infinity
o.y = -Infinity
while(c){
var n = c._d
o.l.rm(c)
var cu = c.u
var cv = c.v
var cx = c.x
var cy = c.y
var cf = 0
if( (cv - cy || cu - cx ) > 0 ) cu = c.x, cv = c.y, cx = c.u, cy = c.v, cf = 1
var d = s.l.first()
while(d){
var m = d._d
var du = d.u
var dv = d.v
var dx = d.x
var dy = d.y
if( (dv - dy || du - dx ) > 0 ) du = d.x, dv = d.y, dx = d.u, dy = d.v
if ( (cy - dv || cx - du) > 0){
if( (cv - dy || cu - dx) < 0){
if( (cv - dv || cu - du) > 0) cv = dv, cu = du
if( (cy - dy || cx - dx) < 0) cy = dy, cx = dx
s.l.rm(d)
cursor.prototype.pool.add(d)
}
}
d = m
}
if(cv < o.v) o.v = cv, o.cv = c
if(cy > o.y) o.y = cy, o.cy = c
c.u = cf?cx:cu
c.v = cf?cy:cv
c.x = cf?cu:cx
c.y = cf?cv:cy
c.update()
s.l.add(c)
c = n
}
}
p.grid = function(u, v, x, y){
var s = this
var l = Math.abs(y - v) + 1
while(s.l.len < l) s.l.add(cursor())
while(s.l.len > l){
var c = s.l.last()
s.l.rm(c)
cursor.prototype.pool.add(c)
}
var c = s.l.first()
var d = y - v > 0 ? 1 : -1
var i = v
var e = s + d
while(c){
if(c.u != u || c.y != i || c.v != i || c.x != x){
c.u = u, c.y = c.v = i, c.w = c.x = x
c.update()
}
if(i == y) break
i += d
c = c._d
}
}
function fwd(n){
p[n] = function(){
var c = this.l.first()
while(c){
c[n].apply(c, arguments)
c = c._d
}
}
}
fwd('up')
fwd('down')
fwd('left')
fwd('right')
fwd('home')
fwd('end')
fwd('pgup')
fwd('pgdn')
p.copy = function(){
var a = ""
var c = this.l.first()
while(c){
if(a) a += "\n"
a += c.copy()
c = c._d
}
return a
}
})(curSet.prototype)
b.vcs = curSet()
b.dcs = curSet()
b.mcs = curSet()
function cursor(){
var c
var p = cursor.prototype.pool
if(p.len) p.rm(c = p.last())
else c = Object.create(cursor.prototype)
c.u = 0
c.v = 0
c.x = 0
c.y = 0
c.w = 0
return c
}
(function(p){
p.pool = fn.list('_u', '_d')
p.select = function(n){
var c = this
c.v = c.y
c.u = n.x
c.w = c.x = n.x + n.w
c.update()
}
p.clear = function(){
var c = this
c.w = c.u = c.x
c.v = c.y
c.update()
}
p.selectLine = function(){
var c = this
c.w = c.x = c.u = 0
c.y = c.v + 1
c.update()
}
p.mouse = function(b){
var c = this
c.w = c.x = b.tmx()
c.y = fn.min(b.tmy(), b.th - 1)
}
p.updatew = function(){
var c = this
c.update()
c.w = c.x
}
p.inRange = function(x,y){
var c = this
var d1 = c.v - y || c.u - x
var d2 = c.y - y || c.x - x
return d1 <= 0 && d2 >= 0
}
p.left = function(s){
var c = this
var d = (c.v - c.y || c.u - c.x)
if(d != 0 && !s){
if(d > 0) c.u = c.x, c.v = c.y
else c.x = c.u, c.y = c.v
c.update()
} else {
if(c.x == 0){
if(!c.y) return
c.y --
c.x = 256
if(!s) c.u = c.x, c.v = c.y
c.update()
c.w = c.x
if(!s) c.u = c.x
} else {
c.w = -- c.x
if(!s) c.u = c.x, c.v = c.y
c.update()
}
}
}
p.right = function(s){
var c = this
var d = (c.v - c.y || c.u - c.x)
if(d != 0 && !s){
if(d < 0) c.u = c.x, c.v = c.y
else c.x = c.u, c.y = c.v
c.update()
} else {
c.w = c.x++
if(!s) c.u = c.x, c.v = c.y
c.update()
if(c.x == c.w){
if(c.y >= b.th) return
c.x = c.w = 0
c.y++
if(!s) c.u = c.x, c.v = c.y
c.update()
} else c.w = c.x
}
}
p.down = function(s, d){
var c = this
if(c.y >= b.th) return
c.y += d || 1
if(c.y > b.th - 1) c.y = b.th - 1
c.x = c.w
if(!s) c.u = c.x, c.v = c.y
c.update()
}
p.up = function(s, d){
var c = this
if(!c.y) return
c.y -= d || 1
if(c.y < 0) c.y = 0
c.x = c.w
if(!s) c.u = c.x, c.v = c.y
c.update()
if(!s) c.u = c.x
}
p.home = function(s){
this.up(s, this.y)
}
p.end = function(s){
this.down(s, b.th - this.y)
}
p.pgup = function(s){
this.up(s, Math.floor(b.vps.o.h / b.vps.sy))
}
p.pgdn = function(s){
this.down(s, Math.floor(b.vps.o.h / b.vps.sy))
}
p.copy = function(){
var c = this
var u = c.u, v = c.v, x = c.x, y = c.y
if(y <= v) u = c.x, v = c.y, x = c.u, y = c.v
if(y == v && x < u) x = c.x, u = c.u
var a = ""
for(var i = v; i <= y; i++){
var s = 0
var t = ""
var e = b.lines[i].length
if(i == v) s = u
if(i == y) e = x
else t = "\n"
a += b.lines[i].slice(s, e) + t
}
return a
}
p.update = function(){
b.cursorUpdate(this)
}
p.view = function(p){
var c = this
var d
b.view(c.x, c.y, p)
}
})(cursor.prototype)
var tct = fn.dt()
var tcx = 0
var tcy = 0
b.selectLine = function(y){
b.vcs.clear()
cmc = b.vcs.new()
cmc.u = 0
cmc.w = cmc.x = Infinity
cmc.y = cmc.v = y
cmc.update()
cmc.view()
}
b.selectFirst = function(y){
b.vcs.clear()
cmc = b.vcs.new()
cmc.u = 0
cmc.w = cmc.x = 0
cmc.y = cmc.v = y
cmc.update()
cmc.view()
}
b.u = function(){
if(!ui.ms.m){
b.vcs.clear()
cmc = b.vcs.new()
} else {
b.vcs.clear(1)
cmc = b.vcs.l.last()
}
cmc.mouse(b)
cmc.clear()
if(b.cursorToNode){
var n = b.cursorToNode(cmc)
if(n) cmc.select( n )
} else {
cmc.selectLine()
}
tct.reset()
tcx = ui.mx
tcy = ui.my
ui.redraw(b)
}
var cmc
var gsx
var gsy
var gmm
b.p = function(){
ui.focus(b)
if(ui.mx == tcx && ui.my == tcy && tct() < 500){
cmc = b.vcs.l.last()
cmc.selectLine()
return 1
}
var o, u, v
if(!ui.ms.m){
if(cmc) o = cmc, u = o.u, v = o.v
b.vcs.clear()
}
if(ui.ms.a && !opt.singleCursor){
gsx = b.tmx()
gsy = b.tmy()
gmm = 1
} else {
gmm = 0
cmc = b.dcs.new()
cmc.mouse(b)
if(!ui.ms.s) cmc.clear()
else if(o) cmc.u = u, cmc.v = v, cmc.updatew()
cmc.view()
}
ui.cap = b
return 1
}
b.lastMarker = 1
b.m = function(){
if(ui.cap == b){
if(gmm){
b.dcs.grid(gsx, gsy, b.tmx(), b.tmy())
var c = b.dcs.l.last()
if(c) c.view()
} else {
cmc.mouse(b)
if(opt.noSelect) cmc.u = cmc.x, cmc.v = cmc.y
cmc.updatew()
cmc.view()
}
}
var y = fn.min(b.tmy(), b.th - 1)
if(y != b.hy && b.textHover){
b.hy = y
b.textHover()
}
if(b.markerHover){
var mh = 0
var x = b.tmx()
var c = b.mcs.l.first()
while(c){
if(c.inRange(x,y)) mh = c
c = c._d
}
b.markerHover(mh)
if(!mh) ui.gl.cursor(opt.cursor || 'text')
} else ui.gl.cursor(opt.cursor || 'text')
return 1
}
b.r = function(){
b.vcs.merge(b.dcs)
ui.cap = 0
}
b.k = function(){
switch(ui.key.i){
case 'a':
if(ui.key.c || ui.key.m){
b.vcs.clear()
cmc = b.vcs.new()
cmc.u = cmc.v = 0
cmc.y = b.lines.length - 1
cmc.x = b.lines[cmc.y].length
cmc.update()
}
break
case 'c':
if(ui.key.c || ui.key.m) ui.gl.setpaste(b.vcs.copy())
break
case 'pgup':
b.vcs.pgup(ui.key.s)
b.vcs.remerge()
if(b.vcs.cy) b.vcs.cy.view(2)
break
case 'pgdn':
b.vcs.pgdn(ui.key.s)
b.vcs.remerge()
if(b.vcs.cv) b.vcs.cv.view(1)
break
case 'home':
b.vcs.home(ui.key.s)
b.vcs.remerge()
if(b.vcs.cy) b.vcs.cy.view(2)
break
case 'end':
b.vcs.end(ui.key.s)
b.vcs.remerge()
if(b.vcs.cv) b.vcs.cv.view(1)
break
case 'down':
b.vcs.down(ui.key.s)
b.vcs.remerge()
if(b.vcs.cv) b.vcs.cv.view(1)
break
case 'up':
b.vcs.up(ui.key.s)
b.vcs.remerge()
if(b.vcs.cy) b.vcs.cy.view(2)
break
case 'right':
b.vcs.right(ui.key.s)
b.vcs.remerge()
if(b.vcs.cv) b.vcs.cv.view(1)
break
case 'left':
b.vcs.left(ui.key.s)
b.vcs.remerge()
if(b.vcs.cy) b.vcs.cy.view(2)
break;
}
}
}
exports.drawing = function(b){
b.drawText = function(){
var s = b.sh.text
s.use()
s.set(ui.uniforms)
s.sz(b.vps.sx, b.vps.sy, b.vps.sp * ui.gl.ratio, (b.vps.oy - b.vps.sy <2) ? 0.5:0)
s.b(b.font)
var t = b.tvc || b.text.first()
var h = (b.vps.o.h / b.vps.sy)
if(t){
while(t._u && t.y > (-b.vps.y)) t = t._u
while(t._d && t.y < (-b.vps.y)-255) t = t._d
b.tvc = t
}
while(t && b.vps.y + t.y < h){
s.ps(b.vps.x, b.vps.y + t.y, b.vps.o.x + b.vps.gx, b.vps.o.y + b.vps.gy)
s.draw(t)
t = t._d
}
}
b.drawSelection = function(){
var s = b.sh.select
s.use()
s.set(ui.uniforms)
s.sz(b.vps.sx, b.vps.sy, b.vps.ss)
s.ps(b.vps.x, b.vps.y, b.vps.o.x + b.vps.gx, b.vps.o.y + b.vps.gy)
var c = b.mcs.l.first()
while(c){
if(c.fg) s.fg(c.fg)
else s.fg(ui.t.codeSelect)
if(c.vb) s.draw(c.vb)
c = c._d
}
s.fg(ui.t.codeSelect)
var c = b.vcs.l.first()
while(c){
if(c.vb) s.draw(c.vb)
c = c._d
}
var c = b.dcs.l.first()
while(c){
if(c.vb) s.draw(c.vb)
c = c._d
}
}
b.drawCursors = function(){
var c = b.vcs.l.first()
var s = b.sh.cursor
while(c){
s.rect(b.vps.o.x + b.vps.gx + (b.vps.x + c.x) * b.vps.sx, b.vps.o.y - b.vps.ss + (b.vps.y + c.y) * b.vps.sy + b.vps.gy, 1, b.vps.sy)
c = c._d
}
var c = b.dcs.l.first()
while(c){
s.rect(b.vps.o.x + b.vps.gx + (b.vps.x + c.x) * b.vps.sx, b.vps.o.y - b.vps.ss + (b.vps.y + c.y) * b.vps.sy + b.vps.gy, 1, b.vps.sy)
c = c._d
}
}
b.drawLineMarks = function(){
var c = b.vcs.l.first()
var s = b.sh.line
while(c){
s.rect(b.vps.o.x, b.vps.o.y - b.vps.ss + (c.y + b.vps.y) * b.vps.sy + b.vps.gy, b.vps.gx - 4, b.vps.sy )
c = c._d
}
var c = b.dcs.l.first()
while(c){
s.rect(b.vps.o.x, b.vps.o.y - b.vps.ss + (c.y + b.vps.y) * b.vps.sy + b.vps.gy, b.vps.gx - 4, b.vps.sy )
c = c._d
}
}
b.drawLines = function(){
var s = b.sh.text
s.use()
s.set(ui.uniforms)
s.sz(b.vps.ox, b.lvb.hy, b.vps.op, 0.5)
s.b(b.font)
s.ps(0, 0, b.vps.o.x, b.vps.o.y + b.vps.gy + b.lvb.ry)
s.draw(b.lvb)
}
b.drawShadows = function(){
if( b.vps.x != 0){
b.sh.lrShadow.rect(b.vps.o.x , b.vps.o.y, 5, b.vps.o.h)
}
if( b.vps.y != 0){
b.sh.topShadow.rect(b.vps.o.x, b.vps.o.y, b.vps.o.w, 5)
}
if(b._h_.l == 1)
b.sh.lrShadow.rect(b.vps.o.x + b.vps.o.w, b.vps.o.y, - 5, b.vps.o.h)
}
b.cursorUpdate = function(c){
var u = c.u, v = c.v, x = c.x, y = c.y
var cf
if(y <= v) u = c.x, v = c.y, x = c.u, y = c.v
if(!c.vb || c.vb.$sc < (y-v + 1)){
c.vb = b.sh.select.alloc( (y-v + 1) * 2, c.vb)
}
var j = 0
var e = c.vb.e.a
var r = c.vb.r.a
var s = c.vb.e.s
var o = 0
var xs
var xe
var p1 = NaN
var p2 = NaN
var pf = 0
var po = 0
c.vb.hi = 0
var t = b.tvc || b.text.first()
if(t){
while(t._u && (t.y) > v) t = t._u
while(t._d && (t.y+t.l) < v) t = t._d
}
while(t){
var l = t.ll.length
var j = t.y
if(y >= j && v <= j + l){
var xt = 0
for(var i = fn.max(0, v - j); i + j <= y && i < l; i++){
var x1 = 0
var y1 = j + i
var x2 = t.ll[i]
var y2 = y1 + 1
if(i + j == v) xs = x1 = fn.min(x2, u), t.ld && (c.d = t.ld[i])
if(i + j == y) xe = x2 = fn.min(x2, x),xt = 1, t.ld && (c.d = t.ld[i])
else x2 += 1
if(v == y && x2 < x1) xs = x2 = x1, x1 = xe, xe = x2
var fl = 0, of = pf
if(p1 == x1) fl += 1
if(p1 >= x1 && x2 > p1) pf += 2
if(p2 >= x2 && x2 > p1) fl += 4
if(p2 <= x2) pf += 8
if(of != pf) for(var k = 0;k<6;k++, po += s) r[po] = pf
po = o+3
r[o] = x1, r[o+1] = y1, r[o+2] = x2, r[o+3] = fl,
e[o] = x1, e[o+1] = y1, o += s
r[o] = x1, r[o+1] = y1, r[o+2] = x2, r[o+3] = fl,
e[o] = x2, e[o+1] = y1, o += s
r[o] = x1, r[o+1] = y1, r[o+2] = x2, r[o+3] = fl,
e[o] = x1, e[o+1] = y2, o += s
r[o] = x1, r[o+1] = y1, r[o+2] = x2, r[o+3] = fl,
e[o] = x2, e[o+1] = y1, o += s
r[o] = x1, r[o+1] = y1, r[o+2] = x2, r[o+3] = fl,
e[o] = x1, e[o+1] = y2, o += s
r[o] = x1, r[o+1] = y1, r[o+2] = x2, r[o+3] = fl,
e[o] = x2, e[o+1] = y2, o += s
pf = fl
p1 = x1
p2 = x2
c.vb.hi++
}
if(xt) break
}
j += l
t = t._d
}
if(c.y <= c.v) c.x = xs
else c.x = xe
if(c.vb.hi) c.vb.up = 1
}
b.linesUpdate = function(lncol){
if(!b.lvb) b.lvb = b.sh.text.alloc(255 * 5)
var t = -b.vps.y
var k = Math.ceil(b.vps.oy / b.vps.sy)
b.lvb.hy = k * b.vps.sy
var a = Math.floor(t / k)* k + 1
b.lvb.ry = -(t - a + 1) * b.vps.sy
var l = fn.min(b.th+2, a + Math.ceil(b.vps.o.h / b.vps.sy) )
var e = b.lvb.e.a
var f = b.lvb.fg.a
var s = b.lvb.e.s
var o = 0
b.lvb.hi = 0
for(var i = a, y = 0; i < l; i += k, y++){
var d = i
var x = 4
while(d){
e[o] = x | (y<<8) | b.font.t[ (d%10 + 48) - b.font.s ]
f[o] = lncol
b.lvb.hi++
o += s
x --
d = Math.floor(d / 10)
}
}
b.lvb.up = 1
}
}
exports.storage = function(b, blockSize){
blockSize = 250 * 20 || blockSize
b.text = fn.list('_u', '_d')
b.tw = 0
b.th = 0
b.tvc = null
function allocNode(len){
var v = b.text.last()
if(!v || v.l > 250 || v.hi + len > blockSize){
var x = 0
if(v) x = v.x
v = b.sh.text.alloc(blockSize)
v.x = x
v.y = b.th
v.ll = []
v.ld = []
v.l = 0
b.text.add(v)
}
return v
}
b.addChunk = function(t, fg){
var v = allocNode(t.length)
var e = v.e.a
var f = v.fg.a
var s = v.e.s
var o = v.hi * s
var a = 0
var l = t.length
for(var i = 0; i < l; i++){
if(v.x < 255){
var c = t.charCodeAt(i)
e[o] = v.x | (v.l << 8) | b.font.t[c - b.font.s]
f[o] = fg
o += s
a++
}
v.x++
}
v.hi += a
v.up = 1
return v
}
b.addTabs = function(num, stops, col){
var v = allocNode(num)
var e = v.e.a
var f = v.fg.a
var s = v.e.s
var o = v.hi * s
var y = v.l
var a = 0
for(var i = 0;i<num;i++){
e[o] = i*stops | (y<<8) | b.font.t[127 - b.font.s]
f[o] = col
o += s
a++
}
v.hi += a
v.up = 1
v.x = num*stops
return v
}
b.endLine = function(data, ox){
var v = b.text.last()
v.ll[v.l] = arguments.length > 1 ? ox: v.x
v.ld[v.l] = data
if(v.x > b.tw) b.tw = v.x
v.l ++
b.th ++
v.x = 0
}
b.addFormat = function(t, colors){
var v = allocNode(t.length)
var e = v.e.a
var f = v.fg.a
var s = v.e.s
var o = v.hi * s
var x = v.x
var y = v.l
var a = 0
var l = t.length
var fg = colors.def
for(var i = 0;i<l;i++){
if(x>255) break
var c = t.charCodeAt(i)
if(c == 12){
fg = colors[t.charAt(++i)] || colors.def
} else if(c == 32){
x++
} else {
e[o] = x | (y<<8) | b.font.t[c - b.font.s]
f[o] = fg
o += s
a++
x++
}
}
v.x = x
v.hi += a
v.up = 1
}
b.clearText = function(){
var v = b.text.first()
b.text.clear()
b.tvc = null
if(v){
b.text.add(v)
v.l = 0
v.y = 0
v.x = 0
v.hi = 0
v.up = true
}
b.tw = 0
b.th = 0
}
b.setStorage = function(from){
b.text = from.text
b.lines = from.lines
b.tvc = null
b.tw = from.tw
b.th = from.th
}
}
})

define('/trace/trace_db',function(require, exports, module){
var fn = require("../core/fn")
var ui = require("../core/ui")
var tm = require("../core/text_mix")
function traceDb(o){
var db = {sh:{}}
tm.storage(db)
db.changed = fn.ps()
db.lineDict = o?o.lineDict:{}
db.fileDict = o?o.fileDict:{}
db.msgIds = {}
var fid = 0
db.colors = {
def:ui.t.codeName,
i:ui.t.codeName,
s:ui.t.codeString,
a:ui.t.codeOperator,
n:ui.t.codeNumber,
v:ui.t.codeVardef,
t:ui.t.codeName,
c:ui.t.codeComment,
1:ui.t.codeColor1,
2:ui.t.codeColor2,
3:ui.t.codeColor3,
4:ui.t.codeColor4,
5:ui.t.codeColor5,
6:ui.t.codeColor6,
7:ui.t.codeColor7,
8:ui.t.codeColor8
}
var last
var lgc = 0
db.processTrace = function(m){
if(!lgc) lgc = m.g
else{
if(lgc + 1 != m.g){
fn("Message order err", lgc, m.g)
}
lgc = m.g
}
var l = db.lineDict[m.i]
if(!l){
fn('got trace without lookup')
return
}
if(!last){
if(l.n) last = m
} else {
if(m.d > last.d) m.p = last, last = m
else {
if(l.ret){
if(l.ret != last.i){
var l2 = db.lineDict[l.ret]
var n2 = db.fileDict[l2.fid].longName
var l3 = db.lineDict[last.i]
var n3 = db.fileDict[l3.fid].longName
fn('invalid return',m.i, n2, l2.n, l2.y, n3, l3.n, l3.y)
}
last.r = m
last.s += ' '+db.fmtCall(m).replace(/\f[a-zA-Z0-9]/g,'')
} else {
var n2 = db.fileDict[l.fid].longName
var l3 = db.lineDict[last.i]
var n3 = db.fileDict[l3.fid].longName
fn(m.i, l)
}
var d = (last.d - m.d) + 1
while(d > 0 && last) last = last.p, d--
if(l.n){
m.p = last, last = m
}
}
}
if(l.n){
if(last && last.p){
if(last.p.cs) m.nc = last.p.cs
last.p.cs = m
}
m.y = db.th
var dp = m.d > 64 ? 64 : m.d
db.addTabs(dp, 1, ui.t.codeTab)
var t = db.fmtCall(m)
db.addFormat((m.d>dp?'>':'')+t, db.colors)
db.endLine(m)
if(!db.firstMessage) db.firstMessage = m
db.msgIds[m.g] = m
var u = db.msgIds[m.u]
if(u){
if(u.us) m.nu = u.us
u.us = m
}
m.s = t.replace(/\f[a-zA-Z0-9]/g,'')
db.changed()
return true
}
}
db.find = function(id){
return db.msgIds[id]
}
db.addTrace = function(m){
db.addFormat(db.fmtCall(m), db.colors)
db.endLine(m)
}
db.fmt = function(v, lim){
lim = lim || 255
var t = typeof v
if(t == 'string'){
if(v.indexOf('_$_') == 0){
v = v.slice(3)
if(v == 'undefined') return '\fn'+v
return '\fv' + v
}
return '\fs'+JSON.stringify(v)
}
if(t == 'number') return '\fn'+v
if(t == 'boolean') return '\fn'+v
if(t == 'undefined') return '\fnundefined'
if(!v) return '\fnnull'
if(Array.isArray(v)){
var s = '\fi['
for(var k in v){
if(s.length!=3) s+='\fi,'
s += db.fmt(v[k])
}
s += '\fi]'
if(s.length>lim) return s.slice(0,lim)+' \fv...\fi]'
} else {
var s = '\fi{'
for(var k in v){
if(s.length!=3) s+='\fi,'
if(k.indexOf(' ')!=-1) s+='\fs"'+ k+'"'+'\fi:'
else s += '\ft' + k + ':'
t = typeof v[k]
s += db.fmt(v[k])
}
s += '\fi}'
if(s.length>lim) return s.slice(0,lim)+' \fv...\fi}'
}
return s
}
db.modColor = function(mod){
var uid = 0
for(var i = 0;i<mod.length;i++) uid += mod.charCodeAt(i)
return (uid)%8 + 1
}
db.fmtCall = function(m){
if(m.x){
return '\faexception '+(m.v===undefined?'':db.fmt(m.v))
}
var l = db.lineDict[m.i]
var mod = db.fileDict[l.fid].shortName
var col = db.modColor(mod)
if(l.ret){
var f = db.lineDict[l.ret]
return '\fareturn '+(m.v===undefined?'':db.fmt(m.v))
} else {
var s = []
for(var i = 0;i<l.a.length;i++) s.push('\ft'+l.a[i].n + '\fa=' + db.fmt(m.a[i]))
return '\f'+col+mod+ '\fa \fi'+l.n+'\fi('+s.join('\fi,')+'\fi)'
}
}
db.addDict = function(m){
var d = m.d
for(var k in d){
db.lineDict[k] = d[k]
db.lineDict[k].fid = fid
}
db.fileDict[fid++] = {
longName:m.f,
shortName:m.f.match(/\/([^\/]*)(?:.js)$/)[1]
}
}
return db
}
return traceDb
})


define('/core/text_shaders',function(require, exports){
var gl = require("./gl")
var ui = require("./ui")
exports.codeText = ui.shader({
u: {
b:'sampler2D',
sz:'vec4',
ps:'vec4',
},
a: {
e:'ucol',
fg:'float'
},
p: 'sz.z',
v: gl.ratio>1?
'vec4((((ps.z+(ps.x+e.x*255)*sz.x+0.25*sz.z)+sz.w+l.x)/s.x)*2.-1.,1.-(((ps.w + (ps.y+e.y*255)*sz.y+0.25*sz.z)+sz.w+l.y)/s.y)*2.,0,1.)':
'vec4(((floor(ps.z+(ps.x+e.x*255)*sz.x+0.5*sz.z)+sz.w+l.x)/s.x)*2.-1.,1.-((floor(ps.w + (ps.y+e.y*255)*sz.y+0.5*sz.z)+sz.w+l.y)/s.y)*2.,0,1.)',
f: gl.ratio>1?
'subpix(texture2D(b,vec2(e.z*0.99609375 + c.x/(512./26.), e.w*0.99609375 + c.y/(512./26.))),t.codeBg,theme(fg))':
'subpix(texture2D(b,vec2(e.z*0.99609375 + c.x/(512./13.), e.w*0.99609375 + c.y/(128./13.))),t.codeBg,theme(fg))',
m: ui.gl.POINTS,
l: 1
})
exports.selectRect = ui.shader({
u: {
sz:'vec4',
ps:'vec4',
fg:'float'
},
a: {
e:'vec2',
r:'vec4'
},
v: 'vec4((floor(ps.z + (e.x+ps.x)*sz.x+l.x)/s.x)*2.-1., 1.-(floor(ps.w + (e.y+ps.y)*sz.y-sz.z+l.y)/s.y)*2.,0,1.)',
f: function(){
vec3_v(floor(ps.z + (ps.x + r.x)* sz.x),floor(ps.w + (ps.y + r.y )* sz.y - sz.z), ps.z + (ps.x + r.z) * sz.x)
vec4_c(theme(fg))
if(f.x < v.x + 0.5*sz.x){
vec2_d(f.x - (v.x + sz.x), f.y - (v.y + 0.5*sz.y))
if(d.y<0 && mod(r.w,2) == 1) return_vec4(c)
if(d.y>0 && mod(r.w,4) >= 2) return_vec4(c)
return_vec4(c.xyz, sqrt(d.x*d.x+d.y*d.y)>9?0:c.w)
} else if(f.x > v.z - 0.5*sz.x ){
vec2_d(f.x - (v.z - sz.x), f.y - (v.y + 0.5*sz.y))
if(d.y<0 && mod(r.w,8) >= 4) return_vec4(c)
if(d.y>0 && mod(r.w,16) >= 8) return_vec4(c)
return_vec4(c.xyz, sqrt(d.x*d.x+d.y*d.y)>9?0:c.w)
}
return_vec4(c)
},
m: ui.gl.TRIANGLES,
l: 6
})
})


define('/trace/code_db',function(require){
var fn = require("../core/fn")
var ui = require("../core/ui")
var ac = require("../core/acorn")
var ct = require("../core/controls")
var tm = require("../core/text_mix")
var ts = require("../core/text_shaders")
var gl = ui.gl
var ft1 = ui.gl.sfont(
navigator.platform.match(/Mac/)?
"12px Menlo":
"12px Lucida Console")
function codeDb(g){
var db = {sh:{}}
db.files = {}
var ls = 0
var lw = 0
function addWhitespace(f, text, fg){
var l = text.length
var v = f.text.last() || f.addChunk('', c)
for(var i = 0;i < l; i++){
var c = text.charCodeAt(i)
if(c == 32){
if(ls && !(v.x%tabWidth)) v = f.addChunk("\x7f", ctbl.tab)
else v.x ++
}
else if(c == 9){
var tw = tabWidth - v.x%tabWidth
if(ls && !(v.x%tabWidth)) v = f.addChunk("\x7f", ctbl.tab), v.x += tabWidth - 1
else v.x += tw
}
else if(c == 10){
var xold = v.x
if(v.x < lw){
for(v.x = v.x?tabWidth:0;v.x<lw;v.x += tabWidth - 1)
v = f.addChunk("\x7f", ctbl.tab)
}
f.endLine(xold)
ls = 1
} else {
if(ls) lw = v.x, ls = 0
v = f.addChunk(text.charAt(i), fg || ctbl.comment)
}
}
}
var ctbl = {
"num" : ui.t.codeNumber,
"regexp": ui.t.codeRegexp,
"name": ui.t.codeName,
"string": ui.t.codeString,
"keyword": ui.t.codeOperator,
"var": ui.t.codeVardef,
"tab": ui.t.codeTab,
"comment": ui.t.codeComment,
"operator": ui.t.codeOperator
}
var tabWidth = 3
db.fetch = function(name, cb){
}
db.parse = function(name, src){
var f = db.files[name] || (db.files[name] = {})
tm.storage(f)
f.font = ft1
f.sh = {text:db.sh.text}
src = src.replace(/^\#.*?\n/,'\n')
f.lines = src.replace(/\t/,Array(tabWidth+1).join(' ')).split(/\n/)
var t = ac.parse(src, {tokens:1})
t.tokens.walk(function(n){
if(n.t){
var c = ctbl[n._t.type]
if(!c) {
if(n._t.binop || n._t.isAssign) c = ctbl.operator
else if(n._t.keyword){
if(n.t == 'var' || n.t == 'function') c = ctbl.var
else c = ctbl.keyword
} else c = ctbl.name
}
if(n.t.indexOf('\n')!= -1){
var a = n.t.split(/\n/)
for(var i = 0;i<a.length;i++){
f.addChunk(a[i], c)
if(i < a.length - 1) f.endLine()
}
} else {
if(ls) lw = f.text.last().x, ls = 0
f.addChunk(n.t, c)
}
}
addWhitespace(f, n.w)
})
return f
}
return db
}
return codeDb
})


define('/trace/list_view',function(require, exports, module){
var fn = require("../core/fn")
var ui = require("../core/ui")
var ct = require("../core/controls")
var tm = require("../core/text_mix")
var ts = require("../core/text_shaders")
var gl = ui.gl
var font1 = ui.gl.sfont(
navigator.platform.match(/Mac/)?
"12px Menlo":
"12px Lucida Console")
function listView(g){
var b = ui.rect({f:'t.codeBg'})
b._v_ = ct.vScrollHider({h:'p.h - 10'})
b._h_ = ct.hScrollHider({w:'p.w - 10'})
b.set(g)
b.font = font1
b.sh = {
lrShadow: ui.rect.drawer({f:'mix(vec4(0,0,0,0.3),vec4(0,0,0,0),c.x)'}),
topShadow: ui.rect.drawer({f:'mix(vec4(0,0,0,0.3),vec4(0,0,0,0),c.y)'}),
text: ui.gl.getShader(ts.codeText),
select: ui.gl.getShader(ts.selectRect),
cursor: ui.rect.drawer({f:'t.codeCursor'}),
line: ui.rect.drawer({f:'t.codeLine'}),
hover: ui.rect.drawer({f:'t.codeHover'}),
mark: ui.rect.drawer({f:'t.codeMark'})
}
tm.viewport(b)
tm.cursors(b, {singleCursor:1, noSelect:1, cursor:'default'})
tm.drawing(b)
tm.storage(b)
b.vps.gx = 0
b.vps.gy = 0
if(b.db){
b.text = b.db.text
b.db.font = b.font
b.db.sh.text = b.sh.text
var rt = 0
b.db.changed(function(){
b.tw = b.db.tw
b.th = b.db.th
if(!rt) rt = setTimeout(function(){
rt = 0
b.size()
ui.redraw(b)
},0)
})
}
if(b.cursor){
b.cursor.linked = b
b.vcs = b.cursor.vcs
b.dcs = b.cursor.dcs
b.viewChange = function(x, y){
fn('here1')
}
var last
b.cursor.viewChange = function(x, y){
var c = b.dcs.l.first() || b.vcs.l.first()
if(c && c.d && last != c.d && b.db.selectTrace) b.db.selectTrace(last = c.d)
b.view(x, y, 0, 1)
if(b.cursorMove)b.cursorMove()
}
}
b.o = function(){
if(b.linked){
var c = b.vcs.l.first()
if(c){
b.linked.view(0,c.y, 0, 1, 1)
}
} else {
b.hy = -1
ui.redraw(b)
}
}
b.textHover = function(){
if(b.linked && b.linked.cursorMove) b.linked.cursorMove()
ui.redraw(b)
if(b.linked) ui.redraw(b.linked)
}
var ly = 0
function layer(){
ui.view(b, b.vps.o)
if(!b._v_.pg) b.size()
var y = b.hy
if(y >=0) b.sh.hover.rect(b.vps.o.x , b.vps.o.y - b.vps.ss + (y + b.vps.y) * b.vps.sy + b.vps.gy, b.vps.o.w , b.vps.sy )
if(ly != y){
ly = y
if(b.linked){
b.linked.hy = y
b.linked.view(0, y, 0, 1, 1)
}
}
var c = b.vcs.l.first()
while(c){
b.sh.mark.rect(b.vps.o.x , b.vps.o.y - b.vps.ss + (b.vps.y + c.y) * b.vps.sy + b.vps.gy, b.vps.o.w, b.vps.sy)
c = c._d
}
var c = b.dcs.l.first()
while(c){
b.sh.mark.rect(b.vps.o.x , b.vps.o.y - b.vps.ss + (b.vps.y + c.y) * b.vps.sy + b.vps.gy, b.vps.o.w, b.vps.sy)
c = c._d
}
b.drawText()
b.drawShadows()
}
b.l = layer
b.show = function(){
b.l = layer
ui.redraw(b)
}
b.hide = function(){
if(b.l !== -1){
b.l = -1
ui.redraw(b)
}
}
return b
}
return listView
})


define('/trace/code_view',function(require){
var fn = require("../core/fn")
var ui = require("../core/ui")
var ac = require("../core/acorn")
var ct = require("../core/controls")
var tm = require("../core/text_mix")
var ts = require("../core/text_shaders")
var gl = ui.gl
var ft1 = ui.gl.sfont(
navigator.platform.match(/Mac/)?
"12px Menlo":
"12px Lucida Console")
function codeView(g){
var b = ui.rect({f:'t.codeBg'})
b._v_ = ct.vScroll({h:'p.h - 10'})
b._h_ = ct.hScroll({w:'p.w - 10'})
b.set(g)
b.font = ft1
b.sh = {
text: ui.gl.getShader(ts.codeText),
select: ui.gl.getShader(ts.selectRect),
cursor: ui.rect.drawer({f:'t.codeCursor'}),
line: ui.rect.drawer({f:'t.codeLineBg'}),
lrShadow: ui.rect.drawer({f:'mix(vec4(0,0,0,0.2),vec4(0,0,0,0),c.x)'}),
topShadow: ui.rect.drawer({f:'mix(t.codeBg,vec4(0,0,0,0),c.y)'})
}
tm.viewport(b)
tm.cursors(b)
tm.drawing(b)
b.l = function(){
ui.view(b, b.vps.o)
if(!b._v_.pg) b.size()
b.linesUpdate(ui.t.codeLine)
b.drawLineMarks()
b.drawLines()
ui.clip(b.vps.o.x + b.vps.gx, b.vps.o.y, b.vps.o.w - b.vps.gx, b.vps.o.h)
b.drawSelection()
if(b.text){
b.drawText()
}
b.drawCursors()
ui.clip(b.vps.o.x, b.vps.o.y, b.vps.o.w, b.vps.o.h)
b.drawShadows()
}
return b
}
return codeView
})


define('/trace/hover_text',function(require){
var fn = require("../core/fn")
var ui = require("../core/ui")
var ac = require("../core/acorn")
var ct = require("../core/controls")
var tm = require("../core/text_mix")
var ts = require("../core/text_shaders")
var gl = ui.gl
var ft1 = ui.gl.sfont(
navigator.platform.match(/Mac/)?
"12px Menlo":
"12px Lucida Console")
function hoverText(g){
var b = ui.rect({f:'mix(vec4(0,0,0,0),alpha(t.codeBg2,0.9),1-smoothstep(0.5,1.0,n.shape(2*(c-.5))))'})
b.shape = function(vec2_v){
return_float(len(vec2(pow(abs(v.x),n.w/5),pow(abs(v.y),n.h/5))))
}
b.set(g)
b.font = ft1
b.sh = {
text: ui.gl.getShader(ts.codeText),
select: ui.gl.getShader(ts.selectRect),
cursor: ui.rect.drawer({f:'t.codeCursor'}),
line: ui.rect.drawer({f:'t.codeLineBg'}),
lrShadow: ui.rect.drawer({f:'mix(vec4(0,0,0,0.2),vec4(0,0,0,0),c.x)'}),
topShadow: ui.rect.drawer({f:'mix(t.codeBg,vec4(0,0,0,0),c.y)'})
}
tm.viewport(b)
tm.cursors(b)
tm.drawing(b)
tm.storage(b)
b.vps.gx = 5
b.vps.gy = 5
b.fit = function(x, y){
var w = b.tw * b.vps.sx + 2*b.vps.gx
x -= 0.5 * w
if(x + w > ui.gl.width)
x = fn.max(0, x + (ui.gl.width - (x + w)))
if(x < 0) x = 0
b.show(x, y + b.vps.sy, w,
b.th * b.vps.sy + 1*b.vps.gy
)
}
b.show = function(x, y, w, h){
b.l = layer
ui.redraw(b)
ui.redrawRect(x, y, w, h)
b.x = x
b.y = y
b.w = w
b.h = h
}
b.hide = function(){
if(b.l !== -1){
b.l = -1
ui.redraw(b)
}
}
function layer(){
ui.view(b, b.vps.o)
b.drawSelection()
if(b.text) b.drawText()
}
b.l = layer
return b
}
return hoverText
})


define('/trace/code_bubble',function(require){
var fn = require("../core/fn")
var ui = require("../core/ui")
var ac = require("../core/acorn")
var ct = require("../core/controls")
var tm = require("../core/text_mix")
var ts = require("../core/text_shaders")
var gl = ui.gl
var ft1 = ui.gl.sfont(
navigator.platform.match(/Mac/)?
"12px Menlo":
"12px Lucida Console")
function codeBubble(g){
var bg = ui.group({l:1})
bg.set(g)
var border = ct.innerShadow({
radius: 10,
stepa:1.05,
stepb:1.15,
inner:'t.codeBg',
outer:'alpha(t.codeBg,0)'
})
border._p = bg
var title = ui.rect({sel:0,f:'mix(t.codeHover,t.codeMark,n.sel)', y:10, h:30, x:10, w:'p.w - 20'})
title._p = bg
bg.title = title
var body = bg.body = ui.rect({f:'t.codeBg', x:10, y:40, h:'p.h - (n.y+10)', w:'p.w - 20'})
body._p = bg
body._v_ = ct.vScrollHider({h:'p.h - 10'})
body._h_ = ct.hScrollHider({w:'p.w - 10'})
title._v_ = ct.vScroll({h:'p.h - 10'})
title._h_ = ct.hScroll({w:'p.w - 10'})
title.font = ft1
body.font = ft1
body.sh = title.sh = {
text: ui.gl.getShader(ts.codeText),
select: ui.gl.getShader(ts.selectRect),
cursor: ui.rect.drawer({f:'t.codeCursor'}),
line: ui.rect.drawer({f:'t.codeLineBg'}),
lrShadow: ui.rect.drawer({f:'mix(vec4(0,0,0,0.2),vec4(0,0,0,0),c.x)'}),
topShadow: ui.rect.drawer({f:'mix(t.codeBg,vec4(0,0,0,0),c.y)'})
}
tm.viewport(body)
tm.cursors(body)
tm.drawing(body)
tm.storage(body)
tm.viewport(title)
tm.cursors(title)
tm.drawing(title)
tm.storage(title)
title.vps.gy = 5
title.vps.gx = 2
body.vps.gx = 2
title.s = null
body.s = null
title._h_.s = body._h_.s = bg._p.s
title._v_.s = body._v_.s = bg._p.s
title.l = function(){
ui.view(title, title.vps.o)
title.drawSelection()
if(title.text){
title.drawText()
}
}
body.l = function(){
ui.view(body, body.vps.o)
if(!body._v_.pg) body.size()
body.drawSelection()
if(body.text){
body.drawText()
}
}
bg.resetLine = function(){
body.view(0, body.line, 0, 1, 2)
}
function setTitle(m){
var v = bg._p._p._p._p.hoverView
var tdb = body.tdb
var l = tdb.lineDict[m.i]
var f = tdb.fileDict[l.fid]
v.clearText()
v.addFormat(f.longName + " line " + l.y, tdb.colors)
v.endLine()
var mod = '\f'+tdb.modColor( f.shortName )+f.shortName
v.addFormat(mod + ' \fi' + l.n + "("+(l.a.length?"":")"), tdb.colors)
v.endLine()
for(var i = 0;i<l.a.length;i++){
var e = i < l.a.length - 1
v.addFormat( '   \ft'+l.a[i] + '\fa = ' + tdb.fmt(m.a[i], 255) + (e?",":""), tdb.colors )
v.endLine()
}
if(m.r && m.r.v !== '_$_undefined' && m.r.v !== undefined){
v.addFormat((l.a.length?")":"")+' '+tdb.fmtCall(m.r), tdb.colors)
v.endLine()
} else {
if(l.a.length){
v.addFormat(")", tdb.colors)
v.endLine()
}
}
}
bg.setTitle = function(m, tdb){
var h = 0
body.y = h + 10
title.h = h + 10
delete title.vps.o.h
title.v_()
return h
}
bg.setBody = function(m, tdb, file, line, height){
body.setStorage(file)
bg.msg = m
body.tdb = tdb
delete body.vps.o.h
bg.h = height
body.v_()
body.line = line - 1
body.view(0, body.line, 0, 1, 2)
body.mcs.clear()
var r = m.r
bg.ret_obj = r
for(var k in r){
var l = tdb.lineDict[k.slice(1)]
if(!l) continue
if(k.charAt(0) == 'b'){
var c = body.mcs.new(l.x, l.y - 1, l.ex, l.ey - 1)
var v = r[k]
if(v == '_$_undefined' || v=='_$_NaN' || !v) c.fg = ui.t.codeExNone
else c.fg = ui.t.codeExOnce
c.jmp = c.lst = null
c.type = 'logic'
c.value = r[k]
} else
if(k.charAt(0) == 'l'){
var c = body.mcs.new(l.x, l.y - 1, l.ex, l.ey - 1)
var v = r[k]
if(v == 0) c.fg = ui.t.codeExNone
else if (v == 1) c.fg = ui.t.codeExOnce
else c.fg = ui.t.codeExMany
c.jmp = c.lst = null
c.type = 'loop x'
c.value = r[k]
} else
if(k.charAt(0) == 'a' && k.length>1){
var c = body.mcs.new(l.x, l.y - 1, l.ex, l.ey - 1)
var v = r[k]
c.fg = ui.t.codeArg
c.jmp = c.lst = null
c.type = '='
c.value = r[k]
} else
if(k.charAt(0) == 'x'){
var c = body.mcs.new(l.x, l.y - 1, l.ex, l.ey - 1)
var v = r[k]
c.fg = ui.t.codeExOnce
c.jmp = c.lst = null
c.type = 'exception'
c.value = r[k]
}
}
var l = tdb.lineDict[m.i]
if(l.a) for(var i = 0;i<l.a.length;i++){
var a = l.a[i]
var c = body.mcs.new(a.x, a.y - 1, a.ex, a.ey - 1)
c.type = a.n +' ='
c.value = m.a[i]
c.jmp = c.lst = null
c.fg = ui.t.codeArg
}
var c = body.mcs.new(l.sx, l.sy - 1, l.sx + 8, l.sy - 1)
c.type = null
c.value = m
c.jmp = 2
c.lst = null
c.fg = ui.t.codeSelf
if(r){
var l = tdb.lineDict[r.i]
if(l && l.r){
var c = body.mcs.new(l.x, l.y - 1, l.x + 6, l.y - 1)
c.type = 'returns'
c.value = r.v
c.jmp = 1
c.lst = null
c.fg = ui.t.codeSelf
}
}
var maxlst = 100
var sites = {}
var fc = m.cs
while(fc){
if(fc.r){
var l = tdb.lineDict[fc.r.c]
if(l){
var id = fc.r.c
var c
if(sites[id]) c = sites[id]
else {
c = (sites[id] = body.mcs.new(l.x, l.y - 1, l.ex, l.ey - 1))
c.lst = []
c.args = []
c.jmp = fc
c.fg = ui.t.codeCall
}
if(bg.prev && bg.prev.msg == fc){
c.fg = ui.t.codeSelf
}
c.lst.unshift({
type:'returns',
value:fc.r?fc.r.v:null
})
var args = c.args
var fl = tdb.lineDict[fc.i]
if(l.a){
for(var i = 0;i<l.a.length;i++){
var a = l.a[i]
if(a){
var c = args[i]
if(!c){
c = (args[i] = body.mcs.new(a.x, a.y - 1, a.ex, a.ey - 1))
c.lst = []
}
c.fg = ui.t.codeArg
if(l.ce){
if(i == 0){
c.lst.push({type:"this", value:"?"})
} else{
if(l.ce == 1){
if(c.lst.length<maxlst) c.lst.unshift({
type:(fl.a[i - 1] ? fl.a[i - 1].n : '?') +' =',
value:fc.a?fc.a[i - 1]:null
})
} else {
if(c.lst.length<maxlst)
c.lst.push({
type:null,
value:fc,
})
}
}
} else {
if(c.lst.length<maxlst) c.lst.unshift({
type:(fl.a[i] ? fl.a[i].n : '?') +' =',
value:fc.a?fc.a[i]:null
})
}
}
}
}
}
}
fc = fc.nc
}
sites = {}
var rblock = {}
function addClosures(m){
var fc = m.us
while(fc){
if(rblock[fc.g]) return
rblock[fc.g] = 1
var l = tdb.lineDict[fc.i]
if(l){
var c
var id = fc.i
if(sites[id]) c = sites[id]
else {
c = (sites[id] = body.mcs.new(l.sx, l.sy - 1, l.sx + 8, l.sy - 1))
c.lst = []
c.jmp = fc
c.fg = ui.t.codeCall
}
if(c.lst.length<maxlst){
c.lst.unshift({
type:null,
value:fc
})
}
}
addClosures(fc)
fc = fc.nu
}
}
addClosures(m, 0)
}
body.o = function(){
var v = bg._p._p._p._p.hoverView
v.hide()
}
var lx, ly, lc
var oldr = body.r
body.r = function(){
oldr()
var l = lc
if(l && l.jmp){
if(l.jmp === 1){
if(!bg.next || bg.next.l === -1)return
var sv = bg._p._p._p._p.stackView
sv.ly = -1
sv.selectFirst(bg.stacky + bg.stackh)
} else if (l.jmp === 2){
var m = body.tdb.find(bg.msg.u)
if(m) bg._p._p._p._p.selectCall(m.y)
} else {
bg._p._p._p._p.selectCall(l.jmp.y)
}
}
}
function formatCall(m, v, tdb){
var up = tdb.msgIds[m.u]
v.addFormat((up?((m.t - up.t)+'ms '):'')+tdb.fmtCall(m), tdb.colors)
if(m.r && m.r.v) v.addFormat(' '+tdb.fmtCall(m.r), tdb.colors)
}
body.markerHover = function(m){
if(ui.mx == lx && ui.my == ly && m == lc)return
lx = ui.mx, ly = ui.my, lc = m
var tdb = body.tdb
var v = bg._p._p._p._p.hoverView
if(!m){
v.hide()
return
}
else {
v.clearText()
if(m.lst){
var l = m.lst.length
for(var i = 0;i<l;i++){
if(m.lst[i].type){
v.addFormat((l>1?i+': ':'')+m.lst[i].type+' '+tdb.fmt(m.lst[i].value, 255), tdb.colors)
} else {
formatCall(m.lst[i].value, v, tdb)
}
v.endLine()
}
} else {
if(m.type){
v.addFormat(m.type+' '+tdb.fmt(m.value, 255), tdb.colors)
} else {
formatCall(m.value, v, tdb)
}
v.endLine()
}
v.fit(ui.mx, ui.my)
}
ui.gl.cursor('pointer')
}
return bg
}
return codeBubble
})

define('/trace/trace_client',function(require){
var fn = require("../core/fn")
var ui = require("../core/ui")
if(!ui.gl) return
var ct = require("../core/controls")
ui.theme( require("../core/themes").dark )
var ioChannel = require("../core/io_channel")
var traceDb = require('./trace_db')
var codeDb = require('./code_db')
var listView = require('./list_view')
var codeView = require("./code_view")
var hoverText = require("./hover_text")
var codeBubble = require("./code_bubble")
var pass = fn.sha1hex("p4ssw0rd")
var sess = fn.rndhex(8)
var chan = ioChannel("/io_"+sess+"_"+pass)
var dt = fn.dt()
window.ui = ui
define.reload = function(t){
if(t.indexOf('themes.js') != -1){
require.reload('../core/themes', function(t){
ui.theme(t.dark)
ui.redraw()
})
return 1
}
}
ui.load(function(){
var tdb = traceDb()
var sdb = traceDb(tdb)
var cdb = codeDb()
chan.data = function(m){
if(!m.dict){
if(tdb.processTrace(m) && searchBox.t.length && !searcher && matchSearch(m)){
sdb.addTrace(m)
sdb.changed()
}
}
else {
cdb.parse(m.f, m.src)
return tdb.addDict(m)
}
}
var bubbles = fn.list('prev', 'next')
function clearTraces(){
tdb.clearText()
sdb.clearText()
tdb.msgIds = {}
tdb.firstMessage = null
stackView.clearText()
miniView.tvc = null
bigView.tvc = null
sminiView.tvc = null
sbigView.tvc = null
var b = bubbles.first()
while(b){
b.hide()
b = b.next
}
tdb.changed()
sdb.changed()
ui.redraw()
}
function selectBubble(b, scroll){
var n = bubbles.first()
while(n){
if(n != b) n.title.sel = 0
n = n.next
}
b.title.sel = 1
if(scroll){
var v = bubbleBg._v_
v.ds(b.y - v.mv)
ui.redraw(bubbleBg)
}
}
function selectCall(y){
miniView.selectFirst(y)
bigView.view(0, y, 0, 1, 1)
bubbleBg._v_.ds(-bubbleBg._v_.mv)
stackView.ly = -1
stackView.selectFirst(0)
}
sdb.selectTrace = function(m){
ui.dbg = m
selectCall(m.y)
}
tdb.selectTrace = function(m){
var y = 0
var stacky = 0
var spacing = 1
var rev = false
var b = {next:bubbles.first()}
var max = 64
stackView.clearText()
if(rev) while(m.p) m.p.c = m, m = m.p
while(m && max >0){
max--
var l = tdb.lineDict[m.i]
var f = tdb.fileDict[l && l.fid]
if(!f){m = m.c;continue;}
if(b) b = b.next
if(!b){
b = codeBubble({x:1, y:y, w:'p.w', h:300, _p:bubbleBg})
bubbles.add(b);
(function(prev){
b.title.p = function(n){
var b = n._p
b.resetLine()
stackView.selectFirst(stackView.ly = b.stacky)
selectBubble(b)
ui.redraw(bubbleBg)
prev()
}
})(b.title.p)
}
b.stacky = stacky
stackView.addFormat( tdb.fmtCall(m), tdb.colors ), stacky++
stackView.endLine(b)
if(m.r && m.r.v !== '_$_undefined' && m.r.v !== undefined){
stackView.addFormat( ' '+tdb.fmtCall(m.r), tdb.colors ), stacky++
stackView.endLine(b)
b.stackh = 2
} else b.stackh = 1
var headSize = b.setTitle(m, tdb)
b.x = 0
b.y = y
var file = cdb.files[f.longName]
var line = l.y
var height = (l.ey - l.y + 1) * b.body.vps.sy + headSize + 20
if(height > 6000) height = 6000
b.setBody( m, tdb, file, line, height)
y += height + spacing
if(b.l == -1) b.show()
if(rev){
var c = m.c
delete m.c
m = c
}
else m = m.p
}
bubbleBg.vSize = y
bubbleBg.v_()
stackView.selectFirst(0)
stackView.hy = 0
stackView.v_()
ui.redraw()
b = b.next
while(b){
if(b.l != -1) b.hide()
b = b.next
}
}
var mainGroup
var searchGroup
var miniView
var bigView
var sminiView
var sbigView
var hoverView
var sourceView
var bubbleBg
var searchBox
var searcher
var pattern = 0
var regexp = 0
function matchSearch(m){
var s = searchBox.t
if(s != pattern){
if(s.charAt(0) == '/'){
try{
regexp = new RegExp(s.slice(1),"ig")
} catch(e){
regexp = 0
}
} else regexp = 0
pattern = s
}
if(!regexp) return m.s.indexOf( pattern ) != -1
else return m.s.match( regexp ) != null
}
function doSearch(){
var s = searchBox.t
if(s.length){
mainGroup.hide()
searchGroup.show()
sdb.clearText()
if(searcher) clearInterval(searcher)
sminiView.tvc = null
sbigView.tvc = null
var n = tdb.text.first()
searcher = setInterval(function(){
var dt = fn.dt()
var ntraces = 1000
var nblocks = 500
while(n && nblocks>0 && ntraces>0){
for(var i = 0;i<n.ld.length;i++){
var m = n.ld[i]
if(matchSearch(m)){
ntraces--
sdb.addTrace(m)
}
}
nblocks--
n = n._d
}
sdb.changed()
if(!n) clearInterval(searcher), searcher = 0
}, 0)
} else {
mainGroup.show()
searchGroup.hide()
}
}
function settings(){
ct.window(function(n){
n.t = 'Code.GL Settings'
})
}
ui.group(function(n){
ui.rect(function(n){
n.f = 't.defbg'
n.h = 32
ct.button({
y:2,
x:2,
w:60,
t:'Settings',
c:function(){
}
})
ct.button({
y:2,
x:64,
w:60,
t:'Clear',
c:function(){
clearTraces()
}
})
ct.button({
y:2,
x:126,
w:60,
t:'Restart',
c:function(){
}
})
ct.button({
y:2,
w:60,
x:188,
t:'Pause',
c:function(n){
if(!n.paused){
n.paused = true
n.ohc = n.hc
n.hc = 'red'
} else {
n.paused = false
n.hc = n.ohc
}
}
})
ct.button({
y:2,
x:250,
w:20,
t:'x',
c:function(){
searchBox.t = ""
doSearch()
}
})
searchBox = ct.edit({
empty:'search filter',
y:2,
x:272,
w:'p.w - n.x',
c:function(n){
doSearch()
}
})
})
ct.vSplit(function(n){
n.y = 28
ui.group(function(n){
n.h = 200
ui.test = function(){
fn(n.eval('h'))
}
mainGroup = ct.hSplit(function(n){
miniView = listView({w:267, zm:0, db:tdb})
bigView = listView({db:tdb, cursor:miniView})
cdb.sh.text = miniView.sh.text
})
searchGroup = ct.hSplit(function(n){
sminiView = listView({w:267, zm:0, db:sdb})
sbigView = listView({db:sdb, cursor:sminiView})
sbigView.vps.gx = 7
})
searchGroup.hide()
})
ct.hSplit(function(n){
stackView = listView({w:267})
stackView.vps.gx = 5
stackView.vps.gy = 5
stackView.ly = -1
stackView.viewChange = function(x, y){
if(stackView.ly != y){
stackView.ly = y
var c = stackView.dcs.l.first() || stackView.vcs.l.first()
if(c && c.d) selectBubble(c.d, true)
}
}
bubbleBg = ui.rect(function(n){
n.f = 't.defbg'
n.l = 1
n._h_ = ct.hScrollHider()
n._v_ = ct.vScrollHider()
ct.hvScroll(n)
})
})
})
n.hoverView = hoverView = hoverText()
n.miniView = miniView
n.bigView = bigView
n.bubbleBg = bubbleBg
n.stackView = stackView
n.selectCall = selectCall
hoverView.show(false)
})
chan.send({t:'join'})
ui.drawer()
})
})

define.factory["/trace/trace_server"](define.mkreq("/trace/trace_server"))