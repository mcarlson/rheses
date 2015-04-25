dreem
======

getting started with dreem
--------------------------

It is quick and easy to get started writing your dreem application, first install [Node.js v0.10.x](http://nodejs.org/download/) and clone the repo:

    git clone https://github.com/teem2/dreem.git

After cloning the project, install the required node modules:

    npm install

You will need to serve the dreem files through a web server to satisfy the browser's same-origin policy.  From within the dreem root directory just run:

    ./bin/teemserver
    
This will turn that directory into a webserver and allow you to run any of the example files on localhost, such as [http://localhost:8080/examples/spirallayout.html](http://localhost:8080/examples/spirallayout.html)

That's all you need to do to get set up to build a dreem application. There are many sample files in the root directory that you can reference to get familiar with the language. You will also want to build the API documentation to run on your machine as it is currently not hosted anywhere on the web. This is a simple process, and instructions are included below.

adding your own dreem code
--------------------------

You can put your dreem files right in the root dreem directory or a subdirectory to get started, or use a symlink to another directory, for example this:

    ln -s ~/dev/mydreemapp ./mydreemapp

Allow you to access your files from `/mydreemapp/` here: [http://localhost:8080/mydreemapp/](http://localhost:8080/mydreemapp/)

If you would like a pace from which to serve Dreem projects without placing them in the root, you can use `/projects` by specifing the `DREEM_PROJECTS_ROOT` environment variable on the command line.  For example:

    DREEM_PROJECTS_ROOT="../apps/demos/" ./bin/teemserver
    
Will mount the `../apps/demos/` directory under the `/projects` url [http://localhost:8080/projects/](http://localhost:8080/projects/).  Note: `/projects` is a special URL, this is not a general purpose route mapping.

loading external components
---------------------------

If you have additional external components to load, place them all in a top-level directory and use the `DREEM_COMPONENTS_ROOT` variable to indicate where to find them:

    DREEM_COMPONENTS_ROOT="../workspace/components/" ./bin/teemserver
    
Additional server settings can be found on the [teemserver README](https://github.com/teem2/server).

installing the sublime plugin
-----------------------------

For Sublime Text, use the preferences -> browse packages menu, back out a folder and browse to 'Installed Packages', then copy /tools/Dreem.sublime-package there.

building the documentation
--------------------------

The API docs are built with [https://github.com/senchalabs/jsduck](https://github.com/senchalabs/jsduck). Install jsduck as a ruby gem using bundler by running

    gem install bundler
    bundle install

If you are on mac 10.9.x and you get an error concerning nokogiri, try this
    sudo gem install nokogiri -- --with-iconv-dir=/usr/lib

If you are using rvm or similar your gems will be installed in a gemset called 'dreem'.

With jsduck installed run:

	./bin/builddocs

building Snap.svg
-----------------

The art component uses a customized version of Snap.svg to display svg files. The changes allow any frame between two paths to be displayed. See [https://github.com/teem2/Snap.svg](https://github.com/teem2/Snap.svg) for build instructions. Once built, a copy of [https://github.com/teem2/Snap.svg/blob/master/dist/snap.svg-min.js](https://github.com/teem2/Snap.svg/blob/master/dist/snap.svg-min.js) should be copied into this repository at [https://github.com/teem2/dreem/tree/master/lib](https://github.com/teem2/dreem/tree/master/lib).

running smoke tests
--------------------------

The smoke tests docs are run with [http://phantomjs.org/ 1.9.8](http://phantomjs.org/), so you'll need to install it (note: phantomjs2.0 currently cannot run all the tests successfully, use no later than 1.9.8). After you've installed it, run:

    phantomjs ./bin/phantomrunner.js

If you get RESOURCE ERROR messages, try specifying a different timeout argument. The smaller the number, the faster the tests will run:
    
    phantomjs ./bin/phantomrunner.js 100

Finally, you may get better performance if you utilize phantom's disk cache:

    phantomjs ./bin/phantomrunner.js 100 --disk-cache

You can also target a specific smoke test by naming it on the commandline

    phantomjs ./bin/phantomrunner.js art.html

    
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

Per [http://stackoverflow.com/questions/11354656/error-error-error-installing-capybara-webkit](http://stackoverflow.com/questions/11354656/error-error-error-installing-capybara-webkit) if you are in Ubuntu:

    sudo apt-get install qt4-dev-tools libqt4-dev libqt4-core libqt4-gui

If you are on Mac

    brew install qt

Then run this again:

    bundle install    

Windows users: capybara-webkit can only install on a 32-bit version of Windows. See [https://github.com/thoughtbot/capybara-webkit#windows-support](https://github.com/thoughtbot/capybara-webkit#windows-support)
		
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
