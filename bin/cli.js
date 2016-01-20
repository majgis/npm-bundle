#!/usr/bin/env node

var npmBundle = require('../index.js')
var args = process.argv.slice(2)
var options = {
  verbose: process.argv.indexOf('--verbose') > -1
}

npmBundle(args, options, function onNpmBundle (error, output) {
  if (error) {
    throw error
  }
  if (output) {
    process.stdout.write(output.file)
  }
})
