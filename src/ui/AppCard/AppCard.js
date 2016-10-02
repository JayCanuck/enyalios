require('enyo/touch');

var
	Control = require('enyo/Control'),
	dispatcher = require('enyo/dispatcher'),
	WebView = require('../WebView'),
	Browser = require('../../browser/Browser'),
	path = window.require('path');

var
	CARD_SCALE = 0.5,
	FULL_SCALE = 1,
	SCALE_TIME = 150;

module.exports = Control.kind({
	name:'AppCard',
	tag: 'div',
	published: {
		appid:'',
		target:'',
		params:null,
		cardview:false,
		browser:false
	},
	classes:'appcard',
	create: function() {
		this.inherited(arguments);
		if(!this.browser) {
			var uriParams = '';
			if(this.target.indexOf('file://')===0) {
				uriParams = '?appID=' + encodeURIComponent(this.appid);
				if(this.params) {
					uriParams += '&launchParams=' + encodeURIComponent(JSON.stringify(this.params));
				}
			}
			this.createComponent({
				name:'app',
				kind:WebView,
				uri:this.target + uriParams,
				trusted:(this.appid.indexOf('com.enyalios')===0),
				identifier:this.appid
			}).addClass('app-content');

		} else {
			this.createComponent({
				name:'app',
				kind:Browser,
				launchURI:this.target,
				classes:'app-content'
			});
		}
		this.addRemoveClass('cardview', this.cardview);
	},
	cardviewChanged: function() {
		this.addRemoveClass('cardview', this.cardview);
	}
});
