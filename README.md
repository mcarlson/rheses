rheses
======

running
--------
A web server is currently required to serve LZX autoincludes, as it satisfies the same-origin policy. Any simple web server will do, here's a one liner that works in most cases:

    python -m SimpleHTTPServer

building
--------
You shouldn't have to do this unless you touch the core coffeescript files.

    coffee -j layout.js -mo ./ -cw *.coffee

    
and visit [http://localhost:8000/data.html]()
