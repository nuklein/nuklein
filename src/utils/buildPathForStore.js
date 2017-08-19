// @flow
import { isNumber } from './normolizeSetPath';
import type { GetPath } from '../types/GetPath';

function buildFromString(path: string, initializator?: Object|Array<GetPath>) {
	const keys = path.split('.');
	let res;
	if (initializator) {
		res = initializator;
	} else {
		res = isNumber(keys[0], true) ? [] : {};
	}
	let localRes = res;

	keys.forEach((v, i, arr) => {
		if (i >= arr.length - 1) {
			localRes[v] = path;
		} else if (localRes[v]) {
			localRes = localRes[v];
			return;
		} else if (isNumber(arr[i + 1], true)) {
			localRes[v] = [];
		} else {
			localRes[v] = {};
		}
		localRes = localRes[v];
	});
	return res;
}

function buildFromArray(path: Array<GetPath>, initializator?: Object|Array<GetPath>, beforePath?: string) {
	let res = initializator;
	path.forEach(v => {
		res = buildPathForStore(v, res, beforePath);
	});
	return res;
}

function buildFromObject(path: {
	_path?: string;
	[prop: string]: GetPath;
}, initializator?: Object|Array<GetPath>) {
	let res = initializator;

	Object.keys(path).forEach(key => {
		if (key !== '_path') {
			let localPath = path[key];
			if (path._path) {
				if (typeof path[key] === 'string' || typeof path[key] === 'number') {
					localPath = `${path._path}.${path[key]}`;
				} else if (path[key] instanceof Array) {
					localPath = path[key].map(v => `${path._path}.${v}`);
				} else if (path[key]._path) {
					localPath = { ...path[key], _path: `${path._path}.${path[key]._path}` };
				} else {
					localPath = { ...path[key], _path: path._path };
				}
			}
			res = buildPathForStore(localPath, res);
		}
	});
	return res;
}

export default function buildPathForStore(path: GetPath, initializator?: Object|Array<GetPath>) {
	if (typeof path === 'string') {
		return buildFromString(path, initializator);
	} else if (typeof path === 'number') {
		return buildFromString(`${path}`, initializator);
	} else if (path instanceof Array) {
		return buildFromArray(path, initializator);
	}
	return buildFromObject(path, initializator);
}
