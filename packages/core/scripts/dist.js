var fs = require('fs-extra');
var path = require('path');
var shell = require('./shell');

var rollup = require('rollup');
var resolve = require('rollup-plugin-node-resolve');
var commonjs = require('rollup-plugin-commonjs');
var json = require('rollup-plugin-json');
var uglify = require('rollup-plugin-uglify').uglify;
var package = require('../package.json');

// auto name out file
const name = (package.name.charAt(0) === '@') ? package.name.slice(1).replace('/', '-') : package.name.replace('/', '-');
// auto name amd id
const amdId = (package.name.charAt(0) === '@') ? package.name.slice(1).replace('/', '.') : package.name.replace('/', '.');
// input
const inputFile = 'src/index.ts';
// external module
const external = [];
// external globals module for browser
const globals = {}
// use package.dependencies and package.peerDependencies as default externals and golbal ids
if (package.dependencies) {
    for (const key in package.dependencies) {
        external.push(key);
        globals[key] = key;
    }
}
if (package.peerDependencies) {
    for (const key in package.peerDependencies) {
        external.push(key);
        globals[key] = key;
    }
}
// ------------------------------------------------
// clear dist
// ================================================

fs.removeSync(path.resolve(__dirname, '../dist'));
console.log(`Clear dist ...`);

// ------------------------------------------------
// method & variables
// ================================================
// input base name
const inputBaseName = path.basename(inputFile, '.ts')
const compliedInputFile = `dist/out-tsc/${inputBaseName}.js`;
async function build(input, output) {
    // create a bundle
    const bundle = await rollup.rollup(input);
    // generate code and a sourcemap
    await bundle.generate(output);
    // or write the bundle to disk
    await bundle.write(output);
}
const baseInputOption = {
    input: compliedInputFile,
    plugins: [
        resolve(),
        commonjs(),
        json()
    ]
}

// ------------------------------------------------
// complie typescript & typings
// ================================================

shell.exec(`tsc -d --declarationDir dist/types --outDir dist/out-tsc`);
package.types = `dist/types/${inputBaseName}.d.ts`;

// ------------------------------------------------
// All bundle types
// ================================================

async function buildAll() {

    // ------------------------------------------------
    // UMD Module -> package.main
    // ================================================
    await build({
        ...baseInputOption,
        external: external
    }, {
        name: amdId,
        file: `dist/${name}.umd.js`,
        format: 'umd',
        exports: 'named',
        globals: globals
    });
    console.log(`${inputFile} -> dist/${name}.umd.js ...`);
    // update package
    package.main = `dist/${name}.umd.js`;

    // ------------------------------------------------
    // ES Module -> package.module
    // ================================================

    await build({
        ...baseInputOption,
        external: external
    }, {
        file: `dist/${name}.es5.js`,
        format: 'es'
    });
    console.log(`${inputFile} -> dist/${name}.es5.js ...`);
    // update package
    package.module = `dist/${name}.es5.js`;

    // ------------------------------------------------
    // Full bundle -> single bundle file for browser
    // as default behavior, collect external and globals from package.peerDependencies
    // ================================================
    const peerExternal = [];
    const peerGlobals = {};
    if (package.peerDependencies) {
        for (const key in package.peerDependencies) {
            peerExternal.push(key);
            peerGlobals[key] = key;
        }
    }
    await build({
        ...baseInputOption,
        external: peerExternal
    }, {
        name: amdId,
        file: `dist/${name}.bundle.umd.js`,
        format: 'umd',
        exports: 'named',
        globals: peerGlobals
    });
    console.log(`${inputFile} -> dist/${name}.bundle.umd.js ...`);

    await build({
        ...baseInputOption,
        plugins: [
            ...baseInputOption.plugins,
            uglify()
        ],
        external: peerExternal
    }, {
        name: amdId,
        file: `dist/${name}.bundle.umd.min.js`,
        format: 'umd',
        exports: 'named',
        globals: peerGlobals
    });
    console.log(`${inputFile} -> dist/${name}.bundle.umd.min.js ...`);

    // ------------------------------------------------
    // write package.json and copy files
    // ================================================

    fs.outputJsonSync(path.resolve(__dirname, '../package.json'), package, {
        spaces: '  '
    });

    // ------------------------------------------------
    // clear build
    // ================================================
    fs.removeSync(path.resolve(__dirname, '../dist/out-tsc'))
    // ------------------------------------------------
    // done
    // ================================================
    console.log(`Done !`);
}

buildAll();
