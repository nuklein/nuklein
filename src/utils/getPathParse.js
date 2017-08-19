// @flow
import { Iterable, List, OrderedMap } from 'immutable';
import Fragment from '../fragment';
import type { GetPath } from '../types/GetPath';

function stringPathParse(path: string, data: Object, info, insPath?: {
	[propName: string]: GetPath;
}, onDataNotFound, onDataNotFoundOne): { value: any; exit: boolean; } {
	let value = data;
	const keys = path.split('.');
	let exit = false;

	if (keys && keys.length > 0) {
		let myArr = keys;
		// надо будет переделать на рекурсию
		keys.forEach((key, i, arr) => {
			if (exit) {
				return false;
			}

			let localValue;

			if (Iterable.isIterable(value) && value.get && typeof value.get === 'function') {
				localValue = value.get(key);
				if (localValue === undefined || localValue === null) {
					localValue = value.toJS()[key];
				}
			} else if (typeof value === 'object') {
				localValue = value[key];
			} else {
				return false;
			}

			if (localValue && localValue instanceof Fragment) {
				let newPath;

				if (myArr.length < 2) {
					newPath = undefined;
				} else if (myArr.length === 2) {
					newPath = arr[1];
				} else {
					myArr = myArr.slice(i + 1);
					newPath = myArr.join('.');
				}

				if (insPath) {
					newPath = {
						...insPath,
						...{
							_path: newPath,
						},
					};
				}

				/*
				надо будет разобраться с тем, что в некоторых случаях _getData еще нет и сделать,
				чтобы это точно работало правильно.
				*/
				if (localValue._getData && typeof localValue._getData === 'function') {
					value = localValue._getData(
						newPath,
						localValue.getDataIn(),
						info,
						true,
						onDataNotFound,
						onDataNotFoundOne
					);
					localValue.getCounter();
				} else {
					localValue.beforeGet();
					value = localValue.getData(
						newPath,
						localValue.getDataIn(),
						info,
						true,
						onDataNotFound,
						onDataNotFoundOne
					);
					localValue.getCounter();
					localValue.afterGet(value);
				}

				exit = true;

				return false;
			}
			value = localValue;
			if (typeof localValue !== 'object') {
				return false;
			}
			return true;
		});
	}

	return {
		value,
		exit,
	};
}

/* eslint-disable no-use-before-define */
function arrayPathParse(
	path: Array<GetPath>,
	data: Object,
	info,
	onDataNotFound?: Function,
	onDataNotFoundOne?: Function,
	originalPath?: GetPath,
	keys?: Array<string|number>,
	nfPath?: GetPath
) {
	let notFoundPath = nfPath;
	return ({
		value: List(path.map((v, k) => {
			const res = getPathParse(
				v,
				data,
				info,
				onDataNotFound,
				onDataNotFoundOne,
				originalPath || path,
				keys ? keys.concat(k) : [k],
				notFoundPath
			);
			notFoundPath = res.notFoundPath || nfPath;
			return res.value;
		})),
		notFoundPath,
	});
}
/* eslint-enable no-use-before-define */

/* eslint-disable no-use-before-define */
function objectPathParse(
	path: {
		_path?: string;
		[propName: string]: GetPath;
	},
	data: Object,
	info,
	onDataNotFound?: Function,
	onDataNotFoundOne?: Function,
	originalPath?: GetPath,
	keys?: Array<string|number>,
	nfPath?: GetPath
) {
	let localData = data;
	let notFoundPath = nfPath;
	const insPath = {...path, ...{ _path: undefined }};
	if (path._path) {
		const strRes = stringPathParse(
			path._path, data, info, insPath, onDataNotFound, onDataNotFoundOne
		);
		localData = strRes.value;
		if (strRes.exit) {
			return { value: localData, notFoundPath };
		}
	}
	let value = OrderedMap();
	Object.keys(path).forEach((key) => {
		if (key !== '_path') {
			const res = getPathParse(
				path[key],
				localData,
				info,
				onDataNotFound,
				onDataNotFoundOne,
				originalPath || path,
				keys ? keys.concat(key) : [key],
				notFoundPath
			);
			const v = res.value;
			notFoundPath = res.notFoundPath || nfPath;
			value = value.set(key, v);
		}
	});

	return { value, notFoundPath };
}
/* eslint-enable no-use-before-define */

export default function getPathParse(
	path: GetPath,
	data: Object,
	info?: Object,
	onDataNotFound?: Function,
	onDataNotFoundOne?: Function,
	originalPath?: GetPath,
	keys?: Array<string|number>,
	notFoundPath?: GetPath
) {
	let value = data;
	let nfPath = notFoundPath;

	if (path === undefined || path === null) {
		return { value: null, notFoundPath: nfPath };
	}

	if (value instanceof Fragment) {
		const localValue = value;
		if (value._getData && typeof localValue._getData === 'function') {
			value = localValue._getData(
				path,
				localValue.getDataIn(),
				info,
				true,
				onDataNotFound,
				onDataNotFoundOne
			);
			localValue.getCounter();
		} else {
			localValue.beforeGet();
			value = localValue.getData(
				path,
				localValue.getDataIn(),
				info,
				true,
				onDataNotFound,
				onDataNotFoundOne
			);
			localValue.getCounter();
			localValue.afterGet(value);
		}
		return { value, notFoundPath: nfPath };
	}

	if (path && typeof path === 'string') {
		value = stringPathParse(path, value, info, undefined, onDataNotFound, onDataNotFoundOne).value;
		if (value === undefined || value === null) {
			if (onDataNotFoundOne) {
				value = onDataNotFoundOne(path, info);
			}

			if (originalPath && (value === undefined || value === null)) {
				if (originalPath instanceof Array && keys && keys[0]) {
					if (!nfPath) {
						nfPath = [];
					}
					nfPath[+keys[0]] = path;
				} else if (typeof originalPath === 'object' && !(originalPath instanceof Array)) {
					if (!nfPath) {
						nfPath = {};
					}
					if (originalPath._path) {
						nfPath._path = originalPath._path;
					}
					if (keys) {
						let localNFPath = nfPath;
						keys.forEach((key, i, arr) => {
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
		const res = arrayPathParse(
			path,
			value,
			info,
			onDataNotFound,
			onDataNotFoundOne,
			originalPath || path,
			keys,
			nfPath
		);
		value = res.value;
		if (res.notFoundPath) {
			nfPath = res.notFoundPath;
		}
	} else if (path && typeof path === 'object') {
		const res = objectPathParse(
			path,
			value,
			info,
			onDataNotFound,
			onDataNotFoundOne,
			originalPath || path,
			keys,
			nfPath
		);
		value = res.value;
		if (res.notFoundPath) {
			nfPath = res.notFoundPath;
		}
	}

	return { value, notFoundPath: nfPath };
}
