var
	AppMgr = require('./data/AppMgr'),
	SysPrefs = require('./data/SysPrefs'),
	Control = require('enyo/Control'),
	StatusBar = require('./ui/StatusBar'),
	SearchBar = require('./ui/SearchBar'),
	GestureBar = require('./ui/GestureBar');

module.exports = Control.kind({
	name: 'EnyaliOS',
	fit:true,
	style:'background:black; display:flex; flex-direction: column;',
	components: [
		{kind:AppMgr, onAppsChanged:''},
		{kind:SysPrefs, onWallpaperUpdated:'updateWallpaper', onWallpaperFailure:''},
		{kind:StatusBar},
		{name:'bg', style:'flex:1;border-radius:1.5rem; display:flex; flex-direction: column;', components: [
			{kind:SearchBar},
			{style:'flex:1', ontap:'handleTap'}
		]},
		{kind:GestureBar}
	],
	create: function() {
		this.inherited(arguments);
		this.$.bg.applyStyle('background', 'url(\'' + this.$.sysPrefs.getWallpaper() + '\') center center / cover no-repeat');
	},
	updateWallpaper: function(inSender, inEvent) {
		this.$.bg.applyStyle('background', 'url(\'' + inEvent.wallpaper + '\') center center / cover no-repeat');
	}
});
