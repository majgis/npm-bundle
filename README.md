# npm-bundle

Similar to `npm pack` but include dependencies.

If you wish to include dependencies and use `npm-pack` you must do the 
following:

1. create bundledDependencies section in package.json
2. remember to update bundledDependencies before executing `npm-pack`
3. remember to execute `npm install` before executing `npm-pack`
4. remember to execute `npm install --legacy-bundling` because deduped 
dependencies will not be included

There must be a better way


## Install

    npm install -g npm-bundle

## Use
You can use the same inputs as [`npm install`][1]


    # The current directory containing a package.json
    npm-bundle

    # A tarball in the current directory
    npm-bundle npm-bundle-1.0.0.tgz
    
    # A package from the registry
    npm-bundle request

    # A tarball url
    npm-bundle https://github.com/indexzero/node-portfinder/archive/v0.4.0.tar.gz    
    
    

