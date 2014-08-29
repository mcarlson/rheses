var fs = require('fs');

var basepath = "./classes/"

var regex = /\/\*\*([\S\s]*?)\*\//mg

fs.readdir(basepath,function(err,files){
  if(err) throw err;
  files.forEach(function(file){
    if (file.indexOf('.lzx') == -1) return
    // console.log(basepath + file)
    var data = fs.readFileSync(basepath + file, {encoding: 'utf-8'});
    var matches = data.toString().match(regex);

    if (matches) {
      matches.forEach(function(match){
      	match =  match.replace('<!--', '');
      	match = match.replace('-->', '');
      	console.log(match)
      });
    }
  });
});