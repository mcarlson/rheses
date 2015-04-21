var fs = require('fs');
var projectsPath = '/projects/';
var classesPath = '/classes/';
var docsPath = '/docs/api/#!/api/dr.';

module.exports = function (projectsRoot, dreemRoot, absPath) {
    return function(req, res) {
        var path = req.path;
        var isXHR = req.xhr;

        if (!isXHR && path.indexOf(classesPath) === 0) {
            return res.redirect(docsPath + path.substring(classesPath.length, path.length - '.dre'.length));
        } else if (absPath) {
          path = absPath;
        } else if (path.indexOf(projectsPath) === 0) {
            path = projectsRoot + path.substring(projectsPath.length);
        } else {
            path = dreemRoot + path;
        }

        while (path.match(/(\.\.|\/\/)/)) {
            path = path.replace(/\/\//g, '/').replace(/\.\./g, '');
        }

        fs.exists(path, function (exists) {
            if (exists) {
                res.writeHead(200, { 'Content-Type': 'text/html' });

                fs.readFile(path, 'utf8', function(readerr, filedata) {
                    if (readerr) { return console.log(readerr); }

                    if (isXHR) {
                        res.end(filedata);
                    } else {
                        //fs.readFile('wrapper.html', 'utf8', function (wrapreaderr, template) {
                        //    if (wrapreaderr) { return console.log(wrapreaderr); }
                        //    res.end(template.replace('~[CONTENT]~', filedata));
                        //});

                        template = '<html> <head><title>DREEM</title> <script type="text/javascript" src="/boilerplate.js"></script> <style type="text/css"> @charset "UTF-8"; @font-face { font-family: "mission-gothic"; src: url("/fonts/mission_gothic_thin.eot"); src: url("/fonts/mission_gothic_thin.eot?#iefix") format("embedded-opentype"), url("/fonts/mission_gothic_thin.woff2") format("woff2"), url("/fonts/mission_gothic_thin.woff") format("woff"), url("/fonts/mission_gothic_thin.ttf") format("truetype"), url("/fonts/mission_gothic_thin.svg#mission_gothicthin") format("svg"); font-weight: 200; font-style: normal; } @font-face { font-family: "mission-gothic"; src: url("/fonts/mission_gothic_regular.eot"); src: url("/fonts/mission_gothic_regular.eot?#iefix") format("embedded-opentype"), url("/fonts/mission_gothic_regular.woff2") format("woff2"), url("/fonts/mission_gothic_regular.woff") format("woff"), url("/fonts/mission_gothic_regular.ttf") format("truetype"), url("/fonts/mission_gothic_regular.svg#mission_gothicregular") format("svg"); font-weight: 400; font-style: normal; } @font-face { font-family: "mission-gothic"; src: url("/fonts/mission_gothic_regular_italic.eot"); src: url("/fonts/mission_gothic_regular_italic.eot?#iefix") format("embedded-opentype"), url("/fonts/mission_gothic_regular_italic.woff2") format("woff2"), url("/fonts/mission_gothic_regular_italic.woff") format("woff"), url("/fonts/mission_gothic_regular_italic.ttf") format("truetype"), url("/fonts/mission_gothic_regular_italic.svg#mission_gothicregular_italic") format("svg"); font-weight: 400; font-style: italic; } @font-face { font-family: "mission-gothic"; src: url("/fonts/mission_gothic_thin_italic.eot"); src: url("/fonts/mission_gothic_thin_italic.eot?#iefix") format("embedded-opentype"), url("/fonts/mission_gothic_thin_italic.woff2") format("woff2"), url("/fonts/mission_gothic_thin_italic.woff") format("woff"), url("/fonts/mission_gothic_thin_italic.ttf") format("truetype"), url("/fonts/mission_gothic_thin_italic.svg#mission_gothicthin_italic") format("svg"); font-weight: 200; font-style: italic; } @font-face { font-family: "mission-gothic"; src: url("/fonts/mission_gothic_light_italic.eot"); src: url("/fonts/mission_gothic_light_italic.eot?#iefix") format("embedded-opentype"), url("/fonts/mission_gothic_light_italic.woff2") format("woff2"), url("/fonts/mission_gothic_light_italic.woff") format("woff"), url("/fonts/mission_gothic_light_italic.ttf") format("truetype"), url("/fonts/mission_gothic_light_italic.svg#mission_gothiclight_italic") format("svg"); font-weight: 300; font-style: italic; } @font-face { font-family: "mission-gothic"; src: url("/fonts/mission_gothic_light.eot"); src: url("/fonts/mission_gothic_light.eot?#iefix") format("embedded-opentype"), url("/fonts/mission_gothic_light.woff2") format("woff2"), url("/fonts/mission_gothic_light.woff") format("woff"), url("/fonts/mission_gothic_light.ttf") format("truetype"), url("/fonts/mission_gothic_light.svg#mission_gothiclight") format("svg"); font-weight: 300; font-style: normal; } @font-face { font-family: "mission-gothic"; src: url("/fonts/mission_gothic_bold_italic.eot"); src: url("/fonts/mission_gothic_bold_italic.eot?#iefix") format("embedded-opentype"), url("/fonts/mission_gothic_bold_italic.woff2") format("woff2"), url("/fonts/mission_gothic_bold_italic.woff") format("woff"), url("/fonts/mission_gothic_bold_italic.ttf") format("truetype"), url("/fonts/mission_gothic_bold_italic.svg#mission_gothicbold_italic") format("svg"); font-weight: 700; font-style: italic; } @font-face { font-family: "mission-gothic"; src: url("/fonts/mission_gothic_bold.eot"); src: url("/fonts/mission_gothic_bold.eot?#iefix") format("embedded-opentype"), url("/fonts/mission_gothic_bold.woff2") format("woff2"), url("/fonts/mission_gothic_bold.woff") format("woff"), url("/fonts/mission_gothic_bold.ttf") format("truetype"), url("/fonts/mission_gothic_bold.svg#mission_gothicbold") format("svg"); font-weight: 700; font-style: normal; } @font-face { font-family: "mission-gothic"; src: url("/fonts/mission_gothic_black_italic.eot"); src: url("/fonts/mission_gothic_black_italic.eot?#iefix") format("embedded-opentype"), url("/fonts/mission_gothic_black_italic.woff2") format("woff2"), url("/fonts/mission_gothic_black_italic.woff") format("woff"), url("/fonts/mission_gothic_black_italic.ttf") format("truetype"), url("/fonts/mission_gothic_black_italic.svg#mission_gothicblack_italic") format("svg"); font-weight: 800; font-style: italic; } @font-face { font-family: "mission-gothic"; src: url("/fonts/mission_gothic_black.eot"); src: url("/fonts/mission_gothic_black.eot?#iefix") format("embedded-opentype"), url("/fonts/mission_gothic_black.woff2") format("woff2"), url("/fonts/mission_gothic_black.woff") format("woff"), url("/fonts/mission_gothic_black.ttf") format("truetype"), url("/fonts/mission_gothic_black.svg#mission_gothicblack") format("svg"); font-weight: 800; font-style: normal; } </style> </head> <body> <view id="dreemain" width="100%" height="100%" scrollable="true"> ~[CONTENT]~ </view> </body> </html>';
                        res.end(template.replace('~[CONTENT]~', filedata));
                    }
                });
            } else {
                res.writeHead(404, { 'Content-Type': 'text/plain' });
                res.end("'" + req.path + "' not found");
            }
        });

    }
};
