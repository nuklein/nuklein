'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

exports.default = forEachDeep;

var _immutable = require('immutable');

var _fragment = require('../fragment');

var _fragment2 = _interopRequireDefault(_fragment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function myForEach(data, cb, keys, localKeys) {
	var localData = localKeys.length > 0 ? data.getIn(localKeys) : data;

	if (localData) {
		if (localData instanceof _fragment2.default) {
			cb(localData, keys);
			myForEach(localData.data, cb, keys, []);
			return;
		}

		localData.forEach(function (v, key) {
			if (v instanceof _fragment2.default) {
				cb(v, keys.concat(key));
				myForEach(v.data, cb, keys.concat(key), []);
				return;
			}

			if ((typeof v === 'undefined' ? 'undefined' : (0, _typeof3.default)(v)) === 'object') {
				myForEach(data, cb, keys.concat(key), localKeys.concat('' + key));
			}

			return;
		});
	}
}

function forEachDeep(data, cb) {
	myForEach(data, cb, [], []);
}