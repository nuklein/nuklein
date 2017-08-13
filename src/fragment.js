// @flow
import autobind from 'autobind-decorator';
import isEqual from 'lodash.isequal';
import { fromJS, Iterable, OrderedMap, List, Map as IMap } from 'immutable';
import Store from './store';
import getPathParse from './utils/getPathParse';
import mergeDeepWith from './utils/mergeDeepWith';
import forEachDeep from './utils/forEachDeep';
import type { GetPath } from './types/GetPath';

export default class Fragment {
	/* eslint-disable react/sort-comp */
	data: any;
	props: Object;
	initialize: boolean;
	getCount: number;
	specificGetCount: number;
	userSetData: ?(
		value: Object|Array<*>,
		path?: Array<string|number>,
		component?: Function,
		modificator?: Function
	) => Object|Array<*>;
	path: ?Array < string | number >;
	mergeData: ?Function;
	normalizeData: ?Object|Array<*>;
	setData: ?Function;
	emptyPath: false|any;
	dataForPaths: Map<GetPath, *>;
	dataNotFoundPaths: Array<GetPath>;
	original: {
		getData: Function;
		setData: Function;
	};

	constructor(props?: Object) {
		const localProps = this.beforeInit(props || {}) || {};
		this.props = localProps;

		const initialData = this.init(localProps);
		this.data = fromJS(initialData, (key, value) => {
			const isIndexed = Iterable.isIndexed(value);
			return isIndexed ? value.toList() : value.toOrderedMap();
		});


		this.initialize = false;
		this.getCount = 0;
		this.specificGetCount = 0;
		this.userSetData = null;
		this.path = null;
		this.mergeData = null;
		this.emptyPath = false;
		this.dataForPaths = new Map();
		this.dataNotFoundPaths = [];

		this.normalizeData = null;

		this.original = {
			setData: (...args) => {
				const newData = this._mergeData(...args);

				this.data = newData;

				this.normalizeData = null;
				this.dataForPaths = new Map();

				return newData;
			},
			getData: this.getData,
		};
	}
	/* eslint-enable react/sort-comp */

	/* eslint-disable no-unused-vars */
	beforeInit(props: Object) {
		return props;
	}
	/* eslint-enable no-unused-vars */

	/* eslint-disable no-unused-vars */
	afterInit(props: Object) {
		return;
	}
	/* eslint-enable no-unused-vars */

