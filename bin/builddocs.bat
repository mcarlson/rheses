@echo off
echo Git reset?
git reset ./docs/api/

echo removing old data..
rm -rf docs/api/
echo running config.rb
docs\lib\config.rb

echo Compiling layout.coffee
rem coffee -c layout.coffee


echo Running finddoccomments
node ./bin/finddoccomments.js > ./classdocs.js

echo Compiling documentation
jsduck ./core/layout.js classdocs.js --tags ./docs/lib/custom_tags.rb --guides=./docs/guides.json --categories=./docs/categories.json --output=./docs/api/ --eg-iframe=jsduck_iframe.html --title="Dreem API documentation" --footer="Copyright (c) 2014 Teem2 LLC"

cp ./docs/gitattributes-tmpl ./docs/api/.gitattributes

