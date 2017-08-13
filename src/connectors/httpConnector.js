/* @flow */
import Kefir from 'kefir';
import type { Emitter } from 'kefir'; // eslint-disable-line
import fetch from 'isomorphic-fetch';
import { Fragment } from '../index';
import mergeDataToPath from '../utils/mergeDataToPath';
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
		onlyServerModificators,
	} = options;


	return class HttpConnector extends Fragment {
		stream: Kefir.Observable<*, *>;
		setStreamEmitter: Emitter<*, *>;
		debounceStreams: Kefir.Observable<*, *> | { [key: string]: Kefir.Observable<*, *>; };
		debounceEmitters: Emitter<*, *> | { [key: string]: Emitter<*, *>; };

		constructor(...args: Array<Object>) {
			super(...args);

			this.stream = Kefir.stream(emitter => {
				this.setStreamEmitter = emitter;
			})
			.onValue(this.kefirOnValue);

			if (debounceForSet) {
				if (typeof debounceForSet === 'number') {
					this.debounceStreams = Kefir.stream(emitter => {
						this.debounceEmitters = emitter;
					})
					.debounce(debounceForSet)
					.onValue(this.kefirOnValue);
				} else if (typeof debounceForSet === 'object') {
					this.debounceStreams = {};
					this.debounceEmitters = {};

					Object.keys(debounceForSet).forEach(key => {
						this.debounceStreams[key] = Kefir.stream(emitter => {
							this.debounceEmitters[key] = emitter;
						})
						.debounce(debounceForSet[key])
						.onValue(this.kefirOnValue);
					});
				}
			}
		}

		init() {
			return new MyFragment();
		}

		kefirOnValue = (args: Object) => {
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

		getDataFromServer(path: GetPath) {
			if (beforeGetData !== undefined && beforeGetData !== null) {
				this.data.setData(beforeGetData, null, null, { method: this.onDataNotFound });
			}

			fetch(addr, {
				method: 'POST',
				body: JSON.stringify({
					method: 'getStore',
					args: [
						path,
					],
				}),
				headers: {
					'Content-Type': 'application/json',
				},
			})
			.then(res => res.json())
			.then(res => {
				let data = mergeDataToPath(res, path);

				if (afterGetData) {
					data = { ...data, ...afterGetData };
				}

				this.data.setData(data, null, { clearPaths: true }, { method: this.onDataNotFound });
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
				if (this.debounceEmitters) {
					if (typeof debounceForSet === 'number') {
						this.debounceEmitters.emit({value, path, setDataOptions, info});
					} else if (typeof debounceForSet === 'object') {
						if (callingModificatorName && debounceForSet[callingModificatorName]) {
							this.debounceEmitters[callingModificatorName].emit({
								value,
								path,
								setDataOptions,
								info,
							});
						} else if (this.setStreamEmitter) {
							this.setStreamEmitter.emit({value, path, setDataOptions, info});
						}
					}
				}
			} else if (this.setStreamEmitter) {
				this.setStreamEmitter.emit({value, path, setDataOptions, info});
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

		onDataNotFound(path: GetPath) {
			this.getDataFromServer(path);
		}
	};
};
