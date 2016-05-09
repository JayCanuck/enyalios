'use strict';

var
	gulp = require('gulp'),
	path = require('path'),
	fs = require('fs'),
	cp = require('child_process'),
	jshint = require('gulp-jshint'),
	stylish = require('jshint-stylish'),
	epackager = require('electron-packager');

var pkg = {};
try {
	pkg = JSON.parse(fs.readFileSync('./package.json', {encoding:'utf8'}));
} catch(e) {
	console.error('Unable to find package.json');
}

/**
 * Gulp Tasks:
 *
 * 'init' - Fetches the enyo libraries via enyo-dev
 * 'enyo' - Builds the app with enyo-dev
 * 'electron' - Packages built app with electron for the current platform 
 * 'electron-all' - Packages built app with electron for all available platforms
 * 'run' - Runs the built app directly with electron without packaging
 * 'build' - Combination of the 'enyo' task then the 'electron' task
 * 'build-all' - Combination of the 'enyo' task then the 'electron-all' task
 *
 * The default task is 'build'
 */

gulp.task('default', ['build']);
gulp.task('init', init);
gulp.task('enyo', enyo);
gulp.task('electron', electron);
gulp.task('electron-all', electronAll);
gulp.task('build', build);
gulp.task('build-all', buildAll);
gulp.task('run', run);
gulp.task('jshint', lint);

// Gulp Task: 'init'
function init(cb) {
	exec('enyo init', {}, cb);
}

// Gulp Task: 'build'
function build(cb) {
	enyo(function() {
		electron(cb);
	});
}

// Gulp Task: 'build-all'
function buildAll(cb) {
	enyo(function() {
		electronAll(cb);
	});
}

// Gulp Task: 'enyo'
function enyo(cb) {
	var opts = process.argv.slice(2);
	if((opts.length > 0) && (opts[0].indexOf('-')!==0)) {
		opts = opts.slice(1);
	}
	opts = opts.map(function (v) { return v.match(/^[^\s-]+?\s+[^\s]/g) ? ('"' + v + '"') : v; })
			.map(function (v) { return v.replace(/=((?=[^\s'"]+\s)[^'"]*$)/g, '="$1"'); });
	console.log('Building Enyo app at ' + process.cwd() + '...');
	exec('enyo pack ' + opts.join(' '), {}, function(err) {
		if(!err) {
			//generate build version data
			var d = new Date();
			var z = function(i) { return (i<10 ? '0' : '') + i;};
			var versionData = {
				os: 'EnyaliOS',
				version: pkg.version,
				build: pkg['build-cycle'],
				buildtime: '' + d.getFullYear() + z(d.getMonth()+1) + z(d.getDate()) + z(d.getHours()) + z(d.getMinutes())+ z(d.getSeconds()),
				electron: pkg.dependencies['electron-prebuilt']
			};
			fs.writeFileSync('./dist/system/version.json', JSON.stringify(versionData, null, '\t'), {encoding:'utf8'});
		}
		cb(err);
	});
}

// Gulp Task: 'electron'
function electron(cb) {
	electronBuild(getCurrentPlatform(), 'build', cb);
}

// Gulp Task: 'electron-all'
function electronAll(cb) {
	electronBuild({sys:'all', arch:'all'}, 'build', cb);
}

// Gulp Task: 'run'
function run(cb) {
	var flags = '';
	var cfg = {};
	if(exists('./enyoconfig')) {
		cfg = JSON.stringify(fs.readFileSync('./enyoconfig', {encoding:'utf8'}));
	}
	if(!(process.argv.indexOf('-P')>-1 || process.argv.indexOf('--production')>-1 || cfg.production)) {
		flags = ' --dev-mode';
	}
	var env = process.env;
	env['ELECTRON_FORCE_WINDOW_MENU_BAR'] = true;
	exec(require('electron-prebuilt') + ' ./dist/' + (pkg['electron-main'] || 'launch.js') + flags, {env:env}, cb);
}

// Gulp Task: 'jshint'
function lint() {
	return gulp
		.src(['launcj.js', 'index.js', './src/**/*.js'])
		.pipe(jshint())
		.pipe(jshint.reporter(stylish, {verbose: true}))
		.pipe(jshint.reporter('fail'));
}

function electronBuild(platform, action, callback) {
	pkg['main'] = pkg['electron-main'] || 'launch.js';
	fs.writeFileSync('./dist/package.json', JSON.stringify(pkg, null, '\t'), {encoding:'utf8'});
	console.log('Packaging with electron to ' + path.join(process.cwd(), 'bin') + '...');
	var opts = {
		arch: platform.arch,
		platform: platform.sys,
		dir: './dist',
		'app-version': pkg.version,
		cache: './electron',
		overwrite: true,
		out: './bin',
		'app-bundle-id': pkg.name
	};
	if(platform.sys==='win32' && exists('./assets/app.ico')) {
		opts.icon = './assets/app.ico';
	} else if(platform.sys==='darwin' && exists('./assets/app.icns')) {
		opts.icon = './assets/app.icns';
	} else if(platform.sys==='all' && exists('./assets/app.ico') && exists('./assets/app.icns')) {
		opts.icon = './assets/app';
	}
	epackager(opts, function(err, appPath) {
		if(err) {
			console.log(err);
			process.exit(1);
		}
		callback();
	});
}

function exec(cmd, opts, callback) {
	var child = cp.exec(cmd, opts, function(err, stdout, stderr) {
		if(err) {
			callback(err);
		} else {
			callback();
		}
	});
	child.stdout.pipe(process.stdout);
	child.stderr.pipe(process.stderr);
}

function exists(file) {
	try {
		return !!(fs.statSync(file));
	} catch(e) {return false;}
}

function getCurrentPlatform() {
	switch(process.platform) {
		case 'darwin':
			return process.arch === 'x64' ? {sys:'darwin', arch:'x64'} : {sys:'darwin', arch:'ia32'};
		case 'win32':
			return (process.arch === 'x64' || process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432')) ? {sys:'win32', arch:'x64'} : {sys:'win32', arch:'ia32'};
		case 'linux':
			return process.arch === 'x64' ? {sys:'linux', arch:'x64'} : {sys:'linux', arch:'ia32'};
	}
}
