var fs = require('fs');

var path = "./bugs/";
var list = fs.list(path);
var files = [];
for(var i = 0; i < list.length; i++){
  var file = list[i]
  if (file.indexOf('.html') > 0) {
    files.push(file);
  }       
}

var expected = fs.read('./bin/expected.txt')
console.log(expected)
out = []

var page = require('webpage').create();

var runTest = function (file, callback) {
  var tId;
  var updateTimer = function(ms) {
    if (tId) clearTimeout(tId) 
    tId = setTimeout(callback, ms);
  }
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
    page.injectJs('./lib/es5-shim.min.js');
  };
  page.onResourceError = function(resourceError) {
    console.log('RESOURCE ERROR: ' + resourceError.errorString + ', URL: ' + resourceError.url + ', File: ' + file);
    updateTimer();
  };
  page.onConsoleMessage = function(msg, lineNum, sourceId) {
    if (msg === '~~DONE~~') {
      updateTimer(40);
      return;
    }
    out.push(msg)
  };
  page.open('http://127.0.0.1:8080/bugs/' + file);
}

var loadNext = function() {
  var file = files.pop();
  if (file) {
    // console.log('')
    // console.log('loading file: ' + file)
    runTest(file, loadNext);
  } else {
    var output = out.join('\n')
    if (expected !== output) {
      console.log('ERROR: unexpected output', expected, output);
      phantom.exit(1);
    } else {
      phantom.exit();
    }
  }
}

loadNext();
