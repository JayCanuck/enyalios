(function() {
	var paramPairs = location.search.substr(1).split("&");
	var getURIParam = function(id) {
		return decodeURIComponent((paramPairs.find(function(arg) { return (arg.indexOf(id+'=')===0); }) || id+'=').substr(id.length+1));
	};

	var ipcRenderer = require('electron').ipcRenderer;
	var pendingRequests = {counter:0};
	ipcRenderer.on('serviceresponse', function(e, res) {
		var pending = pendingRequests[res.key];
		if(pending) {
			res.request = pending.request;
			if(res.errCode!==undefined || res.errText!==undefined || res.returnValue===false) {
				delete res.key;
				delete pendingRequests[res.key];
				pending.reject(res);
			} else {
				if(pending.subscriber!==undefined && !res.completed && !res.returnValue) {
					delete res.key;
					if(pending.subscriber) {
						pending.subscriber(res);
					}
				} else {
					delete res.key;
					delete pendingRequests[res.key];
					pending.resolve(res);
				}
			}
		}
	});
	window.EnyaliOS = {
		appID: function() {
			return getURIParam('appID');
		},
		launchParams: function() {
			return JSON.parse(getURIParam('launchParams')) || {};
		},
		service: {
			request: function(uri, opts) {
				uri = uri.replace('palm://', '').replace('luna://', '');
				if(uri.indexOf('enyalios://')!==0) {
					uri = 'enyalios://' + uri;
				}
				var req = {uri:uri, opts:(opts || {})};
				if(uri[uri.length-1]=='/') {
					uri = uri.substring(0, uri.length-1);
				}
				if(opts.method) {
					uri += '/' + opts.method;
				}
				opts.parameters = opts.parameters || {};

				pendingRequests.counter++;
				var key = 'app-' + pendingRequests.counter + '-' + (new Date()).getTime();

				pendingRequests[key] = {};
				var p = new Promise(function(resolve, reject) {
					pendingRequests[key].resolve = resolve;
					pendingRequests[key].reject = reject;
					pendingRequests[key].request = req;
					var payload = {
						uri: uri,
						params: opts.parameters,
						key: key,
						subscribe: opts.subscribe
					};
					ipcRenderer.sendToHost('servicerequest', payload);
				});
				if(opts.subscribe) {
					pendingRequests[key].subscriber = null;
					p.subscription = function(subscriber) {
						pendingRequests[key].subscriber = subscriber;
						return p;
					};
					p.endSubscription = function() {
						ipcRenderer.sendToHost('servicerequest', {
							key:key,
							uri:uri,
							cancel:true
						});
						return p;
					};
				}
				return p;
			}
		}
	};

})();