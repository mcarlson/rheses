/*
 The MIT License (MIT)

 Copyright ( c ) 2014-2015 Teem2 LLC

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
'use strict';

/*
  TODO: Get the client to autoreload when the cache is cleared?
*/

var fs = require('fs');
var path = require('path');
var watch = require('watch');

var coffee = require('coffee-script');
var uglify = require("uglify-js");

var PROCESSORS_BY_EXTENSION = {
  coffee:["coffee"]
};

var DIST_PATH_FRAG = path.sep + 'core' + path.sep + 'dist' + path.sep;

var cache;
var clearCache = function() {
  //console.log('CLEAR CACHE');
  cache = {};
}

// Determines where the "action" writefile will write to. Set during startup.
var rootForWriting;

var readFile = function(filePath, callback, context) {
  var rootPaths = context.rootPaths,
    srcSubDir = context.srcSubDir,
    i = 0, len = rootPaths.length;
  var readRecursivelyOverRoots = function(err, data) {
    if (err) {
      if (len > i) {
        // SECURITY: Make sure we don't read outside a rootPath.
        var rootPath = rootPaths[i++],
          normalizedPath = path.normalize(rootPath + filePath);
        if (normalizedPath.indexOf(rootPath + srcSubDir) === 0) {
          fs.readFile(normalizedPath, {encoding: 'utf-8'}, readRecursivelyOverRoots);
        } else {
          callback(false, "Path resolved outside supported dir:" + normalizedPath);
        }
      } else {
        callback(false, "No file found for path:" + filePath);
      }
    } else {
      callback(true, data);
    }
  };
  readRecursivelyOverRoots(true);
};

var tokenize = function(text, tokens, context) {
  var c, token,
    i = 0, len = text.length,
    insideDecl = false,
    mightBeDeclEnd = false,
    wasTilde = false;
  for (; len > i; ++i) {
    c = text.charAt(i);
    switch (c) {
      case '~':
        if (insideDecl) {
          if (mightBeDeclEnd) {
            insideDecl = false;
            mightBeDeclEnd = false;
            token = null;
          } else {
            token.value.push(c);
          }
        } else {
          if (wasTilde) {
            if (!token) tokens.push(token = {type:'raw', value:[]});
            token.value.push(c);
            wasTilde = false;
          } else {
            wasTilde = true;
          }
        }
        break;
      
      case '[':
        if (!insideDecl && wasTilde) {
          insideDecl = true;
          tokens.push(token = {type:'decl', value:[]});
        }
        if (!token) tokens.push(token = {type:'raw', value:[]});
        token.value.push(c);
        wasTilde = false;
        break;
      
      case ']':
        if (wasTilde && !insideDecl) token.value.push('~');
        if (insideDecl) mightBeDeclEnd = true;
        if (!token) tokens.push(token = {type:'raw', value:[]});
        token.value.push(c);
        wasTilde = false;
        break;
      
      default:
        if (!token) tokens.push(token = {type:'raw', value:[]});
        if (wasTilde) token.value.push('~');
        token.value.push(c);
        wasTilde = false;
    }
  }
};

