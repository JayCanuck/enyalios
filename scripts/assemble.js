var
	path = require('path'),
	cp = require('child_process'),
	fs = require('fs-extra'),
	epackager = require('electron-packager');

var rootPkg = path.join(__dirname, '..', 'package.json'),
	dist = path.join(__dirname, '..', 'dist'),
	cache = path.join(__dirname, '..', 'electron'),
	stage = path.join(__dirname, '..', 'stage'),
	stagePkg = path.join(stage, 'package.json'),
	stageIco = path.join(stage, 'assets', 'app.ico'),
	stageIcns = path.join(stage, 'assets', 'app.icns'),
	packages = path.join(__dirname, '..', 'packages'),
	app_path = path.join('system', 'apps'),
	service_path = path.join('system', 'services');

function exists(item) {
	try {
		return !!(fs.statSync(item));
	} catch(e) {
		return false;
	}
}

function copyPackage(name, src, dest) {
	var resolvedSrc = path.join(packages, name, src);
	var resolvedDest = path.join(stage, dest);
	if(exists(resolvedSrc)) {
		fs.copySync(resolvedSrc, resolvedDest);
	}
}

function packageName(name) {
	try {
		var obj = JSON.parse(fs.readFileSync(path.join(packages, name, 'package.json'),
				{encoding:'utf8'}));
		name = obj.name || name;
	} catch(e) {}
	return name;
}

function copyApp(name) {
	var src = '.';
	if(exists(path.join(packages, name, '.enyoconfig'))
			|| exists(path.join(packages, name, 'dist'))) {
		src = 'dist';
	}
	copyPackage(name, src, path.join(app_path, packageName(name)));
}

function copyService(name) {
	copyPackage(name, '.', path.join(service_path, packageName(name)));
}

function copyRemote(name) {
	var remoteDist = path.join(packages, name, 'dist');
	if(exists(remoteDist)) {
		var remoteListings = fs.readdirSync(remoteDist);
		for(var r=0; r<remoteListings.length; r++) {
			var resolvedSrc = path.join(packages, name, 'dist', remoteListings[r]);
			var resolvedDest = path.join(stage, app_path, remoteListings[r]);
			fs.copySync(resolvedSrc, resolvedDest);
		}
	}
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

// clean and reinitialize a new staging directory
fs.removeSync(dist);
fs.removeSync(stage);
fs.mkdirsSync(stage);

// copy in enyalios-core and install and node modules
copyPackage('enyalios-core', 'dist', '.');
try {
	cp.execSync('npm install', {cwd:stage, stdio:'ignore'});
} catch(e) {
	console.log('WARNING: "npm install" on root EnyaliOS stage directory failed.');
	console.log(e);
}

var listings = fs.readdirSync(packages);
for(var i=0; i<listings.length; i++) {
	if(listings[i].indexOf('app')===0 || listings[i].indexOf('webapp')===0) {
		// copy all application packages to the staging directory
		copyApp(listings[i]);
	} else if(listings[i].indexOf('service')===0) {
		// copy all service packages to the staging directory
		copyService(listings[i]);
	} else if(listings[i].indexOf('remote')===0) {
		// copy all remote application stubs to the staging directory
		copyRemote(listings[i]);
	}
}

if(exists(rootPkg) && exists(stagePkg)) {
	var rootMeta = JSON.parse(fs.readFileSync(rootPkg, {encoding:'utf8'}));

	// update package.json to point to Electron entrypoint for 'main'
	var meta = JSON.parse(fs.readFileSync(stagePkg, {encoding:'utf8'}));
	meta.name = rootMeta.name;
	meta['main'] = meta['electron-main'] || 'launch.js';
	delete meta['electron-main'];
	fs.writeFileSync(stagePkg, JSON.stringify(meta, null, '\t'), {encoding:'utf8'});

	// generate build version data
	var d = new Date();
	var z = function(i) { return (i<10 ? '0' : '') + i;};
	var versionData = {
		os: 'EnyaliOS',
		version: meta.version || rootMeta.version,
		build: rootMeta['build-cycle'] || meta['build-cycle'],
		buildtime: '' + d.getFullYear() + z(d.getMonth()+1) + z(d.getDate()) + z(d.getHours()) + z(d.getMinutes())+ z(d.getSeconds()),
		enyo: require(path.join(packages, 'enyalios-core', 'node_modules', 'enyo')).version,
		electron: rootMeta.devDependencies['electron-prebuilt'].replace(/(\~|\^)/g, '')
	};
	fs.writeFileSync(path.join(stage, 'system', 'version.json'), JSON.stringify(versionData, null, '\t'), {encoding:'utf8'});

	if(process.argv.indexOf('--stage-only')>=0) {
		console.log('Successfully staged to ' + stage);
	} else {
		if(process.argv.indexOf('--run')>=0) {
			// run the stage directory directly with Electron
			var env = process.env;
			env['ELECTRON_FORCE_WINDOW_MENU_BAR'] = true;
			try {
				console.log('Enyalios now running...');
				cp.execSync(require('electron-prebuilt') + ' ' + path.join('stage', meta['main']) + ' --dev-mode --disable-http-cache',
						{env:env, cwd:path.join(__dirname, '..'), stdio:'inherit'});
				console.log('Process has ended successfully.');
			} catch(e) {
				console.log('Process failed:');
				console.log(e);
			}
		} else {
			var platform = getCurrentPlatform();
			if(process.argv.indexOf('--all')>=0) {
				platform = {sys:'all', arch:'all'};
			}
			var opts = {
				arch: platform.arch,
				platform: platform.sys,
				dir: stage,
				'app-version': meta.version || rootMeta.version,
				cache: cache,
				overwrite: true,
				out: dist,
				'app-bundle-id': rootMeta.name
			};
			if(platform.sys==='win32' && exists(stageIco)) {
				opts.icon = stageIco;
			} else if(platform.sys==='darwin' && exists(stageIcns)) {
				opts.icon = stageIcns;
			} else if(platform.sys==='all' && exists(stageIco) && exists(stageIcns)) {
				opts.icon = path.join(stage, 'assets', 'app');
			}
			epackager(opts, function(err, appPath) {
				if(err) {
					console.log(err);
					process.exit(1);
				} else {
					console.log('Completed successfully at ' + dist);
				}
			});
		}
	}
}
