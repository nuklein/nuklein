'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = mergeDataToPath;
function mergeDataToPath(data, path) {
	if (typeof path === 'string') {
		var _result = {};
		var localResult = _result;
		var keys = path.split('.');
		keys.forEach(function (key, i) {
			if (i === keys.length - 1) {
				localResult[key] = data;
			} else {
				localResult[key] = {};
				localResult = localResult[key];
			}
		});
		return _result;
	} else if (path instanceof Array && data instanceof Array) {
		return data;
	}
	var result = {};
	Object.keys(path).forEach(function (key) {
		if (key !== '_path') {
			var pathKey = path[key];
			if (typeof pathKey === 'string') {
				var _keys = pathKey.split('.');
				if (_keys.length < 2) {
					result[pathKey] = data[key];
				} else {
					result[_keys[0]] = mergeDataToPath(data[key], _keys.slice(1).join('.'));
				}
			} else {
				result = data[key];
			}
		}
	});
	if (path._path) {
		result = mergeDataToPath(result, path._path);
	}
	return result;
}