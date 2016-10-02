var
	Control = require('enyo/Control'),
	SearchBar = require('../../ui/SearchBar'),
	Scroller = require('enyo/Scroller'),
	TranslateScrollStrategy = require('enyo/TranslateScrollStrategy'),
	AppCard = require('../../ui/AppCard'),
	QuickLaunch = require('../../ui/QuickLaunch');

module.exports = Control.kind({
	name: 'AppWorkspace',
	classes: 'app-workspace',
	components: [
		{kind:SearchBar},
		{name:'appspace', kind: Scroller, vertical:'hidden', touch:true, thumb:false, touchOverscroll:true, classes:'card-scroller', strategyKind:TranslateScrollStrategy, components:[
			{classes:'app-scroll-container', components:[
				{classes:'app-scroll-container-spacer'},
				{name:'app1', kind:AppCard, appid:'test-g', target:'http://192.168.235.1:8080/debug2.html', cardview:true, style:'z-index:1000'},
				{name:'app2', kind:AppCard, appid:'test-g2', target:'http://m.youtube.com', cardview:true},
				{name:'app3', kind:AppCard, appid:'test-g3', target:'http://io9.com', cardview:true},
				{classes:'app-scroll-container-spacer'}
			]}
		]},
		{kind:QuickLaunch}
	],
	toggleActive: function() {
		if(this.$.app1.cardview) {
			this.$.appspace.applyStyle('z-index', 10);
		} else {
			this.$.appspace.applyStyle('z-index', 1);
		}
		this.$.app1.setCardview(!this.$.app1.cardview);
	}
});