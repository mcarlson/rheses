window.assert = {};
window.assert.testCaseLabel = '';

function proxyFunc(origFunc) {
  var pFunc = function() {
    if (origFunc.length == arguments.length) {
      var msg = arguments[arguments.length-1];
      arguments[arguments.length-1] = window.assert.testCaseLabel + ": " + msg;
    }
    origFunc.apply(this, arguments);
  }
  return pFunc;
}

for (var funcName in chai.assert) {
  window.assert[funcName] = proxyFunc(chai.assert[funcName]);
}
