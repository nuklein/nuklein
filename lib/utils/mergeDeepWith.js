'use strict';

Object.defineProperty(exports, "__esModule", {
	value: true
});
exports.default = mergeDeepWith;

var _immutable = require('immutable');

var NOT_SET = {};
/* eslint-disable no-underscore-dangle */

var KeyedIterable = _immutable.Iterable.Keyed;

function mergeIntoCollectionWith(collection, merger, itersArg, path) {
	var iters = itersArg.filter(function (x) {
		return x.size !== 0;
	});
	if (iters.length === 0) {
		return collection;
	}
	if (collection.size === 0 && !collection.__ownerID && iters.length === 1) {
		return collection.constructor(iters[0]) || (0, _immutable.OrderedMap)();
	}
	return collection.withMutations(function (localCollection) {
		var mergeIntoMap = merger ? function (value, key) {
			localCollection.update(key, NOT_SET, function (existing) {
				return (0, _immutable.is)(existing, NOT_SET) ? value : merger(existing, value, key, path || []);
			});
		} : function (value, key) {
			localCollection.set(key, value);
		};
		iters.forEach(function (iter) {
			iter.forEach(mergeIntoMap);
		});
	});
}

function mergeIntoListWith(listArg, merger, iterables, path) {
	var list = listArg;
	var maxSize = 0;
	var iters = Array.from(iterables).map(function (value) {
		var iter = _immutable.Iterable.Indexed(value);
		if (iter.size > maxSize) {
			maxSize = iter.size;
		}
		if (!_immutable.Iterable.isIterable(value)) {
			iter = iter.map(function (v) {
				return (0, _immutable.fromJS)(v);
			});
		}
		return iter;
	});
	if (maxSize > list.size && list.setSize && typeof list.setSize === 'function') {
		list = list.setSize(maxSize);
	}
	return mergeIntoCollectionWith(list, merger, iters, path);
}

function mergeIntoMapWith(map, merger, iterables, path) {
	var iters = Array.from(iterables).map(function (value) {
		var iter = KeyedIterable(value);
		if (!_immutable.Iterable.isIterable(value)) {
			iter = iter.map(function (v) {
				return (0, _immutable.fromJS)(v);
			});
		}
		return iter;
	});
	return mergeIntoCollectionWith(map, merger, iters, path);
}

/* eslint-disable no-use-before-define */
function mergeDeepWithPath(path, collection, merger) {
	for (var _len = arguments.length, iters = Array(_len > 3 ? _len - 3 : 0), _key = 3; _key < _len; _key++) {
		iters[_key - 3] = arguments[_key];
	}

	if (_immutable.List.isList(collection)) {
		return mergeIntoListWith(collection, deepMergerWith(merger), iters, path);
	}
	return mergeIntoMapWith(collection, deepMergerWith(merger), iters, path);
}
/* eslint-enable no-use-before-define */

function deepMergerWith(merger, path) {
	return function (existing, value, key) {
		if (existing && existing.mergeDeepWith && _immutable.Iterable.isIterable(value)) {
			return mergeDeepWithPath(path ? path.concat(key) : [key], existing, merger, value);
		}
		var nextValue = merger(existing, value, key, path || []);
		return (0, _immutable.is)(existing, nextValue) ? existing : nextValue;
	};
}

function mergeDeepWith(collection, merger) {
	for (var _len2 = arguments.length, iters = Array(_len2 > 2 ? _len2 - 2 : 0), _key2 = 2; _key2 < _len2; _key2++) {
		iters[_key2 - 2] = arguments[_key2];
	}

	if (_immutable.List.isList(collection)) {
		return mergeIntoListWith(collection, deepMergerWith(merger), iters);
	}
	return mergeIntoMapWith(collection, deepMergerWith(merger), iters);
}