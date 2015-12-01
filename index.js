var child_process = require('child_process');
var fs = require('fs');
var TEMP_DIR_NAME = '__npmbundle';
var path = require('path');
var rimraf = require('rimraf');
var STDIO_SILENT = {stdio:['ignore', 'ignore', 'ignore']};

function bundleDependenciesSync(packagePath) {
  var pkg = require(packagePath);
  if (pkg.dependencies) {
    pkg.bundledDependencies = Object.keys(pkg.dependencies);
  }
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
  return pkg;
}

function npmBundle (args, verbose) {
  var stdio = verbose ? undefined : STDIO_SILENT 
  var startDir = process.cwd();
 

  //If not an absolute path, add relative to temp dir
  var relativeDir = '..' + path.sep;
  var commands
  if (args && args.length) {
    if (args.contructor !== Array) {
      args = [args];
    }

    for (var i=0; i < args.length; i++){
      var arg = args[i];
      if (arg.indexOf('-') === 0 || arg.indexOf(path.sep) === 0 || arg.indexOf('http') === 0) {
        continue;
      } else if (arg.indexOf('.') === 0 || fs.existsSync(arg)) {
         args[i] = relativeDir + arg
      }
    }
    commands  = args.join(' ');
  } else {
    commands = relativeDir 
  }

  //Create and cd into temp directory (existing removed first) 
  rimraf.sync(TEMP_DIR_NAME);
  fs.mkdirSync(TEMP_DIR_NAME);
  process.chdir(TEMP_DIR_NAME); 

  //npm install tarball with production dependencies
  child_process.execSync('npm init -f', stdio);
  child_process.execSync('npm install ' + commands + 
	  ' --production --legacy-bundling ', stdio); 

  var packages = fs.readdirSync('node_modules');
  if (packages.length > 2){
    throw('Error:  Unable to install deduped dependencies.\n' +
		    'If you are using npm v3, make sure it is v3.5 or later.')
  }
  var packageName = fs.readdirSync('node_modules').pop();

  //Add bundledDependencies section to package.json
  var cwd = process.cwd() + path.sep;
  var packageDir = cwd + 'node_modules' + path.sep + packageName + path.sep;
  var packageJsonPath = packageDir + 'package.json';
  var pkg = bundleDependenciesSync(packageJsonPath);
  
  //npm pack with bundled dependencies
  process.chdir(startDir);
  var buffer = child_process.execSync('npm pack ' + packageDir);
  
  //remove temp directory
  rimraf.sync(TEMP_DIR_NAME);

  var outputFileName = buffer.toString('utf8'); 
  
  return outputFileName; 
}

module.exports = npmBundle

