/* @flow */
import Kefir from 'kefir';
import fetch from 'isomorphic-fetch';
import { Fragment } from '../index';
import type { GetPath } from '../types/GetPath';

export default (addr: string, options?: Object = {}) => (MyFragment: typeof Fragment) => {
	const {
		beforeGetData,
		afterGetData,
		ignoreModificators,
		onGetError,
		getErrorData,
		onSetError,
		setErrorData,
		onSet,
		setDebounce = 0,
		onlyServerModificators,
	} = options;


	return class HttpConnector extends Fragment {
		setStreamEmitter = null;

		stream = Kefir.stream((emitter) => {
			this.setStreamEmitter = emitter;
		})
		.debounce(setDebounce)
		.onValue((args) => {
			const { value, path, setDataOptions, info = {} } = args;
			const myInfo = {};
			let notEmpty = false;
			if (info.server) {
				notEmpty = true;
				myInfo.server = info.server;
			}
			if (info.component) {
				notEmpty = true;
				myInfo.component = info.component.name;
			}
			if (info.modificator) {
				notEmpty = true;
				myInfo.modificator = info.modificator.name;
			}
			if (info.fragment) {
				notEmpty = true;
				myInfo.fragment = info.fragment.constructor.name;
			}
			if (info.method) {
				notEmpty = true;
				myInfo.method = info.method.name;
			}
			fetch(addr, {
				method: 'POST',
				body: JSON.stringify({
					method: 'setStore',
					args: [value, path, setDataOptions, notEmpty ? myInfo : null],
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
		});

		init() {
			return new MyFragment();
		}

		getDataFromServer(path: GetPath) {
			if (beforeGetData !== undefined && beforeGetData !== null) {
				this.data.setData(beforeGetData, null, null, { method: this.onDataNotFoundAll });
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
				let data = res;
				if (afterGetData) {
					data = { ...res, ...afterGetData };
				}
				this.data.setData(data, null, { clearPaths: true }, { method: this.onDataNotFoundAll });
			})
			.catch(err => {
				if (!getErrorData && typeof onGetError !== 'function') {
					console.error(err);
				}
				if (getErrorData) {
					this.data.setData(getErrorData, null, null, { method: this.onDataNotFoundAll });
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
			if (setDataOptions && setDataOptions.clearPaths) {
				this.dataNotFoundPaths = [];
				this.data.dataNotFoundPaths = [];
			}
			if ((
				info
				&& info.fragment instanceof Fragment
				&& (info.fragment.constructor.name === this.constructor.name
					|| info.fragment.constructor.name === this.data.constructor.name)
				) || (
				ignoreModificators
				&& info
				&& info.modificator
				&& ignoreModificators.find((v) => v === info.modificator.name
				))) {
				return this.original.setData(value, path, setDataOptions, info);
			}
			if (this.setStreamEmitter) {
				this.setStreamEmitter.emit({value, path, setDataOptions, info});
			}
			if (info
				&& info.modificator
				&& onlyServerModificators
				&& onlyServerModificators.find((v) => v === info.modificator.name)) {
				return this.data;
			}
			return this.original.setData(value, path, setDataOptions, info);
		}

		onDataNotFoundAll(path: GetPath) {
			this.getDataFromServer(path);
		}
	};
};
