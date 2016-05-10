var
	Component = require('enyo/Component'),

	path = window.require('path'),
	fs = window.require('fs-extra');

var APP_LIST_CACHE = '@../../system/applist.json';
var SYSTEM_APPS = '@../../system/apps';
var USER_APPS = '@../../system/user/apps';

module.exports = Component.kind({
	name:'AppMgr',
	events: {
		onAppsChanged:''
	},
	create: function() {
		this.inherited(arguments);
		this.loadCache();
	},
	loadCache: function() {
		try {
			this.apps = fs.readJsonSync(APP_LIST_CACHE, {encoding:'utf8'});
			console.log(JSON.stringify(this.apps));
		} catch(e) {
			this.apps = {};
			this.scanApps();
		}
	},
	writeCache: function() {
		try {
			fs.writeJsonSync(APP_LIST_CACHE, this.apps, {encoding:'utf8'});
		} catch(e) {
			this.log('Failed to write app list cache.');
			console.error(e);
		}
	},
	scanApps: function(callback) {
		var appdirs = [];
		try {
			if(!this.exists(SYSTEM_APPS)) {
				fs.mkdirsSync(SYSTEM_APPS);
			}
			if(!this.exists(USER_APPS)) {
				fs.mkdirsSync(USER_APPS);
			}
			var sApps = fs.readdirSync(SYSTEM_APPS);
			var uApps = fs.readdirSync(USER_APPS);

			sApps.map(function(a) { return path.join(SYSTEM_APPS, a); });
			uApps.map(function(a) { return path.join(USER_APPS, a); });
			appdirs = sApps.concat(uApps);
		} catch(e) {
			this.log('Failed to scan available apps');
			console.error(e);
		}
		var oldApps = Object.assign({}, this.apps);
		this.apps = {};
		var added = [];
		var modified = [];
		var removed = [];
		var queryApps = this.bindSafely(function() {
			if(appdirs.length>0) {
				var curr = appdirs.shift();
				fs.readJson(path.join(curr, 'appinfo.json'), {encoding:'utf8'}, this.bindSafely(function(err, ai) {
					if(err) {
						this.log('Unable to read appinfo: ' + curr);
					} else {
						ai.path = path.relative(__dirname, curr).replace(/\\/g, '/');
						if(!oldApps[ai.id]) {
							added.push(ai);
						} else {
							if(this.isObjectEqual(ai, oldApps[ai.id])) {
								modified.push(ai);
							}
							delete oldApps[ai.id];
						}
						this.apps[ai.id] = ai;
					}
					queryApps();
				}));
			} else {
				for(var i in oldApps) {
					removed.push(oldApps[i]);
				}
				if(added.length>0 || removed.length>0) {
					this.doAppsChanged({added:added, modified:modified, removed:removed});
				}
				this.writeCache();
			}
		});
		queryApps();
		
	},
	getAppInfo: function(id) {
		return this.apps[id];
	},
	fetchAppInfo: function(id) {
		var aiPath = path.join(SYSTEM_APPS, id, 'appinfo.json');
		if(!this.exists(aiPath)) {
			aiPath = path.join(USER_APPS, id, 'appinfo.json');
			if(!this.exists(aiPath)) {
				return;
			}
		}
		try {
			return fs.readJsonSync(aiPath);
		} catch(e) {
			return;
		}
	},
	isObjectEqual: function(ai1, ai2) {
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
	},
	exists: function(file) {
		try {
			return !!(fs.statSync(file));
		} catch(e) {
			return false;
		}
	}
});
