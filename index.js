var path = require('path')
var exec = require('child_process').exec
var fs = require('fs')
var TEMP_DIR = '.npmbundle' + path.sep
var rimraf = require('rimraf')
var ncp = require('ncp')
var glob = require('glob')
var async = require('insync')
var mkdirp = require('mkdirp')
var NPM_VERSION_ERROR = 'Error:  Unable to install deduped dependencies.\n' +
  'If you are using npm v3, make sure it is v3.5 or later.'

function bundleDependencies (pkg, next) {
  if (pkg.dependencies) {
    pkg.bundledDependencies = Object.keys(pkg.dependencies)
  }
  var output = JSON.stringify(pkg, null, 2)
  fs.writeFile('package.json', output, function onBundleDependencies (error) {
    next(error)
  })
}

function cd (dir, next) {
  var error
  try {
    process.chdir(dir)
  } catch (e) {
    error = e
  }
  next(error)
}

function resolvePath (value, next) {
  fs.exists(value, function onResolvePath (exists) {
    if (exists) {
      next(null, path.resolve(value))
    } else {
      next(null, value)
    }
  })
}

function outputData (data) {
  console.log(data)
}

function npmInstall (verbose, installable, next) {
  var command = 'npm i ' + installable + ' --production --legacy-bundling'
  var process = exec(command, function onNpmInstall (error, stdout) {
    next(error, stdout)
  })
  if (verbose) {
    process.stdout.on('data', outputData)
  }
}

function npmPack (verbose, packable, next) {
  var command = 'npm pack ' + packable
  var process = exec(command, function onNpmPack (error, stdout) {
    next(error, stdout)
  })
  if (verbose) {
    process.stdout.on('data', outputData)
  }
}

function loadPackage (next) {
  fs.readFile('package.json', 'utf8', function onGetPackageDetails (error, data) {
    data = JSON.parse(data)
    next(error, data)
  })
}

function flatten (value, next) {
  next(null, value[0])
}

function ignoreValue (value, next) {
  next(null)
}

function pwd (next) {
  next(null, process.cwd())
}

function storeValue (context, key, value, next) {
  context[key] = value
  next(null)
}

function checkLength (packages, next) {
  if (packages.length > 1) {
    throw new Error(NPM_VERSION_ERROR)
  }
  next(null, packages)
}

function getValue (context, key, next) {
  next(null, context[key])
}

function npmBundle (args, options, cb) {
  var argIndex = 0
  var firstArg = args[argIndex]
  while (firstArg && firstArg.indexOf('--') === 0) {
    argIndex += 1
    firstArg = args[argIndex]
  }
  var verbose = options.verbose || false
  var startDir = process.cwd() + path.sep
  var tempDir = startDir + TEMP_DIR
  var installable = firstArg || process.cwd()
  var templateDir = __dirname + path.sep + 'templates'
  var context = {
    installable: null,
    output: {
      contents: null,
      file: null
    }
  }

  async.waterfall([
    rimraf.bind(null, tempDir),
    mkdirp.bind(null, tempDir),
    ignoreValue,
    resolvePath.bind(null, installable),
    storeValue.bind(null, context, 'installable'),
    ncp.bind(null, templateDir, tempDir),
    cd.bind(null, tempDir),
    getValue.bind(null, context, 'installable'),
    npmInstall.bind(null, verbose),
    ignoreValue,
    cd.bind(null, 'node_modules'),
    glob.bind(null, '*'),
    checkLength,
    flatten,
    cd,
    loadPackage,
    bundleDependencies,
    glob.bind(null, '**' + path.sep + '*'),
    storeValue.bind(null, context.output, 'contents'),
    pwd,
    storeValue.bind(null, context, 'packable'),
    cd.bind(null, startDir),
    getValue.bind(null, context, 'packable'),
    npmPack.bind(null, verbose),
    storeValue.bind(null, context.output, 'file'),
    rimraf.bind(null, tempDir),
    getValue.bind(null, context, 'output')
  ], cb)
}

module.exports = npmBundle
