## Teem Server

### Prerequisites

Install [Node.js v0.10.x](http://nodejs.org/download/)

Next, be sure to run this inside the server directory:

    npm install

If your machine doesn't have 'xmllint' available on the command-line, you'll need to install it. On Windows, a version of xmllint_windows is checked in (a small .NET application). This is based upon [xmllint for windows](https://code.google.com/p/xmllint/).

For best results, create a projects directory in the same location as your server and dreem directories. The projects directory is intended to give you a place to work that is independent of dreem.

### Starting the server

DREEM_ROOT specifies the root to your local [Dreem](https://github.com/teem2/dreem) installation:

    DREEM_ROOT=../dreem/ node server.js

The optional DEBUG flag shows event bus information in the shell:

    DEBUG=true DREEM_ROOT=../dreem/ node server.js

The optional DREEM_PROJECTS_ROOT flag will mount a projects directory at the root, e.g. [http://localhost:8080/projects/]()':

    DREEM_PROJECTS_ROOT=../projects/ DREEM_ROOT=../dreem/ node server.js

Optional API keys that enable access to [Rovi APIs](http://prod-doc.rovicorp.com/mashery/index.php/Main_Page) 

    ROVI_SEARCH_SECRET=XXX ROVI_SEARCH_KEY=XXX DREEM_ROOT=../dreem/ node server.js

To use Rovi APIs, prepend /api/ to the URL, e.g. 

[Top movies](http://localhost:8080/api/search/v2.1/amgvideo/filterbrowse?entitytype=movie&filter=editorialrating>8&filter=releaseyear>1500&&include=cast,images&size=1000)
[Top movie](http://localhost:8080/api/search/v2.1/amgvideo/filterbrowse?entitytype=movie&filter=editorialrating>8&filter=releaseyear>1500&&include=cast,images&size=1)
[Pivot to actor](http://localhost:8080/api/search/v2.1/amgvideo/search?entitytype=credit&include=filmography&query=Yoko+Maki)
[Pivot to other film](http://localhost:8080/api/search/v2.1/amgvideo/search?entitytype=video&include=cast&query=Hard+Romanticker)

See the [Rovi docs](http://prod-doc.rovicorp.com/mashery/index.php/Rovi-Data) for more info.

### Windows users
Install Node.js and run the application Node.js -> Node.js command prompt

Set the environment variables before running the server.

    set DEBUG=true
    set DREEM_ROOT=../dreem/
    node server.js


### Running demos
Once your server is running, the directory specified by DREEM_ROOT is served from the root URL, e.g. [http://localhost:8080/examples/timeline.html](). If you specified a project root, you should be able to run your examples from [http://localhost:8080/projects/](). Note that the server will not list the contents of directories, so you'll need to point to a specific html file, e.g. http://localhost:8080/examples/timeline.html

### Running all smoke tests from one URL
You can run [http://localhost:8080/smokerun]() to in a browser to run all smoketests one after the other without manual intervention, all errors are reported on the server commandline and not just the browser console.

### Troubleshooting
On OSX, if you see issues running 'npm install' that say something like 'Failed at the pty.js@0.2.3 install script' try running this on the command line:

    xcode-select --install
