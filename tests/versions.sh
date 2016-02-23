#!/usr/bin/env bash

npm uninstall -g npm-bundle
npm link

source ~/.profile_nvm
cd `dirname $0`

nvm install 0.10
echo
node ../bin/cli.js ../
echo

nvm install 0.12
echo
node ../bin/cli.js ../
echo

nvm install 4
echo
node ../bin/cli.js ../
echo

nvm install 5
npm i -g npm
echo
node ../bin/cli.js ../
echo

npm uninstall -g npm-bundle
echo

rm -rf *.tgz