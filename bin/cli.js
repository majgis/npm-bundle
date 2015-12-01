#!/usr/bin/env node

var verbose = process.argv.indexOf('--verbose') > -1;
var output = require ('../index.js')(process.argv.slice(2), verbose);
console.log(output.contents.join('\n'));
console.log(Array(output.file.length).join('='));
process.stdout.write(output.file);
