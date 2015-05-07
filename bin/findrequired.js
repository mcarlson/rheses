/*
The MIT License (MIT)

Copyright ( c ) 2014 Teem2 LLC

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

var fs = require('fs');
var jpath = require('json-path');

var basepath = "./docs/api/"

var regex = /{(.*)}/g

fs.readdir(basepath, function(err, files) {
    if (err) throw err;
    files.forEach(function(file) {
        if (file.indexOf('data-') !== 0) return;
        // console.log(basepath + file)
        var filecontents = fs.readFileSync(basepath + file, {
            encoding: 'utf-8'
        });
        var matches = filecontents.toString().match(regex);
        var data = JSON.parse(matches[0]);

        var res = jpath.executeSelectors(data, jpath.parseSelector("/data/search[*]"));
        var out = {}
        res.forEach(function(d, i) {
            if (!d.meta.required)
                return;
            classAndName = d.fullName.substring(3).split('.')
            if (! out[classAndName[0]]) 
              out[classAndName[0]] = {};
            out[classAndName[0]][classAndName[1]] = 1;
        })
        console.log(JSON.stringify(out));
    });
});