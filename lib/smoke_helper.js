window.assert = {};
window.assert.testCaseLabel = '';

window.DREEM_TESTS = {};
window.DREEM_TESTS.test_timeout = 100; //millis
window.DREEM_TESTS.test_results_buffer = [];
window.DREEM_TESTS.success_count = 0;
window.DREEM_TESTS.resultsTimeoutID = null;

window.DREEM_TESTS.start_time = new Date();

window.addEventListener('dreeminit', function() {

  var timeToInit = new Date();
  window.DREEM_TESTS.init_time = (timeToInit - window.DREEM_TESTS.start_time)/1000;
  
  startTestTimer();
});

function reportFailure(e, name, msg) {
  if (!name) name = window.location.href;
  console.warn('failed spec:', name, (msg ? (':' + msg) : ''), e.message);

  var duration = (new Date() - window.DREEM_TESTS.start_time)/1000;

  window.DREEM_TESTS.test_results_buffer.push(
    {
      "name": name + (msg ? (':' + msg) : ''),
      "result": false,
      "message": e.message,
      "duration": duration
    }
  );
}

function startTestTimer() {
  if (window.DREEM_TESTS.resultsTimeoutID) return;
  
  var timeout = window.DREEM_TESTS.test_timeout;
  if ($('testingtimer').length) {
    timeout = $('testingtimer').contents()[0].nodeValue;
  }

  window.DREEM_TESTS.resultsTimeoutID = window.setTimeout(reportResults, timeout);
}

function reportResults() {
  var tests;
  if (window.DREEM_TESTS.test_results_buffer.length) {
    tests = window.DREEM_TESTS.test_results_buffer;
  } else {
    tests = [
      {
        "name": window.location.href,
        "result": true,
        "message": 'all passed!',
        "duration": 0
      }
    ];
  }

  var duration = (new Date() - window.DREEM_TESTS.start_time)/1000;
  
  window.global_test_results = {
    "passed": window.DREEM_TESTS.success_count,
    "failed": window.DREEM_TESTS.test_results_buffer.length,
    "total": window.DREEM_TESTS.success_count + window.DREEM_TESTS.test_results_buffer.length,
    "duration": duration,
    "tests": tests
  }
}

function proxyFunc(origFunc) {
  var pFunc = function() {
    
    if (origFunc.length == arguments.length) {
      var msg = arguments[arguments.length-1];
      arguments[arguments.length-1] = window.assert.testCaseLabel + ": " + msg;
    }
    try {
      origFunc.apply(this, arguments);
      window.DREEM_TESTS.success_count++;
    } catch(e) {
      reportFailure(e, window.assert.testCaseLabel, msg)
      //throw e
    }
  }
  return pFunc;
}

for (var funcName in chai.assert) {
  window.assert[funcName] = proxyFunc(chai.assert[funcName]);
}
