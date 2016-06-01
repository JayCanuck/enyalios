var
	path = require('path'),
	fs = require('fs-extra');

var
	ROOT = process.env['ENYALIOS_ROOT_PATH'],
	SYSTEM = process.env['ENYALIOS_SYSTEM_PATH'],
	PREF_FILE = path.join(SYSTEM, 'preferences.json'),
	PREF_KEYS = ['wallpaper', 'uiScale'];

// default preferences
var preferences = {
	wallpaper:'system/wallpaper.jpg',
	uiScale:1
};

var watchers = {};

// helper functions

var counter = 0;
var getID = function() {
	counter++;
	return 'request' + counter;
}

var mixin = function(items) {
	var ret = {};
	for(var i=0; i<items.length; i++) {
		for(var x in items[i]) {
			ret[x] = items[i][x];
		}
	}
	return ret;
};

// service functionality
var loadPrefs = function() {
	try {
		var obj = fs.readJsonSync(PREF_FILE, {encoding:'utf8'});
		for(var i=0; i<PREF_KEYS.length; i++) {
			if(obj[PREF_KEYS[i]]!==undefined) {
				preferences[PREF_KEYS[i]] = obj[PREF_KEYS[i]];
			}
		}
	} catch(e) {
		savePrefs();
	}
};

var savePrefs = function() {
	var obj = {};
	for(var i=0; i<PREF_KEYS.length; i++) {
		if(preferences[PREF_KEYS[i]]!==undefined) {
			obj[PREF_KEYS[i]] = preferences[PREF_KEYS[i]];
		}
	}
	try {
		fs.writeJsonSync(PREF_FILE, obj, {encoding:'utf8'});
	} catch(e) {
		console.log('Failed to write system preferences.');
		console.error(e);
	}
};

var updaters = {
	wallpaper: function(value, callback) {
		var old = preferences['wallpaper'];
		var dest = path.join(SYSTEM, (new Date().getTime()) + path.extname(value));
		fs.copy(value, dest, function(err) {
			if(err) {
				console.log('Failed to copy "' + value + '"" to "' + dest + '"');
				console.error(err);
				callback({errorText:'Failed to import wallpaper'});
			} else {
				preferences['wallpaper'] = path.relative(ROOT, dest).replace(/\\/g, '/');
				fs.removeSync(old);
				savePrefs();
				callback({wallpaper:preferences['wallpaper']});

			}
		});
	},
	uiScale: function(value, callback) {
		preferences['uiScale'] = value;
		savePrefs();
		callback({uiScale:preferences['uiScale']});
	}
};

var addWatchers = function(properties, key, callback) {
	for(var i=0; i<properties.length; i++) {
		if(preferences[properties[i]]) {
			if(!watchers[properties[i]]) {
				watchers[properties[i]] = {};
			}
			watchers[properties[i]][key] = callback;
		}
	}
};

var notifyWatchers = function(property, keyToIgnore) {
	if(preferences[property] && watchers[property]) {
		for(var x in watchers[property]) {
			if(x!==keyToIgnore) {
				var ret = {};
				ret[property] = preferences[property];
				watchers[property][x](ret);
			}
		}
	}
};

var removeWatcher = function(key) {
	for(var x in watchers) {
		if(watchers[x][key]) {
			delete watchers[x][key];
		}
	}
};

// initialize service
loadPrefs();

// export public methods
module.exports = {
	load:loadPrefs,
	save:savePrefs,
	set: function(params, callback) {
		var key = this.key;
		var props = Object.keys(params);
		var reports = [];
		var setProps = function() {
			if(props.length>0) {
				var curr = props.shift();
				if(updaters[curr]) {
					updaters[curr](params[curr], function(res) {
						if(res.errorText || res.errCode || res.returnValue===false) {
							callback(res);
						} else {
							notifyWatchers(curr, key);
							reports.push(res);
							setProps();
						}
					});
				} else {
					setProps();
				}
			} else {
				callback(mixin(reports));
			}
		};
		setProps();
	},
	get: function(params, callback) {
		var requested = {};
		var props = params.keys || [params.key];
		var key = this.key;
		var subscribe = this.subscribe;
		if(subscribe) {
			addWatchers(props, key, callback);
		}
		for(var i=0; i<props.length; i++) {
			if(!preferences[props[i]]) {
				return {errorText:'Preference key ' + props[i] + ' not found'};
			} else {
				requested[props[i]] = preferences[props[i]];
			}
		}
		callback(requested);
	},
	endSubscription: function() {
		removeWatcher(this.key);
	}
};
