'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = buildObject;

var _normolizeSetPath = require('./normolizeSetPath');

function buildObject(array, stringToNumber, value) {
	var localValue = void 0;
	if ((0, _normolizeSetPath.isNumber)(array[0], stringToNumber)) {
		localValue = [];
	} else {
		localValue = {};
	}
	var localPath = localValue;
	array.forEach(function (propName, key, arr) {
		var localPropName = (0, _normolizeSetPath.toMaybeNumber)(propName, stringToNumber);
		if ((0, _normolizeSetPath.isNumber)(arr[key + 1], stringToNumber)) {
			localPath[localPropName] = [];
		} else {
			localPath[localPropName] = {};
		}
		if (key === arr.length - 1) {
			localPath[localPropName] = value;
		}
		localPath = localPath[localPropName];
	});
	return localValue;
}