var
	Component = require('enyo/Component'),
	path = window.require('path'),
	fs = window.require('fs-extra');

var PREF_FILE = '@../../system/preferences.json';
var PREF_KEYS = ['wallpaper', 'uiScale'];

module.exports = Component.kind({
	name:'SysPrefs',
	published: {
		wallpaper:'system/wallpaper.jpg',
		uiScale:1
	},
	events: {
		onWallpaperUpdated:'',
		onWallpaperFailure:'',
		onUIScaleRequest:''
	},
	create: function() {
		this.inherited(arguments);
		this.loadPrefs();
	},
	loadPrefs: function() {
		try {
			var prefs = fs.readJsonSync(PREF_FILE, {encoding:'utf8'});
			for(var i=0; i<PREF_KEYS.length; i++) {
				if(prefs[PREF_KEYS[i]]!==undefined) {
					this[PREF_KEYS[i]] = prefs[PREF_KEYS[i]];
				}
			}
		} catch(e) {
			this.savePrefs();
		}
	},
	savePrefs: function() {
		var prefs = {};
		for(var i=0; i<PREF_KEYS.length; i++) {
			if(this[PREF_KEYS[i]]!==undefined) {
				prefs[PREF_KEYS[i]] = this[PREF_KEYS[i]];
			}
		}
		try {
			fs.writeJsonSync(PREF_FILE, prefs, {encoding:'utf8'});
		} catch(e) {
			this.log('Failed to write system preferences.');
			console.error(e);
		}
	},
	wallpaperChanged: function(from, to) {
		fs.removeSync(from);
		var dest = path.join('@../../system', (new Date().getTime()) + path.extname(to));
		fs.copy(to, dest, this.bindSafely(function(err) {
			if(err) {
				this.doWallpaperFailure(err);
			} else {
				this.wallpaper = path.relative(__dirname, dest).replace(/\\/g, '/');
				this.savePrefs();
				this.doWallpaperUpdated({wallpaper:this.wallpaper});

			}
		}));
	},
	uiScaleChanged: function(from, to) {
		this.savePrefs();
		this.doUIScaleRequest({uiScale:this.uiScale});
	}
});
