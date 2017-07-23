'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.initialize = initialize;
exports.initializeFor = initializeFor;

var _immutable = require('immutable');

var _fragment = require('../fragment');

var _fragment2 = _interopRequireDefault(_fragment);

var _forEachDeep = require('./forEachDeep');

var _forEachDeep2 = _interopRequireDefault(_forEachDeep);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function initialize(fragment, path, setStore, getStore) {
	if (!fragment.initialize) {
		fragment.dispatchFragment(path, setStore, getStore);
	}
}
function initializeFor(data, setStore, getStore) {
	(0, _forEachDeep2.default)(data, function (fragm, keys) {
		if (!fragm.initialize) {
			initialize(fragm, keys, setStore, getStore);
		}
	});
}