[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
# npm-bundle

Similar to `npm pack` but includes all dependencies. 

If you wish to include dependencies and use `npm-pack` you must do the 
following:


1. create bundledDependencies section in package.json
2. remember to update bundledDependencies before executing `npm-pack`
3. remember to execute `npm install` before executing `npm-pack`
4. remember to execute `npm install --legacy-bundling` when using npm v3.x 
because deduped dependencies will not be included.  

There must be a better way...

## Prerequisites

* node v0.12 or later  
* npm v2.x or npm > v3.5 (npm v3 less than 3.5 does not support disabling 
dedup)

## Install

    npm install -g npm-bundle


## CLI Usage
You can use the same arguments and options as [`npm install`][1].  The install
is happening in the `.npmbundle` temporary directory, so only use npm install
options relevant for that directory.


    # The current directory containing a package.json
    npm-bundle

    # Verbose, useful for debugging errors
    npm-bundle --verbose

    # A tarball in the current directory
    npm-bundle npm-bundle-1.0.0.tgz
    
    # A package from the registry
    npm-bundle request

    # A tarball url
    npm-bundle https://github.com/indexzero/node-portfinder/archive/v0.4.0.tar.gz    
    
    # Specify a private registry
    npm-bundle --registry=http://private.something.com/npm supersecret

## Programmatic Usage

    var npmBundle = require('npm-bundle')
    var args = []
    var options = {
      verbose: true
    }
    
    npmBundle(args, options, function onNpmBundle (error, output) {
      if (error) {
        throw error
      }
    })

## Differences from `npm pack`

1. The entire dependency tree is included in the output tarball
2. The additional arguments of `npm install`, ie. tarball url
3. The additional options of `npm install`, ie. --registry=http://something
4. The package.json in the output tarball has npm install metadata
5. --verbose option for help with debugging

## Changelog

* v2.0.0
    * Everything is now executed asynchronously


* v1.1.1
    * Show list of included files and folders


[1]:https://docs.npmjs.com/cli/install