	@autobind
	getDataIn(store?: Object|Array<*>|Store|Fragment) {
		return (
			path?: GetPath,
			specific: boolean,
			onDataNotFound?: Function,
			onDataNotFoundOne: Function
		) => {
			let localData = this.data;
			let ondf = typeof this.onDataNotFound === 'function'
				? this.onDataNotFound.bind(this)
				: undefined;
			const ondfo = typeof this.onDataNotFoundOne === 'function'
				? this.onDataNotFoundOne.bind(this)
				: onDataNotFoundOne;
			if (!ondf && onDataNotFound) {
				ondf = onDataNotFound;
			}
			if (store) {
				if (store instanceof Fragment || store instanceof Store) {
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
				const res = getPathParse(path, value, ondf, ondfo);
				value = res.value;
				const nfPath = res.notFoundPath;

				if (typeof value !== 'object') {
					if (
						(this.onDataNotFoundOne || onDataNotFoundOne)
						&& (value === undefined || value === null)
					) {
						let v;
						if (this.onDataNotFoundOne) {
							v = this.onDataNotFoundOne(path);
						}
						if ((v === undefined || v === null) && onDataNotFoundOne) {
							v = onDataNotFoundOne(path);
						}
						if (v !== undefined && v !== null) {
							return v;
						}
					}
					if ((value === undefined || value === null)
						&& !this.dataNotFoundPaths.find(v => isEqual(v, path))) {
						this.dataNotFoundPaths.push(path);
						let nfValue;
						if (typeof this.onDataNotFound === 'function') {
							nfValue = this.onDataNotFound(path);
						}
						if (typeof onDataNotFound === 'function') {
							nfValue = onDataNotFound(path);
						}
						if (nfValue) {
							return nfValue;
						}
					}
					return value;
				}
				if (Iterable.isIterable(value)) {
					if (nfPath && !this.dataNotFoundPaths.find(v => isEqual(v, nfPath))) {
						this.dataNotFoundPaths.push(nfPath);
						let nfValue;
						if (typeof this.onDataNotFound === 'function') {
							nfValue = this.onDataNotFound(nfPath);
						}
						if (typeof onDataNotFound === 'function') {
							nfValue = onDataNotFound(nfPath);
						}
						if (nfValue && value) {
							value = mergeDeepWith(value, (prev, next, key, localPath) => {
								if (next && next instanceof Fragment) {
									/*
									надо будет разобраться с тем, что в некоторых случаях _getData еще нет и сделать,
									чтобы это точно работало правильно.
									*/
									let result;
									if (next._getData && typeof next._getData === 'function') {
										result = next._getData(undefined, next.getDataIn(), specific, ondf);
										next.getCounter();
									} else {
										next.beforeGet();
										result = next.getData(undefined, next.getDataIn(), specific, ondf);
										next.getCounter();
										next.afterGet(result, undefined, specific);
									}
									return result;
								}
								if (
									(this.onDataNotFoundOne || onDataNotFoundOne)
									&& (next === undefined || next === null)
									&& (prev === undefined || prev === null)
								) {
									let v;
									if (this.onDataNotFoundOne) {
										v = this.onDataNotFoundOne(localPath.concat(key).join('.'));
									}
									if ((v === undefined || v === null) && onDataNotFoundOne) {
										v = onDataNotFoundOne(localPath.concat(key).join('.'));
									}
									if (v !== undefined && v !== null) {
										return v;
									}
								}
								if (next !== undefined && next !== null) {
									return next;
								}
								return prev;
							}, nfValue);
						}
					}
					if (value && Iterable.isIterable(value)) {
						value = value.toJS();
					}
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
					result = value._getData(undefined, value.getDataIn(), undefined, ondf);
					value.getCounter();
				} else {
					value.beforeGet();
					result = value.getData(undefined, value.getDataIn(), undefined, ondf);
					value.getCounter();
					value.afterGet(result);
				}
				if (
					(this.onDataNotFoundOne || onDataNotFoundOne)
					&& (result === undefined || result === null)
				) {
					let v;
					if (this.onDataNotFoundOne) {
						v = this.onDataNotFoundOne(path);
					}
					if ((v === undefined || v === null) && onDataNotFoundOne) {
						v = onDataNotFoundOne(path);
					}
					if (v !== undefined && v !== null) {
						return v;
					}
				}
				return result;
			}

			if (value && value.mergeDeepWith && typeof value.mergeDeepWith === 'function') {
				value = mergeDeepWith(value, (v, v2, key, localPath) => {
					if (v && v instanceof Fragment) {
						/*
						надо будет разобраться с тем, что в некоторых случаях _getData еще нет и сделать,
						чтобы это точно работало правильно.
						*/
						let result;
						if (v._getData && typeof v._getData === 'function') {
							result = v._getData(undefined, v.getDataIn(), specific, ondf);
							v.getCounter();
						} else {
							v.beforeGet();
							result = v.getData(undefined, v.getDataIn(), specific, ondf);
							v.getCounter();
							v.afterGet(result, undefined, specific);
						}
						if (
							(this.onDataNotFoundOne || onDataNotFoundOne)
							&& (result === undefined || result === null)
						) {
							let v;
							if (this.onDataNotFoundOne) {
								v = this.onDataNotFoundOne(localPath.concat(key).join('.'));
							}
							if ((v === undefined || v === null) && onDataNotFoundOne) {
								v = onDataNotFoundOne(localPath.concat(key).join('.'));
							}
							if (v !== undefined && v !== null) {
								return v;
							}
						}
						return result;
					}
					return v;
				}, value);

				value = value.toJS();
			}

			if (
				(this.onDataNotFoundOne || onDataNotFoundOne)
				&& (value === undefined || value === null)
			) {
				let v;
				if (this.onDataNotFoundOne) {
					v = this.onDataNotFoundOne(path);
				}
				if ((v === undefined || v === null) && onDataNotFoundOne) {
					v = onDataNotFoundOne(path);
				}
				if (v !== undefined && v !== null) {
					return v;
				}
			}

			return value;
		};
	}

	beforeGet(path?: GetPath) {
		return path;
	}

	@autobind
	getData(
		path?: GetPath,
		getRealData?: Function,
		specific: boolean,
		onDataNotFound?: Function,
		onDataNotFoundOne: Function
	) {
		return this.getDataIn()(this.beforeGet(path), specific, onDataNotFound, onDataNotFoundOne);
	}

	/* eslint-disable no-unused-vars */
	afterGet(result: Object|Array<*>, path: GetPath, specific: boolean) {
		return;
	}
	/* eslint-enable no-unused-vars */

	getCounter(isSpecific?: boolean) {
		this.getCount++;
		if (isSpecific) {
			this.specificGetCount++;
		}
	}

	/* eslint-disable no-unused-vars */
	beforeSet(
		value: Object|Array<*>,
		data?: Object,
		options?: any,
		info?: Object
	) {
		return value;
	}
	/* eslint-enable no-unused-vars */

	_mergeValue(
		data: IMap<*, *>|List<*>|Object,
		value: IMap<*, *>|List<*>,
		path: ?Array<string|number>,
		options?: any,
		info?: Object,
		notInitCb?: Function,
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
						let newCb;
						if (notInitCb) {
							newCb = (fr) => {
								nif = nif.concat(fr);
							};
						}
						result = prev._setData(
							localNext.toJS(),
							myPath,
							options,
							info,
							newCb
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
	_mergeData(
		value: Object|Array<*>,
		path: ?Array<string|number>,
		options?: any,
		info?: Object,
		notInitCb?: Function
	): OrderedMap<*, *>|List<*>|IMap<*, *> {
		const localValue = fromJS(value, (key, v) => {
			const isIndexed = Iterable.isIndexed(v);
			return isIndexed ? v.toList() : v.toOrderedMap();
		});

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
			path.forEach((key, i) => {
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
					if (options && (options === 'remove' || options.method === 'remove')) {
						localData = this.data.setIn(
							keys.slice(-1),
							this.data.getIn(keys.slice(-1)).delete(value)
						);
					} else {
						const result = this._mergeValue(
							immMap[0][0],
							localValue,
							index > 0 ? path.slice(index - 1) : path.slice(1),
							options,
							info,
							notInitCb,
							notInitFragms
						);
						localData = this.data.setIn(keys, result.data);
						notInitFragms = notInitFragms.concat(result.notInitFragms);
					}
				} else if (immMap[0][0] instanceof Fragment) {
					const newPath = index > 0 ? path.slice(index - 1) : path.slice(1);
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
						notInitFragms.push([value, this.path.concat(keys)]);
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
					localValue,
					path,
					options,
					info,
					notInitCb,
					notInitFragms
				);
				localData = result.data;
				notInitFragms = notInitFragms.concat(result.notInitFragms);
			} else {
				if (value instanceof Fragment) {
					notInitFragms.push([value, this.path]);
				}
				localData = value;
			}
		} else {
			const result = this._mergeValue(
				this.data,
				localValue,
				path,
				options,
				info,
				notInitCb,
				notInitFragms
			);
			localData = result.data;
			notInitFragms = notInitFragms.concat(result.notInitFragms);
		}

		if (notInitCb) {
			notInitCb(notInitFragms);
		}

		if (localData instanceof Fragment
			|| List.isList(localData)
			|| OrderedMap.isOrderedMap(localData)) {
			return localData;
		}

		if (Iterable.isIndexed(localData)) {
			return localData.toList();
		}
		return localData.toOrderedMap();
	}

	@autobind
	dispatchFragment(path: Array < string | number >, setStore: Function, getStore: Function) {
		if (!this.initialize) {
			this.initialize = true;
			this.path = path;

			this.getStore = getStore;

			this._afterGet = this.afterGet;

			this.afterGet = (value, getPath, specific) => {
				this._afterGet(value, getPath, specific, setStore);
			};

			this.userGetData = this.getData;

			this._getData = (getPath, getRealData, specific, onDataNotFound, onDataNotFoundOne) => {
				let result;
				if (!getPath) {
					if (this.emptyPath === false) {
						this.emptyPath = this.beforeGet(getPath);
					}
					if (this.normalizeData) {
						result = this.normalizeData;
					} else {
						result = this.userGetData(
							this.emptyPath,
							getRealData,
							specific,
							onDataNotFound,
							onDataNotFoundOne
						);
					}
					this.afterGet(result, this.emptyPath, specific);
					return result;
				}
				const newPath = this.beforeGet(getPath);
				if (!newPath) {
					if (this.normalizeData) {
						result = this.normalizeData;
					} else {
						result = this.userGetData(
							this.emptyPath,
							getRealData,
							specific,
							onDataNotFound,
							onDataNotFoundOne
						);
					}
				} else if (this.dataForPaths.has(newPath)) {
					result = this.dataForPaths.get(newPath);
				} else {
					result = this.userGetData(
						newPath,
						getRealData,
						specific,
						onDataNotFound,
						onDataNotFoundOne
					);
					this.dataForPaths.set(newPath, result);
				}
				this.afterGet(result, newPath, specific);
				return result;
			};
			
			this.getData = (getPath) => {
				const result = this._getData(
					getPath,
					this.getDataIn(),
					undefined,
					this.onDataNotFound,
					this.onDataNotFoundOne
				);
				this.getCounter();
				return result;
			};

			this.original.getData = this.getData;

			this.mergeData = (value, localPath, options, info) => {
				const res = this._mergeData(value, localPath, options, info);
				if (Iterable.isIterable(res)) {
					return res.toJS();
				}
				return res;
			};

			this.userSetData = this.setData;

			this.setData = (value, localPath, options, info) => {
				const fullPath = localPath ? path.concat(localPath) : path;
				return setStore(value, fullPath, options, { ...info, fragment: this });
			};

			this._afterSet = this.afterSet;

			this.afterSet = (value, prevData, newData, _, options, info) => {
				setTimeout(() => {
					this._afterSet(value, prevData, newData, setStore, options, info);
				}, 0);
			};

			if (this.onDataNotFound) {
				this.useronDataNotFound = this.onDataNotFound;
				this.onDataNotFound = (...args) => {
					this.dataNotFoundPaths = [];
					return this.useronDataNotFound(...args);
				};
			}

			this.afterInit(this.props);
		}
	}

	@autobind
	_setData(
		value: Object|Array<*>,
		path?: Array<string|number>,
		options?: any,
		info?: Object,
		notInitCb: Function
	): Fragment {
		const prevData = this.getData();

		const myValue = this.beforeSet(
			value,
			prevData,
			options,
			info
		);

		let newData;
		if (this.userSetData) {
			newData = fromJS(this.userSetData(myValue, path, options, info),
			(key, v) => {
				const isIndexed = Iterable.isIndexed(v);
				return isIndexed ? v.toList() : v.toOrderedMap();
			});

			const notInitFragms = [];
			forEachDeep(newData, (f, k) => {
				if (!f.initialize) {
					notInitFragms.push([f, k]);
				}
			});
			notInitCb(notInitFragms);
		} else {
			newData = this._mergeData(myValue, path, options, info, notInitCb);
		}

		this.data = newData;

		this.normalizeData = null;
		this.dataForPaths = new Map();

		this.afterSet(
			myValue,
			prevData,
			this.normalizeData,
			undefined,
			options,
			info
		);

		return this;
	}

	/* eslint-disable no-unused-vars */
	afterSet(
		value: Object|Array<*>,
		prevData?: Object,
		newData?: Object,
		setData?: Function,
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
