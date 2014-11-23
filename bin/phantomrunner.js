var fs = require('fs');

var timeout = 60;
var path = "/smoke/";

var system = require('system');
var args = system.args;
if (args[1]) {
  timeout = parseInt(args[1]);
}

var list = fs.list("." + path);
var files = [];
for(var i = 0; i < list.length; i++){
  var file = list[i]
  if (file.indexOf('.html') > 0) {
    files.unshift(file);
  }       
}

var runTest = function (file, callback) {
  var out = []
  var tId;
  var updateTimer = function(ms) {
    ms = ms || timeout
    if (tId) clearTimeout(tId) 
    tId = setTimeout(callback, ms);
  }
  var page = require('webpage').create();
  page.onError = function(msg, trace) {
    var msgStack = ['ERROR: ' + msg];
    if (trace && trace.length) {
      msgStack.push('TRACE:');
      trace.forEach(function(t) {
        msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function +')' : ''));
      });
    }
    console.error(msgStack.join('\n'));
    updateTimer();
  };
  page.onInitialized = function () {
    // this is executed 'after the web page is created but before a URL is loaded.
    // The callback may be used to change global objects.' ... according to the docs
    page.evaluate(function () {
      window.addEventListener('dreeminit', function (e) { console.log('~~DONE~~') }, false);
    });
    // add missing methods to phantom, specifically Function.bind(). See https://github.com/ariya/phantomjs/issues/10522
    page.injectJs('./lib/es5-shim.min.js');
  };
  page.onResourceError = function(resourceError) {
    console.log('RESOURCE ERROR: ' + resourceError.errorString + ', URL: ' + resourceError.url + ', File: ' + file);
    updateTimer();
  };
  page.onConsoleMessage = function(msg, lineNum, sourceId) {
    if (msg === '~~DONE~~') {
      updateTimer(timeout);
      var expectedarry = page.evaluateJavaScript(function () {
        var retarry = [];
        $('expectedoutput').contents().filter(function(){
          return this.nodeType == 8;
        }).each(function(i, e){
            retarry.push($.trim(e.nodeValue))
        });
        
        return retarry;
      });
      
      gotoutput = out.join("\n")
      expectedoutput = expectedarry.join("\n")
      if (gotoutput !== expectedoutput) {
        console.log('ERROR: unexpected output expected::::');
        console.log(expectedoutput)
        console.log('but got::::::::::::::::::::::::::::::');
        console.log(gotoutput)
        console.log("\n")
      }
      return;
    }
    out.push(msg)
//    console.log(msg)
  };
  page.open('http://127.0.0.1:8080' + path + file + '?test');
}

var loadNext = function() {
  var file = files.pop();
  if (file) {
    console.log("RUNNING TEST: ", file)
    runTest(file, loadNext);
  } else {
    phantom.exit();
  }
}

loadNext();
