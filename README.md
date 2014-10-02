dreem
======

getting started with dreem
--------------------------
It is quick and easy to get started writing your dreem application. After cloning the project, you will need to serve the dreem files through a web server to satisfy the browser's same-origin policy. SimpleHTTPServer is a quick and easy option to get started. From within the dreem root directory just run:

    python -m SimpleHTTPServer
    
This will turn that directory into a webserver and allow you to run any of the example files on localhost, such as [http://localhost:8000/data.html]()

That's all you need to do to get set up to build a dreem application. There are many sample files in the root directory that you can reference to get familiar with the language. You will also want to build the API documentation to run on your machine as it is currently not hosted anywhere on the web. This is a simple process, and instructions are included below.

You can put your dreem files right in the root dreem directory or a subdirectory to get started. However, if you want to keep your files in source control its helpful to keep them separate from the dreem git repo. You can easily do so by creating a softlink in the dreem directory that points to a separate directory located elsewhere in your machine. For example, if your dreem installation is located at ~/dev/dreem, and you want to keep your dreem application in ~/dev/mydreemapp, then within ~/dev/dreem run:

    ln -s ~/dev/mydreemapp ./mydreemapp
    
Now you can access your files at http://localhost:8000/mydreemapp/

installing the sublime plugin
-----------------------------

For Sublime Text, use the preferences -> browse packages menu, back out a folder and browse to 'Installed Packages', then copy /tools/Dreem.sublime-package there.

building
--------
This is only required when editing the coffeescript core.
Make sure coffescript is installed

    npm install -g coffee-script
 
And run

    coffee -mo ./ -cw *.coffee
    
building the documentation
--------------------------

The API docs are built with [https://github.com/senchalabs/jsduck](). Install jsduck as a ruby gem using bundler by running

    gem install bundler
    bundle install
    
If you are using rvm or similar your gems will be installed in a gemset called 'dreem'.

With jsduck installed run:

	./bin/builddocs

running smoke tests
--------------------------

The smoke tests docs are run with [http://phantomjs.org/](), so you'll need to install it. Next, run:

	phantomjs ./bin/phantomrunner.js
		
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
