require('enyo/touch');

var
	Control = require('enyo/Control'),
	dispatcher = require('enyo/dispatcher'),
	path = window.require('path');

module.exports = Control.kind({
	name:'AppCard',
	tag: 'div',
	published: {
		id:'',
		target:'',
		params:null,
		trusted:false,
		cardview:false,
		renderMode:'mobile'
	},
	events: {
		onCloseRequest:''
	},
	classes:'appcard',
	create: function() {
		this.inherited(arguments);
		this.hasWebview = true;
		if(typeof this.target !== 'string') {
			if(this.trusted) {
				this.hasWebview = false;
			} else {
				this.doCloseRequest({errCode:1, errText:'Invalid app target'});
				return;
			}
		}
		if(this.hasWebview) {
			var uriParams = '?appID=' + encodeURIComponent(this.id);
			if(this.params) {
				uriParams += '&launchParams=' + encodeURIComponent(JSON.stringify(this.params));
			}
			var attr = {
				src: this.target + uriParams,
				useragent: this.getUserAgent(),
				partition: 'persist:' + this.id,
				blinkfeatures: 'Touch, CSSTouchActionPanDirections, MobileLayoutThem'
			};
			if(!this.isRemote()) {
				attr.preload = 'file://' + path.resolve('@../../../system/app-preload.js');
			}
			if(this.trusted) {
				attr.plugins = 'on';
				attr.nodeintegration = 'on';
				attr.disablewebsecurity = 'on';
			}
			this.createComponent({
				name:'app',
				tag:'webview',
				attributes: attr,
				classes:'app-content'
			});
		} else {
			this.createComponent({
				name:'app',
				kind:this.target,
				launchParams:this.params,
				classes:'app-content'
			});
		}
		this.cardviewChanged();
	},
	cardviewChanged: function() {
		this.addRemoveClass('cardview', this.cardview);
		if(this.cardview) {
			this.$.app.applyStyle('width', '200%');
			this.$.app.applyStyle('height', '200%');
		} else {
			this.$.app.applyStyle('width', null);
			this.$.app.applyStyle('height', null);
		}
	},
	isRemote: function() {
		return !(this.target.indexOf('file://')===0) && (typeof this.target === 'string');
	},
	renderModeChanged: function() {
		if(this.renderMode!=='desktop') {
			this.renderMode = 'mobile';
		}
		if(this.hasWebview) {
			var webview = this.$.app.hasNode();
			if(webview) {
				webview.setUserAgent(this.getUserAgent());
				webview.reload();
			} else {
				this.$.app.setAttribute('useragent', this.getUserAgent());
			}
		}
	},
	getUserAgent: function() {
		return ((this.renderMode==='desktop') ? navigator.userAgent.replace(/\)/, '; EnyaliOS)')
					: navigator.userAgent.replace(/\)/, '; Like Android 6.0; EnyaliOS)'));
	},
	rendered: function() {
		this.inherited(arguments);
		var webview = this.$.app.hasNode();
		if(webview) {
			webview.addEventListener('dom-ready', function(e) {
				console.log('dom-ready');
				webview.getWebContents().enableDeviceEmulation({
					screenPosition:'mobile'
				});
			});
			webview.addEventListener('did-finish-load', function(e) {
				console.log('did-finish-load');
				webview.getWebContents().enableDeviceEmulation({
					screenPosition:'mobile'
				});
			});
		}
	}
	//TODO: listen for page load and run .enableDeviceEmulation({screenPosition:'mobile'}) as necessary
	//TODO: look into device emulation api for view zooming for potential panning/pinch-zoom//doubletap zoom
});
