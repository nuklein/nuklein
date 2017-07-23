// @flow
import { Map as IMap, Iterable, List, OrderedMap, fromJS } from 'immutable';

import Kefir from 'kefir';
import autobind from 'autobind-decorator';
import EventEmitter from 'events';
import Fragment from './fragment';
import normolizeSetPath from './utils/normolizeSetPath';
import getPathParse from './utils/getPathParse';
import mergeDeepWith from './utils/mergeDeepWith';
import { initializeFor, initialize } from './utils/initialize';
import type { GetPath } from './types/GetPath';

let isNode = false;
if (typeof process === 'object') {
	if (typeof process.versions === 'object') {
		if (typeof process.versions.node !== 'undefined') {
			isNode = true;
		}
	}
}

export default class Store {
	/* eslint-disable react/sort-comp */
	data: IMap<*, *>|OrderedMap<*, *>|List<*>;
	props: Object;
	emitter: Object;
	stream: Kefir.stream<Function, any>;
	newFragm: boolean;
	mergeDeepWith: Function;
	normalizeData: Object|Array<*>;
	getCount: number;
	specificGetCount: number;
	emptyPath: false|any;
	dataForPaths: Map<GetPath, *>;

	constructor(props?: Object) {
		const localProps = this.beforeInit(props || {}) || {};
		this.props = localProps;

		const initialData = this.init(localProps);
		this.data = fromJS(initialData, (key, value) => {
			const isIndexed = Iterable.isIndexed(value);
			return isIndexed ? value.toList() : value.toOrderedMap();
		});

		this.normalizeData = this.getDataIn()();
		this.emptyPath = false;
		this.dataForPaths = new Map();

		this.getCount = 0;
		this.specificGetCount = 0;

		if (isNode) {
			class MyEmitter extends EventEmitter {}
			this.emitter = new MyEmitter();
			this.stream = Kefir.fromEvents(this.emitter, 'event')
			.onValue((params) => this.setData(...params).getStore());
		} else {
			this.emitter = {};
			const emitPromise = new Promise(resolve => {
				this.stream = Kefir.stream(emitter => {
					this.emitter = emitter;
					resolve();
				})
				.map((params) => this.setData(...params).getStore());
			});
			this.emitter.emit = (params) => {
				emitPromise.then(() => {
					this.emitter.emit(params);
				});
			};
		}

		initializeFor(this.data, this.setStore, this.getStore);
		this.afterInit(localProps, this.setStore, this.getStore);
	}
	/* eslint-enable react/sort-comp */

	/* eslint-disable no-unused-vars */
	beforeInit(props: Object) {
		return props;
	}
	/* eslint-enable no-unused-vars */

	/* eslint-disable no-unused-vars */
	afterInit(props: Object, setStore: Function) {
		return;
	}
	/* eslint-enable no-unused-vars */

	getCounter(isSpecific?: boolean) {
		this.getCount++;
		if (isSpecific) {
			this.specificGetCount++;
		}
	}

	@autobind
	getDataIn(store?: Object|Array<*>|Store|Fragment) {
		return (path?: GetPath) => {
			let localData = this.data;
			if (store) {
				if (store instanceof Store || store instanceof Fragment) {
					localData = store.data;
				} else {
					localData = fromJS(store, (key, value) => {
						const isIndexed = Iterable.isIndexed(value);
						return isIndexed ? value.toList() : value.toOrderedMap();
					});
				}
			}

			let value = localData;
			if (path) {
				value = getPathParse(path, value).value;

				if (typeof value !== 'object') {
					// @TODO собирание не найденных значений, а потом вызов onDataNotFoundAll()
					return value;
				}
				if (Iterable.isIterable(value)) {
					value = value.toJS();
				}
				return value;
			}

			if (value instanceof Fragment) {
				/*
				надо будет разобраться с тем, что в некоторых случаях _getData еще нет и сделать,
				чтобы это точно работало правильно.
				*/
				let result;
				if (value._getData && typeof value._getData === 'function') {
					result = value._getData(undefined, value.getDataIn());
					value.getCounter();
				} else {
					value.beforeGet();
					result = value.getData(undefined, value.getDataIn());
					value.getCounter();
					value.afterGet(result);
				}
				return result;
			}

			if (value && value.mergeDeepWith && typeof value.mergeDeepWith === 'function') {
				value = value.mergeDeepWith((v) => {
					if (v && v instanceof Fragment) {
						/*
						надо будет разобраться с тем, что в некоторых случаях _getData еще нет и сделать,
						чтобы это точно работало правильно.
						*/
						let result;
						if (v._getData && typeof v._getData === 'function') {
							result = v._getData(undefined, v.getDataIn());
							v.getCounter();
						} else {
							v.beforeGet();
							result = v.getData(undefined, v.getDataIn());
							v.getCounter();
							v.afterGet(result);
						}
						return result;
					}
					return v;
				}, value);

				value = value.toJS();
			}

			return value;
		};
	}

