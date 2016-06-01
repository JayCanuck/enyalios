var
	Component = require('enyo/Component'),
	cp = window.require('child_process');

var SERVICE_REGISTRY = '@../../system/service-registry.js';
var pending = {counter:0};
var noop = function() {};

module.exports = Component.kind({	
	name:'ServiceInterface',
	create: function() {
		this.inherited(arguments);
		this.start();
	},
	start: function() {
		this.serviceRegistry = cp.fork(SERVICE_REGISTRY, {}, {
			cwd:process.cwd(),
			env:process.env
		});
		this.serviceRegistry.on('message', function(res) {
			var p = pending[res.key];
			if(p && p.callback) {
				p.callback(res);
				if(p.subscribe && !res.completed && res.errCode===undefined && res.errText===undefined && res.returnValue===undefined) {
					delete pending[res.key];
				}
			}
		});
	},
	request: function(payload) {
		pending.counter++;
		payload.key = payload.key || 'system-' + pending.counter + '-' + (new Date()).getTime();
		payload.params = payload.params || {};
		payload.callback = payload.callback || noop;
		pending[payload.key] = payload;
		this.serviceRegistry.send(payload);
		return {
			cancel: this.bindSafely(function() {
				this.serviceRegistrysend({
					key:payload.key,
					uri:payload.uri,
					cancel:true
				});
				payload.subscribe = false;
				payload.callback = noop;
				delete pending[payload.key];
			})
		};
	}
});
