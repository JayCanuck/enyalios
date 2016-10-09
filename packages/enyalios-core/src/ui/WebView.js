var
	Control = require('enyo/Control'),
	path = window.require('path');

var
	DESKTOP_UA = navigator.userAgent.replace(/\)/, '; EnyaliOS)'),
	MOBILE_UA = navigator.userAgent.replace(/\)/, '; Like Android 6.0; EnyaliOS)');


module.exports = Control.kind({
	name:'WebView',
	tag:'webview',
	published: {
		identifier:undefined,
		uri:'about:blank',
		trusted: false,
		mobile: true
	},
	create: function() {
		this.inherited(arguments);
		var attr = {
			id: this.id,
			src: this.uri,
			useragent: this.getUserAgent(),
			partition: 'persist:' + this.identifier,
			blinkfeatures: 'Touch, CSSTouchActionPanDirections, MobileLayoutTheme'
		};
		if(!this.isRemote()) {
			attr.preload = 'file://' + path.resolve('@../../system/app-preload.js');
		}
		
		if(this.trusted) {
			attr.plugins = 'on';
			attr.nodeintegration = 'on';
			attr.disablewebsecurity = 'on';
		}
		this.setAttributes(attr);
	},
	mobileChanged: function() {
		var node = this.hasNode();
		if(node) {
			node.setUserAgent(this.getUserAgent());
			node.reload();
		} else {
			this.setAttribute('useragent', this.getUserAgent());
		}
	},
	getUserAgent: function() {
		return (this.mobile ? MOBILE_UA : DESKTOP_UA);
	},
	isRemote: function() {
		return (this.uri.indexOf('file://')!==0);
	},
	rendered: function() {
		this.inherited(arguments);
		var node = this.hasNode();
		if(node) {
			var fn = this.bindSafely(function() {
				console.log(node);
				window.n = node;
				//this.applyStyle('width', '100%');
				this.applyStyle('height', '100%');
			});
			requestAnimationFrame(function() {
				requestAnimationFrame(fn);
			});
			/*node.addEventListener('dom-ready', function(e) {
				console.log('dom-ready');
				node.getWebContents().enableDeviceEmulation({
					screenPosition:'mobile'
				});
			});
			node.addEventListener('did-finish-load', function(e) {
				console.log('did-finish-load');
				node.getWebContents().enableDeviceEmulation({
					screenPosition:'mobile'
				});
			});*/
		}
	}
	
	//TODO: listen for page load and run .enableDeviceEmulation({screenPosition:'mobile'}) as necessary
	//TODO: look into device emulation api for view zooming for potential panning/pinch-zoom//doubletap zoom
});
