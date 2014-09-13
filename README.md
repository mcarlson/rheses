dreem
======

running
--------
A web server is currently required to serve LZX autoincludes, as it satisfies the same-origin policy. Any simple web server will do, here's a one liner that works in most cases:

    python -m SimpleHTTPServer

Once the server is running, visit [http://localhost:8000/data.html]()

installing the sublime plugin
-----------------------------

For Sublime Text, use the preferences -> browse packages menu, back out a folder and browse to 'Installed Packages', then copy /tools/Dreem.sublime-package there.

building
--------
This is only required when editing the coffeescript core.

    coffee -mo ./ -cw *.coffee

To build the api documentation, install [https://github.com/senchalabs/jsduck]() and run:
	./bin/builddocs
		
<!-- The MIT License (MIT)

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
SOFTWARE. -->
