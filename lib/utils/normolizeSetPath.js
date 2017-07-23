'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.isNumber = isNumber;
exports.toMaybeNumber = toMaybeNumber;
exports.toStr = toStr;
exports.default = normolizeSetPath;
function isNumber(v, stringToNumber) {
	if (stringToNumber) {
		return !isNaN(Number(v));
	}
	return typeof v === 'number';
}

function toMaybeNumber(v, stringToNumber) {
	if (!stringToNumber) {
		return v;
	}
	return isNumber(v, stringToNumber) ? Number(v) : v;
}

function toStr(v) {
	return typeof v === 'number' ? '' + v : v;
}

function normolizeSetPath(path, forImmutable) {
	switch (true) {
		case typeof path === 'number':
			return [forImmutable ? toStr(path) : path];
		case typeof path === 'string':
			return path.split('.').map(function (v) {
				return forImmutable ? toStr(v) : v;
			});
		case path instanceof Array:
			return forImmutable ? path.map(function (v) {
				return forImmutable ? toStr(v) : v;
			}) : path;
		default:
			return [];
	}
}