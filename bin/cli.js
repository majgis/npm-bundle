#!/usr/bin/env node

var verbose = process.argv.indexOf('--verbose') > -1;
var outputFileName = require ('../index.js')(process.argv.slice(2), verbose);
process.stdout.write(outputFileName);
