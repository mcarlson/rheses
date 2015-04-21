var fs = require('fs')
module.exports = {
  get:function (projectsroot, dreemroot) {
    return function(req, res, next) {

      var filename = dreemroot + '/saucerunner.html';
      var html = fs.readFileSync(filename, "utf8");
      
      var files = fs.readdirSync(dreemroot+'/smoke')
      var str = ''
      for (var i=0, l=files.length; i<l; i++) {
        var fileName = files[i];
        if(fileName.match(/\.html$/i)){
          if(str) str += ","
          str += '"http://localhost:8080/smoke/'+fileName+'?test"'
        }
      }
      var out = html.replace(/DYNAMIC_FILES = null/,'DYNAMIC_FILES = [' + str + ']')
      res.writeHead(200)
      res.end(out)
      //next()
    }
  }
}
