#!/usr/bin/env bash

npm uninstall -g npm-bundle

source ~/.profile_nvm
cd `dirname $0`

nvm install 0.10
npm install -g ../
echo
npm-bundle ../
echo
npm uninstall -g npm-bundle
echo

nvm install 0.12
npm install -g ../
echo
npm-bundle ../
echo
npm uninstall -g npm-bundle
echo

nvm install 4
npm install -g ../
echo
npm-bundle ../
echo
npm uninstall -g npm-bundle
echo

nvm install 5
npm install -g ../
echo
npm-bundle ../
echo
npm uninstall -g npm-bundle
echo

