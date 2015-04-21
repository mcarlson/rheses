/*
 The MIT License (MIT)

 Copyright ( c ) 2014 - 2015 Teem2 LLC

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
var http = require('http');
var path = require('path');
http.globalAgent.maxSockets = 25;
var express = require('express');
var app = express();
var fs = require('fs');

var compress = require('compression');
app.use(compress());

var components = {};
var privateComponents = {};

var serverDir = path.dirname(fs.realpathSync(__filename));

var rootdir = (process.env.DREEM_ROOT || (serverDir + '/../dreem')) + '/';
var projdir = (process.env.DREEM_PROJECTS_ROOT || (serverDir + '/../projects')) + '/';
var compdir =  (process.env.DREEM_COMPONENTS_ROOT || (serverDir + '/../components')) + '/';

if (serverDir.match(/node_modules/)) {
  console.log("Server is running as an npm node_module.");

  rootdir = (process.env.DREEM_ROOT || (serverDir + '/../..')) + '/';
  projdir = (process.env.DREEM_PROJECTS_ROOT || (serverDir + '/../../../projects')) + '/';
  compdir =  (process.env.DREEM_COMPONENTS_ROOT || (serverDir + '/../../../components')) + '/';

}

var componentsFiles = fs.readdirSync(serverDir + "/components");
for (var i = 0, len = componentsFiles.length; i < len; i++) {
  var fileName = componentsFiles[i];
  var component = require(serverDir + "/components/" + fileName);
  components[fileName.replace('.js', '')] = component;
  console.log('Loading Component: ', fileName.replace('.js', ''));
}

var server,
  dreemroot = path.normalize(rootdir),
  projectsroot,
  assembler = components['assembler'],
//  apiProxy = components['apiproxy'],
  validator = components['validator'],
  watchfile = components['watchfile'],
  smokerun = components['smokerun'],
  saucerun = components['saucerun'],
  streem = components['streem'],
  info = components['info'],
  wrapper = components['wrapper'];

console.log('Serving Dreem from', dreemroot);
if (projdir && fs.existsSync(projdir)) {
  projectsroot = path.normalize(projdir);
  console.log('serving project root from', projectsroot);
}

//find private components at the configured componentsroot and make sure they have the correct structure
if (compdir && fs.existsSync(compdir)) {
  componentsroot = path.normalize(compdir);

  if (!fs.existsSync(componentsroot)) {
    console.warn('DREEM_COMPONENTS_ROOT dir not found, no components loaded.');
    return;
  }
  console.log('Loading private components from', componentsroot);
  
  var componentDirs = fs.readdirSync(componentsroot)
  for (var i = 0, len = componentDirs.length; i < len; i++) {
    var dirName = componentDirs[i];
    
    var componentDir = componentsroot + '/' + dirName;
    var componentDescriptorPath = componentDir + '/package.json'
    var componentMainPath = componentDir + '/index.js'
    
    if (!fs.existsSync(componentDescriptorPath)) {
      console.warn('Could not load component from directory', dirName, 'because no package.json found.');
      continue;
    }
    
    if (!fs.existsSync(componentMainPath)) {
      console.warn('Could not load component from directory', dirName, 'because no index.js found.');
      continue;
    }

    var pjson = require(componentDescriptorPath);
    console.log('Loading component', pjson.name);
    
    var component = require(componentMainPath);
    if (!component.initialize) {
      console.warn('Could not load component from directory', dirName, 'because no initialize method found.');
      continue;
    }
    privateComponents[pjson.name] = {"component":component, "component_dir":componentDir};
  }
}

// Start:Routing
app.use(function(req, res, next) {
  if (req.url.match(/^\/(css|js|img|font|api)\/.+/)) {
    res.setHeader('Cache-Control', 'public, max-age=3600');
  }
  next();
});

// Find all of the dres, libs, and examples in the private components and serve them up
//  Now find all of the .dre files and serve them under the /classes/ path
for (var compName in privateComponents) {
  var comp = privateComponents[compName];
  
  var glob = require("glob");
  var dres = glob.sync(comp['component_dir'] + '/dre/' + "**/*.dre");
  var examples = glob.sync(comp['component_dir'] + '/examples/' + "**/*.*");
  var drelibs = glob.sync(comp['component_dir'] + '/dre/lib' + "**/*.js");

  var nameParts = compName.split('-');
  var simpleName = nameParts.pop();
  var namePath = nameParts.join('/');

  function servePrivateComponentResources(paths, registerPath) {
    for (var i=0; i<paths.length; i++) {
      var dreemFilePath = paths[i];
      var dreemFileName = dreemFilePath.substring(dreemFilePath.lastIndexOf('/')+1, dreemFilePath.length);

      var myNamePath = '' + namePath;
      if (simpleName != dreemFileName.substring(0, dreemFileName.lastIndexOf('.'))) {
        myNamePath += '/' + simpleName;
      }

      registerPath(myNamePath + '/' + dreemFileName, dreemFilePath);
    }
  };

  servePrivateComponentResources(drelibs, function(namePath, dreemFilePath) {
    console.log('serving lib', '/lib/' + namePath);
    app.use('/lib/' + namePath, express.static(dreemFilePath));
  });

  servePrivateComponentResources(examples, function(namePath, dreemFilePath) {
    var ext = '.dre';
    if (dreemFilePath.indexOf(ext, dreemFilePath.length - ext.length) == -1) {
      app.use('/examples/' + namePath, express.static(dreemFilePath))
    } else {
//      use the wrapper to server .dre examples
      if (wrapper) app.get('/examples/' + namePath, wrapper(projectsroot, dreemroot, dreemFilePath));
    }
  });

  servePrivateComponentResources(dres, function(namePath, dreemFilePath) {
    app.use('/classes/' + namePath, express.static(dreemFilePath))
  });
}

if (wrapper) app.get(/\.dre$/, wrapper(projectsroot, dreemroot));
if (assembler) app.all('/core/*', assembler(projectsroot, dreemroot, 'core' + path.sep));
app.use(express.static(dreemroot));

if (projectsroot) app.use('/projects', express.static(projectsroot));
if (validator) app.get(/^\/(validate).+/, validator(projectsroot, dreemroot));
if (watchfile) app.get(/^\/(watchfile).+/, watchfile(projectsroot, dreemroot));
if (smokerun) {
  app.get(/^\/smokerun.*/, smokerun.get(projectsroot, dreemroot));
  app.post(/^\/smokerun.*/, smokerun.post(projectsroot, dreemroot));
}
if (saucerun) app.get(/^\/saucerun.*/, saucerun.get(projectsroot, dreemroot));
if (info) app.get(/^\/(version|info)/, info());

//initialize private components
for (var compName in privateComponents) {
  var comp = privateComponents[compName];
  var expressComp = comp['component'];

//  init the server component
  expressComp.initialize(app);
}
// End:Routing

server = http.createServer(app);
if (streem) streem.startServer(server);

//var vfs = require('vfs-local')({
//   root: dreemroot,
//   httpRoot: root,
//});
//app.use(require('vfs-http-adapter')("/fs/", vfs));

server.listen(process.env.PORT || 8080, process.env.IP || "0.0.0.0", function() {
  var addr = server.address();
  console.log("server listening at", addr.address + ":" + addr.port);
});
