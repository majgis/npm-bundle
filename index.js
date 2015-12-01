var child_process = require('child_process');
var fs = require('fs');
var TEMP_DIR_NAME = '.npmbundle';
var path = require('path');
var rimraf = require('rimraf');
var stdio = {stdio:['ignore', 'ignore', 'ignore']};

function bundleDependenciesSync(packagePath) {
  var pkg = require(packagePath);
  if (pkg.dependencies) {
    pkg.bundledDependencies = Object.keys(pkg.dependencies);
  }
  delete pkg._id;
  delete pkg._shasum;
  delete pkg._resolved;
  delete pkg._from;
  fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
}

function npmBundle (arg) {
  var startDir = process.cwd();

  //If not an absolute path, add relative to temp dir
  if (!arg || arg.indexof('.') === 0){
    arg = '..' + path.sep + (arg || '');
  }	  
 
  //Create and cd into temp directory (existing removed first) 
  rimraf.sync(TEMP_DIR_NAME);
  fs.mkdirSync(TEMP_DIR_NAME);
  process.chdir(TEMP_DIR_NAME);
  
  //npm pack input argument 
  child_process.execSync('npm pack ' + arg, stdio);  
  
  //Get the package name
  var tarFileName = fs.readdirSync(process.cwd())[0];
  var split = tarFileName.split('-');
  split.pop();
  var packageName = split.join('-');

  //npm install tarball with production dependencies
  fs.mkdirSync('node_modules');
  child_process.execSync('npm install --production ' + tarFileName, stdio); 

  //Add bundledDependencies section to package.json
  var cwd = process.cwd() + path.sep;
  var packageDir = cwd + 'node_modules' + path.sep + packageName + path.sep;
  var packageJsonPath = packageDir + 'package.json';
  bundleDependenciesSync(packageJsonPath);
  
  //npm pack with bundled dependencies
  process.chdir(startDir);
  child_process.execSync('npm pack ' + packageDir, stdio);
  
  //remove temp directory
  rimraf.sync(TEMP_DIR_NAME);

  console.log(tarFileName);
  return process.cwd() + path.sep + tarFileName;
}

module.exports = npmBundle
