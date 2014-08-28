rheses
======

running
--------
A web server is currently required to serve LZX autoincludes, as it satisfies the same-origin policy. Any simple web server will do, here's a one liner that works in most cases:

    python -m SimpleHTTPServer

Once the server is running, visit [http://localhost:8000/data.html]()

building
--------
This is only required when editing the coffeescript core.

    coffee -j layout.js -mo ./ -cw *.coffee

To build the api documentation, install [https://github.com/senchalabs/jsduck]() and run:

    node ./bin/finddoccomments.js > classdocs.js
    jsduck layout.js classdocs.js --output apidocs