	@autobind
	getData(path?: GetPath) {
		return this.getDataIn()(path);
	}

	beforeGet(path?: GetPath) {
		return path;
	}

	@autobind
	getStore(path?: GetPath) {
		if (!path) {
			if (this.emptyPath === false) {
				this.emptyPath = this.beforeGet();
			}
			const result = this.normalizeData;
			this.getCounter(false);
			this.afterGet(result, this.emptyPath, false);
			return result;
		}
		const newPath = this.beforeGet(path);
		let result;
		let specific = false;
		if (!newPath) {
			result = this.normalizeData;
		} else {
			specific = true;
			if (this.dataForPaths.has(newPath)) {
				result = this.dataForPaths.get(newPath);
			} else {
				result = this.getData(newPath);
				this.dataForPaths.set(newPath, result);
			}
		}
		this.getCounter(specific);
		this.afterGet(result, newPath, specific);
		return result;
	}

	/* eslint-disable no-unused-vars */
	afterGet(result?: Object|Array<*>, path?: GetPath, specific: boolean) {
		return;
	}
	/* eslint-enable no-unused-vars */

	/* eslint-disable no-unused-vars */
	beforeSet(
		value: Object|Array<*>,
		path: string|number|Array<string|number>,
		data?: Object|Array<*>,
		options: any,
		info?: Object
	) {
		return { value, path };
	}
	/* eslint-enable no-unused-vars */

	_mergeValue(
		data: IMap<*, *>|List<*>|Object,
		value: IMap<*, *>|List<*>,
		path: ?Array<string|number>,
		options?: any,
		info?: Object,
		notInitFragms: Array<*>
	) {
		let nif = notInitFragms;
		let localData;
		if (options && (options === 'replace' || options.method === 'replace')) {
			localData = value;
		} else {
			localData = mergeDeepWith(data, (prev, next, key, localPath) => {
				let niPath = localPath.concat(key);
				if (this.path) {
					niPath = this.path.concat(niPath);
				}
				let myPath;
				if (path) {
					myPath = path.slice(localPath.concat(key).length);
				}
				if (prev && prev instanceof Fragment) {
					let localNext = next;

					if (next instanceof Fragment) {
						localNext = next.data;
					}

					let result;
					if (!localNext) {
						result = prev;
					} else {
						result = prev._setData(
							localNext.toJS(),
							myPath,
							options,
							info,
							(fr) => {
								nif = nif.concat(fr);
							}
						);
					}

					return fromJS(result, (_key, val) => {
						const isIndexed = Iterable.isIndexed(val);
						return isIndexed ? val.toList() : val.toOrderedMap();
					});
				}

				/*
				надо попробовать переписать так, чтобы сразу выполнялась инциализация,
				*/
				if (next instanceof Fragment && !next.initialize) {
					nif.push([next, niPath]);
				}

				if (next !== undefined && next !== null) {
					return next;
				}
				return prev;
			}, value);
		}
		return { data: localData, notInitFragms: nif };
	}

