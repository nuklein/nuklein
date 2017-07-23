// @flow
import { Map as IMap } from 'immutable';
import Store from './store';

export function modificator(
	store: Store,
	func: Function,
	componentOrServer: Function|{
		name: string;
	}
) {
	return (...args: Array<any>) => {
		const info = {
			modificator: func,
		};
		if (typeof componentOrServer === 'function') {
			info.component = componentOrServer;
		}
		if (componentOrServer && componentOrServer.name) {
			info.server = componentOrServer;
		}
		const setStore = (value, path, options) => store.setStore(value, path, options, info);
		func(...args)(setStore, store.getStore);
	};
}

export function register(
	store: Store,
	modificators?: Function|Object,
	componentOrServer: Function|{
		name: string;
	}
) {
	const result = {};

	if (modificators) {
		if (typeof modificators === 'function') {
			result[modificators.name] = modificator(
				store,
				modificators,
				componentOrServer);
		} else if (typeof modificators === 'object') {
			IMap(modificators).forEach((v, key) => {
				result[key] = modificator(store, v, componentOrServer);
			});
		}
	}
	return result;
}
