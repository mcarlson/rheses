var html =
'<html>\n\
<head>\n\
  <title>Auto tester</title>\n\
  <script type="text/javascript" src="/lib/jquery-1.9.1.js"></script>\n\
  <script type="text/javascript" src="/lib/acorn.js"></script>\n\
  <script type="text/javascript" src="/lib/coffee-script.js"></script>\n\
  <script type="text/javascript" src="/lib/chai.js"></script>\n\
  <script>\n\
    var assert = chai.assert\n\
  </script>\n\
  <script type="text/javascript" src="/core/layout.js"></script>\n\
</head>\n\
<body>\n\
<view id="all" width="100%" height="100%" clip="true">\n\
  <handler event="oninit">\n\
  var src = [\n\
  	$ALLFILES$\n\
  ]\n\
\n\
  function logmsg(msg){\n\
    console.log(msg)\n\
    // lets post it to the server for viewing\n\
    var req = new XMLHttpRequest()\n\
    req.open("POST", "/smokerun", true)\n\
    req.send(msg)\n\
  }\n\
\n\
  // lets run all src for 2 seconds each\n\
  window.iframe_obj = document.createElement("iframe")\n\
  window.iframe_obj.style.width = "100%"\n\
  window.iframe_obj.style.height = "100%"\n\
  document.body.appendChild(iframe_obj)\n\
  var ct = 0\n\
  function next(){\n\
  	if(ct >= src.length) return logmsg("COMPLETED")\n\
    var file = src[ct]\n\
    logmsg("TESTING "+file+"("+ct+"/"+src.length+")")\n\
    console.log(iframe_obj)\n\
    iframe_obj.src = "/"+file\n\
    iframe_obj.onload = function(){\n\
      iframe_obj.contentWindow.error = \n\
      iframe_obj.contentWindow.redirectLog = function(data){\n\
       logmsg("ERROR "+file+" - "+data)\n\
      }\n\
      iframe_obj.contentWindow.eval("console.error = redirectLog")\n\
      setTimeout(next, 3000)\n\
    }\n\
    ct++\n\
  }\n\
  next()\n\
  </handler>\n\
</view>\n\
</body>\n\
</html>\n'
var fs = require('fs')
module.exports = {
	get:function (projectsroot, dreemroot) {
		return function(req, res, next) {
			var files = fs.readdirSync( dreemroot+'/smoke')
			var str = ''
			for (var i=0, l=files.length; i<l; i++) {
			  var fileName = files[i];
			  if(fileName.match(/\.html$/i)){
			  	if(str) str += ","
			  	str += '"smoke/'+fileName+'"' 
			  }
			}
			var out = html.replace(/\$ALLFILES\$/,str)
			res.writeHead(200)
			res.end(out)
			//next()
		}
	},
	post:function (projectsroot, dreemroot) {
		return function(req, res, next){
			var blk = ''
			req.on('data', function(data){
				blk += data.toString()
			})
			req.on('end', function(){
				console.log(blk)
				res.writeHead(200)
				res.end()
			})
			//next()
		}
	}
}