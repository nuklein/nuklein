'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

exports.modificator = modificator;
exports.register = register;

var _immutable = require('immutable');

var _store = require('./store');

var _store2 = _interopRequireDefault(_store);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function modificator(store, func, componentOrServer) {
	return function () {
		var info = {
			modificator: func
		};
		if (typeof componentOrServer === 'function') {
			info.component = componentOrServer;
		}
		if (componentOrServer && componentOrServer.name) {
			info.server = componentOrServer;
		}
		var setStore = function setStore(value, path, options) {
			return store.setStore(value, path, options, info);
		};
		func.apply(undefined, arguments)(setStore, store.getStore);
	};
}

function register(store, modificators, componentOrServer) {
	var result = {};

	if (modificators) {
		if (typeof modificators === 'function') {
			result[modificators.name] = modificator(store, modificators, componentOrServer);
		} else if ((typeof modificators === 'undefined' ? 'undefined' : (0, _typeof3.default)(modificators)) === 'object') {
			(0, _immutable.Map)(modificators).forEach(function (v, key) {
				result[key] = modificator(store, v, componentOrServer);
			});
		}
	}
	return result;
}