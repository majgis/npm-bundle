var path = require('path')
var child_process = require('child_process')
var fs = require('fs')
var TEMP_DIR = '.npmbundle' + path.sep
var rimraf = require('rimraf')
var STDIO_SILENT = {stdio: ['ignore', 'ignore', 'ignore']}
var ncp = require('ncp')
var glob = require('glob')
var async = require('async')
var mkdirp = require('mkdirp')

function bundleDependencies (pkg, next) {
  if (pkg.dependencies) {
    pkg.bundledDependencies = Object.keys(pkg.dependencies)
  }
  var output = JSON.stringify(pkg, null, 2)
  fs.writeFile('package.json', output, function onBundleDependencies (error) {
    next(error)
  })
}

function npmBundle (args, verbose) {
  var stdio = verbose ? undefined : STDIO_SILENT
  var startDir = process.cwd()

  // If not an absolute path, add relative to temp dir
  var relativeDir = '..' + path.sep
  var commands
  if (args && args.length) {
    if (args.constructor !== Array) {
      args = [args]
    }

    for (var i = 0; i < args.length; i++) {
      var arg = args[i]
      if (arg.indexOf('-') === 0 || arg.indexOf(path.sep) === 0 || arg.indexOf('http') === 0) {
        continue
      } else if (arg.indexOf('.') === 0 || fs.existsSync(arg)) {
        args[i] = relativeDir + arg
      }
    }
    commands = args.join(' ')
  } else {
    commands = relativeDir
  }

  // Create and cd into temp directory (existing removed first)
  rimraf.sync(TEMP_DIR)
  fs.mkdirSync(TEMP_DIR)
  process.chdir(TEMP_DIR)

  // npm install tarball with production dependencies
  child_process.execSync('npm init -f', stdio)
  child_process.execSync('npm install ' + commands +
    ' --production --legacy-bundling ', stdio)

  var packages = fs.readdirSync('node_modules')
  if (packages.length > 2) {
    throw('Error:  Unable to install deduped dependencies.\n' +
    'If you are using npm v3, make sure it is v3.5 or later.')
  }
  var packageName = fs.readdirSync('node_modules').pop()

  // Add bundledDependencies section to package.json
  var cwd = process.cwd() + path.sep
  var packageDir = cwd + 'node_modules' + path.sep + packageName + path.sep
  var packageJsonPath = packageDir + 'package.json'
  var pkg = bundleDependenciesSync(packageJsonPath)

  // remove nested temp directory
  rimraf.sync(packageDir + TEMP_DIR)

  var contents = glob.sync('**' + path.sep + '*', {cwd: packageDir})

  // npm pack with bundled dependencies
  process.chdir(startDir)
  var buffer = child_process.execSync('npm pack ' + packageDir)

  // remove temp directory
  rimraf.sync(TEMP_DIR)

  return {
    file: buffer.toString('utf8'),
    contents: contents
  }
}

function cd (dir, next) {
  var error;
  try {
    process.chdir(dir);
  } catch (e) {
    error = e
  }
  next(error);
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

function npmInstall (options, installable, next) {
  var command = 'npm i ' + installable + ' --production --legacy-bundling'
  child_process.exec(command, options, function onNpmInstall (error) {
    next(error)
  })
}

function npmPack (options, packable, next) {
  var command = 'npm pack ' + packable
  child_process.exec(command, options, function onNpmPack(error, stdout){
    next(error, stdout)
  })
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

function pwd (next){
  next(null, process.cwd());
}

function storeValue (context, key, value, next) {
  context[key] = value
  next(null)
}

function checkLength (packages, next) {
  if (packages.length > 1) {
    throw('Error:  Unable to install deduped dependencies.\n' +
    'If you are using npm v3, make sure it is v3.5 or later.')
  }
  next(null, packages)
}

function getValue (context, key, next) {
  next(null, context[key])
}

function npmBundle2 (args, options, cb) {
  var stdio = options.verbose ? undefined : STDIO_SILENT
  var startDir = process.cwd() + path.sep
  var tempDir = startDir + TEMP_DIR
  var firstArg = args[0]
  var installable = firstArg && firstArg.indexOf('--') !== 0 ? args[0] : process.cwd()
  var templateDir = __dirname + path.sep + 'templates'
  var context = {
    installable: null,
    output: {
      contents: null,
      file: null
    }
  }

  async.waterfall([
    rimraf.bind(null, TEMP_DIR),
    mkdirp.bind(null, TEMP_DIR),
    ignoreValue,
    resolvePath.bind(null, installable),
    storeValue.bind(null, context, 'installable'),
    cd.bind(null, tempDir),
    ncp.bind(null, templateDir, tempDir),
    getValue.bind(null, context, 'installable'),
    npmInstall.bind(null, stdio),
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
    npmPack.bind(null, {}),
    storeValue.bind(null, context.output, 'file'),
    rimraf.bind(null, tempDir),
    getValue.bind(null, context, 'output')

  ], cb)

}

module.exports = npmBundle2
