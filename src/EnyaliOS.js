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
		{kind:SysPrefs, onWallpaperUpdated:'updateWallpaper', onWallpaperFailure:'', onUIScaleRequest:'changeUIScale'},
		{kind:StatusBar},
		{name:'bg', style:'flex:1;border-radius:1.5rem; display:flex; flex-direction: column;', components: [
			{kind:SearchBar},
			{style:'flex:1', ontap:'handleTap'}
		]},
		{kind:GestureBar}
	],
	create: function() {
		this.inherited(arguments);
		this.$.bg.applyStyle('background', 'url(\'' + this.$.sysPrefs.wallpaper + '\') center center / cover no-repeat');
		document.documentElement.style.fontSize = (this.$.sysPrefs.uiScale * 16) + 'px';
	},
	updateWallpaper: function(inSender, inEvent) {
		this.$.bg.applyStyle('background', 'url(\'' + inEvent.wallpaper + '\') center center / cover no-repeat');
	},
	changeUIScale: function(inSender, inEvent) {
		document.documentElement.style.fontSize = (inEvent.uiScale * 16) + 'px';
	}
});
