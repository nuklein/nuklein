/* @flow */
/* eslint-disable no-underscore-dangle */
import { is, fromJS, Iterable, OrderedMap, List, Map as IMap } from 'immutable';

const NOT_SET = {};
const KeyedIterable = Iterable.Keyed;

function mergeIntoCollectionWith(
	collection,
	merger,
	itersArg,
	path
) : OrderedMap<*, *>|List<*>|IMap<*, *> {
	const iters = itersArg.filter(x => x.size !== 0);
	if (iters.length === 0) {
		return collection;
	}
	if (collection.size === 0 && !collection.__ownerID && iters.length === 1) {
		return collection.constructor(iters[0]) || OrderedMap();
	}
	return collection.withMutations(localCollection => {
		const mergeIntoMap = merger ?
		(value, key) => {
			localCollection.update(key, NOT_SET, existing =>
				(is(existing, NOT_SET) ? value : merger(existing, value, key, path || []))
			);
		} :
		(value, key) => {
			localCollection.set(key, value);
		};
		iters.forEach(iter => {
			iter.forEach(mergeIntoMap);
		});
	});
}


function mergeIntoListWith(listArg, merger, iterables, path) : List<*>|IMap<*, *> {
	let list = listArg;
	let maxSize = 0;
	const iters = Array.from(iterables).map(value => {
		let iter = Iterable.Indexed(value);
		if (iter.size > maxSize) {
			maxSize = iter.size;
		}
		if (!Iterable.isIterable(value)) {
			iter = iter.map(v => fromJS(v));
		}
		return iter;
	});
	if (maxSize > list.size && list.setSize && typeof list.setSize === 'function') {
		list = list.setSize(maxSize);
	}
	return mergeIntoCollectionWith(list, merger, iters, path);
}

function mergeIntoMapWith(map, merger, iterables, path) {
	const iters = Array.from(iterables).map(value => {
		let iter = KeyedIterable(value);
		if (!Iterable.isIterable(value)) {
			iter = iter.map(v => fromJS(v));
		}
		return iter;
	});
	return mergeIntoCollectionWith(map, merger, iters, path);
}

/* eslint-disable no-use-before-define */
function mergeDeepWithPath(path, collection, merger, ...iters) {
	if (List.isList(collection)) {
		return mergeIntoListWith(collection, deepMergerWith(merger), iters, path);
	}
	return mergeIntoMapWith(collection, deepMergerWith(merger), iters, path);
}
/* eslint-enable no-use-before-define */

function deepMergerWith(merger, path) {
	return (existing, value, key) => {
		if (existing && existing.mergeDeepWith && Iterable.isIterable(value)) {
			return mergeDeepWithPath(path ? path.concat(key) : [key], existing, merger, value);
		}
		const nextValue = merger(existing, value, key, path || []);
		return is(existing, nextValue) ? existing : nextValue;
	};
}

export default function mergeDeepWith(
	collection: OrderedMap<*, *>|List<*>|IMap<*, *>,
	merger: Function,
	...iters: Array<OrderedMap<*, *>|List<*>|IMap<*, *>>
) : OrderedMap<*, *>|List<*>|IMap<*, *> {
	if (List.isList(collection)) {
		return mergeIntoListWith(collection, deepMergerWith(merger), iters);
	}
	return mergeIntoMapWith(collection, deepMergerWith(merger), iters);
}
