var
	ServiceInterface = require('./data/ServiceInterface'),
	Control = require('enyo/Control'),
	StatusBar = require('./ui/StatusBar'),
	SearchBar = require('./ui/SearchBar'),
	GestureBar = require('./ui/GestureBar'),
	AppCard = require('./ui/AppCard'),
	QuickLaunch = require('./ui/QuickLaunch'),
	Scroller = require('enyo/Scroller'),
	TranslateScrollStrategy = require('enyo/TranslateScrollStrategy');


module.exports = Control.kind({
	name: 'EnyaliOS',
	fit:true,
	style:'background:black; display:flex; flex-direction: column;',
	components: [
		{name:'service', kind:ServiceInterface},
		{kind:StatusBar},
		{name:'bg', style:'flex:1;border-radius:1.5rem; display:flex; flex-direction: column;', components: [
			{kind:SearchBar},
			{name:'workspace', kind: Scroller, vertical:'hidden', touch:true, thumb:false, touchOverscroll:true, classes:'card-scroller', strategyKind:TranslateScrollStrategy, components:[
				{style:'height:100%; width:100%; white-space: nowrap;', components:[
					{style:'font-size:0; width:19%; height:100%; display:inline-block;position:relative;'},
					{name:'app1', kind:AppCard, id:'test-g', target:'http://google.com', cardview:true, style:'z-index:1000'},
					{name:'app2', kind:AppCard, id:'test-g2', target:'http://m.youtube.com', cardview:true},
					{name:'app3', kind:AppCard, id:'test-g3', target:'http://io9.com', cardview:true},
					{style:'font-size:0; width:19%; height:100%; display:inline-block; position:relative;'}
				]}
			]},
			{kind:QuickLaunch}
		]},
		{kind:GestureBar, onCenter:'toggleApp', onForward:'toggleUA'}
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
					this.$.bg.applyStyle('background', 'url(\'' + res.wallpaper + '\') center center / cover no-repeat');
				}
				if(res.uiScale) {
					document.documentElement.style.fontSize = (res.uiScale * 16) + 'px';
				}
			})
		});
	},
	toggleApp: function() {
		if(this.$.app1.cardview) {
			this.$.workspace.applyStyle('z-index', 10);
		} else {
			this.$.workspace.applyStyle('z-index', 1);
		}
		this.$.app1.setCardview(!this.$.app1.cardview);
	},
	toggleUA: function() {
		this.$.app1.setRenderMode(!this.$.app1.renderMode);
	}
});