var processFile = function(filePath, tokenTreeNode, fileStack, context) {
  filePath = path.normalize(filePath);
  
  // Prevent cyclic includes
  var i = fileStack.length;
  while (i) {
    if (fileStack[--i] === filePath) {
      console.log('WARNING: Prevent cyclic include for: ' + filePath);
      return;
    }
  }
  fileStack.push(filePath);
  context.filesToProcessCount++;
  
  readFile(filePath, function(success, result) {
    try {
      if (success) {
        tokenize(result, tokenTreeNode.value, context);
        
        var tokens = tokenTreeNode.value,
          token, i = 0, len = tokens.length;
        
        // Assemble parse tree
        for (; len > i;) {
          token = tokens[i++];
          token.value = token.value.join('');
          if (token.type === 'decl') {
            try {
              token.value = JSON.parse(token.value);
              token.action = token.value.shift();
              token.file = filePath;
              
              // Process files recursively for includes
              if (token.action === 'include') {
                var relativePath = token.path = token.value.shift(),
                  idx = filePath.lastIndexOf(path.sep);
                processFile(
                  (idx > 0 ? filePath.substring(0, idx + 1) : filePath) + relativePath, // Combine current path with relative path.
                  token,
                  fileStack.concat(), // Make a copy since file processing happens in parallel at each include level.
                  context
                );
              }
            } catch (e) {
              token.type = 'error';
              token.value = 'Declaration parse exception: ' + e;
            }
          }
        }
        
        // Insert processor tokens by extension
        var extIdx = filePath.lastIndexOf('.');
        if (extIdx >= 0) {
          var processors = PROCESSORS_BY_EXTENSION[filePath.substring(extIdx + 1)];
          if (processors) {
            tokens.unshift({type:'decl', action:'startprocess', value:processors});
            tokens.push({type:'decl', action:'endprocess', value:processors});
          }
        }
      } else {
        console.log('ERROR:', result);
      }
    } catch (e) {
      console.log('UNEXPECTED ERROR:', e);
    } finally {
      // We're done if there are no more files to process.
      if (--context.filesToProcessCount === 0) context.doneFunc();
    }
  }, context);
};

var processTokenTree = function(tokens, context) {
  var conditionalState = [{conditionIsTrue:true}], token;
  for (var i = 0, len = tokens.length; len > i; i++) {
    token = tokens[i];
    if (token.type === 'raw') {
      if (conditionalState[0].conditionIsTrue) context.outStack[0].push(token.value);
    } else if (token.type === 'decl') {
      switch (token.action) {
        case 'include':
          if (conditionalState[0].conditionIsTrue) processTokenTree(token.value, context);
          break;
        
        case 'if':
          if ((conditionalState.length <= 2) || conditionalState[1].conditionIsTrue) {
            conditionalState.unshift({});
            conditionalState[0].everTrue = conditionalState[0].conditionIsTrue = evaluateConditional(token.value, context);
          }
          break;
        case 'elseif':
          if ((conditionalState.length <= 2) || conditionalState[1].conditionIsTrue) {
            if (conditionalState[0].everTrue) {
              conditionalState[0].conditionIsTrue = false;
            } else {
              conditionalState[0].everTrue = conditionalState[0].conditionIsTrue = evaluateConditional(token.value, context);
            }
          }
          break;
        case 'else':
          if ((conditionalState.length <= 2) || conditionalState[1].conditionIsTrue) {
            conditionalState[0].conditionIsTrue = !conditionalState[0].everTrue;
          }
          break;
        case 'endif':
          conditionalState.shift();
          break;
        
        case 'startprocess':
          context.outStack.unshift([]);
          break;
        case 'endprocess':
          var processBody = context.outStack.shift().join(''),
            processors = token.value, j = 0, jLen = processors.length;
          for (; jLen > j;) processBody = doProcessDeclaration(processBody, processors[j++], context);
          context.outStack[0].push(processBody)
          break;
        
        case 'action':
          if (conditionalState[0].conditionIsTrue) doActionDeclaration(token.value.shift(), token, context);
          break;
        
        default:
          console.log('Unknown Declaration: ', token.action, token.value);
      }
    } else if (token.type === 'error') {
      console.log(token.value);
    }
  }
};

