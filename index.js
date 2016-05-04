var ready = require('enyo/ready');
var EnyaliOS = require('./src/EnyaliOS');

ready(function() {
	new EnyaliOS().renderInto(document.body);
});
