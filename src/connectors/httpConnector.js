/* @flow */
import Kefir from 'kefir';
import type { Emitter } from 'kefir'; // eslint-disable-line
import fetch from 'isomorphic-fetch';
import { Fragment } from '../index';
import buildPathForStore from '../utils/buildPathForStore';
import type { GetPath } from '../types/GetPath';

export default (addr: string, options?: Object = {}) => (MyFragment: typeof Fragment) => {
	const {
		beforeGetData,
		afterGetData,
		onlyLocalModificators,
		onGetError,
		getErrorData,
		onSetError,
		setErrorData,
		onSet,
		debounceForSet,
		debounceForGet,
		onlyServerModificators,
	} = options;


	return class HttpConnector extends Fragment {
		debounceForSetStream: Kefir.Observable<*, *>;
		debounceForSetEmitter: Emitter<*, *>;
		debounceForSetStreams: Kefir.Observable<*, *> | { [key: string]: Kefir.Observable<*, *>; };
		debounceForSetEmitters: Emitter<*, *> | { [key: string]: Emitter<*, *>; };

		debounceForGetStreams: Kefir.Observable<*, *> | { [key: string]: Kefir.Observable<*, *>; };
		debounceForGetEmitters: Emitter<*, *> | { [key: string]: Emitter<*, *>; };

		constructor(...args: Array<Object>) {
			super(...args);

			this.debounceForSetStream = Kefir.stream(emitter => {
				this.debounceForSetEmitter = emitter;
			})
			.onValue(this.kefirOnValueForSet);

			if (debounceForSet) {
				if (typeof debounceForSet === 'number') {
					this.debounceForSetStreams = Kefir.stream(emitter => {
						this.debounceForSetEmitters = emitter;
					})
					.debounce(debounceForSet)
					.onValue(this.kefirOnValueForSet);
				} else if (typeof debounceForSet === 'object') {
					this.debounceForSetStreams = {};
					this.debounceForSetEmitters = {};

					Object.keys(debounceForSet).forEach(key => {
						this.debounceForSetStreams[key] = Kefir.stream(emitter => {
							this.debounceForSetEmitters[key] = emitter;
						})
						.debounce(debounceForSet[key])
						.onValue(this.kefirOnValueForSet);
					});
				}
			}

			if (debounceForGet) {
				if (typeof debounceForGet === 'number') {
					this.debounceForGetStreams = Kefir.stream(emitter => {
						this.debounceForGetEmitters = emitter;
					})
					.scan((acc, next) => {
						const newAcc = {
							...acc,
							path: buildPathForStore(next.path, acc.path),
						};
						return newAcc;
					})
					.debounce(debounceForGet)
					.onValue(this.getDataFromServer);
				} else if (typeof debounceForGet === 'object') {
					this.debounceForGetStreams = {};
					this.debounceForGetEmitters = {};

					Object.keys(debounceForGet).forEach(key => {
						let cachePath = null;

						this.debounceForGetStreams[key] = Kefir.stream(emitter => {
							this.debounceForGetEmitters[key] = emitter;
						})
						.scan((acc, next) => {
							if (!cachePath) {
								cachePath = buildPathForStore(next.path);
							} else {
								cachePath = buildPathForStore(next.path, acc.path);
							}
							const newAcc = {
								...acc,
								path: cachePath,
							};
							return newAcc;
						})
						.debounce(debounceForGet[key])
						.onValue((...localArgs) => {
							cachePath = null;
							this.getDataFromServer(...localArgs);
						});
					});
				}
			}
		}

		init() {
			return new MyFragment();
		}

		kefirOnValueForSet = (args: Object) => {
			const { value, path, setDataOptions, info = {} } = args;

			const localInfo = {};
			let notEmpty = false;
			if (info.server) {
				notEmpty = true;
				localInfo.server = info.server;
			}
			if (info.component) {
				notEmpty = true;
				localInfo.component = info.component.name;
			}
			if (info.modificator) {
				notEmpty = true;
				localInfo.modificator = info.modificator.name;
			}
			if (info.fragment) {
				notEmpty = true;
				localInfo.fragment = info.fragment.constructor.name;
			}
			if (info.method) {
				notEmpty = true;
				localInfo.method = info.method.name;
			}

			fetch(addr, {
				method: 'POST',
				body: JSON.stringify({
					method: 'setStore',
					args: [value, path, setDataOptions, notEmpty ? localInfo : null],
				}),
				headers: {
					'Content-Type': 'application/json',
				},
			})
			.then(res => res.json())
			.then(res => {
				if (typeof onSet === 'function') {
					onSet.bind(this.data)({ value, path, options: setDataOptions, info, resultat: res });
				}
			})
			.catch(err => {
				if (!setErrorData && typeof onSetError !== 'function') {
					console.error(err);
				}

				if (setErrorData) {
					this.data.setData(setErrorData, null, null, { method: this.setData });
				}

				if (typeof onSetError === 'function') {
					onSetError.bind(this.data)(err);
				}
			});
		}

		getDataFromServer(args: Object) {
			const { path, isStream } = args;

			if (this.dataNotFoundPaths.length || this.data.dataNotFoundPaths.length) {
				if (beforeGetData !== undefined && beforeGetData !== null) {
					this.data.setData(beforeGetData, null, null, { method: this.onDataNotFound });
				}

				let pathForServer = path;
				if (!isStream) {
					pathForServer = buildPathForStore(path);
				}

				fetch(addr, {
					method: 'POST',
					body: JSON.stringify({
						method: 'getStore',
						args: [
							pathForServer,
						],
					}),
					headers: {
						'Content-Type': 'application/json',
					},
				})
				.then(res => res.json())
				.then(res => {
					let data = res;

					if (afterGetData) {
						data = { ...data, ...afterGetData };
					}

					this.data.setData(data, null, null, { method: this.onDataNotFound })
						.then(() => {
							this.data.setData(null, null, { clearPaths: true }, { method: this.onDataNotFound });
						});
				})
				.catch(err => {
					if (!getErrorData && typeof onGetError !== 'function') {
						console.error(err);
					}

					if (getErrorData) {
						this.data.setData(getErrorData, null, null, { method: this.onDataNotFound });
					}

					if (typeof onGetError === 'function') {
						onGetError.bind(this.data)(err);
					}
				});
			}
		}

		afterInit() {
			this.data.getDataFromServer = this.getDataFromServer.bind(this);
		}

		setData(
			value: Object|Array<*>,
			path?: Array<string|number>,
			setDataOptions?: any,
			info?: Object
		) {
			let clearPaths;
			if (setDataOptions) {
				clearPaths = setDataOptions.clearPaths;
			}

			if (clearPaths) {
				this.dataNotFoundPaths = [];
				this.data.dataNotFoundPaths = [];
			}

			const fragmentName = this.constructor.name;
			const innerFragmentName = this.data.constructor.name;

			let callingFragment;
			let callingModificator;
			if (info) {
				callingFragment = info.fragment;
				callingModificator = info.modificator;
			}

			let callingFragmentName;
			if (callingFragment instanceof Fragment) {
				callingFragmentName = callingFragment.constructor.name;
			}

			const isCallOfThis = callingFragmentName === fragmentName
				|| callingFragmentName === innerFragmentName;

			let callingModificatorName;
			if (callingModificator) {
				callingModificatorName = callingModificator.name;
			}

			let isIgnore = false;
			if (onlyLocalModificators && callingModificatorName) {
				isIgnore = onlyLocalModificators.find((v) => v === callingModificatorName);
			}

			if (isCallOfThis || isIgnore) {
				return this.original.setData(value, path, setDataOptions, info);
			}

			if (debounceForSet) {
				if (this.debounceForSetEmitters) {
					if (typeof debounceForSet === 'number') {
						this.debounceForSetEmitters.emit({value, path, setDataOptions, info});
					} else if (typeof debounceForSet === 'object') {
						if (callingModificatorName && debounceForSet[callingModificatorName]) {
							this.debounceForSetEmitters[callingModificatorName].emit({
								value,
								path,
								setDataOptions,
								info,
							});
						} else if (this.debounceForSetEmitter) {
							this.debounceForSetEmitter.emit({value, path, setDataOptions, info});
						}
					}
				}
			} else if (this.debounceForSetEmitter) {
				this.debounceForSetEmitter.emit({value, path, setDataOptions, info});
			}

			let isOnlyServer = false;
			if (callingModificatorName && onlyServerModificators) {
				isOnlyServer = onlyServerModificators.find((v) => v === callingModificatorName);
			}

			if (isOnlyServer) {
				return this.data;
			}

			return this.original.setData(value, path, setDataOptions, info);
		}

		onDataNotFound(path: GetPath, info?: Object) {
			if (debounceForGet) {
				if (this.debounceForGetEmitters) {
					if (typeof debounceForGet === 'number') {
						this.debounceForGetEmitters.emit({path, isStream: true});
					} else if (typeof debounceForGet === 'object') {
						let callingComponentName;
						if (info && info.component) {
							callingComponentName = info.component.name;
						}

						if (callingComponentName && debounceForGet[callingComponentName]) {
							this.debounceForGetEmitters[callingComponentName].emit({path, isStream: true});
						} else {
							this.getDataFromServer({path});
						}
					}
				}
			} else {
				this.getDataFromServer({path});
			}
		}
	};
};
