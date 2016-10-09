require('enyo/touch');

var
	Control = require('enyo/Control'),
	WebView = require('../WebView'),
	Browser = require('../../browser/Browser');

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
