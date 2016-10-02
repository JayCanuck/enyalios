require('enyo/touch');

var Control = require('enyo/Control');

module.exports = Control.kind({
	name:'GestureBar',
	events: {
		onBack:'',
		onCenter:'',
		onUp:'',
		onForward:''
	},
	handlers: {
		ondown: 'activeStart',
		onup: 'activeStop',
		onleave: 'activeStop',
		ontap: 'singleTap',
		ondrag: 'dragActive',
		ondragfinish:'swiped'
	},
	classes:'gesturebar',
	components: [
		{name:'indicator', classes:'indicator'}
	],
	activeStart: function(inSender, inEvent) {
		this.startX = inEvent.clientX;
		if(this.isOnCenter(this.startX)) {
			this.addClass('active');
		}
		return true;
	},
	activeStop: function(inSender, inEvent) {
		this.startX = undefined;
		setTimeout(this.bindSafely(function() {
			this.removeClass('active');
		}), 100);
		return true;		
	},
	singleTap: function(inSender, inEvent) {
		if(this.isOnCenter(inEvent.clientX)) {
			this.doCenter();
			return true;
		}
	},
	dragActive: function(inSender, inEvent) {
		if(this.startX!==undefined && inEvent.dx!==0) {
			this.addClass('active');
		}
	},
	swiped: function(inSender, inEvent) {
		var b = this.getBounds();
		if(b && inEvent.clientY<b.top) {
			inEvent.preventTap();
			this.doUp();
			return true;
		} else if(this.startX && this.isOnCenter(inEvent.clientX) && this.isOnCenter(this.startX)) {
			inEvent.preventTap();
			this.doCenter();
			return true;
		} else if(inEvent.dx!==0) {
			inEvent.preventTap();
			if(inEvent.dx>0) {
				this.doForward();
			} else {
				this.doBack();
			}
			return true;
		}
	},
	isOnCenter: function(x) {
		var b = this.getBounds();
		var b2 = this.$.indicator.getBounds();
		if(b && b2) {
			var buffer = ((b.width - b2.width)/2)*0.1;
			return (x>(b2.left-buffer) && x<(b2.left+b2.width+buffer));
		} else {
			return false;
		}
	}
});
