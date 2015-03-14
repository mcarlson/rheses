/*
The MIT License (MIT)

Copyright ( c ) 2015 Teem2 LLC

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
(function(global) {
  // Utility Functions
  var loadScript = function(src) {
      // Use document.write rather than dom insertion since we actually do 
      // want to prevent the body from rendering until all scripts are 
      // loaded since dreem rewrites the dom so things will look ugly in
      // the page until dreem executes.
      document.write('<script src="' + src + '"></'+'script>');
    },
    writeCSS = function(rules) {
      var s = document.createElement('style');
      s.type = 'text/css';
      
      var i = rules.length, rule;
      while (i) {
        rule = rules[--i];
        if (rule.length > 1) {
          rule[i] = rule.shift() + '{' + rule.join(';') + '}';
        } else {
          rule[i] = '';
        }
      }
      
      s.innerHTML = rules.join('');
      document.getElementsByTagName('head')[0].appendChild(s);
    },
    extend = function(targetObj, sourceObj) {
      var iterable = targetObj, 
        result = iterable,
        args = arguments, argsLength = args.length, argsIndex = 0,
        key, ownIndex, ownKeys, length;
      if (iterable) {
        while (++argsIndex < argsLength) {
          iterable = args[argsIndex];
          if (iterable) {
            ownIndex = -1;
            ownKeys = Object.keys(iterable);
            length = ownKeys ? ownKeys.length : 0;
            while (++ownIndex < length) {
              key = ownKeys[ownIndex];
              result[key] = iterable[key];
            }
          }
        }
      }
      return result
    };
  
  // Defaults
  var opts = {
    baseUrl:'../',
    type:'example'
  };
  extend(opts, global.BOILERPLATE_OPTS || {});
  var isSmoke = opts.type === 'smoke';
  
  // Config
  var scriptsToLoad = [
      'lib/jquery-1.9.1.js',
      'lib/acorn.js',
      'lib/coffee-script.js',
      'core/layout.js',
      isSmoke ? '/lib/chai.js' : '',
      isSmoke ? '/lib/smoke_helper.js' : '',
    ],
    cssRules = [
      ['html,body',
        'height:100%',
        'margin:0px',
        'padding:0px',
        'border:0px none'
      ],
      ['body',
        'font-family:Arial, Helvetica, sans-serif',
        'font-size:14px'
      ]
    ];
  
  // Execution
  writeCSS(cssRules);
  var i = 0, len = scriptsToLoad.length, scriptUrl;
  for (; len > i;) {
    scriptUrl = scriptsToLoad[i++];
    if (scriptUrl) loadScript(opts.baseUrl + scriptUrl);
  }
})(this);