	@autobind
	mergeData(
		value: Object|Array<*>,
		path: string|number|Array<string|number>,
		options?: any,
		info?: Object
	): OrderedMap<*, *>|List<*>|IMap<*, *> {
		let normPath = [];
		if (path) {
			normPath = normolizeSetPath(path, true);
		}

		let notInitFragms = [];
		let localData;

		if (this.data instanceof Fragment) {
			localData = this.data._setData(
							value,
							path,
							options,
							info,
							(fr) => {
								notInitFragms = notInitFragms.concat(fr);
							}
						);
		} else if (path) {
			let ld = this.data;
			const immMap = [];
			const keys = [];
			let index = 0;
			normPath.forEach((key, i) => {
				if (Iterable.isIterable(ld)) {
					ld = ld.get(key);
					immMap.unshift([ld, key]);
					keys.push(`${key}`);
					index = i;
					return true;
				}
				return false;
			});
			if (immMap.length) {
				if (Iterable.isIterable(immMap[0][0])) {
					const result = this._mergeValue(
						immMap[0][0],
						value,
						index > 0 ? normPath.slice(index - 1) : normPath.slice(1),
						options,
						info,
						notInitFragms
					);
					localData = this.data.setIn(keys.slice(-1), result.data);
					notInitFragms = notInitFragms.concat(result.notInitFragms);
				} else if (immMap[0][0] instanceof Fragment) {
					const newPath = index > 0 ? normPath.slice(index - 1) : normPath.slice(1);
					const result = immMap[0][0]._setData(
						value,
						newPath,
						options,
						info,
						(fr) => {
							notInitFragms = notInitFragms.concat(fr);
						}
					);
					notInitFragms.push([immMap[0][0], newPath]);
					if (keys.length > 1) {
						localData = this.data.setIn(keys, result);
					} else {
						localData = this.data.set(keys[0], result);
					}
				} else {
					if (value instanceof Fragment) {
						notInitFragms.push([value, keys]);
					}
					if (keys.length > 1) {
						localData = this.data.setIn(keys, value);
					} else {
						localData = this.data.set(keys[0], value);
					}
				}
			} else if (typeof value === 'object') {
				const result = this._mergeValue(
					this.data,
					value,
					normPath,
					options,
					info,
					notInitFragms
				);
				localData = result.data;
				notInitFragms = notInitFragms.concat(result.notInitFragms);
			} else {
				if (value instanceof Fragment) {
					notInitFragms.push([value, []]);
				}
				localData = value;
			}
		} else if (typeof value === 'object') {
			const result = this._mergeValue(
				this.data,
				value,
				normPath,
				options,
				info,
				notInitFragms
			);
			localData = result.data;
			notInitFragms = notInitFragms.concat(result.notInitFragms);
		} else {
			localData = value;
		}

		if (notInitFragms.length > 0) {
			notInitFragms.forEach((v) => {
				initialize(v[0], v[1], this.setStore, this.getStore);
			});
		}

		if (
			localData instanceof Fragment
			|| List.isList(localData)
			|| OrderedMap.isOrderedMap(localData)
		) {
			return localData;
		}

		if (Iterable.isIndexed(localData)) {
			return localData.toList();
		}
		return localData.toOrderedMap();
	}

	@autobind
	setData(
		value: Object|Array<*>,
		path: string|number|Array<string|number>,
		options?: any,
		info?: Object
	): Store {
		const { value: myValue = value, path: myPath = path } = this.beforeSet(
			value,
			path,
			this.getStore(),
			options,
			info
		);

		const prevData = this.getStore();

		// надо будет добавить пользовательские setData
		this.data = this.mergeData(myValue, myPath, options, info);

		this.normalizeData = this.getDataIn()();
		this.dataForPaths = new Map();

		setTimeout(() => {
			this.afterSet(myValue, myPath, prevData, this.normalizeData, options, info);
		}, 0);

		return this;
	}

	@autobind
	setStore(
		value: Object|Array<*>,
		path?: string|number|Array<string|number>,
		options?: any,
		info?: Object
	) {
		if (isNode) {
			this.emitter.emit('event', [value, path, options, info]);
		} else {
			this.emitter.emit([value, path, options, info]);
		}
	}

	/* eslint-disable no-unused-vars */
	afterSet(
		value: Object|Array<*>,
		path: string|number|Array<string|number>,
		prevData?: Object|Array<*>,
		data?: Object|Array<*>,
		options?: any,
		info?: Object
	) {
		return;
	}
	/* eslint-enable no-unused-vars */

	init() {
		return {};
	}
}
