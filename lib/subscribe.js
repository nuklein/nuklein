'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = subscribe;

var _immutable = require('immutable');

function schemaFromJS(getStore, props, schema) {
	if (schema && typeof schema === 'function') {
		return (0, _immutable.fromJS)(schema(getStore, props), function (key, value) {
			var isIndexed = _immutable.Iterable.isIndexed(value);
			return isIndexed ? value.toList() : value.toOrderedMap();
		});
	}
	return undefined;
}
function subscribe(params) {
	var store = params.store,
	    schema = params.schema,
	    callback = params.callback,
	    _params$getProps = params.getProps,
	    getProps = _params$getProps === undefined ? function () {
		return undefined;
	} : _params$getProps,
	    component = params.component,
	    server = params.server,
	    before = params.before,
	    after = params.after;


	var componentOrServer = component || server;

	var setStore = store.setStore,
	    originalGetStore = store.getStore;


	var getStore = function getStore(path) {
		return originalGetStore(path, { component: component });
	};

	if (before && typeof before === 'function') {
		var newValue = before(getStore, componentOrServer, getProps(), 'init');
		if (newValue) {
			setStore(newValue, undefined, componentOrServer);
		}
	}

	if (schema && typeof schema === 'function') {
		var stream = store.stream;


		callback(schema(getStore, getProps()));

		if (after && typeof after === 'function') {
			after(getStore, componentOrServer, getProps(), 'init');
		}

		var streamDiff = function streamDiff(prev, next) {
			setTimeout(function () {
				if (!(0, _immutable.is)(prev, next)) {
					if (schema && typeof schema === 'function') {
						callback(schema(getStore, getProps()));
					}

					if (after && typeof after === 'function') {
						after(getStore, componentOrServer, getProps(), 'changeStore');
					}
				}
			}, 0);
			return false;
		};

		var streamOnValue = function streamOnValue() {
			return undefined;
		};

		var localStream = stream.map(function () {
			return schemaFromJS(getStore, getProps(), schema);
		}).diff(streamDiff, schemaFromJS(getStore, getProps(), schema)).onValue(streamOnValue);

		var unsubscribe = function unsubscribe() {
			localStream.offValue(streamOnValue);
			return {
				stream: localStream,
				subscribe: function subscribe() {
					if (before && typeof before === 'function') {
						var _newValue = before(getStore, componentOrServer, getProps(), 'resubscribe');
						if (_newValue) {
							setStore(_newValue, undefined, componentOrServer);
						}
					}
					callback(schema(getStore, getProps()));
					localStream.onValue(streamOnValue);
					if (after && typeof after === 'function') {
						after(getStore, componentOrServer, getProps(), 'resubscribe');
					}
					return {
						stream: localStream,
						unsubscribe: unsubscribe
					};
				}
			};
		};

		return {
			stream: localStream,
			unsubscribe: unsubscribe
		};
	}
	return null;
}