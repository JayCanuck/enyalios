var ready = require('enyo/ready');
var EnyaliOS = require('./src/EnyaliOS');

process.chdir(__dirname);

ready(function() {
	new EnyaliOS().renderInto(document.body);
});
