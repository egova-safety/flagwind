var semver = require('semver');
var path = require('path');
var fs = require('fs-extra');
var shell = require('./shell');

shell.required('git');

// test
// shell.exec('npm run test-once');

var package = fs.readJsonSync(path.resolve(__dirname, '../package.json'));
// verify version
var latestVersion = shell.exec(`npm view ${package.name} version`).trim();
if (semver.lte(package.version, latestVersion)) {
    package.version = [semver.major(latestVersion), semver.minor(latestVersion), semver.patch(latestVersion) + 1].join('.');
    fs.outputJsonSync(path.resolve(__dirname, '../package.json'), package, {
        spaces: '  '
    })
}

// build
shell.exec('npm run build');
// verify git status
var statusOut = shell.exec('git status -s');
if (!!statusOut.stdout) {
    shell.exec('git add .');
    shell.exec('git commit -m "build: auto commit before release"');
}
// tag
shell.exec('git tag -f -a v' + package.version + ' -m "build: auto tag before release v' + package.version + '"');
shell.exec('git push');
shell.exec('git push --tags -f');
// publish
shell.cd('./dist/');
shell.exec('npm publish --access=public --registry https://registry.npmjs.org');
