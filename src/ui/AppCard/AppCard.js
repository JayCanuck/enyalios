require('enyo/touch');

var
	Control = require('enyo/Control'),
	dispatcher = require('enyo/dispatcher'),
	path = window.require('path');

var
	CARD_SCALE = 0.5,
	FULL_SCALE = 1,
	SCALE_TIME = 150;

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
				blinkfeatures: 'Touch, CSSTouchActionPanDirections, MobileLayoutTheme'
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
		this.scale = (this.cardview) ? CARD_SCALE : FULL_SCALE;
		this.addRemoveClass('cardview', this.cardview);
		this.applyStyle('transform', 'scale3d(' + this.scale + ',' +  this.scale + ',1)');
		this.$.app.applyStyle('width', ((1/this.scale)*100) + '%');
		this.$.app.applyStyle('height', ((1/this.scale)*100) + '%');
	},
	cardviewChanged: function() {
		this.addRemoveClass('cardview', this.cardview);
		if(this.pendingStep) {
			window.cancelAnimationFrame(this.pendingStep);
		}
		var destination = (this.cardview) ? CARD_SCALE : FULL_SCALE;
		this.scaleTo(destination, SCALE_TIME, function(value) {
			console.log('Animated card to ' + value + ' scale');
		});
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
	},
	scaleTo: function(value, duration, callback) {
		var origin = this.scale;
		var start;
		var step = this.bindSafely(function(timestamp) {
			if(!start) start = timestamp;
			var progress = timestamp - start;
			var factor = Math.min(progress/duration, 1);
			var change = Math.abs(origin-value)*factor;
			this.scale = (origin > value) ? (origin-change) : (origin+change);
			this.applyStyle('transform', 'scale3d(' + this.scale + ',' +  this.scale + ',1)');
			this.$.app.applyStyle('width', ((1/this.scale)*100) + '%');
			this.$.app.applyStyle('height', ((1/this.scale)*100) + '%');

			if(progress<duration) {
				this.pendingStep = window.requestAnimationFrame(step);
			} else {
				this.scale = value;
				this.pendingStep = undefined;
				callback && callback(this.scale);
			}
		});
		this.pendingStep = window.requestAnimationFrame(step);
	}


	//TODO: listen for page load and run .enableDeviceEmulation({screenPosition:'mobile'}) as necessary
	//TODO: look into device emulation api for view zooming for potential panning/pinch-zoom//doubletap zoom
});
