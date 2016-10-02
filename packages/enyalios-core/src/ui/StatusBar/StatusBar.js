require('enyo/touch');

var Control = require('enyo/Control');

module.exports = Control.kind({
	name:'StatusBar',
	classes:'statusbar',
	components: [
		{name:'osLabel', content:'EnyaliOS', classes:'os'},
		{name:'appMenu', content:'<App Menu>', classes:'appmenu'},
		{style:'flex:1;', classes:'spacer'},
		{name:'notifications', classes:'notifications'},
		{name:'icons', classes:'icons'},
		{name:'time'},
		{content:'[X]', style:'color:gray;', ondown:'closeWindow'}
	],
	create: function() {
		this.inherited(arguments);
		this.$.time.setContent(this.getTimeString());
		this.clockID = setInterval(this.bindSafely(function() {
			this.$.time.setContent(this.getTimeString());
		}), 1000);
	},
	getTimeString: function() {
		var pad = function(n){
			return (n<10?'0':'') + n;
		};
		var d = new Date();
		var h = d.getHours();
		return ((h>12) ? h-12 : h) + ':' + pad(d.getMinutes()) + ' ' + (h<12?'AM':'PM');
	},
	closeWindow: function(inSender, inEvent) {
		window.close();
	}
});