var doActionDeclaration = function(actionName, token, context) {
  var params = token.value;
  
  switch (actionName) {
    case 'writefile':
      var data = context.outStack[0].join(''),
        filePath = token.file,
        idx = filePath.lastIndexOf(path.sep),
        filePath = path.normalize(rootForWriting + (idx > 0 ? filePath.substring(0, idx + 1) : filePath) + params[0]);
      
      idx = filePath.lastIndexOf(path.sep);
      var dirPath = filePath.substring(0, idx);
      
      // SECURITY: Make sure we don't write outside a rootPath.
      if (filePath.indexOf(rootForWriting + context.srcSubDir) !== 0) {
        console.log("Can't write file to disk. Unsafe path: " + filePath);
        break;
      }
      
      var writeFileFunc = function() {
          fs.writeFile(filePath, data, function(err) {
            if (err) {
              console.log('Error writing file to disk:', filePath, err);
            } else {
              console.log('Wrote to disk: ' + data.length + ' characters into file ', filePath);
            }
          });
      };
      
      fs.exists(dirPath, function (exists) {
        if (exists) {
          writeFileFunc();
        } else {
          fs.mkdir(dirPath, function(err) {
            if (err) {
              console.log('Error writing file to disk. Could not mkdir:', dirPath, err);
            } else {
              writeFileFunc();
            }
          });
        }
      });
      
      break;
    default:
      console.log('Unknown Action: ', actionName);
  }
};

var doProcessDeclaration = function(processBody, processName, context) {
  try {
    switch (processName) {
      case 'coffee':
        processBody = coffee.compile(processBody);
        break;
      case 'minify':
        processBody = uglify.minify(processBody, {fromString:true}).code;
        break;
      default:
        console.log('Unknown processor encountered: ' + processName);
    }
  } catch (e) {
    processBody = 'Process Error: ' + processName + " : " + e;
  }
  return processBody;
};

var evaluateConditional = function(value, context) {
  switch (value[0]) {
    case 'runtime':
      return context.req.query && context.req.query.runtime === value[1];
    case 'debug':
      return context.req.query && context.req.query.debug === value[1];
    default:
      return false;
  }
};

module.exports = function (projectsRoot, dreemRoot, srcSubDir) {
  var rootPaths = [];
  if (projectsRoot) rootPaths.push(projectsRoot); // Allow project to override dreem so push it on first.
  if (dreemRoot) rootPaths.push(dreemRoot);
  
  // Setup file watching. Will also call clearCache for us at least 
  // once per root path.
  for (var i = 0, len = rootPaths.length; len > i; i++) {
    (function(rootPath) {
      var filePath = rootPath + srcSubDir;
      fs.exists(filePath, function (exists) {
        if (exists) {
          console.log('The assembler started watching: ' + filePath + ' for changes.');
          rootForWriting = rootPath;
          watch.watchTree(filePath, function(f, curr, prev) {
            // Ignore changes to the dist dir since that happens when files
            // are written to disk.
            if (typeof f === 'string' && f.indexOf(DIST_PATH_FRAG) !== -1) return;
            
            clearCache();
          });
        } else {
          console.log('Tried to watch file: ' + filePath + ' for changes but could not find it.');
        }
      });
    })(rootPaths[i]);
  }
  
  return function(req, res, next) {
    // Clear cache if so indicated
    var query = query = req.query;
    if (query.cache === 'clear') clearCache();
    
    var filePath = req.path,
      cacheKey = req.originalUrl,
      cachedResponse = cache[cacheKey],
      context,
      tokenTree = {type:'root', value:[]},
      doneFunc = function() {
        processTokenTree(tokenTree.value, context);
        
        res.writeHead(200, {'Content-Type':'application/json'});
        if (cachedResponse) {
          //console.log('FROM CACHE');
          res.end(cachedResponse);
        } else {
          //console.log('BUILDING');
          res.end(cache[cacheKey] = context.outStack[0].join(''));
        }
      };
    
    if (cachedResponse) {
      doneFunc();
    } else {
      context = {
        rootPaths:rootPaths,
        srcSubDir:srcSubDir,
        req:req,
        outStack:[[]],
        filesToProcessCount:0,
        doneFunc: doneFunc
      };
      processFile(filePath, tokenTree, [], context);
    }
  }
}
