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
var scriptNames = [
  'publish',
  'prepublish',
  'postpublish'
]

function bundleDependencies (pkg, next) {
  if (pkg.dependencies) {
    pkg.bundledDependencies = Object.keys(pkg.dependencies)
  }
  next(null, pkg)
}

function disableScripts (pkg, next) {
  var scripts = pkg.scripts
  if (scripts) {
    for (var i = 0; i < scriptNames.length; i++) {
      var scriptName = scriptNames[i]
      if (scripts[scriptName]) {
        scripts['_' + scriptName] = scripts[scriptName]
        delete scripts[scriptName]
      }
    }
  }
  next(null, pkg)
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

function npmInstall (verbose, options, installable, next) {
  options = options.length ? ' ' + options.join(' ') : ''
  var command = 'npm i ' + installable + options + ' --legacy-bundling'
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

function splitArgAndOptions (argAndOptions) {
  argAndOptions = argAndOptions.slice()
  var argIndex = 0
  var firstArg = argAndOptions[argIndex]
  while (firstArg && firstArg.indexOf('-') === 0) {
    argIndex += 1
    firstArg = argAndOptions[argIndex]
  }

  if (firstArg) {
    argAndOptions.splice(argIndex, argIndex + 1)
  } else {
    firstArg = process.cwd()
  }

  var result = {
    arg: firstArg,
    options: argAndOptions
  }

  return result
}

function jsonParse (data, next) {
  next(null, JSON.parse(data))
}

function jsonStringify (obj, next) {
  next(null, JSON.stringify(obj, null, 2))
}

//Copy .npmrc only if installable is directory with .npmrc
function copyNpmrc (tempDir, installable, next) {
  var npmrcPath = installable + '/.npmrc'
  fs.exists(npmrcPath, function onNpmrcExists (exists) {
    if (exists) {
      ncp(npmrcPath, tempDir + '/.npmrc', function onCopyNpmrc (err) {
        next(err)
      })
    } else {
      next()
    }
  })
}

function npmBundle (args, options, cb) {
  var argAndOptions = splitArgAndOptions(args)
  var verbose = options.verbose || false
  var startDir = process.cwd() + path.sep
  var tempDir = startDir + TEMP_DIR
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
    resolvePath.bind(null, argAndOptions.arg),
    storeValue.bind(null, context, 'installable'),
    ncp.bind(null, templateDir, tempDir),
    getValue.bind(null, context, 'installable'),
    copyNpmrc.bind(null, tempDir),
    cd.bind(null, tempDir),
    getValue.bind(null, context, 'installable'),
    npmInstall.bind(null, verbose, argAndOptions.options),
    ignoreValue,
    cd.bind(null, 'node_modules'),
    glob.bind(null, '*'),
    checkLength,
    flatten,
    cd,
    rimraf.bind(null, '.npmbundle'),
    fs.readFile.bind(null, 'package.json', 'utf8'),
    jsonParse,
    bundleDependencies,
    disableScripts,
    jsonStringify,
    fs.writeFile.bind(null, 'package.json'),
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
