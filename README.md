[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)
# npm-bundle

Similar to `npm pack` but includes packages in the dependencies section of 
the package.json. 

If you wish to include dependencies and use `npm-pack` you must do the 
following:


1. create bundledDependencies section in package.json
2. remember to update bundledDependencies before executing `npm pack`
3. remember to execute `npm install` before executing `npm pack`
4. remember to execute `npm install --legacy-bundling` when using npm v3.x 
because deduped dependencies will not be included.  
5. remember that `npm install --legacy-bundling` is not available in npm  v3
.x < v3.5

There must be a better way...

## Prerequisites

* node v0.10 or later  
* npm v1.x, v2.x or npm > v3.5 (npm v3 less than 3.5 does not support disabling 
dedup)

## Install

    npm install -g npm-bundle


## CLI Usage
You can use the same arguments and options as [`npm install`][1].  There is an
additional --verbose option to help with debugging issues.

    # The current directory containing a package.json
    npm-bundle

    # Verbose, useful for debugging errors
    npm-bundle --verbose

    # A tarball in the current directory
    npm-bundle something-1.0.0.tgz
    
    # A package from the registry
    npm-bundle request

    # A tarball url
    npm-bundle https://github.com/indexzero/node-portfinder/archive/v0.4.0.tar.gz    
    
    # Specify a private registry
    npm-bundle secretPackage --registry=http://private.something.com/npm

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
      process.stdout.write(output.file)
    })

The given callback receives an error parameter and an output object parameter.

The output object will have the following properties:

* **file** - output from npm pack executed on temporary install directory


## Behind the Scenes

The install is happening in the `.npmbundle` temporary directory, so only use
 npm install options relevant for that directory.

The npm executable (required to be on your path) does the heavy lifting to 
ensure behavior is consistent with what you expect from npm.

Here is a simplified view of the workflow:

* `cd .npmbundle`
* `npm install  <package_name> --production --legacy-bundling`
* set `bundledDependencies` in `
.npmbundle/node_modules/<package_name>/package.json`
* `cd startDir`
* `npm pack .npmbundle/node_modules/<package_name>`


## Differences from `npm pack`

1. The entire dependency tree (legacy, not deduped) is included in the output 
tarball
2. The additional arguments of `npm install`, ie. a tarball url
3. The additional options of `npm install`, ie. --registry=http://something
4. The package.json in the output tarball has npm install metadata
5. --verbose option for help with debugging
6. All three publish scripts are prefixed with an underscore in the package
.json in the output tarball (a workaround to ensure they are only run once)


## Changelog

* v3.0.3
    * Fixed [#10](https://github.com/majgis/npm-bundle/issues/10): The .npmrc
    is ignored when bundling directories

* v3.0.1
    * run-scripts issue fixed by disabling publish scripts prior to `npm pack`
    * engine corrected to be Node.js v0.10

* v3.0.0
    * The contents is no longer output, use `tar -tvf something.tgz` instead

* v2.0.4
    * .npmbundle folder is no longer included in the output file
    
* v2.0.3
    * The issue with options not being passed was fixed.

* v2.0.0
    * Everything is now executed asynchronously
    * Support for node v0.10

* v1.1.1
    * Show list of included files and folders


[1]:https://docs.npmjs.com/cli/install
