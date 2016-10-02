var
	path = require('path'),
	fs = require('fs-extra');

var
	TIMEOUT_MAX = 2147483647,
	SYSTEM = path.join(process.cwd(), 'system');

var
	registry = {},
	loadAtStartup = [
		'com.enyalios.service.appmgr',
		'com.enyalios.service.sysprefs'
	];

var serviceURIComponents = function(uri) {
	return uri.replace('enyalios://', '').split('/');
};

var serviceID = function(uri) {
	return serviceURIComponents(uri)[0];
};

var serviceMethod = function(service, uri) {
	var methods = serviceURIComponents(uri);
	var methodCall = service;
	for(var i=1; methodCall && i<methods.length; i++) {
		methodCall = methodCall[methods[i]];
	}
	return methodCall;
};

var normalizeResponse = function(res, key, subscribe) {
	res = res || {};
	res.key = key;
	if(res.returnValue===undefined) {
		if(res.errorText || res.errorCode) {
			res.returnValue = false;
		} else {
			if(!subscribe) {
				res.returnValue = true;
			}
		}
	}
	return res;
};

process.env['ENYALIOS_ROOT_PATH'] = process.cwd();
process.env['ENYALIOS_SYSTEM_PATH'] = SYSTEM;
process.chdir(SYSTEM);

for(var i=0; i<loadAtStartup.length; i++) {
	try {
		registry[loadAtStartup[i]] = require('./services/' + loadAtStartup[i]);
	} catch(e) {
		console.error(e);
	}
}

// handle service requests
process.on('message', function(payload) {
	var id = serviceID(payload.uri);
	if(!registry[id]) {
		try {
			registry[id] = require('./services/' + id);
		} catch(e) {
			console.log('ERROR: Service "' + id + '" does not exist');
			process.send({
				key:payload.key,
				errorCode:1,
				errorText:'ERROR: Service "' + id + '" does not exist',
				returnValue:false
			});
		}
	}
	if(payload.cancel) {
		if(registry[id]['endSubscription']) {
			registry[id]['endSubscription'].key = payload.key;
			registry[id]['endSubscription'](payload.key);
		}
		return;
	}

	var method = serviceMethod(registry[id], payload.uri);
	if(method) {
		method.subscribe = payload.subscribe;
		method.key = payload.key;
		// first argument is always the uri's parameters object
		// second is an optional callback; if used, handle asynchronously
		if(method.length>1) {  
			method(payload.params, function(res) {
				process.send(normalizeResponse(res, payload.key, payload.subscribe));
			});
		} else {
			var res = method(payload.params);
			process.send(normalizeResponse(res, payload.key, payload.subscribe));
		}
	} else {
		process.send({
			key:payload.key,
			errorCode:2,
			errorText:'ERROR: Service method for URI ' + payload.uri + ' does not exist',
			returnValue:false
		});
	}
});

// keep service registry alive
setInterval(function() {}, TIMEOUT_MAX);
