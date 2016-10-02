var
	ServiceInterface = require('./data/ServiceInterface'),
	Control = require('enyo/Control'),
	StatusBar = require('./ui/StatusBar'),
	AppWorkspace = require('./views/AppWorkspace'),
	GestureBar = require('./ui/GestureBar');


module.exports = Control.kind({
	name: 'EnyaliOS',
	fit:true,
	style:'background:black; display:flex; flex-direction: column;',
	components: [
		{name:'service', kind:ServiceInterface},
		{kind:StatusBar},
		{name:'workspace', kind:AppWorkspace, style:'flex:1'},
		{kind:GestureBar, onCenter:'toggleApp', onBack:'backGesture', onUp:'upGesture', onForward:'forwardGesture'}
	],
	create: function() {
		this.inherited(arguments);
		this.$.service.request({
			uri:'enyalios://com.enyalios.service.sysprefs/get',
			params: {
				keys: ['uiScale', 'wallpaper']
			},
			subscribe: true,
			callback: this.bindSafely(function(res) {
				if(res.wallpaper) {
					this.$.workspace.applyStyle('background', 'url(\'' + res.wallpaper + '\') center center / cover no-repeat');
				}
				if(res.uiScale) {
					document.documentElement.style.fontSize = (res.uiScale * 16) + 'px';
				}
			})
		});
	},
	toggleApp: function() {
		console.log('Center gesture');
		this.$.workspace.toggleActive();
	},
	backGesture: function() {
		console.log('Back gesture');
	},
	upGesture: function() {
		console.log('Up gesture');
	},
	forwardGesture: function() {
		console.log('Forward gesture');
	}
});
