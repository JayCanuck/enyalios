var
	path = require('path'),
	fs = require('fs-extra'),
	apps = require('../index');

var dist = path.join(__dirname, '..', 'dist');
fs.removeSync(dist);
fs.mkdirsSync(dist);

for(var i=0; i<apps.length; i++) {
	var appinfo = {
		id: apps[i].app,
		title: apps[i].title,
		version: '1.0.0',
		main: apps[i].url,
		icon: 'icon.png',
		type: 'remote'
	};
	fs.mkdirsSync(path.join(dist, apps[i].app));
	fs.writeFileSync(path.join(dist, apps[i].app, 'appinfo.json'), JSON.stringify(appinfo, null, '\t'), {encoding:'utf8'});
	fs.copySync(path.join(__dirname, '..', apps[i].icon), path.join(dist, apps[i].app, 'icon.png'));
}
