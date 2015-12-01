#!/usr/bin/env bash

source ~/.profile_nvm
cd `dirname $0`

# node v0.10 is not supported

nvm install 0.12
npm link
echo
npm-bundle ../
echo

nvm install 4
npm link
echo
npm-bundle ../
echo

nvm install 5
npm install -g npm@3.5
npm-bundle ../
echo

