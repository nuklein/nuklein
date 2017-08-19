'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});

var _extends2 = require('babel-runtime/helpers/extends');

var _extends3 = _interopRequireDefault(_extends2);

exports.default = buildPathForStore;

var _normolizeSetPath = require('./normolizeSetPath');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function buildFromString(path, initializator) {
	var keys = path.split('.');
	var res = void 0;
	if (initializator) {
		res = initializator;
	} else {
		res = (0, _normolizeSetPath.isNumber)(keys[0], true) ? [] : {};
	}
	var localRes = res;

	keys.forEach(function (v, i, arr) {
		if (i >= arr.length - 1) {
			localRes[v] = path;
		} else if (localRes[v]) {
			localRes = localRes[v];
			return;
		} else if ((0, _normolizeSetPath.isNumber)(arr[i + 1], true)) {
			localRes[v] = [];
		} else {
			localRes[v] = {};
		}
		localRes = localRes[v];
	});
	return res;
}


function buildFromArray(path, initializator, beforePath) {
	var res = initializator;
	path.forEach(function (v) {
		res = buildPathForStore(v, res, beforePath);
	});
	return res;
}

function buildFromObject(path, initializator) {
	var res = initializator;

	Object.keys(path).forEach(function (key) {
		if (key !== '_path') {
			var localPath = path[key];
			if (path._path) {
				if (typeof path[key] === 'string' || typeof path[key] === 'number') {
					localPath = path._path + '.' + path[key];
				} else if (path[key] instanceof Array) {
					localPath = path[key].map(function (v) {
						return path._path + '.' + v;
					});
				} else if (path[key]._path) {
					localPath = (0, _extends3.default)({}, path[key], { _path: path._path + '.' + path[key]._path });
				} else {
					localPath = (0, _extends3.default)({}, path[key], { _path: path._path });
				}
			}
			res = buildPathForStore(localPath, res);
		}
	});
	return res;
}

function buildPathForStore(path, initializator) {
	if (typeof path === 'string') {
		return buildFromString(path, initializator);
	} else if (typeof path === 'number') {
		return buildFromString('' + path, initializator);
	} else if (path instanceof Array) {
		return buildFromArray(path, initializator);
	}
	return buildFromObject(path, initializator);
}