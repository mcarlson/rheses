var fs = require('fs');

var basepath = "./classes/"

var regex = /(\<\!\-\-\/\*\*)([^]*)(\*\/\-\-\>)/gm

fs.readdir(basepath,function(err,files){
  if(err) throw err;
  files.forEach(function(file){
    if (file.indexOf('.lzx') == -1) return
    // console.log(basepath + file)
    var data = fs.readFileSync(basepath + file, {encoding: 'utf-8'});
    var matches = data.toString().match(regex);

    if (matches) {
    	var match = matches[0];
    	match =  match.replace('<!--', '');
    	match = match.replace('-->', '');
    	console.log(match)
    }
  });
});