var
	path = require('path'),
	fs = require('fs-extra');

var
	ROOT = process.env['ENYALIOS_ROOT_PATH'],
	SYSTEM = process.env['ENYALIOS_SYSTEM_PATH'],
	APP_LIST_CACHE = path.join(SYSTEM, 'applist.json'),
	SYSTEM_APPS = path.join(SYSTEM, 'apps'),
	USER_APPS = path.join(SYSTEM, 'user', 'apps');

var apps = {};

// helper functions
var isObjectEqual = function(ai1, ai2) {
	if(typeof ai1 === typeof ai2) {
		if(typeof ai1 === 'object') {
			return Object.keys(ai1).every(this.bindSafely(function(i) {
				return this.isObjectEqual(ai1[i], ai2[i]);
			}));
		} else {
			return (ai1 === ai2);
		}
	} else {
		return false;
	}
};
var exists = function(file) {
	try {
		return !!(fs.statSync(file));
	} catch(e) {
		return false;
	}
};

// service functionality
var loadCache = function() {
	try {
		apps = fs.readJsonSync(APP_LIST_CACHE, {encoding:'utf8'});
	} catch(e) {
		apps = {};
		scanApps();
	}
};

var writeCache = function() {
	try {
		fs.writeJsonSync(APP_LIST_CACHE, apps, {encoding:'utf8'});
	} catch(e) {
		console.log('Failed to write app list cache.');
		console.error(e);
	}
};

var scanApps = function(callback) {
	var appdirs = [];
	try {
		if(!exists(SYSTEM_APPS)) {
			fs.mkdirsSync(SYSTEM_APPS);
		}
		if(!exists(USER_APPS)) {
			fs.mkdirsSync(USER_APPS);
		}
		var sApps = fs.readdirSync(SYSTEM_APPS).map(function(a) { return path.join(SYSTEM_APPS, a, 'appinfo.json'); });
		var uApps = fs.readdirSync(USER_APPS).map(function(a) { return path.join(USER_APPS, a, 'appinfo.json'); });

		appdirs = sApps.concat(uApps);
	} catch(e) {
		console.log('Failed to scan available apps');
		console.error(e);
	}
	var oldApps = Object.assign({}, apps);
	apps = {};
	var added = [];
	var modified = [];
	var removed = [];
	var queryApps = function() {
		if(appdirs.length>0) {
			var curr = appdirs.shift();
			fs.readJson(curr, {encoding:'utf8'},function(err, ai) {
				if(err) {
					console.log('Unable to read appinfo: ' + curr);
				} else {
					ai.path = path.relative(ROOT, curr).replace(/\\/g, '/');
					if(!oldApps[ai.id]) {
						added.push(ai);
					} else {
						if(isObjectEqual(ai, oldApps[ai.id])) {
							modified.push(ai);
						}
						delete oldApps[ai.id];
					}
					apps[ai.id] = ai;
				}
				queryApps();
			});
		} else {
			for(var i in oldApps) {
				removed.push(oldApps[i]);
			}
			if(added.length>0 || removed.length>0) {
				callback && callback({added:added, modified:modified, removed:removed});
			}
			writeCache();
		}
	};
	queryApps();
};

// initialize service
loadCache();

// export public methods
module.exports = {
	loadCache: loadCache,
	writeCache: writeCache,
	scanApps: function(params, callback) {
		scanApps(callback);
	},
	getAppInfo: function(params) {
		if(params.id && apps[params.id]) {
			return {appinfo:apps[params.id]};
		} else {
			return {errorText:'Invalid appID requested'};
		}
	},
	fetchAppInfo: function(params) {
		var aiPath = path.join(SYSTEM_APPS, params.id, 'appinfo.json');
		if(!this.exists(aiPath)) {
			aiPath = path.join(USER_APPS, params.id, 'appinfo.json');
			if(!this.exists(aiPath)) {
				return {errorText:'Application ' + params.id + ' not found'};
			}
		}
		try {
			return {appinfo:fs.readJsonSync(aiPath)};
		} catch(e) {
			return {errorText:'Unable to read ' + params.id + ' appinfo.json file'};
		}
	}
};
