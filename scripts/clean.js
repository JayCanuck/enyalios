var
	path = require('path'),
	fs = require('fs-extra');

fs.removeSync(path.join(__dirname, '..', 'dist'));
fs.removeSync(path.join(__dirname, '..', 'stage'));
