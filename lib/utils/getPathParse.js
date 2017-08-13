'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

var _typeof2 = require('babel-runtime/helpers/typeof');

var _typeof3 = _interopRequireDefault(_typeof2);

exports.default = getPathParse;

var _immutable = require('immutable');

var _fragment = require('../fragment');

var _fragment2 = _interopRequireDefault(_fragment);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function stringPathParse(path, data, insPath, onDataNotFound, onDataNotFoundOne) {
	var value = data;
	var keys = path.split('.');
	var exit = false;

	if (keys && keys.length > 0) {
		var myArr = keys;
		// надо будет переделать на рекурсию
		keys.forEach(function (key, i, arr) {
			if (exit) {
				return false;
			}

			var localValue = void 0;

			if (_immutable.Iterable.isIterable(value) && value.get && typeof value.get === 'function') {
				localValue = value.get(key);
				if (localValue === undefined || localValue === null) {
					localValue = value.toJS()[key];
				}
			} else if ((typeof value === 'undefined' ? 'undefined' : (0, _typeof3.default)(value)) === 'object') {
				localValue = value[key];
			} else {
				return false;
			}

			if (localValue && localValue instanceof _fragment2.default) {
				var newPath = void 0;

				if (myArr.length < 2) {
					newPath = undefined;
				} else if (myArr.length === 2) {
					newPath = arr[1];
				} else {
					myArr = myArr.slice(i + 1);
					newPath = myArr.join('.');
				}

				if (insPath) {
					newPath = (0, _extends3.default)({}, insPath, {
						_path: newPath
					});
				}

				/*
    надо будет разобраться с тем, что в некоторых случаях _getData еще нет и сделать,
    чтобы это точно работало правильно.
    */
				if (localValue._getData && typeof localValue._getData === 'function') {
					value = localValue._getData(newPath, localValue.getDataIn(), true, onDataNotFound, onDataNotFoundOne);
					localValue.getCounter();
				} else {
					localValue.beforeGet();
					value = localValue.getData(newPath, localValue.getDataIn(), true, onDataNotFound, onDataNotFoundOne);
					localValue.getCounter();
					localValue.afterGet(value);
				}

				exit = true;

				return false;
			}
			value = localValue;
			if ((typeof localValue === 'undefined' ? 'undefined' : (0, _typeof3.default)(localValue)) !== 'object') {
				return false;
			}
			return true;
		});
	}

	return {
		value: value,
		exit: exit
	};
}

/* eslint-disable no-use-before-define */
function arrayPathParse(path, data, onDataNotFound, onDataNotFoundOne, originalPath, keys, nfPath) {
	var notFoundPath = nfPath;
	return {
		value: (0, _immutable.List)(path.map(function (v, k) {
			var res = getPathParse(v, data, onDataNotFound, onDataNotFoundOne, originalPath || path, keys ? keys.concat(k) : [k], notFoundPath);
			notFoundPath = res.notFoundPath || nfPath;
			return res.value;
		})),
		notFoundPath: notFoundPath
	};
}
/* eslint-enable no-use-before-define */

/* eslint-disable no-use-before-define */
function objectPathParse(path, data, onDataNotFound, onDataNotFoundOne, originalPath, keys, nfPath) {
	var localData = data;
	var notFoundPath = nfPath;
	var insPath = (0, _extends3.default)({}, path, { _path: undefined });
	if (path._path) {
		var strRes = stringPathParse(path._path, data, insPath, onDataNotFound, onDataNotFoundOne);
		localData = strRes.value;
		if (strRes.exit) {
			return { value: localData, notFoundPath: notFoundPath };
		}
	}
	var value = (0, _immutable.OrderedMap)();
	Object.keys(path).forEach(function (key) {
		if (key !== '_path') {
			var res = getPathParse(path[key], localData, onDataNotFound, onDataNotFoundOne, originalPath || path, keys ? keys.concat(key) : [key], notFoundPath);
			var v = res.value;
			notFoundPath = res.notFoundPath || nfPath;
			value = value.set(key, v);
		}
	});

	return { value: value, notFoundPath: notFoundPath };
}
/* eslint-enable no-use-before-define */

function getPathParse(path, data, onDataNotFound, onDataNotFoundOne, originalPath, keys, notFoundPath) {
	var value = data;
	var nfPath = notFoundPath;

	if (path === undefined || path === null) {
		return { value: null, notFoundPath: nfPath };
	}

	if (value instanceof _fragment2.default) {
		var localValue = value;
		if (value._getData && typeof localValue._getData === 'function') {
			value = localValue._getData(path, localValue.getDataIn(), true, onDataNotFound, onDataNotFoundOne);
			localValue.getCounter();
		} else {
			localValue.beforeGet();
			value = localValue.getData(path, localValue.getDataIn(), true, onDataNotFound, onDataNotFoundOne);
			localValue.getCounter();
			localValue.afterGet(value);
		}
		return { value: value, notFoundPath: nfPath };
	}

	if (path && typeof path === 'string') {
		value = stringPathParse(path, value, undefined, onDataNotFound, onDataNotFoundOne).value;
		if (value === undefined || value === null) {
			if (onDataNotFoundOne) {
				value = onDataNotFoundOne(path);
			}

			if (originalPath && (value === undefined || value === null)) {
				if (originalPath instanceof Array && keys && keys[0]) {
					if (!nfPath) {
						nfPath = [];
					}
					nfPath[+keys[0]] = path;
				} else if ((typeof originalPath === 'undefined' ? 'undefined' : (0, _typeof3.default)(originalPath)) === 'object' && !(originalPath instanceof Array)) {
					if (!nfPath) {
						nfPath = {};
					}
					if (originalPath._path) {
						nfPath._path = originalPath._path;
					}
					if (keys) {
						var localNFPath = nfPath;
						keys.forEach(function (key, i, arr) {
							if (i === arr.length - 1) {
								localNFPath[path] = path;
								return;
							}
							if (typeof arr[i + 1] === 'string') {
								if (!localNFPath[key]) {
									localNFPath[key] = {};
								}
								localNFPath = localNFPath[key];
							}
							if (typeof arr[i + 1] === 'number') {
								if (!localNFPath[key]) {
									localNFPath[key] = [];
								}
								localNFPath = localNFPath[key];
							}
						});
					}
				}
			}
		}
	}

	if (path && path instanceof Array) {
		var res = arrayPathParse(path, value, onDataNotFound, onDataNotFoundOne, originalPath || path, keys, nfPath);
		value = res.value;
		if (res.notFoundPath) {
			nfPath = res.notFoundPath;
		}
	} else if (path && (typeof path === 'undefined' ? 'undefined' : (0, _typeof3.default)(path)) === 'object') {
		var _res = objectPathParse(path, value, onDataNotFound, onDataNotFoundOne, originalPath || path, keys, nfPath);
		value = _res.value;
		if (_res.notFoundPath) {
			nfPath = _res.notFoundPath;
		}
	}

	return { value: value, notFoundPath: nfPath };
}