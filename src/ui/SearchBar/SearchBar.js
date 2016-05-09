require('enyo/touch');

var Control = require('enyo/Control');

module.exports = Control.kind({
	name:'SearchBar',
	classes:'search',
	events: {
		onSearchActivate:''
	},
	handlers: {
		ondown:'pressedState',
		onup:'unpressedState',
		onleave:'removeState'
	},
	components: [
		{content:'Search...'},
		{style:'flex:1;'},
		{name:'icon', classes:'icon'}
	],
	pressedState: function(inSender, inEvent) {
		this.addClass('active');
	},
	unpressedState: function(inSender, inEvent) {
		if(this.hasClass('active')) {
			this.doSearchActivate();
		}
		this.removeClass('active');
	},
	removeState: function(inSender, inEvent) {
		this.removeClass('active');
	}
});
