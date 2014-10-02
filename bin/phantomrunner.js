phantom.onError = function(msg, trace) {
  var msgStack = ['PHANTOM ERROR: ' + msg];
  if (trace && trace.length) {
    msgStack.push('TRACE:');
    trace.forEach(function(t) {
      msgStack.push(' -> ' + (t.file || t.sourceURL) + ': ' + t.line + (t.function ? ' (in function ' + t.function +')' : ''));
    });
  }
  console.error(msgStack.join('\n'));
  phantom.exit(1);
};

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


var page = require('webpage').create();
var runTest = function (file, callback) {
	page.onResourceError = function(resourceError) {
	  console.log('RESOURCE ERROR: ' + resourceError.errorString + ', URL: ' + resourceError.url + ', File: ' + file);
	};
	page.onConsoleMessage = function(msg, lineNum, sourceId) {
	  console.log('CONSOLE: ' + msg);
	};
	page.open('http://127.0.0.1:8080/bugs/' + file + '?nocache&debug', function(status) {
	  // patch missing es5 method, in particular function.bind, see https://github.com/ariya/phantomjs/issues/10522
	  page.injectJs('./lib/es5-shim.min.js');
	  // TODO: listen for callback for when dreem is ready
	  setTimeout(callback, 0);
	});
}

var loadNext = function() {
	var file = files.pop();
	if (file) {
		// console.log('')
		// console.log('loading file: ' + file)
		runTest(file, loadNext);
	} else {
		phantom.exit();
	}
}

loadNext();
