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

If you get RESOURCE ERROR messages, try specifying a different timeout argument. The smaller the number, the faster the tests will run:
    
    phantomjs ./bin/phantomrunner.js 100

Finally, you may get better performance if you utilize phantom's disk cache:

    phantomjs ./bin/phantomrunner.js 100 --disk-cache
    
running the component tests
--------------------------

The components are tested with rspec and capybara. You will need to install the required gems to run them. If you haven't already:

    gem install bundler
    bundle install
    
Now to run the specs run

    rspec
    
If you see an error like:

    Gem::Ext::BuildError: ERROR: Failed to build gem native extension.

        ruby extconf.rb
    Command 'qmake -spec macx-g++ ' not available

    Makefile not found

    Gem files will remain installed in /Users/maxcarlson/.rvm/gems/ruby-2.0.0-p481@dreem/gems/capybara-webkit-1.3.0 for inspection.
    Results logged to /Users/maxcarlson/.rvm/gems/ruby-2.0.0-p481@dreem/extensions/x86_64-darwin-13/2.0.0-static/capybara-webkit-1.3.0/gem_make.out

    An error occurred while installing capybara-webkit (1.3.0), and Bundler cannot continue.
    Make sure that `gem install capybara-webkit -v '1.3.0'` succeeds before bundling.

Per [http://stackoverflow.com/questions/11354656/error-error-error-installing-capybara-webkit]() if you are in Ubuntu:

    sudo apt-get install qt4-dev-tools libqt4-dev libqt4-core libqt4-gui

If you are on Mac

    brew install qt

Then run this again:

    bundle install    

Windows users: capybara-webkit can only install on a 32-bit version of Windows. See [https://github.com/thoughtbot/capybara-webkit#windows-support]()
		
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
